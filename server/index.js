// server/index.js (replace your current file with this)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdf = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const { createEmbedding, cosineSimilarity, embedText } = require('./embeddings');

const app = express();
app.use(express.json());
app.use(cors()); // allow frontend -> backend requests

const upload = multer({ dest: 'uploads/', limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

// In-memory store: [{ id, text, embedding, page }]
const CHUNKS = [];

/**
 * Helper: chunk and merge very small chunks to reduce embedding calls
 */
function chunkAndMerge(text) {
  if (!text) return [];
  let rawChunks = text.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);

  // merge tiny chunks into previous chunk to reduce calls
  const MIN_CHARS = 200;
  const merged = [];
  for (let i = 0; i < rawChunks.length; i++) {
    const cur = rawChunks[i];
    if (!cur) continue;
    if (cur.length < MIN_CHARS && merged.length > 0) {
      merged[merged.length - 1] += '\n\n' + cur;
    } else {
      merged.push(cur);
    }
  }
  return merged;
}

/**
 * Upload route: respond immediately, then process embeddings in background.
 */
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file' });

    console.log('UPLOAD RECEIVED:', req.file.originalname, 'at', new Date().toISOString());

    // Read PDF and chunk it (synchronous small work)
    const dataBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdf(dataBuffer);
    const fullText = pdfData.text || '';

    const rawChunks = chunkAndMerge(fullText);
    console.log(`File read. approx ${rawChunks.length} chunks after merge`);

    // Respond immediately so frontend is not blocked
    res.json({ message: 'File received — processing started', estimated_chunks: rawChunks.length });

    // Background processing (async, not awaited)
    (async () => {
      try {
        const promises = rawChunks.map(async (c, i) => {
          try {
            console.log(`Embedding chunk ${i + 1}/${rawChunks.length} (chars: ${c.length})`);
            const emb = await embedText(c);
            if (!emb) {
              console.warn(`Embedding returned null for chunk ${i + 1}; skipping chunk.`);
              return null;
            }
            return { id: `${req.file.filename}-${i}`, text: c, embedding: emb, page: i + 1 };
          } catch (innerErr) {
            console.error('Embedding failed for chunk', i, innerErr && innerErr.message);
            return null;
          }
        });

        const created = await Promise.all(promises);
        const createdFiltered = (created || []).filter(Boolean);

        if (createdFiltered.length > 0) {
          createdFiltered.forEach(c => CHUNKS.push(c));
          console.log(`Processed upload ${req.file.filename} — ${createdFiltered.length} chunks added to store. Total chunks: ${CHUNKS.length}`);
        } else {
          console.warn(`Processed upload ${req.file.filename} — no chunks were embedded successfully.`);
        }

        // cleanup uploaded file (best-effort)
        try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore */ }
      } catch (bgErr) {
        console.error('Background processing error:', bgErr);
        try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore */ }
      }
    })();

  } catch (err) {
    console.error('Upload route top-level error:', err);
    if (!res.headersSent) return res.status(500).json({ error: String(err) });
  }
});

/**
 * Ask route: uses embeddings in memory to answer queries
 */
app.post('/ask', async (req, res) => {
  try {
    const question = req.body.question;
    if (!question) return res.status(400).json({ error: 'No question' });

    // embed question
    const qEmb = await createEmbedding(question);
    if (!qEmb) return res.status(500).json({ error: 'Failed to create question embedding' });

    // compute similarities
    const sims = CHUNKS.map(c => {
      return { ...c, score: cosineSimilarity(qEmb, c.embedding) };
    }).sort((a, b) => b.score - a.score);

    const TOP_K = parseInt(process.env.TOP_K || '4');
    const top = sims.slice(0, TOP_K);

    // build context
    const contextText = top.map(t => `Page:${t.page}\n${t.text}`).join('\n---\n');

    // call LLM via REST (Chat Completions)
    const key = process.env.OPENAI_API_KEY;
    if (!key) return res.status(500).json({ error: 'OPENAI_API_KEY not set for completions' });

    const prompt = `You are an assistant. Use the CONTEXT to answer the QUESTION. If the answer is not contained in the CONTEXT, say 'I couldn't find that in the document.'\n\nCONTEXT:\n${contextText}\n\nQUESTION:\n${question}`;

    const completionResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.2
      })
    });

    const completionJson = await completionResp.json().catch(() => null);

    let answer = '';
    if (completionJson && completionJson.choices && completionJson.choices.length > 0) {
      answer = completionJson.choices[0].message ? completionJson.choices[0].message.content : (completionJson.choices[0].text || '');
    } else {
      console.warn('LLM returned no choices or non-JSON response', completionJson);
      answer = "Sorry, no response from LLM.";
    }

    return res.json({ answer, sources: top.map(t => ({ page: t.page, score: t.score })) });
  } catch (err) {
    console.error('Ask route error:', err);
    return res.status(500).json({ error: String(err) });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok', chunks: CHUNKS.length }));

const PORT = process.env.PORT || 5174;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));

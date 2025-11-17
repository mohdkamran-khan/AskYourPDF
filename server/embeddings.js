// server/embeddings.js (DEMO MODE - mocked embeddings)
// This returns deterministic pseudo-embeddings so the app works without OpenAI.

function pseudoEmbedding(text, dim = 512) {
  // deterministic pseudo-random vector based on text
  const seed = text.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const vec = new Array(dim);
  for (let i = 0; i < dim; i++) {
    vec[i] = ((seed + i * 131) % 1000) / 1000; // values 0..0.999
  }
  return vec;
}

async function createEmbedding(text) {
  if (!text) return null;
  return pseudoEmbedding(text);
}

async function embedText(text) {
  return await createEmbedding(text);
}

function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function norm(a) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * a[i];
  return Math.sqrt(s);
}

function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return -1;
  return dot(a, b) / (norm(a) * norm(b) + 1e-10);
}

module.exports = { createEmbedding, embedText, cosineSimilarity };

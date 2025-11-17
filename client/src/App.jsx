import React, { useState, useRef } from "react";

function Spinner({ size = 20 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      border: `${Math.max(2, Math.floor(size/6))}px solid rgba(0,0,0,0.12)`,
      borderTopColor: "#2563eb",
      animation: "spin 0.9s linear infinite"
    }} />
  );
}

export default function App() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [loadingAsk, setLoadingAsk] = useState(false);
  const [sources, setSources] = useState([]);
  const inputRef = useRef();

  // small helpers to handle both server response shapes
  function parseUploadResponse(j) {
    const chunks = j.chunks ?? j.estimated_chunks ?? 0;
    const message = j.message ?? (chunks ? `Uploaded — ${chunks} chunks stored` : "Uploaded");
    return { message, chunks };
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return alert("Please choose a PDF file to upload.");
    setStatus("");
    setAnswer(null);
    setSources([]);
    setLoadingUpload(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("http://localhost:5174/upload", { method: "POST", body: fd });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        const { message } = parseUploadResponse(j);
        setStatus(message);
      } else {
        setStatus("Upload failed: " + (j.error || res.statusText || "unknown error"));
      }
    } catch (err) {
      setStatus("Upload error: " + (err.message || err));
    } finally {
      setLoadingUpload(false);
    }
  }

  async function handleAsk(e) {
    e.preventDefault();
    if (!question) return;
    setAnswer(null);
    setSources([]);
    setLoadingAsk(true);
    try {
      const res = await fetch("http://localhost:5174/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question })
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setAnswer(j.answer || "No answer returned.");
        setSources(j.sources || []);
      } else {
        setAnswer("Error: " + (j.error || res.statusText));
      }
    } catch (err) {
      setAnswer("Request failed: " + (err.message || err));
    } finally {
      setLoadingAsk(false);
    }
  }

  function onFileSelect(f) {
    if (!f) return;
    if (f && f.type !== "application/pdf") {
      alert("Please upload a PDF file.");
      return;
    }
    setFile(f);
    setStatus("");
    setAnswer(null);
    setSources([]);
  }

  function handleDrop(e) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    onFileSelect(f);
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  const suggestions = [
    "Summarize the document in 2 sentences",
    "What is the main finding?",
    "List the key dates or events mentioned",
    "Find the definition of 'X' in the document"
  ];

  return (
    <div style={styles.page}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <header style={styles.header}>
        <div style={styles.brand}>
          <div style={styles.logo}>📄</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22 }}>AskYourPDF</h1>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>Upload · Query · Get answers</div>
          </div>
        </div>
        <div style={{ fontSize: 13, color: "#64748b" }}>Built by Kamran • 5-Day AI Agents Intensive</div>
      </header>

      <main style={styles.container}>
        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Upload a PDF</h2>

          <div
            style={styles.dropzone}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              style={{ display: "none" }}
              onChange={(e) => onFileSelect(e.target.files?.[0])}
            />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40 }}>📤</div>
              <div style={{ marginTop: 8, fontWeight: 600 }}>{file ? file.name : "Drag & drop a PDF here or click to select"}</div>
              <div style={{ marginTop: 6, color: "#94a3b8", fontSize: 13 }}>Max 10MB</div>
            </div>
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={handleUpload} style={styles.primaryBtn} disabled={!file || loadingUpload}>
              {loadingUpload ? (<><Spinner size={16} />&nbsp;Uploading</>) : "Upload & Process"}
            </button>

            <button onClick={() => { setFile(null); setStatus(""); setAnswer(null); setSources([]); }} style={styles.ghostBtn}>
              Clear
            </button>

            <div style={{ marginLeft: "auto", color: "#475569", fontSize: 13 }}>
              {loadingUpload && <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}><Spinner size={14} />Processing...</span>}
              {!loadingUpload && status && <span>✅ {status}</span>}
            </div>
          </div>
        </section>

        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Ask a question</h2>

          <form onSubmit={handleAsk} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type a question about the uploaded PDF (or click a suggestion)"
              style={styles.input}
            />
            <button type="submit" style={styles.primaryBtn} disabled={loadingAsk || !question}>
              {loadingAsk ? (<><Spinner size={14} />&nbsp;Thinking...</>) : "Ask"}
            </button>
            <button type="button" style={styles.ghostBtn} onClick={() => setQuestion("")}>Clear</button>
          </form>

          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => setQuestion(s)}
                style={styles.suggestion}
              >
                {s}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, color: "#64748b" }}>Answer</div>
            <div style={styles.answerBox}>
              {answer ? (
                <>
                  <div style={{ whiteSpace: "pre-wrap" }}>{answer}</div>
                  <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {Array.isArray(sources) && sources.length > 0 ? sources.map((s, i) => (
                      <span key={i} style={styles.sourceChip}>Page {s.page} • {Math.round(s.score * 100) / 100}</span>
                    )) : <span style={{ color: "#94a3b8" }}>No sources available</span>}
                  </div>
                </>
              ) : (
                <div style={{ color: "#94a3b8" }}>{loadingAsk ? "Waiting for the model..." : "No answer yet. Ask a question after uploading a document."}</div>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer style={styles.footer}>
        <div>AskYourPDF • Minimal capstone — demo only</div>
      </footer>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg,#f8fafc 0%, #fff 60%)",
    color: "#0f172a",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "5px 32px",
    borderBottom: "1px solid rgba(15,23,42,0.04)",
  },
  brand: { display: "flex", gap: 12, alignItems: "center" },
  logo: {
    width: 46, height: 46, borderRadius: 10, background: "#eff6ff",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22
  },
  container: {
    maxWidth: 980,
    margin: "20px auto",
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 16,
    padding: "0 18px 0px",
  },
  card: {
    background: "#fff",
    borderRadius: 12,
    padding: 15,
    boxShadow: "0 6px 20px rgba(2,6,23,0.06)",
    border: "1px solid rgba(2,6,23,0.03)"
  },
  cardTitle: { margin: 0, marginBottom: 12, fontSize: 16 },
  dropzone: {
    border: "2px dashed #e6eefc",
    borderRadius: 10,
    padding: 26,
    cursor: "pointer",
    minHeight: 90,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "box-shadow 0.15s ease-in-out"
  },
  primaryBtn: {
    background: "#2563eb", color: "white", border: "none", padding: "8px 14px",
    borderRadius: 8, fontWeight: 600, cursor: "pointer"
  },
  ghostBtn: {
    background: "transparent", color: "#334155", border: "1px solid rgba(51,65,85,0.08)",
    padding: "8px 12px", borderRadius: 8, cursor: "pointer"
  },
  input: {
    flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #e6eefc", minWidth: 220
  },
  suggestion: {
    border: "1px solid #e6eefc", background: "#f8fafc", padding: "6px 10px",
    borderRadius: 8, fontSize: 13, cursor: "pointer"
  },
  answerBox: {
    marginTop: 8,
    minHeight: 60,
    borderRadius: 8,
    padding: 12,
    background: "#0f172a05",
    border: "1px solid rgba(15,23,42,0.04)"
  },
  sourceChip: {
    background: "#eef2ff",
    color: "#3730a3",
    padding: "6px 8px",
    borderRadius: 999,
    fontSize: 12
  },
  footer: {
    marginTop: "auto",
    padding: "18px 32px",
    borderTop: "1px solid rgba(15,23,42,0.04)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#475569",
    fontSize: 13
  }
};

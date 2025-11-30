"use client";
import React, { useState } from "react";

/**
 * pages/index.js
 * Paste this full file over the existing pages/index.js in your repo.
 * This file is a client component (uses clipboard + hooks).
 */

function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false);
  async function doCopy() {
    try {
      await navigator.clipboard.writeText(text || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      try {
        // fallback prompt for manual copy
        // eslint-disable-next-line no-alert
        window.prompt("Copy the text below (Ctrl/Cmd+C then Enter):", text || "");
      } catch (_) {}
    }
  }
  return (
    <button
      onClick={doCopy}
      style={{
        padding: "6px 10px",
        background: copied ? "#16a34a" : "#0ea5e9",
        color: "white",
        border: "none",
        borderRadius: 6,
        cursor: "pointer",
        fontSize: 13,
      }}
      type="button"
    >
      {copied ? "Copied" : label}
    </button>
  );
}

export default function Home() {
  const [tab, setTab] = useState("caption");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState(null);

  const [productName, setProductName] = useState("");
  const [tone, setTone] = useState("friendly");
  const [site, setSite] = useState("");
  const [messageCtx, setMessageCtx] = useState("");

  async function callAI(action, payload = {}) {
    if (loading) return;
    setLoading(true);
    setOutput(null);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload }),
      });
      const data = await res.json();
      if (!res.ok) throw data;
      setOutput(data.result ?? data);
    } catch (err) {
      setOutput({ error: (err && err.error) || JSON.stringify(err) });
    } finally {
      setLoading(false);
    }
  }

  // helpers to render nicely
  function renderCaptions(captions) {
    if (!Array.isArray(captions)) return null;
    return (
      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h4 style={{ margin: 0 }}>Captions</h4>
          <CopyButton text={captions.join("\n")} label="Copy all captions" />
        </div>
        {captions.map((c, i) => (
          <div
            key={i}
            style={{
              padding: 12,
              background: "#fff",
              borderRadius: 8,
              boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ marginRight: 12 }}>{c}</div>
            <CopyButton text={c} label="Copy" />
          </div>
        ))}
      </div>
    );
  }

  function renderHashtags(tags) {
    if (!Array.isArray(tags)) return null;
    const joined = tags.join(" ");
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h4 style={{ margin: 0 }}>Hashtags</h4>
          <CopyButton text={joined} label="Copy hashtags" />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          {tags.map((t, i) => (
            <div key={i} style={{ padding: "6px 10px", background: "#f1f5f9", borderRadius: 20, fontSize: 13 }}>
              {t}
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderImagePrompt(prompt) {
    if (!prompt) return null;
    return (
      <div style={{ marginTop: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h4 style={{ margin: 0 }}>Image prompt</h4>
          <CopyButton text={prompt} label="Copy prompt" />
        </div>
        <textarea readOnly value={prompt} style={{ width: "100%", marginTop: 8, padding: 10, borderRadius: 8, background: "#fff", minHeight: 80 }} />
      </div>
    );
  }

  function renderRawJSON(obj) {
    const text = typeof obj === "string" ? obj : JSON.stringify(obj, null, 2);
    return (
      <div style={{ marginTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h4 style={{ margin: 0 }}>Full JSON</h4>
          <CopyButton text={text} label="Copy JSON" />
        </div>
        <pre style={{ whiteSpace: "pre-wrap", background: "#0f172a", color: "#e6eef8", padding: 12, borderRadius: 8, marginTop: 8 }}>{text}</pre>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "Inter, ui-sans-serif, system-ui", padding: 20, maxWidth: 1000, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0 }}>Apptivate AI</h1>
          <p style={{ margin: 0, color: "#64748b" }}>Marketing copy, captions & image prompts — fast</p>
        </div>
      </header>

      <main style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 20 }}>
        <section style={{ background: "#f8fafc", padding: 16, borderRadius: 12 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button
              onClick={() => setTab("caption")}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 8,
                background: tab === "caption" ? "#0ea5e9" : "#fff",
                color: tab === "caption" ? "#fff" : "#0f172a",
                border: "1px solid #e2e8f0",
              }}
              type="button"
            >
              Captions
            </button>
            <button
              onClick={() => setTab("post")}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 8,
                background: tab === "post" ? "#0ea5e9" : "#fff",
                color: tab === "post" ? "#fff" : "#0f172a",
                border: "1px solid #e2e8f0",
              }}
              type="button"
            >
              Post
            </button>
            <button
              onClick={() => setTab("audit")}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 8,
                background: tab === "audit" ? "#0ea5e9" : "#fff",
                color: tab === "audit" ? "#fff" : "#0f172a",
                border: "1px solid #e2e8f0",
              }}
              type="button"
            >
              Audit
            </button>
            <button
              onClick={() => setTab("message")}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 8,
                background: tab === "message" ? "#0ea5e9" : "#fff",
                color: tab === "message" ? "#fff" : "#0f172a",
                border: "1px solid #e2e8f0",
              }}
              type="button"
            >
              Message
            </button>
          </div>

          {tab === "caption" && (
            <div>
              <label style={{ fontWeight: 600 }}>Product or Topic</label>
              <input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g., Cold Brew Launch"
                style={{ width: "100%", padding: 10, borderRadius: 8, marginTop: 8, border: "1px solid #e2e8f0" }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <select value={tone} onChange={(e) => setTone(e.target.value)} style={{ flex: 1, padding: 10, borderRadius: 8 }}>
                  <option value="friendly">Friendly</option>
                  <option value="professional">Professional</option>
                  <option value="witty">Witty</option>
                </select>
                <button
                  onClick={() => callAI("caption", { productName, tone, count: 5 })}
                  disabled={loading}
                  style={{ padding: "10px 16px", borderRadius: 8, background: "#0ea5e9", color: "#fff", border: "none" }}
                  type="button"
                >
                  {loading ? "Generating..." : "Generate"}
                </button>
              </div>
            </div>
          )}

          {tab === "post" && (
            <div>
              <label style={{ fontWeight: 600 }}>Post topic</label>
              <input id="topic" placeholder="e.g., new store opening" style={{ width: "100%", padding: 10, borderRadius: 8, marginTop: 8, border: "1px solid #e2e8f0" }} />
              <div style={{ marginTop: 12 }}>
                <button
                  onClick={() => {
                    const topic = document.getElementById("topic").value;
                    callAI("post", { topic });
                  }}
                  style={{ padding: "10px 16px", borderRadius: 8, background: "#0ea5e9", color: "#fff", border: "none" }}
                  type="button"
                >
                  {loading ? "..." : "Create Post"}
                </button>
              </div>
            </div>
          )}

          {tab === "audit" && (
            <div>
              <label style={{ fontWeight: 600 }}>Website URL</label>
              <input
                value={site}
                onChange={(e) => setSite(e.target.value)}
                placeholder="https://example.com"
                style={{ width: "100%", padding: 10, borderRadius: 8, marginTop: 8, border: "1px solid #e2e8f0" }}
              />
              <div style={{ marginTop: 12 }}>
                <button onClick={() => callAI("audit", { website: site })} style={{ padding: "10px 16px", borderRadius: 8, background: "#0ea5e9", color: "#fff", border: "none" }} type="button">
                  {loading ? "..." : "Run Audit"}
                </button>
              </div>
            </div>
          )}

          {tab === "message" && (
            <div>
              <label style={{ fontWeight: 600 }}>Context / Prompt</label>
              <textarea
                value={messageCtx}
                onChange={(e) => setMessageCtx(e.target.value)}
                placeholder="Write a short promotional DM for our new product..."
                style={{ width: "100%", padding: 10, borderRadius: 8, marginTop: 8, border: "1px solid #e2e8f0", minHeight: 120 }}
              />
              <div style={{ marginTop: 12 }}>
                <button onClick={() => callAI("message", { context: messageCtx })} style={{ padding: "10px 16px", borderRadius: 8, background: "#0ea5e9", color: "#fff", border: "none" }} type="button">
                  {loading ? "..." : "Write Message"}
                </button>
              </div>
            </div>
          )}
        </section>

        <aside style={{ padding: 16 }}>
          <div style={{ background: "#fff", padding: 16, borderRadius: 12, boxShadow: "0 8px 30px rgba(2,6,23,0.08)" }}>
            <h3 style={{ marginTop: 0 }}>Output</h3>
            {!output && <div style={{ color: "#64748b" }}>No output yet — generate something to see results.</div>}
            {output && output.error && <div style={{ color: "#b91c1c" }}>Error: {output.error}</div>}

            {/* If output is an object with captions/hashtags/image_prompt */}
            {output && typeof output === "object" && !output.error && (
              <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
                {output.captions && renderCaptions(output.captions)}
                {output.hashtags && renderHashtags(output.hashtags)}
                {output.image_prompt && renderImagePrompt(output.image_prompt)}
                {renderRawJSON(output)}
              </div>
            )}

            {/* If output is a string, show it raw but with copy */}
            {output && typeof output === "string" && (
              <div style={{ marginTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h4 style={{ margin: 0 }}>AI Response</h4>
                  <CopyButton text={output} label="Copy response" />
                </div>
                <pre style={{ whiteSpace: "pre-wrap", background: "#f8fafc", padding: 12, borderRadius: 8, marginTop: 8 }}>{output}</pre>
              </div>
            )}

            {/* If result is nested in .result (api returns {result, raw}) */}
            {output && output.result && (
              <div style={{ marginTop: 12 }}>
                <h4 style={{ margin: 0 }}>Parsed result</h4>
                <div style={{ marginTop: 8 }}>
                  {typeof output.result === "object" ? (
                    <div>
                      {output.result.captions && renderCaptions(output.result.captions)}
                      {output.result.hashtags && renderHashtags(output.result.hashtags)}
                      {output.result.image_prompt && renderImagePrompt(output.result.image_prompt)}
                      {renderRawJSON(output.result)}
                    </div>
                  ) : (
                    <pre style={{ whiteSpace: "pre-wrap", background: "#f8fafc", padding: 12, borderRadius: 8 }}>{String(output.result)}</pre>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>
      </main>

      <footer style={{ marginTop: 20, textAlign: "center", color: "#94a3b8" }}>Made with ❤️ by Apptivate</footer>
    </div>
  );
}

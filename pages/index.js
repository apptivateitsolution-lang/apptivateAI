
import React, { useState } from "react";

export default function Home() {
  const [tab, setTab] = useState("caption");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState(null);

  const [productName, setProductName] = useState("");
  const [tone, setTone] = useState("friendly");
  const [site, setSite] = useState("");
  const [messageCtx, setMessageCtx] = useState("");

  async function callAI(action, payload = {}) {
    setLoading(true);
    setOutput(null);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload })
      });
      const data = await res.json();
      if (!res.ok) throw data;
      setOutput(data.result ?? data);
    } catch (err) {
      setOutput({ error: err?.error || JSON.stringify(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      <h1>Apptivate Unified AI</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button onClick={() => setTab("caption")}>Captions</button>
        <button onClick={() => setTab("post")}>Post</button>
        <button onClick={() => setTab("audit")}>Audit</button>
        <button onClick={() => setTab("message")}>Message</button>
      </div>

      {tab === "caption" && (
        <div>
          <h3>Generate Captions</h3>
          <input placeholder="Product name" value={productName} onChange={(e) => setProductName(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 8 }} />
          <select value={tone} onChange={(e) => setTone(e.target.value)}>
            <option value="friendly">Friendly</option>
            <option value="professional">Professional</option>
            <option value="funny">Funny</option>
          </select>
          <div style={{ marginTop: 12 }}>
            <button disabled={loading} onClick={() => callAI("caption", { productName, tone, count: 5 })}>{loading ? "Generating..." : "Generate Captions"}</button>
          </div>
        </div>
      )}

      {tab === "post" && (
        <div>
          <h3>Create Post</h3>
          <input placeholder="Topic (e.g., 'cold brew launch')" style={{ width: "100%", padding: 8, marginBottom: 8 }} id="topic" />
          <div style={{ marginTop: 12 }}>
            <button onClick={() => {
              const topic = document.getElementById("topic").value;
              callAI("post", { topic });
            }}>{loading ? "..." : "Create Post"}</button>
          </div>
        </div>
      )}

      {tab === "audit" && (
        <div>
          <h3>Quick Audit</h3>
          <input placeholder="Website (https://...)" value={site} onChange={(e)=>setSite(e.target.value)} style={{ width: "100%", padding: 8 }} />
          <div style={{ marginTop: 12 }}>
            <button onClick={() => callAI("audit", { website: site })}>{loading ? "..." : "Run Audit"}</button>
          </div>
        </div>
      )}

      {tab === "message" && (
        <div>
          <h3>Message Writer</h3>
          <textarea placeholder="Context or prompt" value={messageCtx} onChange={(e)=>setMessageCtx(e.target.value)} style={{ width: "100%", height: 120 }} />
          <div style={{ marginTop: 12 }}>
            <button onClick={() => callAI("message", { context: messageCtx })}>{loading ? "..." : "Write Message"}</button>
          </div>
        </div>
      )}

      <hr style={{ margin: "24px 0" }} />

      <h3>Output</h3>
      <pre style={{ whiteSpace: "pre-wrap", background: "#f6f6f6", padding: 12, minHeight: 120 }}>
        {output ? JSON.stringify(output, null, 2) : "No output yet"}
      </pre>
    </div>
  );
}

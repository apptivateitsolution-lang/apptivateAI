import React, { useState, useEffect } from "react";

// Apptivate AI Marketing - Personal Edition
// Full frontend UI

export default function Home() {
  // Company profile
  const [profile, setProfile] = useState(() => {
    return (
      JSON.parse(localStorage.getItem("apptivate_profile")) || {
        companyName: "Apptivate It Solution",
        services: "Website Development, SEO, Digital Marketing, IT Hardware",
        website: "",
        instagram: "",
        gmb: "",
        location: "Surat, Gujarat",
      }
    );
  });

  const [editingProfile, setEditingProfile] = useState(false);

  // App state
  const [tab, setTab] = useState("dashboard");
  const [chatInput, setChatInput] = useState("");
  const [chatLog, setChatLog] = useState(() =>
    JSON.parse(localStorage.getItem("apptivate_chatlog")) || []
  );

  const [postPlatform, setPostPlatform] = useState("Instagram");
  const [postService, setPostService] = useState("Website Development");
  const [postGoal, setPostGoal] = useState("Leads");
  const [postResult, setPostResult] = useState(null);

  const [auditUrl, setAuditUrl] = useState("");
  const [auditResult, setAuditResult] = useState(null);

  const [growthEntries, setGrowthEntries] = useState(() =>
    JSON.parse(localStorage.getItem("apptivate_growth")) || []
  );
  const [followers, setFollowers] = useState("");
  const [projects, setProjects] = useState("");

  const [ttsEnabled, setTtsEnabled] = useState(true);

  useEffect(() => {
    localStorage.setItem("apptivate_profile", JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem("apptivate_chatlog", JSON.stringify(chatLog));
  }, [chatLog]);

  useEffect(() => {
    localStorage.setItem("apptivate_growth", JSON.stringify(growthEntries));
  }, [growthEntries]);

  // Mock AI API (change later to real API)
  async function fakeAI(prompt, mode = "chat") {
    await new Promise((r) => setTimeout(r, 700));

    if (mode === "chat") {
      return `AI Suggestion:
- Improve SEO for ${profile.location}
- Post 3 reels weekly
- Promote WhatsApp lead campaigns`;
    }

    if (mode === "post") {
      return {
        caption: `Grow your business with ${profile.companyName}. Modern websites, SEO & marketing.`,
        hashtags: "#DigitalMarketing #WebDesign #" + profile.location.replace(/\s/g, ""),
        imagePrompt: "Modern digital workspace, neon blue, flat lay photo",
        time: "Tuesday 10:00 AM",
      };
    }

    if (mode === "audit") {
      return {
        issues: [
          "Low posting frequency",
          "Google Business has outdated photos",
          "No recent content",
        ],
        fixes: [
          "Post 3 reels per week",
          "Upload 3 new Google Business photos",
          "Add highlights on Instagram",
        ],
        quickPost: "We just finished a client website! Check our portfolio.",
      };
    }

    return "OK";
  }

  // Handlers
  async function handleChatSubmit() {
    if (!chatInput.trim()) return;
    const userMsg = { who: "you", text: chatInput };
    setChatLog((c) => [...c, userMsg]);
    setChatInput("");
    const ai = await fakeAI(chatInput, "chat");
    const aiMsg = { who: "ai", text: ai };
    setChatLog((c) => [...c, aiMsg]);
  }

  async function handleGeneratePost() {
    const res = await fakeAI("", "post");
    setPostResult(res);
  }

  async function handleAudit() {
    const res = await fakeAI(auditUrl, "audit");
    setAuditResult(res);
  }

  return (
    <div className="p-6 font-sans">
      <h1 className="text-2xl font-bold">Apptivate AI Marketing</h1>
      <p className="text-gray-600">Personal Edition — {profile.companyName}</p>

      {/* TABS */}
      <div className="flex gap-3 mt-4">
        <button onClick={() => setTab("dashboard")}>Dashboard</button>
        <button onClick={() => setTab("chat")}>Chat</button>
        <button onClick={() => setTab("post")}>Post</button>
        <button onClick={() => setTab("audit")}>Audit</button>
        <button onClick={() => setTab("growth")}>Growth</button>
      </div>

      <div className="mt-6">
        {tab === "dashboard" && <div>Dashboard coming soon...</div>}
        {tab === "chat" && (
          <div>
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="w-full border p-2"
              placeholder="Ask anything..."
            />
            <button onClick={handleChatSubmit}>Send</button>
            <div className="mt-4">
              {chatLog.map((m, i) => (
                <div key={i}>
                  <b>{m.who}:</b> {m.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "post" && (
          <div>
            <button onClick={handleGeneratePost}>Generate Post</button>
            {postResult && (
              <div className="mt-3">
                <p>Caption: {postResult.caption}</p>
                <p>Hashtags: {postResult.hashtags}</p>
              </div>
            )}
          </div>
        )}

        {tab === "audit" && (
          <div>
            <input
              value={auditUrl}
              onChange={(e) => setAuditUrl(e.target.value)}
              placeholder="Enter URL"
              className="border p-2 w-full"
            />
            <button onClick={handleAudit}>Audit</button>

            {auditResult && (
              <div className="mt-4">
                <h3>Issues</h3>
                <ul>
                  {auditResult.issues.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {tab === "growth" && <div>Growth stats here</div>}
      </div>
    </div>
  );
}

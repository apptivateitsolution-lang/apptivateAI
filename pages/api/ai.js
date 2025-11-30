
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Only POST allowed" });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "OPENAI_API_KEY not configured" });
    }

    const { action, payload } = req.body || {};
    if (!action) {
      return res.status(400).json({ error: "Missing action" });
    }

    let systemMsg = "You are a helpful marketing assistant.";
    let userMsg = "";

    switch (action) {
      case "caption":
        userMsg = `Write ${payload?.count ?? 5} short Instagram captions for ${payload?.productName || "a product"} in ${payload?.tone || "friendly"} tone. Also return one image prompt and 10 hashtags. Provide JSON with keys: captions (array), image_prompt, hashtags (array).`;
        break;
      case "hashtags":
        userMsg = `Provide 30 relevant hashtags for ${payload?.topic || "topic"} split into groups of 10.`;
        break;
      case "audit":
        userMsg = `Perform a quick SEO/profile audit for this website: ${payload?.website || "unknown"}. Provide top 5 issues and short fixes. Respond as JSON: { issues: [{title, fix}], score: number }`;
        break;
      case "message":
        userMsg = `Write a professional message/email: ${payload?.context || ""}. Provide subject and body separated in JSON { subject, body }`;
        break;
      case "post":
        userMsg = `Create a social media post caption and suggested image prompt for: ${payload?.topic || ""}.`;
        break;
      default:
        return res.status(400).json({ error: "Unknown action" });
    }

    const body = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemMsg },
        { role: "user", content: userMsg }
      ],
      temperature: 0.7,
      max_tokens: 800
    };

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    const text = await r.text();
    if (!r.ok) {
      return res.status(r.status).json({ error: "OpenAI error", details: text });
    }

    // Try to parse assistant content as JSON, otherwise return raw content.
    const data = JSON.parse(text);
    const assistant = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text ?? null;

    try {
      const parsed = JSON.parse(assistant);
      return res.status(200).json({ result: parsed, raw: assistant });
    } catch (_) {
      return res.status(200).json({ result: assistant });
    }

  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({ error: err?.message || String(err) });
  }
}

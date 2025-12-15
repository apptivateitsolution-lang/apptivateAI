let lastRequestTime = 0;

export default async function handler(req, res) {
  const now = Date.now();
  if (now - lastRequestTime < 1500) {
    return res.status(429).json({ error: "Too many requests. Please wait." });
  }
  lastRequestTime = now;
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (req.method === "GET") {
  return res.json({
    keyPresent: !!process.env.OPENAI_API_KEY,
    keyPrefix: process.env.OPENAI_API_KEY?.slice(0, 7),
    time: new Date().toISOString()
  });
}


  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "OPENAI_API_KEY not configured" });
  }

  const { action, payload } = req.body || {};
  if (!action) {
    return res.status(400).json({ error: "Missing action" });
  }

  let prompt = "";

  switch (action) {
    case "caption":
      prompt = `Write ${payload?.count ?? 5} Instagram captions for "${payload?.productName || "a product"}" in ${payload?.tone || "friendly"} tone.
Return JSON:
{
  "captions": [],
  "image_prompt": "",
  "hashtags": []
}`;
      break;

    case "post":
      prompt = `Create a short social media post for "${payload?.topic}". Return JSON { "caption": "", "image_prompt": "" }`;
      break;

    case "audit":
      prompt = `Do a quick SEO audit for ${payload?.website}. Return JSON { "issues": [{ "title": "", "fix": "" }], "score": 0 }`;
      break;

    case "message":
      prompt = `Write a professional message for: ${payload?.context}. Return JSON { "subject": "", "body": "" }`;
      break;

    default:
      return res.status(400).json({ error: "Unknown action" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt,
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI API error:", data);
      return res.status(response.status).json({
        error: "OpenAI error",
        details: data,
      });
    }

    const outputText =
      data.output_text ||
      data.output?.[0]?.content?.[0]?.text ||
      "";

    // Try JSON parsing
    try {
      const parsed = JSON.parse(outputText);
      return res.status(200).json({ result: parsed });
    } catch {
      return res.status(200).json({ result: outputText });
    }

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
}

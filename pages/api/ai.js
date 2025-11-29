export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Prompt is required and must be a non-empty string.' });
    }

    // Call OpenAI Chat Completions
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OPENAI_API_KEY environment variable not set.' });
    }

    const payload = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant that generates marketing copy, captions, hashtags and image prompts." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 800
    };

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!openaiRes.ok) {
      const text = await openaiRes.text();
      return res.status(openaiRes.status).json({ error: 'OpenAI API error', details: text });
    }

    const data = await openaiRes.json();

    const reply = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text ?? null;

    return res.status(200).json({
      text: reply || "No response from AI."
    });

  } catch (error) {
    console.error('API handler error:', error);
    return res.status(500).json({ error: error?.message || String(error) });
  }
}

export default async function handler(req, res) {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are Apptivate IT Solution AI Marketing Assistant. Reply very clearly and smart." },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await openaiRes.json();

    return res.status(200).json({
      text: data?.choices?.[0]?.message?.content || "No response from AI"
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

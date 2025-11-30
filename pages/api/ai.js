
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });

  const { action, payload } = req.body || {};
  if (!action) return res.status(400).json({ error: 'Missing action' });

  let prompt = '';
  switch (action) {
    case 'caption':
      prompt = `Write ${payload?.count ?? 5} short Instagram captions for ${payload?.productName || 'a product'} in ${payload?.tone || 'friendly'} tone. Also return one image prompt and 10 hashtags. Respond in JSON with keys: captions (array), image_prompt, hashtags (array).`;
      break;
    case 'post':
      prompt = `Create a short social media post for: ${payload?.topic || ''}. Provide caption and image prompt in JSON { caption, image_prompt }`;
      break;
    case 'audit':
      prompt = `Perform a quick SEO/profile audit for this website: ${payload?.website || 'unknown'}. Provide top 5 issues and short fixes as JSON { issues: [{title, fix}], score: number }`;
      break;
    case 'message':
      prompt = `Write a professional message/email: ${payload?.context || ''}. Respond as JSON { subject, body }`;
      break;
    default:
      return res.status(400).json({ error: 'Unknown action' });
  }

  const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
  const body = {
    model,
    messages: [
      { role: 'system', content: 'You are a helpful marketing assistant.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 400
  };

  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    // Log headers for debugging rate limits
    try {
      console.log('OpenAI headers:', {
        status: r.status,
        'retry-after': r.headers.get('retry-after'),
        'x-ratelimit-remaining-requests': r.headers.get('x-ratelimit-remaining-requests')
      });
    } catch (e) {}

    if (!r.ok) {
      const details = await r.text();
      const retryAfter = r.headers.get('retry-after');
      return res.status(r.status).json({ error: 'OpenAI error', status: r.status, details, retryAfter });
    }

    const data = await r.json();
    const assistant = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text ?? '';

    // Try to parse assistant as JSON, otherwise return string
    try {
      const parsed = JSON.parse(assistant);
      return res.status(200).json({ result: parsed, raw: assistant });
    } catch (e) {
      // try to extract JSON substring
      const m = assistant.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          const parsed2 = JSON.parse(m[0]);
          return res.status(200).json({ result: parsed2, raw: assistant });
        } catch (err) {}
      }
      return res.status(200).json({ result: assistant });
    }
  } catch (err) {
    console.error('Request error', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
}

// pages/api/ai.js
// Replaced with improved rate-limit protection, retry logic, and header logging.
//
// NOTES:
// - This file includes a lightweight in-memory per-IP limiter (works per serverless instance).
//   For robust global rate-limiting use a shared store like Upstash Redis and replace the limiter accordingly.

const INSTANCE_LIMIT_MAP = new Map(); // { ip -> { count, expiresAt } }
const PER_IP_LIMIT = 20;      // max requests
const WINDOW_SECONDS = 60;    // per this many seconds

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Fetch wrapper with retries on 429 and 5xx responses.
 * Retries up to `maxRetries` times using exponential backoff + jitter.
 * If OpenAI returns a Retry-After header, uses that as a minimum delay.
 */
async function fetchWithRetry(url, options = {}, maxRetries = 4, baseDelayMs = 600) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const resp = await fetch(url, options);

    // Log important headers for debugging
    try {
      const headersToLog = {
        'status': resp.status,
        'x-ratelimit-limit-requests': resp.headers.get('x-ratelimit-limit-requests'),
        'x-ratelimit-remaining-requests': resp.headers.get('x-ratelimit-remaining-requests'),
        'x-ratelimit-reset-requests': resp.headers.get('x-ratelimit-reset-requests'),
        'retry-after': resp.headers.get('retry-after')
      };
      console.log('OpenAI response headers:', headersToLog);
    } catch (e) {
      console.warn('Failed reading headers for logging', e);
    }

    if (resp.ok) return resp;

    // If it's 429 (rate limit), compute a delay using Retry-After header or exponential backoff
    if (resp.status === 429) {
      const retryAfter = resp.headers.get('retry-after');
      let delay = baseDelayMs * Math.pow(2, attempt); // exponential
      if (retryAfter) {
        const ra = parseInt(retryAfter, 10);
        if (!Number.isNaN(ra)) {
          delay = Math.max(delay, ra * 1000);
        }
      }
      // jitter
      delay = delay + Math.floor(Math.random() * 300);

      if (attempt === maxRetries) {
        // give up, return final response
        return resp;
      }
      console.warn(`OpenAI 429 received. Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
      await sleep(delay);
      continue;
    }

    // If 5xx, retry after exponential backoff as well
    if (resp.status >= 500 && resp.status < 600 && attempt < maxRetries) {
      const delay = baseDelayMs * Math.pow(2, attempt) + Math.floor(Math.random() * 200);
      console.warn(`OpenAI ${resp.status} server error. Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
      await sleep(delay);
      continue;
    }

    // Other status codes: return immediately (4xx besides 429)
    return resp;
  }
  // fallback: should not reach here, but return a generic failed fetch
  throw new Error('Failed to fetch from OpenAI after retries');
}

/**
 * Simple per-IP rate limiter (in-memory).
 * Returns { allowed: boolean, retryAfterSec: number | null }
 *
 * Caveat: This is per-serverless-instance only. For global limits use a shared Redis store (Upstash).
 */
function checkAndConsumeIpLimit(ip) {
  const now = Date.now();
  const entry = INSTANCE_LIMIT_MAP.get(ip);

  if (!entry || entry.expiresAt <= now) {
    // reset window
    INSTANCE_LIMIT_MAP.set(ip, {
      count: 1,
      expiresAt: now + WINDOW_SECONDS * 1000
    });
    return { allowed: true, retryAfterSec: null };
  }

  if (entry.count < PER_IP_LIMIT) {
    entry.count += 1;
    INSTANCE_LIMIT_MAP.set(ip, entry);
    return { allowed: true, retryAfterSec: null };
  }

  // over limit
  const retryAfterMs = Math.max(0, entry.expiresAt - now);
  return { allowed: false, retryAfterSec: Math.ceil(retryAfterMs / 1000) };
}

export default async function handler(req, res) {
  try {
    // Only POST allowed
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    // Basic body check
    const { action, payload } = req.body || {};
    if (!action) {
      return res.status(400).json({ error: 'Missing action in request body.' });
    }

    // Check API key exists on server
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY not configured');
      return res.status(500).json({ error: 'Server misconfiguration. OPENAI_API_KEY not set.' });
    }

    // Simple per-IP limiter (protects from accidental floods)
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').toString().split(',')[0].trim();
    const limit = checkAndConsumeIpLimit(ip);
    if (!limit.allowed) {
      console.warn(`Rate-limited IP ${ip}. Retry after ${limit.retryAfterSec}s`);
      return res.status(429).json({
        error: 'rate_limited',
        message: `Too many requests from your IP. Try again in ${limit.retryAfterSec} seconds.`,
        retryAfter: limit.retryAfterSec
      });
    }

    // Build prompt per action
    let systemMsg = 'You are a helpful marketing assistant.';
    let userMsg = '';
    switch (action) {
      case 'caption':
        userMsg = `Write ${payload?.count ?? 5} short Instagram captions for ${payload?.productName || 'a product'} in ${payload?.tone || 'friendly'} tone. Also return one image prompt and 10 hashtags. Provide JSON with keys: captions (array), image_prompt, hashtags (array).`;
        break;
      case 'hashtags':
        userMsg = `Provide 30 relevant hashtags for ${payload?.topic || 'topic'} split into groups of 10.`;
        break;
      case 'audit':
        userMsg = `Perform a quick SEO/profile audit for this website: ${payload?.website || 'unknown'}. Provide top 5 issues and short fixes. Respond as JSON: { issues: [{title, fix}], score: number }`;
        break;
      case 'message':
        userMsg = `Write a professional message/email: ${payload?.context || ''}. Provide subject and body separated in JSON { subject, body }`;
        break;
      case 'post':
        userMsg = `Create a social media post caption and suggested image prompt for: ${payload?.topic || ''}.`;
        break;
      default:
        return res.status(400).json({ error: 'Unknown action' });
    }

    // Prepare OpenAI payload
    const openaiBody = {
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemMsg },
        { role: 'user', content: userMsg }
      ],
      temperature: 0.7,
      max_tokens: payload?.max_tokens ?? 600 // keep reasonably small by default
    };

    const openaiOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(openaiBody)
    };

    // Use the retry wrapper
    const openaiResp = await fetchWithRetry('https://api.openai.com/v1/chat/completions', openaiOptions, 4, 600);

    // If still not OK, return the details to help debug
    if (!openaiResp.ok) {
      const details = await openaiResp.text();
      // Try to extract Retry-After or rate-limit headers for client
      const retryAfterHeader = openaiResp.headers.get('retry-after');
      const retryAfterSec = retryAfterHeader ? parseInt(retryAfterHeader, 10) : null;
      console.error('OpenAI returned non-OK:', { status: openaiResp.status, retryAfterHeader, details });
      const status = openaiResp.status === 401 ? 401 : (openaiResp.status === 429 ? 429 : 500);
      return res.status(status).json({
        error: 'OpenAI error',
        status: openaiResp.status,
        details,
        retryAfter: retryAfterSec
      });
    }

    const text = await openaiResp.text();

    // OpenAI's response is JSON - parse it
    let parsedResp;
    try {
      parsedResp = JSON.parse(text);
    } catch (e) {
      // If we cannot parse, return raw text
      console.warn('Failed to parse OpenAI response JSON', e);
      return res.status(200).json({ result: text });
    }

    const assistant = parsedResp?.choices?.[0]?.message?.content ?? parsedResp?.choices?.[0]?.text ?? null;

    // If assistant content looks like JSON, parse it; else return raw string
    if (assistant && typeof assistant === 'string') {
      try {
        const assistantJson = JSON.parse(assistant);
        return res.status(200).json({ result: assistantJson, raw: assistant });
      } catch (e) {
        // try to extract JSON substring if present
        const maybeJson = assistant.match(/\{[\s\S]*\}/);
        if (maybeJson) {
          try {
            const assistantJson2 = JSON.parse(maybeJson[0]);
            return res.status(200).json({ result: assistantJson2, raw: assistant });
          } catch (err) {
            // fall through
          }
        }
        // return plain assistant text
        return res.status(200).json({ result: assistant });
      }
    }

    // Fallback: return the parsed response
    return res.status(200).json({ raw: parsedResp });

  } catch (err) {
    console.error('API handler error:', err);
    return res.status(500).json({ error: err?.message || String(err) });
  }
}

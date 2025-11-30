
# Apptivate Unified App

This is a minimal Next.js app that unifies AI features (captions, audit, messages) into a single project.
It includes:
- pages/api/ai.js : unified server API that calls OpenAI (server-side).
- pages/index.js : simple tabbed UI to call the API.

**Important:** Do NOT commit your OpenAI API key. Add it using Vercel environment variables:
`OPENAI_API_KEY=sk-...`

Run locally:
1. npm install
2. Create .env.local with OPENAI_API_KEY
3. npm run dev

Deploy to Vercel: follow instructions provided in the companion guide.

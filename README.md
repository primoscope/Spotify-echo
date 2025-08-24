# EchoTune AI

Deploy both frontend (Vite) and backend (Express via serverless functions) on Vercel in one click.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fdzp5103%2FSpotify-echo&project-name=echotune-ai&repo-name=echotune-ai&env=MONGODB_URI,JWT_SECRET,SESSION_SECRET,REDIS_URL,SPOTIFY_CLIENT_ID,SPOTIFY_CLIENT_SECRET,OPENAI_API_KEY,GOOGLE_API_KEY,PERPLEXITY_API_KEY,XAI_API_KEY,FRONTEND_URL,DOMAIN,BROWSERBASE_API_KEY,BROWSERBASE_PROJECT_ID,N8N_API_URL,N8N_API_KEY,VITE_SOCKET_URL&envDescription=Set%20required%20secrets%20(MongoDB%20URI%2C%20JWT%2FSession%20secrets).%20Optional%3A%20Redis%2C%20Spotify%2C%20LLM%20providers%2C%20Socket%20URL.&envLink=https%3A%2F%2Fgithub.com%2Fdzp5103%2FSpotify-echo%2Fblob%2Fmain%2F.env.example&build-command=npm%20install%20&&%20npm%20run%20build&install-command=npm%20install&output-directory=dist)

## Vercel deployment behavior
- Frontend: built to `dist/` and served with SPA fallback.
- Backend APIs: run under `api/**` using serverless functions wrapping the existing Express app.

## Required environment variables (Vercel)
- MONGODB_URI: MongoDB connection string (Atlas or managed Mongo)
- JWT_SECRET: long random string (>=32 chars)
- SESSION_SECRET: long random string (>=32 chars)

## Recommended / optional variables
- REDIS_URL: redis://:password@host:port (rate-limits, sessions, cache)
- SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET
- OPENAI_API_KEY, GOOGLE_API_KEY, PERPLEXITY_API_KEY, XAI_API_KEY
- FRONTEND_URL: https://your-frontend-domain (used by server logic)
- DOMAIN: your-frontend-domain (no protocol)
- BROWSERBASE_API_KEY, BROWSERBASE_PROJECT_ID
- N8N_API_URL, N8N_API_KEY
- VITE_SOCKET_URL: URL of a persistent backend (for Socket.IO). Note: Vercel Functions are not suitable for long-lived WebSocket connections; host Socket.IO on a separate Node instance if needed and point to it here.

## Notes
- Ensure Node 20 runtime is selected (configured in `vercel.json`).
- If you prefer to keep APIs elsewhere, you can forego serverless and set `API_BASE_URL` + proxy instead; this repo is configured to run the full Express app on Vercel Functions by default.
- See `.env.example` for more variables and defaults.
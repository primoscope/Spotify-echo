# Configuration and Environment (placeholder)

Provide the required environment variables in a .env file or via GitHub Actions secrets. A strict schema will be introduced in a follow-up PR.

Expected keys include (subject to change):
- SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI
- OPENAI_API_KEY, OPENROUTER_API_KEY, GEMINI_API_KEY
- MONGODB_URI, REDIS_URL
- SESSION_SECRET or JWT_SECRET
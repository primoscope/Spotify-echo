# Google Gemini Direct Integration

This project can call Google Gemini (Generative Language API) directly.

## Environment Variables
- LLM_PROVIDER=google
- GEMINI_API_KEY= (DO NOT COMMIT)
- GEMINI_MODEL=gemini-1.5-flash (default)
- LLM_TIMEOUT_MS= (applies to all providers)

## Usage
1. Set GEMINI_API_KEY in your local .env (never commit).
2. Set LLM_PROVIDER=google and optionally GEMINI_MODEL.
3. Run the app; the chat will use Gemini for responses.

## Live Test
Enable the live e2e test (consumes quota):
```
GEMINI_API_KEY=... LLM_PROVIDER=google LIVE_LLM_TEST=1 npm run test:e2e
```
This runs `tests/e2e/gemini-chat.spec.ts`.

## Notes
- Free-only enforcement currently applies only to OpenRouter provider.
- Generation config is minimal (temperature=0.7). Adjust in `providers/google.ts`.
- Extend by adding system prompts: include a `{ role: 'system', content: '...' }` message; provider maps system role to user (Gemini API does not have dedicated system role).

## Security
Rotate keys immediately if leaked. Never paste your real GEMINI_API_KEY in code or PR comments.

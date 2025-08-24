# LLM Integration Overview

Supported providers:
- OpenRouter (multiple free models with optional free-only enforcement)
- Google Gemini (direct Generative Language API)
- Mock (deterministic responses for CI)

## Selecting a Provider
Set `LLM_PROVIDER` to one of:
```
openrouter | google | mock
```

For provider-specific configuration, see:
- `docs/GEMINI_INTEGRATION.md` for Gemini
- Code comments & README for OpenRouter

## Free-Only Enforcement (OpenRouter Only)
`LLM_FREE_ONLY=true` checks model pricing via `/models` and falls back to a free allowed model unless `LLM_ENFORCE_FREE_STRICT=true` (throws instead).

## Testing
Mock:
```
LLM_PROVIDER=mock npm run test:e2e
```
OpenRouter live:
```
OPENROUTER_API_KEY=... LLM_PROVIDER=openrouter LIVE_LLM_TEST=1 npm run test:e2e
```
Gemini live:
```
GEMINI_API_KEY=... LLM_PROVIDER=google LIVE_LLM_TEST=1 npm run test:e2e
```

## Adding a New Provider
1. Implement `LlmProvider` interface in `lib/llm/providers/<provider>.ts`.
2. Add to switch in `lib/llm/index.ts`.
3. Add env vars to `.env.template`.
4. Add e2e spec (skip unless LIVE_LLM_TEST=1 & correct provider).
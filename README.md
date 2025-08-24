## LLM Providers
This project now supports pluggable LLM backends:
- OpenRouter (default) with free model enforcement
- Google Gemini (direct API)
- Mock (deterministic for CI)

Configure via environment variables (see `.env.template` and `docs/LLM_INTEGRATION.md`).

Live provider tests require setting `LIVE_LLM_TEST=1` and the corresponding API key secret locally or in CI. Mock mode requires no external keys.

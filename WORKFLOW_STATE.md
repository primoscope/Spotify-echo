# WORKFLOW_STATE

- Phase: ANALYZE
- Timestamp: 2025-08-16T00:00:00Z
- Summary: Initialized background agent env for Cursor + MCP and documented required keys.

Research Notes (Perplexity/Grok-4):
- Perplexity: Provider switching best practices include a central registry, metrics collection (p50/p95 latency, error rate), and circuit-breakers. Map UI to GET /providers, POST /providers/switch, GET /providers/health.
- Grok-4: Repository has `ProviderPanel.jsx` wired to `/api/settings/llm-providers/*`. Backend needs consolidated endpoints under `/api/providers` for switching/health.

Decisions:
- Add env keys for Cursor background agent and MCP servers in `env.example`/`env.template`.
- Maintain `PROJECT_CONFIG.md` as the source of truth for prerequisites.

Risks:
- Missing `PERPLEXITY_API_KEY`/`BRAVE_API_KEY` will limit Browser Research; continue with non-blocked tasks and retry when keys are present.

Next Actions:
- BLUEPRINT provider registry endpoints and telemetry storage.
- Extend `src/api/routes/llm-providers.js` with list/switch/health.
- Update `ProviderPanel.jsx` to display metrics and switch provider. 
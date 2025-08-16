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

---

## UI Agent Log

- UI Analyze Summary (2025-08-16):
  - Provider controls: `ProviderPanel.jsx` relies on `/api/chat/providers`, `/api/settings/llm-providers/models`, and `/api/settings/llm-providers/telemetry`. No unified `/api/providers` yet; keep current contracts and add small UX improvements only.
  - Chat UX: `EnhancedChatInterface.jsx` supports context chips and provider tag but lacks a quick provider switch in-chat and an inline explainability panel toggle.
  - Discovery: `EnhancedMusicDiscovery.jsx` has modes (smart/mood/trending/social/radio) but lacks lightweight audio feature visualizations for mood sliders; API endpoints exist: `/api/music/discover`, `/api/music/trending`, `/api/social/activity`.
  - Analytics: `EnhancedAnalyticsDashboard.jsx` pulls `/api/analytics/dashboard` and `/api/analytics/realtime` with mock fallbacks; needs small chart components or inline spark bars (client-only) without backend changes.
  - Advanced Config: `EnhancedAdvancedSettings.jsx` uses `/api/settings/*` and `/api/chat/test-provider`; OK to keep and focus on glass UI tweaks.

- Immediate UI Tasks:
  1) Add inline provider quick-switch in `EnhancedChatInterface.jsx` (uses existing `useLLM().switchProvider`) and show current provider badge.
  2) Add mini audio feature visualization (client-side only) to `EnhancedMusicDiscovery.jsx` mood sliders (radar/sparkline with existing slider state).
  3) Add compact sparkline widgets for top metrics in `EnhancedAnalyticsDashboard.jsx` using generated mock data when API errors.

- Deferrals to CLI Agent (API contracts):
  - Unified `/api/providers`, `/api/providers/switch`, `/api/providers/health` with telemetry persistence.

- Perplexity Research Sync (2025-08-16):
  - Emphasize securing `PERPLEXITY_API_KEY` and monitoring endpoint reliability.
  - Add observability to MCP endpoints; structured logging and alerting hooks.
  - Keep Cursor workflows for browser research and PR deep-dive documented and discoverable. 
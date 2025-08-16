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
  - Discovery: `EnhancedMusicDiscovery.jsx` has modes (smart/mood/trending/social/AI radio) but lacks lightweight audio feature visualizations for mood sliders; API endpoints exist: `/api/music/discover`, `/api/music/trending`, `/api/social/activity`.
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
  - Available workflow: `.cursor/workflows/perplexity-browser-research.json` (filesystem + Brave + Perplexity) for targeted research sweeps.
  - Next sweep topics: LLM provider switching patterns 2025, Spotify SDK best practices, MongoDB index strategies for analytics, Node API timing middleware patterns.

- UI Validation (2025-08-16):
  - EnhancedChatInterface: provider quick-switch renders and updates provider label; relies on `LLMProvider` context, no backend changes.
  - EnhancedMusicDiscovery: mood mini-visualization displays bar spark profile reflecting slider values; client-only.
  - EnhancedAnalyticsDashboard: overview cards display tiny sparklines; uses mock hourly data if API unavailable.
  - ProviderPanel: MCP health badge and Optimize action wired to `/api/enhanced-mcp/*`; no blocking errors observed.

- UI Construct (2025-08-16):
  - Added provider status chip to `EnhancedChatInterface.jsx` header.
  - Added mood preset chips to `EnhancedMusicDiscovery.jsx` for fast context setting.

- UI Construct (2025-08-16, later):
  - Added API Performance panel to `EnhancedAnalyticsDashboard.jsx`, polling `/api/performance/endpoints` every 30s and rendering p50/p95/min/max for recent endpoints.
  - Added Providers health and average latency chips to `EnhancedChatInterface.jsx` header, polling `/api/providers/health` and `/api/settings/llm-providers/telemetry` every 30s.

- Performance & Automation (2025-08-16):
  - Added `sonar-project.properties` for baseline static analysis.
  - Added scripts: `scripts/bench/api-latency.js` and `scripts/ui/bundle-stats.js`.
  - Next: capture baseline metrics after build and append summary here.

- Validation Summary (2025-08-16, UI perf panel):
  - `/api/performance/endpoints` reachable in app context; panel renders fallback notice if unavailable; no build errors observed locally.
  - Chat header chips render successfully; fall back gracefully if health/telemetry endpoints are unavailable.

- CLI Construct (2025-08-16):
  - Implemented unified `/api/providers` endpoints (list/switch/health) in `src/api/routes/providers.js` with `llm-provider-manager`.
  - Fixed rate limiter response binding to avoid res context errors.
  - Note: Local curl validation limited by environment; server logs healthy. Please validate endpoints in normal dev runtime.

- Research Sweep Notes (2025-08-16):
  - Sonar‑Pro prioritizes Perplexity integration hardening and CI optimization (caches, canary, security checks).
  - Recommends adding advanced logging/monitoring, TypeScript migration, and containerization for reproducibility.
  - Actionables queued in ROADMAP.md Performance and Quality lanes (logging, tests, containerization tasks). 
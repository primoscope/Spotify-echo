# EchoTune AI — Roadmap (Human Maintained)

This document is the source of truth for planning and progress. It references `ROADMAP_AUTO.md` (auto-updated via Perplexity Sonar‑Pro + Grok‑4) and captures decisions, owners, and statuses.

See also: `WORKFLOW_STATE.md` for ongoing work logs and validations.

## Pillars & Objectives

### 1) Advanced AI Integration
- Multi-Provider Support (OpenAI GPT‑4o, Google Gemini 2.0, OpenRouter Claude 3.5) with runtime switching
- Intelligent Music Conversations (natural language queries)
- Context‑Aware Recommendations & explainability
- Real‑time Provider Testing (latency, health, error rates)

### 2) Smart Music Discovery
- Spotify OAuth, playlist creation, streaming
- Discovery modes (smart/mood/trending/social/AI radio)
- ML recommendations (CF + content‑based)
- Audio feature analysis (tempo/energy/valence)

### 3) Analytics Dashboard
- Live MongoDB stats, system performance, 8‑category health
- Listening patterns, engagement KPIs

### 4) Advanced Configuration
- Enhanced settings UI (glassmorphism)
- LLM provider manager, DB tools, health thresholds

---

## Roadmap (Milestones)

### M0 — Foundations (complete)
- [x] Perplexity provider in prompt executor with retry/backoff, debug logs
- [x] In‑app Perplexity research endpoint (POST /api/settings/llm-providers/perplexity/research)
- [x] Cursor workflows: Browser Research, PR Deep‑Dive
- [x] CI caches (npm/pip) and nightly canary
- [x] Auto roadmap refresh (`ROADMAP_AUTO.md`) with Sonar‑Pro + Grok‑4 fallback
- [x] Cursor Background Agent & MCP env scaffolding (`env.example`, `env.template`, `PROJECT_CONFIG.md`) — owner: agent — 2025‑08‑16

### M1 — Provider Registry & Switching (WIP)
- [ ] Backend endpoints: GET /providers, POST /providers/switch, GET /providers/health (latency/error stats)
- [ ] Persist last N latency/error metrics for charts
- [ ] Frontend ProviderPanel: list/switch providers, show live metrics
- [ ] Tests for switching and telemetry

### M2 — Context‑Aware Conversations
- [ ] Backend chat pipeline: attach user context (mood/history/preferences); persist summaries
- [ ] Frontend ChatInterface/EnhancedChatInterface: context toggle, explainability view
- [ ] Verify opt‑out behavior and persistence

### M3 — Discovery Modes & Audio Features
- [ ] Server logic (music‑discovery.js, recommendations.js) for smart/mood/trending/social/AI radio
- [ ] Use src/spotify/* to compute audio features and store for ranking/visualization
- [ ] Frontend EnhancedMusicDiscovery: mode selection, feature charts, playlist creation

### M4 — Analytics Dashboard
- [ ] Backend analytics.js/insights.js endpoints for MongoDB stats, health, engagement KPIs, listening patterns
- [ ] Frontend EnhancedAnalyticsDashboard: charts and health widgets, MCP automation status

### M5 — Advanced Configuration
- [ ] Backend settings.js/admin.js: validate/apply provider configs and DB ops
- [ ] Frontend EnhancedAdvancedSettings: provider selection, params, key validation, DB ops, health thresholds

### M6 — Quality & CI
- [ ] sonar-project.properties; npm scripts for lint/test/typecheck/scan:sonar
- [ ] Optional CI Sonar workflow (guarded by SONAR_TOKEN)

---

## UI Agent

- Current Focus (2025‑08‑16):
  - Advanced AI Integration: Provider quick-switch in chat, provider badge.
  - Smart Music Discovery: Mood sliders + mini feature visualization (client-only).
  - Analytics Dashboard: Compact sparkline widgets for top metrics (client-only).
  - Advanced Configuration: Minor glass UI polish; no API changes.

- Next UI Tasks:
  1) EnhancedChatInterface.jsx: add provider quick-switch using `useLLM()`; show current provider chip.
  2) EnhancedMusicDiscovery.jsx: add client-only radar/sparkline for `moodSettings` values.
  3) EnhancedAnalyticsDashboard.jsx: add sparkline components for overview metrics using mock fallback data.

- Research-derived improvements (Perplexity):
  - Add provider/MCP observability: lightweight structured logging hooks from UI actions to backend logs.
  - Surface MCP health in UI (done in `ProviderPanel.jsx`), and add alerts if status != healthy.
  - Keep Cursor research/PR workflows discoverable in Settings/Docs panel.

- Coordination to CLI Agent (create endpoints, no UI block):
  - Unified providers API: GET `/api/providers`, POST `/api/providers/switch`, GET `/api/providers/health` with telemetry persistence.

---

## Research & Decisions
- Auto research (`ROADMAP_AUTO.md`) feeds tasks weekly. Significant decisions are copied here with dates and commit refs.

- 2025‑08‑16: Adopt Perplexity Sonar‑Pro for fast synthesis; Grok‑4 deep‑dive with fallback policy (commit a1686eb).
- 2025‑08‑16: Enable Perplexity debug logging and latency metrics in executor (commit 3837005).
- 2025‑08‑16: Background agent env standardized; documented in `PROJECT_CONFIG.md` (commit pending).

---

## Owners & Cadence
- Owner: agent (autonomous)
- Cadence: Nightly canary; Daily status heartbeat; Weekly roadmap refresh
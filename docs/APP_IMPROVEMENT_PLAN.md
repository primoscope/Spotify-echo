# EchoTune AI — App Improvement Plan
Frontend, Backend/API, Chat LLM, MongoDB Insights, Docker/Compose, CI/Quality

Status: Planned
Owner: agent
Source: Issue #126 scope + user direction (frontend, backend, new UI, LLM chat integration, MongoDB insights, Docker)

---

## 1) Objectives

- Upgrade chat to real-time token streaming with provider quick-switch and explainability.
- Harden backend LLM pipeline with SSE, context, telemetry, and circuit breaker.
- Deliver MongoDB-driven insights with proper indexes and optimized queries.
- Improve UI performance, accessibility, and analytics visualization.
- Ensure reliable Docker runtime and a dev-compose stack (app + MongoDB + Redis).
- Add CI gates for UI quality (Lighthouse), API tests, and nightly performance baselines.

---

## 2) Deliverables

- Frontend enhancements (React 19) in `src/frontend/components/*` and contexts.
- Backend/API upgrades in `src/api/routes/*`, `src/chat/*`.
- MongoDB indices and analytics endpoints in `src/database/*`, `src/api/routes/{analytics.js,insights.js}`.
- Docker/Compose: `docker-compose.dev.yml` for local stack.
- CI workflows (files can be added later): lighthouse, api-tests, nightly baseline.
- Agent instructions for GitHub Coding Agent and Cursor.

---

## 3) Frontend UI/UX Improvements

### 3.1 Token Streaming Chat UX
- Files:
  - `src/frontend/components/EnhancedChatInterface.jsx`
  - `src/frontend/components/ChatInterface.jsx`
  - `src/frontend/components/MessageList.jsx`
  - `src/frontend/components/ChatInput.jsx`
  - `src/frontend/contexts/LLMContext.jsx`
- Tasks:
  - Consume SSE stream from `/api/chat/stream` via `EventSource`.
  - Render incremental tokens, typing indicator, and finalization.
  - Abort button to cancel in-flight stream.
  - Error toasts (MUI Snackbar) with retry.
- Acceptance:
  - Tokens render incrementally; abort cancels stream; errors visible; no UI freezes.

### 3.2 Provider Quick-Switch + Health Chips
- Files:
  - `src/frontend/components/EnhancedChatInterface.jsx`
  - `src/frontend/components/ProviderPanel.jsx`
  - `src/frontend/contexts/LLMContext.jsx`
- Tasks:
  - Add header provider chip (name, current model, average latency).
  - Switch provider using `/api/providers/switch` without reload; persist in context.
  - Poll `/api/providers/health` to display status and latency.
- Acceptance:
  - Switch is instant; selection persists; health chips reflect real-time status.

### 3.3 Explainability Panel
- Files:
  - `src/frontend/components/ExplainableRecommendations.jsx`
  - `src/frontend/components/EnhancedChatInterface.jsx`
- Tasks:
  - Toggle panel to show: model, prompt summary, top features/weights/constraints.
  - Allow copying of reasoning trace when available.
- Acceptance:
  - Panel toggles; content populated for LLM outputs and recs.

### 3.4 Analytics UI Enhancements
- Files:
  - `src/frontend/components/EnhancedAnalyticsDashboard.jsx`
  - `src/frontend/components/InsightsDashboard.jsx`
- Tasks:
  - Provider health chips; p50/p95 latency sparkline.
  - Fallback to mock data if backend is unavailable.
- Acceptance:
  - Displays metrics from `/api/providers/health` and `/api/performance/endpoints`; responsive layout.

### 3.5 Accessibility & Performance
- Files:
  - `src/frontend/styles/*`
  - All chat components for ARIA roles and focus management
- Tasks:
  - Keyboard navigation, focus rings, ARIA attributes.
  - Lazy-load heavy charts, code-split analytics views.
- Acceptance:
  - Lighthouse a11y ≥ 90; total JS gzip ≤ 500kB; top chunk ≤ 120kB.

---

## 4) Backend API & LLM Pipeline

### 4.1 SSE Streaming Endpoint
- Files:
  - `src/api/routes/chat.js`
  - `src/chat/llm-provider-manager.js`
- Tasks:
  - Implement `GET /api/chat/stream` using SSE (`res.write("data: ...\\n\\n")`).
  - Stream provider tokens with retry/backoff; handle 429 soft-fails.
  - Abort support via `X-Request-Id` and server-side cancellation.
- Acceptance:
  - Stable SSE under load; abort and completion handled correctly.

### 4.2 Context-Aware Conversations
- Files:
  - `src/chat/conversation-manager.js`
  - `src/chat/chatbot.js`
  - `src/database/mongodb-manager.js`
- Tasks:
  - Persist per-user short summaries, preferences/history.
  - Attach context to prompts; enforce max context size.
  - Configurable via `src/config/llm-providers.json`.
- Acceptance:
  - Summaries stored/retrieved; context toggles; opt-out behaves correctly.

### 4.3 Circuit Breaker & Correlation IDs
- Files:
  - `src/chat/llm-provider-manager.js`
  - `src/api/middleware/perf-metrics.js`
- Tasks:
  - Circuit breaker per provider; auto-reset on recovery.
  - Propagate `X-Request-Id` end-to-end for tracing.
- Acceptance:
  - Breaker opens on consecutive failures; health endpoint surfaces breaker state.

### 4.4 Telemetry Persistence
- Files:
  - `src/chat/llm-telemetry.js`
  - `src/database/schema.js`
- Tasks:
  - Persist average latency, errors, request counts.
  - Expose aggregates in `GET /api/providers/health`.
- Acceptance:
  - Health returns persisted stats; charts consume consistent shape.

---

## 5) MongoDB Insights & Performance

### 5.1 Collections & Indexes
- Files:
  - `src/database/schema.js`
  - `src/database/mongodb-manager.js`
- Tasks:
  - Define collections for telemetry, conversations, insights.
  - Create compound indexes for analytics queries; TTL index for telemetry rotation.
  - Add migration to create missing indexes on boot.
- Acceptance:
  - Index creation idempotent; no collection scans on hot queries.

### 5.2 Insight Endpoints
- Files:
  - `src/api/routes/analytics.js`
  - `src/api/routes/insights.js`
- Tasks:
  - Endpoints: listening patterns, top artists/genres, engagement KPIs, provider success rates.
  - Pagination, filters, and projections for payload efficiency.
- Acceptance:
  - Responses under 1.2s p95 (dev); shapes match UI expectations.

### 5.3 Query Optimization
- Files:
  - `src/database/mongodb-manager.js`
- Tasks:
  - Aggregations for feature distributions/time series; ensure IXSCAN via `.explain()`.
- Acceptance:
  - Explain plans indicate proper index usage; memory-friendly stages.

---

## 6) LLM Integration Enhancements

### 6.1 Provider Interface Standardization
- Files:
  - `src/chat/llm-providers/{openai-provider.js,gemini-provider.js,perplexity-provider.js,grok4-provider.js}`
  - `src/config/provider-models.js`
- Tasks:
  - Standardize `stream()`, `nonStream()`, cost estimation, tool-calling capability map.
- Acceptance:
  - All providers implement unified contract; registry advertises capabilities.

### 6.2 Guardrails & Prompt Templates
- Files:
  - `prompts/` (existing)
  - `src/chat/model-registry.js`
- Tasks:
  - Simple content guardrails; template versions and variables; unit coverage for templates.
- Acceptance:
  - Deterministic prompts; guardrails prevent disallowed content; tests pass.

---

## 7) Docker & Dev Environment

### 7.1 Runtime Validation
- Files:
  - `Dockerfile`
  - `src/server.js` or `server.js` to ensure `/health` and static build served
- Tasks:
  - Confirm SSE works in container; serve API + static frontend; healthcheck OK.
  - Set `NODE_OPTIONS=--max_old_space_size=512` (or appropriate) for stability.
- Acceptance:
  - Container healthcheck passes; SSE and static assets function correctly.

### 7.2 Dev Compose
- Files:
  - `docker-compose.dev.yml` (new)
- Services:
  - `app`: build from repo; env for Mongo/Redis.
  - `mongodb`: official image with volume.
  - `redis`: official image.
- Acceptance:
  - `docker compose -f docker-compose.dev.yml up` brings full stack online; app connects to DB/cache.

---

## 8) CI & Quality Gates

### 8.1 Lighthouse CI (optional by PREVIEW_URL)
- Workflow (add later): `.github/workflows/lighthouse.yml`
- Acceptance:
  - a11y ≥ 90; performance ≥ 75; reports uploaded as artifacts.

### 8.2 API/Jest Integration Tests
- Workflow: `.github/workflows/api-tests.yml`
- Targets:
  - Provider switching, `/api/providers/health`
  - Chat SSE route
  - Analytics aggregations
- Acceptance:
  - CI green; coverage reports uploaded.

### 8.3 Nightly Performance Baseline
- Workflow: `.github/workflows/nightly-app-baseline.yml`
- Steps:
  - Run `npm run performance:baseline` → `reports/perf-baseline.json`
- Acceptance:
  - Artifacts visible in Actions; trends tracked over time.

---

## 9) File-by-File Change List

- Frontend:
  - `src/frontend/components/EnhancedChatInterface.jsx` — streaming UI, provider chip, explain toggle
  - `src/frontend/components/ChatInterface.jsx` — base chat updates
  - `src/frontend/components/MessageList.jsx` — streaming rendering
  - `src/frontend/components/ChatInput.jsx` — submit/abort controls
  - `src/frontend/components/ExplainableRecommendations.jsx` — new
  - `src/frontend/components/EnhancedAnalyticsDashboard.jsx` — chips/sparkline
  - `src/frontend/contexts/LLMContext.jsx` — provider state, telemetry hooks
  - `src/frontend/styles/ModernChatInterface.css` — accessibility/focus/styles

- Backend:
  - `src/api/routes/chat.js` — `GET /api/chat/stream` SSE
  - `src/chat/llm-provider-manager.js` — circuit breaker, failover, telemetry
  - `src/chat/conversation-manager.js` — summaries/context persistence
  - `src/chat/llm-telemetry.js` — telemetry persistence
  - `src/api/routes/analytics.js`, `src/api/routes/insights.js` — MongoDB insights

- Database:
  - `src/database/schema.js` — collections/indexes (compound + TTL)
  - `src/database/mongodb-manager.js` — migrations, aggregations, optimizations

- Docker/Compose:
  - `docker-compose.dev.yml` — new (app + mongodb + redis)

- CI (later PR or agent):
  - `.github/workflows/lighthouse.yml`
  - `.github/workflows/api-tests.yml`
  - `.github/workflows/nightly-app-baseline.yml`

---

## 10) Step-by-Step Execution Plan

1) Implement SSE backend (`/api/chat/stream`) + circuit breaker and telemetry hooks.
2) Wire frontend streaming (EventSource), typing indicator, abort.
3) Add provider quick-switch and health chips; persist in `LLMContext`.
4) Add explainability panel; surface model, prompt summary, features/weights.
5) Define Mongo collections/indexes; implement analytics/insights endpoints; optimize queries.
6) Enhance analytics UI with sparkline and chips; add mocks fallback.
7) Validate container SSE and static serving; add `docker-compose.dev.yml`.
8) Add CI: Lighthouse (optional), API tests, nightly baseline.
9) Update docs/ci-artifacts.md with any new artifacts (when CI added).
10) Open PR; verify acceptance checklist; merge to main.

---

## 11) Acceptance Criteria (Summary)

- Chat streams tokens and can be aborted; errors surfaced.
- Provider switch persists; health chips reflect telemetry.
- Explainability panel toggles and displays metadata.
- Analytics endpoints return Mongo-backed insights under target latency; indexes in place.
- Docker container serves API + static, SSE works; dev compose runs full stack.
- CI uploads Lighthouse (if configured), API test coverage, and nightly baseline artifacts.

---

## 12) Agent Instructions

### 12.1 GitHub Coding Agent — Implementation Plan

- Branch: `feat/app-validation-chat-mongo-ui-llm`
- Backend:
  - Add SSE `GET /api/chat/stream` in `src/api/routes/chat.js`.
  - Add circuit breaker + telemetry in `src/chat/llm-provider-manager.js`, `src/chat/llm-telemetry.js`.
  - Persist conversation summaries/context in `src/chat/conversation-manager.js`.
  - Implement insights endpoints in `src/api/routes/{analytics.js,insights.js}`.
  - Add compound/TTL indexes and migrations in `src/database/{schema.js,mongodb-manager.js}`.
- Frontend:
  - Streaming UI in `EnhancedChatInterface.jsx`, `MessageList.jsx`, `ChatInput.jsx`.
  - Provider chip + switch (use `/api/providers`, `/api/providers/switch`) and health chips.
  - Explainability panel (`ExplainableRecommendations.jsx`), wired into chat interface.
  - Analytics sparkline and chips in `EnhancedAnalyticsDashboard.jsx`; mock fallback.
- Docker/Compose:
  - Ensure SSE works in container; create `docker-compose.dev.yml` with app+mongodb+redis.
- CI:
  - Add `lighthouse.yml` (gated by PREVIEW_URL), `api-tests.yml`, `nightly-app-baseline.yml`; upload artifacts.
- PR:
  - Title: “App: streaming chat, provider UX, Mongo insights, CI baselines”
  - Include checklist mapping to this plan’s acceptance criteria.

### 12.2 Cursor — Editor Task Runner (ordered)

1) `src/api/routes/chat.js`: add SSE endpoint; support abort; propagate `X-Request-Id`.
2) `src/frontend/components/EnhancedChatInterface.jsx` + `MessageList.jsx` + `ChatInput.jsx`:
   - Consume `EventSource`; render partial tokens; typing indicator; abort.
3) `src/frontend/contexts/LLMContext.jsx` + `ProviderPanel.jsx`:
   - Add provider chip and `switchProvider()`; poll `/api/providers/health`.
4) `src/frontend/components/ExplainableRecommendations.jsx`:
   - New component and toggle in chat interface.
5) `src/database/{schema.js,mongodb-manager.js}`:
   - Add collections + compound/TTL indexes and migrations.
6) `src/api/routes/{analytics.js,insights.js}`:
   - Implement Mongo-driven aggregations; paginate; filter; project.
7) `src/frontend/components/EnhancedAnalyticsDashboard.jsx`:
   - Health chips and latency sparkline; mock fallback.
8) `docker-compose.dev.yml`:
   - Add app + mongodb + redis; link env; quick-start docs update.
9) Quick tests and local validation; then open PR.

---

## 13) Notes & Constraints

- Respect existing provider APIs in `src/chat/llm-providers/*` and `src/config/provider-models.js`.
- Treat 429s and transient provider failures as soft-fail; breaker for repeated failures.
- No secrets committed; use environment variables and GitHub secrets for CI.
- Keep UI responsive and keyboard accessible; prefer lazy-loading for heavy views.

# GitHub Coding Agent — Implementation Instructions
Focus: Frontend UI/UX, Backend SSE chat, LLM integration, MongoDB insights, Docker/Compose, CI quality

Status: Ready
Branch: feat/app-validation-chat-mongo-ui-llm
PR Title: App: streaming chat, provider UX, Mongo insights, CI baselines

---

## Objective

Implement production-grade improvements across the app:
- Real-time token streaming chat with provider quick-switch and explainability.
- Backend SSE chat pipeline with context, telemetry, and circuit breaker.
- MongoDB insights endpoints with indexes and optimized aggregations.
- UI performance, accessibility, and analytics polish.
- Docker runtime validation and dev-compose for app + MongoDB + Redis.
- CI workflows for UI quality and API tests (artifacts only).

---

## Prerequisites

- Node ≥ 20; npm ≥ 10.
- MongoDB/Redis (local or docker-compose) for development.
- Configure environment:
  - SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET (secrets in CI).
  - MONGODB_URI, REDIS_URL (local/dev).
- Do not commit secrets.

---

## Task Overview

1) Backend: SSE streaming endpoint; provider failover; telemetry persistence; conversation context.
2) Frontend: Streaming chat UI; provider chip + quick-switch; explainability panel; analytics chips/sparkline; a11y/perf.
3) MongoDB: Collections/indexes (compound + TTL), migrations; insight endpoints with aggregations.
4) Docker: Validate SSE + static serving; add docker-compose.dev.yml (app + mongodb + redis).
5) CI: Lighthouse (optional with PREVIEW_URL), API tests, nightly performance baseline.

---

## Implementation Plan

### 1) Backend API & LLM

- src/api/routes/chat.js
  - Add GET /api/chat/stream using SSE (Content-Type: text/event-stream; keep-alive).
  - Stream tokens via llm-provider-manager; write frames as: `data: {"delta":"..."}\n\n`.
  - Support abort via X-Request-Id and server-side cancellation.
  - Handle 429 as soft-fail with retry/backoff.

- src/chat/llm-provider-manager.js
  - Add circuit breaker per provider (error threshold, open/half-open/closed).
  - Expose breaker state to providers health endpoint.
  - Hook telemetry: record latency, errors, request counts.

- src/chat/llm-telemetry.js (new)
  - Persist per-request metrics to MongoDB (collection: provider_telemetry).
  - Provide reducers to aggregate p50/p95, success rate.

- src/chat/conversation-manager.js
  - Persist short summaries and user preferences/history.
  - Enforce max context size; attach on chat requests.

- src/api/routes/providers.js (ensure)
  - GET /api/providers (list + current)
  - POST /api/providers/switch (validate model)
  - GET /api/providers/health (aggregate telemetry + breaker state)

### 2) Frontend UI/UX

- src/frontend/components/EnhancedChatInterface.jsx
  - Consume SSE via EventSource; display streaming tokens.
  - Add provider chip with latency; quick-switch menu.
  - Add explainability panel toggle.

- src/frontend/components/{MessageList.jsx,ChatInput.jsx}
  - Live render streaming message; typing indicator; abort button.

- src/frontend/components/ExplainableRecommendations.jsx (new)
  - Show model, prompt summary, features/weights.

- src/frontend/components/EnhancedAnalyticsDashboard.jsx
  - Provider health chips; p50/p95 latency sparkline.
  - Fallback to mock data on API errors.

- src/frontend/contexts/LLMContext.jsx
  - Persist selected provider; expose switchProvider(); poll /api/providers/health.

- Performance & a11y
  - Add ARIA roles and focus management; code-split heavy views.
  - Target Lighthouse a11y ≥ 90; total JS gzip ≤ 500kB; largest chunk ≤ 120kB.

### 3) MongoDB Insights & Performance

- src/database/schema.js
  - Define collections: provider_telemetry (TTL), conversations, insights.
  - Create indexes:
    - provider_telemetry: {provider:1, ts:-1}, TTL on ts.
    - conversations: {userId:1, ts:-1}.
    - insights: relevant compound indexes for aggregations.

- src/database/mongodb-manager.js
  - Migration at boot to ensure missing indexes.
  - Aggregation helpers: feature distributions, time series, success rates.

- src/api/routes/{analytics.js,insights.js}
  - Implement endpoints:
    - /api/analytics/providers
    - /api/analytics/listening-patterns
    - /api/insights/engagement
  - Pagination, filters, projections; p95 < 1.2s (dev).

### 4) Docker & Dev Environment

- Dockerfile
  - Ensure API + static frontend served; SSE works.
  - Healthcheck: /health passes in container.
  - Optional: NODE_OPTIONS=--max_old_space_size=512.

- docker-compose.dev.yml (new)
  - Services:
    - app: build from repo; ports: 3000
    - mongodb: mongo:6 with volume; port 27017
    - redis: redis:7
  - Env wiring for MONGODB_URI and REDIS_URL.

### 5) CI Workflows (artifacts only)

- .github/workflows/lighthouse.yml
  - Trigger: pull_request, workflow_dispatch
  - Conditional step (if: env.PREVIEW_URL):
    - Run LHCI; upload artifacts.

- .github/workflows/api-tests.yml
  - Run jest integration tests; upload coverage.

- .github/workflows/nightly-app-baseline.yml
  - Nightly: run npm run performance:baseline → upload reports/perf-baseline.json.

---

## File Changes (Create/Modify)

- Backend:
  - src/api/routes/chat.js (modify)
  - src/chat/llm-provider-manager.js (modify)
  - src/chat/llm-telemetry.js (new)
  - src/chat/conversation-manager.js (modify)
  - src/api/routes/{providers.js,analytics.js,insights.js} (ensure/modify/create)

- Frontend:
  - src/frontend/components/EnhancedChatInterface.jsx (modify)
  - src/frontend/components/MessageList.jsx (modify)
  - src/frontend/components/ChatInput.jsx (modify)
  - src/frontend/components/ExplainableRecommendations.jsx (new)
  - src/frontend/components/EnhancedAnalyticsDashboard.jsx (modify)
  - src/frontend/contexts/LLMContext.jsx (modify)
  - src/frontend/styles/ModernChatInterface.css (modify/new)

- Database:
  - src/database/{schema.js,mongodb-manager.js} (modify)

- Docker/Compose:
  - docker-compose.dev.yml (new)

- CI:
  - .github/workflows/{lighthouse.yml,api-tests.yml,nightly-app-baseline.yml} (new)

---

## Acceptance Criteria

- Chat streams tokens; abort works; errors surfaced with toasts.
- Provider switching persists; health chips reflect telemetry; breaker state visible in API.
- Explainability panel toggles; shows model/prompt/features.
- MongoDB insights endpoints return data under p95 1.2s (dev); indexes in place; explain() shows index usage.
- Docker container healthcheck passes; SSE functional; compose dev stack runs app + MongoDB + Redis.
- CI uploads Lighthouse (when PREVIEW_URL), coverage report, and nightly performance baseline.

---

## Commit & PR

- Commit message:
  - feat(app): streaming chat, provider UX, Mongo insights, CI baselines
- PR includes:
  - Summary of changes mapped to Acceptance Criteria.
  - Links to docs/APP_IMPROVEMENT_PLAN.md and this instruction file.

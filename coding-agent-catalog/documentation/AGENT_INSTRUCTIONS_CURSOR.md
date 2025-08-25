# Cursor — Editor Task Runner Instructions
Scope: Frontend UI/UX, Backend SSE chat, LLM integration, MongoDB insights, Docker/Compose, CI baselines

Status: Ready
Branch suggestion: feat/app-validation-chat-mongo-ui-llm

---

## Objective
Implement app-focused improvements with minimal ceremony and clear, file-specific edits:
- Streaming chat (SSE) with provider quick-switch and explainability.
- Backend chat pipeline hardening (context, telemetry, circuit breaker).
- MongoDB insights endpoints + indexes.
- UI performance/a11y and analytics polish.
- Docker dev stack alignment.

---

## Prerequisites
- Node ≥ 20, npm ≥ 10
- MongoDB + Redis available (local or docker-compose)
- Environment: MONGODB_URI, REDIS_URL, SPOTIFY_CLIENT_ID/SECRET (no secrets committed)

---

## Execution Order (Step-by-step)

1) Backend: SSE streaming endpoint
- File: src/api/routes/chat.js
- Add GET /api/chat/stream:
  - Headers: Content-Type: text/event-stream; Cache-Control: no-cache; Connection: keep-alive
  - res.write frames: data: {"delta":"..."}\n\n
  - Heartbeats every 15–30s
  - Support abort via X-Request-Id and cancellation token
  - Retry/backoff for 429; soft-fail with final error frame
- AC:
  - Streams incrementally; abort closes stream; handles backpressure and client disconnects

2) Backend: Provider manager hardening
- File: src/chat/llm-provider-manager.js
- Add circuit breaker per provider (open/half-open/closed)
- Emit telemetry hook for latency, errors, counts
- Propagate X-Request-Id through provider calls
- AC:
  - Breaker opens on repeated failures; resets on recovery; telemetry event emitted per request

3) Backend: Telemetry persistence
- Files:
  - src/chat/llm-telemetry.js (new)
  - src/database/schema.js
- Implement provider_telemetry collection:
  - Fields: provider, model, latencyMs, success, errorCode, ts
  - Indexes: {provider:1, ts:-1}, TTL on ts (configurable)
- Reducers: compute avg, p50, p95, successRate
- AC:
  - GET /api/providers/health returns aggregates and breaker state

4) Backend: Context-aware conversations
- Files:
  - src/chat/conversation-manager.js
  - src/chat/chatbot.js
  - src/database/mongodb-manager.js
- Persist short summaries per user; cap context size
- Toggle context on/off via config/llm-providers.json
- AC:
  - Summaries stored/retrieved; context included when enabled

5) Frontend: Streaming chat UI
- Files:
  - src/frontend/components/EnhancedChatInterface.jsx
  - src/frontend/components/MessageList.jsx
  - src/frontend/components/ChatInput.jsx
  - src/frontend/contexts/LLMContext.jsx
- Use EventSource to consume /api/chat/stream
- Show typing indicator during streaming; Abort button to cancel
- Error toasts via MUI Snackbar; retry option
- AC:
  - Partial tokens render live; abort cancels stream; errors visible

6) Frontend: Provider quick-switch + health chips
- Files:
  - src/frontend/components/EnhancedChatInterface.jsx
  - src/frontend/components/ProviderPanel.jsx
  - src/frontend/contexts/LLMContext.jsx
- Add provider chip (name/model/latency)
- Switch using /api/providers/switch; persist in context
- Poll /api/providers/health to render status/latency chips
- AC:
  - Switch is instant; persists; chips update periodically

7) Frontend: Explainability panel
- Files:
  - src/frontend/components/ExplainableRecommendations.jsx (new)
  - src/frontend/components/EnhancedChatInterface.jsx
- Toggle panel to show model, prompt summary, key features/weights
- Copy-to-clipboard for reasoning trace (when available)
- AC:
  - Panel toggles; populated with metadata for answers/recommendations

8) MongoDB: Collections, indexes, migrations
- Files:
  - src/database/schema.js
  - src/database/mongodb-manager.js
- Collections: provider_telemetry (TTL), conversations, insights
- Migration on boot: ensureIndexes idempotent
- AC:
  - No COLLSCAN on hot queries; TTL rotates telemetry

9) Backend: Insights endpoints
- Files:
  - src/api/routes/analytics.js
  - src/api/routes/insights.js
- Endpoints:
  - /api/analytics/providers (latency, success rates, counts)
  - /api/analytics/listening-patterns (time series, distributions)
  - /api/insights/engagement (KPIs, top artists/genres)
- Pagination, filters, projections
- AC:
  - p95 latency ≤ 1.2s (dev); shapes match dashboard expectations

10) Frontend: Analytics dashboard polish
- File: src/frontend/components/EnhancedAnalyticsDashboard.jsx
- Add provider health chips and p50/p95 sparkline
- Fallback to mock data when API unavailable
- AC:
  - Displays live metrics; responsive layout

11) UI performance & a11y
- Files:
  - src/frontend/styles/ModernChatInterface.css (new/modify)
  - Affected components
- Add ARIA roles, keyboard navigation, focus rings
- Lazy load heavy charts; route-level code-splitting
- Targets: Lighthouse a11y ≥ 90; total JS gzip ≤ 500kB; largest chunk ≤ 120kB
- AC:
  - Audits meet thresholds; no blocking main-thread work added

12) Docker dev stack
- File: docker-compose.dev.yml (new)
- Services:
  - app (ports 3000)
  - mongodb (mongo:6, volume)
  - redis (redis:7)
- Validate container SSE route; /health passes in app container
- AC:
  - docker compose -f docker-compose.dev.yml up brings stack online and functional

13) Quick tests & validation
- Update/extend jest tests for:
  - Provider switch and /api/providers/health
  - SSE route basic flow
  - Analytics aggregations response shape
- AC:
  - Tests green; basic coverage produced

---

## Acceptance Checklist
- [ ] Live token streaming and abort in chat UI
- [ ] Provider quick-switch persists and health chips update
- [ ] Explainability panel shows metadata
- [ ] /api/providers/health aggregates telemetry + breaker state
- [ ] Insights endpoints deliver Mongo-backed data under p95 1.2s (dev)
- [ ] Indexes created (no COLLSCAN on hot paths)
- [ ] docker-compose.dev.yml runs app+MongoDB+Redis
- [ ] Container SSE and /health validated

---

## Notes & Constraints
- Treat 429s as soft-fail; retry with backoff; open breaker on repeated failures
- No secrets in repo; use environment variables and GitHub secrets in CI
- Keep UI responsive; prefer lazy-loading and incremental render
- Preserve existing provider interfaces in src/chat/llm-providers/*

# Features & Functions Roadmap for dzp5103/Spotify-echo

## Goals
- Modern WebUI and chatbot UX
- Personalized, explainable recommendations
- Reliable deployments (DigitalOcean, Docker), env hygiene
- Continuous MCP-driven automation, testing, and reporting

## Frontend (React + Vite)
1) Material UI and Theming
- Ensure MUI across app; keep `ThemeProvider` with dark/light toggle
- Mobile-first layouts; accessibility pass

2) Playlist Builder Enhancements
- Drag-and-drop reorder (DND kit)
- Bulk add/remove; shareable links; copy-to-clipboard

3) Chatbot Panel Improvements
- Multi-turn dialog with avatars and markdown
- Context chips (mood, genre, activity)
- Explainable recommendations UI ("Why this song")
- Feedback controls (👍👎, comments) wired to API

4) Real-Time Updates & PWA
- WebSocket updates for playlist/status
- PWA manifest and offline shell for core pages

## Backend (Node.js/Express + MCP)
1) Persistent Auth & Sessions
- MongoDB session store; TTL-indexed context memory

2) Modular Recommendation Engine
- Pluggable algorithms: collaborative, content-based, deep learning (MCP driver for offline jobs)
- Context-aware inference (mood, activity, history)

3) Analytics & Monitoring
- Usage metrics endpoints; dashboards
- Health/perf reports persisted to `reports/`

4) Redis Caching & Robust Logging
- Hot data caching; cache invalidation hooks
- Structured logs; error taxonomy; request IDs

## Database (MongoDB/SQLite)
Schemas (core collections)
- users, sessions, preferences, playlists, feedback
- recommendation_logs, analytics
- context_memory (TTL)

Privacy/GDPR
- Export/delete endpoints; consent tracking

## Configuration
- Dynamic config API; server-side validated
- Admin UI for provider keys and toggles
- Strict .env templating (.env.template), no secrets in repo

## New Features
- Collaborative playlists (multi-user editing)
- Social discovery (friends, shared recommendations)
- Activity feed; compatibility analytics
- Feedback-driven model improvement loop

## MCP Automation & CI
- Start/validate MCP servers on CI
- Filesystem analysis, redundancy cleanup (dry-run -> archive)
- Browser automation screenshots (Browserbase/Puppeteer)
- DO App Platform spec generation and validation on push

## Deployment & DO One-Click
- Keep `.do/app-platform.yaml` fresh via generator
- No demo/mock data in deploy artifacts
- Scripts validated on CI; artifacts uploaded

## Acceptance Criteria (summary)
- Deploy/build/env always up-to-date, validated on CI
- DO one-click is production-ready and secure
- Docker scripts reflect latest features
- Updates automated after code changes

## Phased Plan
- Phase 1: MCP validation, DO spec, env hygiene, bundle perf
- Phase 2: Chatbot UX, playlist DND, explainability, feedback
- Phase 3: Analytics, caching, admin config UI
- Phase 4: Collaborative/social features, PWA offline
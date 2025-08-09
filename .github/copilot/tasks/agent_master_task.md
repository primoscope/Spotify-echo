# EchoTune AI — Copilot Agent Master Task
Deep file system analysis, integration testing, MCP-enabled optimization, and continuous improvement plan for dzp5103/Spotify-echo

Context
- Repository: dzp5103/Spotify-echo
- Stack: Node.js (Express), Python, React, MongoDB (primary), SQLite (fallback), Redis (cache), Docker, DigitalOcean, Nginx
- AI Providers: OpenAI, Google Gemini, OpenRouter
- Automation: Advanced MCP ecosystem (Filesystem, Puppeteer, Package Management, Analytics, Code Sandbox, Creative Automation, plus community servers)

Objective
Establish a persistent Copilot/Agent program that:
- Maps and audits the full codebase and file system for quality, redundancy, performance, and security
- Validates and integrates MCP servers for end-to-end automation, testing, and developer workflows
- Continuously optimizes code, docs, build/deploy, and runtime performance with measurable improvements
- Self-updates Copilot + MCP integrations and maintains a living roadmap, progress logs, and automated validations
- Prepares and evolves the product to include robust LLM provider abstraction, modern Web UI, Spotify insights, and MongoDB analytics tooling

Models
- Default: gpt-5-turbo
- For deep analysis, security, and architecture: gpt-5
- For conversational reviews: gpt-5-chat

Global Rules
- Respect the Enhanced MCP Validation Gateway:
  - Use: /run-mcp-all, /run-mcp-validation, /mcp-health-check, /mcp-discover
  - Auto-merge is gated by MCP + GPT validations; do not bypass unless /approve-merge by maintainer
- Every PR:
  - Must include performance impact notes, security scan results, and MCP health summary
  - Must attach test evidence (unit/integration/e2e) and coverage report
- Create incremental, focused branches and PRs; link issues and update ROADMAP.md and CHANGELOG.md
- Do not commit secrets; manage via GitHub Actions secrets and local .env validated by schema

Scope of Work

1) Deep File System & Codebase Mapping
- Enumerate all files, directories, languages, module boundaries; produce:
  - SBOM (CycloneDX JSON)
  - Code graph (module/service dependency diagram)
  - Redundancy report (unused/duplicate/legacy files, dead code, stale docs)
- Identify missing or misconfigured project scaffolding (tsconfig/babel, linting, formatters, pre-commit hooks, devcontainer)
- Deliverables:
  - /reports/sbom.json
  - /reports/code-graph.md (+ mermaid diagrams)
  - /reports/redundancy-audit.md with candidate deletions/migrations

2) Integration, Testing, and CI/CD Hardening
- Configure and verify:
  - Unit/integration/e2e test harness (Node + React + Python as needed)
  - Contract tests for Spotify API (with proper mocks/cassettes)
  - Load/perf tests (k6 or Artillery) with budgets and regressions gating
- Upgrade CI/CD workflows for:
  - Caching, parallelization, matrix builds, traceable artifacts
  - Security scanning (CodeQL/Semgrep, dependency audit, secret scanning)
  - Container build (Docker) with multi-stage builds and SBOM capture
- Deliverables:
  - /reports/test-coverage.[xml|html]
  - /reports/perf-baseline.json and trend charts
  - .github/workflows/* updated with validation gates

3) MCP Ecosystem Enablement
- Discover and catalog compatible MCP servers for this repo's needs:
  - Filesystem, Puppeteer (Spotify Web Player automation), Package Management, Analytics, Code Sandbox, Creative Automation, and community servers
- Implement:
  - Health checks, integration tests, standardized configuration, and fallback strategies
  - Slash-command triggers and job routing (e.g., /mcp-discover -> update registry)
- Deliverables:
  - /mcp/registry.yaml (servers, versions, roles, health)
  - /reports/mcp-health.md (81-tracked status snapshot)
  - Updated automation workflows invoking MCP servers

4) Self-Updating Copilot & Validation
- Ensure Copilot/Agent:
  - Can analyze PRs with gpt-5 review
  - Triggers MCP validations and blocks/permits merge per policy
  - Maintains knowledge artifacts (SBOM, code graph, docs) updated on change
- Add:
  - /gpt5 analyze, /review-gpt5, /optimize-gpt5 triggers
  - PR templates requiring checklists and validation fields
- Deliverables:
  - .github/PULL_REQUEST_TEMPLATE.md
  - .github/ISSUE_TEMPLATE/*
  - .github/copilot/* (runbooks, prompts, configs)

5) Performance & Reliability Program
- Backend:
  - Profiling (clinic.js/0x), async bottlenecks, streaming, caching via Redis
  - DB optimizations: MongoDB indexes, query plans, connection pooling; SQLite fallback validation
- Frontend:
  - Bundle size budgets, code-splitting, image optimization, Lighthouse CI
- Observability:
  - Standardize logs, metrics, traces; add dashboards and alerting hooks
- Deliverables:
  - /reports/perf-profile-backend.md
  - /reports/lighthouse-report.html
  - /docs/observability.md

6) Security & Secrets
- Enforce:
  - .env schema validation (envalid/zod), .env.example, preflight checks
  - Secret sources via Actions secrets; local dev via dotenv; zero secrets in VCS
  - CORS, CSP, rate limiting, auth/session hardening
- Deliverables:
  - /src/config/env.ts (or env.py) with validation
  - /docs/security.md and threat model summary
  - CI gates for secret and dependency scanning

7) Environments, Docker, and Deployment
- Docker:
  - Multi-stage builds, minimal base images, SBOMs, image signing (cosign if available)
- Compose:
  - Services for app, MongoDB, Redis, optional workers; healthchecks
- Deployment:
  - DigitalOcean infra scripts, Nginx config, SSL automation, blue/green or canary if feasible
- Deliverables:
  - Dockerfile(s), docker-compose.yml, infra/ scripts
  - /docs/deployment.md and /docs/runbook.md

8) LLM Architecture & Provider Abstraction
- Implement provider-agnostic LLM client:
  - Providers: OpenAI, OpenRouter, Google Gemini
  - Pluggable model registry; dynamic model listing; per-request routing; fallbacks/retries
  - Telemetry: token usage, cost tracking, latency
- Secrets:
  - OPENAI_API_KEY, OPENROUTER_API_KEY, GEMINI_API_KEY managed via env schema
- Deliverables:
  - /src/lib/llm/index.{ts,js} with providers/
  - /src/lib/llm/models.json (auto-generated or updated at startup)
  - /docs/llm.md

9) Spotify Features & Insights
- Implement UI/Backend:
  - Full playlist and songs pages with pagination, filters, saved states
  - Insights: listening history, audio features, trends; export capability
- Caching and rate-limit awareness for Spotify API
- Deliverables:
  - /src/pages/spotify/* (or React routes/components)
  - /src/server/routes/spotify/* with tests
  - /docs/spotify.md

10) MongoDB Insights & Admin UX
- Add:
  - DB health/insights dashboard: collection stats, index health, slow queries, size growth
  - Safe tools for admins to run read-only diagnostics
- Deliverables:
  - /src/pages/admin/db-insights/*
  - /src/server/services/db-insights/* with tests
  - /docs/database.md

Progress, Roadmap, and Governance
- Maintain:
  - ROADMAP.md with quarterly goals and next actions
  - CHANGELOG.md (Keep a Changelog) and versioning semantics
  - /reports/progress-<date>.md with diffs of metrics and validation outcomes
- Auto-open/update issues for discovered work; tag with labels: copilot, mcp, performance, security, llm, spotify, db

Acceptance Criteria (Definition of Done)
- All MCP validation checks pass: /run-mcp-all → green
- CI: tests, coverage ≥ target, security scans clean or risk accepted by maintainers
- Performance budgets set and met; baseline and trend reports generated
- Secrets validated via schema; no secrets in repo; env docs updated
- Docker build runs locally and in CI; staging deploy verified with health checks
- LLM provider abstraction implemented; OpenRouter and Gemini verified; dynamic model listing available
- Spotify pages and insights operational with tests and caching
- MongoDB insights dashboard functional; indexes reviewed and added where needed
- ROADMAP.md and CHANGELOG.md updated; artifacts committed under /reports and /docs

Operational Slash Commands
- /gpt5 analyze
- /review-gpt5
- /optimize-gpt5
- /gpt5 roadmap
- /run-mcp-all
- /run-mcp-validation
- /mcp-health-check
- /mcp-discover
- /approve-merge (maintainers only)
- /force-validation

Branching Recommendations
- chore/agent-bootstrap
- chore/mcp-integration
- chore/ci-cd-hardening
- feat/llm-abstraction
- feat/spotify-insights
- feat/db-insights
- perf/backend-optimizations
- docs/roadmap-and-runbooks
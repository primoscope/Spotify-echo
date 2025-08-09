# Copilot Agent Kickoff — Full Validation, Audit, and Implementation Sprint

You are the Copilot Agent for dzp5103/Spotify-echo. Execute the following in order, using gpt-5 for deep analysis and gpt-5-turbo for routine actions. Persist all artifacts under /reports and update docs as specified. Do not bypass the MCP Validation Gateway.

Phase 0 — Initialize and Verify
1) Run MCP suite:
   - /mcp-discover
   - /mcp-health-check
   - /run-mcp-all
   - Output: /reports/mcp-health.md and /mcp/registry.yaml updated with statuses, versions, and roles
2) Confirm CI/CD runners, caches, and required secrets exist; produce a gap report:
   - Output: /reports/ci-secrets-gap.md with required vs present secrets

Phase 1 — Full Codebase Sweep and Cleanup
1) Generate:
   - /reports/sbom.json (CycloneDX)
   - /reports/code-graph.md (include mermaid diagrams)
   - /reports/redundancy-audit.md (unused files, stale docs, dead code)
2) Open issues and PRs to:
   - Remove/relocate redundant files
   - Update or archive stale docs
   - Introduce/repair linting, formatting, and pre-commit hooks
3) Implement .env schema validation:
   - Add /src/config/env.(ts|js|py) with strict validation
   - Produce .env.example with all required keys, including:
     - SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI
     - OPENAI_API_KEY, OPENROUTER_API_KEY, GEMINI_API_KEY
     - MONGODB_URI, REDIS_URL
     - SESSION_SECRET or JWT_SECRET
     - DO_DEPLOY_TARGET, DOCKERHUB creds if needed
   - Output: /docs/configuration.md detailing setup

Phase 2 — Testing, Security, and CI Hardening
1) Establish/repair tests:
   - Unit/integration/e2e for backend and frontend
   - Contract tests for Spotify API with mocking strategy
2) Security scanning:
   -  scanning, dependency audits, CodeQL/Semgrep
   - Output: /reports/security-scan.md
3) Performance baselines:
   - Backend profiling and frontend Lighthouse CI
   - Output: /reports/perf-baseline.json, /reports/lighthouse-report.html
4) CI gates and artifacts:
   - Update .github/workflows/* for caching, parallelism, artifact uploads, and gating on tests/security/perf
   - Add PR templates with required checklists

Phase 3 — Docker, Env, and Deployment Readiness
1) Docker:
   - Multi-stage builds, smaller base images, SBOM capture
   - docker-compose.yml including app, MongoDB, Redis, optional workers; healthchecks
2) Deployment:
   - Scripts for DigitalOcean; Nginx config and SSL automation
   - Output: /docs/deployment.md, /docs/runbook.md
3) Validation:
   - CI builds images, runs containers, runs tests against containers
   - Output: /reports/deploy-validation.md

Phase 4 — LLM Provider Abstraction (OpenAI, OpenRouter, Gemini)
1) Implement provider-agnostic LLM client:
   - /src/lib/llm/index.(ts|js) with providers/{openai,openrouter,gemini}.*
   - Retry/backoff, fallbacks, telemetry (tokens, cost, latency)
2) Dynamic model registry:
   - /src/lib/llm/models.json updated at startup or via command
   - UI/Admin endpoint to list available models
3) Validation:
   - Smoke tests for each provider using env-provided keys
   - Output: /docs/llm.md and /reports/llm-validation.md

Phase 5 — Spotify Features and Insights
1) Backend:
   - Endpoints for playlists, tracks, audio features, and insights
   - Caching and rate-limit handling; pagination support
2) Frontend:
   - Pages/routes: /spotify/playlists, /spotify/tracks, /spotify/insights
   - Visualizations for listening trends and audio features
3) Tests and docs:
   - Integration tests for endpoints and UI flows
   - Output: /docs/spotify.md and /reports/spotify-feature-validation.md

Phase 6 — MongoDB Insights & Admin Tools
1) DB insights service:
   - Collection stats, index health, slow query analyzer (read-only)
2) Admin UX:
   - /admin/db-insights with safe, read-only diagnostics and export
3) Index optimization plan:
   - Recommend and apply indexes with migration strategy
   - Output: /reports/db-insights.md and /docs/database.md

Phase 7 — Performance & Observability Enhancements
1) Backend:
   - Async optimization, streaming, caching improvements, hot paths profiling
2) Frontend:
   - Bundle budgets, code-splitting, image optimizations, prefetching
3) Observability:
   - Standardized logs, metrics, tracing; add dashboards if supported
   - Output: /docs/observability.md and updated perf trend reports

Phase 8 — Governance, Roadmap, and Continuous Improvement
1) Update:
   - ROADMAP.md with next 4–8 weeks milestones
   - CHANGELOG.md per changes
   - /reports/progress-<date>.md summarizing metrics, risks, and next steps
2) Automate:
   - Keep sbom/code-graph/perf/security reports up-to-date on merges
   - Ensure MCP and Copilot validations run on PR events and slash commands

Acceptance Gate (must pass before feature merges)
- /run-mcp-all returns green; /run-mcp-validation passes
- CI tests green; coverage ≥ target; security scans with no criticals
- Perf budgets met; baseline established with trend tracking
- Docker builds reproducibly; staging deploy validated and healthy
- LLM abstraction works with OpenRouter and Gemini; dynamic model list visible
- Spotify pages live in dev/staging; caching and pagination verified
- MongoDB insights dashboard functional; indexes reviewed
- Docs updated; issues and PRs linked; roadmap refreshed

Operational Notes
- Prefer small, focused PRs:
  - chore/agent-bootstrap
  - chore/ci-cd-hardening
  - feat/llm-abstraction
  - feat/spotify-insights
  - feat/db-insights
  - perf/backend-optimizations
  - docs/roadmap-and-runbooks
- Always attach artifacts in /reports; reference them in PR descriptions
- Use:
  - /gpt5 analyze, /review-gpt5, /optimize-gpt5, /gpt5 roadmap
  - /mcp-discover, /mcp-health-check, /run-mcp-all, /run-mcp-validation
  - /approve-merge (maintainers), /force-validation when needed
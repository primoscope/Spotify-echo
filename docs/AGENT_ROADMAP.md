# EchoTune AI — Agent Roadmap and MCP Auto-Start Integration

Last updated: 2025-08-12

Overview
This roadmap aligns open PRs and issues with an agent-first execution plan, emphasizing fast, reliable MCP startup, CI validation, and iterative delivery. It includes:
- Prioritized workstreams with concrete tasks
- PR-by-PR and issue-by-issue next actions
- MCP auto-start and CI hardening plan
- Progress tracking checklists

Snapshot: What’s in flight
Open PRs (selected intent)
- #191 Hhjn — needs description, likely placeholder
- #189 Revert "Update .env.template" — stabilize env template and credential hygiene
- #187 Bootstrap and deploy production web app — Next.js 14 app in web/ with CI
- #183 Security tooling for secrets & git history — inventory, gitleaks, workflows
- #181 Core Coding Agent Workflow Analyzer — agent-centric infra bootstrap
- #172 GitHub repository info component — community engagement UI
- #140 CI/CD hardening + ESLint fixes — enhanced validation, React lint fixes

Open Issues (themes)
- CI/CD hardening and MCP validation gating (#127, #126)
- Agent automation for frontend/backend improvements (#164, #156)
- Deployment (DigitalOcean one-click), environment, API updates (#166, #163)
- Phases for MVP, advanced features, production hardening (#150, #151, #154, #152, #153)
- Redis caching/rate limit (#147), credential hygiene (#146)
- LLM abstraction (#128), MongoDB tooling (#130)
- Meta repository optimization (#117)

Prioritized Workstreams
1) Critical (Blockers / Security / Reliability)
- Secrets hygiene and env templates
  - Merge/align #189 revert with #183 security toolkit. Keep .env.example/.env.template consistent with zero secrets.
  - Ensure .gitignore and workflows prevent .env commit. Validate gitleaks config is in CI.
- CI MCP validation in main CI
  - Incorporate MCP health/validation steps into .github/workflows/ci.yml (mcp-final-validation-report notes they’re missing).
  - Gate merges on MCP health where applicable.
- Stabilize base lint/build/test across apps (root + web/)
  - Ensure root CI and web-ci.yml pass consistently, unify Node versions/matrix.

2) High (Foundation for velocity)
- MCP Auto-Start for agent workflows
  - Package scripts: add dev:agent to concurrently start app + MCP orchestrator + health monitor.
  - Auto-run MCP in devcontainer and local dev (postCreateCommand).
  - Introduce .mcp/servers.example.json for MCP client auto-discovery.
  - Wire scripts/mcp-health-monitor.js into dev and a scheduled GitHub Action.
- Next.js app consolidation (#187)
  - Finalize web/ CI, pin pnpm config at root, ensure build artifact caching.
  - Add env.example for web/ matching deployment plan (Vercel/DO).
- Agent Ops best practices
  - Add .github/copilot-instructions.md to speed the agent’s work (labels, runbooks, secrets matrix).
  - Create ISSUE_TEMPLATEs for “Agent Task” and “Feature with MCP.”

3) Medium (Productivity and feature enablement)
- Deployment & Infra
  - DigitalOcean one-click path (#166, #163) + compose profiles (app, mcp, db).
  - Add scripts/integrate-mcp.sh to CI infra steps, ensure health checks and grace periods.
- Performance & caching
  - Implement Redis-backed rate-limit/cache (#147) with configuration gates and test baselines.
- LLM abstraction & data tools
  - LLM provider abstraction (#128) with model selection surfaced via enhanced MCP endpoints.
  - MongoDB insights/admin tools (#130) safely gated for non-prod write ops.

4) Lower (Docs and polish)
- Documentation & runbooks
  - Expand docs/mcp-servers.md and docs/mcp/README.md with client examples (Cursor, Copilot MCP).
  - Production readiness guide updates (docs/PRODUCTION_READINESS_GUIDE.md) to reflect web/ and MCP health monitors.
- Community component (#172) refinement and tests

PR-by-PR Next Actions
- #191 Hhjn
  - Replace placeholder text with a clear description and link to related issues (or close if accidental).
  - Apply MCP Validation Gateway checklist properly; run /run-mcp-validation.

- #189 Revert ".env.template"
  - Confirm alignment with #183’s documentation and .gitignore rules.
  - Add a README section on local env and secrets policy; ensure CI checks.

- #187 Bootstrap and deploy production web app
  - Verify pnpm version pinned at repo root via packageManager.
  - Add web/.env.example minimal vars; confirm web-ci.yml matrix uses Node LTS.
  - Ensure caching (actions/setup-node + pnpm cache) and Playwright optional.

- #183 Security tooling for secret inventory/history scanning
  - Wire scheduled workflow at a non-peak time; artifacts retention set.
  - Add a SECURITY.md reference to inventory and incident response runbooks.
  - Cross-link in README “Security” section.

- #181 Core Coding Agent Workflow Analyzer
  - Add .github/copilot-instructions.md and labels to guide task pick-up.
  - Provide quickstart “Agent Tasks” section in README linking to this roadmap.

- #172 GitHub Repository Information Component
  - Validate rate-limit/backoff for GitHub API; add error boundary tests.
  - Add settings toggle and link to issues page.

- #140 CI/CD hardening and ESLint fixes
  - Add MCP steps into ci.yml (install, health, report) mirroring mcp-validation.yml.
  - Ensure matrix builds Node 18/20/22 and Python 3.11+ as needed.

Issue Grouping and Direct Actions
Security and Env
- #146 Remove leaked MongoDB demo credentials: Confirm removed, enforce gitleaks pre-commit/advisory CI.
- #165, #130 Docs: Add secret handling guidance, MongoDB admin tools docs.

CI/CD and Agent Automation
- #127, #126: Add MCP validation to main CI, convert validation outputs to artifacts; comment summaries on PR.
- #161, #160, #159, #156, #164: Create “Agent Task” templates; define sprint-like weekly automation runs.

Deployment and Infra
- #166, #163: Provision DO spec updates; integrate scripts/integrate-mcp.sh; compose profiles.
- #154, #151, #150 MVP phases: Capture acceptance criteria in docs/roadmap checklists (below).

Performance & Platform
- #147: Add Redis rate limit/cache; record baseline metrics and graphs.

LLM and Data
- #128: Provider abstraction with model registry and per-task optimization (see Enhanced MCP endpoints).
- #130: MongoDB insights with guarded write ops; add docs/mcp/production-db-ops.md cross-reference.

MCP Auto-Start and Reliability Plan
Local dev (agent-first)
- Scripts in package.json (root):
  - "dev:agent": concurrently "npm:start" + "node scripts/mcp-health-monitor.js --interval=30000" + "node scripts/mcp-manager.js health"
  - "mcp:up": node scripts/mcp-manager.js install && node scripts/mcp-manager.js health
- DevContainer:
  - .devcontainer/devcontainer.json postCreateCommand to run npm run mcp:install and initial health/report.
- Client config:
  - Add .mcp/servers.example.json and reference in docs/mcp/README.md; include Browserbase gating notes.

CI integration
- In .github/workflows/ci.yml:
  - Step order: checkout → setup node → install → security scan (gitleaks) → build/test → MCP install/health/report → upload artifacts → summary comment.
- Keep mcp-validation.yml for deeper runs and schedule (cron).
- Ensure main CI fails if critical MCP servers (core trio) unhealthy; skip optional (Browserbase) gracefully if env keys absent.

Environment Gating
- Maintain .mcp-config updates in install scripts with enabled flags (browserbase_enabled).
- For Browserbase: never fail the pipeline on missing keys; mark as skipped with warnings.

Progress Tracking Checklists
Critical
- [ ] #189 and #183: Align env template and security docs; verify no .env leaks
- [ ] Update ci.yml to run MCP install/health/report; fail on critical core MCP health issues
- [ ] Ensure lint/test pass across root and web/

High
- [ ] Add dev:agent and mcp:up scripts; integrate health monitor in dev
- [ ] DevContainer postCreateCommand to preinstall and validate MCP
- [ ] .github/copilot-instructions.md with labels and task taxonomy
- [ ] Finalize web/ CI performance (cache, matrix)

Medium
- [ ] DigitalOcean one-click and compose profiles
- [ ] Redis rate limiting/caching baseline
- [ ] LLM provider abstraction + model registry surfaced in endpoints
- [ ] MongoDB insights admin tools gated

Low
- [ ] Docs expansion (MCP client config examples, production readiness guide)
- [ ] GitHub info component robustness and test coverage

Appendix: References in repo
- MCP docs and scripts: docs/mcp-servers.md, docs/mcp/README.md, ENHANCED_MCP_README.md
- Managers and monitors: scripts/mcp-manager.js, scripts/mcp-health-monitor.js, scripts/install-mcp-servers.sh, scripts/integrate-mcp.sh
- Validation artifacts: reports/mcp-health.md, mcp-final-validation-report.txt

Ownership and Cadence
- Default assignee: @dzp5103
- Secondary: @primoscope (infra/CI)
- Agent cadence: daily quick checks, weekly consolidation PRs, monthly infra review

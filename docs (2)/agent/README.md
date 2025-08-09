# Copilot Agent + MCP for Spotify-echo

This repository includes a minimal Model Context Protocol (MCP) configuration to:
- Standardize install → lint → test → build tasks.
- Keep validation and performance tuning continuously open-ended.
- Automate multi-PR integrations with predictable conflict-resolution rules.

Key files
- `.copilot/agent.json`: defines preferences, merge order, superseding policy, MCP servers, and tasks.

Workflow
1) Validate
   - Install deps: `npm ci`
   - Lint: `npm run lint`
   - Test: `npm test -- --ci`
   - Build: `npm run build`

2) Conflict resolution rules
   - Deps: union; prefer highest compatible semver; refresh lockfile.
   - Env/config: superset of keys; annotate with comments; avoid conflicting defaults.
   - Routes/middleware: preserve auth and error ordering; avoid duplicates.
   - Migrations: ordered, idempotent; no duplicates.
   - Modules: favor current main patterns; de-duplicate utilities; resolve naming collisions.
   - Docs: merge intent; fix links and instructions.

3) Superseding policy
   - After CI is green on the integration PR, comment “Superseded by #<integration-pr-number>” and close the original PRs listed in `.copilot/agent.json`.

Notes
- CI is not replaced; this configuration complements it.
- The merge order is defined in `.copilot/agent.json` and can be adjusted as needed.
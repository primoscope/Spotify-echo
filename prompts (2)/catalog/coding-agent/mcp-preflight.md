Agent policy: Always use installed MCP servers first

Objective
- Enforce MCP-first development. Before any edits, merges, or PR updates, run MCP preflight (install → lint → test → build) and surface failures early.

Required actions (execute in order)
1) Discover MCP context
   - Read mcp-registry.json if present and list configured servers.
   - If missing, infer from package.json scripts starting with "mcp:" and from scripts/automation/mcp-manager.js.

2) Run MCP preflight locally
   - If scripts/mcp/run.sh exists: run it.
   - Otherwise, run:
     - node scripts/automation/mcp-manager.js check
     - node scripts/automation/mcp-manager.js install
     - node scripts/automation/mcp-manager.js health
     - node scripts/automation/mcp-manager.js test
     - node scripts/automation/mcp-manager.js report

3) Gate edits on MCP success
   - If any preflight step fails, stop and post findings to the working PR with actionable fixes.
   - Only proceed to code edits or merges after preflight succeeds.

4) During PR work
   - On each push: re-run preflight.
   - Update PR checklist with MCP status and attach artifacts (reports/, mcp/).

5) Conflict resolution (while integrating multiple PRs)
   - Apply repository rules (deps/env/routes/migrations/docs) and re-run MCP preflight after each merge to isolate failures quickly.

Outputs
- Updated PR body section “MCP status” with pass/fail summary.
- Uploaded artifacts: mcp-servers-report.json, reports/mcp-health.md, mcp/registry.yaml.

Notes
- Keep runs fast; prefer --ci and cached installs.
- Do not bypass MCP preflight unless explicitly instructed in the PR description.
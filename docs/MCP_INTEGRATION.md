# MCP Integration & Validation

This repo treats MCP integrations as first-class. All PRs run MCP validation:

- Install deps (Node/Python for mcp-server)
- Start each configured server ephemeral
- Probe /health (curl -fsS)
- Report configuration and file presence

Slash commands:
- /mcp-health-check — quick health + report
- /run-mcp-validation — full suite (install/health/test/report)

# EchoTune AI MCP Server

This package contains MCP server utilities and a minimal health server used for CI smoke checks.

## Servers
- mcpHealth (health.js) — exposes GET /health on MCP_PORT (default 3001)

## Commands
```bash
# install deps
npm ci

# run health server
npm run start:health

# health probe (from root or here)
npm run health
```

## Environment
- MCP_PORT (default 3001)

## CI Integration
The root scripts/mcp-manager.js will read the servers block in this file and ephemeral-start each server to probe /health in CI.

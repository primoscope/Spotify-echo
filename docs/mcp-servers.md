# EchoTune AI — MCP Servers Overview

This document tracks MCP servers used in CI and development.

## Configured Servers
- mcpHealth — Health endpoint for smoke checks

## Validation
- CI runs: node scripts/mcp-manager.js install/health/test/report
- Slash commands: /mcp-health-check and /run-mcp-validation

## Adding Servers
1. Add server entry to mcp-server/package.json (servers block)
2. Ensure it can expose a health endpoint or exits cleanly
3. Update docs if env vars are required

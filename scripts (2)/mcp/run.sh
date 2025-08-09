#!/usr/bin/env bash
set -euo pipefail

echo "=== MCP Preflight: install → health → test → report ==="

if [ -f scripts/automation/mcp-manager.js ]; then
  node scripts/automation/mcp-manager.js check
  node scripts/automation/mcp-manager.js install
  node scripts/automation/mcp-manager.js health
  node scripts/automation/mcp-manager.js test
  node scripts/automation/mcp-manager.js report
else
  echo "mcp-manager not found; using npm scripts fallback"
  npm ci
  npm run -s lint
  npm test -- --ci
  npm run -s build
fi

echo "=== MCP Preflight complete ==="
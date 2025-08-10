#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Bootstrap .env.mcp if missing
if [ ! -f "$ROOT_DIR/.env.mcp" ]; then
  cp "$ROOT_DIR/.env.mcp.example" "$ROOT_DIR/.env.mcp"
  echo "Created .env.mcp (from example). Fill in secrets before use."
fi

# Basic checks
require() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing dependency: $1"
    MISSING=1
  fi
}

MISSING=0
require node
require npx
require jq || true

if [ "$MISSING" -eq 1 ]; then
  echo "Please install missing dependencies and re-run."
  exit 1
fi

# Validate servers config example
if ! jq . "$ROOT_DIR/mcp/servers.example.json" >/dev/null 2>&1; then
  echo "mcp/servers.example.json is not valid JSON (or jq missing)."
fi

echo "Environment bootstrap complete."

echo

echo "Next steps:"
echo "1) Edit .env.mcp and provide real secrets (MongoDB, n8n, Brave, Browserbase)."
echo "2) Copy mcp/servers.example.json into your MCP client configuration (e.g., Claude Desktop)."
echo "3) Ensure MCP servers are installed (e.g., 'npx -y mongodb-mcp-server')."
echo "4) Use scripts/mcp/guards/require-prod-approval.sh to gate any write operations to production."
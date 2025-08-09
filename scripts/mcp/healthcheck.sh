#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="$ROOT_DIR/.env.mcp"

if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

echo "Running static checks..."
if command -v jq >/dev/null 2>&1; then
  jq . "$ROOT_DIR/mcp/servers.example.json" >/dev/null || echo "Invalid JSON: mcp/servers.example.json"
fi

echo "Environment variables present (masked where applicable):"
mask() { [ -n "$1" ] && echo "set" || echo "missing"; }
echo " - MONGODB_URI: $(mask "${MONGODB_URI:-}")"
echo " - MONGODB_DB: ${MONGODB_DB:-missing}"
echo " - N8N_BASE_URL: ${N8N_BASE_URL:-missing}"
echo " - N8N_API_KEY: $(mask "${N8N_API_KEY:-}")"
echo " - BRAVE_API_KEY: $(mask "${BRAVE_API_KEY:-}")"
echo " - SCREENSHOT_ENGINE: ${SCREENSHOT_ENGINE:-missing}"

echo "Healthcheck complete. Note: Live connectivity is tested by probes and when client launches the servers."
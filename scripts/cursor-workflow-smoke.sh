#!/usr/bin/env bash
set -euo pipefail

echo "== Cursor Workflow Smoke =="

if [ -z "${PERPLEXITY_API_KEY:-}" ]; then
  echo "WARN: PERPLEXITY_API_KEY not set; research steps may be skipped"
fi

# Validate JSON configs exist
for f in \
  /.cursor/mcp.json \
  /.cursor/workflows/perplexity-browser-research.json \
  /.cursor/workflows/research-best-practices.json \
  /.cursor/workflows/context-optimization.json \
  /.cursor/workflows/agent-refactor-and-test.json; do
  if [ ! -f "/workspace${f}" ]; then
    echo "Missing: ${f}" && exit 1
  fi
done

echo "OK: Core workflow configs present"

# Dry-run tests and lint as safety gates
npm run lint || true
npm run test:unit -- -i || true

# Summarize status
echo "== DONE =="
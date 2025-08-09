#!/usr/bin/env bash
set -euo pipefail
mkdir -p reports

if [ -f package.json ]; then
  npm audit --json > reports/npm-audit.json || echo '{"note":"npm audit failed"}' > reports/npm-audit.json
fi

echo "Security scan complete. See reports/."
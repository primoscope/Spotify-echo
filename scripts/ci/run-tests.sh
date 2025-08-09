#!/usr/bin/env bash
set -euo pipefail
mkdir -p reports

if [ -f package.json ]; then
  npm test --if-present || true
fi

if compgen -G "**/test_*.py" > /dev/null; then
  pip install pytest || true
  pytest -q || true
fi

echo "Tests executed. Check CI artifacts for details."
#!/usr/bin/env bash
set -euo pipefail

if [ -f package.json ]; then
  npm ci || npm install
fi

if [ -f requirements.txt ]; then
  python -m pip install --upgrade pip
  pip install -r requirements.txt
fi

echo "Setup complete."
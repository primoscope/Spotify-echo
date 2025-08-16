#!/usr/bin/env bash
set -euo pipefail

# Perplexity Browser Research automation wrapper
# Requirements: PERPLEXITY_API_KEY set in env

echo "[research] $(date -Is) starting Perplexity roadmap refresh" >&2
node scripts/roadmap-refresh.js || {
  echo "[research] $(date -Is) roadmap refresh skipped or failed (missing key or API error)" >&2
  exit 0
}

# Stage refreshed ROADMAP_AUTO.md for commit (optional caller can commit)
if git ls-files --error-unmatch ROADMAP_AUTO.md >/dev/null 2>&1; then
  git add ROADMAP_AUTO.md || true
fi

echo "[research] $(date -Is) Perplexity roadmap refresh complete" >&2
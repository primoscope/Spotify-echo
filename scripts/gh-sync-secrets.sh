#!/usr/bin/env bash
# Sync secrets from a local .env file to GitHub repository or environment secrets.
# Requires: gh CLI authenticated with repo:write permissions.
#
# Usage:
#   ./scripts/gh-sync-secrets.sh path/to/.env
#   ./scripts/gh-sync-secrets.sh path/to/.env --env Production   # for environment-scoped secrets
#
set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI not found. Install from https://cli.github.com/ and authenticate with 'gh auth login'." >&2
  exit 1
fi

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <.env-file> [--env <EnvironmentName>]" >&2
  exit 1
fi

ENV_FILE="$1"; shift
GH_ENV=""
if [[ "${1:-}" == "--env" ]]; then
  shift
  GH_ENV="${1:-}"
  shift || true
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "File not found: $ENV_FILE" >&2
  exit 1
fi

REMOTE_URL="$(git remote get-url origin 2>/dev/null || true)"
if [[ -z "$REMOTE_URL" ]]; then
  echo "Cannot determine origin remote. Run inside the repo with an 'origin' remote." >&2
  exit 1
fi

echo "Parsing $ENV_FILE and syncing secrets to GitHub ${GH_ENV:+environment '$GH_ENV' }secrets..."
while IFS= read -r line || [[ -n "$line" ]]; do
  [[ -z "$line" || "${line#"${line%%[![:space:]]*}"}" == \#* ]] && continue
  KEY="${line%%=*}"
  VAL="${line#*=}"
  KEY="$(echo -n "$KEY" | tr -cd 'A-Za-z0-9_')"
  VAL="${VAL%\"}"; VAL="${VAL#\"}"
  VAL="${VAL%\'}"; VAL="${VAL#\'}"

  if [[ -z "$KEY" ]]; then
    continue
  fi

  if [[ -n "$GH_ENV" ]]; then
    echo -n "Setting env secret $KEY... "
    printf "%s" "$VAL" | gh secret set "$KEY" --app actions --env "$GH_ENV" --body -
  else
    echo -n "Setting repo secret $KEY... "
    printf "%s" "$VAL" | gh secret set "$KEY" --app actions --body -
  fi
  echo "OK"
done < "$ENV_FILE"

echo "Done. Verify secrets in GitHub settings."
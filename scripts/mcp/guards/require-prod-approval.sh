#!/usr/bin/env bash
# Guard script to enforce sequential approval before destructive production DB operations.
# Usage: source this script in any operation that might write to production DB. Exit non-zero to block.

set -euo pipefail

now_epoch() { date +%s; }

deny() {
  echo "DENY: $1"
  exit 1
}

ALLOW="${MONGODB_MCP_ALLOW_WRITE:-false}"
UNTIL="${MONGODB_ALLOW_WRITE_UNTIL:-}"
TOKEN="${PROD_APPROVAL_TOKEN:-}"

if [ "$ALLOW" != "true" ]; then
  deny "Write operations are disabled by default (MONGODB_MCP_ALLOW_WRITE != true)."
fi

if [ -n "$UNTIL" ]; then
  NOW="$(now_epoch)"
  if [ "$NOW" -gt "$UNTIL" ]; then
    deny "Approval window has expired (NOW=$NOW > UNTIL=$UNTIL)."
  fi
else
  if [ -t 0 ] && [ -t 1 ]; then
    echo "Production operation requires explicit confirmation."
    echo "Database: ${MONGODB_DB:-unset}"
    echo "Change window tag: ${MONGODB_CHANGE_WINDOW_TAG:-none}"
    PHRASE="PROCEED ON PROD ${MONGODB_DB:-DB}"
    printf "Type the exact phrase to continue [%s]: " "$PHRASE"
    read -r CONFIRM
    if [ "$CONFIRM" != "$PHRASE" ]; then
      deny "Incorrect confirmation phrase."
    fi
    echo "Safety pause (10s). Ctrl+C to abort."
    sleep 10
  else
    if [ -z "$TOKEN" ]; then
      deny "Non-interactive production operation without PROD_APPROVAL_TOKEN."
    fi
    if [ "${#TOKEN}" -lt 16 ]; then
      deny "PROD_APPROVAL_TOKEN seems too short."
    fi
  fi
fi

echo "APPROVED: Production write gate passed."
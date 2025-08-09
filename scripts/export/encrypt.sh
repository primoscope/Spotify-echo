#!/usr/bin/env bash
set -euo pipefail

# Encrypt a directory or file using age (preferred) or GPG as fallback.
# Usage:
#   scripts/export/encrypt.sh <path> [recipient_or_email]
# Notes:
#   - If 'age' and recipient provided, uses age public recipient.
#   - If only GPG available and recipient provided, uses GPG public key.
#   - Otherwise, falls back to GPG symmetric with a passphrase prompt.

requires() { command -v "$1" >/dev/null 2>&1; }

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <path> [recipient_or_email]" >&2
  exit 1
fi

SRC_PATH="$1"
RECIPIENT="${2:-}"

if [[ ! -e "$SRC_PATH" ]]; then
  echo "Path not found: $SRC_PATH" >&2
  exit 1
fi

BASENAME="$(basename "$SRC_PATH")"
ARCHIVE="${BASENAME}-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf "$ARCHIVE" -C "$(dirname "$SRC_PATH")" "$BASENAME"
echo "Created archive: $ARCHIVE"

if requires age && [[ -n "$RECIPIENT" ]]; then
  OUT="${ARCHIVE}.age"
  age -r "$RECIPIENT" -o "$OUT" "$ARCHIVE"
  echo "Encrypted with age -> $OUT"
  rm -f "$ARCHIVE"
  exit 0
fi

if requires gpg; then
  if [[ -n "$RECIPIENT" ]]; then
    OUT="${ARCHIVE}.gpg"
    gpg --yes --output "$OUT" --encrypt --recipient "$RECIPIENT" "$ARCHIVE"
    echo "Encrypted with GPG (recipient) -> $OUT"
  else
    OUT="${ARCHIVE}.gpg"
    echo "No recipient provided; using GPG symmetric encryption (you will be prompted)."
    gpg --yes --output "$OUT" --symmetric "$ARCHIVE"
    echo "Encrypted with GPG (symmetric) -> $OUT"
  fi
  rm -f "$ARCHIVE"
  exit 0
fi

echo "Neither 'age' nor 'gpg' found. Please install one to encrypt the archive." >&2
exit 1
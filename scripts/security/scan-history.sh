#!/usr/bin/env bash
set -euo pipefail

# Scan all remote branches and full git history for leaked secrets and committed .env files.
# Requires: git, jq; optionally gitleaks (auto-installed if not found on Linux/amd64).
# Outputs to exports/security/history-scan-YYYYMMDD-HHMMSS

requires() { command -v "$1" >/dev/null 2>&1 || { echo "Missing dependency: $1" >&2; exit 1; }; }
requires git
requires jq

install_gitleaks_if_missing() {
  if command -v gitleaks >/dev/null 2>&1; then return; fi
  echo "gitleaks not found; attempting install..." >&2
  UNAME=$(uname -s || echo Linux)
  ARCH=$(uname -m || echo x86_64)
  if [[ "$UNAME" != "Linux" || "$ARCH" != "x86_64" ]]; then
    echo "Auto-install only supports Linux x86_64. Please install gitleaks manually." >&2
    return
  fi
  VERSION=$(curl -s https://api.github.com/repos/gitleaks/gitleaks/releases/latest | jq -r .tag_name)
  curl -sL "https://github.com/gitleaks/gitleaks/releases/download/${VERSION}/gitleaks_${VERSION#v}_linux_x64.tar.gz" -o /tmp/gitleaks.tgz
  tar -xzf /tmp/gitleaks.tgz -C /tmp && chmod +x /tmp/gitleaks
  sudo mv /tmp/gitleaks /usr/local/bin/gitleaks || true
}

DATE="$(date +%Y%m%d-%H%M%S)"
OUT_DIR="exports/security/history-scan-${DATE}"
mkdir -p "$OUT_DIR"

# Ensure full history and all branches
if [[ -d .git ]]; then
  git fetch --all --prune --tags
  # Unshallow if needed
  if git rev-parse --is-shallow-repository >/dev/null 2>&1 && git rev-parse --is-shallow-repository | grep -q true; then
    git fetch --unshallow || true
  fi
else
  echo "Run this from the repository root." >&2
  exit 1
fi

# List remote branches
mapfile -t BRANCHES < <(git for-each-ref --format='%(refname:short)' refs/remotes/origin)

ENV_MATCHES="[]"
for BR in "${BRANCHES[@]}"; do
  # Skip HEAD pointer
  if [[ "$BR" == "origin/HEAD" ]]; then continue; fi
  while IFS= read -r PATH; do
    # Last commit that touched this path on the branch
    LAST_COMMIT=$(git rev-list -n 1 "$BR" -- "$PATH" || true)
    META="{}"
    if [[ -n "$LAST_COMMIT" ]]; then
      META=$(git show -s --format='{"commit":"%H","committed":"%cI","author_name":"%an","author_email":"%ae"}' "$LAST_COMMIT")
    fi
    ITEM=$(jq -n --arg branch "$BR" --arg path "$PATH" --argjson meta "$META" '{branch:$branch, path:$path} + $meta')
    ENV_MATCHES=$(jq -n --argjson agg "$ENV_MATCHES" --argjson item "$ITEM" '$agg + [$item]')
  done < <(
    git ls-tree -r --name-only "$BR" \
      | grep -E '(^|/)\\.env(\\.[A-Za-z0-9._-]+)?$' \
      | grep -Ev '(example|sample|template)$' || true
  )
done

echo "$ENV_MATCHES" | jq '.' > "$OUT_DIR/env-file-matches.json"

# Run gitleaks over full history
install_gitleaks_if_missing || true
if command -v gitleaks >/dev/null 2>&1; then
  gitleaks detect --source . --report-format json --report-path "$OUT_DIR/gitleaks-report.json" || true
fi

# Markdown summary
{
  echo "# Secret Scan Summary"
  echo "Generated: ${DATE}"
  echo
  echo "## .env files found on remote branches (non-example)"
  COUNT=$(echo "$ENV_MATCHES" | jq 'length')
  echo "Found: ${COUNT}"
  echo
  echo "| Branch | Path | Commit | When | Author |"
  echo "|---|---|---|---|---|"
  echo "$ENV_MATCHES" | jq -r '.[] | "| \(.branch) | \(.path) | \(.commit // "") | \(.committed // "") | \(.author_name // "") |"'
  echo
  if [[ -f "$OUT_DIR/gitleaks-report.json" ]]; then
    echo "## Gitleaks findings"
    echo "Raw findings saved to gitleaks-report.json"
    echo "High-level count: $(jq 'length' "$OUT_DIR/gitleaks-report.json" 2>/dev/null || echo 0)"
  fi
} > "$OUT_DIR/summary.md"

echo "Scan complete -> $OUT_DIR"
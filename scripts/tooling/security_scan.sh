#!/usr/bin/env bash
set -euo pipefail
echo "[security_scan] Starting dependency & secrets scan"
if command -v npm >/dev/null 2>&1; then
  echo "[security_scan] Running npm audit (json)" || true
  npm audit --json || true
fi
if command -v osv-scanner >/dev/null 2>&1; then
  echo "[security_scan] Running osv-scanner" || true
  osv-scanner --lockfile=package-lock.json || true
else
  echo "[security_scan] (osv-scanner not installed)" || true
fi
if command -v gitleaks >/dev/null 2>&1; then
  echo "[security_scan] Running gitleaks" || true
  gitleaks detect --no-banner || true
else
  echo "[security_scan] (gitleaks not installed)" || true
fi
echo "[security_scan] COMPLETE"
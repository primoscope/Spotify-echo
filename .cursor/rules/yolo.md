# YOLO Mode

Status: Off by default

Allowlist
- git status, git diff, ls, cat, jq, rg
- npm run lint, npm run test:unit -- -i, npm run test:integration -- -i
- npm run build (no deploy)

Blocklist
- rm -rf, curl | sh, docker*, deploy*, psql/mysql/mongo mutations, secrets changes

Resource Limits
- Max job duration: 10m
- Max memory target: 1GB

Usage
- Add `"yolo": true` in workflow JSON to enable for that workflow only.
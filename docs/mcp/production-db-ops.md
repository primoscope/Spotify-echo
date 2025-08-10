# Production Database Operations (Sequential Thinking)

Checklist prior to any production write:
1) Plan: objective, scope, blast radius
2) Dry-run: enumerate target docs with read-only query
3) Risks: failure modes, safeguards, rollback
4) Approval: set MONGODB_MCP_ALLOW_WRITE=true and a short MONGODB_ALLOW_WRITE_UNTIL epoch window; provide PROD_APPROVAL_TOKEN for CI
5) Execute: `source scripts/mcp/guards/require-prod-approval.sh` then run the operation
6) Verify: read-back and metrics
7) Close window: unset variables, rotate tokens, document outcome

Default posture is read-only. Never commit secrets.
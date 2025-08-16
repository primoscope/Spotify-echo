# Project Configuration

## Cursor Background Agent & MCP

Required environment variables (do not commit real secrets):

- CURSOR_BACKGROUND_AGENT: true|false — enable background agent loop
- AGENT_YOLO_MODE: true|false — run without interaction gates
- AGENT_CYCLE_INTERVAL_SEC: integer — seconds between ANALYZE/BLUEPRINT/CONSTRUCT/VALIDATE cycles
- AGENT_STATUS_HEARTBEAT_INTERVAL: integer — seconds between status writes to `STATUS_HEARTBEAT.md`
- WORKFLOW_STATE_FILE: path — defaults to `WORKFLOW_STATE.md`
- ROADMAP_FILE: path — defaults to `ROADMAP.md`
- MCP_CONFIG_PATH: path — defaults to `.cursor/mcp.json`

MCP servers and API keys:

- PERPLEXITY_API_KEY — required for Perplexity Browser Research and Grok‑4 usage via Perplexity
- PERPLEXITY_BASE_URL — default `https://api.perplexity.ai`
- PERPLEXITY_MODEL — default `llama-3.1-sonar-small-128k-online`
- PERPLEXITY_FORCE_MODEL — set `1` to bypass aliasing
- PERPLEXITY_LOG — set `1` for verbose logging
- BRAVE_API_KEY — required for Brave Search MCP server

Optional provider keys (for runtime provider switching):

- OPENAI_API_KEY, GEMINI_API_KEY, OPENROUTER_API_KEY, AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_DEPLOYMENT_NAME

## Prerequisites Required (if missing credentials)

If Perplexity or Brave keys are missing, the agent will continue on non‑blocked items and periodically retry.

Remediation steps:

1. Set secrets in your environment or secret manager:
   - export PERPLEXITY_API_KEY="<redacted>"
   - export BRAVE_API_KEY="<redacted>"
2. Verify MCP servers can start locally:
   - npx @modelcontextprotocol/server-brave-search | cat
   - node mcp-servers/perplexity-mcp/perplexity-mcp-server.js | cat
3. Validate connectivity with curl:
   - curl -H "Authorization: Bearer $PERPLEXITY_API_KEY" https://api.perplexity.ai/chat/completions -s -o /dev/null -w "%{http_code}\n"

## Files of Record

- ROADMAP.md — human‑maintained roadmap with milestones and statuses
- WORKFLOW_STATE.md — current phase, logs, decisions, risks, next actions
- STATUS_HEARTBEAT.md — periodic status written by `scripts/status-heartbeat.js`

## Notes

- Never commit real API keys. Use `.env` or your CI secret store.
- Background agent loop honors `AGENT_CYCLE_INTERVAL_SEC` and writes logs to `WORKFLOW_STATE.md`.
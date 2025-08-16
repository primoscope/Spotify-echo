# Cursor Setup Overview

Artifacts
- `.cursorrules`: project-wide rules and routing
- `.cursorignore`: excludes for faster context
- `.cursor/rules/`: frontend/backend/testing/models/yolo
- `.cursor/workflows/`: predefined research, CI, refactor, error, context workflows
- `.cursor/mcp.json`: MCP servers (filesystem, perplexity, brave, browserbase, memory)

Smoke Test
```bash
bash scripts/cursor-workflow-smoke.sh
```

Notes
- Enable YOLO per-workflow only. Avoid deploys in automated steps.
- Configure env vars: PERPLEXITY_API_KEY, BRAVE_API_KEY; optionally Browserbase keys.
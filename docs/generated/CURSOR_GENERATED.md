# Generated Cursor Documentation

Updated: 2025-08-16T13:38:31.946Z

## Overview
- Project: echotune-ai v2.1.0
- Cursor rules present: true
- MCP servers: echotune-perplexity, echotune-filesystem, package-manager, analytics, testing, brave-search, browserbase, memory
- Workflows: 10

## Workflows
- Agent Refactor + Test: Perform multi-file refactor with automatic unit/integration tests and summary (yolo: true)
- Bug Fix Research Workflow: Research-driven bug fixing with root cause analysis (yolo: false)
- CI Roadmap Update: After CI tests pass, summarize changes and update docs/ROADMAP.md (yolo: false)
- Context Optimization: Evaluate large-repo context selection and @Recommended prioritization (yolo: false)
- Error Auto-Research: On failure, capture errors and research fixes via Perplexity + Brave (yolo: false)
- Perplexity Browser Research: Use filesystem + browser + Perplexity to research and summarize with citations (yolo: false)
- PR Deep Dive Review: Scan repo context, research best practices, and generate actionable PR review recommendations (yolo: false)
- Research Best Practices: Cross-reference code with current best practices via Perplexity + Brave (yolo: false)
- Research-to-Code Workflow: Complete workflow from research to implementation (yolo: false)
- UI Smoke via Playwright MCP: Run minimal UI flow with Playwright MCP/Browserbase if available (yolo: true)

## Model Routing (policy example)
See scripts/model-routing-policy.json for heuristics.

## Notes
- Set PERPLEXITY_API_KEY and BRAVE_API_KEY to enable research workflows.
- Browser automation requires Playwright browsers installed on the host.

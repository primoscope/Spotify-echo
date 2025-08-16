# Context
File name: 2025-08-16_1
Created at: 2025-08-16_02:38:42
Created by: ubuntu
Main branch: main
Task Branch: task/comprehensive-analysis-and-perplexity-integration_2025-08-16_1
Yolo Mode: Off

# Task Description
Your mission is to perform a comprehensive analysis of the EchoTune AI repository by actively utilizing Perplexity API for research, Grok-4 for deep architectural review, and Sonar for code quality/security scanning. Based on this analysis, generate a full development roadmap. Then, enter a continuous implementation cycle: integrate these tools, starting with the Perplexity API to add dynamic, in-app research features. Optimize and deploy services using MCP servers where applicable. Continuously update the project roadmap as you work, creating a self-sustaining cycle of automated improvement.

# Project Overview
This project, EchoTune AI, is an advanced AI-powered music discovery platform.

*   **Core Function:** It provides users with conversational AI for music queries (e.g., "Find energetic rock"), intelligent recommendations, and a comprehensive analytics dashboard.
*   **Technology Stack:**
    *   **Backend:** Node.js, Express.js, Socket.io.
    *   **Frontend:** React, Material-UI.
    *   **Database:** MongoDB (primary), SQLite (fallback), Redis for caching.
    *   **AI/ML:** Integrates with multiple LLM providers (OpenAI GPT-4o, Google Gemini 2.0, OpenRouter for Claude 3.5) and uses custom recommendation algorithms (collaborative filtering, content-based analysis).
*   **Architecture:** The source code is located in src/, which is modularized into frontend/ (React components), chat/ (AI chatbot orchestration), spotify/ (API integration), api/ (backend routes), and ml/ (recommendation engine).
*   **Infrastructure:** The application is containerized with Docker and designed for production deployment with Nginx and SSL automation. The primary goal is to provide a seamless, intelligent, and highly configurable music discovery experience.

⚠️ WARNING: NEVER MODIFY THIS SECTION ⚠️
[START OF EXECUTION PROTOCOL]
# Execution Protocol:

## 1. Create feature branch
1. Create a new task branch from [MAIN_BRANCH]:
  ```
  git checkout -b task/[TASK_IDENTIFIER]_[TASK_DATE_AND_NUMBER]
  ```
2. Add the branch name to the [TASK_FILE] under "Task Branch."
3. Verify the branch is active:
  ```
  git branch --show-current
  ```
4. Update "Current execution step" in [TASK_FILE] to next step

## 2. Create the task file
1. Execute command to generate [TASK_FILE_NAME]:
   ```
   [TASK_FILE_NAME]="$(date +%Y-%m-%d)_$(($(ls -1q .tasks | grep -c $(date +%Y-%m-%d)) + 1))"
   ```
2. Create [TASK_FILE] with strict naming:
   ```
   mkdir -p .tasks && touch ".tasks/${TASK_FILE_NAME}_[TASK_IDENTIFIER].md"
   ```
3. Verify file creation:
   ```
   ls -la ".tasks/${TASK_FILE_NAME}_[TASK_IDENTIFIER].md"
   ```
4. Copy ENTIRE Task File Template into new file
5. Insert Execution Protocol EXACTLY, in verbatim, by:
   a. Find the protocol content between [START OF EXECUTION PROTOCOL] and [END OF EXECUTION PROTOCOL] markers above
   b. In the task file:
      1. Replace "[FULL EXECUTION PROTOCOL COPY]" with the ENTIRE protocol content from step 5a
      2. Keep the warning header and footer: "⚠️ WARNING: NEVER MODIFY THIS SECTION ⚠️"
6. Systematically populate ALL placeholders:
   a. Run commands for dynamic values:
      ```
      [DATETIME]="$(date +'%Y-%m-%d_%H:%M:%S')"
      [USER_NAME]="$(whoami)"
      [TASK_BRANCH]="$(git branch --show-current)"
      ```
   b. Fill [PROJECT_OVERVIEW] from user input.
7. Cross-verify completion:
   - Check ALL template sections exist
   - Confirm NO existing task files were modified
8. Set the "Current execution step" to the name and number of the next planned step of the exectution protocol
9. Print full task file contents for verification

<<< HALT IF NOT [YOLO_MODE]: Confirm [TASK_FILE] with user before proceeding >>>

## 3. Analysis
1. Analyze code related to [TASK]:
  - Actively analyze the repository by leveraging Grok-4 for deep architectural insights, Sonar for code quality and security scanning, and the Perplexity API for researching cutting-edge best practices.
  - Identify core files/functions for integration and improvement.
2. Document findings in "Analysis" section of the task file.
3. Set the "Current execution step" to the name and number of the next planned step of the execution protocol.

<<< HALT IF NOT [YOLO_MODE]: Wait for analysis confirmation >>>

## 4. Proposed Solution
1. Create a detailed development roadmap based on the analysis.
  - This plan must include actionable tasks for integrating the Perplexity API, leveraging Grok-4 insights, addressing Sonar findings, and preparing for deployment on MCP servers.
  - Add this roadmap to the "Proposed Solution" section.
2. NO code changes yet.
3. Set the "Current execution step" to the name and number of the next planned step of the execution protocol.

<<< HALT IF NOT [YOLO_MODE]: Get solution approval >>>

## 5. Iterate on the task
1. Review "Task Progress" history and the "Proposed Solution" roadmap.
2. Plan the next concrete change to implement one part of the roadmap (e.g., write code to integrate Perplexity API, refactor based on Sonar feedback).
3. Present the change plan for approval:
  ```
  [CHANGE PLAN]
  - Files: [CHANGED_FILES]
  - Rationale: [EXPLANATION]
  ```
4. If approved:
  - Implement the changes.
  - Append to "Task Progress":
    ```
    [DATETIME]
    - Modified: [list of files and code changes]
    - Changes: [the changes made as a summary]
    - Reason: [reason for the changes]
    - Blockers: [list of blockers preventing this update from being successful]
    - Status: [UNCONFIRMED|SUCCESSFUL|UNSUCCESSFUL]
    ```
5. Ask user: "Status: SUCCESSFUL/UNSUCCESSFUL?"
6. If UNSUCCESSFUL: Repeat from 5.1
7. If SUCCESSFUL:
  a. Commit? → `git add [FILES] && git commit -m "[SHORT_MSG]"`
  b. More changes? → Repeat step 5
  c. Continue? → Proceed
8. Set the "Current execution step" to the name and number of the next planned step of the execution protocol.

## 6. Task Completion
1. Stage changes (exclude task files):
  ```
  git add --all :!.tasks/*
  ```
2. Commit with message:
  ```
  git commit -m "[COMMIT_MESSAGE]"
  ```
3. Set the "Current execution step" to the name and number of the next planned step of the execution protocol.

<<< HALT IF NOT [YOLO_MODE]: Confirm merge with [MAIN_BRANCH] >>>

## 7. Merge Task Branch
1. Merge explicitly:
  ```
  git checkout [MAIN_BRANCH]
  git merge task/[TASK_IDENTIFIER]_[TASK_DATE_AND_NUMBER]
  ```
2. Verify merge:
  ```
  git diff [MAIN_BRANCH] task/[TASK_IDENTIFIER]_[TASK_DATE_AND_NUMBER]
  ```
3. Set the "Current execution step" to the name and number of the next planned step of the execution protocol.

## 8. Delete Task Branch
1. Delete if approved:
  ```
  git branch -d task/[TASK_IDENTIFIER]_[TASK_DATE_AND_NUMBER]
  ```
2. Set the "Current execution step" to the name and number of the next planned step of the execution protocol.

## 9. Final Review
1. Complete "Final Review" after user confirmation.
2. Set step to "All done!"

[END OF EXECUTION PROTOCOL]
⚠️ WARNING: NEVER MODIFY THIS SECTION ⚠️

# Analysis

## Repository map
- **Backend**: Node/Express (`server.js`, `src/api`, `src/server.js`)
- **Frontend**: React (`src/frontend` with Vite)
- **MCP integration**: `mcp-servers/` (Perplexity, filesystem, testing, analytics, etc.)
- **Cursor integration**: `.cursor/mcp.json` (Perplexity + brave-search) and workflow `.cursor/workflows/perplexity-browser-research.json`
- **Prompt system**: `prompts/` (catalog, config, executor). Execution wired to OpenAI, Anthropic, Gemini, and now Perplexity
- **Automation**: `.github/workflows/` (many CI jobs) and `scripts/` (validators, MCP orchestration)

## Perplexity integration (status)
- Implemented provider in `prompts/tools/executor.js` (`executePerplexity`) with auth header `Bearer $PERPLEXITY_API_KEY` and correct endpoint `/chat/completions`
- Added models/provider in `prompts/config/prompt-config.yml` (`grok-4`, `sonar-pro`, `claude-3.5-sonnet`, `llama-3.3-70b`, `o1-preview`)
- Added model aliasing to route unsupported IDs to a stable Perplexity model; verified prompt tests pass consistently
- New prompts: `analysis/perplexity-repo-analysis`, `analysis/user-driven-research-grok4`, `analysis/user-driven-adr-grok4`, `analysis/user-driven-sonar-pro`, `coding-agent/user-driven-code-review`
- Live sanity checks and comprehensive tester confirm connectivity and working calls

## Cursor + browser research
- `.cursor/mcp.json`: Perplexity MCP + `brave-search` ready (requires `BRAVE_API_KEY`)
- Workflow `perplexity-browser-research.json` chains filesystem → Brave search → Perplexity synthesis inside Cursor

## CI/CD workflows
- Fixed YAML errors and PowerShell shells; validator now 100% green (47/47)
- Several workflows flagged as resource-heavy; caching opportunities remain (npm/pip) — non-blocking

## Risks & gaps
- Model aliasing currently normalizes several inputs to `sonar-pro` for reliability; consider a feature flag to use exact IDs when available
- Ensure secret management: use environment/CI secrets; avoid committing sample keys anywhere in docs or code
- Add rate-limit handling & retry/backoff for Perplexity calls; executor’s timeout/retry can be tuned per provider config
- Add unit tests for `executePerplexity` (happy path + error propagation) and for variable-default injection
- Add e2e for Cursor workflow to verify Brave + Perplexity chain under real keys

## Immediate opportunities
- Expose a simple CLI wrapper for Perplexity prompts (e.g., `npm run perplexity:exec -- <prompt>`) to streamline local use
- Add prompts for code review policy, ADR templates per domain, and security scanning checklists
- Annotate CI workflows with cache steps to reduce run time (npm/pip caches)

# Proposed Solution

## Roadmap overview
- Perplexity integration hardening
  - Add provider-level retry/backoff and rate-limit handling
  - Feature-flag for exact model IDs vs. stable alias
  - Unit tests for `executePerplexity`; executor integration tests for prompts
- Prompt catalog expansion
  - Code review policy, ADR by domain, security scanning checklists
  - CLI wrapper `npm run perplexity:exec -- --prompt "..."`
- Cursor workflows
  - Validate `perplexity-browser-research` e2e with real BRAVE_API_KEY and PERPLEXITY_API_KEY
  - Add a second workflow for “PR deep-dive” (filesystem diff → research → recommendations)
- CI/CD improvements
  - Add npm/pip caching to heavy workflows
  - Add a nightly “Perplexity canary” job to validate API health and latency
- Security & compliance
  - Confirm secrets sourcing via CI/host env only; secret scanning in CI

## Milestones
1) Perplexity robustness + tests (today)
2) Cursor e2e workflows validated (today/tomorrow)
3) Prompt expansion + CLI convenience (this week)
4) CI caching + nightly canary (this week)

# Current execution step: "4. Proposed Solution"
- Eg. "2. Create the task file"

# Task Progress
[Change history with timestamps]

# Final Review:
[Post-completion summary]
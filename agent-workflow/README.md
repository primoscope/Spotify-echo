# 🤖 Continuous Coding Agent Workflow

This folder contains the analysis, summaries, and task definitions for the continuous coding agent workflow.

## Structure

- `summaries/` - PR completion summaries and analysis
- `tasks/` - Generated tasks for next development cycle
- `prompts/` - Generated prompts for coding agent
- `progress/` - Progress tracking and status updates
- `config/` - Configuration for the continuous agent

## Workflow

1. **PR Completion**: When a PR is merged, the system generates a summary
2. **Analysis**: The summary is analyzed to identify important issues and next tasks
3. **Task Generation**: New development tasks are created based on the analysis
4. **Prompt Creation**: Coding agent prompts are generated for the new tasks
5. **PR Creation**: A new PR is automatically created with the coding agent
6. **Cycle Repeat**: The process continues automatically

## Files

- `current-status.json` - Current status of the workflow
- `last-analysis.md` - Latest analysis summary
- `next-tasks.json` - Queue of pending tasks
# Continuous Coding Agent - Setup Guide

## Overview

The Continuous Coding Agent is an automated development workflow system that analyzes completed pull requests, generates development tasks, and creates new coding agent prompts to continue development automatically.

## Setup Instructions

### 1. Configure GitHub Personal Access Token

Create a GitHub Personal Access Token with full permissions:

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Select all scopes for full permissions:
   - `repo` - Full control of private repositories
   - `workflow` - Update GitHub Action workflows
   - `write:packages` - Upload packages to GitHub Package Registry
   - `delete:packages` - Delete packages from GitHub Package Registry
   - `admin:org` - Full control of orgs and teams
   - `admin:public_key` - Full control of user public keys
   - `admin:repo_hook` - Full control of repository hooks
   - `admin:org_hook` - Full control of organization hooks
   - `gist` - Create gists
   - `notifications` - Access notifications
   - `user` - Update ALL user data
   - `delete_repo` - Delete repositories
   - `write:discussion` - Write team discussions
   - `write:enterprise` - Write enterprise data

4. Copy the token and add it to repository secrets as `GH_PAT`

### 2. Repository guration

Add the following ository:

- **Name**: `GH_PAT`
- **Value**: Your GitHub Personal Access Token

### 3. Enable Workflow

The continuous agent workflow will automatically trigger when:
- Files in the `agent-workflow/` directory are modified
- A manual workflow dispatch is triggered

### 4. Manual Operation

You can also run the agent manually:

```bash
# Run full cycle
npm run agent:run

# Analyze only (no GitHub issue creation)
npm run agent:analyze

# Create GitHub issue only
npm run agent:create-issue

# Check status
npm run agent:status

# View configuration
npm run agent:config

# Enable/disable agent
npm run agent:enable
npm run agent:disable
```

## How It Works

### 1. PR Analysis
When a pull request is merged, the agent:
- Analyzes the commit history
- Extracts changed files and statistics
- Categorizes the types of changes
- Generates a summary of the work completed

### 2. Task Generation
Based on the analysis, the agent creates intelligent tasks:
- **Code Enhancement**: For JavaScript/Python changes
- **Workflow Optimization**: For CI/CD changes
- **Documentation Updates**: For documentation changes
- **General Improvements**: Default tasks for system enhancement

### 3. Prompt Creation
The agent generates detailed prompts for coding agents:
- Task descriptions and priorities
- Project context and tech stack information
- Success criteria and coding standards
- Specific instructions for implementation

### 4. GitHub Integration
With proper permissions, the agent:
- Creates GitHub issues with detailed task descriptions
- Assigns appropriate labels and priorities
- Links to the original PR and context
- Triggers new development cycles

### 5. Progress Tracking
The system maintains comprehensive progress tracking:
- Updates README with current development status
- Tracks cycle history and completion rates
- Monitors task generation and success metrics
- Provides audit trails for all operations

## Configuration

### Agent Configuration (`agent-workflow/config/config.json`)
```json
{
  "enabled": true,
  "auto_create_pr": true,
  "auto_merge": false,
  "analysis_model": "gemini-1.5-flash",
  "max_concurrent_tasks": 3,
  "readme_update_enabled": true,
  "task_categories": [
    "feature-development",
    "bug-fixes",
    "performance-optimization",
    "testing-improvements",
    "documentation-updates",
    "security-enhancements"
  ]
}
```

### Workflow Settings
The GitHub workflow can be configured with:
- **Execution modes**: full, analyze, create-issue, status
- **Force run**: Override disabled state
- **Permissions**: Automatic permission management

## Monitoring

### Status Checking
```bash
# Check current status
npm run agent:status

# View last analysis
cat agent-workflow/last-analysis.md

# Check cycle history
ls agent-workflow/progress/
```

### Logs and Debugging
- GitHub Actions logs show detailed execution
- Local execution provides console output
- Error handling creates detailed reports
- Artifacts are saved for troubleshooting

## Security

- All GitHub operations require proper authentication
- Token validation before API operations
- Secure environment variable handling
- Comprehensive error handling and logging

## Troubleshooting

### Common Issues
1. **No GitHub token**: Set GH_PAT 
2. **Workflow not triggering**: Ensure files are committed to agent-workflow/
3. **Permission denied**: Verify token has all required scopes
4. **Rate limiting**: GitHub API rate limits may delay operations

### Debug Mode
```bash
# Run with debug output
DEBUG=true node scripts/continuous-agent.js full
```

## Maintenance

The system is designed to be self-maintaining:
- Automatic error recovery
- Graceful degradation without GitHub token
- Comprehensive logging and monitoring
- Regular status updates and health checks

For support, check the GitHub repository issues or create a new issue with detailed error information.
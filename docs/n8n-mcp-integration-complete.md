# n8n MCP Integration for EchoTune AI

## Overview

This document describes the integration between EchoTune AI and the self-hosted n8n instance using the n8n-mcp server.

### Connection Details

- **n8n Instance**: http://46.101.106.220  
- **Login**: willexmen8@gmail.com
- **API Key**: Configured in .env file
- **MCP Integration**: n8n-mcp package v2.10.2

## Available MCP Tools

The n8n-mcp server provides 39 tools for workflow automation:

### Core Workflow Management
- `n8n_list_workflows` - List all workflows with filtering
- `n8n_get_workflow` - Get complete workflow by ID  
- `n8n_create_workflow` - Create new workflows
- `n8n_update_workflow` - Update existing workflows
- `n8n_delete_workflow` - Delete workflows
- `n8n_validate_workflow` - Validate workflow configurations

### Execution Management
- `n8n_trigger_webhook_workflow` - Trigger workflows via webhook
- `n8n_get_execution` - Get execution details
- `n8n_list_executions` - List workflow executions
- `n8n_delete_execution` - Delete execution records

### Node Discovery & Documentation
- `list_nodes` - Browse 525+ available n8n nodes
- `search_nodes` - Find nodes by functionality
- `get_node_info` - Get detailed node information
- `get_node_essentials` - Get essential node properties
- `list_ai_tools` - Discover AI-capable nodes

### Validation & Configuration
- `validate_node_operation` - Validate node configurations
- `validate_workflow` - Complete workflow validation
- `validate_workflow_connections` - Check workflow structure
- `get_node_for_task` - Get pre-configured node templates

### System Tools
- `n8n_health_check` - Check n8n API connectivity
- `n8n_diagnostic` - Troubleshoot configuration issues
- `tools_documentation` - Get documentation for any tool

## Usage Patterns

### 1. Spotify Data Processing
```
Webhook → Code (Validation) → HTTP Request (Save to DB) → Response
```
**Webhook URL**: http://46.101.106.220/webhook/spotify-data  
**Method**: POST  
**Payload**: { user_id, tracks[] }

### 2. Scheduled Analytics
```
Schedule Trigger → HTTP Request (Fetch Data) → Code (Process) → MongoDB (Save)
```
**Schedule**: Daily at 2 AM UTC  
**Purpose**: Generate daily user analytics

### 3. Health Monitoring  
```
Interval Trigger → HTTP Request (Health Check) → IF (Check Status) → Alert/Log
```
**Interval**: Every 15 minutes  
**Purpose**: Monitor MCP server health

## Configuration Commands

```bash
# Start n8n MCP integration
npm run mcp:n8n_mcp

# Test integration
node scripts/test-n8n-mcp-integration.js

# Use integration script
node scripts/n8n-integration.js

# Health check
curl http://46.101.106.220/healthz
```

## Webhook Testing

```bash
# Test Spotify data webhook
curl -X POST "http://46.101.106.220/webhook/spotify-data" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "tracks": [
      {"id": "track1", "name": "Test Song", "artist": "Test Artist"}
    ]
  }'
```

## Integration with EchoTune AI

### Environment Setup
```bash
N8N_API_URL=http://46.101.106.220
N8N_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
N8N_USERNAME=willexmen8@gmail.com
N8N_PASSWORD=DapperMan77$$
N8N_MCP_PORT=3019
```

### MCP Server Configuration
```json
{
  "n8n-mcp": {
    "command": "npx",
    "args": ["n8n-mcp"],
    "env": {
      "MCP_MODE": "stdio",
      "LOG_LEVEL": "info",
      "DISABLE_CONSOLE_OUTPUT": "false",
      "N8N_API_URL": "${N8N_API_URL}",
      "N8N_API_KEY": "${N8N_API_KEY}"
    }
  }
}
```

## Troubleshooting

### Connection Issues
1. Check n8n instance is running: `curl http://46.101.106.220/healthz`
2. Verify API key is valid
3. Ensure n8n-mcp package is installed

### Workflow Creation Issues  
1. Use MCP tools instead of direct API
2. Validate workflow structure before creation
3. Check node configurations are correct

### Webhook Issues
1. Verify webhook paths in workflow configuration
2. Test with curl commands
3. Check workflow is active

## Next Steps

1. Create production workflows using MCP tools
2. Set up proper error handling and notifications
3. Configure Spotify OAuth credentials  
4. Implement data persistence workflows
5. Set up monitoring and alerting
6. Create workflow templates for common tasks

---

**Status**: ✅ Fully Operational  
**Last Updated**: August 17, 2025  
**Integration**: n8n-mcp v2.10.2 with EchoTune AI

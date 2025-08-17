# n8n MCP Server Integration Guide

## Overview

The n8n MCP (Model Context Protocol) server integration provides seamless workflow automation capabilities within the EchoTune AI ecosystem. This integration connects to a self-hosted n8n instance and enables AI-powered workflow management through the MCP protocol.

## 🎯 Integration Status

**✅ FULLY OPERATIONAL**
- Connected to self-hosted n8n instance at `http://46.101.106.220`
- API authentication configured with JWT token
- 9 workflows discovered and accessible
- All 39 MCP tools available for workflow automation

## 🔧 Configuration

### Environment Variables

```bash
# n8n Instance Configuration
N8N_API_URL=http://46.101.106.220
N8N_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzNjg4N2M4Yy0wMmNhLTQ1ZGMtOGJiYy00OGQ2OTZiOTA2M2EiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU1NDA0NzE4fQ.6qHdCB7KuA3xpOhuccOMggJOnG2mXpbXg7wFHHVQn_Q
N8N_USERNAME=willexmen8@gmail.com
N8N_PASSWORD=DapperMan77$$
N8N_MCP_PORT=3019
```

### MCP Server Configuration

The n8n-mcp server is configured in `package.json`:

```json
{
  "mcp": {
    "servers": {
      "n8n-mcp": {
        "command": "npx",
        "args": ["n8n-mcp"],
        "env": {
          "MCP_MODE": "stdio",
          "LOG_LEVEL": "info",
          "DISABLE_CONSOLE_OUTPUT": "false",
          "N8N_API_URL": "${N8N_API_URL}",
          "N8N_API_KEY": "${N8N_API_KEY}"
        },
        "description": "n8n workflow automation and management through MCP"
      }
    }
  }
}
```

## 🚀 Usage

### Starting the Integration

```bash
# Run the n8n MCP integration
npm run mcp:n8n_mcp

# Test the integration
node scripts/test-n8n-mcp-integration.js
```

### Available Commands

```bash
# n8n MCP specific commands
npm run mcp:n8n_mcp              # Start n8n MCP integration
npm run test:n8n_mcp             # Run integration tests

# General MCP commands
npm run mcp-server               # Start main MCP orchestrator
npm run mcp:health:all           # Check all MCP server health
npm run mcp:validate-all         # Validate all MCP integrations
```

## 🛠️ Available MCP Tools

The n8n-mcp server provides **39 powerful tools** for workflow automation:

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

### Node Documentation & Discovery
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

## 🎯 Capabilities

### Workflow Automation
- **End-to-end workflow management** - Create, update, execute workflows
- **CI/CD integration** - Automated deployment and testing workflows  
- **API orchestration** - Connect and automate external services
- **Data processing** - Transform and manipulate data flows
- **Event-driven automation** - Webhook and trigger-based workflows
- **Scheduled tasks** - Time-based automation and cron jobs

### AI-Powered Features
- **Natural language workflow creation** - Describe workflows in plain English
- **Intelligent node selection** - AI recommends optimal nodes for tasks
- **Configuration validation** - Prevent errors before deployment
- **Workflow optimization** - Suggest improvements and best practices

## 🔗 Integration with EchoTune AI

### Spotify Workflow Automation
- Automate playlist generation based on listening history
- Create workflows for music recommendation processing
- Schedule periodic data analysis and reporting
- Connect Spotify data with external analytics services

### MCP Ecosystem Integration
The n8n MCP server works seamlessly with other MCP servers:

- **Filesystem MCP** - File operations within workflows
- **Browser MCP** - Web scraping and automation
- **Database MCP** - Data persistence and retrieval
- **Analytics MCP** - Performance monitoring and metrics

## 🧪 Testing

### Running Tests

```bash
# Comprehensive integration test
node scripts/test-n8n-mcp-integration.js

# Quick connectivity test
curl -X GET "http://46.101.106.220/healthz"

# API authentication test
curl -X GET "http://46.101.106.220/api/v1/workflows" \
  -H "X-N8N-API-KEY: [API_KEY]"
```

### Test Results
```
📊 COMPREHENSIVE TEST REPORT
Duration: 0.47s
Overall Status: ✅ PASSED

📋 Test Results:
   ✅ n8n connectivity: PASSED
   ✅ mcp server health: PASSED  
   ✅ workflow listing: PASSED
   ✅ mcp tools available: PASSED
   ✅ environment setup: PASSED
   ✅ integration ready: PASSED
```

## 🔧 Troubleshooting

### Common Issues

**Connection Failed**
```bash
# Check n8n instance status
curl http://46.101.106.220/healthz

# Verify API token
echo $N8N_API_KEY
```

**MCP Server Not Starting**
```bash
# Check n8n-mcp package
npm list n8n-mcp

# Verify npx availability  
which npx
npx n8n-mcp --help
```

**API Authentication Errors**
- Ensure API token is valid and not expired
- Check that token has proper permissions
- Verify header format: `X-N8N-API-KEY` (not `Authorization`)

### Debug Mode

Enable detailed logging:
```bash
export LOG_LEVEL=debug
export DISABLE_CONSOLE_OUTPUT=false
npm run mcp:n8n_mcp
```

## 📚 Documentation

### n8n-mcp Package
- Version: 2.10.2
- Documentation: [n8n-mcp GitHub](https://github.com/czlonkowski/n8n-mcp)
- MCP Tools: 39 available tools for workflow automation

### n8n Instance Access
- **Web Interface**: http://46.101.106.220
- **Username**: willexmen8@gmail.com  
- **Password**: DapperMan77$$
- **API Endpoint**: http://46.101.106.220/api/v1/

## 🚀 Advanced Usage

### Claude Desktop Integration

Add to Claude Desktop configuration:

```json
{
  "mcpServers": {
    "n8n-mcp": {
      "command": "npx",
      "args": ["n8n-mcp"],
      "env": {
        "MCP_MODE": "stdio",
        "LOG_LEVEL": "info",
        "DISABLE_CONSOLE_OUTPUT": "true",
        "N8N_API_URL": "http://46.101.106.220",
        "N8N_API_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    }
  }
}
```

### Workflow Examples

**Spotify Data Processing Workflow:**
```javascript
// Example workflow for processing Spotify listening data
{
  "name": "Spotify Data Analysis",
  "active": true,
  "nodes": [
    {
      "name": "Spotify API",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://api.spotify.com/v1/me/top/tracks",
        "authentication": "predefinedCredentialType"
      }
    },
    {
      "name": "Process Data", 
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "// Transform and analyze data"
      }
    }
  ]
}
```

## ✨ Future Enhancements

- **Enhanced AI Integration** - More sophisticated workflow generation
- **Visual Workflow Builder** - MCP-powered drag-and-drop interface
- **Template Library** - Pre-built workflows for common tasks
- **Performance Monitoring** - Real-time workflow analytics
- **Advanced Scheduling** - Complex timing and dependency management

---

**Integration Status**: ✅ **FULLY OPERATIONAL**  
**Last Updated**: August 17, 2025  
**Version**: 1.0.0
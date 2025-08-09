# EchoTune AI — MCP Servers Documentation

This document provides comprehensive information about MCP (Model Context Protocol) servers configured in EchoTune AI, including setup, validation, and environment requirements.

## Configured Servers

### Core MCP Servers

#### 1. mcpHealth
- **Purpose**: Health monitoring and system diagnostics
- **Command**: `node health.js`
- **Port**: 3001
- **Health Path**: `/health`
- **Environment Variables**: None required
- **Status**: ✅ Always available

#### 2. mcpOrchestrator  
- **Purpose**: MCP server orchestration and coordination
- **Command**: `node enhanced-mcp-orchestrator.js`
- **Port**: 3002
- **Health Path**: `/health`
- **Environment Variables**: None required
- **Status**: ✅ Always available

#### 3. mcpWorkflow
- **Purpose**: Workflow management and execution
- **Command**: `node workflow-manager.js`
- **Port**: 3003
- **Health Path**: `/status`
- **Environment Variables**: None required  
- **Status**: ✅ Always available

### Optional MCP Servers

#### 4. browserbase
- **Purpose**: Cloud browser automation service
- **Command**: `npx @browserbasehq/mcp-server-browserbase`
- **Port**: 3010
- **Health Path**: `/health`
- **Environment Variables**: 
  - `BROWSERBASE_API_KEY` (required)
  - `BROWSERBASE_PROJECT_ID` (required)
- **Status**: 🔄 Environment-gated (starts only when env vars are present)
- **Behavior**: Gracefully skipped when environment variables are missing

## Environment Variables Setup

### Local Development (.env)

```bash
# Core MCP - No additional vars needed
NODE_ENV=development
MCP_SERVER_VALIDATION=true

# Browserbase (Optional) - Add only if you have Browserbase account
BROWSERBASE_API_KEY=your_browserbase_api_key_here
BROWSERBASE_PROJECT_ID=your_browserbase_project_id_here
```

### Production Environment

Set the following environment variables in your deployment platform:

```bash
# Required for all environments
NODE_ENV=production

# Optional - Browserbase Integration
BROWSERBASE_API_KEY=<your_browserbase_api_key>
BROWSERBASE_PROJECT_ID=<your_browserbase_project_id>
```

## Validation Commands

### Local Validation

```bash
# Install MCP dependencies
npm run mcp:install

# Health check all configured servers  
npm run mcp:health

# Run integration tests
npm run mcp:test

# Generate status report
npm run mcp:report

# Complete validation pipeline
npm run mcp:validate
```

### CI Validation Pipeline

The CI system runs the following validation sequence:

1. **Install Phase**: `node scripts/mcp-manager.js install`
2. **Health Check Phase**: `node scripts/mcp-manager.js health`
3. **Integration Test Phase**: `node scripts/mcp-manager.js test`
4. **Report Generation Phase**: `node scripts/mcp-manager.js report`

### Expected Behavior

#### With Browserbase Environment Variables
```bash
$ npm run mcp:health

🔍 MCP health check
→ mcpHealth @ http://localhost:3001/health
✅ mcpHealth: healthy
→ mcpOrchestrator @ http://localhost:3002/health
✅ mcpOrchestrator: healthy
→ mcpWorkflow @ http://localhost:3003/status
✅ mcpWorkflow: healthy
→ browserbase @ http://localhost:3010/health
✅ browserbase: healthy
```

#### Without Browserbase Environment Variables
```bash
$ npm run mcp:health

🔍 MCP health check
→ mcpHealth @ http://localhost:3001/health
✅ mcpHealth: healthy
→ mcpOrchestrator @ http://localhost:3002/health
✅ mcpOrchestrator: healthy
→ mcpWorkflow @ http://localhost:3003/status
✅ mcpWorkflow: healthy
→ browserbase @ http://localhost:3010/health
⚠️ browserbase: skipped (missing env vars: BROWSERBASE_API_KEY, BROWSERBASE_PROJECT_ID)
```

## API Endpoints

### Enhanced MCP API Routes

The following API endpoints are available for MCP integration:

#### Health and Status
- `GET /api/enhanced-mcp/health` - Overall system health
- `GET /api/enhanced-mcp/capabilities` - System capabilities overview

#### Workflow Endpoints
- `POST /api/enhanced-mcp/workflow/full-stack` - Full-stack development workflow
- `POST /api/enhanced-mcp/workflow/code-review` - Code review and optimization
- `POST /api/enhanced-mcp/workflow/bug-fix` - Bug diagnosis and fix workflow

## Adding New MCP Servers

### Step 1: Update mcp-server/package.json

Add your server to the `servers` block:

```json
{
  "servers": {
    "your-server-name": {
      "command": "node", 
      "args": ["your-server-script.js"],
      "port": 3011,
      "healthPath": "/health",
      "requiredEnv": ["YOUR_API_KEY"],
      "env": {
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "your-server-name"
      },
      "timeout": 30000,
      "retries": 3
    }
  }
}
```

### Step 2: Update mcp-registry.json

Add comprehensive metadata:

```json
{
  "servers": {
    "your-server-name": {
      "name": "your-server-name",
      "type": "mcp-config",
      "source": "package.json",
      "command": "node",
      "args": ["your-server-script.js"],
      "env": ["YOUR_API_KEY"],
      "requiredEnv": ["YOUR_API_KEY"],
      "envPassthrough": ["YOUR_API_KEY"],
      "description": "Description of what your server does",
      "notes": "Environment-gated startup behavior or other notes",
      "categories": ["development-tools"],
      "capabilities": ["your-capability"],
      "status": "configured",
      "addedDate": "2025-01-17T00:00:00.000Z",
      "lastUpdated": "2025-01-17T00:00:00.000Z"
    }
  }
}
```

### Step 3: Update Documentation

- Add server description to this file
- Document any environment variable requirements
- Update validation commands if needed

### Step 4: Test Integration

```bash
# Test your server addition
npm run mcp:install
npm run mcp:health
npm run mcp:test
npm run mcp:report
```

## Troubleshooting

### Common Issues

#### Server Won't Start
1. Check if all required environment variables are set
2. Verify the server script exists and is executable
3. Check port availability (default: 3001-3010)
4. Review server logs for specific error messages

#### Health Check Failures
1. Ensure the server exposes the correct health endpoint
2. Check if the server is running on the expected port
3. Verify health endpoint returns a 200 status code
4. Check for network connectivity issues

#### Environment Variable Issues
1. Verify `.env` file is present and properly formatted
2. Check that required variables are not empty or undefined
3. Ensure environment variables are passed through correctly
4. Test with minimal configuration first

### Debug Commands

```bash
# Check which servers are configured
node -e "console.log(JSON.stringify(require('./mcp-server/package.json').servers, null, 2))"

# Test individual server health
curl -f http://localhost:3001/health
curl -f http://localhost:3002/health  
curl -f http://localhost:3003/status

# Check environment variables
node -e "console.log('BROWSERBASE_API_KEY:', process.env.BROWSERBASE_API_KEY ? 'Set' : 'Not set')"
```

## Security Considerations

- Never commit API keys or secrets to version control
- Use environment variables for all sensitive configuration
- Implement proper error handling to avoid exposing sensitive information in logs
- Regularly rotate API keys and update environment variables
- Monitor server logs for unauthorized access attempts

## Support

For additional help with MCP server configuration:

1. Review the [MCP Integration Guide](./MCP_INTEGRATION.md)
2. Check server-specific documentation in `mcp-server/` directory
3. Review CI workflow logs for detailed error information
4. Test locally before deploying to production

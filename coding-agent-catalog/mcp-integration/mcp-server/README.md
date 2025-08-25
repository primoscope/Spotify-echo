# 🔌 EchoTune AI MCP Server Ecosystem

This directory contains the comprehensive MCP (Model Context Protocol) server ecosystem for EchoTune AI, including the new **Coding Agent Workflow Analysis & Optimization** server.

## MCP Servers Available

### 1. **Enhanced MCP Orchestrator** (`enhanced-mcp-orchestrator.js`)
Main coordination server for the MCP ecosystem.

### 2. **Coding Agent Workflow Analyzer** (`coding-agent-mcp-server.js`) ⭐ **NEW**
Advanced workflow analysis and optimization server that:
- Analyzes GitHub Actions workflows for agent configurations
- Validates syntax, security, and performance
- Provides automated fixes and optimization recommendations
- Integrates with PR-driven execution

### 3. **Workflow Manager** (`workflow-manager.js`)
Manages workflow execution and coordination.

### 4. **Health Monitor** (`enhanced-health-monitor.js`)
Comprehensive health monitoring for all MCP services.

### 5. **Health Server** (`health.js`)
Basic health check server for CI integration.

## Quick Start

### Option 1: Start All Servers
```bash
npm install
npm run mcp-server  # Starts main orchestrator
```

### Option 2: Start Specific Server
```bash
# Coding Agent Workflow Analyzer (NEW)
node mcp-server/coding-agent-mcp-server.js

# Main orchestrator
node mcp-server/enhanced-mcp-orchestrator.js

# Health monitor
node mcp-server/enhanced-health-monitor.js

# Basic health server
npm run start:health
```

### Option 3: Development Mode
```bash
npm run dev  # Starts with auto-reload
```

## Health Checks

```bash
# Main orchestrator
curl http://localhost:3001/health

# Coding Agent Analyzer (NEW)
curl http://localhost:3002/health

# Basic health server
npm run health

# Check all services
curl http://localhost:3001/mcp/status
```

## New: Coding Agent Workflow Analysis

The new **Coding Agent Workflow Analyzer** provides comprehensive analysis of:

- ✅ GitHub Actions workflows
- ✅ Copilot configurations  
- ✅ Agent automation scripts
- ✅ Custom instructions and prompts
- ✅ Security vulnerabilities
- ✅ Performance optimizations

### Key Features
- **PR-Driven Analysis**: Triggers from PR comments (`/analyze-workflows`)
- **Automated Fixes**: Safe fixes for common workflow issues  
- **Security Scanning**: Identifies privilege escalation and secret exposure
- **Performance Tuning**: Recommends caching, timeouts, parallelization
- **Integration Testing**: Validates MCP ecosystem compatibility

### API Endpoints
- `POST /analyze` - Comprehensive workflow analysis
- `POST /validate` - Syntax and logic validation
- `GET /optimize` - Optimization recommendations  
- `POST /fix` - Automated issue fixes
- `POST /trigger` - PR-triggered analysis

### Usage Examples

#### Manual Analysis
```bash
# Start the analyzer server
node mcp-server/coding-agent-mcp-server.js

# Run analysis
curl -X POST http://localhost:3002/analyze

# Get optimization plan
curl http://localhost:3002/optimize

# Apply safe fixes
curl -X POST -H "Content-Type: application/json" \
  -d '{"fixType": "safe"}' \
  http://localhost:3002/fix
```

#### PR Integration
Use slash commands in PR comments:
- `/analyze-workflows` - Run comprehensive analysis
- `/validate-workflows` - Validate all workflows  
- `/optimize-workflows` - Get optimization recommendations
- `/fix-workflows` - Apply automated fixes

## Environment Configuration

```env
# MCP Server Ports
MCP_PORT=3001                    # Main orchestrator
MCP_CODING_AGENT_PORT=3002      # Coding agent analyzer (NEW)
MCP_HEALTH_PORT=3003            # Health monitor
MCP_WORKFLOW_PORT=3004          # Workflow manager

# Development
NODE_ENV=development
DEBUG=mcp:*

# GitHub Integration (for PR functionality)
GITHUB_TOKEN=your_github_token
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│                GitHub Actions                   │
│  ┌─────────────────────────────────────────────┤
│  │        Workflow Analyzer (NEW)              │
│  │     coding-agent-mcp-server.js              │
│  │         Port: 3002                          │
│  └─────────────────────────────────────────────┤
│                      │                         │
│  ┌─────────────────────────────────────────────┤
│  │         MCP Orchestrator                    │
│  │    enhanced-mcp-orchestrator.js             │
│  │         Port: 3001                          │
│  └─────────────────────────────────────────────┤
│                      │                         │
│  ┌─────────────────────────────────────────────┤
│  │    Health Monitor │ Workflow Manager       │
│  │   Port: 3003      │    Port: 3004          │
│  └─────────────────────────────────────────────┘
└─────────────────────────────────────────────────┘
```

## CI Integration

The MCP servers integrate with GitHub Actions workflows for:
- Automated analysis on PR changes
- Security scanning and validation
- Performance optimization recommendations
- Status reporting via PR comments

The `scripts/mcp-manager.js` will read the servers block in this file and ephemeral-start each server to probe `/health` in CI.

## Development

### Adding New MCP Servers
1. Create server file in `mcp-server/`
2. Implement MCP protocol endpoints
3. Add health check endpoint
4. Register with orchestrator
5. Update documentation

### Testing
```bash
# Test the new coding agent analyzer
npm test tests/coding-agent-workflow.test.js

# Test all MCP components
npm test
```

### Debugging
```bash
# Enable debug logging
DEBUG=mcp:* node mcp-server/coding-agent-mcp-server.js

# Monitor all servers
DEBUG=* npm run mcp-server
```

## Integration Points

The MCP servers integrate with:
- **GitHub Actions**: Workflow analysis and automation
- **Copilot**: Configuration validation and optimization
- **Agent Systems**: Automated coding and testing
- **Spotify API**: Music recommendation services
- **Database**: MongoDB and Supabase connections
- **External MCP**: Community MCP server integrations

## Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check port usage
   lsof -i :3002
   
   # Use different port
   MCP_CODING_AGENT_PORT=3005 node mcp-server/coding-agent-mcp-server.js
   ```

2. **Server Not Starting**
   ```bash
   # Check dependencies
   npm install
   
   # Verify Node.js version
   node --version  # Should be 20+
   ```

3. **GitHub Integration Issues**
   ```bash
   # Verify token permissions
   curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user
   ```

### Health Monitoring

```bash
# Check individual servers
curl http://localhost:3001/health  # Orchestrator
curl http://localhost:3002/health  # Coding Agent Analyzer
curl http://localhost:3003/health  # Health Monitor

# Check comprehensive status
curl http://localhost:3001/mcp/status
```

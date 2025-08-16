# MCP Servers Integration Guide

## Installed MCP Servers

### Filesystem MCP Server

**Command**: `node mcp-servers/filesystem/index.js`
**Capabilities**: file_operations, directory_management, code_analysis, secure_operations
**Workflow Integration**: ✅ Enabled


**Usage**:
```bash
npm run mcp:filesystem
```

### Memory MCP Server

**Command**: `node mcp-servers/memory/index.js`
**Capabilities**: persistent_context, knowledge_graph, conversation_history, session_management
**Workflow Integration**: ✅ Enabled


**Usage**:
```bash
npm run mcp:memory
```

### Sequential Thinking Server

**Command**: `node mcp-servers/sequential-thinking/dist/index.js`
**Capabilities**: reasoning, step_by_step_thinking, problem_solving, decision_making
**Workflow Integration**: ✅ Enabled


**Usage**:
```bash
npm run mcp:sequential-thinking
```

### GitHub Repos Manager MCP

**Command**: `node mcp-servers/github-repos-manager/index.js`
**Capabilities**: github_automation, repository_management, issue_management, pull_requests
**Workflow Integration**: ✅ Enabled
**Required Environment Variables**: GITHUB_TOKEN, GITHUB_PAT

**Usage**:
```bash
npm run mcp:github-repos-manager
```

### Brave Search MCP

**Command**: `node mcp-servers/brave-search/brave-search-mcp.js`
**Capabilities**: web_search, privacy_search, research, documentation_search
**Workflow Integration**: ✅ Enabled
**Required Environment Variables**: BRAVE_API_KEY

**Usage**:
```bash
npm run mcp:brave-search
```

### Perplexity MCP Server

**Command**: `node mcp-servers/perplexity-mcp/index.js`
**Capabilities**: ai_research, web_search, deep_analysis, grok4_equivalent
**Workflow Integration**: ✅ Enabled
**Required Environment Variables**: PERPLEXITY_API_KEY

**Usage**:
```bash
npm run mcp:perplexity-mcp
```

### Analytics Server

**Command**: `node mcp-servers/analytics-server/index.js`
**Capabilities**: metrics, performance_monitoring, system_health, telemetry
**Workflow Integration**: ❌ Disabled


**Usage**:
```bash
npm run mcp:analytics-server
```

### Code Sandbox Server

**Command**: `node mcp-servers/code-sandbox/index.js`
**Capabilities**: secure_execution, javascript_python, validation, testing
**Workflow Integration**: ✅ Enabled


**Usage**:
```bash
npm run mcp:code-sandbox
```


## Startup Configuration

### Start All MCP Servers
```bash
npm run mcp:start:all
```

### Start Individual Servers
```bash
npm run mcp:filesystem
```

```bash
npm run mcp:memory
```

```bash
npm run mcp:sequential-thinking
```

```bash
npm run mcp:github-repos-manager
```

```bash
npm run mcp:brave-search
```

```bash
npm run mcp:perplexity-mcp
```

```bash
npm run mcp:analytics-server
```

```bash
npm run mcp:code-sandbox
```

## Validation and Testing

### Validate All Servers
```bash
node validate-all-mcp-servers.js
```

### Health Check
```bash
npm run mcp:health-check
```

## Workflow Integration

The MCP servers are integrated into GitHub workflows through:

1. **Automated Validation**: All servers are validated on each workflow run
2. **Environment Variables**: Required API keys are configured via GitHub secrets
3. **Startup Scripts**: Servers can be started individually or collectively
4. **Health Monitoring**: Continuous health checks ensure server availability

### Required GitHub Secrets

- `GITHUB_TOKEN`: GitHub Personal Access Token for repository management
- `GITHUB_PAT`: GitHub Personal Access Token (alternative to GITHUB_TOKEN)
- `BRAVE_API_KEY`: Brave Search API key for web search capabilities
- `PERPLEXITY_API_KEY`: Perplexity API key for AI research and analysis

## Architecture

The MCP server ecosystem is orchestrated through:
- **Enhanced MCP Orchestrator**: Central coordination of all servers
- **Individual Server Scripts**: Direct access to specific server functionality  
- **Workflow Integration**: Automated testing and validation
- **Health Monitoring**: Continuous availability checks

# 🔧 MCP Installation Instructions

**Generated:** 2025-08-08T21:59:04.102Z

## 📦 New MCP Servers to Install

### 1. n8n-mcp

**Installation:**
```bash
# Install the MCP server
npm install n8n-mcp

# Add to MCP orchestrator configuration
# Update mcp-server/orchestration-engine.js
```

**Configuration:**
```javascript
// Add to mcp-server/orchestration-engine.js
const n8nMcp = {
  name: 'n8n-mcp',
  package: 'n8n-mcp',
  description: 'Integration between n8n workflow automation and Model Context Protocol (MCP)',
  enabled: true,
  priority: high
};
```

**Validation:**
```bash
# Test the new MCP server
node scripts/test-community-mcp-servers.js --server=n8n-mcp
```

### 2. mcp-server-code-runner

**Installation:**
```bash
# Install the MCP server
npm install mcp-server-code-runner

# Add to MCP orchestrator configuration
# Update mcp-server/orchestration-engine.js
```

**Configuration:**
```javascript
// Add to mcp-server/orchestration-engine.js
const mcpServerCodeRunner = {
  name: 'mcp-server-code-runner',
  package: 'mcp-server-code-runner',
  description: 'Code Runner MCP Server',
  enabled: true,
  priority: high
};
```

**Validation:**
```bash
# Test the new MCP server
node scripts/test-community-mcp-servers.js --server=mcp-server-code-runner
```

### 3. xcodebuildmcp

**Installation:**
```bash
# Install the MCP server
npm install xcodebuildmcp

# Add to MCP orchestrator configuration
# Update mcp-server/orchestration-engine.js
```

**Configuration:**
```javascript
// Add to mcp-server/orchestration-engine.js
const xcodebuildmcp = {
  name: 'xcodebuildmcp',
  package: 'xcodebuildmcp',
  description: 'XcodeBuildMCP is a ModelContextProtocol server that provides tools for Xcode project management, simulator management, and app utilities.',
  enabled: true,
  priority: high
};
```

**Validation:**
```bash
# Test the new MCP server
node scripts/test-community-mcp-servers.js --server=xcodebuildmcp
```

### 4. puppeteer-mcp-server

**Installation:**
```bash
# Install the MCP server
npm install puppeteer-mcp-server

# Add to MCP orchestrator configuration
# Update mcp-server/orchestration-engine.js
```

**Configuration:**
```javascript
// Add to mcp-server/orchestration-engine.js
const puppeteerMcpServer = {
  name: 'puppeteer-mcp-server',
  package: 'puppeteer-mcp-server',
  description: 'Experimental MCP server for browser automation using Puppeteer (inspired by @modelcontextprotocol/server-puppeteer)',
  enabled: true,
  priority: high
};
```

**Validation:**
```bash
# Test the new MCP server
node scripts/test-community-mcp-servers.js --server=puppeteer-mcp-server
```

### 5. @hisma/server-puppeteer

**Installation:**
```bash
# Install the MCP server
npm install @hisma/server-puppeteer

# Add to MCP orchestrator configuration
# Update mcp-server/orchestration-engine.js
```

**Configuration:**
```javascript
// Add to mcp-server/orchestration-engine.js
const HismaServerPuppeteer = {
  name: '@hisma/server-puppeteer',
  package: '@hisma/server-puppeteer',
  description: 'Fork and update (v0.6.5) of the original @modelcontextprotocol/server-puppeteer MCP server for browser automation using Puppeteer.',
  enabled: true,
  priority: high
};
```

**Validation:**
```bash
# Test the new MCP server
node scripts/test-community-mcp-servers.js --server=@hisma/server-puppeteer
```

### 6. mongodb-mcp-server

**Installation:**
```bash
# Install the MCP server
npm install mongodb-mcp-server

# Add to MCP orchestrator configuration
# Update mcp-server/orchestration-engine.js
```

**Configuration:**
```javascript
// Add to mcp-server/orchestration-engine.js
const mongodbMcpServer = {
  name: 'mongodb-mcp-server',
  package: 'mongodb-mcp-server',
  description: 'MongoDB Model Context Protocol Server',
  enabled: true,
  priority: high
};
```

**Validation:**
```bash
# Test the new MCP server
node scripts/test-community-mcp-servers.js --server=mongodb-mcp-server
```

### 7. jlowin/fastmcp

**Installation:**
```bash
# Install the MCP server
npm install @jlowin/fastmcp
# Or clone from source:
git clone undefined

# Add to MCP orchestrator configuration
# Update mcp-server/orchestration-engine.js
```

**Configuration:**
```javascript
// Add to mcp-server/orchestration-engine.js
const jlowinFastmcp = {
  name: 'jlowin/fastmcp',
  package: '@jlowin/fastmcp',
  description: '🚀 The fast, Pythonic way to build MCP servers and clients',
  enabled: true,
  priority: high
};
```

**Validation:**
```bash
# Test the new MCP server
node scripts/test-community-mcp-servers.js --server=jlowin/fastmcp
```

### 8. mcp-use/mcp-use

**Installation:**
```bash
# Install the MCP server
npm install @mcp-use/mcp-use
# Or clone from source:
git clone undefined

# Add to MCP orchestrator configuration
# Update mcp-server/orchestration-engine.js
```

**Configuration:**
```javascript
// Add to mcp-server/orchestration-engine.js
const mcpUseMcpUse = {
  name: 'mcp-use/mcp-use',
  package: '@mcp-use/mcp-use',
  description: 'mcp-use is the easiest way to interact with mcp servers with custom agents',
  enabled: true,
  priority: high
};
```

**Validation:**
```bash
# Test the new MCP server
node scripts/test-community-mcp-servers.js --server=mcp-use/mcp-use
```

### 9. nanbingxyz/5ire

**Installation:**
```bash
# Install the MCP server
npm install @nanbingxyz/5ire
# Or clone from source:
git clone undefined

# Add to MCP orchestrator configuration
# Update mcp-server/orchestration-engine.js
```

**Configuration:**
```javascript
// Add to mcp-server/orchestration-engine.js
const nanbingxyz5ire = {
  name: 'nanbingxyz/5ire',
  package: '@nanbingxyz/5ire',
  description: '5ire is a cross-platform desktop AI assistant, MCP client. It compatible with major service providers,  supports local knowledge base and  tools via model context protocol servers .',
  enabled: true,
  priority: high
};
```

**Validation:**
```bash
# Test the new MCP server
node scripts/test-community-mcp-servers.js --server=nanbingxyz/5ire
```

### 10. mendableai/firecrawl-mcp-server

**Installation:**
```bash
# Install the MCP server
npm install @mendableai/firecrawl-mcp-server
# Or clone from source:
git clone undefined

# Add to MCP orchestrator configuration
# Update mcp-server/orchestration-engine.js
```

**Configuration:**
```javascript
// Add to mcp-server/orchestration-engine.js
const mendableaiFirecrawlMcpServer = {
  name: 'mendableai/firecrawl-mcp-server',
  package: '@mendableai/firecrawl-mcp-server',
  description: '🔥 Official Firecrawl MCP Server - Adds powerful web scraping to Cursor, Claude and any other LLM clients.',
  enabled: true,
  priority: high
};
```

**Validation:**
```bash
# Test the new MCP server
node scripts/test-community-mcp-servers.js --server=mendableai/firecrawl-mcp-server
```


# 🔧 MCP Installation Instructions

**Generated:** 2025-08-08T21:57:26.109Z

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

### 2. googleapis/genai-toolbox

**Installation:**
```bash
# Install the MCP server
npm install @googleapis/genai-toolbox
# Or clone from source:
git clone undefined

# Add to MCP orchestrator configuration
# Update mcp-server/orchestration-engine.js
```

**Configuration:**
```javascript
// Add to mcp-server/orchestration-engine.js
const googleapisGenaiToolbox = {
  name: 'googleapis/genai-toolbox',
  package: '@googleapis/genai-toolbox',
  description: 'MCP Toolbox for Databases is an open source MCP server for databases.',
  enabled: true,
  priority: high
};
```

**Validation:**
```bash
# Test the new MCP server
node scripts/test-community-mcp-servers.js --server=googleapis/genai-toolbox
```

### 3. makalin/SecureMCP

**Installation:**
```bash
# Install the MCP server
npm install @makalin/SecureMCP
# Or clone from source:
git clone undefined

# Add to MCP orchestrator configuration
# Update mcp-server/orchestration-engine.js
```

**Configuration:**
```javascript
// Add to mcp-server/orchestration-engine.js
const makalinSecureMCP = {
  name: 'makalin/SecureMCP',
  package: '@makalin/SecureMCP',
  description: 'SecureMCP is a security auditing tool designed to detect vulnerabilities and misconfigurations in applications using the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction). It proactively identifies threats like OAuth token leakage, prompt injection vulnerabilities, rogue MCP servers, and tool poisoning attacks.',
  enabled: true,
  priority: high
};
```

**Validation:**
```bash
# Test the new MCP server
node scripts/test-community-mcp-servers.js --server=makalin/SecureMCP
```

### 4. modelcontextprotocol/example-remote-server

**Installation:**
```bash
# Install the MCP server
npm install @modelcontextprotocol/example-remote-server
# Or clone from source:
git clone undefined

# Add to MCP orchestrator configuration
# Update mcp-server/orchestration-engine.js
```

**Configuration:**
```javascript
// Add to mcp-server/orchestration-engine.js
const modelcontextprotocolExampleRemoteServer = {
  name: 'modelcontextprotocol/example-remote-server',
  package: '@modelcontextprotocol/example-remote-server',
  description: 'A hosted version of the Everything server - for demonstration and testing purposes, hosted at https://example-server.modelcontextprotocol.io/sse',
  enabled: true,
  priority: high
};
```

**Validation:**
```bash
# Test the new MCP server
node scripts/test-community-mcp-servers.js --server=modelcontextprotocol/example-remote-server
```

### 5. modelcontextprotocol/inspector

**Installation:**
```bash
# Install the MCP server
npm install @modelcontextprotocol/inspector
# Or clone from source:
git clone undefined

# Add to MCP orchestrator configuration
# Update mcp-server/orchestration-engine.js
```

**Configuration:**
```javascript
// Add to mcp-server/orchestration-engine.js
const modelcontextprotocolInspector = {
  name: 'modelcontextprotocol/inspector',
  package: '@modelcontextprotocol/inspector',
  description: 'Visual testing tool for MCP servers',
  enabled: true,
  priority: high
};
```

**Validation:**
```bash
# Test the new MCP server
node scripts/test-community-mcp-servers.js --server=modelcontextprotocol/inspector
```

### 6. mcp-server-code-runner

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

### 7. xcodebuildmcp

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

### 8. executeautomation/mcp-playwright

**Installation:**
```bash
# Install the MCP server
npm install @executeautomation/mcp-playwright
# Or clone from source:
git clone undefined

# Add to MCP orchestrator configuration
# Update mcp-server/orchestration-engine.js
```

**Configuration:**
```javascript
// Add to mcp-server/orchestration-engine.js
const executeautomationMcpPlaywright = {
  name: 'executeautomation/mcp-playwright',
  package: '@executeautomation/mcp-playwright',
  description: 'Playwright Model Context Protocol Server - Tool to automate Browsers and APIs in Claude Desktop, Cline, Cursor IDE and More 🔌',
  enabled: true,
  priority: high
};
```

**Validation:**
```bash
# Test the new MCP server
node scripts/test-community-mcp-servers.js --server=executeautomation/mcp-playwright
```

### 9. mobile-next/mobile-mcp

**Installation:**
```bash
# Install the MCP server
npm install @mobile-next/mobile-mcp
# Or clone from source:
git clone undefined

# Add to MCP orchestrator configuration
# Update mcp-server/orchestration-engine.js
```

**Configuration:**
```javascript
// Add to mcp-server/orchestration-engine.js
const mobileNextMobileMcp = {
  name: 'mobile-next/mobile-mcp',
  package: '@mobile-next/mobile-mcp',
  description: 'Model Context Protocol Server for Mobile Automation and Scraping (iOS, Android, Emulators, Simulators and Real Devices)',
  enabled: true,
  priority: high
};
```

**Validation:**
```bash
# Test the new MCP server
node scripts/test-community-mcp-servers.js --server=mobile-next/mobile-mcp
```

### 10. microsoft/playwright-mcp

**Installation:**
```bash
# Install the MCP server
npm install @microsoft/playwright-mcp
# Or clone from source:
git clone undefined

# Add to MCP orchestrator configuration
# Update mcp-server/orchestration-engine.js
```

**Configuration:**
```javascript
// Add to mcp-server/orchestration-engine.js
const microsoftPlaywrightMcp = {
  name: 'microsoft/playwright-mcp',
  package: '@microsoft/playwright-mcp',
  description: 'Playwright MCP server',
  enabled: true,
  priority: high
};
```

**Validation:**
```bash
# Test the new MCP server
node scripts/test-community-mcp-servers.js --server=microsoft/playwright-mcp
```


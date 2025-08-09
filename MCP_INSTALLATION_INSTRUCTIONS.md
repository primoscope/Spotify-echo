# 🔧 MCP Installation Instructions

**Generated:** 2025-08-08T22:17:43.833Z

## 📦 New MCP Servers to Install

### 1. xcodebuildmcp

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

### 2. punkpeye/awesome-mcp-servers

**Installation:**
```bash
# Install the MCP server
npm install @punkpeye/awesome-mcp-servers
# Or clone from source:
git clone undefined

# Add to MCP orchestrator configuration
# Update mcp-server/orchestration-engine.js
```

**Configuration:**
```javascript
// Add to mcp-server/orchestration-engine.js
const punkpeyeAwesomeMcpServers = {
  name: 'punkpeye/awesome-mcp-servers',
  package: '@punkpeye/awesome-mcp-servers',
  description: 'A collection of MCP servers.',
  enabled: true,
  priority: high
};
```

**Validation:**
```bash
# Test the new MCP server
node scripts/test-community-mcp-servers.js --server=punkpeye/awesome-mcp-servers
```

### 3. GLips/Figma-Context-MCP

**Installation:**
```bash
# Install the MCP server
npm install @GLips/Figma-Context-MCP
# Or clone from source:
git clone undefined

# Add to MCP orchestrator configuration
# Update mcp-server/orchestration-engine.js
```

**Configuration:**
```javascript
// Add to mcp-server/orchestration-engine.js
const gLipsFigmaContextMCP = {
  name: 'GLips/Figma-Context-MCP',
  package: '@GLips/Figma-Context-MCP',
  description: 'MCP server to provide Figma layout information to AI coding agents like Cursor',
  enabled: true,
  priority: high
};
```

**Validation:**
```bash
# Test the new MCP server
node scripts/test-community-mcp-servers.js --server=GLips/Figma-Context-MCP
```

### 4. lharries/whatsapp-mcp

**Installation:**
```bash
# Install the MCP server
npm install @lharries/whatsapp-mcp
# Or clone from source:
git clone undefined

# Add to MCP orchestrator configuration
# Update mcp-server/orchestration-engine.js
```

**Configuration:**
```javascript
// Add to mcp-server/orchestration-engine.js
const lharriesWhatsappMcp = {
  name: 'lharries/whatsapp-mcp',
  package: '@lharries/whatsapp-mcp',
  description: 'WhatsApp MCP server',
  enabled: true,
  priority: high
};
```

**Validation:**
```bash
# Test the new MCP server
node scripts/test-community-mcp-servers.js --server=lharries/whatsapp-mcp
```

### 5. aipotheosis-labs/aci

**Installation:**
```bash
# Install the MCP server
npm install @aipotheosis-labs/aci
# Or clone from source:
git clone undefined

# Add to MCP orchestrator configuration
# Update mcp-server/orchestration-engine.js
```

**Configuration:**
```javascript
// Add to mcp-server/orchestration-engine.js
const aipotheosisLabsAci = {
  name: 'aipotheosis-labs/aci',
  package: '@aipotheosis-labs/aci',
  description: 'ACI.dev is the open source tool-calling platform that hooks up 600+ tools into any agentic IDE or custom AI agent through direct function calling or a unified MCP server. The birthplace of VibeOps.',
  enabled: true,
  priority: high
};
```

**Validation:**
```bash
# Test the new MCP server
node scripts/test-community-mcp-servers.js --server=aipotheosis-labs/aci
```

### 6. graphlit-mcp-server

**Installation:**
```bash
# Install the MCP server
npm install graphlit-mcp-server

# Add to MCP orchestrator configuration
# Update mcp-server/orchestration-engine.js
```

**Configuration:**
```javascript
// Add to mcp-server/orchestration-engine.js
const graphlitMcpServer = {
  name: 'graphlit-mcp-server',
  package: 'graphlit-mcp-server',
  description: 'Graphlit MCP Server',
  enabled: true,
  priority: high
};
```

**Validation:**
```bash
# Test the new MCP server
node scripts/test-community-mcp-servers.js --server=graphlit-mcp-server
```

### 7. @openbnb/mcp-server-airbnb

**Installation:**
```bash
# Install the MCP server
npm install @openbnb/mcp-server-airbnb

# Add to MCP orchestrator configuration
# Update mcp-server/orchestration-engine.js
```

**Configuration:**
```javascript
// Add to mcp-server/orchestration-engine.js
const OpenbnbMcpServerAirbnb = {
  name: '@openbnb/mcp-server-airbnb',
  package: '@openbnb/mcp-server-airbnb',
  description: 'MCP server for Airbnb search and listing details',
  enabled: true,
  priority: high
};
```

**Validation:**
```bash
# Test the new MCP server
node scripts/test-community-mcp-servers.js --server=@openbnb/mcp-server-airbnb
```

### 8. scrapeless-mcp-server

**Installation:**
```bash
# Install the MCP server
npm install scrapeless-mcp-server

# Add to MCP orchestrator configuration
# Update mcp-server/orchestration-engine.js
```

**Configuration:**
```javascript
// Add to mcp-server/orchestration-engine.js
const scrapelessMcpServer = {
  name: 'scrapeless-mcp-server',
  package: 'scrapeless-mcp-server',
  description: 'Scrapeless Mcp Server',
  enabled: true,
  priority: high
};
```

**Validation:**
```bash
# Test the new MCP server
node scripts/test-community-mcp-servers.js --server=scrapeless-mcp-server
```

### 9. @langchain/mcp-adapters

**Installation:**
```bash
# Install the MCP server
npm install @langchain/mcp-adapters

# Add to MCP orchestrator configuration
# Update mcp-server/orchestration-engine.js
```

**Configuration:**
```javascript
// Add to mcp-server/orchestration-engine.js
const LangchainMcpAdapters = {
  name: '@langchain/mcp-adapters',
  package: '@langchain/mcp-adapters',
  description: 'LangChain.js adapters for Model Context Protocol (MCP)',
  enabled: true,
  priority: high
};
```

**Validation:**
```bash
# Test the new MCP server
node scripts/test-community-mcp-servers.js --server=@langchain/mcp-adapters
```

### 10. mcp-framework

**Installation:**
```bash
# Install the MCP server
npm install mcp-framework

# Add to MCP orchestrator configuration
# Update mcp-server/orchestration-engine.js
```

**Configuration:**
```javascript
// Add to mcp-server/orchestration-engine.js
const mcpFramework = {
  name: 'mcp-framework',
  package: 'mcp-framework',
  description: 'Framework for building Model Context Protocol (MCP) servers in Typescript',
  enabled: true,
  priority: high
};
```

**Validation:**
```bash
# Test the new MCP server
node scripts/test-community-mcp-servers.js --server=mcp-framework
```


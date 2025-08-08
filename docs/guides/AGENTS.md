# MCP Server Integration Guide

This document provides comprehensive information about the Model Context Protocol (MCP) servers integrated into EchoTune AI and instructions for GitHub Coding Agents to leverage these capabilities.

## Overview

EchoTune AI uses MCP servers to enhance development workflows, automation, and system capabilities. These servers provide AI agents with powerful tools for code analysis, browser automation, file management, and more.

## Available MCP Servers

### Core MCP Servers

#### 1. Browser Automation Server
- **Package**: `@modelcontextprotocol/server-puppeteer`
- **Purpose**: Web scraping, browser automation, UI testing
- **Port**: Default (varies)
- **Configuration**: 
  ```json
  {
    "command": "npx",
    "args": ["@modelcontextprotocol/server-puppeteer"],
    "env": {
      "PUPPETEER_HEADLESS": "true"
    }
  }
  ```

#### 2. Browserbase Server
- **Package**: `@browserbasehq/mcp-server-browserbase`
- **Purpose**: Cloud browser automation, cross-browser testing
- **Configuration**: Requires `BROWSERBASE_API_KEY` and `BROWSERBASE_PROJECT_ID`
- **Capabilities**: Remote browser sessions, screenshot capture, performance testing

#### 3. Filesystem Server
- **Package**: `FileScopeMCP`
- **Purpose**: Secure file operations with directory scoping
- **Security**: Restricted to allowed directories
- **Configuration**: 
  ```json
  {
    "command": "node",
    "args": ["node_modules/FileScopeMCP/dist/mcp-server.js"],
    "env": {
      "ALLOWED_DIRECTORIES": "${PWD},${PWD}/src,${PWD}/scripts,${PWD}/mcp-server"
    }
  }
  ```

#### 4. Spotify Integration Server
- **Script**: `mcp-server/spotify_server.py`
- **Purpose**: Spotify API integration, music data processing
- **Requirements**: Python, Spotify API credentials

### Enhanced MCP Servers

#### 5. Sequential Thinking Server
- **Package**: `@modelcontextprotocol/server-sequential-thinking`
- **Purpose**: Structured reasoning for complex tasks
- **Benefits**: Improved problem-solving, step-by-step analysis

#### 6. Enhanced File Utilities
- **Script**: `mcp-servers/enhanced-file-utilities.js`
- **Purpose**: Advanced file operations with validation and security
- **Features**: File validation, secure operations, batch processing

#### 7. Comprehensive Validator
- **Script**: `mcp-servers/comprehensive-validator.js`
- **Purpose**: System-wide validation and monitoring
- **Capabilities**: Code validation, configuration checks, health monitoring

#### 8. Analytics Server
- **Location**: `mcp-servers/analytics-server/`
- **Purpose**: Performance monitoring, user analytics, system telemetry
- **Features**: Real-time insights, optimization recommendations

#### 9. Testing Automation Server
- **Location**: `mcp-servers/testing-automation/`
- **Purpose**: Automated testing workflows, CI/CD integration
- **Capabilities**: Test execution, result analysis, coverage reporting

#### 10. Package Management Server
- **Location**: `mcp-servers/package-management/`
- **Purpose**: Dependency management, security scanning
- **Features**: Version checking, vulnerability detection, update automation

## Usage Instructions for GitHub Coding Agents

### Starting MCP Servers

```bash
# Start main MCP server
npm run mcp-server

# Start MCP orchestrator
npm run mcp-orchestrator

# Start community MCP servers
npm run mcp-community

# Health check
npm run mcp-health-check
```

### Testing MCP Integration

```bash
# Test all MCP servers
npm run mcp-test-all

# Test specific server
npm run mcp:package-mgmt
npm run mcp:code-sandbox
npm run mcp:analytics

# Validate MCP integration
npm run mcp-validate
```

### Common MCP Workflows

#### Code Analysis and Validation
1. Use **Sequential Thinking Server** for complex problem analysis
2. Use **Comprehensive Validator** for code validation
3. Use **Enhanced File Utilities** for file operations
4. Use **Package Management Server** for dependency analysis

#### Browser Automation
1. Use **Browserbase Server** for cloud browser testing
2. Use **Browser Automation Server** for local browser control
3. Combine with **Analytics Server** for performance monitoring

#### File and System Operations
1. Use **Filesystem Server** for secure file operations
2. Use **Enhanced File Utilities** for advanced file processing
3. Use **Comprehensive Validator** for system health checks

### Agent Development Best Practices

#### 1. Always Check MCP Server Health
```bash
curl -s http://localhost:3001/health || echo 'MCP server not running'
```

#### 2. Use Appropriate Server for Task
- **File operations**: Filesystem Server or Enhanced File Utilities
- **Code analysis**: Sequential Thinking + Comprehensive Validator
- **Browser tasks**: Browserbase Server
- **Dependency management**: Package Management Server

#### 3. Handle Server Failures Gracefully
- Implement fallback mechanisms
- Check server availability before operations
- Log server interactions for debugging

#### 4. Leverage Server Orchestration
```bash
# Use orchestrator for complex workflows
npm run mcp-orchestrator
```

## Server Configuration

### Environment Variables
```env
# MCP Server Configuration
MCP_SERVER_PORT=3001

# Browserbase Configuration
BROWSERBASE_API_KEY=your_api_key
BROWSERBASE_PROJECT_ID=your_project_id

# Security Configuration
ALLOWED_DIRECTORIES=/app,/app/src,/app/scripts
MAX_FILE_SIZE=100MB
```

### Health Monitoring
All MCP servers include health check endpoints:
- Primary health: `http://localhost:3001/health`
- Individual server health checks available
- Automatic failover for critical operations

### Performance Optimization
- Servers support connection pooling
- Request rate limiting implemented
- Caching for frequently accessed resources
- Monitoring and alerting for server performance

## Troubleshooting

### Common Issues

#### 1. Server Not Starting
```bash
# Check port availability
netstat -an | grep :3001

# Check dependencies
npm run mcp-validate

# Restart with debug
DEBUG=* npm run mcp-server
```

#### 2. Connection Timeouts
- Increase timeout values in configuration
- Check network connectivity
- Verify server health status

#### 3. Permission Errors
- Verify allowed directories configuration
- Check file system permissions
- Review security settings

### Debugging Commands
```bash
# MCP server status
npm run mcp-health

# Full system validation
npm run validate:comprehensive-mcp

# Enhanced automation status
npm run automate:status
```

## Future Enhancements

### Planned MCP Server Additions
1. **AI Code Review Server** - Automated code quality analysis
2. **Performance Profiling Server** - Real-time performance monitoring
3. **Security Audit Server** - Comprehensive security scanning
4. **Documentation Generator** - Automatic documentation creation

### Integration Roadmap
- Enhanced orchestration capabilities
- Cross-server communication protocols
- Advanced workflow automation
- Real-time collaboration features

## Support and Resources

- **Documentation**: `/docs/MCP_INTEGRATION.md`
- **API Reference**: `/api/docs` (OpenAPI specification)
- **GitHub Issues**: Report MCP-related issues with `[MCP]` tag
- **Community**: Contribute MCP server integrations via pull requests

---

**Note for GitHub Coding Agents**: This guide should be your primary reference for MCP server capabilities and usage. Always prefer using existing MCP servers over manual implementation of similar functionality.
  context: "high user load during peak hours"
});
```

### 2. FileScopeMCP
**Best Use Cases**:
- Repository-wide refactoring
- Automated code generation
- File organization and cleanup
- Batch processing operations

**Quick Commands**:
```javascript
// Safe file operations within allowed directories
await fileScope.processFiles({
  pattern: "src/**/*.js",
  operation: "add-error-handling",
  allowedDirs: ["/src", "/scripts", "/mcp-server"]
});

// Generate boilerplate code
await fileScope.generateComponent({
  type: "api-endpoint",
  name: "recommendations",
  template: "express-route"
});
```

### 3. Screenshot Website Fast
**Best Use Cases**:
- UI testing and validation
- Documentation generation
- Visual regression testing
- Bug report evidence

**Quick Commands**:
```javascript
// Capture application state
await screenshot.capture({
  url: "http://localhost:3000/dashboard",
  viewport: { width: 1920, height: 1080 },
  waitFor: ".recommendations-loaded"
});

// Visual testing
await screenshot.comparePages({
  baseline: "prod-dashboard.png",
  current: "http://localhost:3000/dashboard",
  threshold: 0.1
});
```

### 4. Browserbase Cloud Automation
**Best Use Cases**:
- Cross-browser testing
- End-to-end workflows
- Performance testing
- Real user simulation

**Quick Commands**:
```javascript
// E2E user workflow
await browserbase.runWorkflow({
  scenario: "user-onboarding",
  steps: ["login", "connect-spotify", "generate-recommendations"],
  browsers: ["chrome", "firefox", "safari"]
});
```

### 5. Mermaid Diagram Generator
**Best Use Cases**:
- Architecture documentation
- Workflow visualization
- System design planning
- API flow diagrams

**Quick Commands**:
```javascript
// Generate system architecture
await mermaid.generateDiagram({
  type: "graph TD",
  title: "EchoTune AI Architecture",
  nodes: ["Frontend", "API Gateway", "Recommendation Engine", "Spotify API"]
});
```

### 6. Browser Automation (Puppeteer)
**Best Use Cases**:
- Local web scraping
- Form automation
- Dynamic content testing
- Performance profiling

**Quick Commands**:
```javascript
// Spotify Web Player automation
await browser.automateSpotify({
  action: "create-playlist",
  tracks: ["track1", "track2", "track3"],
  name: "AI Generated Playlist"
});
```

### 7. Spotify MCP Server
**Best Use Cases**:
- Music recommendation generation
- Playlist automation
- Listening data analysis
- User preference modeling

**Quick Commands**:
```javascript
// Generate personalized recommendations
await spotify.getRecommendations({
  user_id: "user123",
  seed_genres: ["electronic", "jazz"],
  target_features: { energy: 0.7, valence: 0.8 }
});

// Analyze listening patterns
await spotify.analyzeListeningData({
  data_file: "user_listening_history.csv",
  analysis_type: "trends",
  time_range: "6m"
});
```

## Community MCP Servers Integration

### Code Intelligence Enhancement
**Server**: mcp-code-intel  
**Agent Usage Strategy**: Use mcp-code-intel to improve the mcp-server/spotify_server.py file by performing comprehensive code analysis, security scanning, and optimization suggestions to enhance performance and maintainability.

```javascript
// Enhance code quality analysis
async function enhanceSpotifyServer() {
  const analysis = await codeIntel.analyzeFile({
    file: "mcp-server/spotify_server.py",
    checks: ["security", "performance", "maintainability"]
  });
  
  return {
    improvements: analysis.suggestions,
    securityIssues: analysis.vulnerabilities,
    performanceOptimizations: analysis.optimizations
  };
}
```

### API Testing Automation
**Server**: mcp-api-tester  
**Agent Usage Strategy**:
```javascript
// Comprehensive API validation
async function validateSpotifyIntegration() {
  const testResults = await apiTester.runTestSuite({
    api: "spotify-web-api",
    endpoints: ["/recommendations", "/playlists", "/user-profile"],
    authFlow: "oauth2",
    rateLimit: { requests: 100, window: "1min" }
  });
  
  return testResults;
}
```

## AI Agent Workflow Patterns

### 1. Feature Development Workflow

```javascript
async function developFeatureWorkflow(featureRequest) {
  // 1. Analyze requirements
  const analysis = await sequentialThinking.analyzeRequirement(featureRequest);
  
  // 2. Generate code structure
  const codeStructure = await fileScope.generateStructure(analysis.components);
  
  // 3. Implement core logic
  const implementation = await fileScope.implementFeature(analysis.implementation);
  
  // 4. Test functionality
  const testResults = await browser.testImplementation(implementation);
  
  // 5. Document with screenshots
  const documentation = await screenshot.generateDocs(testResults);
  
  return {
    implementation,
    tests: testResults,
    documentation
  };
}
```

### 2. Bug Investigation Workflow

```javascript
async function investigateBugWorkflow(bugReport) {
  // 1. Systematic analysis
  const investigation = await sequentialThinking.debugIssue({
    problem: bugReport.description,
    symptoms: bugReport.symptoms,
    environment: bugReport.environment
  });
  
  // 2. Reproduce issue
  const reproduction = await browser.reproduceIssue(investigation.steps);
  
  // 3. Capture evidence
  const evidence = await screenshot.captureErrorState(reproduction);
  
  // 4. Generate fix
  const fix = await fileScope.generateFix(investigation.rootCause);
  
  return {
    investigation,
    evidence,
    fix
  };
}
```

## Best Practices for AI Agents

### 1. Server Selection Strategy
- **Local vs Cloud**: Use local servers (Puppeteer) for development, cloud (Browserbase) for production testing
- **Sequential Thinking**: Use for complex, multi-step problems requiring structured analysis
- **FileScopeMCP**: Use for file operations, code generation, and repository management
- **Screenshot**: Use for UI validation and documentation
- **Community Servers**: Use for specialized tasks (security scanning, performance monitoring)

### 2. Error Handling and Fallbacks

```javascript
async function robustMCPCall(serverName, operation, params) {
  const fallbackServers = {
    'browserbase': ['browser', 'screenshot'],
    'code-intel': ['sequential-thinking'],
    'api-tester': ['browser']
  };
  
  try {
    return await mcpServers[serverName].call(operation, params);
  } catch (error) {
    console.warn(`${serverName} failed, trying fallback:`, error.message);
    
    for (const fallback of fallbackServers[serverName] || []) {
      try {
        return await mcpServers[fallback].call(operation, params);
      } catch (fallbackError) {
        console.warn(`Fallback ${fallback} also failed:`, fallbackError.message);
      }
    }
    
    throw new Error(`All servers failed for operation: ${operation}`);
  }
}
```

### 3. Security Considerations

**Environment Variable Validation**:
```javascript
function validateMCPEnvironment() {
  const requiredVars = [
    'SPOTIFY_CLIENT_ID',
    'SPOTIFY_CLIENT_SECRET',
    'ALLOWED_DIRECTORIES'
  ];
  
  const optionalVars = [
    'BROWSERBASE_API_KEY',
    'BROWSERBASE_PROJECT_ID'
  ];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      throw new Error(`Required environment variable missing: ${varName}`);
    }
  }
  
  return {
    required: requiredVars.every(v => process.env[v]),
    optional: optionalVars.filter(v => process.env[v])
  };
}
```

## Integration Testing for AI Agents

### 🔍 Recently Discovered MCP Servers

*Last updated: 8/8/2025*

The following MCP servers were discovered and may be valuable additions to EchoTune AI:

### 1. n8n-mcp
- **Package**: `n8n-mcp`
- **Description**: Integration between n8n workflow automation and Model Context Protocol (MCP)
- **Relevance Score**: 15/10
- **Source**: npm
- **URL**: [https://github.com/czlonkowski/n8n-mcp#readme](https://github.com/czlonkowski/n8n-mcp#readme)
- **Integration Suggestion**: undefined

### 2. googleapis/genai-toolbox
- **Package**: `@googleapis/genai-toolbox`
- **Description**: MCP Toolbox for Databases is an open source MCP server for databases.
- **Relevance Score**: 14/10
- **Source**: github
- **URL**: [https://github.com/googleapis/genai-toolbox](https://github.com/googleapis/genai-toolbox)
- **Integration Suggestion**: undefined

### 3. makalin/SecureMCP
- **Package**: `@makalin/SecureMCP`
- **Description**: SecureMCP is a security auditing tool designed to detect vulnerabilities and misconfigurations in applications using the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction). It proactively identifies threats like OAuth token leakage, prompt injection vulnerabilities, rogue MCP servers, and tool poisoning attacks.
- **Relevance Score**: 11/10
- **Source**: github
- **URL**: [https://github.com/makalin/SecureMCP](https://github.com/makalin/SecureMCP)
- **Integration Suggestion**: undefined

### 4. modelcontextprotocol/example-remote-server
- **Package**: `@modelcontextprotocol/example-remote-server`
- **Description**: A hosted version of the Everything server - for demonstration and testing purposes, hosted at https://example-server.modelcontextprotocol.io/sse
- **Relevance Score**: 11/10
- **Source**: github
- **URL**: [https://github.com/modelcontextprotocol/example-remote-server](https://github.com/modelcontextprotocol/example-remote-server)
- **Integration Suggestion**: undefined

### 5. modelcontextprotocol/inspector
- **Package**: `@modelcontextprotocol/inspector`
- **Description**: Visual testing tool for MCP servers
- **Relevance Score**: 11/10
- **Source**: github
- **URL**: [https://github.com/modelcontextprotocol/inspector](https://github.com/modelcontextprotocol/inspector)
- **Integration Suggestion**: undefined

### 6. mcp-server-code-runner
- **Package**: `mcp-server-code-runner`
- **Description**: Code Runner MCP Server
- **Relevance Score**: 11/10
- **Source**: npm
- **URL**: [https://github.com/formulahendry/mcp-server-code-runner#readme](https://github.com/formulahendry/mcp-server-code-runner#readme)
- **Integration Suggestion**: undefined

### 7. xcodebuildmcp
- **Package**: `xcodebuildmcp`
- **Description**: XcodeBuildMCP is a ModelContextProtocol server that provides tools for Xcode project management, simulator management, and app utilities.
- **Relevance Score**: 11/10
- **Source**: npm
- **URL**: [https://www.async-let.com/blog/xcodebuild-mcp/](https://www.async-let.com/blog/xcodebuild-mcp/)
- **Integration Suggestion**: undefined

### 8. executeautomation/mcp-playwright
- **Package**: `@executeautomation/mcp-playwright`
- **Description**: Playwright Model Context Protocol Server - Tool to automate Browsers and APIs in Claude Desktop, Cline, Cursor IDE and More 🔌
- **Relevance Score**: 10/10
- **Source**: github
- **URL**: [https://github.com/executeautomation/mcp-playwright](https://github.com/executeautomation/mcp-playwright)
- **Integration Suggestion**: undefined

### 9. mobile-next/mobile-mcp
- **Package**: `@mobile-next/mobile-mcp`
- **Description**: Model Context Protocol Server for Mobile Automation and Scraping (iOS, Android, Emulators, Simulators and Real Devices)
- **Relevance Score**: 10/10
- **Source**: github
- **URL**: [https://github.com/mobile-next/mobile-mcp](https://github.com/mobile-next/mobile-mcp)
- **Integration Suggestion**: undefined

### 10. microsoft/playwright-mcp
- **Package**: `@microsoft/playwright-mcp`
- **Description**: Playwright MCP server
- **Relevance Score**: 10/10
- **Source**: github
- **URL**: [https://github.com/microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp)
- **Integration Suggestion**: undefined

**Next Steps**: Review these candidates and consider integration based on project priorities.

### 1. oraios/serena
- **Package**: `@oraios/serena`
- **Description**: A powerful coding agent toolkit providing semantic retrieval and editing capabilities (MCP server & Agno integration)
- **Relevance Score**: 16/10
- **Source**: github
- **URL**: [https://github.com/oraios/serena](https://github.com/oraios/serena)
- **Integration Suggestion**: undefined

### 2. BeehiveInnovations/zen-mcp-server
- **Package**: `@BeehiveInnovations/zen-mcp-server`
- **Description**: The power of Claude Code + [Gemini / OpenAI / Grok / OpenRouter / Ollama / Custom Model / All Of The Above] working as one.
- **Relevance Score**: 16/10
- **Source**: github
- **URL**: [https://github.com/BeehiveInnovations/zen-mcp-server](https://github.com/BeehiveInnovations/zen-mcp-server)
- **Integration Suggestion**: undefined

### 3. haris-musa/excel-mcp-server
- **Package**: `@haris-musa/excel-mcp-server`
- **Description**: A Model Context Protocol server for Excel file manipulation
- **Relevance Score**: 15/10
- **Source**: github
- **URL**: [https://github.com/haris-musa/excel-mcp-server](https://github.com/haris-musa/excel-mcp-server)
- **Integration Suggestion**: undefined

### 4. @executeautomation/playwright-mcp-server
- **Package**: `@executeautomation/playwright-mcp-server`
- **Description**: Model Context Protocol servers for Playwright
- **Relevance Score**: 15/10
- **Source**: npm
- **URL**: [https://executeautomation.github.io/mcp-playwright/](https://executeautomation.github.io/mcp-playwright/)
- **Integration Suggestion**: undefined

### 5. n8n-mcp
- **Package**: `n8n-mcp`
- **Description**: Integration between n8n workflow automation and Model Context Protocol (MCP)
- **Relevance Score**: 15/10
- **Source**: npm
- **URL**: [https://github.com/czlonkowski/n8n-mcp#readme](https://github.com/czlonkowski/n8n-mcp#readme)
- **Integration Suggestion**: undefined

### 6. @bolide-ai/mcp
- **Package**: `@bolide-ai/mcp`
- **Description**: Bolide AI MCP is a ModelContextProtocol server that provides tools for marketing automation.
- **Relevance Score**: 15/10
- **Source**: npm
- **URL**: [https://bolide.ai](https://bolide.ai)
- **Integration Suggestion**: undefined

### 7. designcomputer/mysql_mcp_server
- **Package**: `@designcomputer/mysql_mcp_server`
- **Description**: A Model Context Protocol (MCP) server that enables secure interaction with MySQL databases
- **Relevance Score**: 14/10
- **Source**: github
- **URL**: [https://github.com/designcomputer/mysql_mcp_server](https://github.com/designcomputer/mysql_mcp_server)
- **Integration Suggestion**: undefined

### 8. GongRzhe/REDIS-MCP-Server
- **Package**: `@GongRzhe/REDIS-MCP-Server`
- **Description**: A Redis MCP server (pushed to https://github.com/modelcontextprotocol/servers/tree/main/src/redis) implementation for interacting with Redis databases. This server enables LLMs to interact with Redis key-value stores through a set of standardized tools.
- **Relevance Score**: 14/10
- **Source**: github
- **URL**: [https://github.com/GongRzhe/REDIS-MCP-Server](https://github.com/GongRzhe/REDIS-MCP-Server)
- **Integration Suggestion**: undefined

### 9. mindsdb/mindsdb
- **Package**: `@mindsdb/mindsdb`
- **Description**: AI's query engine - Platform for building AI that can answer questions over large scale federated data. - The only MCP Server you'll ever need
- **Relevance Score**: 14/10
- **Source**: github
- **URL**: [https://github.com/mindsdb/mindsdb](https://github.com/mindsdb/mindsdb)
- **Integration Suggestion**: undefined

### 10. 1Panel-dev/1Panel
- **Package**: `@1Panel-dev/1Panel`
- **Description**: 🔥 1Panel provides an intuitive web interface and MCP Server to manage websites, files, containers, databases, and LLMs on a Linux server.
- **Relevance Score**: 14/10
- **Source**: github
- **URL**: [https://github.com/1Panel-dev/1Panel](https://github.com/1Panel-dev/1Panel)
- **Integration Suggestion**: undefined

**Next Steps**: Review these candidates and consider integration based on project priorities.

### 1. hangwin/mcp-chrome
- **Package**: `@hangwin/mcp-chrome`
- **Description**: Chrome MCP Server is a Chrome extension-based Model Context Protocol (MCP) server that exposes your Chrome browser functionality to AI assistants like Claude, enabling complex browser automation, content analysis, and semantic search.
- **Relevance Score**: 23/10
- **Source**: github
- **URL**: [https://github.com/hangwin/mcp-chrome](https://github.com/hangwin/mcp-chrome)
- **Integration Suggestion**: undefined

### 2. activepieces/activepieces
- **Package**: `@activepieces/activepieces`
- **Description**: AI Agents & MCPs & AI Workflow Automation • (280+ MCP servers for AI agents) • AI Automation / AI Agent with MCPs • AI Workflows & AI Agents • MCPs for AI Agents
- **Relevance Score**: 23/10
- **Source**: github
- **URL**: [https://github.com/activepieces/activepieces](https://github.com/activepieces/activepieces)
- **Integration Suggestion**: undefined

### 3. microsoft/mcp-for-beginners
- **Package**: `@microsoft/mcp-for-beginners`
- **Description**: This open-source curriculum introduces the fundamentals of Model Context Protocol (MCP) through real-world, cross-language examples in .NET, Java, TypeScript, JavaScript, and Python. Designed for developers, it focuses on practical techniques for building modular, scalable, and secure AI workflows from session setup to service orchestration.
- **Relevance Score**: 16/10
- **Source**: github
- **URL**: [https://github.com/microsoft/mcp-for-beginners](https://github.com/microsoft/mcp-for-beginners)
- **Integration Suggestion**: undefined

### 4. cameroncooke/XcodeBuildMCP
- **Package**: `@cameroncooke/XcodeBuildMCP`
- **Description**: A Model Context Protocol (MCP) server that provides Xcode-related tools for integration with AI assistants and other MCP clients.
- **Relevance Score**: 16/10
- **Source**: github
- **URL**: [https://github.com/cameroncooke/XcodeBuildMCP](https://github.com/cameroncooke/XcodeBuildMCP)
- **Integration Suggestion**: undefined

### 5. ravitemer/mcphub.nvim
- **Package**: `@ravitemer/mcphub.nvim`
- **Description**: An MCP client for Neovim that seamlessly integrates MCP servers into your editing workflow with an intuitive interface for managing, testing, and using MCP servers with your favorite chat plugins.
- **Relevance Score**: 16/10
- **Source**: github
- **URL**: [https://github.com/ravitemer/mcphub.nvim](https://github.com/ravitemer/mcphub.nvim)
- **Integration Suggestion**: undefined

### 6. IBM/mcp-context-forge
- **Package**: `@IBM/mcp-context-forge`
- **Description**: A Model Context Protocol (MCP) Gateway & Registry. Serves as a central management point for tools, resources, and prompts that can be accessed by MCP-compatible LLM applications. Converts REST API endpoints to MCP, composes virtual MCP servers with added security and observability, and converts between protocols (stdio, SSE, Streamable HTTP).
- **Relevance Score**: 16/10
- **Source**: github
- **URL**: [https://github.com/IBM/mcp-context-forge](https://github.com/IBM/mcp-context-forge)
- **Integration Suggestion**: undefined

### 7. stacklok/toolhive
- **Package**: `@stacklok/toolhive`
- **Description**: ToolHive makes deploying MCP servers easy, secure and fun
- **Relevance Score**: 16/10
- **Source**: github
- **URL**: [https://github.com/stacklok/toolhive](https://github.com/stacklok/toolhive)
- **Integration Suggestion**: undefined

### 8. jamubc/gemini-mcp-tool
- **Package**: `@jamubc/gemini-mcp-tool`
- **Description**: MCP server that enables AI assistants to interact with Google Gemini CLI, leveraging Gemini's massive token window for large file analysis and codebase understanding
- **Relevance Score**: 16/10
- **Source**: github
- **URL**: [https://github.com/jamubc/gemini-mcp-tool](https://github.com/jamubc/gemini-mcp-tool)
- **Integration Suggestion**: undefined

### 9. Szowesgad/mcp-server-semgrep
- **Package**: `@Szowesgad/mcp-server-semgrep`
- **Description**: MCP Server Semgrep is a [Model Context Protocol](https://modelcontextprotocol.io) compliant server that integrates the powerful Semgrep static analysis tool with AI assistants like Anthropic Claude. It enables advanced code analysis, security vulnerability detection, and code quality improvements directly through a conversational interface.
- **Relevance Score**: 16/10
- **Source**: github
- **URL**: [https://github.com/Szowesgad/mcp-server-semgrep](https://github.com/Szowesgad/mcp-server-semgrep)
- **Integration Suggestion**: undefined

### 10. upstash/context7
- **Package**: `@upstash/context7`
- **Description**: Context7 MCP Server -- Up-to-date code documentation for LLMs and AI code editors
- **Relevance Score**: 16/10
- **Source**: github
- **URL**: [https://github.com/upstash/context7](https://github.com/upstash/context7)
- **Integration Suggestion**: undefined

**Next Steps**: Review these candidates and consider integration based on project priorities.



## Automated Validation Script

```javascript
async function validateMCPIntegration() {
  const validationResults = {};
  
  // Test each server
  for (const serverName of Object.keys(mcpServers)) {
    try {
      const result = await testServer(serverName);
      validationResults[serverName] = { status: 'pass', ...result };
    } catch (error) {
      validationResults[serverName] = { status: 'fail', error: error.message };
    }
  }
  
  return validationResults;
}

async function testServer(serverName) {
  switch (serverName) {
    case 'mermaid':
      return await testMermaidServer();
    case 'screenshot-website':
      return await testScreenshotServer();
    case 'spotify':
      return await testSpotifyServer();
    default:
      return await genericServerTest(serverName);
  }
}
```

---

**Note**: This guide is designed for AI coding agents working with EchoTune AI. It should be used in conjunction with the main MCP servers documentation and community server guides. Always validate server availability and permissions before performing operations.

## 🤖 MCP Ecosystem Status Report

**Generated:** 2025-08-08T21:57:26.108Z
**Auto-generated by:** MCP Documentation Automation

## 📊 Summary

- **Package Dependencies:** 1
- **Community Servers:** 6
- **Custom Servers:** 6
- **Workflow Integrations:** 6

## 📦 Package Dependencies

### @browserbasehq/mcp-server-browserbase
- **Version:** github:browserbase/mcp-server-browserbase
- **Type:** automation
- **Category:** automation

## 🌟 Community MCP Servers

### analytics-server
- **Files:** 1 files
- **Main Files:** analytics-mcp.js
- **Documentation:** ❌
- **Configuration:** ❌

### code-sandbox
- **Files:** 1 files
- **Main Files:** code-sandbox-mcp.js
- **Documentation:** ❌
- **Configuration:** ❌

### package-management
- **Files:** 1 files
- **Main Files:** package-version-mcp.js
- **Documentation:** ❌
- **Configuration:** ❌

### sentry-mcp
- **Description:** Sentry MCP Server for comprehensive error monitoring and performance tracking in EchoTune AI
- **Version:** 1.0.0
- **Files:** 5 files
- **Main Files:** sentry-mcp-server.js, test-sentry-mcp.js
- **Documentation:** ✅
- **Configuration:** ❌

### sequential-thinking
- **Description:** MCP server for sequential thinking and problem solving
- **Version:** 0.6.2
- **Files:** 6 files
- **Main Files:** index.ts
- **Documentation:** ✅
- **Configuration:** ✅

### testing-automation
- **Files:** 1 files
- **Main Files:** testing-automation-mcp.js
- **Documentation:** ❌
- **Configuration:** ❌

## 🔧 Custom MCP Servers

### coordination-server.js
- **Description:** Custom MCP server implementation
- **Lines of Code:** 201
- **Functions:** express, path, status, workflows, execution
- **MCP Integration:** ✅

### enhanced-mcp-orchestrator.js
- **Description:** Custom MCP server implementation
- **Lines of Code:** 592
- **Functions:** express, WebSocket, cors, fs, path
- **MCP Integration:** ✅

### enhanced-server.js
- **Description:** Custom MCP server implementation
- **Lines of Code:** 347
- **Functions:** express, puppeteer, cors, fs, path
- **MCP Integration:** ✅

### orchestration-engine.js
- **Description:** Custom MCP server implementation
- **Lines of Code:** 313
- **Functions:** EventEmitter, axios, initialize, executeWorkflow, workflow
- **MCP Integration:** ✅

### spotify_server.py
- **Description:** Custom MCP server implementation
- **Lines of Code:** 1133
- **Functions:** correctly
- **MCP Integration:** ✅

### workflow-manager.js
- **Description:** Custom MCP server implementation
- **Lines of Code:** 238
- **Functions:** fs, path, initialize, createCustomWorkflow, workflowId
- **MCP Integration:** ✅

## 🔄 Workflow Integrations

### #mcp-inntegration.yml
- **MCP References:** 5
- **Key Lines:**
  - Line 1: `name: MCP Servers Integration`
  - Line 7: `- 'mcp-servers/**'`
  - Line 8: `- 'scripts/mcp-manager.js'`
  - Line 10: `- '.github/workflows/mcp-integration.yml'`
  - Line 14: `- 'mcp-servers/**'`

### agent-mcp-automation.yml
- **MCP References:** 5
- **Key Lines:**
  - Line 1: `name: MCP Agent Automation & Validation`
  - Line 10: `description: 'Run MCP discovery scan'`
  - Line 24: `# Weekly MCP discovery on Sundays at 2 AM UTC`
  - Line 29: `MCP_SERVER_PORT: 3001`
  - Line 32: `mcp-discovery:`

### copilot-models.yml
- **MCP References:** 2
- **Key Lines:**
  - Line 406: `- **MCP Integration**: Advanced automation capabilities with 12+ MCP servers`
  - Line 541: `- MCP server integration tests`

### copilot-slash-commands.yml
- **MCP References:** 5
- **Key Lines:**
  - Line 510: `MCP[MCP Automation Server]`
  - Line 540: `LB --> MCP`
  - Line 554: `MCP --> FILES`
  - Line 1042: `# Start the MCP automation server (optional)`
  - Line 1043: `npm run mcp-server`

### digitalocean-deploy.yml
- **MCP References:** 5
- **Key Lines:**
  - Line 42: `MCP_IMAGE: echotune-mcp`
  - Line 186: `- name: mcp`
  - Line 187: `dockerfile: mcp-server/Dockerfile`
  - Line 188: `context: mcp-server`
  - Line 189: `image: ${{ env.MCP_IMAGE }}`

### gemini-enhanced.yml
- **MCP References:** 4
- **Key Lines:**
  - Line 9: `- 'mcp-server/**'`
  - Line 99: `src/*|mcp-server/*|scripts/*)`
  - Line 257: `INPUT_INCLUDE: "src,scripts,mcp-server,tests,.github/workflows"`
  - Line 288: `-E "(api[_-]?key|secret|password|token)" src/ scripts/ mcp-server/ 2>/dev/null | \`

## 🔄 Auto-Update Information

This documentation is automatically updated by the MCP Documentation Automator.
- **Last Scan:** 2025-08-08T21:57:26.108Z
- **Auto-Update Script:** `scripts/mcp-documentation-automator.js`
- **Trigger:** On MCP changes, schedule, or manual execution

## 📊 Summary

- **Package Dependencies:** 1
- **Community Servers:** 6
- **Custom Servers:** 6
- **Workflow Integrations:** 6

## 📦 Package Dependencies

### @browserbasehq/mcp-server-browserbase
- **Version:** github:browserbase/mcp-server-browserbase
- **Type:** automation
- **Category:** automation

## 🌟 Community MCP Servers

### analytics-server
- **Files:** 1 files
- **Main Files:** analytics-mcp.js
- **Documentation:** ❌
- **Configuration:** ❌

### code-sandbox
- **Files:** 1 files
- **Main Files:** code-sandbox-mcp.js
- **Documentation:** ❌
- **Configuration:** ❌

### package-management
- **Files:** 1 files
- **Main Files:** package-version-mcp.js
- **Documentation:** ❌
- **Configuration:** ❌

### sentry-mcp
- **Description:** Sentry MCP Server for comprehensive error monitoring and performance tracking in EchoTune AI
- **Version:** 1.0.0
- **Files:** 5 files
- **Main Files:** sentry-mcp-server.js, test-sentry-mcp.js
- **Documentation:** ✅
- **Configuration:** ❌

### sequential-thinking
- **Description:** MCP server for sequential thinking and problem solving
- **Version:** 0.6.2
- **Files:** 6 files
- **Main Files:** index.ts
- **Documentation:** ✅
- **Configuration:** ✅

### testing-automation
- **Files:** 1 files
- **Main Files:** testing-automation-mcp.js
- **Documentation:** ❌
- **Configuration:** ❌

## 🔧 Custom MCP Servers

### coordination-server.js
- **Description:** Custom MCP server implementation
- **Lines of Code:** 201
- **Functions:** express, path, status, workflows, execution
- **MCP Integration:** ✅

### enhanced-mcp-orchestrator.js
- **Description:** Custom MCP server implementation
- **Lines of Code:** 592
- **Functions:** express, WebSocket, cors, fs, path
- **MCP Integration:** ✅

### enhanced-server.js
- **Description:** Custom MCP server implementation
- **Lines of Code:** 347
- **Functions:** express, puppeteer, cors, fs, path
- **MCP Integration:** ✅

### orchestration-engine.js
- **Description:** Custom MCP server implementation
- **Lines of Code:** 313
- **Functions:** EventEmitter, axios, initialize, executeWorkflow, workflow
- **MCP Integration:** ✅

### spotify_server.py
- **Description:** Custom MCP server implementation
- **Lines of Code:** 1133
- **Functions:** correctly
- **MCP Integration:** ✅

### workflow-manager.js
- **Description:** Custom MCP server implementation
- **Lines of Code:** 238
- **Functions:** fs, path, initialize, createCustomWorkflow, workflowId
- **MCP Integration:** ✅

## 🔄 Workflow Integrations

### #mcp-inntegration.yml
- **MCP References:** 5
- **Key Lines:**
  - Line 1: `name: MCP Servers Integration`
  - Line 7: `- 'mcp-servers/**'`
  - Line 8: `- 'scripts/mcp-manager.js'`
  - Line 10: `- '.github/workflows/mcp-integration.yml'`
  - Line 14: `- 'mcp-servers/**'`

### agent-mcp-automation.yml
- **MCP References:** 5
- **Key Lines:**
  - Line 1: `name: MCP Agent Automation & Validation`
  - Line 10: `description: 'Run MCP discovery scan'`
  - Line 24: `# Weekly MCP discovery on Sundays at 2 AM UTC`
  - Line 29: `MCP_SERVER_PORT: 3001`
  - Line 32: `mcp-discovery:`

### copilot-models.yml
- **MCP References:** 2
- **Key Lines:**
  - Line 406: `- **MCP Integration**: Advanced automation capabilities with 12+ MCP servers`
  - Line 541: `- MCP server integration tests`

### copilot-slash-commands.yml
- **MCP References:** 5
- **Key Lines:**
  - Line 510: `MCP[MCP Automation Server]`
  - Line 540: `LB --> MCP`
  - Line 554: `MCP --> FILES`
  - Line 1042: `# Start the MCP automation server (optional)`
  - Line 1043: `npm run mcp-server`

### digitalocean-deploy.yml
- **MCP References:** 5
- **Key Lines:**
  - Line 42: `MCP_IMAGE: echotune-mcp`
  - Line 186: `- name: mcp`
  - Line 187: `dockerfile: mcp-server/Dockerfile`
  - Line 188: `context: mcp-server`
  - Line 189: `image: ${{ env.MCP_IMAGE }}`

### gemini-enhanced.yml
- **MCP References:** 4
- **Key Lines:**
  - Line 9: `- 'mcp-server/**'`
  - Line 99: `src/*|mcp-server/*|scripts/*)`
  - Line 257: `INPUT_INCLUDE: "src,scripts,mcp-server,tests,.github/workflows"`
  - Line 288: `-E "(api[_-]?key|secret|password|token)" src/ scripts/ mcp-server/ 2>/dev/null | \`

## 🔄 Auto-Update Information

This documentation is automatically updated by the MCP Documentation Automator.
- **Last Scan:** 2025-08-08T21:57:22.548Z
- **Auto-Update Script:** `scripts/mcp-documentation-automator.js`
- **Trigger:** On MCP changes, schedule, or manual execution

## 📊 Summary

- **Package Dependencies:** 1
- **Community Servers:** 6
- **Custom Servers:** 6
- **Workflow Integrations:** 6

## 📦 Package Dependencies

### @browserbasehq/mcp-server-browserbase
- **Version:** github:browserbase/mcp-server-browserbase
- **Type:** automation
- **Category:** automation

## 🌟 Community MCP Servers

### analytics-server
- **Files:** 1 files
- **Main Files:** analytics-mcp.js
- **Documentation:** ❌
- **Configuration:** ❌

### code-sandbox
- **Files:** 1 files
- **Main Files:** code-sandbox-mcp.js
- **Documentation:** ❌
- **Configuration:** ❌

### package-management
- **Files:** 1 files
- **Main Files:** package-version-mcp.js
- **Documentation:** ❌
- **Configuration:** ❌

### sentry-mcp
- **Description:** Sentry MCP Server for comprehensive error monitoring and performance tracking in EchoTune AI
- **Version:** 1.0.0
- **Files:** 5 files
- **Main Files:** sentry-mcp-server.js, test-sentry-mcp.js
- **Documentation:** ✅
- **Configuration:** ❌

### sequential-thinking
- **Description:** MCP server for sequential thinking and problem solving
- **Version:** 0.6.2
- **Files:** 6 files
- **Main Files:** index.ts
- **Documentation:** ✅
- **Configuration:** ✅

### testing-automation
- **Files:** 1 files
- **Main Files:** testing-automation-mcp.js
- **Documentation:** ❌
- **Configuration:** ❌

## 🔧 Custom MCP Servers

### coordination-server.js
- **Description:** Custom MCP server implementation
- **Lines of Code:** 201
- **Functions:** express, path, status, workflows, execution
- **MCP Integration:** ✅

### enhanced-mcp-orchestrator.js
- **Description:** Custom MCP server implementation
- **Lines of Code:** 592
- **Functions:** express, WebSocket, cors, fs, path
- **MCP Integration:** ✅

### enhanced-server.js
- **Description:** Custom MCP server implementation
- **Lines of Code:** 347
- **Functions:** express, puppeteer, cors, fs, path
- **MCP Integration:** ✅

### orchestration-engine.js
- **Description:** Custom MCP server implementation
- **Lines of Code:** 313
- **Functions:** EventEmitter, axios, initialize, executeWorkflow, workflow
- **MCP Integration:** ✅

### spotify_server.py
- **Description:** Custom MCP server implementation
- **Lines of Code:** 1133
- **Functions:** correctly
- **MCP Integration:** ✅

### workflow-manager.js
- **Description:** Custom MCP server implementation
- **Lines of Code:** 238
- **Functions:** fs, path, initialize, createCustomWorkflow, workflowId
- **MCP Integration:** ✅

## 🔄 Workflow Integrations

### #mcp-inntegration.yml
- **MCP References:** 5
- **Key Lines:**
  - Line 1: `name: MCP Servers Integration`
  - Line 7: `- 'mcp-servers/**'`
  - Line 8: `- 'scripts/mcp-manager.js'`
  - Line 10: `- '.github/workflows/mcp-integration.yml'`
  - Line 14: `- 'mcp-servers/**'`

### agent-mcp-automation.yml
- **MCP References:** 5
- **Key Lines:**
  - Line 1: `name: MCP Agent Automation & Validation`
  - Line 10: `description: 'Run MCP discovery scan'`
  - Line 24: `# Weekly MCP discovery on Sundays at 2 AM UTC`
  - Line 29: `MCP_SERVER_PORT: 3001`
  - Line 32: `mcp-discovery:`

### copilot-models.yml
- **MCP References:** 2
- **Key Lines:**
  - Line 406: `- **MCP Integration**: Advanced automation capabilities with 12+ MCP servers`
  - Line 541: `- MCP server integration tests`

### copilot-slash-commands.yml
- **MCP References:** 5
- **Key Lines:**
  - Line 510: `MCP[MCP Automation Server]`
  - Line 540: `LB --> MCP`
  - Line 554: `MCP --> FILES`
  - Line 1042: `# Start the MCP automation server (optional)`
  - Line 1043: `npm run mcp-server`

### digitalocean-deploy.yml
- **MCP References:** 5
- **Key Lines:**
  - Line 42: `MCP_IMAGE: echotune-mcp`
  - Line 186: `- name: mcp`
  - Line 187: `dockerfile: mcp-server/Dockerfile`
  - Line 188: `context: mcp-server`
  - Line 189: `image: ${{ env.MCP_IMAGE }}`

### gemini-enhanced.yml
- **MCP References:** 4
- **Key Lines:**
  - Line 9: `- 'mcp-server/**'`
  - Line 99: `src/*|mcp-server/*|scripts/*)`
  - Line 257: `INPUT_INCLUDE: "src,scripts,mcp-server,tests,.github/workflows"`
  - Line 288: `-E "(api[_-]?key|secret|password|token)" src/ scripts/ mcp-server/ 2>/dev/null | \`

## 🔄 Auto-Update Information

This documentation is automatically updated by the MCP Documentation Automator.
- **Last Scan:** 2025-08-08T21:55:33.127Z
- **Auto-Update Script:** `scripts/mcp-documentation-automator.js`
- **Trigger:** On MCP changes, schedule, or manual execution


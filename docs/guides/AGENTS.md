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

### Automated Validation Script

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
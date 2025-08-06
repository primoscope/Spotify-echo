# 🤖 AI Agent Instructions for MCP Server Integration

This document provides comprehensive instructions for AI coding agents working with EchoTune AI's Model Context Protocol (MCP) server ecosystem. It includes cheatsheets, best practices, and workflow guidelines for leveraging both internal and community MCP servers.

## Overview

EchoTune AI integrates with multiple MCP servers to enhance development productivity, code quality, and automation capabilities. This guide helps AI agents effectively utilize these tools in their workflows.

## Internal MCP Servers Cheatsheet

### 1. Sequential Thinking MCP Server
**Best Use Cases**:
- Breaking down complex implementation tasks
- Systematic debugging and problem analysis
- Architecture decision making
- Code review and quality assessment

**Quick Commands**:
```javascript
// Structure a complex task
await sequentialThinking.analyzeTask({
  task: "Implement real-time music recommendation updates",
  complexity: "high",
  constraints: ["performance", "scalability", "user experience"]
});

// Debug systematically
await sequentialThinking.debugIssue({
  problem: "Spotify API rate limiting causing timeouts",
  symptoms: ["slow response times", "intermittent failures"],
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
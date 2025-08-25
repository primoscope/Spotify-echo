# 🤖 Agent Development Guide
**Complete setup and workflow guide for GitHub Copilot Coding Agent and Cursor IDE integration with EchoTune AI**

## 🎯 Overview

EchoTune AI provides a comprehensive **Model Context Protocol (MCP) ecosystem** designed for seamless integration with AI coding agents. This guide covers setup, workflows, and best practices for maximizing productivity with research-driven development.

### 🚀 Quick Setup Summary

```bash
# 1. Generate Cursor configuration
npm run generate-cursor-mcp

# 2. Start MCP ecosystem  
npm run mcp:orchestrator-start

# 3. Validate system health
npm run mcp:enhanced-validation

# 4. Test Perplexity research (if configured)
npm run testperplexity
```

## 📋 Prerequisites

### Required Software
- **Cursor IDE** v0.47+ or **GitHub Copilot** with Coding Agent access
- **Node.js** 20+ and **npm** 10+
- **Git** with repository access

### Required Environment Variables
```bash
# Core Research Capabilities
PERPLEXITY_API_KEY=pplx-...           # Perplexity AI research
PERPLEXITY_COST_BUDGET_USD=0.50       # Cost control per session
PERPLEXITY_MAX_LATENCY_MS=1500        # Performance budget

# AI Providers (Optional but Recommended)
OPENAI_API_KEY=sk-...                 # Enhanced AI capabilities
GOOGLE_GEMINI_API_KEY=AI...           # Alternative provider
ANTHROPIC_API_KEY=sk-ant-...          # Claude integration

# System Integration
REDIS_URL=redis://localhost:6379      # Caching for performance
MONGODB_URI=mongodb://...             # Data analysis capabilities
SPOTIFY_CLIENT_ID=...                 # Music data integration
SPOTIFY_CLIENT_SECRET=...             # Spotify API access

# Development & Deployment
GITHUB_TOKEN=ghp_...                  # Repository operations
DO_API_TOKEN=dop_v1_...               # DigitalOcean deployment
BROWSERBASE_API_KEY=bb_...            # Cloud browser automation
BROWSERBASE_PROJECT_ID=...            # Browserbase project
```

## 🔧 Cursor IDE Setup

### Automated Configuration
```bash
# Generate complete Cursor configuration
npm run generate-cursor-mcp

# This creates:
# - .vscode/mcp.json (MCP server configuration)
# - .cursor/ai-workflows.json (workflow templates)  
# - .cursor/project-context.md (project documentation)
```

### Manual Configuration (Alternative)
Create `.vscode/mcp.json`:
```json
{
  "inputs": [
    {
      "id": "perplexity-key",
      "type": "promptString", 
      "description": "Perplexity API Key",
      "password": true
    }
  ],
  "mcpServers": {
    "perplexity": {
      "command": "node",
      "args": ["mcp-servers/perplexity-mcp/perplexity-mcp-server.js"],
      "env": {
        "PERPLEXITY_API_KEY": "${input:perplexity-key}",
        "PERPLEXITY_MAX_LATENCY_MS": "1500",
        "PERPLEXITY_MAX_MEMORY_MB": "256",
        "PERPLEXITY_COST_BUDGET_USD": "0.50"
      },
      "description": "AI-powered research with performance budgets"
    }
  }
}
```

## 🛠️ GitHub Copilot Coding Agent Setup

### Repository Configuration
1. **Enable Coding Agent** in repository settings
2. **Configure Secrets** in `Settings → Secrets and variables → Actions`
3. **Add Labels** to enable agent workflows:
   - `copilot-coding-agent`: Triggers agent preflight validation
   - `needs-research`: Indicates research requirement
   - `performance-critical`: Enforces strict performance budgets

### Agent Workflow Integration
The repository includes automated agent workflows:

- **`copilot-agent-preflight.yml`**: Validates secrets and provider latency
- **`agent-mcp-automation.yml`**: MCP validation with performance budgets
- **`mcp-validation-gateway.yml`**: Pre-merge validation gates

## 🔍 PR Reviewer Guide for AI Agents

### Code Review Focus Areas

#### Provider Integration Testing
When reviewing provider integration code, focus on these key test patterns:

**API Connectivity Test Pattern:**
```javascript
async testConnectivity() {
  console.log('\n🔍 Testing API Connectivity...');
  
  try {
    const response = await this.provider.generateCompletion([
      { role: 'user', content: 'Hello! Please respond with "Connection successful."' }
    ], { maxTokens: 50 });

    if (response.content && response.content.toLowerCase().includes('connection successful')) {
      console.log('✅ API connectivity successful.');
      console.log(`   Provider response: "${response.content.trim()}"`);
      this.results.connectivity = true;
    } else {
      throw new Error(`Unexpected response: ${response.content}`);
    }
  } catch (error) {
    console.log('❌ API connectivity failed:', error.message);
    this.results.connectivity = false;
  }
}
```

**Basic Prompt Test Pattern:**
```javascript
async testBasicPrompt() {
  console.log('\n🔍 Testing Basic Prompt...');

  try {
      const response = await this.provider.generateCompletion([
          { role: 'user', content: 'Explain the concept of a "language model" in one sentence.' }
      ]);

      if (response.content && response.content.length > 10) {
          console.log('✅ Basic prompt test successful.');
          console.log(`   Response: "${response.content.trim()}"`);
          this.results.basicPrompt = true;
      } else {
          throw new Error('Invalid or empty response for basic prompt.');
      }
  } catch (error) {
      console.log('❌ Basic prompt test failed:', error.message);
      this.results.basicPrompt = false;
  }
}
```

**Configuration Mode Verification Pattern:**
```javascript
async checkVertexMode() {
  console.log('\n🔍 Verifying Configuration Mode...');
  const isUsingVertex = this.provider.config.useVertex;
  const expectedMode = process.env.GEMINI_USE_VERTEX === 'true';

  if (isUsingVertex === expectedMode) {
    console.log(`✅ Provider is correctly in ${expectedMode ? 'Vertex AI' : 'Google AI Studio'} mode.`);
    this.results.vertexModeCheck = true;
  } else {
    console.log(`❌ FAIL: Provider is in the wrong mode. Expected 'useVertex' to be ${expectedMode}, but it is ${isUsingVertex}.`);
    this.results.vertexModeCheck = false;
  }
}
```

**Provider Initialization Pattern:**
```javascript
async initialize() {
  try {
    // Call super.initialize() to set up base provider properties
    await super.initialize();

    // Initialize enhanced Gemini client
    await this.client.initialize();

    console.log(`✅ Enhanced Gemini provider initialized`);
    console.log(`   Model: ${this.defaultModel}`);
    console.log(`   Client: ${this.client.getClientInfo().type}`);
    console.log(`   Safety: ${this.config.safetyMode}`);
    console.log(`   Function calling: ${this.config.functionCallingEnabled ? 'enabled' : 'disabled'}`);
    console.log(`   Caching: ${this.config.cacheTTL}ms TTL`);

  } catch (error) {
    console.error('❌ Failed to initialize enhanced Gemini provider:', error.message);
    this.isInitialized = false; // Ensure it's marked as not initialized on error
    throw error;
  }
}
```

#### Environment Configuration Validation
Ensure these environment variables are properly configured for Gemini provider testing:
```env
AI_ENABLE_METRICS=true
AI_MOCK_MODE=false
GCP_CREDENTIALS_VALIDATED=false
# Forcing Gemini to use Vertex AI for integration tests
GEMINI_USE_VERTEX=true
```

#### Review Checklist for Provider Testing
- [ ] API connectivity tests use expected response validation
- [ ] Basic prompt tests verify content length and validity
- [ ] Configuration mode checks match environment settings
- [ ] Provider initialization includes comprehensive logging
- [ ] Error handling covers all failure scenarios
- [ ] Mock mode support for testing without API quotas
- [ ] Fallback mechanisms are properly implemented
- [ ] Performance logging includes response times and metrics

## 📊 Performance Budgets & Validation

### Performance Budget Enforcement
All MCP operations must comply with performance budgets:

| Service | Latency (p95) | Memory | CPU | Cost |
|---------|---------------|---------|-----|------|
| **Perplexity** | ≤1500ms | ≤256MB | ≤0.5 cores | ≤$0.50/session |
| **Local Services** | ≤500ms | ≤128MB | ≤0.25 cores | N/A |
| **Global System** | ≤2000ms | ≤512MB | ≤70% | ≤$2.00/hour |

### Budget Validation Commands
```bash
# Check current performance metrics
npm run mcp:enhanced-validation

# Monitor system health
npm run mcp:health-monitor

# View performance baseline
cat enhanced-mcp-performance-baseline.json

# Test Perplexity performance
npm run testperplexity
```

## 🔄 Research Standards & Protocols

### Research-to-PR Loop Requirements
Every research-driven PR must include:

1. **Research Evidence**
   - Perplexity search queries and results
   - Academic sources and citations
   - Industry best practices references

2. **Performance Benchmarks**
   - Baseline performance measurements
   - Post-implementation performance comparison
   - Budget compliance validation

3. **Implementation Documentation**
   - Step-by-step implementation rationale
   - Trade-offs and alternatives considered
   - Testing strategy and results

### Research Query Standards
```javascript
// Example research query structure
{
  "q": "What are the latest developments in AI music recommendation systems in 2024?",
  "opts": {
    "model": "llama-3.1-sonar-large-128k-online",
    "max_tokens": 2000,
    "temperature": 0.3,
    "recency_filter": "month",
    "domain_filter": ["arxiv.org", "ieee.org", "acm.org"]
  }
}
```

## 🔄 Standard Operating Procedures (SOPs)

### SOP 1: Research-Backed Bug Fix (30 minutes)
1. **Research Phase (10 min)**
   ```
   @perplexity research "[error message] debugging techniques latest practices"
   @sequential-thinking analyze error patterns and root causes
   ```

2. **Implementation Phase (15 min)**
   ```
   @filesystem identify and analyze problematic code sections
   @github check related issues and historical fixes
   @sequential-thinking plan comprehensive fix strategy
   ```

3. **Validation Phase (5 min)**
   ```
   @health-monitor verify system performance post-fix
   @github create PR with research citations and testing evidence
   ```

### SOP 2: Feature Implementation with Research (45 minutes)
1. **Research & Planning (15 min)**
   ```
   @perplexity research "[feature] implementation best practices [technology stack]"
   @sequential-thinking create detailed implementation plan
   @github analyze existing codebase architecture
   ```

2. **Implementation (25 min)**
   ```
   @filesystem implement feature following research guidelines
   @sqlite add necessary database schema changes
   @browser test user interface and experience
   ```

3. **Documentation & Testing (5 min)**
   ```
   @filesystem create comprehensive tests and documentation
   @health-monitor validate performance impact
   @github create PR with research citations and benchmarks
   ```

### SOP 3: Performance Optimization (60 minutes)
1. **Analysis Phase (20 min)**
   ```
   @health-monitor generate comprehensive performance report
   @perplexity research "Node.js performance optimization techniques 2024"
   @sequential-thinking identify optimization opportunities
   ```

2. **Implementation Phase (30 min)**
   ```
   @filesystem implement performance optimizations
   @sqlite optimize database queries and indexes
   @redis implement caching strategies
   ```

3. **Validation Phase (10 min)**
   ```
   @health-monitor compare before/after performance metrics
   @github document performance improvements with benchmarks
   ```

## 🚨 Error Handling & Troubleshooting

### Common Issues & Solutions

#### MCP Server Not Available
```bash
# Diagnosis
npm run mcp:health-all

# Resolution
npm run mcp:orchestrator-start
npm run mcp:enhanced-validation
```

#### Perplexity API Errors
```bash
# Check API key and quota
npm run validate:api-keys --perplexity

# Test connectivity
npm run testperplexity

# Review cost budget
echo $PERPLEXITY_COST_BUDGET_USD
```

#### Performance Budget Violations
```bash
# Get current metrics
npm run mcp:enhanced-validation

# Review baseline comparison  
cat enhanced-mcp-performance-baseline.json

# Identify bottlenecks
npm run performance:mcp-analytics
```

---

## 🎉 Getting Started Checklist

- [ ] Install Cursor IDE or enable GitHub Copilot Coding Agent
- [ ] Configure environment variables (minimum: `PERPLEXITY_API_KEY`)
- [ ] Run `npm run generate-cursor-mcp` to set up configuration
- [ ] Test basic functionality with `npm run testperplexity`
- [ ] Validate system health with `npm run mcp:enhanced-validation`
- [ ] Try first research workflow: `@perplexity research "EchoTune AI architecture"`
- [ ] Review performance budgets with `@health-monitor status`

**Ready to start?** Your AI-powered development environment is now configured for maximum productivity with research-backed implementation capabilities!

---

## 📚 Legacy MCP Server Documentation

### Core MCP Servers (Historical Reference)

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

### 1. xcodebuildmcp
- **Package**: `xcodebuildmcp`
- **Description**: XcodeBuildMCP is a ModelContextProtocol server that provides tools for Xcode project management, simulator management, and app utilities.
- **Relevance Score**: 11/10
- **Source**: npm
- **URL**: [https://www.async-let.com/blog/xcodebuild-mcp/](https://www.async-let.com/blog/xcodebuild-mcp/)
- **Integration Suggestion**: undefined

### 2. punkpeye/awesome-mcp-servers
- **Package**: `@punkpeye/awesome-mcp-servers`
- **Description**: A collection of MCP servers.
- **Relevance Score**: 8/10
- **Source**: github
- **URL**: [https://github.com/punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers)
- **Integration Suggestion**: undefined

### 3. GLips/Figma-Context-MCP
- **Package**: `@GLips/Figma-Context-MCP`
- **Description**: MCP server to provide Figma layout information to AI coding agents like Cursor
- **Relevance Score**: 8/10
- **Source**: github
- **URL**: [https://github.com/GLips/Figma-Context-MCP](https://github.com/GLips/Figma-Context-MCP)
- **Integration Suggestion**: undefined

### 4. lharries/whatsapp-mcp
- **Package**: `@lharries/whatsapp-mcp`
- **Description**: WhatsApp MCP server
- **Relevance Score**: 8/10
- **Source**: github
- **URL**: [https://github.com/lharries/whatsapp-mcp](https://github.com/lharries/whatsapp-mcp)
- **Integration Suggestion**: undefined

### 5. aipotheosis-labs/aci
- **Package**: `@aipotheosis-labs/aci`
- **Description**: ACI.dev is the open source tool-calling platform that hooks up 600+ tools into any agentic IDE or custom AI agent through direct function calling or a unified MCP server. The birthplace of VibeOps.
- **Relevance Score**: 8/10
- **Source**: github
- **URL**: [https://github.com/aipotheosis-labs/aci](https://github.com/aipotheosis-labs/aci)
- **Integration Suggestion**: undefined

### 6. graphlit-mcp-server
- **Package**: `graphlit-mcp-server`
- **Description**: Graphlit MCP Server
- **Relevance Score**: 8/10
- **Source**: npm
- **URL**: [https://github.com/graphlit/graphlit-mcp-server#readme](https://github.com/graphlit/graphlit-mcp-server#readme)
- **Integration Suggestion**: undefined

### 7. @openbnb/mcp-server-airbnb
- **Package**: `@openbnb/mcp-server-airbnb`
- **Description**: MCP server for Airbnb search and listing details
- **Relevance Score**: 8/10
- **Source**: npm
- **URL**: [undefined](undefined)
- **Integration Suggestion**: undefined

### 8. scrapeless-mcp-server
- **Package**: `scrapeless-mcp-server`
- **Description**: Scrapeless Mcp Server
- **Relevance Score**: 8/10
- **Source**: npm
- **URL**: [https://scrapeless.com](https://scrapeless.com)
- **Integration Suggestion**: undefined

### 9. @langchain/mcp-adapters
- **Package**: `@langchain/mcp-adapters`
- **Description**: LangChain.js adapters for Model Context Protocol (MCP)
- **Relevance Score**: 8/10
- **Source**: npm
- **URL**: [https://github.com/langchain-ai/langchainjs/tree/main/libs/langchain-mcp-adapters/](https://github.com/langchain-ai/langchainjs/tree/main/libs/langchain-mcp-adapters/)
- **Integration Suggestion**: undefined

### 10. mcp-framework
- **Package**: `mcp-framework`
- **Description**: Framework for building Model Context Protocol (MCP) servers in Typescript
- **Relevance Score**: 8/10
- **Source**: npm
- **URL**: [undefined](undefined)
- **Integration Suggestion**: undefined

**Next Steps**: Review these candidates and consider integration based on project priorities.

### 1. xcodebuildmcp
- **Package**: `xcodebuildmcp`
- **Description**: XcodeBuildMCP is a ModelContextProtocol server that provides tools for Xcode project management, simulator management, and app utilities.
- **Relevance Score**: 11/10
- **Source**: npm
- **URL**: [https://www.async-let.com/blog/xcodebuild-mcp/](https://www.async-let.com/blog/xcodebuild-mcp/)
- **Integration Suggestion**: undefined

### 2. perplexityai/modelcontextprotocol
- **Package**: `@perplexityai/modelcontextprotocol`
- **Description**: A Model Context Protocol Server connector for Perplexity API, to enable web search without leaving the MCP ecosystem.
- **Relevance Score**: 8/10
- **Source**: github
- **URL**: [https://github.com/perplexityai/modelcontextprotocol](https://github.com/perplexityai/modelcontextprotocol)
- **Integration Suggestion**: undefined

### 3. dataforseo/mcp-server-typescript
- **Package**: `@dataforseo/mcp-server-typescript`
- **Description**: DataForSEO API modelcontextprotocol server 
- **Relevance Score**: 8/10
- **Source**: github
- **URL**: [https://github.com/dataforseo/mcp-server-typescript](https://github.com/dataforseo/mcp-server-typescript)
- **Integration Suggestion**: undefined

### 4. dweigend/joplin-mcp-server
- **Package**: `@dweigend/joplin-mcp-server`
- **Description**: A Model Context Protocol (MCP) Server for https://joplinapp.org/ that enables note access through the https://modelcontextprotocol.io. Perfect for integration with AI assistants like Claude.
- **Relevance Score**: 8/10
- **Source**: github
- **URL**: [https://github.com/dweigend/joplin-mcp-server](https://github.com/dweigend/joplin-mcp-server)
- **Integration Suggestion**: undefined

### 5. recraft-ai/mcp-recraft-server
- **Package**: `@recraft-ai/mcp-recraft-server`
- **Description**: MCP (modelcontextprotocol) server implementation for Recraft API
- **Relevance Score**: 8/10
- **Source**: github
- **URL**: [https://github.com/recraft-ai/mcp-recraft-server](https://github.com/recraft-ai/mcp-recraft-server)
- **Integration Suggestion**: undefined

### 6. TickHaiJun/mysql-mcp-server
- **Package**: `@TickHaiJun/mysql-mcp-server`
- **Description**: MCP MySQL Server 是一个基于 @modelcontextprotocol/sdk 的 MySQL 工具服务，支持 SQL 查询、表结构获取、连接检测等功能，适用于 AI 代理、自动化工具等场景。
- **Relevance Score**: 8/10
- **Source**: github
- **URL**: [https://github.com/TickHaiJun/mysql-mcp-server](https://github.com/TickHaiJun/mysql-mcp-server)
- **Integration Suggestion**: undefined

### 7. covalenthq/goldrush-mcp-server
- **Package**: `@covalenthq/goldrush-mcp-server`
- **Description**: This project provides a MCP (Model Context Protocol) server that exposes Covalent's GoldRush APIs as MCP resources and tools. It is implemented in TypeScript using @modelcontextprotocol/sdk and @covalenthq/client-sdk.
- **Relevance Score**: 8/10
- **Source**: github
- **URL**: [https://github.com/covalenthq/goldrush-mcp-server](https://github.com/covalenthq/goldrush-mcp-server)
- **Integration Suggestion**: undefined

### 8. jaimaann/MCPRepository
- **Package**: `@jaimaann/MCPRepository`
- **Description**: Open Source Repository for ModelContextProtocol MCP server
- **Relevance Score**: 8/10
- **Source**: github
- **URL**: [https://github.com/jaimaann/MCPRepository](https://github.com/jaimaann/MCPRepository)
- **Integration Suggestion**: undefined

### 9. softgridinc-pte-ltd/mcp-excel-reader-server
- **Package**: `@softgridinc-pte-ltd/mcp-excel-reader-server`
- **Description**: A MS excel server based on modelcontextprotocol
- **Relevance Score**: 8/10
- **Source**: github
- **URL**: [https://github.com/softgridinc-pte-ltd/mcp-excel-reader-server](https://github.com/softgridinc-pte-ltd/mcp-excel-reader-server)
- **Integration Suggestion**: undefined

### 10. Anshumaan031/Crawl4AI-RAG-MCP-Server
- **Package**: `@Anshumaan031/Crawl4AI-RAG-MCP-Server`
- **Description**: A powerful implementation of the [Model Context Protocol (MCP)](https://modelcontextprotocol.io) integrated with [Crawl4AI](https://crawl4ai.com) and [Supabase](https://supabase.com/) for providing AI agents and AI coding assistants with advanced web crawling and RAG capabilities.
- **Relevance Score**: 8/10
- **Source**: github
- **URL**: [https://github.com/Anshumaan031/Crawl4AI-RAG-MCP-Server](https://github.com/Anshumaan031/Crawl4AI-RAG-MCP-Server)
- **Integration Suggestion**: undefined

**Next Steps**: Review these candidates and consider integration based on project priorities.

### 1. n8n-mcp
- **Package**: `n8n-mcp`
- **Description**: Integration between n8n workflow automation and Model Context Protocol (MCP)
- **Relevance Score**: 15/10
- **Source**: npm
- **URL**: [https://github.com/czlonkowski/n8n-mcp#readme](https://github.com/czlonkowski/n8n-mcp#readme)
- **Integration Suggestion**: undefined

### 2. mcp-server-code-runner
- **Package**: `mcp-server-code-runner`
- **Description**: Code Runner MCP Server
- **Relevance Score**: 11/10
- **Source**: npm
- **URL**: [https://github.com/formulahendry/mcp-server-code-runner#readme](https://github.com/formulahendry/mcp-server-code-runner#readme)
- **Integration Suggestion**: undefined

### 3. xcodebuildmcp
- **Package**: `xcodebuildmcp`
- **Description**: XcodeBuildMCP is a ModelContextProtocol server that provides tools for Xcode project management, simulator management, and app utilities.
- **Relevance Score**: 11/10
- **Source**: npm
- **URL**: [https://www.async-let.com/blog/xcodebuild-mcp/](https://www.async-let.com/blog/xcodebuild-mcp/)
- **Integration Suggestion**: undefined

### 4. puppeteer-mcp-server
- **Package**: `puppeteer-mcp-server`
- **Description**: Experimental MCP server for browser automation using Puppeteer (inspired by @modelcontextprotocol/server-puppeteer)
- **Relevance Score**: 10/10
- **Source**: npm
- **URL**: [https://github.com/merajmehrabi/puppeteer-mcp-server](https://github.com/merajmehrabi/puppeteer-mcp-server)
- **Integration Suggestion**: undefined

### 5. mongodb-mcp-server
- **Package**: `mongodb-mcp-server`
- **Description**: MongoDB Model Context Protocol Server
- **Relevance Score**: 9/10
- **Source**: npm
- **URL**: [https://github.com/mongodb-js/mongodb-mcp-server](https://github.com/mongodb-js/mongodb-mcp-server)
- **Integration Suggestion**: undefined

### 6. TensorBlock/awesome-mcp-servers
- **Package**: `@TensorBlock/awesome-mcp-servers`
- **Description**: A comprehensive collection of Model Context Protocol (MCP) servers
- **Relevance Score**: 8/10
- **Source**: github
- **URL**: [https://github.com/TensorBlock/awesome-mcp-servers](https://github.com/TensorBlock/awesome-mcp-servers)
- **Integration Suggestion**: undefined

### 7. taylorwilsdon/google_workspace_mcp
- **Package**: `@taylorwilsdon/google_workspace_mcp`
- **Description**: Control Gmail, Google Calendar, Docs, Sheets, Slides, Chat, Forms, Tasks, Search & Drive with AI - Comprehensive Google Workspace / G Suite MCP Server
- **Relevance Score**: 8/10
- **Source**: github
- **URL**: [https://github.com/taylorwilsdon/google_workspace_mcp](https://github.com/taylorwilsdon/google_workspace_mcp)
- **Integration Suggestion**: undefined

### 8. opensumi/core
- **Package**: `@opensumi/core`
- **Description**: A framework helps you quickly build AI Native IDE products. MCP Client, supports Model Context Protocol (MCP) tools via MCP server.
- **Relevance Score**: 8/10
- **Source**: github
- **URL**: [https://github.com/opensumi/core](https://github.com/opensumi/core)
- **Integration Suggestion**: undefined

### 9. zcaceres/markdownify-mcp
- **Package**: `@zcaceres/markdownify-mcp`
- **Description**: A Model Context Protocol server for converting almost anything to Markdown
- **Relevance Score**: 8/10
- **Source**: github
- **URL**: [https://github.com/zcaceres/markdownify-mcp](https://github.com/zcaceres/markdownify-mcp)
- **Integration Suggestion**: undefined

### 10. blazickjp/arxiv-mcp-server
- **Package**: `@blazickjp/arxiv-mcp-server`
- **Description**: A Model Context Protocol server for searching and analyzing arXiv papers
- **Relevance Score**: 8/10
- **Source**: github
- **URL**: [https://github.com/blazickjp/arxiv-mcp-server](https://github.com/blazickjp/arxiv-mcp-server)
- **Integration Suggestion**: undefined

**Next Steps**: Review these candidates and consider integration based on project priorities.

### 1. n8n-mcp
- **Package**: `n8n-mcp`
- **Description**: Integration between n8n workflow automation and Model Context Protocol (MCP)
- **Relevance Score**: 15/10
- **Source**: npm
- **URL**: [https://github.com/czlonkowski/n8n-mcp#readme](https://github.com/czlonkowski/n8n-mcp#readme)
- **Integration Suggestion**: undefined

### 2. mcp-server-code-runner
- **Package**: `mcp-server-code-runner`
- **Description**: Code Runner MCP Server
- **Relevance Score**: 11/10
- **Source**: npm
- **URL**: [https://github.com/formulahendry/mcp-server-code-runner#readme](https://github.com/formulahendry/mcp-server-code-runner#readme)
- **Integration Suggestion**: undefined

### 3. xcodebuildmcp
- **Package**: `xcodebuildmcp`
- **Description**: XcodeBuildMCP is a ModelContextProtocol server that provides tools for Xcode project management, simulator management, and app utilities.
- **Relevance Score**: 11/10
- **Source**: npm
- **URL**: [https://www.async-let.com/blog/xcodebuild-mcp/](https://www.async-let.com/blog/xcodebuild-mcp/)
- **Integration Suggestion**: undefined

### 4. puppeteer-mcp-server
- **Package**: `puppeteer-mcp-server`
- **Description**: Experimental MCP server for browser automation using Puppeteer (inspired by @modelcontextprotocol/server-puppeteer)
- **Relevance Score**: 10/10
- **Source**: npm
- **URL**: [https://github.com/merajmehrabi/puppeteer-mcp-server](https://github.com/merajmehrabi/puppeteer-mcp-server)
- **Integration Suggestion**: undefined

### 5. mongodb-mcp-server
- **Package**: `mongodb-mcp-server`
- **Description**: MongoDB Model Context Protocol Server
- **Relevance Score**: 9/10
- **Source**: npm
- **URL**: [https://github.com/mongodb-js/mongodb-mcp-server](https://github.com/mongodb-js/mongodb-mcp-server)
- **Integration Suggestion**: undefined

### 6. appcypher/awesome-mcp-servers
- **Package**: `@appcypher/awesome-mcp-servers`
- **Description**: Awesome MCP Servers - A curated list of Model Context Protocol servers
- **Relevance Score**: 8/10
- **Source**: github
- **URL**: [https://github.com/appcypher/awesome-mcp-servers](https://github.com/appcypher/awesome-mcp-servers)
- **Integration Suggestion**: undefined

### 7. CoplayDev/unity-mcp
- **Package**: `@CoplayDev/unity-mcp`
- **Description**: A Unity MCP server that allows MCP clients like Claude Desktop or Cursor to perform Unity Editor actions.
- **Relevance Score**: 8/10
- **Source**: github
- **URL**: [https://github.com/CoplayDev/unity-mcp](https://github.com/CoplayDev/unity-mcp)
- **Integration Suggestion**: undefined

### 8. metatool-ai/metamcp
- **Package**: `@metatool-ai/metamcp`
- **Description**: MCP Aggregator, Orchestrator, Middleware, Gateway in one docker
- **Relevance Score**: 8/10
- **Source**: github
- **URL**: [https://github.com/metatool-ai/metamcp](https://github.com/metatool-ai/metamcp)
- **Integration Suggestion**: undefined

### 9. isaacphi/mcp-language-server
- **Package**: `@isaacphi/mcp-language-server`
- **Description**: mcp-language-server gives MCP enabled clients access semantic tools like get definition, references, rename, and diagnostics.
- **Relevance Score**: 8/10
- **Source**: github
- **URL**: [https://github.com/isaacphi/mcp-language-server](https://github.com/isaacphi/mcp-language-server)
- **Integration Suggestion**: undefined

### 10. SecretiveShell/MCP-Bridge
- **Package**: `@SecretiveShell/MCP-Bridge`
- **Description**: A middleware to provide an openAI compatible endpoint that can call MCP tools
- **Relevance Score**: 8/10
- **Source**: github
- **URL**: [https://github.com/SecretiveShell/MCP-Bridge](https://github.com/SecretiveShell/MCP-Bridge)
- **Integration Suggestion**: undefined

**Next Steps**: Review these candidates and consider integration based on project priorities.

### 1. n8n-mcp
- **Package**: `n8n-mcp`
- **Description**: Integration between n8n workflow automation and Model Context Protocol (MCP)
- **Relevance Score**: 15/10
- **Source**: npm
- **URL**: [https://github.com/czlonkowski/n8n-mcp#readme](https://github.com/czlonkowski/n8n-mcp#readme)
- **Integration Suggestion**: undefined

### 2. mcp-server-code-runner
- **Package**: `mcp-server-code-runner`
- **Description**: Code Runner MCP Server
- **Relevance Score**: 11/10
- **Source**: npm
- **URL**: [https://github.com/formulahendry/mcp-server-code-runner#readme](https://github.com/formulahendry/mcp-server-code-runner#readme)
- **Integration Suggestion**: undefined

### 3. xcodebuildmcp
- **Package**: `xcodebuildmcp`
- **Description**: XcodeBuildMCP is a ModelContextProtocol server that provides tools for Xcode project management, simulator management, and app utilities.
- **Relevance Score**: 11/10
- **Source**: npm
- **URL**: [https://www.async-let.com/blog/xcodebuild-mcp/](https://www.async-let.com/blog/xcodebuild-mcp/)
- **Integration Suggestion**: undefined

### 4. puppeteer-mcp-server
- **Package**: `puppeteer-mcp-server`
- **Description**: Experimental MCP server for browser automation using Puppeteer (inspired by @modelcontextprotocol/server-puppeteer)
- **Relevance Score**: 10/10
- **Source**: npm
- **URL**: [https://github.com/merajmehrabi/puppeteer-mcp-server](https://github.com/merajmehrabi/puppeteer-mcp-server)
- **Integration Suggestion**: undefined

### 5. @hisma/server-puppeteer
- **Package**: `@hisma/server-puppeteer`
- **Description**: Fork and update (v0.6.5) of the original @modelcontextprotocol/server-puppeteer MCP server for browser automation using Puppeteer.
- **Relevance Score**: 10/10
- **Source**: npm
- **URL**: [https://github.com/Hisma/servers-archived/tree/main/src/puppeteer](https://github.com/Hisma/servers-archived/tree/main/src/puppeteer)
- **Integration Suggestion**: undefined

### 6. mongodb-mcp-server
- **Package**: `mongodb-mcp-server`
- **Description**: MongoDB Model Context Protocol Server
- **Relevance Score**: 9/10
- **Source**: npm
- **URL**: [https://github.com/mongodb-js/mongodb-mcp-server](https://github.com/mongodb-js/mongodb-mcp-server)
- **Integration Suggestion**: undefined

### 7. jlowin/fastmcp
- **Package**: `@jlowin/fastmcp`
- **Description**: 🚀 The fast, Pythonic way to build MCP servers and clients
- **Relevance Score**: 8/10
- **Source**: github
- **URL**: [https://github.com/jlowin/fastmcp](https://github.com/jlowin/fastmcp)
- **Integration Suggestion**: undefined

### 8. mcp-use/mcp-use
- **Package**: `@mcp-use/mcp-use`
- **Description**: mcp-use is the easiest way to interact with mcp servers with custom agents
- **Relevance Score**: 8/10
- **Source**: github
- **URL**: [https://github.com/mcp-use/mcp-use](https://github.com/mcp-use/mcp-use)
- **Integration Suggestion**: undefined

### 9. nanbingxyz/5ire
- **Package**: `@nanbingxyz/5ire`
- **Description**: 5ire is a cross-platform desktop AI assistant, MCP client. It compatible with major service providers,  supports local knowledge base and  tools via model context protocol servers .
- **Relevance Score**: 8/10
- **Source**: github
- **URL**: [https://github.com/nanbingxyz/5ire](https://github.com/nanbingxyz/5ire)
- **Integration Suggestion**: undefined

### 10. mendableai/firecrawl-mcp-server
- **Package**: `@mendableai/firecrawl-mcp-server`
- **Description**: 🔥 Official Firecrawl MCP Server - Adds powerful web scraping to Cursor, Claude and any other LLM clients.
- **Relevance Score**: 8/10
- **Source**: github
- **URL**: [https://github.com/mendableai/firecrawl-mcp-server](https://github.com/mendableai/firecrawl-mcp-server)
- **Integration Suggestion**: undefined

**Next Steps**: Review these candidates and consider integration based on project priorities.

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

## 🤖 Agent-Created PR Acceptance Criteria

### Research Evidence Requirements
- [ ] **Citations**: All research claims include proper citations with sources and dates
- [ ] **Research Summary**: Clear summary of research methodology and sources used
- [ ] **Fact Verification**: Cross-reference key facts across multiple credible sources
- [ ] **Recency Check**: Ensure information is current (prefer sources within requested timeframe)

### Technical Implementation Standards  
- [ ] **Performance Benchmarks**: Code changes include performance impact analysis
- [ ] **Tests Added**: New functionality includes appropriate test coverage
- [ ] **Documentation Updated**: Changes reflected in relevant documentation files
- [ ] **Error Handling**: Comprehensive error handling with meaningful error messages

### Code Quality Checklist
- [ ] **Linting Passed**: Code passes all linting and formatting checks
- [ ] **Security Review**: No new security vulnerabilities introduced
- [ ] **Dependency Audit**: New dependencies justified and security-scanned
- [ ] **Breaking Changes**: Breaking changes documented with migration guide

### MCP Integration Requirements
- [ ] **MCP Health**: All MCP servers remain functional after changes
- [ ] **Performance Budgets**: Changes don't exceed defined performance budgets
- [ ] **Resource Limits**: Memory and CPU usage within defined limits
- [ ] **Backwards Compatibility**: Existing MCP server integrations continue working

### Validation and Artifacts
- [ ] **Validation Pipeline**: Enhanced MCP validation pipeline passes
- [ ] **Performance Baseline**: Performance metrics don't regress beyond thresholds
- [ ] **Artifacts Generated**: Required JSON reports and summaries generated
- [ ] **PR Comment**: Automated PR comment with validation results posted

### Research Budget Guidelines
- **Cost Per Research Session**: Target <$0.50 USD for Perplexity queries
- **Token Limits**: Appropriate max_tokens settings for query complexity
- **Caching Strategy**: Utilize caching for repeated queries to minimize costs
- **Model Selection**: Use smallest appropriate model for the research task

### Example Research Validation

#### ✅ Acceptable Research Example:
```markdown
## Research Summary
**Query**: "Latest developments in AI music recommendation systems 2024"
**Sources**: 3 recent papers from ACM Digital Library, 2 industry reports from Spotify Engineering
**Methodology**: Searched recent publications (last 6 months), cross-referenced findings

### Key Findings:
1. **Transformer-based models** showing 15% improvement in recommendation accuracy [1]
2. **Multi-modal approaches** combining audio and text data gaining adoption [2,3]
3. **Real-time personalization** becoming standard in major platforms [4,5]

### Citations:
[1] Smith, J. et al. "Neural Music Recommendation Systems" - ACM RecSys 2024
[2] Zhang, L. "Multi-modal Music Discovery" - Spotify Engineering Blog, March 2024
[3] Brown, M. "Audio-Text Fusion for Recommendations" - ISMIR 2024
[4] Johnson, K. "Real-time Personalization at Scale" - Netflix Tech Blog, Feb 2024
[5] Davis, R. "Modern Recommendation Architectures" - ACM Computing Surveys, Jan 2024

**Cost**: $0.23 USD, **Response Time**: 1,247ms ✅
```

#### ❌ Unacceptable Research Example:
```markdown
## Research Summary
AI music recommendation systems use machine learning to suggest songs. They are becoming more advanced.

**Cost**: $0.67 USD, **Response Time**: 2,100ms ❌
**Issues**: No citations, vague findings, exceeded cost and latency budgets
```

### Enforcement
- PRs failing acceptance criteria will be marked for revision
- Automated validation checks block merge until criteria met  
- Manual review required for complex research-based changes
- Repeat violations may result in temporary agent access restrictions

This ensures all agent-created PRs maintain high standards for research quality, technical implementation, and system performance.

## 🤖 MCP Ecosystem Status Report

**Generated:** Auto-updated by MCP Documentation Automation
**Last Update:** Latest pipeline run

### 📊 Quick Stats
- **Active MCP Servers**: 8+ integrated
- **Community Servers**: 7 analyzed  
- **Custom Implementations**: 6 active
- **Validation Score**: Generated from latest validation run

For detailed server discovery results and integration status, see the latest auto-generated reports:
- [MCP Integration Summary](../MCP_INTEGRATION_SUMMARY.md)
- [Enhanced Validation Report](../../enhanced-mcp-validation-report.json)
- [Performance Baseline](../../enhanced-mcp-performance-baseline.json)

---


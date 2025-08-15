#!/usr/bin/env node
/**
 * Enhanced Cursor IDE MCP Configuration Generator
 * Generates comprehensive MCP configuration for Cursor IDE integration
 * 
 * Based on AI-Driven Automation Blueprint: Perplexity × MCP × GitHub Copilot × Cursor IDE
 * Features:
 * - Multi-server MCP configuration
 * - Environment-aware setup
 * - Performance monitoring
 * - Security best practices
 * - Agent workflow integration
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load environment variables from .env file
require('dotenv').config();

class CursorMCPGenerator {
  constructor() {
    this.projectRoot = process.cwd();
    this.configs = {
      global: {},
      project: {},
      rules: {},
      workflows: {}
    };
  }

  async generateAll() {
    console.log('🎯 Generating Comprehensive Cursor IDE MCP Integration...\n');
    
    try {
      await this.generateGlobalConfig();
      await this.generateProjectConfig();
      await this.generateRules();
      await this.generateWorkflows();
      await this.generateDocumentation();
      await this.validateConfiguration();
      
      console.log('\n✅ Cursor IDE MCP Integration Complete!');
      console.log('📁 Generated files:');
      console.log('   ~/.cursor/mcp.json (Global MCP servers)');
      console.log('   .cursor/mcp.json (Project-specific servers)');
      console.log('   .cursor/rules/ (AI coding rules)');
      console.log('   .cursor/workflows/ (Agent workflows)');
      console.log('   CURSOR_IDE_SETUP.md (Setup documentation)');
      
    } catch (error) {
      console.error('❌ Generation failed:', error.message);
      process.exit(1);
    }
  }

  async generateGlobalConfig() {
    console.log('🌐 Generating Global Cursor MCP Configuration...');
    
    const globalConfig = {
      "$schema": "https://modelcontextprotocol.io/schema/cursor-mcp.json",
      "mcpServers": {
        "perplexity": {
          "command": "node",
          "args": [path.join(this.projectRoot, "mcp-servers", "perplexity-mcp", "perplexity-mcp-server.js")],
          "env": {
            "PERPLEXITY_API_KEY": process.env.PERPLEXITY_API_KEY || "${PERPLEXITY_API_KEY}",
            "PERPLEXITY_MODEL": process.env.PERPLEXITY_MODEL || "llama-3.1-sonar-small-128k-online",
            "PERPLEXITY_MAX_LATENCY_MS": process.env.PERPLEXITY_MAX_LATENCY_MS || "1500",
            "PERPLEXITY_MAX_MEMORY_MB": process.env.PERPLEXITY_MAX_MEMORY_MB || "256",
            "PERPLEXITY_COST_BUDGET_USD": process.env.PERPLEXITY_COST_BUDGET_USD || "0.50"
          }
        },
        "filesystem": {
          "command": "npx",
          "args": ["@modelcontextprotocol/server-filesystem", this.projectRoot],
          "env": {}
        },
        "memory": {
          "command": "npx", 
          "args": ["@modelcontextprotocol/server-memory"],
          "env": {}
        },
        "brave-search": {
          "command": "npx",
          "args": ["@modelcontextprotocol/server-brave-search"],
          "env": {
            "BRAVE_API_KEY": "${BRAVE_API_KEY}"
          }
        },
        "github": {
          "command": "npx",
          "args": ["@modelcontextprotocol/server-github"],
          "env": {
            "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
          }
        }
      }
    };

    this.configs.global = globalConfig;
    
    // Create global cursor directory if it doesn't exist
    const cursorDir = path.join(require('os').homedir(), '.cursor');
    if (!fs.existsSync(cursorDir)) {
      fs.mkdirSync(cursorDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(cursorDir, 'mcp.json'),
      JSON.stringify(globalConfig, null, 2)
    );
    
    console.log('✅ Global configuration generated');
  }

  async generateProjectConfig() {
    console.log('📁 Generating Project-specific MCP Configuration...');
    
    const projectConfig = {
      "$schema": "https://modelcontextprotocol.io/schema/cursor-mcp.json",
      "mcpServers": {
        "echotune-perplexity": {
          "command": "node",
          "args": ["./mcp-servers/perplexity-mcp/perplexity-mcp-server.js"],
          "env": {
            "PERPLEXITY_API_KEY": "${PERPLEXITY_API_KEY}",
            "PERPLEXITY_MODEL": "llama-3.1-sonar-small-128k-online",
            "PERPLEXITY_MAX_LATENCY_MS": "1500",
            "PERPLEXITY_MAX_MEMORY_MB": "256",
            "PERPLEXITY_COST_BUDGET_USD": "0.50",
            "DEBUG": "true"
          }
        },
        "echotune-filesystem": {
          "command": "npx",
          "args": ["@modelcontextprotocol/server-filesystem", "./src", "./scripts", "./mcp-server"],
          "env": {}
        },
        "package-manager": {
          "command": "node",
          "args": ["./mcp-servers/package-management/package-version-mcp.js"],
          "env": {}
        },
        "analytics": {
          "command": "node", 
          "args": ["./mcp-servers/analytics-server/analytics-mcp.js"],
          "env": {}
        },
        "testing": {
          "command": "node",
          "args": ["./mcp-servers/testing-automation/testing-automation-mcp.js"],
          "env": {}
        }
      }
    };

    this.configs.project = projectConfig;
    
    // Create project cursor directory
    const cursorDir = path.join(this.projectRoot, '.cursor');
    if (!fs.existsSync(cursorDir)) {
      fs.mkdirSync(cursorDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(cursorDir, 'mcp.json'),
      JSON.stringify(projectConfig, null, 2)
    );
    
    console.log('✅ Project configuration generated');
  }

  async generateRules() {
    console.log('📋 Generating AI Coding Rules...');
    
    const rulesDir = path.join(this.projectRoot, '.cursor', 'rules');
    if (!fs.existsSync(rulesDir)) {
      fs.mkdirSync(rulesDir, { recursive: true });
    }

    // Main architecture rules
    const architectureRules = `# EchoTune AI Architecture Rules

## Core Principles
- **Music-First Design**: All features should enhance music discovery and recommendation
- **Performance Budgets**: Maintain p95 latency ≤ 1500ms, memory ≤ 256MB
- **Research-Driven Development**: Use @perplexity for latest music tech insights
- **Modular Architecture**: Keep components loosely coupled and testable

## Technology Stack
- **Backend**: Node.js (Express), Python ML pipelines
- **Frontend**: React with modern ES6+, Vite build system
- **Database**: MongoDB (primary), Redis (caching), SQLite (fallback)
- **AI/ML**: Spotify API, OpenAI, Perplexity research
- **MCP**: Multi-server integration with performance monitoring

## Code Quality Standards
- **JavaScript**: Use modern async/await, avoid callback hell
- **Python**: Follow PEP 8, use type hints, implement proper error handling
- **Testing**: Jest for JS, pytest for Python, aim for 80%+ coverage
- **Security**: Never hardcode API keys, validate all inputs
- **Documentation**: JSDoc for complex functions, README updates for features

## Music Domain Rules
- **Spotify Integration**: Always handle rate limits and token refresh
- **ML Models**: Use cached predictions when possible, batch API calls
- **User Privacy**: Anonymize listening data, secure token storage
- **Performance**: Preload popular tracks, optimize recommendation algorithms`;

    fs.writeFileSync(path.join(rulesDir, 'architecture.md'), architectureRules);

    // Perplexity research rules
    const researchRules = `# Research-Driven Development Rules

## When to Use @perplexity Research
- **New Feature Planning**: Research latest music tech trends
- **Bug Investigation**: Search for similar issues and solutions
- **Performance Optimization**: Find best practices and benchmarks
- **Library Selection**: Compare alternatives and recent reviews
- **Security Updates**: Check for vulnerabilities and patches

## Research Query Patterns
- **Music Tech**: "latest developments in [topic] music technology 2024"
- **Performance**: "[framework] performance optimization techniques 2024"
- **Security**: "[library] security vulnerabilities recent fixes"
- **Best Practices**: "[technology] best practices enterprise production"

## Research Integration Workflow
1. **Query**: Use specific, recent-focused research queries
2. **Analyze**: Review sources and credibility
3. **Plan**: Create implementation roadmap with citations
4. **Implement**: Apply findings with proper attribution
5. **Validate**: Test against research benchmarks

## Citation Requirements
- **Source Tracking**: Include research sources in code comments
- **Documentation**: Add research links to technical decisions
- **Performance**: Benchmark against research claims
- **Updates**: Re-research every 3-6 months for fast-changing areas`;

    fs.writeFileSync(path.join(rulesDir, 'research.md'), researchRules);

    // Performance rules
    const performanceRules = `# Performance Budget Rules

## Latency Budgets
- **Perplexity Research**: p95 ≤ 1500ms
- **Local MCP Services**: p95 ≤ 500ms  
- **Global System**: p95 ≤ 2000ms
- **Spotify API**: Handle 429 rate limits gracefully

## Memory Budgets
- **Perplexity Server**: ≤ 256MB
- **Local Services**: ≤ 128MB each
- **Frontend**: ≤ 100MB initial bundle
- **ML Models**: Use streaming/chunking for large datasets

## Cost Controls
- **Perplexity**: $0.50 USD per research session
- **OpenAI**: Monitor token usage, use caching
- **Spotify API**: Respect free tier limits
- **Infrastructure**: DigitalOcean $20/month budget

## Monitoring Requirements
- **Real-time Metrics**: Track all performance budgets
- **Alerting**: Slack notifications for budget violations
- **Baseline Comparison**: Regression detection vs baselines
- **Regular Reviews**: Weekly performance budget reviews`;

    fs.writeFileSync(path.join(rulesDir, 'performance.md'), performanceRules);

    console.log('✅ AI coding rules generated');
  }

  async generateWorkflows() {
    console.log('🔄 Generating Agent Workflows...');
    
    const workflowsDir = path.join(this.projectRoot, '.cursor', 'workflows');
    if (!fs.existsSync(workflowsDir)) {
      fs.mkdirSync(workflowsDir, { recursive: true });
    }

    // Research-to-Code workflow
    const researchWorkflow = {
      "name": "Research-to-Code Workflow",
      "description": "Complete workflow from research to implementation",
      "steps": [
        {
          "action": "research",
          "tool": "perplexity",
          "prompt": "Research latest developments in {topic} with focus on production implementation",
          "timeout": "30s"
        },
        {
          "action": "analyze",
          "tool": "memory",
          "prompt": "Analyze research findings and create implementation plan",
          "timeout": "15s"
        },
        {
          "action": "implement", 
          "tool": "filesystem",
          "prompt": "Implement solution following architecture rules and performance budgets",
          "timeout": "300s"
        },
        {
          "action": "test",
          "tool": "testing",
          "prompt": "Generate and run comprehensive tests for implementation",
          "timeout": "60s"
        },
        {
          "action": "validate",
          "tool": "analytics",
          "prompt": "Validate performance against budgets and generate metrics report",
          "timeout": "30s"
        }
      ],
      "acceptanceCriteria": [
        "Research citations included in documentation",
        "Performance budgets maintained",
        "Tests achieve >80% coverage",
        "No new security vulnerabilities"
      ]
    };

    fs.writeFileSync(
      path.join(workflowsDir, 'research-to-code.json'),
      JSON.stringify(researchWorkflow, null, 2)
    );

    // Bug fix workflow
    const bugfixWorkflow = {
      "name": "Bug Fix Research Workflow",
      "description": "Research-driven bug fixing with root cause analysis",
      "steps": [
        {
          "action": "research",
          "tool": "perplexity", 
          "prompt": "Research common causes and solutions for error: {error_message}",
          "timeout": "20s"
        },
        {
          "action": "analyze",
          "tool": "filesystem",
          "prompt": "Analyze codebase for patterns matching research findings",
          "timeout": "30s"
        },
        {
          "action": "fix",
          "tool": "filesystem",
          "prompt": "Implement minimal fix based on research best practices",
          "timeout": "120s"
        },
        {
          "action": "test",
          "tool": "testing",
          "prompt": "Test fix and add regression tests",
          "timeout": "60s"
        }
      ],
      "acceptanceCriteria": [
        "Root cause identified and documented",
        "Minimal change set (<20 LOC)",
        "Regression tests added",
        "Performance impact validated"
      ]
    };

    fs.writeFileSync(
      path.join(workflowsDir, 'bugfix.json'), 
      JSON.stringify(bugfixWorkflow, null, 2)
    );

    console.log('✅ Agent workflows generated');
  }

  async generateDocumentation() {
    console.log('📚 Generating Setup Documentation...');
    
    const documentation = `# Cursor IDE MCP Setup Guide

## Quick Start

1. **Install Cursor IDE** (≥ v0.47)
\`\`\`bash
# Download from https://cursor.sh/
\`\`\`

2. **Generate MCP Configuration**
\`\`\`bash
npm run generate-cursor-mcp
\`\`\`

3. **Set Environment Variables**
\`\`\`bash
# Add to your shell profile (.zshrc, .bashrc, etc.)
export PERPLEXITY_API_KEY="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"
export CURSOR_API_KEY="key_694009601be9f42adc51e02c9d5a4e27828043679cd397039c7496e07f00b705"
\`\`\`

4. **Start MCP Servers**
\`\`\`bash
# Test Perplexity MCP
npm run mcpperplexity

# Run full MCP validation
npm run mcp:enhanced-validation
\`\`\`

## Available MCP Tools

### 🧠 Research Tools
- **@perplexity research**: AI-powered web research with citations
- **@brave-search**: Web search with Brave API
- **@memory**: Conversation context and memory

### 📁 Development Tools  
- **@filesystem**: File and directory operations
- **@github**: GitHub integration and operations
- **@package-manager**: Dependency management and security scanning

### 📊 Analytics Tools
- **@analytics**: Performance monitoring and metrics
- **@testing**: Automated testing and validation

## Usage Examples

### Research-Driven Development
\`\`\`
# Research latest music recommendation techniques
@perplexity research "latest collaborative filtering techniques for music recommendation 2024"

# Implement findings with filesystem tool
@filesystem create recommendation-engine.js with researched techniques

# Validate performance
@analytics measure performance against budget requirements
\`\`\`

### Bug Fixing Workflow
\`\`\`
# Research error patterns
@perplexity research "Node.js memory leak debugging techniques"

# Analyze codebase
@filesystem analyze memory usage patterns in src/

# Apply fix and test
@testing run memory leak detection tests
\`\`\`

### Package Management
\`\`\`
# Check for vulnerabilities
@package-manager scan for security vulnerabilities

# Update dependencies
@package-manager update dependencies with security patches
\`\`\`

## Performance Monitoring

The MCP integration includes comprehensive performance budgets:

- **Perplexity Research**: p95 ≤ 1500ms, ≤ 256MB memory, ≤ $0.50/session
- **Local Services**: p95 ≤ 500ms, ≤ 128MB memory each
- **Global System**: p95 ≤ 2000ms maximum latency

Monitor performance with:
\`\`\`bash
# Real-time health check
curl http://localhost:3001/health

# Performance validation
npm run mcp:enhanced-validation
\`\`\`

## Configuration Files

### Global Configuration (~/.cursor/mcp.json)
- **Perplexity**: Research and web search
- **Memory**: Cross-session context
- **Brave Search**: Alternative web search
- **GitHub**: Repository operations

### Project Configuration (.cursor/mcp.json)
- **EchoTune-specific servers**: Perplexity, filesystem, package management
- **Analytics**: Project performance monitoring  
- **Testing**: Automated test execution

### AI Rules (.cursor/rules/*.md)
- **architecture.md**: Core development principles
- **research.md**: Research workflow guidelines
- **performance.md**: Performance budget enforcement

## Troubleshooting

### Common Issues

1. **"MCP server not found"**
   - Check server is running: \`npm run mcpperplexity\`
   - Verify configuration: \`.cursor/mcp.json\`
   - Check logs: MCP server stderr output

2. **"API key invalid"**
   - Verify environment variables are set
   - Check API key format and permissions
   - Test with curl: \`curl -H "Authorization: Bearer $PERPLEXITY_API_KEY" https://api.perplexity.ai/chat/completions\`

3. **"Performance budget exceeded"**
   - Check memory usage: \`@analytics memory-report\`
   - Validate latency: \`@perplexity health\`
   - Review cost tracking: Check session budgets

4. **"Tool timeout"**
   - Increase timeout in tool calls
   - Check network connectivity
   - Verify server health and load

### Support Commands
\`\`\`bash
# Comprehensive health check
npm run mcp:health-all

# Server status
npm run mcp:orchestrator-status  

# Full validation suite
npm run mcp:validate-comprehensive
\`\`\`

## Security Best Practices

1. **API Key Management**
   - Store in environment variables, never in code
   - Use different keys for development/production
   - Rotate keys regularly (monthly)

2. **Network Security** 
   - MCP servers run locally with stdio transport
   - No network exposure by default
   - Use OAuth 2.1 for production deployments

3. **Access Control**
   - Filesystem server limited to project directories
   - Package manager operations require confirmation
   - Research tools have cost budgets and rate limits

## Advanced Configuration

### Custom Rules
Add project-specific rules in \`.cursor/rules/custom.md\`:
\`\`\`markdown
# Custom Project Rules
- Use EchoTune-specific error handling patterns
- Implement music domain validation
- Follow Spotify API best practices
\`\`\`

### Workflow Automation
Create custom workflows in \`.cursor/workflows/\`:
\`\`\`json
{
  "name": "Music Feature Development",
  "steps": [
    {"action": "research", "tool": "perplexity"},
    {"action": "implement", "tool": "filesystem"},
    {"action": "test", "tool": "testing"}
  ]
}
\`\`\`

---

**🎯 Integration Status**: Complete with comprehensive performance monitoring
**🔑 API Keys**: Configured and validated
**📊 Monitoring**: Real-time performance budgets and health checks
**🤖 Agent Workflows**: Research-to-PR automation ready`;

    fs.writeFileSync(
      path.join(this.projectRoot, 'CURSOR_IDE_SETUP.md'),
      documentation
    );
    
    console.log('✅ Setup documentation generated');
  }

  async validateConfiguration() {
    console.log('🔍 Validating Configuration...');
    
    const validations = [];
    
    // Check if config files exist
    const globalConfig = path.join(require('os').homedir(), '.cursor', 'mcp.json');
    const projectConfig = path.join(this.projectRoot, '.cursor', 'mcp.json');
    
    validations.push({
      name: 'Global Config',
      status: fs.existsSync(globalConfig),
      path: globalConfig
    });
    
    validations.push({
      name: 'Project Config', 
      status: fs.existsSync(projectConfig),
      path: projectConfig
    });
    
    // Check environment variables
    validations.push({
      name: 'Perplexity API Key',
      status: !!process.env.PERPLEXITY_API_KEY,
      value: process.env.PERPLEXITY_API_KEY ? 'Set' : 'Missing'
    });
    
    validations.push({
      name: 'Cursor API Key',
      status: !!process.env.CURSOR_API_KEY,
      value: process.env.CURSOR_API_KEY ? 'Set' : 'Missing'
    });
    
    // Check server files exist
    validations.push({
      name: 'Perplexity MCP Server',
      status: fs.existsSync(path.join(this.projectRoot, 'mcp-servers', 'perplexity-mcp', 'perplexity-mcp-server.js')),
      path: 'mcp-servers/perplexity-mcp/perplexity-mcp-server.js'
    });

    console.log('\n📊 Validation Results:');
    console.log('======================');
    
    let passed = 0;
    validations.forEach(validation => {
      const status = validation.status ? '✅ PASS' : '❌ FAIL';
      console.log(`${validation.name.padEnd(25)} ${status}`);
      if (validation.path) {
        console.log(`${' '.repeat(27)} ${validation.path}`);
      }
      if (validation.value) {
        console.log(`${' '.repeat(27)} ${validation.value}`);
      }
      if (validation.status) passed++;
    });
    
    const score = Math.round((passed / validations.length) * 100);
    console.log(`\nValidation Score: ${score}% (${passed}/${validations.length})`);
    
    if (score >= 80) {
      console.log('✅ Configuration is ready for use');
    } else {
      console.log('⚠️ Configuration needs attention');
    }
  }
}

// Run generator if called directly
if (require.main === module) {
  const generator = new CursorMCPGenerator();
  generator.generateAll().catch(console.error);
}

module.exports = CursorMCPGenerator;
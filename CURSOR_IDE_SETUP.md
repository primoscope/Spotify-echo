# Cursor IDE MCP Setup Guide

## Quick Start

1. **Install Cursor IDE** (≥ v0.47)
```bash
# Download from https://cursor.sh/
```

2. **Generate MCP Configuration**
```bash
npm run generate-cursor-mcp
```

3. **Set Environment Variables**
```bash
# Add to your shell profile (.zshrc, .bashrc, etc.)
export PERPLEXITY_API_KEY="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"
export CURSOR_API_KEY="key_694009601be9f42adc51e02c9d5a4e27828043679cd397039c7496e07f00b705"
```

4. **Start MCP Servers**
```bash
# Test Perplexity MCP
npm run mcpperplexity

# Run full MCP validation
npm run mcp:enhanced-validation
```

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
```
# Research latest music recommendation techniques
@perplexity research "latest collaborative filtering techniques for music recommendation 2024"

# Implement findings with filesystem tool
@filesystem create recommendation-engine.js with researched techniques

# Validate performance
@analytics measure performance against budget requirements
```

### Bug Fixing Workflow
```
# Research error patterns
@perplexity research "Node.js memory leak debugging techniques"

# Analyze codebase
@filesystem analyze memory usage patterns in src/

# Apply fix and test
@testing run memory leak detection tests
```

### Package Management
```
# Check for vulnerabilities
@package-manager scan for security vulnerabilities

# Update dependencies
@package-manager update dependencies with security patches
```

## Performance Monitoring

The MCP integration includes comprehensive performance budgets:

- **Perplexity Research**: p95 ≤ 1500ms, ≤ 256MB memory, ≤ $0.50/session
- **Local Services**: p95 ≤ 500ms, ≤ 128MB memory each
- **Global System**: p95 ≤ 2000ms maximum latency

Monitor performance with:
```bash
# Real-time health check
curl http://localhost:3001/health

# Performance validation
npm run mcp:enhanced-validation
```

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
   - Check server is running: `npm run mcpperplexity`
   - Verify configuration: `.cursor/mcp.json`
   - Check logs: MCP server stderr output

2. **"API key invalid"**
   - Verify environment variables are set
   - Check API key format and permissions
   - Test with curl: `curl -H "Authorization: Bearer $PERPLEXITY_API_KEY" https://api.perplexity.ai/chat/completions`

3. **"Performance budget exceeded"**
   - Check memory usage: `@analytics memory-report`
   - Validate latency: `@perplexity health`
   - Review cost tracking: Check session budgets

4. **"Tool timeout"**
   - Increase timeout in tool calls
   - Check network connectivity
   - Verify server health and load

### Support Commands
```bash
# Comprehensive health check
npm run mcp:health-all

# Server status
npm run mcp:orchestrator-status  

# Full validation suite
npm run mcp:validate-comprehensive
```

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
Add project-specific rules in `.cursor/rules/custom.md`:
```markdown
# Custom Project Rules
- Use EchoTune-specific error handling patterns
- Implement music domain validation
- Follow Spotify API best practices
```

### Workflow Automation
Create custom workflows in `.cursor/workflows/`:
```json
{
  "name": "Music Feature Development",
  "steps": [
    {"action": "research", "tool": "perplexity"},
    {"action": "implement", "tool": "filesystem"},
    {"action": "test", "tool": "testing"}
  ]
}
```

---

**🎯 Integration Status**: Complete with comprehensive performance monitoring
**🔑 API Keys**: Configured and validated
**📊 Monitoring**: Real-time performance budgets and health checks
**🤖 Agent Workflows**: Research-to-PR automation ready
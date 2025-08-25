# 🚀 Quick Start Guide - GitHub Coding Agent Integration

This guide helps you quickly understand and deploy the GitHub Coding Agent integration from this catalog.

## 📋 Prerequisites

- Node.js 16+ and npm/yarn
- Python 3.8+
- Git and GitHub CLI (optional)
- Docker (for MCP servers)
- IDE: Cursor, VS Code, or GitHub Codespaces

## 🏃‍♂️ Quick Setup (5 minutes)

### 1. Review Core Configuration
```bash
# Check environment requirements
cat configuration/.env.mcp.example

# Review Cursor IDE rules (if using Cursor)
cat configuration/.cursorrules

# Check MCP server configuration  
cat mcp-integration/mcp-config/mcp_servers.json
```

### 2. Start Basic MCP Servers
```bash
# Install MCP dependencies
cd mcp-integration/mcp-server
npm install

# Start core MCP orchestrator
node enhanced-mcp-orchestrator.js

# Verify health (in another terminal)
curl http://localhost:3001/health
```

### 3. Test GitHub Workflows (Optional)
```bash
# Copy workflows to your repo's .github/workflows/
cp github-workflows/*.yml /path/to/your/repo/.github/workflows/

# Test agent preflight
gh workflow run copilot-agent-preflight.yml
```

## 🎯 Common Use Cases

### **1. Code Analysis & Review**
```bash
# Run coding agent analyzer
node mcp-integration/mcp-server/coding-agent-analyzer.js

# Comprehensive MCP validation
node validate-all-mcp-servers.js
```

### **2. Autonomous Development**
```bash
# Start autonomous frontend agent
node agent-workflows/coding-agent-workflows/autonomous-frontend-agent.js

# Run continuous agent
node scripts/continuous-agent.js
```

### **3. Research & Documentation**
```bash
# Perplexity research integration
node test-perplexity-comprehensive.js

# Generate documentation
node scripts/mcp-documentation-automator.js
```

## 🔧 Configuration Templates

### **Environment Variables (.env)**
```bash
# Core Agent Configuration
CODING_AGENT_ENABLED=true
MCP_SERVER_PORT=3001
GITHUB_TOKEN=your_token_here

# AI Provider Configuration  
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_claude_key
PERPLEXITY_API_KEY=your_perplexity_key

# MCP Server Configuration
MCP_HEALTH_CHECK_INTERVAL=30000
MCP_AUTO_RESTART=true
MCP_LOG_LEVEL=info
```

### **GitHub Workflow Triggers**
```yaml
# Add to your workflow files
on:
  pull_request:
    types: [opened, synchronize, ready_for_review]
  issue_comment:
    types: [created]
  workflow_dispatch:
    inputs:
      agent_mode:
        description: 'Agent operation mode'
        required: true
        default: 'analyze'
        type: choice
        options:
        - analyze
        - optimize
        - review
        - research
```

## 🧪 Testing Your Setup

### **1. Basic Health Check**
```bash
# Test MCP servers
npm test -- tests/enhanced-mcp/enhanced-mcp-system.test.js

# Test coding agent workflows  
npm test -- tests/coding-agent-workflow.test.js

# Validate integration
bash tests/mcp-integration.test.sh
```

### **2. Advanced Testing**
```bash
# Comprehensive system test
node test-multi-agent-orchestrator.js

# Performance testing
npm test -- tests/performance/mcp-performance.test.js

# Integration testing
node tests/integration/enhanced-mcp-endpoints.test.js
```

## 🎮 Agent Commands

### **Slash Commands (GitHub)**
```bash
/analyze-gpt5           # GPT-5 code analysis
/review-gpt5            # GPT-5 code review
/optimize-gpt5          # Performance optimization
/research-perplexity    # Perplexity research
/validate-mcp           # MCP server validation
/autonomous-cycle       # Full autonomous development
```

### **CLI Commands**
```bash
# Agent management
python unified_agent_cli.py --mode analyze
python unified_agent_cli.py --mode research --topic "performance optimization"

# MCP management
node scripts/enhanced-mcp-automation.js
node scripts/mcp-health-monitor.js

# Workflow management  
node agent-workflows/workflow-cli.js --task feature-development
```

## 📊 Monitoring & Analytics

### **Health Dashboards**
- MCP Server Health: `http://localhost:3001/health`
- Agent Metrics: `http://localhost:3002/metrics`
- Performance Analytics: `http://localhost:3003/analytics`

### **Log Locations**
```bash
# Agent logs
tail -f logs/coding-agent.log

# MCP server logs
tail -f logs/mcp-orchestrator.log

# Workflow logs
tail -f logs/workflow-execution.log
```

## 🔍 Troubleshooting

### **Common Issues**

#### **MCP Servers Not Starting**
```bash
# Check dependencies
npm install

# Verify environment
cat .env | grep MCP

# Manual server start
node mcp-integration/mcp-server/enhanced-mcp-orchestrator.js --debug
```

#### **GitHub Workflows Failing**
```bash
# Check workflow syntax
gh workflow view copilot-agent-preflight.yml

# Validate secrets
gh secret list

# Test locally
act -j test-agent
```

#### **Agent Commands Not Working**
```bash
# Verify configuration
cat configuration/.cursorrules

# Check API keys
node scripts/test-api-connections.js

# Reset configuration
cp configuration/.env.mcp.example .env
```

## 🛡️ Security Best Practices

### **API Key Management**
- Never commit API keys to version control
- Use GitHub Secrets for workflow environment variables
- Rotate keys regularly
- Monitor API usage and costs

### **MCP Server Security**
- Run MCP servers in isolated containers
- Use environment-specific configurations
- Enable health checks and monitoring
- Implement proper error handling

### **Workflow Security**
- Review workflow permissions
- Use GITHUB_TOKEN with minimal scope
- Validate all inputs and parameters
- Enable branch protection rules

## 📚 Next Steps

### **Learning Resources**
1. Read `documentation/CODING_AGENT_GUIDE.md` for comprehensive overview
2. Study `documentation/GITHUB_CODING_AGENT_AUTOMATION_GUIDE.md` for automation
3. Explore `mcp-integration/` directory for MCP server details
4. Review `agent-workflows/` for workflow implementations

### **Advanced Configuration**
1. Customize IDE integration (Cursor, VS Code)
2. Set up production MCP server deployment
3. Configure advanced GitHub workflow triggers
4. Implement custom agent workflows

### **Community & Support**
1. Check existing issues and documentation
2. Review workflow execution logs
3. Test individual components systematically
4. Contribute improvements back to the community

---

**💡 Pro Tips:**
- Start with basic MCP servers before advanced features
- Use the test suite to validate your setup
- Monitor API usage to avoid rate limits
- Keep your configuration files organized and documented

**🎯 Success Metrics:**
- All MCP servers showing "healthy" status
- GitHub workflows executing successfully
- Agent commands responding correctly
- Performance metrics within expected ranges

For detailed implementation guidance, see the comprehensive documentation in the `documentation/` directory.
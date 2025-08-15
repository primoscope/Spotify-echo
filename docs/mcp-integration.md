# MCP Integration & Setup Guide

This guide provides comprehensive setup instructions for Model Context Protocol (MCP) servers in the EchoTune AI project, organized by priority tiers for optimal development workflow.

## 🚀 Quick Start

### 1. Install Core MCP Servers
```bash
# Install essential Tier 1 servers
npm run mcp:install

# Or install specific tiers
./scripts/install-mcp.sh --tier1 --tier2
./scripts/install-mcp.sh --all
```

### 2. Configure Environment
```bash
# Copy environment template
cp .env.mcp.example .env.mcp

# Edit .env.mcp with your tokens
nano .env.mcp
```

### 3. Validate Setup
```bash
# Test connectivity and configuration
npm run mcp:validate-connectivity

# Full MCP validation pipeline
npm run mcp:validate
```

## 📊 Server Tiers

### Tier 1 - Essential (Always Install)
| Server | Purpose | Installation |
|--------|---------|-------------|
| **GitHub MCP** | Repository management, issues, PRs | `docker pull ghcr.io/github/github-mcp-server` |
| **Filesystem MCP** | Secure file operations | `npx @modelcontextprotocol/server-filesystem` |
| **GitHub Repos Manager** | 80+ GitHub tools, token-based | `npm install -g github-repos-manager-mcp` |

### Tier 2 - High Value
| Server | Purpose | Installation |
|--------|---------|-------------|
| **Git MCP** | Git operations, repository search | `pip install mcp-server-git` or `uvx mcp-server-git` |
| **Memory MCP** | Persistent context, conversation history | `npx @modelcontextprotocol/server-memory` |

### Tier 3 - Specialized
| Server | Purpose | Installation |
|--------|---------|-------------|
| **Docker MCP** | Isolated code execution | `npm install -g docker-mcp-server` |
| **Sequential Thinking** | Enhanced AI reasoning | `npx @modelcontextprotocol/server-sequential-thinking` |
| **Brave Search** | Privacy-focused web research | `npx @modelcontextprotocol/server-brave-search` |
| **Fetch MCP** | Web content fetching | `npx @modelcontextprotocol/server-fetch` |

## 🔧 Configuration Files

### VS Code Configuration (`.vscode/mcp.json`)
```json
{
  "inputs": [
    {
      "type": "promptString",
      "id": "github-token",
      "description": "GitHub Personal Access Token",
      "password": true
    }
  ],
  "servers": {
    "github": {
      "type": "stdio",
      "command": "docker",
      "args": ["run", "-i", "--rm", "-e", "GITHUB_PERSONAL_ACCESS_TOKEN=${input:github-token}", "ghcr.io/github/github-mcp-server"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "${workspaceFolder}"]
    }
  }
}
```

### Repository Configuration (`mcp-config/mcp_servers.json`)
Centralized server definitions organized by tier with installation matrix and environment requirements.

## 🛡️ Security Best Practices

### Token Management
1. **Never commit tokens** to version control
2. **Use environment variables** for all sensitive data
3. **Rotate tokens regularly** (GitHub tokens every 90 days)
4. **Use minimal permissions** required for functionality

### GitHub Token Scopes
Required for GitHub MCP Server:
- `repo` - Full repository access
- `issues` - Read/write issues
- `pull_requests` - Create/manage pull requests  
- `actions` - Access GitHub Actions

### Environment Variables
```bash
# Required
GITHUB_TOKEN=ghp_your_token_here

# Optional
BRAVE_API_KEY=your_brave_key_here
WORKSPACE_FOLDER=.
```

## 🐳 Docker Setup

### Local Testing with Docker Compose
```bash
# Start all MCP servers
cd mcp-config
docker-compose up -d

# Start only essential servers
docker-compose up -d github-mcp filesystem-mcp memory-mcp

# Stop all services
docker-compose down
```

### Individual Docker Commands
```bash
# GitHub MCP Server
docker run -d --name github-mcp \
  -e GITHUB_PERSONAL_ACCESS_TOKEN=$GITHUB_TOKEN \
  -p 3001:3001 \
  ghcr.io/github/github-mcp-server

# Filesystem MCP Server
docker run -d --name filesystem-mcp \
  -v $(pwd):/workspace:ro \
  -p 3002:3002 \
  mcp/filesystem /workspace
```

## 📋 Validation & Testing

### Automated Validation
```bash
# Quick connectivity test
./mcp-config/validate_mcp.sh

# Comprehensive validation
npm run mcp:validate

# Health check all servers
npm run mcp:health-all
```

### Manual Testing
```bash
# Test individual server connectivity
curl -f http://localhost:3001/health  # GitHub MCP
curl -f http://localhost:3002/health  # Filesystem MCP

# Test NPX packages
npx @modelcontextprotocol/server-filesystem --version
npx @modelcontextprotocol/server-memory --version
```

## 🔧 IDE Integration

### VS Code
1. Install the MCP extension
2. Configure `.vscode/mcp.json` (already created)
3. Restart VS Code
4. Verify servers appear in MCP panel

### Cursor IDE
```bash
# Generate Cursor-specific configuration
npm run generate-cursor-mcp
```

### Claude Desktop
Edit Claude Desktop configuration:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

## 📊 Monitoring & Analytics

### Health Monitoring
```bash
# Real-time health monitoring
npm run mcp:health-monitor

# Continuous monitoring (background)
npm run mcp:continuous-monitor
```

### Performance Analytics
```bash
# Generate performance report
npm run mcp:test:comprehensive

# Live server testing
npm run mcp:test:live-servers
```

## 🔄 Maintenance

### Updates
```bash
# Update all Docker images
docker-compose pull

# Update NPM packages
npm update -g github-repos-manager-mcp docker-mcp-server

# Update Python packages
pip install --upgrade mcp-server-git
```

### Cleanup
```bash
# Remove unused Docker images
docker image prune

# Clear MCP cache
npm run mcp:health -- --clear-cache
```

## 🐛 Troubleshooting

### Common Issues

#### "Server not found" in IDE
1. Check JSON syntax in configuration files
2. Verify all paths are absolute
3. Check IDE logs for connection errors
4. Restart IDE after configuration changes

#### Token Authentication Failures
1. Verify token permissions and expiration
2. Check environment variable names
3. Test token with GitHub API directly:
   ```bash
   curl -H "Authorization: Bearer $GITHUB_TOKEN" https://api.github.com/user
   ```

#### Docker Permission Errors
```bash
# Add user to docker group (Linux)
sudo usermod -aG docker $USER
newgrp docker

# Or run with sudo
sudo docker-compose up
```

#### Package Installation Failures
```bash
# Clear NPM cache
npm cache clean --force

# Clear pip cache
pip cache purge

# Use --force for global installs
npm install -g --force github-repos-manager-mcp
```

### Debug Logging
Enable debug mode:
```bash
export MCP_DEBUG=true
npm run mcp:validate
```

### Log Files
- **Docker Compose logs**: `docker-compose logs -f [service]`
- **NPM logs**: Check console output during validation
- **IDE logs**: Check MCP panel in VS Code/Cursor

## 🔗 Resources

- [MCP Official Documentation](https://modelcontextprotocol.io/)
- [GitHub MCP Server](https://github.com/github/github-mcp-server)
- [Community MCP Servers](https://github.com/wong2/awesome-mcp-servers)
- [VS Code MCP Extension](https://marketplace.visualstudio.com/items?itemName=microsoft.vscode-mcp)

## 🎯 Usage Examples

### Basic File Operations
```
"List all TypeScript files in the src directory and show their imports"
```

### GitHub Integration
```
"Create a new issue for implementing user authentication with the 'enhancement' label"
```

### Research & Development
```
"Search for best practices for implementing OAuth 2.0 in Node.js applications"
```

### Code Analysis
```
"Analyze the current codebase structure and suggest architectural improvements"
```

---

**Next Steps**: After setup, see `examples/mcp_sample_prompt.md` for detailed usage examples and prompts for coding agents.
# MCP Servers Implementation Guide for GitHub Coding Agents

## Overview

This guide provides comprehensive instructions for implementing Model Context Protocol (MCP) servers to enhance GitHub coding agent performance, speed, and automation. All servers listed are free or have generous free tiers.

## Prerequisites

Before implementing any MCP servers, ensure you have:
- Node.js (v16 or later) installed
- GitHub Personal Access Token (for GitHub-related servers)
- IDE with MCP support (VS Code, Cursor, Claude Desktop, etc.)
- Docker installed (for containerized servers)

## Configuration Setup

### For VS Code/Cursor
Create or modify `.vscode/mcp.json` in your workspace:

```json
{
  "servers": {
    // Server configurations go here
  }
}
```

### For Claude Desktop
Edit `claude_desktop_config.json`:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\\Claude\\claude_desktop_config.json`

## Top 10 MCP Servers Implementation

### 1. GitHub MCP Server (Official) ⭐ HIGHEST PRIORITY
**Benefits**: Repository management, issue tracking, PR automation, code scanning, security alerts

#### Standard Setup (Read-only access to current repo)
```json
{
  "servers": {
    "github": {
      "url": "https://api.githubcopilot.com/mcp/"
    }
  }
}
```

#### Enhanced Setup (Full GitHub access)
1. Create GitHub Personal Access Token with permissions:
   - `repo` (full repository access)
   - `issues` (read/write issues)
   - `pull_requests` (create/manage PRs)
   - `actions` (access GitHub Actions)

2. Configuration:
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
      "args": [
        "run", "-i", "--rm",
        "-e", "GITHUB_PERSONAL_ACCESS_TOKEN=${input:github-token}",
        "ghcr.io/github/github-mcp-server"
      ]
    }
  }
}
```

#### Alternative Local Installation
```bash
git clone https://github.com/github/github-mcp-server.git
cd github-mcp-server
go build -o github-mcp-server cmd/github-mcp-server/main.go
```

Configuration:
```json
{
  "servers": {
    "github": {
      "command": "./github-mcp-server",
      "args": ["stdio"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "YOUR_TOKEN_HERE"
      }
    }
  }
}
```

### 2. Filesystem MCP Server ⭐ ESSENTIAL
**Benefits**: Secure file operations, code analysis, directory management

#### Basic Setup
```json
{
  "servers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "${workspaceFolder}",
        "/path/to/additional/allowed/directory"
      ]
    }
  }
}
```

#### Docker Setup (More Secure)
```json
{
  "servers": {
    "filesystem": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "--mount", "type=bind,src=${workspaceFolder},dst=/projects/workspace",
        "--mount", "type=bind,src=/path/to/docs,dst=/projects/docs,ro",
        "mcp/filesystem",
        "/projects"
      ]
    }
  }
}
```

### 3. GitHub Repos Manager MCP (Community) ⭐ POWERFUL ALTERNATIVE
**Benefits**: 80+ GitHub tools, token-based automation, no Docker required

#### Setup
```bash
npm install -g github-repos-manager-mcp
```

Configuration:
```json
{
  "servers": {
    "github-repos": {
      "command": "github-repos-manager-mcp",
      "env": {
        "GITHUB_TOKEN": "YOUR_PERSONAL_ACCESS_TOKEN"
      }
    }
  }
}
```

### 4. Memory MCP Server ⭐ CONTEXT ENHANCEMENT
**Benefits**: Persistent context across sessions, conversation history, knowledge graph

#### Setup
```json
{
  "servers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
```

### 5. Git MCP Server ⭐ VERSION CONTROL
**Benefits**: Git operations, repository search, commit management

#### Setup
```json
{
  "servers": {
    "git": {
      "command": "uvx",
      "args": ["mcp-server-git"]
    }
  }
}
```

Alternative with pip:
```bash
pip install mcp-server-git
```

```json
{
  "servers": {
    "git": {
      "command": "python",
      "args": ["-m", "mcp_server_git"]
    }
  }
}
```

### 6. Sequential Thinking MCP ⭐ AI ENHANCEMENT
**Benefits**: Enhanced AI reasoning through step-by-step problem solving

#### Setup
```json
{
  "servers": {
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
  }
}
```

### 7. Docker MCP Server 🔧 CODE EXECUTION
**Benefits**: Isolated code execution, multi-language support, sandboxing

#### Setup
```bash
npm install -g docker-mcp-server
```

Configuration:
```json
{
  "servers": {
    "docker": {
      "command": "docker-mcp-server",
      "env": {
        "DOCKER_HOST": "unix:///var/run/docker.sock"
      }
    }
  }
}
```

### 8. Fetch MCP Server 🌐 WEB CONTENT
**Benefits**: Web content fetching, documentation retrieval, research

#### Setup
```json
{
  "servers": {
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    }
  }
}
```

### 9. Brave Search MCP 🔍 RESEARCH
**Benefits**: Privacy-focused web research, technical documentation search
**Free Tier**: 2000 queries/month

#### Setup
1. Get Brave Search API key from https://api.search.brave.com/app/keys
2. Configuration:

```json
{
  "inputs": [
    {
      "type": "promptString",
      "id": "brave-api-key",
      "description": "Brave Search API Key",
      "password": true
    }
  ],
  "servers": {
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "${input:brave-api-key}"
      }
    }
  }
}
```

### 10. Slack MCP Server 💬 COMMUNICATION
**Benefits**: Team communication, CI/CD notifications, workflow automation

#### Setup
1. Create Slack App at https://api.slack.com/apps
2. Add Bot Token Scopes:
   - `chat:write`
   - `chat:write.public`
   - `files:write`
   - `channels:read`

3. Configuration:
```json
{
  "inputs": [
    {
      "type": "promptString",
      "id": "slack-token",
      "description": "Slack Bot OAuth Token",
      "password": true
    }
  ],
  "servers": {
    "slack": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-slack"],
      "env": {
        "SLACK_BOT_TOKEN": "${input:slack-token}"
      }
    }
  }
}
```

## Complete Configuration Examples

### Minimal Setup (Top 3 Essential)
```json
{
  "servers": {
    "github": {
      "url": "https://api.githubcopilot.com/mcp/"
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y", "@modelcontextprotocol/server-filesystem",
        "${workspaceFolder}"
      ]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
```

### Full Development Setup
```json
{
  "inputs": [
    {
      "type": "promptString",
      "id": "github-token",
      "description": "GitHub Personal Access Token",
      "password": true
    },
    {
      "type": "promptString",
      "id": "brave-api-key",
      "description": "Brave Search API Key",
      "password": true
    }
  ],
  "servers": {
    "github": {
      "type": "stdio",
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "GITHUB_PERSONAL_ACCESS_TOKEN=${input:github-token}",
        "ghcr.io/github/github-mcp-server"
      ]
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y", "@modelcontextprotocol/server-filesystem",
        "${workspaceFolder}"
      ]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "git": {
      "command": "uvx",
      "args": ["mcp-server-git"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    },
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "${input:brave-api-key}"
      }
    }
  }
}
```

## Security Best Practices

1. **Token Management**:
   - Use input variables for sensitive data
   - Never hardcode tokens in configuration files
   - Rotate tokens regularly
   - Use fine-grained permissions

2. **Filesystem Security**:
   - Limit directory access to necessary paths only
   - Use read-only mounts where possible
   - Avoid mounting sensitive directories like `/etc` or `~/.ssh`

3. **Docker Security**:
   - Use official images when available
   - Limit container privileges
   - Mount only necessary volumes

## Troubleshooting

### Common Issues

1. **Server not appearing in IDE**:
   - Check JSON syntax in configuration file
   - Verify all paths are absolute
   - Check IDE logs for connection errors

2. **Token authentication failures**:
   - Verify token permissions
   - Check token expiration
   - Ensure environment variables are set correctly

3. **Tool calls failing**:
   - Enable debug logging
   - Check server status in IDE
   - Verify network connectivity

### Debug Commands

Test individual servers:
```bash
# Test filesystem server
npx -y @modelcontextprotocol/server-filesystem /path/to/directory

# Test GitHub server with token
docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN=your_token ghcr.io/github/github-mcp-server
```

Check logs:
- **macOS**: `~/Library/Logs/Claude/mcp*.log`
- **Windows**: `%APPDATA%\\Claude\\logs\\mcp*.log`
- **VS Code**: Check Output panel → MCP

## Performance Optimization

1. **Selective Server Loading**:
   - Only enable servers you actively use
   - Disable servers for specific projects using workspace-specific configs

2. **Resource Management**:
   - Set appropriate timeouts
   - Use connection pooling where available
   - Monitor memory usage

3. **Caching**:
   - Enable caching in Memory MCP for frequently accessed data
   - Use local mirrors for documentation servers

## Project-Specific Customizations

### For Web Development Projects
Add these servers:
- Fetch MCP (API testing)
- Brave Search (research)
- Docker MCP (testing environments)

### For Data Science Projects  
Add these servers:
- PostgreSQL MCP
- Vector Search MCP
- Fetch MCP (data collection)

### For DevOps Projects
Add these servers:
- Docker MCP
- Slack MCP (notifications)
- Time MCP (scheduling)

## Next Steps

1. Start with the minimal setup (GitHub + Filesystem + Memory)
2. Test basic functionality with simple prompts
3. Gradually add more servers based on your workflow needs
4. Customize configurations for your specific project types
5. Monitor performance and adjust as needed

## Resources

- [MCP Official Documentation](https://modelcontextprotocol.io/)
- [MCP Server Registry](https://github.com/modelcontextprotocol/servers)
- [Community MCP Servers](https://github.com/wong2/awesome-mcp-servers)
- [GitHub MCP Server](https://github.com/github/github-mcp-server)
- [VS Code MCP Guide](https://code.visualstudio.com/docs/copilot/chat/mcp-servers)
# MCP Configuration Directory

This directory contains the comprehensive configuration and setup files for Model Context Protocol (MCP) servers in the EchoTune AI project.

## 📁 Directory Structure

```
mcp-config/
├── mcp_servers.json         # Central server configuration organized by tiers
├── docker-compose.yml       # Docker Compose for local testing
├── validate_mcp.sh          # Connectivity validation script  
└── README.md               # This file
```

## 🚀 Quick Start

### 1. Install MCP Servers
```bash
# Install essential Tier 1 servers
npm run mcp:install

# Or install all tiers
../scripts/install-mcp.sh --all
```

### 2. Configure Environment
```bash
# Copy environment template
cp ../.env.mcp.example ../.env.mcp

# Edit with your tokens
nano ../.env.mcp
```

### 3. Test with Docker Compose
```bash
# Start all MCP servers locally
docker-compose up -d

# Check server health
docker-compose ps
curl http://localhost:3001/health  # GitHub MCP
curl http://localhost:3002/health  # Filesystem MCP
```

### 4. Validate Setup
```bash
# Run connectivity tests
./validate_mcp.sh

# Full validation pipeline
npm run mcp:validate-connectivity
```

## 📊 Server Tiers

The `mcp_servers.json` file organizes MCP servers into three tiers:

### Tier 1 - Essential (Always Install)
- **GitHub MCP Server**: Repository management, issues, PRs
- **Filesystem MCP Server**: Secure file operations  
- **GitHub Repos Manager MCP**: 80+ GitHub tools

### Tier 2 - High Value (Recommended)
- **Git MCP Server**: Git operations, repository search
- **Memory MCP Server**: Persistent context across sessions

### Tier 3 - Specialized (Optional)
- **Docker MCP Server**: Isolated code execution
- **Sequential Thinking MCP**: Enhanced AI reasoning
- **Brave Search MCP**: Privacy-focused web research
- **Fetch MCP Server**: Web content retrieval

## 🔧 Configuration Files

### `mcp_servers.json`
Central configuration defining all MCP servers with:
- Server metadata and descriptions
- Installation commands (NPM, pip, Docker)
- Environment variable requirements
- Capability descriptions
- Alternative installation methods

### `docker-compose.yml`
Local testing environment with:
- All MCP servers as containers
- Proper networking and volume mounts
- Health checks and restart policies
- Optional services with profiles

### `validate_mcp.sh`
Connectivity validation script that checks:
- Docker availability and images
- NPX package accessibility
- Python package installations
- Environment variable configuration
- JSON configuration validity

## 🛡️ Security Configuration

### Environment Variables Required
```bash
# Essential
GITHUB_TOKEN=ghp_your_github_token_here

# Optional
BRAVE_API_KEY=your_brave_key_here
WORKSPACE_FOLDER=.
```

### Docker Security
- Read-only volume mounts where possible
- Non-root user execution
- Limited network access
- Health checks for monitoring

## 🔧 Usage Examples

### Install Specific Tiers
```bash
# Essential only
../scripts/install-mcp.sh --tier1

# High value servers
../scripts/install-mcp.sh --tier2

# All servers
../scripts/install-mcp.sh --all
```

### Docker Operations
```bash
# Start essential servers only
docker-compose up -d github-mcp filesystem-mcp memory-mcp

# Start with optional servers
docker-compose --profile optional up -d

# View logs
docker-compose logs -f github-mcp

# Stop all services
docker-compose down
```

### Validation & Testing
```bash
# Quick connectivity check
./validate_mcp.sh

# Test specific server
curl -f http://localhost:3001/health

# Full integration test
npm run mcp:validate
```

## 📊 Monitoring

### Health Checks
All Docker services include health checks:
```bash
# Check service health
docker-compose ps

# Manual health check
curl http://localhost:3001/health
```

### Log Monitoring
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f github-mcp

# Follow logs with timestamps
docker-compose logs -f -t
```

## 🔄 Maintenance

### Updates
```bash
# Update Docker images
docker-compose pull

# Restart services with new images
docker-compose up -d --force-recreate
```

### Cleanup
```bash
# Remove containers and networks
docker-compose down

# Remove volumes too
docker-compose down -v

# Clean unused images
docker image prune
```

## 🐛 Troubleshooting

### Common Issues

#### Port Conflicts
If ports are already in use:
```bash
# Check what's using the port
sudo lsof -i :3001

# Or use different ports
export MCP_GITHUB_PORT=3011
docker-compose up -d
```

#### Permission Errors
```bash
# Fix file permissions
chmod +x validate_mcp.sh

# Add user to docker group (Linux)
sudo usermod -aG docker $USER
newgrp docker
```

#### Docker Issues
```bash
# Check Docker daemon
docker info

# Restart Docker service (Linux)
sudo systemctl restart docker

# Clean Docker system
docker system prune
```

### Debug Mode
Enable debug logging:
```bash
export MCP_DEBUG=true
./validate_mcp.sh
```

## 📚 Resources

- [Main MCP Integration Guide](../docs/mcp-integration.md)
- [VS Code Configuration](../.vscode/mcp.json)
- [Environment Template](../.env.mcp.example)
- [Sample Prompts](../examples/mcp_sample_prompt.md)
- [Install Script](../scripts/install-mcp.sh)

## 🤝 Contributing

When adding new MCP servers:

1. **Update Configuration**: Add server entry to `mcp_servers.json`
2. **Docker Integration**: Add service to `docker-compose.yml`
3. **Validation**: Update `validate_mcp.sh` with new checks
4. **Documentation**: Update this README and main docs
5. **Testing**: Ensure all validation passes

---

**Next Steps**: After configuration, see the [sample prompts](../examples/mcp_sample_prompt.md) for effective usage patterns with coding agents.
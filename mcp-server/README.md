# 🤖 EchoTune AI - MCP Server Integration Guide

This README provides comprehensive instructions for setting up and using Model Context Protocol (MCP) servers with EchoTune AI, enabling advanced AI-powered music intelligence and automation capabilities.

## 🚀 Quick Start

### 1. Install Core MCP Servers
```bash
# Install essential MCP servers for basic functionality
./scripts/install-mcp-servers.sh --core
```

### 2. Configure Environment Variables
```bash
# Copy environment template and add your API keys
cp .env.example .env
# Edit .env with your credentials (see configuration section below)
```

### 3. Validate Installation
```bash
# Verify all servers are properly installed
./scripts/validate-mcp-servers.sh
```

## 📦 Available Installation Options

| Command | Description | Servers Included |
|---------|-------------|------------------|
| `--core` | Essential servers (recommended) | GitHub, FileSystem, SQLite, Memory |
| `--music` | Core + music-specific servers | Core + YouTube, MongoDB, Audio Analysis |
| `--dev` | Core + development tools | Core + PostgreSQL, Brave Search, Playwright |
| `--all` | All recommended servers | Everything above + additional utilities |

## 🔧 Manual Installation

### Node.js MCP Servers
```bash
# File system operations
npm install -g @modelcontextprotocol/server-filesystem

# Persistent memory and context
npm install -g @modelcontextprotocol/server-memory

# PostgreSQL database integration
npm install -g @modelcontextprotocol/server-postgres

# Web search capabilities
npm install -g @modelcontextprotocol/server-brave-search

# Browser automation
npm install -g @modelcontextprotocol/server-puppeteer

# YouTube integration
npm install -g mcp-youtube

# MongoDB integration
npm install -g mongodb-lens
```

### Python MCP Servers
```bash
# SQLite database operations
pip install mcp-server-sqlite

# OpenAI API integration
pip install mcp-server-openai

# Webhook testing utilities
pip install webhook-tester-mcp
```

### Docker MCP Servers
```bash
# GitHub integration (official)
docker pull ghcr.io/github/github-mcp-server
```

## 🌐 Configuration

### Required Environment Variables

Add these to your `.env` file:

```env
# =============================================================================
# 🔧 MCP SERVER CONFIGURATION
# =============================================================================

# GitHub Integration (Required for GitHub MCP server)
GITHUB_PAT=your_github_personal_access_token

# Database Connections
DATABASE_URL=postgresql://username:password@localhost:5432/echotune
SQLITE_DB_PATH=data/echotune.db
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/echotune

# Search & Web Integration
BRAVE_API_KEY=your_brave_search_api_key
YOUTUBE_API_KEY=your_youtube_api_key

# AI/ML Integration
OPENAI_API_KEY=sk-your_openai_api_key_here

# Browser Automation (Optional)
BROWSERBASE_API_KEY=your_browserbase_api_key
BROWSERBASE_PROJECT_ID=your_browserbase_project_id

# Time Series Database (Optional)
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=your_influxdb_token

# MCP Server Settings
MCP_SERVER_PORT=3001
MCP_SERVER_HOST=localhost
ENABLE_MCP_LOGGING=true
MCP_TIMEOUT=30000
```

## 🎯 Server-Specific Setup

### GitHub MCP Server
1. **Create GitHub Personal Access Token**:
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Generate new token with appropriate permissions
   - Add to `.env` as `GITHUB_PAT=your_token`

2. **Docker Setup**:
   ```bash
   # Ensure Docker is running
   docker --version
   
   # Test GitHub MCP server
   docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN=$GITHUB_PAT ghcr.io/github/github-mcp-server
   ```

### Database Servers
1. **PostgreSQL Setup**:
   ```bash
   # For local PostgreSQL
   DATABASE_URL=postgresql://username:password@localhost:5432/echotune
   
   # For cloud PostgreSQL (e.g., Supabase)
   DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
   ```

2. **SQLite Setup**:
   ```bash
   # Ensure data directory exists
   mkdir -p data
   
   # SQLite will create the database automatically
   SQLITE_DB_PATH=data/echotune.db
   ```

### Search Integration
1. **Brave Search API**:
   - Sign up at https://api.search.brave.com/
   - Get your API key
   - Add to `.env` as `BRAVE_API_KEY=your_key`

2. **YouTube Data API**:
   - Enable YouTube Data API v3 in Google Cloud Console
   - Create credentials and get API key
   - Add to `.env` as `YOUTUBE_API_KEY=your_key`

## 🧪 Testing Your Setup

### 1. Basic Connectivity Test
```bash
# Run the validation script
./scripts/validate-mcp-servers.sh
```

### 2. Test Individual Servers
```bash
# Test filesystem server
npx @modelcontextprotocol/server-filesystem --help

# Test memory server
npx @modelcontextprotocol/server-memory --help

# Test SQLite server
python -m mcp_server_sqlite --help
```

### 3. Integration Test
```bash
# Start the MCP orchestrator
npm run start

# Check server logs for successful connections
```

## 🎵 EchoTune-Specific Use Cases

### Music Intelligence Workflows
1. **Playlist Analysis**:
   - Use SQLite server for local caching
   - Leverage memory server for user preferences
   - Integrate YouTube server for cross-platform discovery

2. **GitHub Automation**:
   - Automated PR creation for ML model updates
   - Issue tracking for user-reported bugs
   - Code quality monitoring

3. **Data Processing**:
   - File system server for CSV data processing
   - PostgreSQL server for analytics storage
   - Web search for music discovery

### Example Workflow
```bash
# 1. Process user listening data
# Filesystem server reads CSV files
# SQLite server caches processed data

# 2. Generate recommendations
# Memory server provides user context
# OpenAI server enhances recommendation logic

# 3. Create playlist
# GitHub server manages code updates
# YouTube server finds additional tracks
```

## 🔍 Troubleshooting

### Common Issues

1. **Docker Permission Denied**:
   ```bash
   # Add user to docker group (Linux)
   sudo usermod -aG docker $USER
   # Restart terminal session
   ```

2. **Node.js Version Issues**:
   ```bash
   # Check version
   node --version  # Should be 18+
   
   # Update Node.js if needed
   # Use nvm or download from nodejs.org
   ```

3. **Python Package Conflicts**:
   ```bash
   # Use virtual environment
   python -m venv mcp-env
   source mcp-env/bin/activate  # Linux/Mac
   # mcp-env\Scripts\activate   # Windows
   pip install -r requirements-mcp.txt
   ```

4. **Environment Variable Loading**:
   ```bash
   # Verify .env file is loaded
   echo $GITHUB_PAT
   
   # Restart application after .env changes
   npm restart
   ```

### Debug Mode
```bash
# Enable debug logging
export DEBUG=mcp:*
npm run start

# Or use debug in .env
DEBUG=mcp:*
ENABLE_MCP_LOGGING=true
```

## 📚 Additional Resources

### Documentation
- [Community MCP Servers Guide](../docs/guides/COMMUNITY_MCP_SERVERS.md) - Comprehensive server documentation
- [MCP Servers List](../docs/mcp-servers.md) - Complete server reference
- [Main README](../README.md) - Project overview and setup

### External Resources
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [Awesome MCP Servers](https://github.com/punkpeye/awesome-mcp-servers)
- [MCP Community Discord](https://glama.ai/mcp/discord)

### Contributing
- Found a useful MCP server? Add it to our community guide!
- Created a custom server? Share it with the community!
- Report issues and improvements in our GitHub repository

## 🚨 Security Considerations

### API Key Management
- **Never commit API keys to version control**
- Use environment variables for all sensitive data
- Rotate keys regularly
- Use minimal required permissions

### Network Security
- Configure firewalls for MCP server ports
- Use HTTPS for all external communications
- Monitor network traffic for unusual patterns

### Database Security
- Use connection strings with minimal permissions
- Enable SSL/TLS for database connections
- Regular backup and recovery testing

---

**Need Help?** Check our [troubleshooting guide](../docs/guides/TROUBLESHOOTING.md) or join our [community discussions](https://github.com/dzp5103/Spotify-echo/discussions).
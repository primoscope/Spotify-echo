# MCP Servers - Comprehensive Integration Guide

This document is the **single source of truth** for all Model Context Protocol (MCP) servers integrated into EchoTune AI. It consolidates configuration, usage, and management instructions for all servers.

## Overview

EchoTune AI integrates with eleven powerful MCP servers to enhance coding, automation, testing, and music intelligence capabilities:

1. **Sequential Thinking MCP Server** - Structured reasoning and complex problem solving
2. **GitHub MCP Server** - Official GitHub integration for repository management, PRs, issues, and Actions
3. **FileScopeMCP** - Advanced file system operations with scope control  
4. **SQLite MCP Server** - Database operations with built-in analysis features
5. **Memory MCP Server** - Knowledge graph-based persistent memory system
6. **PostgreSQL MCP Server** - Database integration with schema inspection and query capabilities
7. **Brave Search MCP Server** - Web search capabilities using Brave's Search API
8. **MCP Screenshot Website Fast** - Rapid website screenshot generation
9. **MCP Server Browserbase** - Cloud-based browser automation
10. **Mermaid Diagram Generator** - Workflow diagrams and visual representations
11. **Browser Automation Server (Puppeteer)** - Local browser automation and web scraping
12. **Spotify MCP Server** - Custom music intelligence and automation

## Quick Start

### Installation

```bash
# Install all MCP servers
npm run mcp-install

# Install specific server
npm run mcp-manage install sequential-thinking
npm run mcp-manage install screenshot-website
```

### Health Check

```bash
# Check all servers
npm run mcp-health

# Generate detailed report
npm run mcp-report
```

### Testing

```bash
# Test all servers
npm run mcp-test-all

# Test specific server
npm run mcp-manage test sequential-thinking
```

## Individual Server Configuration

### 1. Sequential Thinking MCP Server

**Repository**: https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking  
**Purpose**: Provides structured thinking and reasoning capabilities for complex tasks, optimized for GitHub Coding Agent workflows.  
**Location**: `mcp-servers/sequential-thinking/`

**Configuration**:
```json
{
  "command": "node",
  "args": ["mcp-servers/sequential-thinking/dist/index.js"],
  "description": "Structured thinking and reasoning capabilities"
}
```

**Usage Examples**:
- Breaking down complex coding tasks into manageable steps
- Analyzing requirements and creating implementation plans
- Debugging complex issues with systematic approach
- Code review and architectural decision making

**Environment Variables**: None required

### 2. FileScopeMCP

**Repository**: https://github.com/admica/FileScopeMCP  
**Purpose**: Advanced file system operations with scope control, perfect for repository management and automated file operations.  
**Location**: `node_modules/FileScopeMCP/` (npm dependency)

**Configuration**:
```json
{
  "command": "node",
  "args": ["../node_modules/FileScopeMCP/dist/index.js"],
  "env": {
    "ALLOWED_DIRECTORIES": "${PWD}/..,${PWD}/../src,${PWD}/../scripts,${PWD}"
  },
  "description": "File system operations and repository management"
}
```

**Usage Examples**:
- Automated code generation and file manipulation
- Repository-wide refactoring operations
- Batch file processing and organization
- Secure file operations with directory restrictions

**Environment Variables**:
- `ALLOWED_DIRECTORIES`: Comma-separated list of allowed directories for security

### 3. MCP Screenshot Website Fast

**Repository**: https://github.com/just-every/mcp-screenshot-website-fast  
**Purpose**: Fast website screenshot capabilities for documentation, testing, and UI validation.  
**Location**: `mcp-servers/screenshot-website/`

**Configuration**:
```json
{
  "command": "node",
  "args": ["mcp-servers/screenshot-website/dist/index.js"],
  "description": "Fast website screenshot capabilities"
}
```

**Usage Examples**:
- Automated UI testing and visual regression testing
- Documentation generation with website screenshots
- Monitoring and validation of deployed applications
- Creating visual evidence for bug reports

**Environment Variables**: None required (uses headless browser by default)

### 4. MCP Server Browserbase

**Repository**: https://github.com/browserbase/mcp-server-browserbase  
**Purpose**: Cloud-based browser automation for comprehensive web testing and interaction.  
**Location**: Referenced as npm dependency

**Configuration**:
```json
{
  "command": "npx",
  "args": ["@browserbasehq/mcp-server-browserbase"],
  "env": {
    "BROWSERBASE_API_KEY": "${BROWSERBASE_API_KEY}",
    "BROWSERBASE_PROJECT_ID": "${BROWSERBASE_PROJECT_ID}",
    "BROWSERBASE_SESSION_ID": "${BROWSERBASE_SESSION_ID}"
  }
}
```

**Usage Examples**:
- End-to-end testing of web applications
- Automated user workflow testing
- Cross-browser compatibility testing
- Performance monitoring and optimization

**Environment Variables**:
- `BROWSERBASE_API_KEY`: Your Browserbase API key
- `BROWSERBASE_PROJECT_ID`: Your Browserbase project ID
- `BROWSERBASE_SESSION_ID`: Optional session ID for specific tests

### 5. Mermaid Diagram Generator

**Repository**: https://github.com/mermaidjs/mermaid  
**Purpose**: Generate workflow diagrams and visual representations for documentation and architecture.  
**Location**: Referenced as npm dependency

**Configuration**:
```json
{
  "command": "npx",
  "args": ["mcp-mermaid"],
  "description": "Mermaid diagram generation for workflow visualization"
}
```

**Usage Examples**:
- Flowcharts for user journeys
- Sequence diagrams for API interactions
- Class diagrams for system architecture
- State diagrams for application flow

**Environment Variables**: None required

### 6. Browser Automation Server (Puppeteer)

**Repository**: https://github.com/modelcontextprotocol/server-puppeteer  
**Purpose**: Local browser automation using Puppeteer for web scraping and interaction.  
**Location**: Referenced as npm dependency

**Configuration**:
```json
{
  "command": "npx",
  "args": ["@modelcontextprotocol/server-puppeteer"],
  "env": {
    "PUPPETEER_HEADLESS": "true",
    "PUPPETEER_ARGS": "--no-sandbox --disable-setuid-sandbox"
  }
}
```

**Usage Examples**:
- Web scraping and data extraction
- Automated form filling and submission
- UI testing and interaction simulation
- Local browser automation without cloud dependencies

**Environment Variables**:
- `PUPPETEER_HEADLESS`: Run browser in headless mode (true/false)
- `PUPPETEER_ARGS`: Additional command line arguments for Chrome

### 7. Spotify MCP Server

**Purpose**: Custom music intelligence and Spotify automation server for EchoTune AI.  
**Location**: `mcp-server/spotify_server.py`

**Configuration**:
```json
{
  "command": "python",
  "args": ["spotify_server.py"],
  "env": {
    "SPOTIFY_CLIENT_ID": "${SPOTIFY_CLIENT_ID}",
    "SPOTIFY_CLIENT_SECRET": "${SPOTIFY_CLIENT_SECRET}",
    "SPOTIFY_REDIRECT_URI": "${SPOTIFY_REDIRECT_URI}"
  }
}
```

**Usage Examples**:
- Personalized music recommendations using ML models
- Automated playlist creation and management
- Listening data analysis and insights
- Spotify Web Player automation

**Environment Variables**:
- `SPOTIFY_CLIENT_ID`: Your Spotify app client ID
- `SPOTIFY_CLIENT_SECRET`: Your Spotify app client secret
- `SPOTIFY_REDIRECT_URI`: OAuth redirect URI for authentication

### 8. GitHub MCP Server

**Purpose**: Official GitHub integration for repository management, PRs, issues, and Actions

**Command**: `docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN ghcr.io/github/github-mcp-server`

**Capabilities**:
- Repository management and file operations
- Pull request creation and management  
- Issue tracking and project management
- GitHub Actions workflow integration
- Organization and team management

**Environment Variables**:
- `GITHUB_PAT`: Personal Access Token for GitHub API access

### 9. SQLite MCP Server

**Purpose**: Database operations with built-in analysis features

**Command**: `python -m mcp_server_sqlite --db-path data/echotune.db`

**Capabilities**:
- Database schema inspection and management
- SQL query execution with safety checks
- Data analysis and reporting
- Database migration support

### 10. Memory MCP Server

**Purpose**: Knowledge graph-based persistent memory system

**Command**: `npx @modelcontextprotocol/server-memory`

**Capabilities**:
- Persistent knowledge storage and retrieval
- Entity relationship mapping
- Context-aware information retrieval
- Learning and adaptation from interactions

### 11. PostgreSQL MCP Server

**Purpose**: PostgreSQL database integration with schema inspection and query capabilities

**Command**: `npx @modelcontextprotocol/server-postgres`

**Capabilities**:
- Full PostgreSQL database operations
- Advanced schema inspection and analysis
- Query optimization and performance monitoring
- Transaction management

**Environment Variables**:
- `DATABASE_URL`: PostgreSQL connection string

### 12. Brave Search MCP Server

**Purpose**: Web search capabilities using Brave's Search API

**Command**: `npx @modelcontextprotocol/server-brave-search`

**Capabilities**:
- Web search with privacy-focused results
- Real-time information retrieval
- Search result filtering and analysis
- Integration with research workflows

**Environment Variables**:
- `BRAVE_API_KEY`: API key for Brave Search service

## Environment Configuration

### Required Environment Variables

Add these to your `.env` file:

```env
# MCP Server Configuration
MCP_SEQUENTIAL_THINKING_ENABLED=true
MCP_GITHUB_ENABLED=false  # Set to true when you have GitHub PAT
MCP_FILESYSTEM_ENABLED=true
MCP_SQLITE_ENABLED=true
MCP_MEMORY_ENABLED=true
MCP_POSTGRES_ENABLED=false  # Set to true when you have database URL
MCP_BRAVE_SEARCH_ENABLED=false  # Set to true when you have API key
MCP_SCREENSHOT_WEBSITE_ENABLED=true
MCP_BROWSERBASE_ENABLED=false  # Set to true when you have API keys
MCP_MERMAID_ENABLED=true
MCP_BROWSER_ENABLED=true
MCP_SPOTIFY_ENABLED=true

# GitHub Integration (optional)
GITHUB_PAT=your_github_personal_access_token

# Browserbase Configuration (optional)
BROWSERBASE_API_KEY=your_api_key_here
BROWSERBASE_PROJECT_ID=your_project_id_here
BROWSERBASE_SESSION_ID=your_session_id_here

# Database Configuration (optional)
DATABASE_URL=postgresql://username:password@localhost:5432/database

# Search Configuration (optional)
BRAVE_API_KEY=your_brave_search_api_key

# Spotify API Configuration
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/callback

# Browser Configuration
PUPPETEER_HEADLESS=true
PUPPETEER_ARGS=--no-sandbox --disable-setuid-sandbox
```

### Security Configuration

FileScopeMCP includes directory restrictions for security:

```env
# Allowed directories for file operations
ALLOWED_DIRECTORIES=/home/runner/work/Spotify-echo/Spotify-echo,/home/runner/work/Spotify-echo/Spotify-echo/src,/home/runner/work/Spotify-echo/Spotify-echo/scripts
```

## GitHub Workflow Integration

### Automated CI/CD

The MCP servers are integrated into GitHub Actions workflows:

```yaml
# .github/workflows/mcp-integration.yml
- name: Install MCP servers
  run: npm run mcp-install

- name: Health check
  run: npm run mcp-health

- name: Run tests
  run: npm run test:integration -- tests/integration/mcp-servers.test.js
```

### Manual Workflow Dispatch

You can manually trigger MCP server testing through GitHub Actions:

1. Go to Actions tab in your repository
2. Select "MCP Servers Integration" workflow
3. Click "Run workflow"
4. Choose the branch and options

## Management Commands

### Available npm Scripts

```bash
# MCP Management
npm run mcp-manage              # Show help
npm run mcp-install             # Install all servers
npm run mcp-health              # Health check
npm run mcp-test-all            # Test all servers
npm run mcp-report              # Generate report

# Individual Server Management
npm run mcp-manage install <server-name>
npm run mcp-manage test <server-name>
npm run mcp-manage health
```

### Direct Script Usage

```bash
# Using the management script directly
node scripts/mcp-manager.js health
node scripts/mcp-manager.js install sequential-thinking
node scripts/mcp-manager.js test screenshot-website
node scripts/mcp-manager.js report
```

## Troubleshooting

### Common Issues

#### Server Not Found
```bash
❌ Sequential Thinking: missing
```
**Solution**: Run `npm run mcp-install` to install missing servers

#### Build Failures
```bash
Error: Cannot build server
```
**Solutions**:
1. Check Node.js version (requires 20+)
2. Install TypeScript: `npm install -g typescript`
3. Clear node_modules and reinstall: `rm -rf node_modules && npm install`

#### Permission Errors (FileScopeMCP)
```bash
Error: Directory not allowed
```
**Solution**: Update `ALLOWED_DIRECTORIES` in `.env` to include required paths

#### Browserbase Authentication
```bash
Authentication failed
```
**Solution**: Verify `BROWSERBASE_API_KEY` and `BROWSERBASE_PROJECT_ID` in `.env`

### Health Check Debugging

```bash
# Detailed health check
npm run mcp-health

# Generate diagnostic report
npm run mcp-report

# Check individual server
node scripts/mcp-manager.js test sequential-thinking
```

### Manual Server Testing

```bash
# Test sequential thinking server directly
cd mcp-servers/sequential-thinking
node dist/index.js

# Test screenshot server directly
cd mcp-servers/screenshot-website
node dist/index.js --help
```

## Performance Optimization

### Parallel Server Startup

For faster development, start multiple servers in parallel:

```bash
# Start all MCP servers in background
npm run mcp-server &
npm run mcp-manage test sequential-thinking &
npm run mcp-manage test screenshot-website &
wait
```

### Resource Management

- Sequential Thinking: ~50MB RAM
- Screenshot Website: ~100MB RAM (includes browser)
- FileScopeMCP: ~20MB RAM
- Browserbase: ~10MB RAM (cloud-based)

## Integration Examples

### Integration Scripts

Run the integration demonstrations:

```bash
# Run all MCP server demonstrations
node scripts/integrate-mcp-servers.js

# Test individual servers
npm run mcp-test-mermaid
npm run mcp-test-filesystem
npm run mcp-test-browserbase
npm run mcp-test-sequential-thinking
npm run mcp-test-screenshot
```

### Coding Agent Workflow

```javascript
// Example: Using Sequential Thinking for complex problem solving
const sequentialThinking = new SequentialThinkingClient();
const analysis = await sequentialThinking.analyzeRequirement({
  task: "Implement user authentication system",
  complexity: "high",
  timeframe: "2 days"
});
console.log(analysis.steps);
```

### Automated Testing Workflow

```javascript
// Example: Screenshot testing in CI/CD
const screenshot = new ScreenshotClient();
const image = await screenshot.capture({
  url: "http://localhost:3000",
  viewport: { width: 1920, height: 1080 },
  format: "png"
});
```

### File Processing Workflow

```javascript
// Example: Automated file operations with FileScopeMCP
const fileScope = new FileScopeClient();
await fileScope.processFiles({
  pattern: "**/*.js",
  operation: "lint-and-format",
  allowedDirs: ["/src", "/scripts"]
});
```

### Music Intelligence Workflow

```javascript
// Example: Spotify automation and recommendations
const spotify = new SpotifyMCPClient();
const recommendations = await spotify.getRecommendations({
  user_id: "user123",
  seed_genres: ["electronic", "ambient"],
  target_features: { energy: 0.7, valence: 0.8 }
});
```

### Documentation Generation Workflow

```javascript
// Example: Mermaid diagram generation
const mermaid = new MermaidClient();
const diagram = await mermaid.generateDiagram({
  type: "flowchart",
  code: `
    flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process]
    B -->|No| D[End]
  `
});
```

## Advanced Configuration

### Custom Server Configurations

You can extend the MCP configuration in `package.json`:

```json
{
  "mcp": {
    "servers": {
      "custom-server": {
        "command": "node",
        "args": ["path/to/custom/server.js"],
        "env": {
          "CUSTOM_ENV": "value"
        }
      }
    }
  }
}
```

### Production Deployment

For production deployments:

1. **Set appropriate environment variables**
2. **Configure resource limits**
3. **Set up monitoring and health checks**
4. **Enable logging and error tracking**

```bash
# Production health monitoring
watch -n 30 "npm run mcp-health"

# Log monitoring
tail -f logs/mcp-servers.log
```

## Contributing

### Adding New MCP Servers

1. Clone the server repository to `mcp-servers/`
2. Update `scripts/mcp-manager.js` to include the new server
3. Add configuration to `package.json`
4. Update environment variables in `.env.example`
5. Add tests in `tests/integration/mcp-servers.test.js`
6. Update this documentation

### Testing Guidelines

- All servers must pass health checks
- Integration tests should cover basic functionality
- Performance tests should validate resource usage
- Security tests should verify access controls

## Support

For issues and feature requests:

1. Check the [troubleshooting section](#troubleshooting)
2. Run diagnostics: `npm run mcp-report`
3. Check logs and error messages
4. Create an issue with detailed reproduction steps

---

**EchoTune AI MCP Integration** - Enhancing coding productivity through intelligent automation
# EchoTune AI - Enhanced MCP Integration Setup Guide

## 🚀 Quick Start - New Features

This guide covers the setup for the new MCP servers, continuous analysis system, and enhanced capabilities added to EchoTune AI.

### 📋 Prerequisites

- Node.js 20+ installed
- API keys for Perplexity AI and/or Grok-4 (optional but recommended)
- PostgreSQL database (optional, for PostgreSQL MCP server)

### 🔧 Installation

1. **Install Dependencies**
   ```bash
   # Core MCP dependencies
   npm install @modelcontextprotocol/sdk
   
   # Database drivers (optional)
   npm install pg sqlite3 sqlite
   
   # Web fetching (optional) 
   npm install node-fetch cheerio
   ```

2. **Environment Configuration**
   ```bash
   # Copy and configure environment
   cp .env.example .env
   
   # Edit .env file and add your API keys:
   # PERPLEXITY_API_KEY=pplx-your_key_here
   # XAI_API_KEY=xai-your_key_here (or use OPENROUTER_API_KEY)
   # POSTGRES_HOST=localhost (if using PostgreSQL)
   ```

3. **Validate System**
   ```bash
   npm run validate:enhanced-system
   ```

### 🤖 New MCP Servers

#### PostgreSQL Server
```bash
# Start PostgreSQL MCP server
npm run mcp:postgresql

# Or via orchestrator
curl -X POST http://localhost:3001/servers/postgresql/start
```

#### SQLite Server  
```bash
# Start SQLite MCP server
npm run mcp:sqlite

# Or via orchestrator
curl -X POST http://localhost:3001/servers/sqlite/start
```

#### Fetch Server
```bash
# Start Fetch MCP server
npm run mcp:fetch

# Or via orchestrator
curl -X POST http://localhost:3001/servers/fetch/start
```

#### All Servers
```bash
# Start all MCP servers at once
cd mcp-servers && npm run start:all

# Or via orchestrator
curl -X POST http://localhost:3001/servers/start-all
```

### 🧠 Continuous Analysis System

#### Single Analysis Run
```bash
# Run one-time comprehensive analysis
npm run continuous-analysis:single

# Via Node.js
node scripts/continuous-analysis-system.js single
```

#### Continuous Mode
```bash
# Run continuous analysis (monitors and improves continuously)
npm run continuous-analysis:continuous

# Via Node.js
node scripts/continuous-analysis-system.js continuous
```

#### API Usage
```bash
# Start the enhanced MCP orchestrator
node mcp-server/enhanced-mcp-orchestrator-v2.js

# Run analysis via API
curl -X POST http://localhost:3001/analysis/run

# Check analysis status
curl http://localhost:3001/analysis/status
```

### 🔍 Research & Analysis APIs

#### Perplexity Research
```bash
# Via npm script (inline query)
npm run perplexity:research "latest trends in music recommendation algorithms"

# Via API
curl -X POST http://localhost:3001/research \
  -H "Content-Type: application/json" \
  -d '{"query": "React performance optimization techniques 2024"}'
```

#### Grok-4 Code Analysis
```bash
# Via npm script
npm run grok4:analyze

# Via API  
curl -X POST http://localhost:3001/analyze \
  -H "Content-Type: application/json" \
  -d '{"code": "const myCode = ...;", "analysisType": "security"}'
```

### 📊 Monitoring & Health Checks

#### System Health
```bash
# Check overall system health
curl http://localhost:3001/health

# Check specific server status
curl http://localhost:3001/servers

# Get system metrics
curl http://localhost:3001/metrics
```

#### Logs & Debugging
```bash
# View server logs
curl http://localhost:3001/servers/postgresql/logs

# Run system validation
node scripts/validate-enhanced-system.js
```

### 🗂️ File Structure Overview

```
EchoTune-AI/
├── mcp-servers/
│   ├── postgresql/          # PostgreSQL MCP server
│   ├── sqlite/              # SQLite MCP server  
│   ├── fetch/               # Web fetch MCP server
│   └── package.json         # Updated with new servers
├── mcp-server/
│   └── enhanced-mcp-orchestrator-v2.js  # Enhanced orchestrator
├── scripts/
│   ├── continuous-analysis-system.js    # Main analysis system
│   └── validate-enhanced-system.js      # System validator
├── src/chat/llm-providers/
│   ├── perplexity-provider.js           # Perplexity AI integration
│   └── grok4-provider.js                # Grok-4 integration
└── automation-outputs/     # Generated analysis reports & tasks
    ├── reports/             # Analysis reports
    ├── tasks/               # Generated tasks
    └── improvements/        # Applied improvements
```

### 🎯 Usage Examples

#### Music Industry Research
```javascript
// Research latest music trends
const research = await fetch('http://localhost:3001/research', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'AI music recommendation algorithms trends 2024',
    options: { searchRecency: 'month' }
  })
});
```

#### Repository Analysis
```javascript
// Analyze codebase for improvements
const analysis = await fetch('http://localhost:3001/analyze', {
  method: 'POST', 
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code: repositorySnapshot,
    analysisType: 'comprehensive'
  })
});
```

#### Database Operations
```javascript
// Query PostgreSQL via MCP
const dbQuery = {
  name: 'postgres_query',
  arguments: {
    query: 'SELECT * FROM music_data LIMIT 10',
    limit: 10
  }
};
```

### 🔐 Security Considerations

- **API Keys**: Store in environment variables, never commit to repository
- **Database Access**: PostgreSQL server runs in read-only mode by default
- **Web Fetching**: Respects robots.txt and includes domain filtering
- **Process Isolation**: Each MCP server runs in its own process

### 🚨 Troubleshooting

#### Common Issues

1. **MCP SDK Missing**
   ```bash
   npm install @modelcontextprotocol/sdk
   ```

2. **Database Connection Failed**
   ```bash
   # Check database configuration in .env
   # Servers will run in mock mode if DB unavailable
   ```

3. **API Keys Not Working**
   ```bash
   # Verify API keys in .env file
   # Check API key permissions and rate limits
   ```

4. **Port Conflicts** 
   ```bash
   # Default ports: 3001 (orchestrator), 3010-3017 (MCP servers)
   # Configure MCP_SERVER_PORT in .env if needed
   ```

#### Debug Mode
```bash
# Enable detailed logging
ENABLE_MCP_LOGGING=true npm run continuous-analysis

# Run validation with verbose output  
node scripts/validate-enhanced-system.js
```

### 📞 Support

- **Validation Report**: Check `VALIDATION_REPORT.md` for system status
- **Logs**: Server logs available via API or console output
- **Configuration**: All settings in `.env` file with examples in `.env.example`

### 🎉 What's Next

The system now runs autonomously:

1. **Continuous Research**: Stays updated with industry trends
2. **Code Analysis**: Regular repository health checks  
3. **Task Generation**: Creates actionable improvement tasks
4. **Documentation Updates**: Keeps README and roadmap current
5. **Performance Monitoring**: Tracks system metrics and optimization opportunities

Your EchoTune AI instance is now a self-improving, research-driven development environment!
# Configuration Guide

This document provides comprehensive configuration information for EchoTune AI, including environment variables, ports, MCP endpoints, and CI secret management.

## 📋 Table of Contents

- [Environment Variables](#environment-variables)
- [Port Configuration](#port-configuration)
- [MCP Server Endpoints](#mcp-server-endpoints)
- [Database Configuration](#database-configuration)
- [CI/CD Secrets](#cicd-secrets)
- [Local Development Setup](#local-development-setup)
- [Production Deployment](#production-deployment)

## 🔧 Environment Variables

### Core Application Settings

```bash
# Application
NODE_ENV=production|development|test
PORT=3000
BASE_URL=https://yourdomain.com

# Security
SESSION_SECRET=your-secure-session-secret-here
JWT_SECRET=your-jwt-secret-here
CORS_ORIGIN=https://yourdomain.com
```

### Spotify Integration

```bash
# Required for Spotify API integration
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
SPOTIFY_REDIRECT_URI=https://yourdomain.com/auth/spotify/callback

# Optional - for enhanced features
SPOTIFY_MARKET=US
SPOTIFY_SCOPES=user-read-private,user-read-email,user-top-read,user-read-playback-state
```

### Database Configuration

```bash
# MongoDB (Primary)
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/echotune
MONGODB_DB_NAME=echotune

# SQLite (Fallback)
USE_SQLITE=false
SQLITE_PATH=./data/echotune.db

# Supabase (Optional)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

### AI/LLM Providers

```bash
# Primary LLM Provider
LLM_PROVIDER=openai|gemini|mock

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4-turbo
OPENAI_MAX_TOKENS=4096

# Google Gemini
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-pro

# OpenRouter (Alternative)
OPENROUTER_API_KEY=sk-or-your-openrouter-key
```

### Caching & Performance

```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0
CACHE_TTL=3600

# Performance
MAX_REQUESTS_PER_MINUTE=100
ENABLE_COMPRESSION=true
```

### MCP Server Configuration

```bash
# MCP Server Ports
MCP_SERVER_PORT=3001
MCP_ORCHESTRATOR_PORT=3002
ANALYTICS_SERVER_PORT=3003

# MCP Authentication
MCP_AUTH_TOKEN=your-mcp-auth-token
ENABLE_MCP_LOGGING=true
```

## 🌐 Port Configuration

### Default Port Mapping

| Service | Port | Description | Health Endpoint |
|---------|------|-------------|-----------------|
| Main App | 3000 | Primary web application | `/health` |
| MCP Server | 3001 | Core MCP server | `/health` |
| MCP Orchestrator | 3002 | MCP orchestration | `/status` |
| Analytics Server | 3003 | Analytics & telemetry | `/status` |
| Package Management | 3004 | Package version MCP | `/health` |
| Code Sandbox | 3005 | Secure code execution | `/health` |
| Testing Automation | 3006 | Test automation MCP | `/health` |
| Sentry MCP | 3012 | Error tracking MCP | `/health` |
| Browserbase | 3013 | Browser automation | `/health` |
| Filesystem MCP | 3014 | File operations | `/health` |
| Spotify MCP | 3015 | Spotify integration | `/health` |

### Port Configuration Commands

```bash
# Check port availability
npm run health-check

# Start all MCP servers
npm run mcp:orchestrator-start

# Health check all MCP services
npm run mcp:health-all

# Generate MCP status report
node scripts/mcp-orchestration-health.js report
```

## 🔧 MCP Server Endpoints

### Core MCP Endpoints

```bash
# MCP Server Discovery
GET /mcp/discover
GET /mcp/status
GET /mcp/health

# MCP Orchestration
POST /mcp/start
POST /mcp/stop
GET /mcp/services

# MCP Analytics
GET /mcp/metrics
GET /mcp/performance
```

### Individual MCP Services

| MCP Server | Endpoint | Capabilities |
|------------|----------|-------------|
| Filesystem | `http://localhost:3014` | File operations, directory management |
| Browserbase | `http://localhost:3013` | Browser automation, web scraping |
| Spotify | `http://localhost:3015` | Spotify API integration |
| Analytics | `http://localhost:3003` | Performance monitoring, telemetry |
| Code Sandbox | `http://localhost:3005` | Secure code execution |
| Package Management | `http://localhost:3004` | Dependency management |

## 🗄️ Database Configuration

### MongoDB Configuration

```bash
# Connection string format
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Additional MongoDB settings
MONGODB_OPTIONS={
  "maxPoolSize": 10,
  "serverSelectionTimeoutMS": 5000,
  "socketTimeoutMS": 45000,
  "family": 4
}
```

### SQLite Fallback

```bash
# Enable SQLite fallback
USE_SQLITE=true
SQLITE_PATH=./data/echotune.db

# SQLite optimization
SQLITE_OPTIONS={
  "cache_size": -64000,
  "journal_mode": "WAL",
  "synchronous": "NORMAL"
}
```

## 🔐 CI/CD Secrets

### GitHub Secrets Configuration

Required secrets in GitHub repository settings:

```bash
# Core Application
NODE_ENV=production
SESSION_SECRET=your-production-session-secret

# Spotify Integration
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret

# Database
MONGODB_URI=your-production-mongodb-uri

# AI Providers
OPENAI_API_KEY=your-openai-api-key
GEMINI_API_KEY=your-gemini-api-key

# Deployment
DIGITALOCEAN_TOKEN=your-digitalocean-token
DOCKER_REGISTRY_URL=registry.digitalocean.com/your-registry
STAGING_URL=https://staging.yourdomain.com

# Optional - for enhanced CI
BROWSERBASE_API_KEY=your-browserbase-api-key
SENTRY_DSN=your-sentry-dsn
```

### Secret Management Commands

```bash
# Validate required secrets
npm run validate:env

# Check API key connectivity
npm run validate:api-keys

# Test production configuration
npm run validate:production-env
```

## 🏠 Local Development Setup

### Quick Start

```bash
# 1. Clone and install
git clone https://github.com/dzp5103/Spotify-echo.git
cd Spotify-echo
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your configuration

# 3. Start development
npm run dev

# 4. Start MCP servers
npm run mcp-orchestrator

# 5. Verify setup
npm run validate:comprehensive
```

### Development Configuration

```bash
# Development-specific settings
NODE_ENV=development
PORT=3000
USE_SQLITE=true
LLM_PROVIDER=mock
ENABLE_DEBUG_LOGGING=true

# Skip external services in development
SKIP_SPOTIFY_AUTH=true
SKIP_REDIS_CACHE=true
```

## 🚀 Production Deployment

### Production Checklist

- [ ] All required environment variables configured
- [ ] Database connection tested
- [ ] Spotify API credentials validated
- [ ] LLM provider API keys verified
- [ ] MCP servers health checked
- [ ] Security audit passed
- [ ] Performance optimization enabled

### Production Commands

```bash
# Pre-deployment validation
npm run production:validate

# Security audit
npm run security:audit

# Build for production
npm run build

# Start production server
npm start

# Monitor deployment
npm run deployment:status
```

### Health Check Endpoints

```bash
# Application health
curl -f https://yourdomain.com/health

# MCP services health
curl -f https://yourdomain.com:3001/health

# Database connectivity
curl -f https://yourdomain.com/api/db/health

# Full system status
curl -f https://yourdomain.com/api/status
```

## 🔍 Troubleshooting

### Common Configuration Issues

1. **Spotify Authentication Errors**
   ```bash
   npm run validate:spotify
   # Check SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET
   ```

2. **Database Connection Issues**
   ```bash
   npm run validate:mongodb-comprehensive
   # Verify MONGODB_URI format and credentials
   ```

3. **MCP Server Issues**
   ```bash
   node scripts/mcp-orchestration-health.js health
   # Check MCP server status and port conflicts
   ```

4. **Port Conflicts**
   ```bash
   netstat -tulpn | grep :3000
   # Check for port availability
   ```

### Validation Commands

```bash
# Comprehensive system validation
npm run validate:comprehensive

# Generate full validation report
node scripts/generate-validation-report.js

# MCP orchestration health
node scripts/mcp-orchestration-health.js status
```

## 📚 Additional Resources

- [API Documentation](./API_DOCUMENTATION.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Environment Variables Reference](./ENVIRONMENT_VARIABLES.md)
- [MCP Integration Guide](./MCP_AUTOMATION_README.md)
- [Security Guide](./docs/security/README.md)

---

**Note:** This configuration guide is part of the production-ready automation scaffolding. For the most up-to-date information, refer to the validation report generated by `npm run validate:comprehensive`.
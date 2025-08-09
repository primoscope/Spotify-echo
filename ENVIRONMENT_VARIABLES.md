# Environment Variables Reference

This document provides a comprehensive reference for all environment variables used in EchoTune AI. Use this as a reference when setting up local development, CI/CD, or production deployments.

## 📋 Quick Reference

### Required Variables

```bash
# Minimum required for basic functionality
NODE_ENV=development
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/database
```

### Recommended Variables

```bash
# Recommended for full functionality
OPENAI_API_KEY=sk-your-openai-key
REDIS_URL=redis://localhost:6379
SESSION_SECRET=your-secure-session-secret
```

## 🔧 Core Application Variables

### Server Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | **Yes** | `development` | Application environment (development/production/test) |
| `PORT` | No | `3000` | Primary server port |
| `HOST` | No | `localhost` | Server host binding |
| `BASE_URL` | No | `http://localhost:3000` | Application base URL |

### Security

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SESSION_SECRET` | **Production** | `dev-secret` | Session encryption key |
| `JWT_SECRET` | No | `auto-generated` | JWT token signing key |
| `CORS_ORIGIN` | No | `*` | CORS allowed origins |
| `RATE_LIMIT_MAX` | No | `100` | Rate limit per window |
| `RATE_LIMIT_WINDOW` | No | `900000` | Rate limit window (ms) |

## 🎵 Spotify Integration

### API Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SPOTIFY_CLIENT_ID` | **Yes** | - | Spotify app client ID |
| `SPOTIFY_CLIENT_SECRET` | **Yes** | - | Spotify app client secret |
| `SPOTIFY_REDIRECT_URI` | **Yes** | `/auth/spotify/callback` | OAuth redirect URI |

### Optional Spotify Settings

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SPOTIFY_MARKET` | No | `US` | Default market for Spotify API |
| `SPOTIFY_SCOPES` | No | `user-read-private,user-read-email` | OAuth scopes |
| `SKIP_SPOTIFY_AUTH` | No | `false` | Skip Spotify auth (development) |

### Example Configuration

```bash
# Development
SPOTIFY_CLIENT_ID=your_dev_client_id
SPOTIFY_CLIENT_SECRET=your_dev_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/auth/spotify/callback
SKIP_SPOTIFY_AUTH=true

# Production
SPOTIFY_CLIENT_ID=your_prod_client_id
SPOTIFY_CLIENT_SECRET=your_prod_client_secret
SPOTIFY_REDIRECT_URI=https://yourdomain.com/auth/spotify/callback
SPOTIFY_MARKET=US
SPOTIFY_SCOPES=user-read-private,user-read-email,user-top-read,user-read-playback-state
```

## 🗄️ Database Configuration

### MongoDB (Primary Database)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URI` | **Recommended** | - | MongoDB connection string |
| `MONGODB_DB_NAME` | No | `echotune` | Database name |
| `MONGODB_OPTIONS` | No | `{}` | Connection options (JSON) |

```bash
# Examples
MONGODB_URI=mongodb://localhost:27017/echotune
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/echotune
MONGODB_DB_NAME=echotune_production
```

### SQLite (Fallback Database)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `USE_SQLITE` | No | `false` | Enable SQLite fallback |
| `SQLITE_PATH` | No | `./data/echotune.db` | SQLite file path |
| `DATABASE_URL` | No | - | Generic database URL |

```bash
# SQLite Configuration
USE_SQLITE=true
SQLITE_PATH=./data/echotune_dev.db

# For CI/Testing
DATABASE_URL=:memory:
USE_SQLITE=true
```

### Supabase (Alternative Database)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SUPABASE_URL` | No | - | Supabase project URL |
| `SUPABASE_ANON_KEY` | No | - | Supabase anonymous key |
| `SUPABASE_SERVICE_KEY` | No | - | Supabase service key |

## 🤖 AI/LLM Configuration

### Provider Selection

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LLM_PROVIDER` | No | `mock` | Primary LLM provider (openai/gemini/mock) |
| `FALLBACK_LLM_PROVIDER` | No | `mock` | Fallback provider |

### OpenAI Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | **If using OpenAI** | - | OpenAI API key |
| `OPENAI_MODEL` | No | `gpt-4-turbo` | Default OpenAI model |
| `OPENAI_MAX_TOKENS` | No | `4096` | Maximum tokens per request |
| `OPENAI_TEMPERATURE` | No | `0.7` | Response creativity (0-1) |

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4-turbo
OPENAI_MAX_TOKENS=4096
OPENAI_TEMPERATURE=0.7
```

### Google Gemini Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | **If using Gemini** | - | Google Gemini API key |
| `GEMINI_MODEL` | No | `gemini-pro` | Gemini model version |
| `GEMINI_SAFETY_SETTINGS` | No | `default` | Content safety settings |

```bash
# Gemini Configuration
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-pro
```

### OpenRouter Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENROUTER_API_KEY` | **If using OpenRouter** | - | OpenRouter API key |
| `OPENROUTER_MODEL` | No | `openai/gpt-3.5-turbo` | OpenRouter model |

## 🚀 Performance & Caching

### Redis Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REDIS_URL` | **Recommended** | - | Redis connection URL |
| `REDIS_HOST` | No | `localhost` | Redis host |
| `REDIS_PORT` | No | `6379` | Redis port |
| `REDIS_PASSWORD` | No | - | Redis password |
| `REDIS_DB` | No | `0` | Redis database number |
| `CACHE_TTL` | No | `3600` | Default cache TTL (seconds) |
| `SKIP_REDIS_CACHE` | No | `false` | Disable Redis caching |

```bash
# Redis Examples
REDIS_URL=redis://localhost:6379
REDIS_URL=redis://:password@host:port/db
REDIS_URL=rediss://user:password@host:port/db

# Individual settings
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0
CACHE_TTL=3600
```

### Performance Settings

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ENABLE_COMPRESSION` | No | `true` | Enable gzip compression |
| `MAX_REQUESTS_PER_MINUTE` | No | `100` | API rate limiting |
| `CLUSTER_MODE` | No | `false` | Enable Node.js clustering |
| `WORKER_PROCESSES` | No | `auto` | Number of worker processes |

## 🔧 MCP Server Configuration

### MCP Core Settings

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MCP_SERVER_PORT` | No | `3001` | Main MCP server port |
| `MCP_ORCHESTRATOR_PORT` | No | `3002` | MCP orchestrator port |
| `ANALYTICS_SERVER_PORT` | No | `3003` | Analytics server port |
| `MCP_AUTH_TOKEN` | No | - | MCP authentication token |
| `ENABLE_MCP_LOGGING` | No | `true` | Enable MCP detailed logging |

### MCP Service Ports

| Variable | Default | Description |
|----------|---------|-------------|
| `PACKAGE_MGMT_PORT` | `3004` | Package management MCP |
| `CODE_SANDBOX_PORT` | `3005` | Code sandbox MCP |
| `TESTING_AUTO_PORT` | `3006` | Testing automation MCP |
| `SENTRY_MCP_PORT` | `3012` | Sentry MCP server |
| `BROWSERBASE_PORT` | `3013` | Browserbase MCP |
| `FILESYSTEM_PORT` | `3014` | Filesystem MCP |
| `SPOTIFY_MCP_PORT` | `3015` | Spotify MCP |

### External MCP Services

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BROWSERBASE_API_KEY` | **If using Browserbase** | - | Browserbase API key |
| `BROWSERBASE_PROJECT_ID` | **If using Browserbase** | - | Browserbase project ID |
| `PUPPETEER_HEADLESS` | No | `true` | Puppeteer headless mode |

## 🔐 Development & Testing

### Development Settings

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | **Yes** | `development` | Environment mode |
| `DEBUG` | No | - | Debug namespaces (e.g., `app:*`) |
| `ENABLE_DEBUG_LOGGING` | No | `false` | Verbose debug logging |
| `HOT_RELOAD` | No | `true` | Enable hot reloading |

### Testing Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | **Yes** | `test` | Must be 'test' for test runs |
| `TEST_DB_URL` | No | `:memory:` | Test database URL |
| `SKIP_EXTERNAL_APIS` | No | `true` | Skip external API calls in tests |
| `MOCK_SPOTIFY_API` | No | `true` | Use mock Spotify responses |
| `PLAYWRIGHT_BASE_URL` | No | `http://localhost:3000` | E2E test base URL |

```bash
# Test Environment
NODE_ENV=test
USE_SQLITE=true
DATABASE_URL=:memory:
LLM_PROVIDER=mock
SKIP_SPOTIFY_AUTH=true
SKIP_EXTERNAL_APIS=true
```

## 🚀 Production & Deployment

### Production Settings

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | **Yes** | `production` | Must be 'production' |
| `PM2_INSTANCES` | No | `max` | PM2 process instances |
| `CLUSTER_MODE` | No | `true` | Enable clustering |
| `LOG_LEVEL` | No | `info` | Logging level |

### Deployment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DOCKER_REGISTRY` | No | - | Docker registry URL |
| `IMAGE_TAG` | No | `latest` | Docker image tag |
| `HEALTH_CHECK_URL` | No | `/health` | Health check endpoint |
| `SHUTDOWN_TIMEOUT` | No | `30000` | Graceful shutdown timeout (ms) |

### DigitalOcean Deployment

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DIGITALOCEAN_TOKEN` | **If using DO** | - | DigitalOcean API token |
| `DO_REGISTRY_URL` | No | - | DigitalOcean container registry |
| `DO_APP_NAME` | No | `echotune-ai` | App platform app name |
| `DO_REGION` | No | `nyc1` | Deployment region |

## 📝 Environment File Templates

### `.env.example` (Development)

```bash
# Core Application
NODE_ENV=development
PORT=3000

# Spotify Integration (Required)
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/auth/spotify/callback

# Database (Choose one)
MONGODB_URI=mongodb://localhost:27017/echotune
# OR
USE_SQLITE=true

# AI Provider (Optional)
OPENAI_API_KEY=sk-your-openai-key
LLM_PROVIDER=openai

# Caching (Optional)
REDIS_URL=redis://localhost:6379
```

### `.env.production.example` (Production)

```bash
# Core Application
NODE_ENV=production
PORT=3000
BASE_URL=https://yourdomain.com

# Security
SESSION_SECRET=your-secure-production-session-secret-min-32-chars
CORS_ORIGIN=https://yourdomain.com

# Spotify Integration
SPOTIFY_CLIENT_ID=your-production-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-production-spotify-client-secret
SPOTIFY_REDIRECT_URI=https://yourdomain.com/auth/spotify/callback

# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/echotune

# AI Provider
OPENAI_API_KEY=sk-your-production-openai-key
LLM_PROVIDER=openai

# Performance
REDIS_URL=redis://your-redis-host:6379
ENABLE_COMPRESSION=true
CLUSTER_MODE=true
```

### `.env.test` (Testing)

```bash
# Test Environment
NODE_ENV=test

# Use in-memory/mock services
USE_SQLITE=true
DATABASE_URL=:memory:
LLM_PROVIDER=mock
SKIP_SPOTIFY_AUTH=true
SKIP_REDIS_CACHE=true

# Test-specific settings
ENABLE_DEBUG_LOGGING=false
MOCK_EXTERNAL_APIS=true
```

## 🔍 Validation Commands

```bash
# Validate environment configuration
npm run validate:env

# Check specific service connectivity
npm run validate:spotify
npm run validate:mongodb
npm run validate:openai

# Comprehensive validation
npm run validate:comprehensive

# Generate environment report
node scripts/validate-production-env.js
```

## ❗ Security Considerations

### Secrets Management

1. **Never commit secrets to version control**
2. **Use different secrets for each environment**
3. **Rotate secrets regularly in production**
4. **Use secure secret management services in production**

### Required Secret Strength

- `SESSION_SECRET`: Minimum 32 characters, cryptographically random
- `JWT_SECRET`: Minimum 32 characters, cryptographically random
- API keys: Use production keys, not development keys

### Environment-Specific Security

```bash
# Development - relaxed security for convenience
CORS_ORIGIN=*
SKIP_SPOTIFY_AUTH=true
ENABLE_DEBUG_LOGGING=true

# Production - strict security
CORS_ORIGIN=https://yourdomain.com
SKIP_SPOTIFY_AUTH=false
ENABLE_DEBUG_LOGGING=false
RATE_LIMIT_MAX=60
```

---

**Note:** This environment variables reference is part of the production-ready automation scaffolding. Always use the latest `.env.example` files as templates and validate your configuration with `npm run validate:comprehensive`.
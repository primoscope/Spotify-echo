# 🔐 EchoTune AI - Complete API Secrets & Configuration Guide

## Overview

This comprehensive guide details every API key, secret, and configuration variable needed for full EchoTune AI deployment. The system requires **181 configuration keys** across multiple categories for complete functionality.

## 📊 Configuration Status

- **Current .env keys**: 181
- **Example .env keys**: 127  
- **Missing keys**: 84
- **Configuration Complete**: ❌ 53.7%

---

## 🎯 Essential APIs & Secrets (Priority 1)

### 🎵 Spotify API (REQUIRED)
**Where to Get**: [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)

```bash
# Required for core music functionality
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
SPOTIFY_REDIRECT_URI=https://yourdomain.com/auth/callback
```

**Setup Instructions**:
1. Create Spotify app at https://developer.spotify.com/dashboard
2. Add your domain to "Redirect URIs" 
3. Copy Client ID and Secret
4. Set Web API permissions: `user-read-private`, `user-read-email`, `user-top-read`, `user-read-recently-played`

### 🤖 AI/LLM Providers (REQUIRED)
**Multiple providers for redundancy and capabilities**

#### OpenAI Configuration
**Where to Get**: [OpenAI API Platform](https://platform.openai.com/api-keys)
```bash
OPENAI_API_KEY=sk-your_openai_api_key_here
OPENAI_MODEL=gpt-4-turbo
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.7
OPENAI_RATE_LIMIT=60
```

#### Google Gemini Configuration  
**Where to Get**: [Google AI Studio](https://aistudio.google.com/app/apikey)
```bash
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-pro
GEMINI_MAX_TOKENS=2000
GEMINI_TEMPERATURE=0.7
GEMINI_RATE_LIMIT=60
```

#### OpenRouter Configuration (Multi-Model Access)
**Where to Get**: [OpenRouter Platform](https://openrouter.ai/keys)
```bash
OPENROUTER_API_KEY=sk-or-your_openrouter_api_key_here
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
OPENROUTER_SITE_URL=https://yourdomain.com
OPENROUTER_APP_NAME=EchoTune AI
```

#### Anthropic Claude Configuration
**Where to Get**: [Anthropic Console](https://console.anthropic.com/account/keys)
```bash
ANTHROPIC_API_KEY=sk-ant-your_anthropic_api_key_here
ANTHROPIC_MODEL=claude-3-sonnet-20240229
ANTHROPIC_MAX_TOKENS=2000
```

### 🔒 Security Secrets (GENERATE UNIQUE)
**Generate random 64+ character strings**

```bash
# Use: openssl rand -hex 32 to generate each
SESSION_SECRET=your_64_char_random_string_here
JWT_SECRET=your_64_char_random_string_here
```

---

## 🗄️ Database Configuration (Priority 2)

### MongoDB (Primary Database)
**Where to Get**: [MongoDB Atlas](https://cloud.mongodb.com/)

```bash
# Enhanced MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/echotune
MONGODB_DB_NAME=echotune
MONGODB_MAX_POOL_SIZE=10
MONGODB_MIN_POOL_SIZE=5
MONGODB_MAX_IDLE_TIME=30000
MONGODB_CONNECT_TIMEOUT=10000
MONGODB_SOCKET_TIMEOUT=0
MONGODB_COLLECTIONS_PREFIX=echotune_
ENABLE_MONGODB_ANALYTICS=true
MONGODB_ANALYTICS_RETENTION_DAYS=90
```

**Setup Instructions**:
1. Create free cluster at MongoDB Atlas
2. Create database user with read/write access
3. Whitelist your IP addresses (0.0.0.0/0 for development)
4. Copy connection string and replace `<password>` and `<dbname>`

### PostgreSQL/Supabase (Optional)
**Where to Get**: [Supabase Dashboard](https://supabase.com/dashboard)
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/echotune
```

### Redis (Caching)
**Where to Get**: [Redis Cloud](https://redis.com/redis-enterprise-cloud/) or local installation
```bash
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password
REDIS_DB_INDEX=0
REDIS_KEY_PREFIX=echotune:
REDIS_DEFAULT_TTL=3600
```

### SQLite (Fallback)
```bash
SQLITE_DB_PATH=data/echotune.db
ENABLE_SQLITE_FALLBACK=true
```

---

## 🌐 Infrastructure & Deployment (Priority 3)

### SSL/TLS Configuration
**Where to Get**: [Let's Encrypt](https://letsencrypt.org/) or CloudFlare
```bash
SSL_ENABLED=true
SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
SSL_KEY_PATH=/etc/nginx/ssl/key.pem
SSL_CHAIN_PATH=/etc/nginx/ssl/chain.pem
SSL_EMAIL=admin@yourdomain.com
```

### NGINX Configuration
```bash
NGINX_WORKER_PROCESSES=auto
NGINX_WORKER_CONNECTIONS=1024
BACKEND_HOST=app
BACKEND_PORT=3000
```

### Docker Hub (Container Registry)
**Where to Get**: [Docker Hub](https://hub.docker.com/settings/security)
```bash
DOCKER_HUB_USERNAME=your_dockerhub_username
DOCKER_HUB_TOKEN=your_dockerhub_access_token
DOCKER_REGISTRY=docker.io
DOCKER_REPOSITORY=your_username/echotune-ai
```

---

## 🔌 MCP Server Integrations (Priority 4)

### GitHub Integration
**Where to Get**: [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
```bash
GITHUB_PAT=ghp_your_github_personal_access_token
GITHUB_API_URL=https://api.github.com
```

**Required Permissions**: `repo`, `workflow`, `read:org`, `read:user`, `user:email`

### Search & Web APIs
#### Brave Search
**Where to Get**: [Brave Search API](https://api.search.brave.com/register)
```bash
BRAVE_API_KEY=your_brave_search_api_key
```

#### YouTube Data API
**Where to Get**: [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
```bash
YOUTUBE_API_KEY=your_youtube_api_key
```

### Browser Automation
**Where to Get**: [Browserbase](https://browserbase.com/dashboard)
```bash
BROWSERBASE_API_KEY=your_browserbase_api_key
BROWSERBASE_PROJECT_ID=your_browserbase_project_id
BROWSERBASE_SESSION_ID=your_browserbase_session_id
```

### Analytics & Monitoring
#### InfluxDB (Time Series Data)
**Where to Get**: [InfluxData Cloud](https://cloud2.influxdata.com/)
```bash
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=your_influxdb_token
```

#### Langfuse (LLM Observability)
**Where to Get**: [Langfuse Cloud](https://cloud.langfuse.com/)
```bash
LANGFUSE_PUBLIC_KEY=pk_your_langfuse_public_key
LANGFUSE_SECRET_KEY=sk_your_langfuse_secret_key
```

---

## 📊 Analytics & Features (Priority 5)

### Performance Monitoring
```bash
# LLM Provider Features
LLM_PROVIDER_FALLBACK=gemini,mock
ENABLE_PROVIDER_SWITCHING=true
ENABLE_MODEL_SELECTION=true
LLM_RESPONSE_CACHE_TTL=300
LLM_RETRY_ATTEMPTS=3
LLM_TIMEOUT=30000

# Performance Settings
RATE_LIMIT_ENABLED=true
CLUSTER_ENABLED=false
WORKER_PROCESSES=auto
PROMETHEUS_ENABLED=false
PROMETHEUS_PORT=9090
```

### Database Analytics
```bash
ENABLE_DATABASE_ANALYTICS=true
ENABLE_QUERY_LOGGING=false
DATABASE_BACKUP_ENABLED=true
DATABASE_BACKUP_INTERVAL=24h
```

### Application Features
```bash
ENABLE_ANALYTICS_DASHBOARD=true
ENABLE_REALTIME_UPDATES=true
ENABLE_BACKGROUND_TASKS=true
ENABLE_FILE_UPLOADS=true
MAX_FILE_SIZE=50MB
```

### Music Analytics
```bash
ANALYTICS_RETENTION_DAYS=365
TRACK_USER_BEHAVIOR=true
ENABLE_LISTENING_INSIGHTS=true
ENABLE_MUSIC_ANALYTICS=true
TRACK_PLAY_COUNTS=true
ANALYZE_LISTENING_PATTERNS=true
GENERATE_RECOMMENDATIONS_INSIGHTS=true
```

### Dashboard Configuration
```bash
DASHBOARD_REFRESH_INTERVAL=30000
ENABLE_REAL_TIME_CHARTS=true
CHART_DATA_POINTS=100
ENABLE_DATA_EXPORT=true
```

### Logging Configuration
```bash
LOG_FORMAT=combined
ENABLE_REQUEST_LOGGING=true
ENABLE_ERROR_TRACKING=true
LOG_ROTATION_ENABLED=true
```

### MCP Server Configuration
```bash
MCP_SERVER_PORT=3001
MCP_SERVER_HOST=localhost
ENABLE_MCP_LOGGING=true
MCP_TIMEOUT=30000
```

---

## 🚀 Quick Setup Guide

### 1. Development Setup (Minimal - 8 Keys)
```bash
NODE_ENV=development
PORT=3000
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret  
SPOTIFY_REDIRECT_URI=http://localhost:3000/auth/callback
SESSION_SECRET=generate_random_string_64_chars
JWT_SECRET=generate_random_string_64_chars
OPENAI_API_KEY=sk-your_openai_key
```

### 2. Production Setup (Recommended - 25 Keys)
Add to development keys:
```bash
NODE_ENV=production
DOMAIN=yourdomain.com
FRONTEND_URL=https://yourdomain.com
MONGODB_URI=mongodb+srv://user:pass@cluster/db
GEMINI_API_KEY=your_gemini_key
REDIS_URL=redis://localhost:6379
SSL_ENABLED=true
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/key.pem
NGINX_WORKER_PROCESSES=auto
NGINX_WORKER_CONNECTIONS=1024
BACKEND_HOST=app
BACKEND_PORT=3000
DOCKER_HUB_USERNAME=your_dockerhub_user
DOCKER_HUB_TOKEN=your_dockerhub_token
GITHUB_PAT=your_github_token
ENABLE_ANALYTICS_DASHBOARD=true
MCP_SERVER_PORT=3001
```

### 3. Full Production Setup (Complete - 181 Keys)
Copy the complete `.env.example` template and fill in all values.

---

## 🛠️ API Key Testing & Validation

Use the comprehensive testing tool to validate your configuration:

```bash
# Test all API keys and configurations
npm run validate:api-keys

# Test specific service
npm run validate:spotify
npm run validate:openai
npm run validate:mongodb
npm run validate:mcp-server
```

---

## 🔍 Security Best Practices

### 1. API Key Security
- **Never commit API keys to git**
- Use `.env` files and keep them in `.gitignore`
- Use different keys for development/production
- Rotate keys regularly (every 90 days)
- Use least-privilege access for each API

### 2. Secret Generation
```bash
# Generate secure random secrets
openssl rand -hex 32    # For SESSION_SECRET, JWT_SECRET
openssl rand -base64 32 # Alternative format
```

### 3. Environment Separation
- `development`: Local testing keys (limited quotas)  
- `staging`: Production-like keys (sandbox accounts)
- `production`: Full production keys (paid accounts)

### 4. Key Management
- Use key management services (AWS Secrets Manager, Azure Key Vault)
- Implement key rotation schedules
- Monitor API usage and billing
- Set up alerts for usage limits

---

## 📝 Configuration Validation Checklist

### ✅ Essential Services (Must Have)
- [ ] Spotify API (Client ID + Secret)
- [ ] At least one LLM provider (OpenAI/Gemini)  
- [ ] Security secrets (SESSION_SECRET, JWT_SECRET)
- [ ] Database connection (MongoDB/PostgreSQL)

### ✅ Recommended Services  
- [ ] Multiple LLM providers (fallback)
- [ ] Redis caching
- [ ] SSL certificates
- [ ] GitHub integration
- [ ] Docker Hub credentials

### ✅ Optional Services (Enhanced Features)
- [ ] Search APIs (Brave, YouTube)
- [ ] Browser automation (Browserbase)
- [ ] Analytics platforms (InfluxDB, Langfuse)
- [ ] Monitoring tools (Prometheus)

---

## 🆘 Troubleshooting

### Common Issues

#### "Spotify Authentication Failed"
- Verify Client ID and Secret are correct
- Check Redirect URI matches exactly (including protocol)
- Ensure Spotify app is not in Development Mode for production

#### "OpenAI API Error"
- Verify API key starts with `sk-`
- Check account has available credits
- Verify model name is correct (`gpt-4-turbo`, not `gpt-4-turbo-preview`)

#### "Database Connection Failed"
- Check MongoDB URI format and credentials
- Verify IP whitelist includes your server IP
- Test connection string in MongoDB Compass

#### "MCP Server Timeout"
- Ensure MCP server is running on correct port
- Check firewall rules for port 3001
- Verify no port conflicts with other services

### Getting Help

1. **Check the validation report**: `npm run validate:comprehensive`
2. **Test specific service**: `npm run validate:[service-name]`
3. **Review logs**: Check application logs for specific error messages
4. **Community support**: Refer to service-specific documentation

---

## 📚 Additional Resources

### Service Documentation
- [Spotify Web API Reference](https://developer.spotify.com/documentation/web-api/)
- [OpenAI API Documentation](https://platform.openai.com/docs/)
- [Google Gemini API Guide](https://ai.google.dev/gemini-api/docs)
- [MongoDB Atlas Documentation](https://www.mongodb.com/docs/atlas/)
- [Docker Hub Documentation](https://docs.docker.com/docker-hub/)

### Security Resources
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [Let's Encrypt Getting Started](https://letsencrypt.org/getting-started/)
- [GitHub Security Best Practices](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure)

---

**Last Updated**: {timestamp}
**Configuration Version**: 2.1.0
**Total Keys Supported**: 181

> 💡 **Tip**: Start with the Development Setup (8 keys) to get basic functionality, then gradually add services as needed for production deployment.
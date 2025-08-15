# GitHub Repository Secrets Configuration

## 🔑 Required Repository Secrets

This document lists all the API keys, tokens, and secrets that need to be added to your GitHub repository's **Settings → Secrets and Variables → Actions**.

### How to Add Secrets

1. Go to your repository on GitHub
2. Click **Settings** (repository settings, not your account)
3. In the left sidebar, click **Secrets and Variables → Actions**
4. Click **New repository secret**
5. Add the secret name and value exactly as specified below

---

## 🧠 AI & Research Services

### Perplexity AI Research
```
Name: PERPLEXITY_API_KEY
Value: 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
Description: API key for Perplexity AI research and web search capabilities
Usage: MCP server, research automation, GitHub Copilot agent workflows
```

### OpenAI (Optional)
```
Name: OPENAI_API_KEY
Value: [Your OpenAI API key - starts with sk-]
Description: OpenAI API for alternative AI processing and language models
Usage: Fallback AI provider, advanced reasoning tasks
```

### Google Gemini (Optional)
```
Name: GEMINI_API_KEY
Value: [Your Google AI Studio API key]
Description: Google Gemini API for additional AI capabilities
Usage: Alternative AI provider, multimodal processing
```

---

## 🎯 Development Tools

### Cursor IDE API
```
Name: CURSOR_API_KEY
Value: key_694009601be9f42adc51e02c9d5a4e27828043679cd397039c7496e07f00b705
Description: Cursor IDE API key for enhanced AI coding assistance
Usage: Cursor IDE MCP integration, AI-powered development workflows
```

### GitHub Token
```
Name: GITHUB_TOKEN
Value: [Your GitHub Personal Access Token]
Description: GitHub API access for repository operations and automation
Usage: GitHub MCP server, automated PR creation, repository management
Scopes: repo, workflow, read:org, read:user
```

---

## 🎵 Music Services

### Spotify API
```
Name: SPOTIFY_CLIENT_ID
Value: [Your Spotify App Client ID]
Description: Spotify Web API client identifier
Usage: Music data fetching, playlist management, user authentication
```

```
Name: SPOTIFY_CLIENT_SECRET
Value: [Your Spotify App Client Secret]
Description: Spotify Web API client secret for authentication
Usage: Server-to-server authentication, token refresh
```

---

## 🔍 Search & Data Services

### Brave Search API
```
Name: BRAVE_API_KEY
Value: BSAQ0gsYuaYuEZHayb_Ek1pnl1l2RiW
Description: Brave Search API for privacy-focused web search
Usage: MCP server, web search capabilities, research automation
```

### MongoDB Atlas
```
Name: MONGODB_URI
Value: [Your MongoDB Atlas connection string]
Description: MongoDB database connection for production
Usage: User data storage, listening history, recommendations
```

### Browserbase API
```
Name: BROWSERBASE_API_KEY
Value: bb_live_uwB0Y5AQdwH_Bt3azwiOxD0zOfM
Description: Browserbase cloud browser automation API
Usage: Automated browser testing, web automation, screenshot capture
```

```
Name: BROWSERBASE_PROJECT_ID  
Value: [Your Browserbase project ID from dashboard]
Description: Browserbase project identifier for browser sessions
Usage: Browser automation workflows, testing environments
```

---

## ☁️ Cloud Infrastructure

### DigitalOcean
```
Name: DIGITALOCEAN_TOKEN
Value: [Your DigitalOcean API token]
Description: DigitalOcean API access for deployment automation
Usage: Automated deployments, infrastructure management, container registry
```

### Redis Cloud (Optional)
```
Name: REDIS_URL
Value: [Your Redis Cloud connection string]
Description: Redis database for caching and session storage
Usage: Performance optimization, session management, API response caching
```

---

## 🔐 Security & Monitoring

### Session Secrets
```
Name: SESSION_SECRET
Value: [Generate a secure random string - 64+ characters]
Description: Secret key for session encryption and security
Usage: User session management, secure authentication
```

```
Name: JWT_SECRET
Value: [Generate a secure random string - 64+ characters]
Description: Secret key for JWT token signing and verification
Usage: API authentication, secure token generation
```

### Sentry (Optional)
```
Name: SENTRY_DSN
Value: [Your Sentry DSN URL]
Description: Sentry error tracking and monitoring
Usage: Production error monitoring, performance tracking
```

---

## 📊 Analytics & Monitoring

### Analytics Service (Optional)
```
Name: ANALYTICS_API_KEY
Value: [Your analytics service API key]
Description: Analytics and user tracking service
Usage: Usage analytics, performance metrics, user insights
```

---

## 🧪 Testing & Development

### Test API Keys (Development)
```
Name: TEST_PERPLEXITY_API_KEY
Value: [Separate API key for testing]
Description: Perplexity API key for test environments
Usage: Automated testing, development environment
```

---

## ⚡ Quick Setup Commands

### Generate Secure Secrets
```bash
# Generate session secret (64 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT secret (64 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Validate Secrets
```bash
# Test Perplexity API
curl -H "Authorization: Bearer YOUR_PERPLEXITY_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"model":"sonar-pro","messages":[{"role":"user","content":"test"}],"max_tokens":50}' \
     https://api.perplexity.ai/chat/completions

# Test DigitalOcean API
curl -X GET -H "Authorization: Bearer YOUR_DIGITALOCEAN_TOKEN" \
     "https://api.digitalocean.com/v2/account"

# Test GitHub API
curl -H "Authorization: token YOUR_GITHUB_TOKEN" \
     https://api.github.com/user
```

---

## 🎯 Priority Order for Setup

### Phase 1: Core Functionality
1. **PERPLEXITY_API_KEY** - Essential for AI research capabilities
2. **SPOTIFY_CLIENT_ID** & **SPOTIFY_CLIENT_SECRET** - Core music functionality
3. **SESSION_SECRET** & **JWT_SECRET** - Security and authentication

### Phase 2: Development Enhancement  
4. **CURSOR_API_KEY** - Enhanced development experience
5. **GITHUB_TOKEN** - Automated workflows and integration
6. **MONGODB_URI** - Production data storage

### Phase 3: Production Deployment
7. **DIGITALOCEAN_TOKEN** - Cloud deployment
8. **REDIS_URL** - Performance optimization
9. **SENTRY_DSN** - Error monitoring

### Phase 4: Optional Enhancements
10. **OPENAI_API_KEY** - Alternative AI provider
11. **BRAVE_API_KEY** - Alternative search
12. **ANALYTICS_API_KEY** - Usage tracking

---

## 🔍 Security Best Practices

### Secret Management
- **Rotate keys regularly** (monthly for high-use APIs)
- **Use separate keys** for development, staging, and production
- **Never commit secrets** to code repositories
- **Use environment-specific secrets** for different deployment stages

### Access Control
- **Minimum required scopes** for all API tokens
- **Regular audit** of secret usage and access logs
- **Revoke unused secrets** immediately
- **Monitor for secret exposure** in logs and error messages

### Development Workflow
```bash
# Local development - use .env file
PERPLEXITY_API_KEY=pplx-your-dev-key
SPOTIFY_CLIENT_ID=your-dev-client-id

# GitHub Actions - use secrets
${{ secrets.PERPLEXITY_API_KEY }}
${{ secrets.SPOTIFY_CLIENT_ID }}

# Production deployment - use environment variables
export PERPLEXITY_API_KEY="${PERPLEXITY_API_KEY}"
export SPOTIFY_CLIENT_ID="${SPOTIFY_CLIENT_ID}"
```

---

## 🚨 What to Do If Keys Are Compromised

### Immediate Actions
1. **Revoke the compromised key** immediately in the service provider
2. **Generate a new key** with the same permissions
3. **Update the GitHub secret** with the new key
4. **Redeploy affected services** to use the new key
5. **Monitor for suspicious activity** in service logs

### Prevention
- **Use secret scanning tools** in your CI/CD pipeline
- **Set up alerts** for secret exposure
- **Regular security audits** of repositories and workflows
- **Team training** on secret management best practices

---

**📋 Checklist: Repository Secrets Setup**

- [ ] PERPLEXITY_API_KEY - AI research capabilities
- [ ] CURSOR_API_KEY - Enhanced development tools  
- [ ] SPOTIFY_CLIENT_ID & SPOTIFY_CLIENT_SECRET - Music services
- [ ] SESSION_SECRET & JWT_SECRET - Security (generate new)
- [ ] GITHUB_TOKEN - Repository automation
- [ ] MONGODB_URI - Database connection
- [ ] DIGITALOCEAN_TOKEN - Cloud deployment
- [ ] All secrets tested and validated
- [ ] Development vs production keys separated
- [ ] Secret rotation schedule established

**🎯 Status**: Ready for production deployment with full AI-driven automation capabilities.
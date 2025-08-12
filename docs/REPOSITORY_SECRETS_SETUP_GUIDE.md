# 🔐 GitHub Repository Secrets Setup Guide

This comprehensive guide explains how to set up and manage GitHub repository secrets for the EchoTune AI project, including all necessary API keys and configuration values required for the enhanced GPT-5 multimodal workflows and MCP automation system.

## 🎯 Quick Setup Overview

GitHub repository secrets are environment variables stored securely in your repository settings. They're automatically injected into GitHub Actions workflows and are never exposed in logs or pull request discussions.

### 📍 Where to Add Secrets

**Location**: `https://github.com/{username}/{repository}/settings/secrets/actions`

**Navigation Path**:
1. Go to your repository on GitHub
2. Click **Settings** (tab in the repository header)
3. Click **Secrets and variables** (left sidebar)
4. Click **Actions**
5. Click **New repository secret**

## 🚀 Required Secrets for EchoTune AI

### 🎵 Spotify API Configuration (REQUIRED)

Essential for music recommendation functionality:

| Secret Name | Description | Where to Get |
|-------------|-------------|--------------|
| `SPOTIFY_CLIENT_ID` | Your Spotify app client ID | [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) |
| `SPOTIFY_CLIENT_SECRET` | Your Spotify app client secret | [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) |
| `SPOTIFY_REDIRECT_URI` | OAuth callback URL | Set to `https://your-domain.com/auth/callback` |

**Setup Steps**:
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app or use existing one
3. Copy **Client ID** → Add as `SPOTIFY_CLIENT_ID`
4. Click "Show Client Secret" → Copy → Add as `SPOTIFY_CLIENT_SECRET`
5. Add your callback URL to "Redirect URIs" in Spotify app settings

### 🤖 AI/LLM Provider API Keys (REQUIRED for GPT-5 Workflows)

Required for the enhanced GPT-5 multimodal analysis and research capabilities:

| Secret Name | Description | Where to Get | Priority |
|-------------|-------------|--------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for GPT models | [OpenAI API](https://platform.openai.com/api-keys) | **HIGH** |
| `GEMINI_API_KEY` | Google Gemini API key | [Google AI Studio](https://makersuite.google.com/app/apikey) | **HIGH** |
| `PERPLEXITY_API_KEY` | Perplexity AI research API key | [Perplexity API](https://www.perplexity.ai/settings/api) | **NEW** |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key | [Anthropic Console](https://console.anthropic.com/) | Medium |
| `OPENROUTER_API_KEY` | OpenRouter API key (multi-model) | [OpenRouter](https://openrouter.ai/keys) | Medium |

**Format Examples**:
```bash
OPENAI_API_KEY=sk-proj-abcd1234...
GEMINI_API_KEY=AIza...
PERPLEXITY_API_KEY=pplx-abcd1234...
ANTHROPIC_API_KEY=sk-ant-api03-...
OPENROUTER_API_KEY=sk-or-v1-...
```

#### 🔬 Perplexity API Setup (NEW)

**Perplexity AI** enables advanced research capabilities with real-time web search and citations:

1. **Get API Key**: 
   - Go to [Perplexity API Settings](https://www.perplexity.ai/settings/api)
   - Sign up/login to Perplexity
   - Generate a new API key
   - Copy the key (format: `pplx-...`)

2. **Add to Repository**:
   - Name: `PERPLEXITY_API_KEY`
   - Value: Your API key from step 1

3. **Optional Environment Variables**:
   - `PERPLEXITY_BASE_URL`: Default `https://api.perplexity.ai`
   - `PERPLEXITY_MODEL`: Default `llama-3.1-sonar-small-128k-online`

**Features Enabled**:
- 🔍 Real-time web search and research
- 📚 Automatic citation extraction
- 🎯 Configurable time filters (hour/day/week/month/year)
- 💰 Cost-controlled queries (budget: $0.50/session)
- ⚡ Performance budgets (p95 ≤ 1500ms)

### 🗄️ Database Configuration

For persistent data storage:

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `REDIS_URL` | Redis connection URL | `redis://user:pass@host:port` |
| `SUPABASE_URL` | Supabase project URL | `https://abc123.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGci...` |

### 🔧 GitHub Actions & Automation

For enhanced MCP workflows and automation:

| Secret Name | Description | How to Generate |
|-------------|-------------|-----------------|
| `GH_PAT` | Personal Access Token for GitHub API | Settings → Developer settings → Personal access tokens |
| `COPILOT_API_KEY` | Alternative name for OpenAI key | Same as `OPENAI_API_KEY` |
| `GITHUB_TOKEN` | **Auto-provided by GitHub** | No action needed |

**GitHub PAT Scopes Needed**:
- ✅ `repo` (Full repository access)
- ✅ `workflow` (Update GitHub Actions workflows)
- ✅ `write:packages` (Package registry access)

### 🚀 Deployment & Infrastructure

For production deployment:

| Secret Name | Description | Provider |
|-------------|-------------|----------|
| `DO_API_TOKEN` | DigitalOcean API token | [DigitalOcean API](https://cloud.digitalocean.com/account/api/tokens) |
| `DO_REGISTRY_TOKEN` | DigitalOcean registry token | DigitalOcean Container Registry |
| `BROWSERBASE_API_KEY` | Browser automation service | [Browserbase](https://browserbase.com) |
| `BROWSERBASE_PROJECT_ID` | Browserbase project ID | Browserbase Dashboard |

### 🔐 Security & Session Management

| Secret Name | Description | How to Generate |
|-------------|-------------|-----------------|
| `SESSION_SECRET` | Session encryption key | `openssl rand -hex 32` |
| `JWT_SECRET` | JWT token signing key | `openssl rand -hex 32` |

## 📋 Step-by-Step Setup Instructions

### 1. 🎯 Essential Setup (Minimum Required)

**Priority 1 - Core Functionality**:
```bash
# Add these first for basic functionality
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
OPENAI_API_KEY=sk-proj-your_openai_key
```

### 2. 🤖 Enhanced AI Features

**Priority 2 - Full GPT-5 Multimodal Support**:
```bash
# Add these for complete AI capabilities
GEMINI_API_KEY=your_gemini_key
ANTHROPIC_API_KEY=your_anthropic_key
GH_PAT=your_github_personal_access_token
```

### 3. 🗄️ Production Database

**Priority 3 - Persistent Storage**:
```bash
# Add these for production deployment
MONGODB_URI=your_mongodb_connection_string
REDIS_URL=your_redis_connection_url
```

### 4. 🚀 Full Production Setup

**Priority 4 - Complete Deployment**:
```bash
# Add these for full production deployment
DO_ACCESS_TOKEN=your_digitalocean_token
SESSION_SECRET=your_generated_session_secret
JWT_SECRET=your_generated_jwt_secret
```

## 🛡️ Security Best Practices

### ✅ DO's

- ✅ **Use Strong Keys**: Generate secrets with `openssl rand -hex 32`
- ✅ **Rotate Regularly**: Update API keys every 90 days
- ✅ **Minimum Permissions**: Only grant necessary API scopes
- ✅ **Separate Environments**: Use different keys for dev/staging/prod
- ✅ **Monitor Usage**: Check API usage dashboards regularly

### ❌ DON'Ts

- ❌ **Never Commit Secrets**: Don't put secrets in code or `.env` files
- ❌ **Don't Share Keys**: Each developer should use their own keys
- ❌ **Avoid Logging**: Never log secret values
- ❌ **No Screenshots**: Don't include secrets in documentation images
- ❌ **Skip Validation**: Always test secrets after adding them

## 🔧 Advanced Configuration

### Environment-Specific Secrets

For multiple environments, you can use prefixed secrets:

```bash
# Development
DEV_OPENAI_API_KEY=sk-dev-...
DEV_MONGODB_URI=mongodb://dev-cluster...

# Production  
PROD_OPENAI_API_KEY=sk-prod-...
PROD_MONGODB_URI=mongodb://prod-cluster...
```

### Conditional Secret Usage

In workflows, reference secrets conditionally:

```yaml
env:
  OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY || secrets.COPILOT_API_KEY }}
  GITHUB_TOKEN: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}
```

## 🧪 Testing Your Setup

### Validation Commands

After adding secrets, test them with these slash commands:

```bash
# Test MCP system health
/mcp-health-check

# Test GPT-5 integration
/analyze-gpt5

# Run comprehensive validation
/run-mcp-all
```

### Expected Results

✅ **Successful Setup Indicators**:
- MCP servers respond correctly
- GPT-5 analysis generates results
- No "API key missing" errors in logs
- Workflows complete successfully

❌ **Common Issues**:
- `401 Unauthorized` → Check API key format
- `403 Forbidden` → Verify API key permissions
- `Rate limited` → Check usage quotas
- `Connection failed` → Verify URLs and endpoints

## 🚨 Troubleshooting

### Common Secret Issues

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid API key" | Wrong key format | Re-copy from provider dashboard |
| "Insufficient permissions" | Limited key scope | Generate new key with full permissions |
| "Rate limit exceeded" | Too many requests | Check usage quotas, upgrade plan |
| "Secret not found" | Typo in secret name | Verify exact secret name in workflow |

### Debug Commands

```bash
# Check if secrets are available (in workflow)
echo "Checking secrets availability..."
[ -n "$OPENAI_API_KEY" ] && echo "✅ OPENAI_API_KEY set" || echo "❌ OPENAI_API_KEY missing"
[ -n "$SPOTIFY_CLIENT_ID" ] && echo "✅ SPOTIFY_CLIENT_ID set" || echo "❌ SPOTIFY_CLIENT_ID missing"
```

## 📊 Secrets Management Workflow

### For Repository Owners

1. **Initial Setup**: Add all required secrets using this guide
2. **Team Access**: Share this guide with collaborators
3. **Regular Rotation**: Schedule monthly secret rotation
4. **Monitor Usage**: Check API dashboards for unusual activity
5. **Audit Access**: Review who has access to secrets

### For Contributors

1. **Fork Repository**: Secrets don't transfer to forks
2. **Add Your Own**: Add your own API keys to your fork
3. **Test Locally**: Verify functionality before creating PRs
4. **Don't Share**: Never share your personal API keys

## 🔄 Secret Rotation Schedule

| Secret Type | Rotation Frequency | Notification Method |
|-------------|-------------------|-------------------|
| **API Keys** | Every 3 months | Calendar reminder |
| **Database Credentials** | Every 6 months | Automated alerts |
| **Session Secrets** | Every month | GitHub Issues |
| **Deployment Tokens** | Every year | Documentation update |

## 📞 Support & Resources

### Official Documentation Links

- 🎵 **Spotify API**: [developer.spotify.com/documentation](https://developer.spotify.com/documentation)
- 🤖 **OpenAI API**: [platform.openai.com/docs](https://platform.openai.com/docs)
- 🧠 **Google Gemini**: [ai.google.dev](https://ai.google.dev)
- 🏗️ **GitHub Actions**: [docs.github.com/actions](https://docs.github.com/actions)

### Quick Reference Commands

```bash
# Generate secure secrets
openssl rand -hex 32

# Test API key (OpenAI)
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models

# Test API key (Spotify)
curl -H "Authorization: Bearer $ACCESS_TOKEN" https://api.spotify.com/v1/me
```

## 🎉 Quick Start Checklist

Use this checklist to ensure proper setup:

- [ ] **Repository Settings**: Navigated to Settings → Secrets and variables → Actions
- [ ] **Spotify API**: Added `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`
- [ ] **OpenAI API**: Added `OPENAI_API_KEY` with valid key
- [ ] **GitHub Access**: Added `GH_PAT` with repo permissions
- [ ] **Database**: Added `MONGODB_URI` for data persistence
- [ ] **Security**: Generated and added `SESSION_SECRET` and `JWT_SECRET`
- [ ] **Testing**: Ran `/mcp-health-check` to verify setup
- [ ] **Validation**: Confirmed no secret-related errors in workflow logs

---

## ⚡ Ready to Use Enhanced Features

With all secrets properly configured, you can now use:

🤖 **Enhanced GPT-5 Multimodal Workflows**  
🛡️ **Comprehensive MCP Validation System**  
🎵 **Full Spotify Integration**  
🗄️ **Production-Ready Database**  
🚀 **Automated Deployment Pipeline**  

**Next Steps**: 
1. Test your setup with `/run-mcp-all`
2. Try advanced commands like `/gpt5 analyze`
3. Deploy to production using the configured secrets

*This guide ensures secure and complete setup of all repository secrets needed for EchoTune AI's advanced features.*
# 🚀 EchoTune AI - API Configuration Quick Start

## 📋 Overview

EchoTune AI requires **181 configuration keys** for full functionality. This guide provides step-by-step instructions to configure your API keys and secrets quickly and efficiently.

## 🔍 Current Configuration Status

Run this command to check your current configuration:

```bash
npm run config:report
```

**Expected Output:**
```
📊 CONFIGURATION ANALYSIS REPORT
════════════════════════════════════════════════════════════════════════════════
Total .env keys: 181
Missing keys: 84
Keys from missing list already present: 0
Configuration completeness: 0%
```

## 🛠️ Quick Configuration Methods

### Method 1: Automatic Configuration (Fastest)

Add all missing keys with default values:

```bash
npm run config:add-missing
```

This will:
- ✅ Create a backup of your current `.env` file
- ✅ Add all 84 missing configuration keys
- ✅ Use sensible default values
- ⚠️ **You still need to replace placeholder values with real API keys**

### Method 2: Interactive Configuration (Recommended)

Choose which keys to add interactively:

```bash
npm run config:interactive
```

This will:
- 📁 Show categories of configuration keys
- ❓ Ask which categories/keys you want to add
- ✅ Only add the keys you select
- 💡 Provide explanations for each category

### Method 3: Preview Changes (Dry Run)

See what would be added without making changes:

```bash
npm run config:dry-run
```

## 🔑 Essential API Keys Setup

### 1. Spotify API (REQUIRED)

**Get Your Keys**: [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)

```bash
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
SPOTIFY_REDIRECT_URI=https://yourdomain.com/auth/callback
```

**Setup Steps:**
1. Create Spotify app at developer dashboard
2. Add your domain to "Redirect URIs"
3. Copy Client ID and Secret to `.env` file

### 2. AI/LLM Provider (REQUIRED - Choose One)

#### Option A: OpenAI
**Get Your Key**: [OpenAI API Keys](https://platform.openai.com/api-keys)
```bash
OPENAI_API_KEY=sk-your_openai_api_key_here
```

#### Option B: Google Gemini
**Get Your Key**: [Google AI Studio](https://aistudio.google.com/app/apikey)
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Security Secrets (REQUIRED)

Generate random secure secrets:

```bash
# Generate secure secrets
openssl rand -hex 32  # Use output for SESSION_SECRET
openssl rand -hex 32  # Use output for JWT_SECRET
```

Add to `.env`:
```bash
SESSION_SECRET=your_64_character_random_string
JWT_SECRET=your_different_64_character_random_string
```

### 4. Database (REQUIRED)

#### Option A: MongoDB Atlas (Recommended)
**Get Connection String**: [MongoDB Atlas](https://cloud.mongodb.com/)
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/echotune
```

#### Option B: PostgreSQL/Supabase
**Get Connection String**: [Supabase](https://supabase.com/dashboard)
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/echotune
```

## 🧪 Test Your Configuration

After adding API keys, test them:

### Test All Services
```bash
npm run validate:api-keys
```

### Test Specific Services
```bash
npm run validate:spotify     # Test Spotify API
npm run validate:openai      # Test OpenAI API
npm run validate:mongodb     # Test MongoDB connection
npm run validate:security    # Test security configuration
npm run validate:mcp-server  # Test MCP server
```

**Expected Output for Working Configuration:**
```
✅ [14:30:25] ✅ spotify - VALID (213ms)
✅ [14:30:26] ✅ openai - VALID (156ms)
✅ [14:30:26] ✅ security - SECURE (2ms)
✅ [14:30:27] ✅ mongodb - VALID (441ms)

📊 VALIDATION SUMMARY
Overall Status: EXCELLENT
Configuration Complete: ✅ YES
Total Services Tested: 18
✅ Valid/Configured: 15
❌ Failed: 0
⚠️ Not Configured: 3
```

## 📚 Advanced Configuration

### Optional But Recommended Services

#### GitHub Integration (For MCP automation)
**Get Token**: [GitHub Personal Access Tokens](https://github.com/settings/tokens)
```bash
GITHUB_PAT=ghp_your_github_personal_access_token
```

#### Redis Caching (For performance)
**Get Redis URL**: [Redis Cloud](https://redis.com/redis-enterprise-cloud/)
```bash
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password
```

#### Multiple LLM Providers (For redundancy)
```bash
# Add multiple providers for fallback
GEMINI_API_KEY=your_gemini_key
ANTHROPIC_API_KEY=sk-ant-your_claude_key
OPENROUTER_API_KEY=sk-or-your_openrouter_key
```

## 🔧 Configuration Management Commands

### Available NPM Scripts

```bash
# Configuration Management
npm run config:report        # Show configuration analysis
npm run config:add-missing   # Add all missing keys
npm run config:interactive   # Interactive configuration
npm run config:dry-run       # Preview changes without applying

# API Key Validation
npm run validate:api-keys    # Test all API keys
npm run validate:spotify     # Test Spotify API
npm run validate:openai      # Test OpenAI API
npm run validate:gemini      # Test Gemini API
npm run validate:mongodb     # Test MongoDB connection
npm run validate:mcp-server  # Test MCP server
npm run validate:security    # Test security configuration
npm run validate:ssl         # Test SSL configuration
npm run validate:docker      # Test Docker configuration

# System Validation
npm run validate:comprehensive # Complete system validation
npm run automate:all          # Run all MCP automation
```

## 🚨 Troubleshooting

### Common Issues

#### "Configuration completeness: 0%"
**Problem**: No configuration keys from the missing list are present
**Solution**: Run `npm run config:add-missing` to add all missing keys

#### "Spotify Authentication Failed"
**Problem**: Invalid Spotify credentials or redirect URI
**Solution**: 
1. Verify Client ID and Secret are correct
2. Check Redirect URI matches exactly in Spotify dashboard
3. Test with: `npm run validate:spotify`

#### "OpenAI API Error"  
**Problem**: Invalid API key or insufficient credits
**Solution**:
1. Verify API key starts with `sk-`
2. Check account has available credits
3. Test with: `npm run validate:openai`

#### "MCP Server Timeout"
**Problem**: MCP server not running
**Solution**:
1. Start MCP server: `npm run mcp-server`
2. Test connection: `npm run validate:mcp-server`

### Getting Help

1. **Check validation reports**: All tools generate detailed JSON and Markdown reports
2. **Review the comprehensive guide**: See `API_SECRETS_CONFIGURATION_GUIDE.md`
3. **Test incrementally**: Add and test keys one service at a time

## 🎯 Quick Start Checklist

- [ ] **Step 1**: Check current status with `npm run config:report`
- [ ] **Step 2**: Add missing keys with `npm run config:add-missing`
- [ ] **Step 3**: Get Spotify API credentials and update `.env`
- [ ] **Step 4**: Get OpenAI or Gemini API key and update `.env`
- [ ] **Step 5**: Generate security secrets and update `.env`
- [ ] **Step 6**: Setup MongoDB or PostgreSQL and update `.env`
- [ ] **Step 7**: Test configuration with `npm run validate:api-keys`
- [ ] **Step 8**: Start the application with `npm start`

## 📊 Configuration Priorities

### 🔥 **Priority 1: Essential (Minimum Viable Product)**
- Spotify API credentials
- One LLM provider (OpenAI/Gemini)
- Security secrets
- Database connection

### ⚡ **Priority 2: Recommended (Production Ready)**
- Multiple LLM providers (fallback)
- Redis caching
- SSL certificates
- GitHub integration

### 🚀 **Priority 3: Advanced (Full Features)**
- External APIs (Brave, YouTube)
- Analytics platforms
- Monitoring tools
- Browser automation

---

**Next Steps**: After completing configuration, see the main [README.md](README.md) for deployment instructions and feature guides.

**Need Help?** Check the detailed [API_SECRETS_CONFIGURATION_GUIDE.md](API_SECRETS_CONFIGURATION_GUIDE.md) for comprehensive information about each service and API key.
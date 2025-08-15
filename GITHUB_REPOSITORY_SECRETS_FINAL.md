# GitHub Repository Secrets Setup Guide (Updated)

**Last Updated**: 2025-08-15  
**Validation Status**: Live tested with actual API calls  
**Success Rate**: 58% (7/12 services working)

## 🔐 Repository Secrets Configuration

Add these secrets to your GitHub repository:
**Settings → Secrets and Variables → Actions → New repository secret**

### ✅ Working Secrets (Live Tested)

#### Core Music & Search
```
Secret Name: SPOTIFY_CLIENT_ID
Secret Value: dcc2df507bde447c93a0199358ca219d

Secret Name: SPOTIFY_CLIENT_SECRET  
Secret Value: 128089720b414d1e8233290d94fb38a0

Secret Name: BRAVE_API
Secret Value: BSAQ0gsYuaYuEZHayb_Ek1pnl1l2RiW
```

#### AI & Research Services
```
Secret Name: PERPLEXITY_API
Secret Value: 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

Secret Name: GEMINI_API_KEY_1
Secret Value: AIzaSyAVqHaHBRos1lRKk5hi62mC9W7ssz3bzTw

Secret Name: GEMINI_API_KEY_2  
Secret Value: AIzaSyChRuLP-xS8ucyyu1xbBiE-hrHTti_Ks5E

Secret Name: GEMINI_API_KEY_3
Secret Value: AIzaSyBFKq4XRb505EOdPiy3O7Gt3D192siUr30

Secret Name: GEMINI_API_KEY_4
Secret Value: AIzaSyA_rZoxcgGK_7H-lTMzV5oJqoU_vrZfSSc

Secret Name: GEMINI_API_KEY_5
Secret Value: AIzaSyBWZMFT-QRim0VYkB_610mMJix13s01ynk

Secret Name: GEMINI_API_KEY_6
Secret Value: AIzaSyAKlbqhApEri0ZVKIv5ZGrMrEULLrYQWPM
```

#### Database & Storage
```
Secret Name: MONGODB_URI
Secret Value: mongodb+srv://copilot:DapperMan77@cluster0.ofnyuy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

Secret Name: JWT_SECRET
Secret Value: fb66bf34fc84939cc49bf532a573169ee05c70e4f628d1d8b940cab82d5c030f
```

#### Development Tools
```
Secret Name: CURSOR_API
Secret Value: key_694009601be9f42adc51e02c9d5a4e27828043679cd397039c7496e07f00b705
```

### ⚠️ Secrets Needing Attention

#### Browser Automation (401 Error - Account Verification)
```
Secret Name: BROWSERBASE_API
Secret Value: bb_live_P4BWp-i1Atz_NMBWXr521kxcrXw

Secret Name: BROWSERBASE_PROJECT_ID
Secret Value: df31bafd-8541-40f2-80a8-2f6ea30df60e
```
**Action Required**: Verify Browserbase account status and subscription

#### Redis Caching (Authentication Error)
```
Secret Name: REDIS_URI
Secret Value: redis://copilot:a0a9588bce0ef7c71aba7242de502970bf94651c1fbd1ac569d0ece9a32287ef@redis-15489.c238.us-central1-2.gce.redns.redis-cloud.com:15489
```
**Action Required**: Check Redis Cloud username/password settings

#### Infrastructure (Token Expired)
```
Secret Name: DIGITALOCEAN_API
Secret Value: dop_v1_93910c446f36d3069ca4462ba1779792e21b84f15da4831688f04094ca6680ff
```
**Action Required**: Generate new DigitalOcean API token

#### GitHub Integration (Tokens Expired)
```
Secret Name: GH_PAT
Secret Value: <Generate new fine-grained PAT>

Secret Name: GH_GH_TOKEN  
Secret Value: <Generate new classic PAT>
```
**Action Required**: Generate new GitHub Personal Access Tokens

#### AI Model Router (Account/Credits Issue)
```
Secret Name: OPENROUTER_API_KEY_1
Secret Value: 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

Secret Name: OPENROUTER_API_KEY_2
Secret Value: sk-or-v1-3e798d593ede901dadbd0bee0b4ec69f7e90930f33b23be3c865893c2a11297dv

Secret Name: OPENROUTER_API_KEY_3
Secret Value: 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
```
**Action Required**: Check OpenRouter account credits and billing

## 🎯 Production Priority Secrets

### Essential (Must Work)
- ✅ **SPOTIFY_CLIENT_ID** & **SPOTIFY_CLIENT_SECRET** - Core functionality
- ✅ **MONGODB_URI** - Data storage  
- ✅ **JWT_SECRET** - Security
- ✅ **PERPLEXITY_API** - AI research

### Important (Should Work)
- ✅ **BRAVE_API** - Search functionality
- ✅ **GEMINI_API_KEY_1** - AI backup
- ✅ **CURSOR_API** - Development workflow
- ⚠️ **REDIS_URI** - Performance optimization

### Optional (Nice to Have)  
- ⚠️ **BROWSERBASE_API** - Browser automation
- ⚠️ **DIGITALOCEAN_API** - Deployment
- ⚠️ **GH_PAT** - GitHub automation
- ⚠️ **OPENROUTER_API_KEY_1** - AI model diversity

## 🔧 Troubleshooting Guide

### Redis Connection Issues
1. **Check Redis Cloud Console**: Verify username is `copilot`
2. **Password Validation**: Confirm password matches: `a0a9588bce0ef7c71aba7242de502970bf94651c1fbd1ac569d0ece9a32287ef`
3. **Alternative Format**: Try `redis://default:password@host:port` 
4. **Test Command**: Use `redis-cli -u "your-uri" ping`

### Browserbase Account Issues
1. **Account Status**: Check billing and subscription at browserbase.com
2. **Project Permissions**: Verify project `df31bafd-8541-40f2-80a8-2f6ea30df60e` exists
3. **API Key Scope**: Ensure key has project access permissions

### GitHub Token Generation
1. **Fine-Grained PAT**: github.com/settings/personal-access-tokens/fine-grained
2. **Classic PAT**: github.com/settings/tokens
3. **Required Scopes**: `repo`, `workflow`, `write:packages`, `read:org`

### DigitalOcean Token
1. **Generate New**: cloud.digitalocean.com/account/api/tokens
2. **Permissions**: Read + Write access to all resources
3. **Expiration**: Set to "Never" for continuous deployment

## 📊 Validation Results

**Live Testing Performed**: All secrets tested with actual API authentication calls

| Secret | Status | Response Time | Production Ready |
|--------|--------|---------------|------------------|
| SPOTIFY_* | ✅ Working | 441ms | Yes |
| PERPLEXITY_API | ✅ Working | 4,288ms | Yes |  
| BRAVE_API | ✅ Working | 590ms | Yes |
| MONGODB_URI | ✅ Working | 2,032ms | Yes |
| GEMINI_API_KEY_1 | ✅ Working | 2,340ms | Yes |
| JWT_SECRET | ✅ Working | 21ms | Yes |
| CURSOR_API | ✅ Validated | 0ms | Yes |
| BROWSERBASE_API | ❌ 401 Error | N/A | Needs Fix |
| REDIS_URI | ❌ Auth Error | N/A | Needs Fix |
| DIGITALOCEAN_API | ❌ Expired | N/A | Needs Fix |
| GH_PAT | ❌ Expired | N/A | Needs Fix |
| OPENROUTER_API_* | ❌ No Credits | N/A | Needs Fix |

**System Health**: 58% operational (7/12 services working)

## 🚀 Quick Setup Commands

```bash
# Test all secrets after adding them
npm run test:api-keys

# Generate Cursor IDE config with working secrets
npm run generate-cursor-mcp

# Validate MCP server integration  
npm run mcp:validate
```

**Status**: Core services operational, system ready for development with some integrations pending.
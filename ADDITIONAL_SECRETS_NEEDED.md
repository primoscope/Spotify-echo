# Additional Secrets Needed - Action Required

**Based on live API testing results (50% success rate)**

## ⚠️ Immediate Action Required

### 1. **REDIS_URI** - Password Encoding Issue
**Current**: `redis://copilot:DapperMan77$$@redis-15489.c238.us-central1-2.gce.redns.redis-cloud.com:15489`  
**Fixed**: `redis://copilot:DapperMan77%24%24@redis-15489.c238.us-central1-2.gce.redns.redis-cloud.com:15489`

**Action**: Update repository secret `REDIS_URI` with URL-encoded password

### 2. **GITHUB_TOKEN** - Expired/Invalid
**Issue**: 401 Unauthorized  
**Action**: 
1. Go to https://github.com/settings/tokens
2. Generate new Personal Access Token
3. Grant scopes: `repo`, `workflow`, `read:org`, `read:user`
4. Update repository secret `GITHUB_TOKEN`

### 3. **DIGITALOCEAN_TOKEN** - Invalid/Expired
**Issue**: 401 Unauthorized  
**Action**:
1. Go to https://cloud.digitalocean.com/account/api/tokens
2. Generate new API token
3. Update repository secret `DIGITALOCEAN_TOKEN`

### 4. **BROWSERBASE_API_KEY** - Account Issue
**Issue**: 401 Unauthorized  
**Action**:
1. Log into Browserbase dashboard
2. Check account status and subscription
3. Generate new API key if needed
4. Add `BROWSERBASE_PROJECT_ID` secret (required)

### 5. **GEMINI_API_KEY** - Invalid Key
**Issue**: API key not valid  
**Action**:
1. Go to https://aistudio.google.com
2. Generate new API key
3. Update repository secret `GEMINI_API_KEY`

### 6. **OPENROUTER_API_KEY** - Expired/Credits
**Issue**: 401 Unauthorized  
**Action**:
1. Log into https://openrouter.ai/account
2. Check credits and account status
3. Generate new API key if needed
4. Update repository secret `OPENROUTER_API_KEY`

## ✅ Working Services (No Action Needed)

- **SPOTIFY_CLIENT_ID** & **SPOTIFY_CLIENT_SECRET** ✅
- **PERPLEXITY_API_KEY** ✅  
- **BRAVE_API_KEY** ✅
- **CURSOR_API_KEY** ✅
- **MONGODB_URI** ✅
- **JWT_SECRET** ✅

## 🔧 Additional Secrets to Add

```bash
# Generate these new secrets
SESSION_SECRET=[Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"]
BROWSERBASE_PROJECT_ID=[From Browserbase dashboard when account is fixed]

# Optional but recommended
SENTRY_DSN=[For error tracking - get from sentry.io]
OPENAI_API_KEY=[For AI fallback - get from openai.com]
```

## 🎯 Priority Order

1. **High Priority**: REDIS_URI fix (performance caching)
2. **Medium Priority**: GITHUB_TOKEN (development workflows)  
3. **Medium Priority**: DIGITALOCEAN_TOKEN (deployment)
4. **Low Priority**: AI services (Gemini, OpenRouter) - optional
5. **Low Priority**: BROWSERBASE - enhanced testing only

## 🧪 Test Command

After fixing secrets, run:
```bash
npm run validate:api-comprehensive
```

Expected result: Success rate should increase from 50% to 80%+ when fixes applied.
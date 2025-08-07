# 🔧 DigitalOcean Token Troubleshooting Guide

## 🚨 Current Issue Status

**Both provided DigitalOcean API tokens are returning 401 Unauthorized errors:**

```
Primary Token (Full scope): dop_v1_2a14cbf62df8a24bfd0ed6094e0bdf775999188d1f11324be47c39a308282238
Fallback Token (Full access): dop_v1_9359807c1cd4103b5c92b21971a51d5364dc300d195ae5046639f3b0cd3dbe16
```

**Error Message:** `Unable to authenticate you` - HTTP 401

## 🔍 Troubleshooting Steps

### Step 1: Verify Token Status
Visit your DigitalOcean dashboard to check token status:
1. Go to: https://cloud.digitalocean.com/account/api/tokens
2. Check if both tokens are listed and active
3. Verify expiration dates and permissions

### Step 2: Required Token Permissions

**For DigitalOcean Container Registry and API access, your token MUST have these permissions:**

- ✅ **Full Access** (recommended for development)
- ✅ **Read/Write** access to:
  - Container Registry
  - App Platform 
  - Droplets
  - Kubernetes
  - Spaces

### Step 3: Generate New Token

If tokens are expired or invalid:

1. **Delete existing tokens** in the DigitalOcean dashboard
2. **Create new token** with these settings:
   - **Name**: `EchoTune-AI-Dev-$(date +%Y%m%d)`
   - **Permission**: **Full Access** 
   - **Expiration**: 90 days (or No expiry for development)
3. **Copy the token immediately** (it won't be shown again)

### Step 4: OAuth App Configuration

Verify your OAuth app is properly configured:

1. Go to: https://cloud.digitalocean.com/account/api/applications
2. Check callback URLs are set to:
   - `http://localhost:3000/callback`
   - `http://159.223.207.187:3000/`

### Step 5: Container Registry Authentication

For Docker registry access, you need:

1. **A valid API token** (generated above)
2. **Container registry credentials** via:
   ```bash
   # Option 1: Generate via doctl
   doctl registry docker-config
   
   # Option 2: Use API token directly
   echo "YOUR_API_TOKEN" | docker login registry.digitalocean.com --username YOUR_EMAIL --password-stdin
   ```

## 🛠️ Testing Your New Token

Once you have a new token:

### Quick API Test
```bash
# Replace YOUR_TOKEN with your actual token
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.digitalocean.com/v2/account
```

**Expected Response:** Account information (not 401 error)

### Test with EchoTune AI Tools
```bash
# Update .env with new token
echo "DIGITALOCEAN_TOKEN=YOUR_NEW_TOKEN" >> .env

# Run comprehensive testing
npm run do:enhanced-test
npm run test:servers
```

## 📋 Common Issues & Solutions

### Issue 1: "Token has insufficient scope"
**Solution:** Regenerate token with **Full Access** permissions

### Issue 2: "Token not found" 
**Solution:** Token may have been deleted. Generate a new one.

### Issue 3: "Rate limit exceeded"
**Solution:** Wait 1 hour or use a different token

### Issue 4: "Authentication required" for registry
**Solution:** 
- Ensure API token has Container Registry permissions
- Use `doctl registry docker-config` to generate registry credentials
- Verify email matches your DO account

## 🔒 Security Best Practices

1. **Never commit tokens** to repositories
2. **Use environment variables** for token storage
3. **Set reasonable expiration dates** (30-90 days)
4. **Rotate tokens regularly** for production use
5. **Use minimal required permissions** for specific tasks

## 📞 Need Help?

If tokens are still failing after following this guide:

1. **Check DigitalOcean Status**: https://status.digitalocean.com/
2. **Verify account standing**: Ensure billing is current
3. **Contact DigitalOcean Support**: If issues persist
4. **Test with curl**: Verify API access outside of tools

## ✅ Success Indicators

You'll know everything is working when:

- ✅ `npm run do:enhanced-test` shows 6+ passed tests
- ✅ `npm run test:servers` shows 12+ passed tests  
- ✅ doctl commands work without authentication errors
- ✅ Docker can login to `registry.digitalocean.com`

## 🔗 Useful Links

- **API Tokens**: https://cloud.digitalocean.com/account/api/tokens
- **OAuth Apps**: https://cloud.digitalocean.com/account/api/applications  
- **Container Registry**: https://cloud.digitalocean.com/container_registry
- **API Documentation**: https://docs.digitalocean.com/reference/api/
- **doctl Documentation**: https://docs.digitalocean.com/reference/doctl/
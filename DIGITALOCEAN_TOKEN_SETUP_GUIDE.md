
# 🔐 DigitalOcean Token Generation Instructions

## Step 1: Access DigitalOcean Control Panel
1. Go to https://cloud.digitalocean.com/
2. Log in to your DigitalOcean account

## Step 2: Navigate to API Tokens
1. Click on "API" in the left sidebar
2. Or go directly to: https://cloud.digitalocean.com/account/api/tokens

## Step 3: Create New Token
1. Click "Generate New Token"
2. **Name:** EchoTune AI Deployment Token
3. **Scopes:** Select ALL permissions:
   ✅ Read (required)
   ✅ Write (required for deployments)

## Step 4: Copy and Secure Token
1. **IMMEDIATELY** copy the token (you won't see it again)
2. Token format: `dop_v1_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
3. Store securely - treat like a password

## Step 5: Update Environment Configuration
Add to your .env file:
```env
DO_ACCESS_TOKEN=dop_v1_your_actual_token_here
DO_REGISTRY_TOKEN=dop_v1_your_actual_token_here  # Same token works for registry
```

## Step 6: Test Token
Run this command to verify:
```bash
npm run validate:digitalocean
# OR
node scripts/digitalocean-auth-fixer.js --test
```

## Troubleshooting Common Issues

### 🚨 401 Unauthorized Error
- **Cause:** Invalid, expired, or insufficient permissions
- **Solution:** Generate new token with FULL permissions

### 🚨 Token Format Issues
- **Correct:** `dop_v1_1234567890abcdef...` (71 characters)
- **Incorrect:** Missing `dop_v1_` prefix or wrong length

### 🚨 Registry Authentication
- For container registry, same token works
- Username: Your DigitalOcean email
- Password: Your DO access token

## Security Best Practices

1. **Never commit tokens** to Git repositories
2. **Use environment variables** only
3. **Rotate tokens regularly** (every 90 days)
4. **Monitor token usage** in DO dashboard
5. **Revoke unused tokens** immediately

## Additional Resources
- [DigitalOcean API Documentation](https://docs.digitalocean.com/reference/api/)
- [Container Registry Guide](https://docs.digitalocean.com/products/container-registry/)

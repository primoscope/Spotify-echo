#!/usr/bin/env node
/**
 * DigitalOcean Token Authentication Fixer
 * 
 * This script addresses the 401 Unauthorized token issue by:
 * 1. Validating token format and accessibility
 * 2. Testing authentication with DigitalOcean API
 * 3. Providing clear instructions for token generation
 * 4. Offering automated token testing and verification
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class DigitalOceanAuthFixer {
  constructor() {
    this.tokens = {
      current: null,
      registry: null,
      apiKey: null
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
      'info': '🔍',
      'success': '✅',
      'warning': '⚠️',
      'error': '❌',
      'action': '🚀'
    }[type] || '📋';
    
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  loadTokensFromEnv() {
    this.log('Loading DigitalOcean tokens from environment...', 'action');
    
    // Try to load from .env file
    const envFiles = ['.env', '.env.example', '.env.production.example'];
    
    for (const envFile of envFiles) {
      if (fs.existsSync(envFile)) {
        const content = fs.readFileSync(envFile, 'utf8');
        
        // Extract DO tokens
        const doTokenMatch = content.match(/DO_ACCESS_TOKEN=([^\s\n]+)/);
        const registryTokenMatch = content.match(/DO_REGISTRY_TOKEN=([^\s\n]+)/);
        
        if (doTokenMatch && doTokenMatch[1] && !doTokenMatch[1].includes('your_')) {
          this.tokens.current = doTokenMatch[1];
        }
        
        if (registryTokenMatch && registryTokenMatch[1] && !registryTokenMatch[1].includes('your_')) {
          this.tokens.registry = registryTokenMatch[1];
        }
      }
    }

    // Also check environment variables
    if (process.env.DO_ACCESS_TOKEN && !process.env.DO_ACCESS_TOKEN.includes('your_')) {
      this.tokens.current = process.env.DO_ACCESS_TOKEN;
    }
    
    this.log(`Found tokens: API=${!!this.tokens.current}, Registry=${!!this.tokens.registry}`, 'info');
  }

  validateTokenFormat(token) {
    if (!token) return { valid: false, reason: 'Token is empty or null' };
    
    // DigitalOcean tokens should start with dop_v1_ and be hex characters
    if (!token.startsWith('dop_v1_')) {
      return { valid: false, reason: 'Token does not start with dop_v1_' };
    }
    
    if (token.length !== 71) { // dop_v1_ (7) + 64 hex chars
      return { valid: false, reason: `Token length is ${token.length}, expected 71` };
    }
    
    const tokenPart = token.substring(7);
    if (!/^[a-f0-9]{64}$/.test(tokenPart)) {
      return { valid: false, reason: 'Token contains invalid characters (should be hex)' };
    }
    
    return { valid: true };
  }

  async testTokenAuthentication(token) {
    if (!token) return { success: false, error: 'No token provided' };
    
    try {
      this.log('Testing token authentication with DigitalOcean API...', 'action');
      
      // Test account info endpoint
      const result = execSync(`curl -X GET -H "Authorization: Bearer ${token}" -H "Content-Type: application/json" "https://api.digitalocean.com/v2/account" 2>/dev/null`, {
        encoding: 'utf8',
        timeout: 10000
      });
      
      const response = JSON.parse(result);
      
      if (response.account) {
        this.log('✅ Token authentication successful', 'success');
        return { 
          success: true, 
          account: response.account,
          email: response.account.email,
          status: response.account.status
        };
      } else if (response.id === 'unauthorized') {
        return { 
          success: false, 
          error: 'Token is invalid or expired',
          id: response.id,
          message: response.message
        };
      }
      
      return { success: false, error: 'Unexpected response format' };
      
    } catch (error) {
      this.log(`API test failed: ${error.message}`, 'error');
      
      if (error.message.includes('401')) {
        return { 
          success: false, 
          error: '401 Unauthorized - Token is invalid, expired, or lacks permissions',
          suggestion: 'Generate a new token with full permissions'
        };
      }
      
      return { 
        success: false, 
        error: error.message,
        suggestion: 'Check network connectivity and token format'
      };
    }
  }

  generateTokenInstructions() {
    const instructions = `
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
2. Token format: \`dop_v1_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\`
3. Store securely - treat like a password

## Step 5: Update Environment Configuration
Add to your .env file:
\`\`\`env
DO_ACCESS_TOKEN=dop_v1_your_actual_token_here
DO_REGISTRY_TOKEN=dop_v1_your_actual_token_here  # Same token works for registry
\`\`\`

## Step 6: Test Token
Run this command to verify:
\`\`\`bash
npm run validate:digitalocean
# OR
node scripts/digitalocean-auth-fixer.js --test
\`\`\`

## Troubleshooting Common Issues

### 🚨 401 Unauthorized Error
- **Cause:** Invalid, expired, or insufficient permissions
- **Solution:** Generate new token with FULL permissions

### 🚨 Token Format Issues
- **Correct:** \`dop_v1_1234567890abcdef...\` (71 characters)
- **Incorrect:** Missing \`dop_v1_\` prefix or wrong length

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
`;

    fs.writeFileSync('DIGITALOCEAN_TOKEN_SETUP_GUIDE.md', instructions);
    this.log('Token setup guide created: DIGITALOCEAN_TOKEN_SETUP_GUIDE.md', 'success');
  }

  async diagnoseAndFix() {
    this.log('🔍 DigitalOcean Authentication Diagnostic', 'action');
    
    // Step 1: Load tokens
    this.loadTokensFromEnv();
    
    // Step 2: Validate token format
    if (this.tokens.current) {
      const validation = this.validateTokenFormat(this.tokens.current);
      
      if (validation.valid) {
        this.log('Token format validation: PASSED', 'success');
        
        // Step 3: Test authentication
        const authTest = await this.testTokenAuthentication(this.tokens.current);
        
        if (authTest.success) {
          this.log(`Authentication successful for account: ${authTest.email}`, 'success');
          this.log(`Account status: ${authTest.status}`, 'info');
          
          return { 
            status: 'success',
            message: 'DigitalOcean authentication is working correctly',
            account: authTest.account
          };
        } else {
          this.log(`Authentication failed: ${authTest.error}`, 'error');
          if (authTest.suggestion) {
            this.log(`Suggestion: ${authTest.suggestion}`, 'warning');
          }
        }
      } else {
        this.log(`Token format validation: FAILED - ${validation.reason}`, 'error');
      }
    } else {
      this.log('No DigitalOcean token found in environment', 'warning');
    }
    
    // Step 4: Generate instructions
    this.log('Generating setup instructions...', 'action');
    this.generateTokenInstructions();
    
    // Step 5: Provide actionable steps
    this.log('🔧 REQUIRED ACTIONS:', 'warning');
    this.log('1. Generate new DigitalOcean token with FULL permissions', 'action');
    this.log('2. Update DO_ACCESS_TOKEN in .env file', 'action');
    this.log('3. Test token with: node scripts/digitalocean-auth-fixer.js --test', 'action');
    this.log('4. Read setup guide: DIGITALOCEAN_TOKEN_SETUP_GUIDE.md', 'action');
    
    return {
      status: 'needs_attention',
      message: 'DigitalOcean token requires manual setup',
      instructions: 'DIGITALOCEAN_TOKEN_SETUP_GUIDE.md'
    };
  }
}

// CLI Interface
if (require.main === module) {
  const fixer = new DigitalOceanAuthFixer();
  
  if (process.argv.includes('--test')) {
    fixer.loadTokensFromEnv();
    if (fixer.tokens.current) {
      fixer.testTokenAuthentication(fixer.tokens.current)
        .then(result => {
          if (result.success) {
            console.log('✅ DigitalOcean authentication is working');
            process.exit(0);
          } else {
            console.log('❌ DigitalOcean authentication failed');
            console.log('Error:', result.error);
            process.exit(1);
          }
        });
    } else {
      console.log('❌ No DigitalOcean token found');
      process.exit(1);
    }
  } else {
    fixer.diagnoseAndFix()
      .then(result => {
        console.log(`Status: ${result.status}`);
        console.log(`Message: ${result.message}`);
        process.exit(result.status === 'success' ? 0 : 1);
      });
  }
}

module.exports = DigitalOceanAuthFixer;
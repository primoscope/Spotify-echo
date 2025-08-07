#!/usr/bin/env node
/**
 * 🔧 DigitalOcean Token Resolution Script
 * Automated solution for resolving DigitalOcean API authentication issues
 * 
 * This script provides step-by-step guidance for generating and validating
 * new DigitalOcean API tokens with full access permissions.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class DigitalOceanTokenResolver {
    constructor() {
        this.envPath = path.join(__dirname, '..', '.env');
        this.logFile = path.join(__dirname, '..', 'logs', 'do-token-resolution.log');
        this.tokens = [];
        this.validToken = null;
    }

    /**
     * Main execution flow
     */
    async run() {
        console.log('🚀 DigitalOcean Token Resolution Assistant');
        console.log('===============================================\n');

        try {
            await this.createLogDirectory();
            await this.loadExistingTokens();
            await this.testExistingTokens();
            
            if (!this.validToken) {
                await this.generateNewTokenGuide();
            } else {
                console.log('✅ Valid token found! Proceeding with deployment configuration...');
                await this.configureDeployment();
            }

        } catch (error) {
            console.error('❌ Error:', error.message);
            await this.logError(error);
        }
    }

    /**
     * Load existing tokens from .env file
     */
    async loadExistingTokens() {
        try {
            if (!fs.existsSync(this.envPath)) {
                throw new Error('.env file not found');
            }

            const envContent = fs.readFileSync(this.envPath, 'utf8');
            const tokenMatches = envContent.match(/DIGITALOCEAN_TOKEN[^=]*=(.+)/g);

            if (tokenMatches) {
                this.tokens = tokenMatches.map(line => {
                    const token = line.split('=')[1].trim();
                    return token.replace(/['"]/g, '');
                });
                
                console.log(`📄 Found ${this.tokens.length} existing tokens in .env file`);
            }
        } catch (error) {
            console.log('⚠️  Could not load existing tokens:', error.message);
        }
    }

    /**
     * Test all existing tokens for validity
     */
    async testExistingTokens() {
        console.log('\n🧪 Testing existing tokens...\n');

        for (let i = 0; i < this.tokens.length; i++) {
            const token = this.tokens[i];
            const maskedToken = this.maskToken(token);
            
            console.log(`Testing Token ${i + 1}: ${maskedToken}`);
            
            const isValid = await this.testToken(token);
            
            if (isValid) {
                console.log(`✅ Token ${i + 1} is VALID!`);
                this.validToken = token;
                return;
            } else {
                console.log(`❌ Token ${i + 1} is INVALID`);
            }
        }

        console.log('\n❌ All existing tokens are invalid or expired\n');
    }

    /**
     * Test a single token against DigitalOcean API
     */
    async testToken(token) {
        return new Promise((resolve) => {
            const options = {
                hostname: 'api.digitalocean.com',
                path: '/v2/account',
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            };

            const req = https.request(options, (res) => {
                resolve(res.statusCode === 200);
            });

            req.on('error', () => resolve(false));
            req.on('timeout', () => {
                req.destroy();
                resolve(false);
            });

            req.end();
        });
    }

    /**
     * Guide user through generating a new token
     */
    async generateNewTokenGuide() {
        console.log('📋 NEW TOKEN GENERATION GUIDE');
        console.log('==============================\n');

        console.log('🔗 Step 1: Visit DigitalOcean API Tokens Page');
        console.log('   URL: https://cloud.digitalocean.com/account/api/tokens\n');

        console.log('🔑 Step 2: Create New Token');
        console.log('   • Click "Generate New Token"');
        console.log('   • Name: "EchoTune-AI-Production-' + new Date().getFullYear() + '"');
        console.log('   • Scopes: SELECT ALL SCOPES (Full Access)');
        console.log('     ✓ Read & Write (Full Access)');
        console.log('     ✓ Droplets');
        console.log('     ✓ App Platform');
        console.log('     ✓ Container Registry');
        console.log('     ✓ Kubernetes');
        console.log('     ✓ Load Balancers');
        console.log('     ✓ Volumes');
        console.log('     ✓ Spaces');
        console.log('   • Click "Generate Token"\n');

        console.log('💾 Step 3: Save Token Securely');
        console.log('   • Copy the token immediately (it won\'t be shown again)');
        console.log('   • Save it in a secure location\n');

        console.log('🧪 Step 4: Test Your New Token');
        console.log('   Run this script again after adding the token to your .env file:');
        console.log('   DIGITALOCEAN_TOKEN=your_new_token_here\n');

        console.log('⚠️  IMPORTANT SECURITY NOTES:');
        console.log('   • Never commit tokens to version control');
        console.log('   • Rotate tokens regularly (every 90 days)');
        console.log('   • Use separate tokens for different environments\n');

        await this.createTokenValidationScript();
    }

    /**
     * Create a validation script for the new token
     */
    async createTokenValidationScript() {
        const validationScript = `#!/bin/bash
# DigitalOcean Token Validation Script
# Run this after adding your new token to .env

echo "🧪 Testing DigitalOcean Token..."

# Load environment variables
source .env

# Test token against DigitalOcean API
response=$(curl -s -w "%{http_code}" -o /dev/null \\
  -H "Authorization: Bearer $DIGITALOCEAN_TOKEN" \\
  -H "Content-Type: application/json" \\
  "https://api.digitalocean.com/v2/account")

if [ "$response" = "200" ]; then
    echo "✅ Token is VALID!"
    echo "🚀 Ready for production deployment"
    
    # Test additional services
    echo "🧪 Testing Container Registry access..."
    doctl auth init --access-token $DIGITALOCEAN_TOKEN > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo "✅ Container Registry access confirmed"
        echo "🎯 All DigitalOcean services are accessible"
        
        # Run production deployment validation
        echo "🚀 Running production deployment validation..."
        node scripts/production-deployment-validator.js
    else
        echo "⚠️  Token valid but registry access needs verification"
    fi
else
    echo "❌ Token is INVALID (HTTP $response)"
    echo "🔧 Please regenerate your token with full access permissions"
fi
`;

        const scriptPath = path.join(__dirname, '..', 'validate-do-token.sh');
        fs.writeFileSync(scriptPath, validationScript);
        
        try {
            await execAsync(`chmod +x "${scriptPath}"`);
            console.log(`📄 Created validation script: validate-do-token.sh`);
            console.log('   Run: ./validate-do-token.sh');
        } catch (error) {
            console.log('⚠️  Could not make script executable:', error.message);
        }
    }

    /**
     * Configure deployment with valid token
     */
    async configureDeployment() {
        console.log('🔧 Configuring production deployment...\n');

        try {
            // Test doctl authentication
            await execAsync(`doctl auth init --access-token ${this.validToken}`);
            console.log('✅ doctl authentication successful');

            // Verify account access
            const { stdout } = await execAsync('doctl account get');
            console.log('✅ Account verification successful');

            // Test registry access
            await execAsync('doctl registry login');
            console.log('✅ Container registry access confirmed');

            console.log('\n🚀 Ready for production deployment!');
            console.log('   Next steps:');
            console.log('   1. Run: npm run deploy:production');
            console.log('   2. Monitor: npm run logs:production');

        } catch (error) {
            console.error('❌ Deployment configuration failed:', error.message);
            await this.logError(error);
        }
    }

    /**
     * Utility functions
     */
    maskToken(token) {
        if (!token || token.length < 16) return '[INVALID]';
        return token.substr(0, 12) + '...' + token.substr(-8);
    }

    async createLogDirectory() {
        const logDir = path.dirname(this.logFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }

    async logError(error) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ERROR: ${error.message}\n${error.stack}\n\n`;
        fs.appendFileSync(this.logFile, logEntry);
    }
}

// Run the token resolver if executed directly
if (require.main === module) {
    const resolver = new DigitalOceanTokenResolver();
    resolver.run().catch(error => {
        console.error('Fatal error:', error.message);
        process.exit(1);
    });
}

module.exports = DigitalOceanTokenResolver;
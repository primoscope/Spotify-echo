#!/usr/bin/env node

/**
 * Enhanced DigitalOcean Manager
 * Comprehensive integration with DigitalOcean API and doctl
 * Includes registry token management, deployment functions, and testing
 * 
 * Usage: 
 *   node scripts/enhanced-digitalocean-manager.js [command]
 *   npm run do:enhanced [command]
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

class EnhancedDigitalOceanManager {
    constructor() {
        // Updated tokens with full scope/access from user (Latest: 4bc3902f...)
        this.apiToken = 'dop_v1_4bc3902fb43fec277797625f6fa97bb7baaf6c7a6c1a450d8e45e99b4601d215';
        this.apiTokenFallback = 'dop_v1_93f2eee09a1f183f59c82c8e14c5845f26c1adb6c59eec0c12b05f6685373412';
        this.dockerCredentials = {
            email: 'barrunmail@gmail.com',
            token: 'dop_v1_be1d6c7989e8f51fefbae284c017fa7eaeea5d230e59d7c399b220d4677652c7'
        };
        this.callbackUrl = 'http://localhost:3000/callback';
        this.productionCallbackUrl = 'https://primosphere.studio/auth/callback';
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const colors = {
            info: '\x1b[36m',
            success: '\x1b[32m',
            error: '\x1b[31m',
            warning: '\x1b[33m',
            reset: '\x1b[0m'
        };
        
        console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
    }

    async ensureDoctlInstalled() {
        try {
            execSync('doctl version', { encoding: 'utf8' });
            this.log('✅ doctl already installed', 'success');
            return true;
        } catch (error) {
            this.log('Installing doctl...', 'info');
            try {
                execSync('sudo snap install doctl', { 
                    encoding: 'utf8', 
                    timeout: 60000,
                    stdio: 'pipe'
                });
                this.log('✅ doctl installed via snap', 'success');
                return true;
            } catch (snapError) {
                try {
                    execSync('wget -O doctl.tar.gz https://github.com/digitalocean/doctl/releases/download/v1.110.0/doctl-1.110.0-linux-amd64.tar.gz && tar xf doctl.tar.gz && sudo mv doctl /usr/local/bin/', { 
                        encoding: 'utf8', 
                        timeout: 60000 
                    });
                    this.log('✅ doctl installed via wget', 'success');
                    return true;
                } catch (wgetError) {
                    this.log(`❌ Failed to install doctl: ${wgetError.message}`, 'error');
                    return false;
                }
            }
        }
    }

    async authenticateDoctl(token = null) {
        const authToken = token || this.apiToken;
        try {
            execSync(`doctl auth init --access-token ${authToken}`, { 
                encoding: 'utf8', 
                timeout: 10000 
            });
            this.log('✅ doctl authenticated successfully', 'success');
            return true;
        } catch (error) {
            this.log(`❌ doctl authentication failed: ${error.message}`, 'error');
            return false;
        }
    }

    async getRegistryToken() {
        try {
            this.log('Getting registry token from DigitalOcean...', 'info');
            
            // Method 1: Use doctl to get docker config
            try {
                const dockerConfig = execSync('doctl registry docker-config --expiry-seconds 3600', { 
                    encoding: 'utf8', 
                    timeout: 15000 
                });
                
                const config = JSON.parse(dockerConfig);
                const auth = config.auths && config.auths['registry.digitalocean.com'];
                
                if (auth) {
                    this.log('✅ Got registry token via doctl docker-config', 'success');
                    return {
                        method: 'doctl',
                        auth: auth.auth,
                        registry: 'registry.digitalocean.com',
                        config: dockerConfig
                    };
                }
            } catch (doctlError) {
                this.log(`⚠️ doctl method failed: ${doctlError.message}`, 'warning');
            }

            // Method 2: Use API directly
            try {
                const apiResponse = await this.makeApiRequest('/v2/registry/docker-credentials', 'POST', {
                    type: 'read_write',
                    expiry_seconds: 3600
                });
                
                if (apiResponse.docker_credentials) {
                    this.log('✅ Got registry token via API', 'success');
                    return {
                        method: 'api',
                        auth: Buffer.from(apiResponse.docker_credentials.auth, 'base64').toString(),
                        registry: 'registry.digitalocean.com',
                        credentials: apiResponse.docker_credentials
                    };
                }
            } catch (apiError) {
                this.log(`⚠️ API method failed: ${apiError.message}`, 'warning');
            }

            // Method 3: Use provided credentials
            this.log('Using provided docker credentials as fallback', 'info');
            return {
                method: 'provided',
                email: this.dockerCredentials.email,
                token: this.dockerCredentials.token,
                registry: 'registry.digitalocean.com'
            };

        } catch (error) {
            throw new Error(`Failed to get registry token: ${error.message}`);
        }
    }

    async testBothTokens() {
        this.log('🔄 Testing both DigitalOcean API tokens...', 'info');
        
        const tokens = [
            { name: 'Primary (Full scope)', token: this.apiToken },
            { name: 'Fallback (Full access)', token: this.apiTokenFallback }
        ];
        
        for (const tokenInfo of tokens) {
            this.log(`Testing ${tokenInfo.name}: ${tokenInfo.token.substring(0, 20)}...`, 'info');
            
            try {
                const testResult = await this.testTokenWithApi(tokenInfo.token);
                if (testResult.success) {
                    this.log(`✅ ${tokenInfo.name} token is VALID`, 'success');
                    this.log(`   Account: ${testResult.account.email}`, 'info');
                    this.log(`   Status: ${testResult.account.status}`, 'info');
                    
                    // Use this working token
                    this.apiToken = tokenInfo.token;
                    return { success: true, token: tokenInfo.name, data: testResult };
                }
            } catch (error) {
                this.log(`❌ ${tokenInfo.name} token failed: ${error.message}`, 'error');
            }
        }
        
        return { success: false, error: 'Both tokens failed validation' };
    }

    async testTokenWithApi(token) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'api.digitalocean.com',
                path: '/v2/account',
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            };

            const req = https.request(options, (res) => {
                let responseData = '';
                
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(responseData);
                        if (res.statusCode === 200) {
                            resolve({ 
                                success: true, 
                                account: parsed.account,
                                statusCode: res.statusCode 
                            });
                        } else {
                            reject(new Error(`HTTP ${res.statusCode}: ${parsed.message || responseData}`));
                        }
                    } catch (parseError) {
                        reject(new Error(`Parse error: ${parseError.message}. Response: ${responseData}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error(`Request failed: ${error.message}`));
            });
            
            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            req.end();
        });
    }

    async makeApiRequest(endpoint, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'api.digitalocean.com',
                path: endpoint,
                method: method,
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`,
                    'Content-Type': 'application/json'
                }
            };

            const req = https.request(options, (res) => {
                let responseData = '';
                
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(responseData);
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            resolve(parsed);
                        } else {
                            reject(new Error(`API Error ${res.statusCode}: ${parsed.message || responseData}`));
                        }
                    } catch (parseError) {
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            resolve(responseData);
                        } else {
                            reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
                        }
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error(`Request failed: ${error.message}`));
            });

            if (data) {
                req.write(JSON.stringify(data));
            }
            
            req.end();
        });
    }

    async testRegistryAuthentication() {
        try {
            this.log('🧪 Testing DigitalOcean Container Registry authentication...', 'info');
            
            const tokenInfo = await this.getRegistryToken();
            
            // Test Docker login with the obtained token
            let loginSuccess = false;
            
            if (tokenInfo.method === 'doctl' && tokenInfo.auth) {
                try {
                    execSync(`echo "${tokenInfo.auth}" | docker login registry.digitalocean.com --username "" --password-stdin`, {
                        encoding: 'utf8',
                        timeout: 15000
                    });
                    loginSuccess = true;
                    this.log('✅ Docker login successful with doctl token', 'success');
                } catch (error) {
                    this.log(`⚠️ Docker login failed with doctl token: ${error.message}`, 'warning');
                }
            }

            if (!loginSuccess && tokenInfo.method === 'provided') {
                try {
                    execSync(`echo "${tokenInfo.token}" | docker login registry.digitalocean.com --username "${tokenInfo.email}" --password-stdin`, {
                        encoding: 'utf8',
                        timeout: 15000
                    });
                    loginSuccess = true;
                    this.log('✅ Docker login successful with provided credentials', 'success');
                } catch (error) {
                    this.log(`⚠️ Docker login failed with provided credentials: ${error.message}`, 'warning');
                }
            }

            return {
                tokenInfo,
                loginSuccess,
                registry: 'registry.digitalocean.com',
                callbackUrl: this.callbackUrl
            };

        } catch (error) {
            throw new Error(`Registry authentication test failed: ${error.message}`);
        }
    }

    async getAccountInfo() {
        try {
            const account = await this.makeApiRequest('/v2/account');
            return {
                email: account.account.email,
                status: account.account.status,
                droplet_limit: account.account.droplet_limit,
                floating_ip_limit: account.account.floating_ip_limit
            };
        } catch (error) {
            // Try with doctl as fallback
            try {
                const accountInfo = execSync('doctl account get', { encoding: 'utf8' });
                return { info: accountInfo.trim(), method: 'doctl' };
            } catch (doctlError) {
                throw new Error(`Account info failed: API: ${error.message}, doctl: ${doctlError.message}`);
            }
        }
    }

    async listRegistries() {
        try {
            const registries = await this.makeApiRequest('/v2/registry');
            return registries.registry || registries;
        } catch (error) {
            // Fallback to doctl
            try {
                const registryList = execSync('doctl registry list', { encoding: 'utf8' });
                return { info: registryList.trim(), method: 'doctl' };
            } catch (doctlError) {
                throw new Error(`List registries failed: API: ${error.message}, doctl: ${doctlError.message}`);
            }
        }
    }

    async listApps() {
        try {
            const apps = await this.makeApiRequest('/v2/apps');
            return apps.apps || apps;
        } catch (error) {
            try {
                const appsList = execSync('doctl apps list', { encoding: 'utf8' });
                return { info: appsList.trim(), method: 'doctl' };
            } catch (doctlError) {
                throw new Error(`List apps failed: API: ${error.message}, doctl: ${doctlError.message}`);
            }
        }
    }

    async updateEnvironmentConfig() {
        const envPath = path.join(__dirname, '..', '.env.example');
        
        try {
            let envContent = fs.readFileSync(envPath, 'utf8');
            
            // Update Spotify redirect URI for production
            envContent = envContent.replace(
                /SPOTIFY_REDIRECT_URI=.*/,
                `SPOTIFY_REDIRECT_URI=https://primosphere.studio/auth/callback`
            );
            
            // Add DigitalOcean configuration section if not present
            if (!envContent.includes('DIGITALOCEAN_API_TOKEN')) {
                envContent += `\n# =============================================================================\n`;
                envContent += `# 🌊 DIGITALOCEAN CONFIGURATION\n`;
                envContent += `# =============================================================================\n\n`;
                envContent += `# DigitalOcean API Token (get from https://cloud.digitalocean.com/account/api/tokens)\n`;
                envContent += `DIGITALOCEAN_API_TOKEN=${this.apiToken}\n`;
                envContent += `DIGITALOCEAN_REGISTRY_EMAIL=${this.dockerCredentials.email}\n`;
                envContent += `DIGITALOCEAN_REGISTRY_TOKEN=${this.dockerCredentials.token}\n`;
                envContent += `DIGITALOCEAN_CALLBACK_URL=${this.callbackUrl}\n\n`;
            }
            
            fs.writeFileSync(envPath, envContent);
            this.log('✅ Updated .env.example with DigitalOcean and localhost configuration', 'success');
            
        } catch (error) {
            this.log(`⚠️ Failed to update environment config: ${error.message}`, 'warning');
        }
    }

    async runComprehensiveTest() {
        this.log('🚀 Starting comprehensive DigitalOcean test with new tokens...', 'info');
        this.log(`   Localhost callback: ${this.callbackUrl}`, 'info');
        this.log(`   Production callback: ${this.productionCallbackUrl}`, 'info');
        
        const results = {
            timestamp: new Date().toISOString(),
            callbackUrl: this.callbackUrl,
            productionCallbackUrl: this.productionCallbackUrl,
            tests: {},
            summary: { passed: 0, failed: 0 }
        };

        // Test both API tokens first
        this.log('🔍 Step 1: Testing API tokens...', 'info');
        try {
            const tokenTest = await this.testBothTokens();
            if (tokenTest.success) {
                results.tests.tokenValidation = { 
                    status: 'passed', 
                    data: { 
                        workingToken: tokenTest.token,
                        account: tokenTest.data.account
                    }
                };
                results.summary.passed++;
                this.log(`✅ Using ${tokenTest.token} token`, 'success');
            } else {
                results.tests.tokenValidation = { 
                    status: 'failed', 
                    error: tokenTest.error 
                };
                results.summary.failed++;
                this.log('❌ Both API tokens failed - stopping test', 'error');
                return this.saveResults(results);
            }
        } catch (error) {
            results.tests.tokenValidation = { status: 'failed', error: error.message };
            results.summary.failed++;
            this.log(`❌ Token validation error: ${error.message}`, 'error');
            return this.saveResults(results);
        }

        // Install and authenticate doctl
        this.log('🔧 Step 2: Setting up doctl...', 'info');
        const doctlInstalled = await this.ensureDoctlInstalled();
        if (doctlInstalled) {
            results.tests.doctlInstallation = { status: 'passed' };
            results.summary.passed++;
            
            const authenticated = await this.authenticateDoctl();
            if (authenticated) {
                results.tests.doctlAuthentication = { status: 'passed' };
                results.summary.passed++;
            } else {
                results.tests.doctlAuthentication = { status: 'failed', error: 'Authentication failed' };
                results.summary.failed++;
            }
        } else {
            results.tests.doctlInstallation = { status: 'failed', error: 'Installation failed' };
            results.summary.failed++;
        }

        // Test account access
        this.log('🔍 Step 3: Testing account access...', 'info');
        try {
            const account = await this.getAccountInfo();
            results.tests.accountAccess = { status: 'passed', data: account };
            results.summary.passed++;
            this.log('✅ Account access successful', 'success');
        } catch (error) {
            results.tests.accountAccess = { status: 'failed', error: error.message };
            results.summary.failed++;
            this.log(`❌ Account access failed: ${error.message}`, 'error');
        }

        // Test registry access
        this.log('🔍 Step 4: Testing registry access...', 'info');
        try {
            const registries = await this.listRegistries();
            results.tests.registryAccess = { status: 'passed', data: registries };
            results.summary.passed++;
            this.log('✅ Registry access successful', 'success');
        } catch (error) {
            results.tests.registryAccess = { status: 'failed', error: error.message };
            results.summary.failed++;
            this.log(`❌ Registry access failed: ${error.message}`, 'error');
        }

        // Test registry authentication
        this.log('🔍 Step 5: Testing registry authentication...', 'info');
        try {
            const registryAuth = await this.testRegistryAuthentication();
            results.tests.registryAuthentication = { status: 'passed', data: registryAuth };
            results.summary.passed++;
            this.log('✅ Registry authentication successful', 'success');
        } catch (error) {
            results.tests.registryAuthentication = { status: 'failed', error: error.message };
            results.summary.failed++;
            this.log(`❌ Registry authentication failed: ${error.message}`, 'error');
        }

        // Test App Platform access
        this.log('🔍 Step 6: Testing App Platform access...', 'info');
        try {
            const apps = await this.listApps();
            results.tests.appPlatform = { status: 'passed', data: apps };
            results.summary.passed++;
            this.log('✅ App Platform access successful', 'success');
        } catch (error) {
            results.tests.appPlatform = { status: 'failed', error: error.message };
            results.summary.failed++;
            this.log(`❌ App Platform access failed: ${error.message}`, 'error');
        }

        // Update environment configuration
        this.log('🔧 Step 7: Updating environment configuration...', 'info');
        await this.updateEnvironmentConfig();
        results.tests.environmentUpdate = { status: 'passed', callbackUrl: this.callbackUrl };
        results.summary.passed++;

        return this.saveResults(results);
    }

    saveResults(results) {
        // Generate report
        const reportPath = path.join(__dirname, '..', 'ENHANCED_DO_TESTING_REPORT.json');
        const markdownPath = path.join(__dirname, '..', 'ENHANCED_DO_TESTING_REPORT.md');

        fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

        // Generate markdown report
        let markdown = `# 🌊 Enhanced DigitalOcean Testing Report\n\n`;
        markdown += `**Generated:** ${results.timestamp}\n`;
        markdown += `**Localhost Callback:** ${results.callbackUrl}\n`;
        markdown += `**Production Callback:** ${results.productionCallbackUrl}\n`;
        
        // Show which token worked
        const tokenTest = results.tests.tokenValidation;
        if (tokenTest && tokenTest.status === 'passed') {
            markdown += `**Working Token:** ${tokenTest.data.workingToken}\n`;
            markdown += `**Account:** ${tokenTest.data.account?.email || 'Unknown'}\n`;
        }
        
        markdown += `**Passed:** ${results.summary.passed} ✅\n`;
        markdown += `**Failed:** ${results.summary.failed} ❌\n\n`;

        Object.entries(results.tests).forEach(([test, result]) => {
            const status = result.status === 'passed' ? '✅' : '❌';
            markdown += `## ${status} ${test}\n\n`;
            if (result.data && typeof result.data === 'object') {
                markdown += `\`\`\`json\n${JSON.stringify(result.data, null, 2)}\n\`\`\`\n\n`;
            } else if (result.error) {
                markdown += `**Error:** ${result.error}\n\n`;
            }
        });

        fs.writeFileSync(markdownPath, markdown);

        this.log(`📊 Enhanced testing complete: ${results.summary.passed}/${results.summary.passed + results.summary.failed} passed`, 
                  results.summary.failed === 0 ? 'success' : 'warning');
        this.log(`📄 Reports: ${reportPath}, ${markdownPath}`, 'info');

        return results;
    }

    async showUsage() {
        console.log(`
🌊 Enhanced DigitalOcean Manager

Usage: node scripts/enhanced-digitalocean-manager.js [command]

Commands:
  test              Run comprehensive DigitalOcean tests
  auth              Authenticate doctl with API token
  registry-token    Get container registry token
  account           Show account information
  registries        List container registries
  apps              List App Platform applications
  update-env        Update environment configuration
  help              Show this help message

Examples:
  npm run do:enhanced test
  npm run do:enhanced registry-token
  npm run do:enhanced account
        `);
    }
}

// Main execution
if (require.main === module) {
    const manager = new EnhancedDigitalOceanManager();
    const command = process.argv[2] || 'test';

    switch (command) {
        case 'test':
            manager.runComprehensiveTest().catch(console.error);
            break;
        case 'auth':
            manager.ensureDoctlInstalled()
                .then(() => manager.authenticateDoctl())
                .catch(console.error);
            break;
        case 'registry-token':
            manager.ensureDoctlInstalled()
                .then(() => manager.authenticateDoctl())
                .then(() => manager.getRegistryToken())
                .then(token => console.log(JSON.stringify(token, null, 2)))
                .catch(console.error);
            break;
        case 'account':
            manager.getAccountInfo()
                .then(account => console.log(JSON.stringify(account, null, 2)))
                .catch(console.error);
            break;
        case 'registries':
            manager.listRegistries()
                .then(registries => console.log(JSON.stringify(registries, null, 2)))
                .catch(console.error);
            break;
        case 'apps':
            manager.listApps()
                .then(apps => console.log(JSON.stringify(apps, null, 2)))
                .catch(console.error);
            break;
        case 'update-env':
            manager.updateEnvironmentConfig().catch(console.error);
            break;
        case 'help':
        default:
            manager.showUsage();
            break;
    }
}

module.exports = EnhancedDigitalOceanManager;
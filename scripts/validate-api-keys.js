#!/usr/bin/env node

/**
 * API Keys & Configuration Testing Tool for EchoTune AI
 * 
 * This tool validates all API keys, tests MCP server configurations,
 * and ensures all services are properly configured and actively working.
 * 
 * Usage:
 *   node scripts/validate-api-keys.js [service]
 *   
 * Examples:
 *   node scripts/validate-api-keys.js --all
 *   node scripts/validate-api-keys.js --spotify
 *   node scripts/validate-api-keys.js --mcp-server
 *   node scripts/validate-api-keys.js --openai
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const http = require('http');
const https = require('https');
const { URL } = require('url');

class APIKeyValidator {
    constructor() {
        this.results = {
            overall: 'pending',
            configurationComplete: false,
            totalKeys: 0,
            validKeys: 0,
            missingKeys: 0,
            failedKeys: 0,
            services: {},
            timestamp: new Date().toISOString(),
            recommendations: []
        };

        // Load environment variables
        this.loadEnvironment();
        this.initializeServiceTests();
    }

    loadEnvironment() {
        // Load .env file if it exists
        const envPath = path.join(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const envLines = envContent.split('\n').filter(line => 
                line.trim() && !line.startsWith('#') && line.includes('=')
            );
            
            envLines.forEach(line => {
                const [key, ...valueParts] = line.split('=');
                const value = valueParts.join('=').trim();
                if (key && value && !process.env[key]) {
                    process.env[key] = value;
                }
            });
        }
    }

    initializeServiceTests() {
        this.serviceTests = {
            'spotify': this.testSpotifyAPI.bind(this),
            'openai': this.testOpenAIAPI.bind(this),
            'gemini': this.testGeminiAPI.bind(this),
            'anthropic': this.testAnthropicAPI.bind(this),
            'openrouter': this.testOpenRouterAPI.bind(this),
            'mongodb': this.testMongoDBConnection.bind(this),
            'redis': this.testRedisConnection.bind(this),
            'github': this.testGitHubAPI.bind(this),
            'brave': this.testBraveSearchAPI.bind(this),
            'youtube': this.testYouTubeAPI.bind(this),
            'browserbase': this.testBrowserbaseAPI.bind(this),
            'influxdb': this.testInfluxDBAPI.bind(this),
            'langfuse': this.testLangfuseAPI.bind(this),
            'mcp-server': this.testMCPServer.bind(this),
            'ssl': this.testSSLConfiguration.bind(this),
            'docker': this.testDockerConfiguration.bind(this),
            'database': this.testDatabaseConfiguration.bind(this),
            'security': this.testSecurityConfiguration.bind(this)
        };
    }

    // Custom fetch implementation using Node.js http/https
    async fetch(url, options = {}) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const module = urlObj.protocol === 'https:' ? https : http;
            
            const requestOptions = {
                hostname: urlObj.hostname,
                port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
                path: urlObj.pathname + urlObj.search,
                method: options.method || 'GET',
                headers: options.headers || {},
                timeout: options.timeout || 10000
            };

            const req = module.request(requestOptions, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve({
                        ok: res.statusCode >= 200 && res.statusCode < 300,
                        status: res.statusCode,
                        statusText: res.statusMessage,
                        headers: res.headers,
                        async json() {
                            try {
                                return JSON.parse(data);
                            } catch (e) {
                                throw new Error('Invalid JSON response');
                            }
                        },
                        async text() {
                            return data;
                        }
                    });
                });
            });

            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            if (options.body) {
                req.write(options.body);
            }
            
            req.end();
        });
    }

    log(message, type = 'info') {
        const timestamp = new Date().toTimeString().split(' ')[0];
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`${prefix} [${timestamp}] ${message}`);
    }

    // Spotify API Validation
    async testSpotifyAPI() {
        const clientId = process.env.SPOTIFY_CLIENT_ID;
        const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
        const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

        if (!clientId || !clientSecret) {
            throw new Error('Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET');
        }

        try {
            // Test client credentials flow
            const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
            const response = await this.fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: 'grant_type=client_credentials'
            });

            if (!response.ok) {
                throw new Error(`Spotify auth failed: ${response.status}`);
            }

            const data = await response.json();
            return {
                status: 'valid',
                token_type: data.token_type,
                expires_in: data.expires_in,
                redirect_uri: redirectUri,
                has_redirect_uri: !!redirectUri
            };
        } catch (error) {
            throw new Error(`Spotify API test failed: ${error.message}`);
        }
    }

    // OpenAI API Validation
    async testOpenAIAPI() {
        const apiKey = process.env.OPENAI_API_KEY;
        
        if (!apiKey || !apiKey.startsWith('sk-')) {
            throw new Error('Missing or invalid OPENAI_API_KEY (should start with sk-)');
        }

        try {
            const response = await this.fetch('https://api.openai.com/v1/models', {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`OpenAI API failed: ${response.status}`);
            }

            const data = await response.json();
            return {
                status: 'valid',
                models_available: data.data?.length || 0,
                gpt4_available: data.data?.some(m => m.id.includes('gpt-4')) || false
            };
        } catch (error) {
            throw new Error(`OpenAI API test failed: ${error.message}`);
        }
    }

    // Google Gemini API Validation
    async testGeminiAPI() {
        const apiKey = process.env.GEMINI_API_KEY;
        
        if (!apiKey) {
            throw new Error('Missing GEMINI_API_KEY');
        }

        try {
            const response = await this.fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);

            if (!response.ok) {
                throw new Error(`Gemini API failed: ${response.status}`);
            }

            const data = await response.json();
            return {
                status: 'valid',
                models_available: data.models?.length || 0
            };
        } catch (error) {
            throw new Error(`Gemini API test failed: ${error.message}`);
        }
    }

    // Anthropic API Validation
    async testAnthropicAPI() {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        
        if (!apiKey || !apiKey.startsWith('sk-ant-')) {
            return { status: 'not_configured', message: 'ANTHROPIC_API_KEY not configured' };
        }

        try {
            // Test with a simple completion request
            const response = await this.fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-sonnet-20240229',
                    max_tokens: 10,
                    messages: [{ role: 'user', content: 'Hello' }]
                })
            });

            if (!response.ok) {
                throw new Error(`Anthropic API failed: ${response.status}`);
            }

            return {
                status: 'valid',
                model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229'
            };
        } catch (error) {
            throw new Error(`Anthropic API test failed: ${error.message}`);
        }
    }

    // OpenRouter API Validation
    async testOpenRouterAPI() {
        const apiKey = process.env.OPENROUTER_API_KEY;
        
        if (!apiKey) {
            return { status: 'not_configured', message: 'OPENROUTER_API_KEY not configured' };
        }

        try {
            const response = await this.fetch('https://openrouter.ai/api/v1/models', {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`OpenRouter API failed: ${response.status}`);
            }

            const data = await response.json();
            return {
                status: 'valid',
                models_available: data.data?.length || 0
            };
        } catch (error) {
            throw new Error(`OpenRouter API test failed: ${error.message}`);
        }
    }

    // MongoDB Connection Test with Enhanced Validation
    async testMongoDBConnection() {
        const mongoUri = process.env.MONGODB_URI;
        const requiredUri = 'mongodb+srv://copilot:DapperMan77@cluster0.ofnyuy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
        const requiredDatabase = 'echotune';
        
        if (!mongoUri) {
            throw new Error('Missing MONGODB_URI');
        }

        try {
            // Use helper script to avoid shell escaping issues
            const helperPath = require('path').join(__dirname, 'test-mongodb-helper.js');
            const result = execSync(`node "${helperPath}" "${mongoUri}" "${requiredDatabase}"`, { 
                timeout: 15000,
                encoding: 'utf8' 
            });

            if (result.includes('RESULT:')) {
                const jsonMatch = result.match(/RESULT:(.+)/);
                if (jsonMatch) {
                    const data = JSON.parse(jsonMatch[1]);
                    
                    // Validate connection string matches requirements
                    const connectionValid = mongoUri.includes('cluster0.ofnyuy.mongodb.net');
                    const databaseValid = data.database === requiredDatabase;
                    
                    return {
                        status: 'valid',
                        connection_matches_requirement: connectionValid,
                        database: data.database,
                        database_matches_requirement: databaseValid,
                        collections_count: data.total_collections,
                        collections: data.collections,
                        spotify_analytics: {
                            exists: data.spotify_analytics_exists,
                            document_count: data.spotify_analytics_count,
                            has_data: data.spotify_analytics_count > 0,
                            has_most_data: data.spotify_analytics_count > 100000 // Consider significant data
                        },
                        validation_summary: connectionValid && databaseValid && data.spotify_analytics_exists && data.spotify_analytics_count > 0 ? 'fully_compliant' : 'partial_compliance'
                    };
                }
            }
            
            if (result.includes('SUCCESS')) {
                return {
                    status: 'valid',
                    database: requiredDatabase,
                    message: 'Basic connection successful'
                };
            } else {
                throw new Error('MongoDB connection failed');
            }
        } catch (error) {
            throw new Error(`MongoDB test failed: ${error.message}`);
        }
    }

    // Redis Connection Test
    async testRedisConnection() {
        const redisUrl = process.env.REDIS_URL;
        
        if (!redisUrl) {
            return { status: 'not_configured', message: 'Redis not configured (optional)' };
        }

        // For now, just validate the URL format
        try {
            new URL(redisUrl);
            return {
                status: 'configured',
                url: redisUrl,
                prefix: process.env.REDIS_KEY_PREFIX || 'none'
            };
        } catch (error) {
            throw new Error('Invalid REDIS_URL format');
        }
    }

    // GitHub API Test
    async testGitHubAPI() {
        const token = process.env.GITHUB_PAT;
        
        if (!token) {
            return { status: 'not_configured', message: 'GITHUB_PAT not configured' };
        }

        try {
            const response = await this.fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'User-Agent': 'EchoTune-AI'
                }
            });

            if (!response.ok) {
                throw new Error(`GitHub API failed: ${response.status}`);
            }

            const data = await response.json();
            return {
                status: 'valid',
                user: data.login,
                scopes: response.headers['x-oauth-scopes'] || 'unknown'
            };
        } catch (error) {
            throw new Error(`GitHub API test failed: ${error.message}`);
        }
    }

    // Brave Search API Test
    async testBraveSearchAPI() {
        const apiKey = process.env.BRAVE_API_KEY;
        
        if (!apiKey) {
            return { status: 'not_configured', message: 'BRAVE_API_KEY not configured' };
        }

        try {
            const response = await this.fetch('https://api.search.brave.com/res/v1/web/search?q=test', {
                headers: {
                    'X-Subscription-Token': apiKey
                }
            });

            return {
                status: response.ok ? 'valid' : 'invalid',
                response_code: response.status
            };
        } catch (error) {
            throw new Error(`Brave Search API test failed: ${error.message}`);
        }
    }

    // YouTube API Test
    async testYouTubeAPI() {
        const apiKey = process.env.YOUTUBE_API_KEY;
        
        if (!apiKey) {
            return { status: 'not_configured', message: 'YOUTUBE_API_KEY not configured' };
        }

        try {
            const response = await this.fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&key=${apiKey}`);

            return {
                status: response.ok ? 'valid' : 'invalid',
                response_code: response.status
            };
        } catch (error) {
            throw new Error(`YouTube API test failed: ${error.message}`);
        }
    }

    // Browserbase API Test
    async testBrowserbaseAPI() {
        const apiKey = process.env.BROWSERBASE_API_KEY;
        const projectId = process.env.BROWSERBASE_PROJECT_ID;
        
        if (!apiKey || !projectId) {
            return { status: 'not_configured', message: 'Browserbase not configured' };
        }

        return {
            status: 'configured',
            project_id: projectId,
            session_id: process.env.BROWSERBASE_SESSION_ID || 'none'
        };
    }

    // InfluxDB API Test
    async testInfluxDBAPI() {
        const url = process.env.INFLUXDB_URL;
        const token = process.env.INFLUXDB_TOKEN;
        
        if (!url || !token) {
            return { status: 'not_configured', message: 'InfluxDB not configured' };
        }

        try {
            const response = await this.fetch(`${url}/ping`);
            return {
                status: response.ok ? 'valid' : 'invalid',
                url: url
            };
        } catch (error) {
            return { status: 'error', message: error.message };
        }
    }

    // Langfuse API Test
    async testLangfuseAPI() {
        const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
        const secretKey = process.env.LANGFUSE_SECRET_KEY;
        
        if (!publicKey || !secretKey) {
            return { status: 'not_configured', message: 'Langfuse not configured' };
        }

        return {
            status: 'configured',
            public_key: publicKey.substring(0, 8) + '...'
        };
    }

    // MCP Server Test
    async testMCPServer() {
        const host = process.env.MCP_SERVER_HOST || 'localhost';
        const port = process.env.MCP_SERVER_PORT || '3001';
        const timeout = parseInt(process.env.MCP_TIMEOUT || '30000');

        try {
            const response = await this.fetch(`http://${host}:${port}/health`, { timeout: 5000 });
            
            if (!response.ok) {
                throw new Error(`MCP Server returned ${response.status}`);
            }

            const data = await response.json();
            return {
                status: 'running',
                host: host,
                port: port,
                uptime: data.uptime || 'unknown',
                capabilities: data.capabilities || [],
                logging_enabled: process.env.ENABLE_MCP_LOGGING === 'true'
            };
        } catch (error) {
            // Try to check if the server is configured but not running
            if (fs.existsSync(path.join(process.cwd(), 'mcp-server'))) {
                return {
                    status: 'configured_not_running',
                    message: 'MCP server files exist but server is not running',
                    port: port,
                    suggestion: `Start with: npm run mcp-server`
                };
            }
            
            throw new Error(`MCP Server test failed: ${error.message}`);
        }
    }

    // SSL Configuration Test
    async testSSLConfiguration() {
        const sslEnabled = process.env.SSL_ENABLED === 'true';
        const certPath = process.env.SSL_CERT_PATH;
        const keyPath = process.env.SSL_KEY_PATH;
        const chainPath = process.env.SSL_CHAIN_PATH;
        const email = process.env.SSL_EMAIL;

        if (!sslEnabled) {
            return { status: 'disabled', message: 'SSL not enabled' };
        }

        const issues = [];
        if (!certPath) issues.push('SSL_CERT_PATH missing');
        if (!keyPath) issues.push('SSL_KEY_PATH missing');  
        if (!email) issues.push('SSL_EMAIL missing');

        if (issues.length > 0) {
            throw new Error(`SSL configuration issues: ${issues.join(', ')}`);
        }

        return {
            status: 'configured',
            cert_path: certPath,
            key_path: keyPath,
            chain_path: chainPath || 'not_configured',
            email: email
        };
    }

    // Docker Configuration Test
    async testDockerConfiguration() {
        const username = process.env.DOCKER_HUB_USERNAME;
        const token = process.env.DOCKER_HUB_TOKEN;
        const registry = process.env.DOCKER_REGISTRY || 'docker.io';
        const repository = process.env.DOCKER_REPOSITORY;

        if (!username || !token) {
            return { status: 'not_configured', message: 'Docker Hub credentials not configured' };
        }

        return {
            status: 'configured',
            username: username,
            registry: registry,
            repository: repository || 'not_configured'
        };
    }

    // Database Configuration Test
    async testDatabaseConfiguration() {
        const mongoUri = process.env.MONGODB_URI;
        const databaseUrl = process.env.DATABASE_URL;
        const sqlitePath = process.env.SQLITE_DB_PATH;
        const fallbackEnabled = process.env.ENABLE_SQLITE_FALLBACK === 'true';

        const databases = [];
        if (mongoUri) databases.push('MongoDB');
        if (databaseUrl) databases.push('PostgreSQL');
        if (sqlitePath) databases.push('SQLite');

        return {
            status: databases.length > 0 ? 'configured' : 'not_configured',
            databases: databases,
            fallback_enabled: fallbackEnabled,
            analytics_enabled: process.env.ENABLE_DATABASE_ANALYTICS === 'true',
            backup_enabled: process.env.DATABASE_BACKUP_ENABLED === 'true'
        };
    }

    // Security Configuration Test
    async testSecurityConfiguration() {
        const sessionSecret = process.env.SESSION_SECRET;
        const jwtSecret = process.env.JWT_SECRET;
        
        if (!sessionSecret || !jwtSecret) {
            throw new Error('Missing security secrets (SESSION_SECRET, JWT_SECRET)');
        }

        const issues = [];
        if (sessionSecret.length < 32) issues.push('SESSION_SECRET too short (< 32 chars)');
        if (jwtSecret.length < 32) issues.push('JWT_SECRET too short (< 32 chars)');
        if (sessionSecret === jwtSecret) issues.push('SESSION_SECRET and JWT_SECRET should be different');

        return {
            status: issues.length === 0 ? 'secure' : 'weak',
            issues: issues,
            session_secret_length: sessionSecret.length,
            jwt_secret_length: jwtSecret.length,
            security_headers: process.env.ENABLE_SECURITY_HEADERS === 'true',
            force_https: process.env.FORCE_HTTPS === 'true'
        };
    }

    // Run validation for specific service
    async validateService(serviceName) {
        const testFunction = this.serviceTests[serviceName];
        if (!testFunction) {
            throw new Error(`Unknown service: ${serviceName}`);
        }

        const startTime = Date.now();
        this.log(`Testing ${serviceName}...`);

        try {
            const result = await testFunction();
            const duration = Date.now() - startTime;
            
            this.results.services[serviceName] = {
                ...result,
                duration: `${duration}ms`,
                timestamp: new Date().toISOString()
            };

            if (result.status === 'valid' || result.status === 'configured' || result.status === 'running' || result.status === 'secure') {
                this.log(`✅ ${serviceName} - ${result.status.toUpperCase()} (${duration}ms)`, 'success');
                this.results.validKeys++;
            } else if (result.status === 'not_configured' || result.status === 'disabled') {
                this.log(`⚠️ ${serviceName} - ${result.status.toUpperCase()} (${duration}ms)`, 'warning');
            } else {
                this.log(`❌ ${serviceName} - ${result.status.toUpperCase()} (${duration}ms)`, 'error');
                this.results.failedKeys++;
            }

        } catch (error) {
            const duration = Date.now() - startTime;
            
            this.results.services[serviceName] = {
                status: 'failed',
                error: error.message,
                duration: `${duration}ms`,
                timestamp: new Date().toISOString()
            };

            this.log(`❌ ${serviceName} - FAILED: ${error.message} (${duration}ms)`, 'error');
            this.results.failedKeys++;
        }

        this.results.totalKeys++;
    }

    // Run all validations
    async validateAll() {
        this.log('🔍 Starting comprehensive API key validation...');
        console.log('━'.repeat(80));

        const services = Object.keys(this.serviceTests);
        
        for (const service of services) {
            await this.validateService(service);
        }

        this.generateSummary();
        this.generateRecommendations();
        this.saveResults();
    }

    // Generate summary
    generateSummary() {
        this.results.totalKeys = Object.keys(this.results.services).length;
        this.results.missingKeys = this.results.totalKeys - this.results.validKeys - this.results.failedKeys;
        this.results.configurationComplete = this.results.validKeys >= 8; // Minimum viable keys

        if (this.results.validKeys >= 15) {
            this.results.overall = 'excellent';
        } else if (this.results.validKeys >= 8) {
            this.results.overall = 'good';
        } else if (this.results.validKeys >= 4) {
            this.results.overall = 'minimal';
        } else {
            this.results.overall = 'insufficient';
        }

        console.log('━'.repeat(80));
        console.log('📊 VALIDATION SUMMARY');
        console.log('━'.repeat(80));
        console.log(`Overall Status: ${this.results.overall.toUpperCase()}`);
        console.log(`Configuration Complete: ${this.results.configurationComplete ? '✅ YES' : '❌ NO'}`);
        console.log(`Total Services Tested: ${this.results.totalKeys}`);
        console.log(`✅ Valid/Configured: ${this.results.validKeys}`);
        console.log(`❌ Failed: ${this.results.failedKeys}`);
        console.log(`⚠️ Not Configured: ${this.results.totalKeys - this.results.validKeys - this.results.failedKeys}`);
        console.log('━'.repeat(80));
    }

    // Generate recommendations
    generateRecommendations() {
        const recommendations = [];

        // Critical services check
        const criticalServices = ['spotify', 'openai', 'security', 'database'];
        const missingCritical = criticalServices.filter(service => 
            !this.results.services[service] || 
            this.results.services[service].status === 'failed'
        );

        if (missingCritical.length > 0) {
            recommendations.push({
                priority: 'HIGH',
                category: 'Critical Services',
                message: `Configure these essential services: ${missingCritical.join(', ')}`,
                action: 'Add API keys to .env file'
            });
        }

        // LLM provider fallback
        const llmProviders = ['openai', 'gemini', 'anthropic', 'openrouter'];
        const validLLMProviders = llmProviders.filter(provider => 
            this.results.services[provider] && 
            (this.results.services[provider].status === 'valid' || this.results.services[provider].status === 'configured')
        );

        if (validLLMProviders.length < 2) {
            recommendations.push({
                priority: 'MEDIUM',
                category: 'LLM Redundancy',
                message: 'Configure multiple LLM providers for fallback',
                action: 'Add Gemini or Anthropic API keys'
            });
        }

        // MCP Server
        if (!this.results.services['mcp-server'] || this.results.services['mcp-server'].status === 'failed') {
            recommendations.push({
                priority: 'MEDIUM',
                category: 'Automation',
                message: 'MCP Server not running - advanced automation disabled',
                action: 'Run: npm run mcp-server'
            });
        }

        // SSL Configuration
        if (this.results.services.ssl && this.results.services.ssl.status === 'disabled') {
            recommendations.push({
                priority: 'HIGH',
                category: 'Security',
                message: 'SSL not enabled - required for production',
                action: 'Configure SSL certificates and set SSL_ENABLED=true'
            });
        }

        this.results.recommendations = recommendations;

        if (recommendations.length > 0) {
            console.log('💡 RECOMMENDATIONS');
            console.log('━'.repeat(80));
            recommendations.forEach(rec => {
                console.log(`🔥 ${rec.priority} - ${rec.category}`);
                console.log(`   Issue: ${rec.message}`);
                console.log(`   Action: ${rec.action}`);
                console.log('');
            });
        }
    }

    // Save results to file
    saveResults() {
        const reportPath = path.join(process.cwd(), 'API_KEYS_VALIDATION_REPORT.json');
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        this.log(`📄 Full report saved to: ${reportPath}`, 'success');

        // Also create a summary markdown report
        this.createMarkdownReport();
    }

    createMarkdownReport() {
        const reportPath = path.join(process.cwd(), 'API_KEYS_VALIDATION_REPORT.md');
        
        let markdown = `# API Keys Validation Report\n\n`;
        markdown += `**Generated**: ${this.results.timestamp}\n`;
        markdown += `**Overall Status**: ${this.results.overall.toUpperCase()}\n`;
        markdown += `**Configuration Complete**: ${this.results.configurationComplete ? '✅ YES' : '❌ NO'}\n\n`;
        
        markdown += `## Summary\n\n`;
        markdown += `- **Total Services**: ${this.results.totalKeys}\n`;
        markdown += `- **Valid/Configured**: ${this.results.validKeys}\n`;
        markdown += `- **Failed**: ${this.results.failedKeys}\n`;
        markdown += `- **Not Configured**: ${this.results.totalKeys - this.results.validKeys - this.results.failedKeys}\n\n`;
        
        markdown += `## Service Status\n\n`;
        Object.entries(this.results.services).forEach(([service, result]) => {
            const statusIcon = result.status === 'valid' || result.status === 'configured' || result.status === 'running' || result.status === 'secure' ? '✅' : 
                              result.status === 'not_configured' || result.status === 'disabled' ? '⚠️' : '❌';
            markdown += `- ${statusIcon} **${service}**: ${result.status.toUpperCase()}`;
            if (result.error) {
                markdown += ` - ${result.error}`;
            }
            if (result.message) {
                markdown += ` - ${result.message}`;
            }
            markdown += `\n`;
        });

        if (this.results.recommendations.length > 0) {
            markdown += `\n## Recommendations\n\n`;
            this.results.recommendations.forEach(rec => {
                markdown += `### ${rec.priority} Priority: ${rec.category}\n`;
                markdown += `- **Issue**: ${rec.message}\n`;
                markdown += `- **Action**: ${rec.action}\n\n`;
            });
        }

        fs.writeFileSync(reportPath, markdown);
        this.log(`📄 Markdown report saved to: ${reportPath}`, 'success');
    }
}

// CLI interface
async function main() {
    const validator = new APIKeyValidator();
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args.includes('--all')) {
        await validator.validateAll();
    } else {
        for (const arg of args) {
            const serviceName = arg.replace('--', '');
            if (validator.serviceTests[serviceName]) {
                await validator.validateService(serviceName);
            } else {
                console.log(`❌ Unknown service: ${serviceName}`);
                console.log(`Available services: ${Object.keys(validator.serviceTests).join(', ')}`);
            }
        }
        
        if (Object.keys(validator.results.services).length > 0) {
            validator.generateSummary();
            validator.generateRecommendations();
            validator.saveResults();
        }
    }
}

// Handle CLI execution
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Validation failed:', error);
        process.exit(1);
    });
}

module.exports = APIKeyValidator;
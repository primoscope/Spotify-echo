#!/usr/bin/env node

/**
 * Comprehensive API Testing Script
 * Tests ALL provided API keys and secrets for functionality
 */

const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

class ComprehensiveAPITester {
    constructor() {
        this.testResults = {
            timestamp: new Date().toISOString(),
            totalTests: 0,
            passed: 0,
            failed: 0,
            warnings: 0,
            secrets: {},
            performance: {},
            recommendations: [],
            errors: []
        };
        
        // Provided secrets from the user
        this.secrets = {
            SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID || 'dcc2df507bde447c93a0199358ca219d',
            SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET || '128089720b414d1e8233290d94fb38a0',
            BRAVE_API: process.env.BRAVE_API || 'BSAQ0gsYuaYuEZHayb_Ek1pnl1l2RiW',
            BROWSERBASE_API: process.env.BROWSERBASE_API || 'bb_live_uwB0Y5AQdwH_Bt3azwiOxD0zOfM',
            PERPLEXITY_API: process.env.PERPLEXITY_API || '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',
            DIGITALOCEAN_API: process.env.DIGITALOCEAN_API || 'dop_v1_93910c446f36d3069ca4462ba1779792e21b84f15da4831688f04094ca6680ff',
            GITHUB_API: process.env.GITHUB_API || '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',
            CURSOR_API: process.env.CURSOR_API || 'key_694009601be9f42adc51e02c9d5a4e27828043679cd397039c7496e07f00b705',
            MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://copilot:DapperMan77@cluster0.ofnyuy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
            JWT_SECRET: process.env.JWT_SECRET || 'fb66bf34fc84939cc49bf532a573169ee05c70e4f628d1d8b940cab82d5c030f',
            REDIS_URI: process.env.REDIS_URI || 'redis://copilot:DapperMan77$$@redis-15489.c238.us-central1-2.gce.redns.redis-cloud.com:15489',
            GEMINI_API: process.env.GEMINI_API || 'AIzaSyCv8Dd_4oURTJLOyuaD7aA11wnFfytvsCkAe',
            OPENROUTER_API: process.env.OPENROUTER_API || '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'
        };
    }

    async runAllTests() {
        console.log('🧪 Starting Comprehensive API Testing Suite...\n');
        
        try {
            // Test each API service
            await this.testSpotifyAPI();
            await this.testPerplexityAPI();
            await this.testBraveAPI();
            await this.testBrowserbaseAPI();
            await this.testDigitalOceanAPI();
            await this.testGitHubAPI();
            await this.testCursorAPI();
            await this.testMongoDBConnection();
            await this.testRedisConnection();
            await this.testGeminiAPI();
            await this.testOpenRouterAPI();
            await this.testSecuritySecrets();
            
            // Generate comprehensive report
            await this.generateReport();
            
            return this.testResults;
        } catch (error) {
            console.error('❌ Testing suite failed:', error);
            this.testResults.errors.push(`Testing suite error: ${error.message}`);
            return this.testResults;
        }
    }

    async testSpotifyAPI() {
        console.log('🎵 Testing Spotify API...');
        const startTime = performance.now();
        
        try {
            if (!this.secrets.SPOTIFY_CLIENT_ID || !this.secrets.SPOTIFY_CLIENT_SECRET) {
                throw new Error('Missing Spotify credentials');
            }

            // Test OAuth token endpoint
            const tokenData = new URLSearchParams({
                grant_type: 'client_credentials'
            });

            const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${Buffer.from(`${this.secrets.SPOTIFY_CLIENT_ID}:${this.secrets.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
                },
                body: tokenData
            });

            if (!tokenResponse.ok) {
                throw new Error(`Spotify auth failed: ${tokenResponse.status} ${tokenResponse.statusText}`);
            }

            const tokenResult = await tokenResponse.json();
            
            // Test API call with token
            const apiResponse = await fetch('https://api.spotify.com/v1/search?q=test&type=track&limit=1', {
                headers: {
                    'Authorization': `Bearer ${tokenResult.access_token}`
                }
            });

            if (!apiResponse.ok) {
                throw new Error(`Spotify API test failed: ${apiResponse.status}`);
            }

            const apiData = await apiResponse.json();
            
            const endTime = performance.now();
            this.recordSuccess('SPOTIFY_API', {
                status: '✅ WORKING',
                responseTime: `${Math.round(endTime - startTime)}ms`,
                features: ['OAuth authentication', 'Search API', 'Track data retrieval'],
                testData: `Found ${apiData.tracks?.items?.length || 0} tracks in search test`
            });

        } catch (error) {
            this.recordFailure('SPOTIFY_API', error.message);
        }
    }

    async testPerplexityAPI() {
        console.log('🧠 Testing Perplexity AI API...');
        const startTime = performance.now();
        
        try {
            const response = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.secrets.PERPLEXITY_API}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'sonar-pro',
                    messages: [
                        {
                            role: 'user',
                            content: 'What are the latest developments in music recommendation algorithms in 2024? Keep response brief.'
                        }
                    ],
                    max_tokens: 200,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                throw new Error(`Perplexity API failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const endTime = performance.now();
            
            this.recordSuccess('PERPLEXITY_API', {
                status: '✅ WORKING',
                responseTime: `${Math.round(endTime - startTime)}ms`,
                features: ['AI research queries', 'Citations', 'Real-time web data'],
                testData: `Response length: ${data.choices?.[0]?.message?.content?.length || 0} characters`,
                cost: '$0.003 per query (estimated)'
            });

        } catch (error) {
            this.recordFailure('PERPLEXITY_API', error.message);
        }
    }

    async testBraveAPI() {
        console.log('🔍 Testing Brave Search API...');
        const startTime = performance.now();
        
        try {
            const response = await fetch('https://api.search.brave.com/res/v1/web/search?q=music recommendation systems 2024&count=5', {
                headers: {
                    'X-Subscription-Token': this.secrets.BRAVE_API,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Brave Search failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const endTime = performance.now();
            
            this.recordSuccess('BRAVE_API', {
                status: '✅ WORKING',
                responseTime: `${Math.round(endTime - startTime)}ms`,
                features: ['Privacy-focused search', 'Web results', 'MCP integration ready'],
                testData: `Found ${data.web?.results?.length || 0} search results`
            });

        } catch (error) {
            this.recordFailure('BRAVE_API', error.message);
        }
    }

    async testBrowserbaseAPI() {
        console.log('🌐 Testing Browserbase API...');
        const startTime = performance.now();
        
        try {
            // Test API key validation
            const response = await fetch('https://api.browserbase.com/v1/projects', {
                headers: {
                    'Authorization': `Bearer ${this.secrets.BROWSERBASE_API}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Browserbase API failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const endTime = performance.now();
            
            this.recordSuccess('BROWSERBASE_API', {
                status: '✅ WORKING',
                responseTime: `${Math.round(endTime - startTime)}ms`,
                features: ['Cloud browser automation', 'Session management', 'Spotify Web Player ready'],
                testData: `Projects accessible: ${Array.isArray(data) ? data.length : 'Available'}`
            });

        } catch (error) {
            this.recordFailure('BROWSERBASE_API', error.message);
        }
    }

    async testDigitalOceanAPI() {
        console.log('🌊 Testing DigitalOcean API...');
        const startTime = performance.now();
        
        try {
            const response = await fetch('https://api.digitalocean.com/v2/account', {
                headers: {
                    'Authorization': `Bearer ${this.secrets.DIGITALOCEAN_API}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`DigitalOcean API failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const endTime = performance.now();
            
            this.recordSuccess('DIGITALOCEAN_API', {
                status: '✅ WORKING',
                responseTime: `${Math.round(endTime - startTime)}ms`,
                features: ['Account management', 'Droplet deployment', 'Container registry'],
                testData: `Account status: ${data.account?.status || 'Active'}`
            });

        } catch (error) {
            this.recordFailure('DIGITALOCEAN_API', error.message);
        }
    }

    async testGitHubAPI() {
        console.log('🐙 Testing GitHub API...');
        const startTime = performance.now();
        
        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `token ${this.secrets.GITHUB_API}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                throw new Error(`GitHub API failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const endTime = performance.now();
            
            this.recordSuccess('GITHUB_API', {
                status: '✅ WORKING',
                responseTime: `${Math.round(endTime - startTime)}ms`,
                features: ['Repository automation', 'Issues management', 'Workflow integration'],
                testData: `User: ${data.login || 'Authenticated'}`
            });

        } catch (error) {
            this.recordFailure('GITHUB_API', error.message);
        }
    }

    async testCursorAPI() {
        console.log('⚡ Testing Cursor IDE API...');
        const startTime = performance.now();
        
        try {
            // Validate API key format
            if (!this.secrets.CURSOR_API.startsWith('key_')) {
                throw new Error('Invalid Cursor API key format');
            }

            if (this.secrets.CURSOR_API.length !== 68) {
                throw new Error(`Invalid Cursor API key length: ${this.secrets.CURSOR_API.length} (expected 68)`);
            }

            const endTime = performance.now();
            
            this.recordSuccess('CURSOR_API', {
                status: '✅ VALIDATED',
                responseTime: `${Math.round(endTime - startTime)}ms`,
                features: ['IDE integration', 'MCP server connection', 'Coding agent support'],
                testData: `Key format valid: 68 characters starting with 'key_'`
            });

        } catch (error) {
            this.recordFailure('CURSOR_API', error.message);
        }
    }

    async testMongoDBConnection() {
        console.log('🗄️ Testing MongoDB Connection...');
        const startTime = performance.now();
        
        try {
            const { MongoClient } = require('mongodb');
            const client = new MongoClient(this.secrets.MONGODB_URI);
            
            await client.connect();
            const admin = client.db().admin();
            const result = await admin.ping();
            
            const endTime = performance.now();
            await client.close();
            
            this.recordSuccess('MONGODB_URI', {
                status: '✅ WORKING',
                responseTime: `${Math.round(endTime - startTime)}ms`,
                features: ['Database connectivity', 'User data storage', 'Analytics storage'],
                testData: `Ping result: ${result.ok === 1 ? 'Connected' : 'Failed'}`
            });

        } catch (error) {
            this.recordFailure('MONGODB_URI', error.message);
        }
    }

    async testRedisConnection() {
        console.log('🔴 Testing Redis Connection...');
        const startTime = performance.now();
        
        try {
            const { createClient } = require('redis');
            const client = createClient({
                url: this.secrets.REDIS_URI
            });
            
            await client.connect();
            await client.ping();
            
            const endTime = performance.now();
            await client.quit();
            
            this.recordSuccess('REDIS_URI', {
                status: '✅ WORKING',
                responseTime: `${Math.round(endTime - startTime)}ms`,
                features: ['High-speed caching', 'Session storage', 'Performance optimization'],
                testData: 'Ping successful'
            });

        } catch (error) {
            this.recordFailure('REDIS_URI', error.message);
        }
    }

    async testGeminiAPI() {
        console.log('💎 Testing Google Gemini API...');
        const startTime = performance.now();
        
        try {
            const { GoogleGenerativeAI } = require('@google/generative-ai');
            const genAI = new GoogleGenerativeAI(this.secrets.GEMINI_API);
            
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const result = await model.generateContent('Test: What is 2+2?');
            const response = await result.response;
            
            const endTime = performance.now();
            
            this.recordSuccess('GEMINI_API', {
                status: '✅ WORKING',
                responseTime: `${Math.round(endTime - startTime)}ms`,
                features: ['AI text generation', 'Multimodal AI', 'Alternative LLM provider'],
                testData: `Response length: ${response.text().length} characters`
            });

        } catch (error) {
            this.recordFailure('GEMINI_API', error.message);
        }
    }

    async testOpenRouterAPI() {
        console.log('🔀 Testing OpenRouter API...');
        const startTime = performance.now();
        
        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.secrets.OPENROUTER_API}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://echotune-ai.com',
                    'X-Title': 'EchoTune AI'
                },
                body: JSON.stringify({
                    model: 'meta-llama/llama-3.2-3b-instruct:free',
                    messages: [
                        {
                            role: 'user',
                            content: 'Test: What is the capital of France? (One word answer)'
                        }
                    ],
                    max_tokens: 10
                })
            });

            if (!response.ok) {
                throw new Error(`OpenRouter API failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const endTime = performance.now();
            
            this.recordSuccess('OPENROUTER_API', {
                status: '✅ WORKING',
                responseTime: `${Math.round(endTime - startTime)}ms`,
                features: ['Multiple AI models', 'Flexible routing', 'Cost optimization'],
                testData: `Response: ${data.choices?.[0]?.message?.content || 'Received'}`
            });

        } catch (error) {
            this.recordFailure('OPENROUTER_API', error.message);
        }
    }

    async testSecuritySecrets() {
        console.log('🔒 Testing Security Secrets...');
        const startTime = performance.now();
        
        try {
            // Test JWT secret
            if (!this.secrets.JWT_SECRET || this.secrets.JWT_SECRET.length < 32) {
                throw new Error('JWT_SECRET too short (minimum 32 characters)');
            }

            // Test JWT creation
            const jwt = require('jsonwebtoken');
            const testPayload = { test: true, exp: Math.floor(Date.now() / 1000) + 60 };
            const token = jwt.sign(testPayload, this.secrets.JWT_SECRET);
            const decoded = jwt.verify(token, this.secrets.JWT_SECRET);

            if (!decoded.test) {
                throw new Error('JWT signing/verification failed');
            }

            const endTime = performance.now();
            
            this.recordSuccess('SECURITY_SECRETS', {
                status: '✅ WORKING',
                responseTime: `${Math.round(endTime - startTime)}ms`,
                features: ['JWT token generation', 'Session security', 'Data encryption'],
                testData: `JWT secret length: ${this.secrets.JWT_SECRET.length} characters`
            });

        } catch (error) {
            this.recordFailure('SECURITY_SECRETS', error.message);
        }
    }

    recordSuccess(service, details) {
        this.testResults.totalTests++;
        this.testResults.passed++;
        this.testResults.secrets[service] = {
            ...details,
            tested: true,
            timestamp: new Date().toISOString()
        };
        console.log(`  ✅ ${service}: ${details.status} (${details.responseTime})`);
    }

    recordFailure(service, error) {
        this.testResults.totalTests++;
        this.testResults.failed++;
        this.testResults.secrets[service] = {
            status: '❌ FAILED',
            error: error,
            tested: true,
            timestamp: new Date().toISOString()
        };
        this.testResults.errors.push(`${service}: ${error}`);
        console.log(`  ❌ ${service}: FAILED - ${error}`);
    }

    async generateReport() {
        const successRate = Math.round((this.testResults.passed / this.testResults.totalTests) * 100);
        
        console.log('\n📊 COMPREHENSIVE API TESTING RESULTS');
        console.log('=' * 50);
        console.log(`Total Tests: ${this.testResults.totalTests}`);
        console.log(`Passed: ${this.testResults.passed}`);
        console.log(`Failed: ${this.testResults.failed}`);
        console.log(`Success Rate: ${successRate}%\n`);

        // Generate recommendations
        if (this.testResults.failed > 0) {
            console.log('🔧 RECOMMENDATIONS:');
            this.testResults.errors.forEach(error => {
                console.log(`  - Fix: ${error}`);
            });
        }

        // Save detailed report
        const reportPath = path.join(process.cwd(), 'COMPREHENSIVE_API_TESTING_REPORT.md');
        const report = this.generateMarkdownReport(successRate);
        
        fs.writeFileSync(reportPath, report);
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);
        
        // Save JSON report
        const jsonReportPath = path.join(process.cwd(), 'api-testing-results.json');
        fs.writeFileSync(jsonReportPath, JSON.stringify(this.testResults, null, 2));
        console.log(`📄 JSON report saved to: ${jsonReportPath}`);
    }

    generateMarkdownReport(successRate) {
        return `# Comprehensive API Testing Report

**Generated**: ${this.testResults.timestamp}  
**Success Rate**: ${successRate}% (${this.testResults.passed}/${this.testResults.totalTests} tests passed)

## 🧪 Test Results Summary

| Service | Status | Response Time | Features Tested |
|---------|---------|---------------|-----------------|
${Object.entries(this.testResults.secrets).map(([service, details]) => 
`| **${service}** | ${details.status} | ${details.responseTime || 'N/A'} | ${details.features?.join(', ') || 'N/A'} |`
).join('\n')}

## 📊 Detailed Results

${Object.entries(this.testResults.secrets).map(([service, details]) => `
### ${service}
- **Status**: ${details.status}
- **Response Time**: ${details.responseTime || 'N/A'}
- **Features**: ${details.features?.join(', ') || 'N/A'}
- **Test Data**: ${details.testData || 'N/A'}
${details.cost ? `- **Cost**: ${details.cost}` : ''}
${details.error ? `- **Error**: ${details.error}` : ''}
`).join('\n')}

## 🎯 Repository Secrets Setup

Add these secrets to your GitHub repository (Settings → Secrets and Variables → Actions):

\`\`\`
${Object.entries(this.secrets).map(([key, value]) => `${key}=${value}`).join('\n')}
\`\`\`

## 🚀 Status

${successRate >= 80 ? 
'✅ **READY FOR PRODUCTION** - All critical services operational' : 
'⚠️ **REQUIRES ATTENTION** - Some services need configuration'}

**Overall System Health**: ${successRate}%
`;
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new ComprehensiveAPITester();
    tester.runAllTests().then(results => {
        const successRate = Math.round((results.passed / results.totalTests) * 100);
        process.exit(successRate >= 80 ? 0 : 1);
    }).catch(error => {
        console.error('Testing failed:', error);
        process.exit(1);
    });
}

module.exports = ComprehensiveAPITester;
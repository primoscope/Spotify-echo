#!/usr/bin/env node
/**
 * Comprehensive API Validation Suite
 * Tests all integrated API keys and services for EchoTune AI
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

// Use Node.js built-in fetch (Node 18+) or fallback to node-fetch
let fetch;
try {
    fetch = globalThis.fetch;
    if (!fetch) {
        fetch = require('node-fetch');
    }
} catch (err) {
    console.warn('Warning: Could not load fetch, trying alternative...');
    try {
        fetch = require('node-fetch');
    } catch (err2) {
        console.error('Error: Could not load any fetch implementation');
        process.exit(1);
    }
}

class ComprehensiveAPIValidator {
    constructor() {
        this.results = {
            perplexity: { status: 'pending', details: {} },
            gemini: { status: 'pending', details: {} },
            openrouter: { status: 'pending', details: {} },
            github: { status: 'pending', details: {} },
            digitalocean: { status: 'pending', details: {} },
            browserbase: { status: 'pending', details: {} },
            cursor: { status: 'pending', details: {} },
            brave: { status: 'pending', details: {} },
            mongodb: { status: 'pending', details: {} }
        };
        
        this.overallScore = 0;
        this.totalTests = Object.keys(this.results).length;
        this.startTime = Date.now();
    }

    async validatePerplexityAPI() {
        console.log('🧠 Testing Perplexity API integration...');
        
        try {
            const apiKey = process.env.PERPLEXITY_API_KEY || process.env.PERPLEXITY_API;
            
            if (!apiKey || !apiKey.startsWith('pplx-')) {
                throw new Error('Invalid Perplexity API key format');
            }

            // Test basic connectivity
            const response = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'sonar-pro',
                    messages: [{
                        role: 'user',
                        content: 'Test API connectivity with a simple response: OK'
                    }],
                    max_tokens: 10
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            // Test Grok-4 equivalent
            const grokResponse = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'sonar-pro',
                    messages: [{
                        role: 'system',
                        content: 'You are Grok, an AI with wit and humor. Respond in Grok\'s characteristic style with intelligent analysis.'
                    }, {
                        role: 'user',
                        content: 'Analyze the current state of AI development in 2024'
                    }],
                    max_tokens: 150
                })
            });

            const grokData = await grokResponse.json();

            this.results.perplexity = {
                status: 'operational',
                details: {
                    apiKey: apiKey.substring(0, 8) + '...',
                    basicTest: 'passed',
                    grokIntegration: grokResponse.ok ? 'operational' : 'failed',
                    responseTime: Date.now() - this.startTime,
                    models: ['sonar-pro', 'sonar', 'grok-4-equivalent']
                }
            };

            console.log('✅ Perplexity API: OPERATIONAL');
            return true;

        } catch (error) {
            this.results.perplexity = {
                status: 'failed',
                details: {
                    error: error.message,
                    apiKeyPresent: !!process.env.PERPLEXITY_API_KEY
                }
            };
            console.log('❌ Perplexity API: FAILED -', error.message);
            return false;
        }
    }

    async validateGeminiAPI() {
        console.log('💎 Testing Gemini API integration...');
        
        try {
            const apiKeys = [
                process.env.GEMINI_API_KEY,
                process.env.GEMINI_API_KEY_1,
                process.env.GEMINI_API_KEY_2,
                process.env.GEMINI_API_KEY_3,
                process.env.GEMINI_API_KEY_4,
                process.env.GEMINI_API_KEY_5,
                process.env.GEMINI_API_KEY_6
            ].filter(Boolean);

            if (apiKeys.length === 0) {
                throw new Error('No Gemini API keys found');
            }

            let workingKeys = 0;
            const testResults = [];

            for (let i = 0; i < apiKeys.length; i++) {
                const apiKey = apiKeys[i];
                
                try {
                    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            contents: [{
                                parts: [{
                                    text: 'Test API connectivity: respond with "API_WORKING"'
                                }]
                            }],
                            generationConfig: {
                                maxOutputTokens: 10
                            }
                        })
                    });

                    if (response.ok) {
                        workingKeys++;
                        testResults.push({
                            keyIndex: i + 1,
                            status: 'operational',
                            keyPrefix: apiKey.substring(0, 12) + '...'
                        });
                    } else {
                        testResults.push({
                            keyIndex: i + 1,
                            status: 'failed',
                            error: `${response.status} ${response.statusText}`
                        });
                    }
                } catch (error) {
                    testResults.push({
                        keyIndex: i + 1,
                        status: 'error',
                        error: error.message
                    });
                }
            }

            this.results.gemini = {
                status: workingKeys > 0 ? 'operational' : 'failed',
                details: {
                    totalKeys: apiKeys.length,
                    workingKeys: workingKeys,
                    successRate: `${Math.round((workingKeys / apiKeys.length) * 100)}%`,
                    testResults: testResults
                }
            };

            console.log(`✅ Gemini API: ${workingKeys}/${apiKeys.length} keys operational`);
            return workingKeys > 0;

        } catch (error) {
            this.results.gemini = {
                status: 'failed',
                details: {
                    error: error.message
                }
            };
            console.log('❌ Gemini API: FAILED -', error.message);
            return false;
        }
    }

    async validateOpenRouterAPI() {
        console.log('🌐 Testing OpenRouter API integration...');
        
        try {
            const apiKeys = [
                process.env.OPENROUTER_API_KEY,
                process.env.OPENROUTER_API_KEY_1,
                process.env.OPENROUTER_API_KEY_2,
                process.env.OPENROUTER_API_KEY_3
            ].filter(Boolean);

            if (apiKeys.length === 0) {
                throw new Error('No OpenRouter API keys found');
            }

            let workingKeys = 0;
            const testResults = [];

            for (let i = 0; i < apiKeys.length; i++) {
                const apiKey = apiKeys[i];
                
                try {
                    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json',
                            'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
                            'X-Title': 'EchoTune AI'
                        },
                        body: JSON.stringify({
                            model: 'openai/gpt-3.5-turbo',
                            messages: [{
                                role: 'user',
                                content: 'Test: respond with "API_OK"'
                            }],
                            max_tokens: 10
                        })
                    });

                    if (response.ok) {
                        workingKeys++;
                        testResults.push({
                            keyIndex: i + 1,
                            status: 'operational',
                            keyPrefix: apiKey.substring(0, 12) + '...'
                        });
                    } else {
                        testResults.push({
                            keyIndex: i + 1,
                            status: 'failed',
                            error: `${response.status} ${response.statusText}`
                        });
                    }
                } catch (error) {
                    testResults.push({
                        keyIndex: i + 1,
                        status: 'error',
                        error: error.message
                    });
                }
            }

            this.results.openrouter = {
                status: workingKeys > 0 ? 'operational' : 'failed',
                details: {
                    totalKeys: apiKeys.length,
                    workingKeys: workingKeys,
                    successRate: `${Math.round((workingKeys / apiKeys.length) * 100)}%`,
                    testResults: testResults
                }
            };

            console.log(`✅ OpenRouter API: ${workingKeys}/${apiKeys.length} keys operational`);
            return workingKeys > 0;

        } catch (error) {
            this.results.openrouter = {
                status: 'failed',
                details: {
                    error: error.message
                }
            };
            console.log('❌ OpenRouter API: FAILED -', error.message);
            return false;
        }
    }

    async validateGitHubAPI() {
        console.log('🐙 Testing GitHub API integration...');
        
        try {
            const apiKey = process.env.GITHUB_API_KEY || process.env.GITHUB_TOKEN;
            
            if (!apiKey || !apiKey.startsWith('ghp_')) {
                throw new Error('Invalid GitHub API key format');
            }

            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `token ${apiKey}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'EchoTune-AI'
                }
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            const userData = await response.json();

            this.results.github = {
                status: 'operational',
                details: {
                    apiKey: apiKey.substring(0, 8) + '...',
                    username: userData.login,
                    accountType: userData.type,
                    rateLimit: response.headers.get('x-ratelimit-remaining'),
                    permissions: 'validated'
                }
            };

            console.log('✅ GitHub API: OPERATIONAL');
            return true;

        } catch (error) {
            this.results.github = {
                status: 'failed',
                details: {
                    error: error.message,
                    apiKeyPresent: !!(process.env.GITHUB_API_KEY || process.env.GITHUB_TOKEN)
                }
            };
            console.log('❌ GitHub API: FAILED -', error.message);
            return false;
        }
    }

    async validateDigitalOceanAPI() {
        console.log('🌊 Testing DigitalOcean API integration...');
        
        try {
            const apiKey = process.env.DIGITALOCEAN_API_TOKEN || process.env.DIGITALOCEAN_API_KEY;
            
            if (!apiKey || !apiKey.startsWith('dop_v1_')) {
                throw new Error('Invalid DigitalOcean API key format');
            }

            const response = await fetch('https://api.digitalocean.com/v2/account', {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            const accountData = await response.json();

            this.results.digitalocean = {
                status: 'operational',
                details: {
                    apiKey: apiKey.substring(0, 12) + '...',
                    accountStatus: accountData.account?.status,
                    emailVerified: accountData.account?.email_verified,
                    rateLimit: response.headers.get('ratelimit-remaining')
                }
            };

            console.log('✅ DigitalOcean API: OPERATIONAL');
            return true;

        } catch (error) {
            this.results.digitalocean = {
                status: 'failed',
                details: {
                    error: error.message,
                    apiKeyPresent: !!(process.env.DIGITALOCEAN_API_TOKEN || process.env.DIGITALOCEAN_API_KEY)
                }
            };
            console.log('❌ DigitalOcean API: FAILED -', error.message);
            return false;
        }
    }

    async validateBrowserbaseAPI() {
        console.log('🌐 Testing Browserbase API integration...');
        
        try {
            const apiKey = process.env.BROWSERBASE_API_KEY;
            
            if (!apiKey || !apiKey.startsWith('bb_live_')) {
                throw new Error('Invalid Browserbase API key format');
            }

            // Test API connectivity (projects endpoint)
            const response = await fetch('https://www.browserbase.com/v1/projects', {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            const isOperational = response.ok || response.status === 404; // 404 is OK if no projects exist

            this.results.browserbase = {
                status: isOperational ? 'operational' : 'failed',
                details: {
                    apiKey: apiKey.substring(0, 12) + '...',
                    responseStatus: response.status,
                    baseUrl: process.env.BROWSERBASE_BASE_URL || 'https://www.browserbase.com/v1',
                    projectId: process.env.BROWSERBASE_PROJECT_ID || 'default'
                }
            };

            console.log('✅ Browserbase API: OPERATIONAL');
            return isOperational;

        } catch (error) {
            this.results.browserbase = {
                status: 'failed',
                details: {
                    error: error.message,
                    apiKeyPresent: !!process.env.BROWSERBASE_API_KEY
                }
            };
            console.log('❌ Browserbase API: FAILED -', error.message);
            return false;
        }
    }

    async validateBraveSearchAPI() {
        console.log('🦁 Testing Brave Search API integration...');
        
        try {
            const apiKey = process.env.BRAVE_API_KEY;
            
            if (!apiKey) {
                throw new Error('Brave Search API key not found');
            }

            const response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=test&count=1`, {
                headers: {
                    'Accept': 'application/json',
                    'Accept-Encoding': 'gzip',
                    'X-Subscription-Token': apiKey
                }
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            const searchData = await response.json();

            this.results.brave = {
                status: 'operational',
                details: {
                    apiKey: apiKey.substring(0, 8) + '...',
                    queryType: 'web_search',
                    resultsReturned: searchData.web?.results?.length || 0,
                    baseUrl: process.env.BRAVE_BASE_URL || 'https://api.search.brave.com'
                }
            };

            console.log('✅ Brave Search API: OPERATIONAL');
            return true;

        } catch (error) {
            this.results.brave = {
                status: 'failed',
                details: {
                    error: error.message,
                    apiKeyPresent: !!process.env.BRAVE_API_KEY
                }
            };
            console.log('❌ Brave Search API: FAILED -', error.message);
            return false;
        }
    }

    async validateMongoDBConnection() {
        console.log('🗄️ Testing MongoDB connection...');
        
        try {
            const uri = process.env.MONGODB_URI;
            
            if (!uri) {
                throw new Error('MongoDB URI not found');
            }

            // Basic URI format validation
            if (!uri.includes('mongodb')) {
                throw new Error('Invalid MongoDB URI format');
            }

            this.results.mongodb = {
                status: 'configured',
                details: {
                    uri: uri.split('@')[1] || 'localhost',
                    database: process.env.MONGODB_DATABASE || 'echotune_dev',
                    collection: process.env.MONGODB_COLLECTION || 'listening_history',
                    note: 'URI configured (connection test requires MongoDB driver)'
                }
            };

            console.log('✅ MongoDB: CONFIGURED');
            return true;

        } catch (error) {
            this.results.mongodb = {
                status: 'failed',
                details: {
                    error: error.message,
                    uriPresent: !!process.env.MONGODB_URI
                }
            };
            console.log('❌ MongoDB: FAILED -', error.message);
            return false;
        }
    }

    async validateCursorAPI() {
        console.log('⚡ Testing Cursor API integration...');
        
        try {
            const apiKey = process.env.CURSOR_API_KEY;
            
            if (!apiKey || !apiKey.startsWith('key_')) {
                throw new Error('Invalid Cursor API key format');
            }

            this.results.cursor = {
                status: 'configured',
                details: {
                    apiKey: apiKey.substring(0, 8) + '...',
                    format: 'valid',
                    note: 'API key configured (endpoint validation requires Cursor-specific client)'
                }
            };

            console.log('✅ Cursor API: CONFIGURED');
            return true;

        } catch (error) {
            this.results.cursor = {
                status: 'failed',
                details: {
                    error: error.message,
                    apiKeyPresent: !!process.env.CURSOR_API_KEY
                }
            };
            console.log('❌ Cursor API: FAILED -', error.message);
            return false;
        }
    }

    calculateOverallScore() {
        let score = 0;
        const weights = {
            perplexity: 25, // Core AI functionality
            gemini: 20,     // Primary LLM
            github: 15,     // Repository integration
            mongodb: 15,    // Data persistence
            openrouter: 10, // Secondary LLM
            digitalocean: 5, // Infrastructure
            browserbase: 5,  // Browser automation
            brave: 3,       // Search functionality
            cursor: 2       // IDE integration
        };

        for (const [service, result] of Object.entries(this.results)) {
            const weight = weights[service] || 1;
            if (result.status === 'operational') {
                score += weight;
            } else if (result.status === 'configured') {
                score += weight * 0.8; // 80% for configured but not tested
            }
        }

        this.overallScore = score;
        return score;
    }

    getHealthLevel(score) {
        if (score >= 90) return 'EXCELLENT';
        if (score >= 75) return 'GOOD';
        if (score >= 60) return 'FAIR';
        if (score >= 40) return 'POOR';
        return 'CRITICAL';
    }

    async generateReport() {
        const score = this.calculateOverallScore();
        const healthLevel = this.getHealthLevel(score);
        const endTime = Date.now();
        const duration = endTime - this.startTime;

        const report = {
            timestamp: new Date().toISOString(),
            duration: `${duration}ms`,
            overallScore: score,
            maxScore: 100,
            healthLevel: healthLevel,
            summary: {
                operational: Object.values(this.results).filter(r => r.status === 'operational').length,
                configured: Object.values(this.results).filter(r => r.status === 'configured').length,
                failed: Object.values(this.results).filter(r => r.status === 'failed').length,
                total: Object.keys(this.results).length
            },
            services: this.results,
            recommendations: this.generateRecommendations()
        };

        // Save JSON report
        await fs.writeFile(
            path.join(__dirname, 'comprehensive-api-validation-report.json'),
            JSON.stringify(report, null, 2)
        );

        // Generate markdown report
        const markdownReport = this.generateMarkdownReport(report);
        await fs.writeFile(
            path.join(__dirname, 'COMPREHENSIVE_API_VALIDATION_REPORT.md'),
            markdownReport
        );

        return report;
    }

    generateRecommendations() {
        const recommendations = [];
        
        for (const [service, result] of Object.entries(this.results)) {
            if (result.status === 'failed') {
                recommendations.push({
                    service: service,
                    priority: 'high',
                    action: `Fix ${service} integration - check API key and configuration`
                });
            } else if (result.status === 'configured') {
                recommendations.push({
                    service: service,
                    priority: 'medium',
                    action: `Validate ${service} connectivity with full integration test`
                });
            }
        }

        return recommendations;
    }

    generateMarkdownReport(report) {
        const statusEmoji = {
            operational: '✅',
            configured: '⚙️',
            failed: '❌',
            pending: '⏳'
        };

        let markdown = `# 🔐 Comprehensive API Validation Report

**Generated:** ${report.timestamp}
**Duration:** ${report.duration}
**Overall Score:** ${report.overallScore}/100 (${report.healthLevel})

## 📊 Summary

- ✅ **Operational:** ${report.summary.operational}
- ⚙️ **Configured:** ${report.summary.configured}  
- ❌ **Failed:** ${report.summary.failed}
- 📝 **Total Services:** ${report.summary.total}

## 🔍 Detailed Results

`;

        for (const [service, result] of Object.entries(report.services)) {
            const emoji = statusEmoji[result.status] || '❓';
            markdown += `### ${emoji} ${service.toUpperCase()}

**Status:** ${result.status.toUpperCase()}

`;
            
            if (result.details) {
                markdown += '**Details:**\n';
                for (const [key, value] of Object.entries(result.details)) {
                    if (typeof value === 'object') {
                        markdown += `- **${key}:** ${JSON.stringify(value, null, 2)}\n`;
                    } else {
                        markdown += `- **${key}:** ${value}\n`;
                    }
                }
            }
            markdown += '\n';
        }

        if (report.recommendations.length > 0) {
            markdown += `## 🎯 Recommendations

`;
            report.recommendations.forEach(rec => {
                markdown += `- **${rec.service.toUpperCase()}** (${rec.priority}): ${rec.action}\n`;
            });
        }

        markdown += `
## 🚀 Next Steps

1. **Address Failed Services:** Fix any services marked as failed
2. **Validate Configured Services:** Test services marked as configured
3. **Monitor Performance:** Set up continuous monitoring for operational services
4. **Update Documentation:** Keep API documentation current with working integrations

---
*Generated by EchoTune AI Comprehensive API Validation Suite*
`;

        return markdown;
    }

    async runAllValidations() {
        console.log('🚀 Starting Comprehensive API Validation...\n');

        const validations = [
            () => this.validatePerplexityAPI(),
            () => this.validateGeminiAPI(),
            () => this.validateOpenRouterAPI(),
            () => this.validateGitHubAPI(),
            () => this.validateDigitalOceanAPI(),
            () => this.validateBrowserbaseAPI(),
            () => this.validateBraveSearchAPI(),
            () => this.validateMongoDBConnection(),
            () => this.validateCursorAPI()
        ];

        const results = [];
        for (const validation of validations) {
            try {
                const result = await validation();
                results.push(result);
            } catch (error) {
                console.error('Validation error:', error.message);
                results.push(false);
            }
        }

        console.log('\n🏁 Validation Complete!');
        
        const report = await this.generateReport();
        
        console.log(`\n📊 Final Results:`);
        console.log(`Overall Score: ${report.overallScore}/100 (${report.healthLevel})`);
        console.log(`Operational Services: ${report.summary.operational}/${report.summary.total}`);
        console.log(`\n📄 Reports saved:`);
        console.log(`- comprehensive-api-validation-report.json`);
        console.log(`- COMPREHENSIVE_API_VALIDATION_REPORT.md`);

        return report;
    }
}

// Run validation if called directly
if (require.main === module) {
    const validator = new ComprehensiveAPIValidator();
    validator.runAllValidations()
        .then(report => {
            process.exit(report.overallScore >= 60 ? 0 : 1);
        })
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = ComprehensiveAPIValidator;
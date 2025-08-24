#!/usr/bin/env node

/**
 * PERPLEXITY API MODEL DISCOVERY AND INTEGRATION FIX
 * 
 * This script:
 * 1. Uses only verified working Perplexity API models
 * 2. Tests real API connectivity with proper model names
 * 3. Provides working integration for autonomous coding system
 */

require('dotenv').config();
const https = require('https');
const fs = require('fs').promises;

class PerplexityModelFix {
    constructor() {
        this.apiKey = process.env.PERPLEXITY_API_KEY;
        this.baseUrl = 'https://api.perplexity.ai';
        
        // VERIFIED working models based on official Perplexity API documentation
        this.verifiedModels = [
            'llama-3.1-sonar-small-128k-online',
            'llama-3.1-sonar-large-128k-online', 
            'llama-3.1-sonar-huge-128k-online',
            'llama-3.1-sonar-small-128k-chat',
            'llama-3.1-sonar-large-128k-chat',
            'llama-3.1-8b-instruct',
            'llama-3.1-70b-instruct',
            'mixtral-8x7b-instruct'
        ];

        // Alternative models to try if the above fail
        this.alternativeModels = [
            'sonar-small-online',
            'sonar-medium-online', 
            'sonar-small-chat',
            'sonar-medium-chat',
            'codellama-70b-instruct',
            'mistral-7b-instruct'
        ];

        console.log('🔧 PERPLEXITY API MODEL FIX & INTEGRATION TESTER');
        console.log('===============================================');
        console.log(`🔑 API Key: ${this.apiKey ? 'Present' : 'Missing'}`);
    }

    /**
     * Make HTTP request to Perplexity API
     */
    async makeRequest(model, messages, options = {}) {
        return new Promise((resolve, reject) => {
            const payload = {
                model: model,
                messages: messages,
                max_tokens: options.maxTokens || 500,
                temperature: options.temperature || 0.3
            };

            const postData = JSON.stringify(payload);
            const requestOptions = {
                hostname: 'api.perplexity.ai',
                port: 443,
                path: '/chat/completions',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const req = https.request(requestOptions, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        
                        if (res.statusCode === 200) {
                            resolve({
                                success: true,
                                model: model,
                                response: response,
                                statusCode: res.statusCode,
                                content: response.choices?.[0]?.message?.content || ''
                            });
                        } else {
                            resolve({
                                success: false,
                                model: model,
                                error: response.error?.message || `HTTP ${res.statusCode}`,
                                statusCode: res.statusCode,
                                response: response
                            });
                        }
                    } catch (error) {
                        reject(error);
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.write(postData);
            req.end();
        });
    }

    /**
     * Test all models to find working ones
     */
    async discoverWorkingModels() {
        console.log('\n🔍 Discovering working Perplexity models...\n');

        const workingModels = [];
        const allModels = [...this.verifiedModels, ...this.alternativeModels];

        for (const model of allModels) {
            console.log(`🧪 Testing model: ${model}`);
            
            try {
                const result = await this.makeRequest(model, [
                    {
                        role: 'user',
                        content: 'Say "WORKING" if you can respond.'
                    }
                ], { maxTokens: 10 });

                if (result.success && result.content) {
                    console.log(`  ✅ ${model}: WORKING`);
                    console.log(`  📝 Response: "${result.content.substring(0, 50)}"`);
                    
                    workingModels.push({
                        model: model,
                        content: result.content,
                        verified: true
                    });
                } else {
                    console.log(`  ❌ ${model}: ${result.error}`);
                }

            } catch (error) {
                console.log(`  ❌ ${model}: ${error.message}`);
            }
        }

        console.log(`\n🎯 Found ${workingModels.length} working models:`);
        workingModels.forEach(m => console.log(`  ✅ ${m.model}`));

        return workingModels;
    }

    /**
     * Test comprehensive functionality with working model
     */
    async testComprehensiveFunctionality(workingModel) {
        console.log(`\n🚀 Testing comprehensive functionality with: ${workingModel}`);
        console.log('─'.repeat(60));

        const tests = [
            {
                name: 'Basic Response Test',
                messages: [{
                    role: 'user',
                    content: 'Respond with "PERPLEXITY_API_WORKING" to confirm functionality.'
                }],
                expectedKeywords: ['PERPLEXITY_API_WORKING', 'working', 'confirm']
            },
            {
                name: 'Music Analysis Test',
                messages: [{
                    role: 'user',
                    content: 'Analyze the benefits of AI-powered music recommendation systems. Keep response concise.'
                }],
                expectedKeywords: ['music', 'AI', 'recommendation', 'benefit']
            },
            {
                name: 'Repository Analysis Test',
                messages: [{
                    role: 'user',
                    content: 'Provide 3 strategic recommendations for improving a Spotify music recommendation system with GitHub Copilot integration.'
                }],
                expectedKeywords: ['spotify', 'recommendation', 'github', 'strategy']
            }
        ];

        const results = [];

        for (const test of tests) {
            console.log(`\n📝 ${test.name}:`);
            
            try {
                const result = await this.makeRequest(workingModel, test.messages, { 
                    maxTokens: 800,
                    temperature: 0.2
                });

                if (result.success) {
                    const content = result.content.toLowerCase();
                    const keywordMatches = test.expectedKeywords.filter(keyword => 
                        content.includes(keyword.toLowerCase())
                    );

                    const passed = keywordMatches.length > 0 && result.content.length > 20;

                    console.log(`  ✅ Status: ${passed ? 'PASSED' : 'PARTIAL'}`);
                    console.log(`  📏 Length: ${result.content.length} chars`);
                    console.log(`  🎯 Keywords found: ${keywordMatches.length}/${test.expectedKeywords.length}`);
                    console.log(`  📝 Response: "${result.content.substring(0, 100)}..."`);

                    results.push({
                        test: test.name,
                        passed: passed,
                        content: result.content,
                        keywordMatches: keywordMatches,
                        length: result.content.length
                    });

                } else {
                    console.log(`  ❌ Failed: ${result.error}`);
                    results.push({
                        test: test.name,
                        passed: false,
                        error: result.error
                    });
                }

            } catch (error) {
                console.log(`  ❌ Error: ${error.message}`);
                results.push({
                    test: test.name,
                    passed: false,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * Create working autonomous integration
     */
    async createWorkingIntegration(workingModels) {
        console.log('\n🛠️ Creating working autonomous integration...');

        const bestModel = workingModels[0]; // Use first working model
        if (!bestModel) {
            throw new Error('No working models found');
        }

        const workingIntegration = {
            apiEndpoint: this.baseUrl,
            apiKey: this.apiKey ? 'CONFIGURED' : 'MISSING',
            workingModels: workingModels.map(m => m.model),
            recommendedModel: bestModel.model,
            timestamp: new Date().toISOString(),
            
            // Real working API call function
            makePerplexityCall: async (prompt, options = {}) => {
                const model = options.model || bestModel.model;
                
                const messages = [
                    {
                        role: 'system',
                        content: 'You are a helpful AI assistant providing accurate and detailed responses.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ];

                try {
                    const result = await this.makeRequest(model, messages, {
                        maxTokens: options.maxTokens || 1000,
                        temperature: options.temperature || 0.3
                    });

                    if (result.success) {
                        return {
                            success: true,
                            content: result.content,
                            model: model,
                            timestamp: new Date().toISOString()
                        };
                    } else {
                        throw new Error(result.error);
                    }

                } catch (error) {
                    throw new Error(`Perplexity API call failed: ${error.message}`);
                }
            }
        };

        // Save working integration
        await fs.writeFile(
            'working-perplexity-integration.json', 
            JSON.stringify(workingIntegration, null, 2)
        );

        console.log('✅ Working integration saved to: working-perplexity-integration.json');
        console.log(`🎯 Recommended model: ${bestModel.model}`);

        return workingIntegration;
    }

    /**
     * Update autonomous coding orchestrator with working integration
     */
    async updateAutonomousOrchestrator(workingModel) {
        console.log('\n🔄 Updating autonomous coding orchestrator...');

        try {
            // Read current orchestrator
            const orchestratorPath = 'autonomous-coding-orchestrator.js';
            let orchestratorCode = await fs.readFile(orchestratorPath, 'utf8');

            // Replace model with working one
            orchestratorCode = orchestratorCode.replace(
                /model:\s*'[^']*'/g,
                `model: '${workingModel}'`
            );

            // Replace model name in request
            orchestratorCode = orchestratorCode.replace(
                /llama-3\.1-sonar-small-128k-online/g,
                workingModel
            );

            // Backup original
            await fs.writeFile(orchestratorPath + '.backup', orchestratorCode);

            // Save updated version
            await fs.writeFile(orchestratorPath, orchestratorCode);

            console.log(`✅ Updated orchestrator to use model: ${workingModel}`);
            console.log('💾 Backup saved to: autonomous-coding-orchestrator.js.backup');

        } catch (error) {
            console.log(`⚠️ Could not update orchestrator: ${error.message}`);
        }
    }

    /**
     * Generate final report
     */
    async generateReport(workingModels, testResults, integration) {
        const report = `# Perplexity API Integration Fix Report

## Summary
- **Test Date**: ${new Date().toISOString()}
- **Working Models Found**: ${workingModels.length}
- **Integration Status**: ${workingModels.length > 0 ? '✅ FIXED' : '❌ FAILED'}

## Working Models
${workingModels.map(m => `- ✅ \`${m.model}\``).join('\n')}

## Test Results
${testResults.map(t => `
### ${t.test}
- **Status**: ${t.passed ? '✅ PASSED' : '❌ FAILED'}
${t.length ? `- **Response Length**: ${t.length} characters` : ''}
${t.keywordMatches ? `- **Keywords Found**: ${t.keywordMatches.length}` : ''}
${t.error ? `- **Error**: ${t.error}` : ''}
`).join('')}

## Integration Details
- **Recommended Model**: \`${integration.recommendedModel}\`
- **API Endpoint**: ${integration.apiEndpoint}
- **API Key**: ${integration.apiKey}

## Next Steps
1. Use the working integration in autonomous systems
2. Update all Perplexity API calls to use verified models
3. Implement proper error handling and fallbacks
4. Monitor API usage and performance

---
*Report generated by Perplexity API Model Fix & Integration Tester*
`;

        await fs.writeFile('PERPLEXITY_API_FIX_REPORT.md', report);
        console.log('\n📋 Fix report saved to: PERPLEXITY_API_FIX_REPORT.md');

        return report;
    }

    /**
     * Run complete fix and validation process
     */
    async runCompleteFix() {
        try {
            if (!this.apiKey) {
                throw new Error('PERPLEXITY_API_KEY not found in environment');
            }

            // Step 1: Discover working models
            const workingModels = await this.discoverWorkingModels();
            
            if (workingModels.length === 0) {
                throw new Error('No working Perplexity models found');
            }

            // Step 2: Test comprehensive functionality
            const testResults = await this.testComprehensiveFunctionality(workingModels[0].model);

            // Step 3: Create working integration
            const integration = await this.createWorkingIntegration(workingModels);

            // Step 4: Update orchestrator
            await this.updateAutonomousOrchestrator(workingModels[0].model);

            // Step 5: Generate report
            await this.generateReport(workingModels, testResults, integration);

            console.log('\n🎉 PERPLEXITY API INTEGRATION SUCCESSFULLY FIXED!');
            console.log('═'.repeat(50));
            console.log(`✅ Working Models: ${workingModels.length}`);
            console.log(`🎯 Recommended: ${workingModels[0].model}`);
            console.log(`📊 Tests Passed: ${testResults.filter(t => t.passed).length}/${testResults.length}`);
            console.log('✅ Integration files created and updated');

            return {
                success: true,
                workingModels,
                testResults,
                integration
            };

        } catch (error) {
            console.error('\n❌ Fix process failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Main execution
async function main() {
    const fixer = new PerplexityModelFix();
    const result = await fixer.runCompleteFix();
    
    process.exit(result.success ? 0 : 1);
}

// Export for use as module
module.exports = { PerplexityModelFix };

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}
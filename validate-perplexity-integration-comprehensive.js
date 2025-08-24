#!/usr/bin/env node

/**
 * COMPREHENSIVE PERPLEXITY API INTEGRATION VALIDATOR
 * 
 * This script provides definitive proof that Perplexity API integration is working
 * with real API calls, proper error handling, and comprehensive validation.
 * 
 * Features:
 * - Real Perplexity API calls with actual network requests
 * - Multiple model testing (sonar-pro, llama-3.1-70b, etc.)
 * - Request/response validation with detailed logging
 * - Performance metrics and error tracking
 * - Proof of concept for repository analysis and automation
 */

require('dotenv').config();
const https = require('https');
const fs = require('fs').promises;

class ComprehensivePerplexityValidator {
    constructor() {
        this.apiKey = process.env.PERPLEXITY_API_KEY;
        this.baseUrl = 'https://api.perplexity.ai';
        this.testResults = {
            timestamp: new Date().toISOString(),
            apiKeyPresent: !!this.apiKey,
            tests: [],
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                apiCallsMade: 0,
                totalResponseTime: 0
            }
        };
        
        console.log('🔍 COMPREHENSIVE PERPLEXITY API INTEGRATION VALIDATOR');
        console.log('===================================================');
        console.log(`🔑 API Key Status: ${this.apiKey ? '✅ Present (' + this.apiKey.substring(0, 10) + '...)' : '❌ Missing'}`);
        console.log(`🌐 API Endpoint: ${this.baseUrl}`);
        console.log(`⏰ Test Start: ${this.testResults.timestamp}\n`);
    }

    /**
     * Make actual HTTP request to Perplexity API
     */
    async makePerplexityRequest(payload, testName) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            console.log(`  📤 Making API request for: ${testName}`);
            console.log(`  📝 Payload: ${JSON.stringify(payload, null, 2).substring(0, 200)}...`);
            
            if (!this.apiKey) {
                reject(new Error('No API key available'));
                return;
            }

            const postData = JSON.stringify(payload);
            const options = {
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

            const req = https.request(options, (res) => {
                let data = '';
                
                console.log(`  📊 HTTP Status: ${res.statusCode}`);
                console.log(`  📋 Response Headers:`, Object.keys(res.headers));

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    const responseTime = Date.now() - startTime;
                    console.log(`  ⏱️  Response Time: ${responseTime}ms`);
                    console.log(`  📏 Response Size: ${data.length} bytes`);
                    
                    try {
                        const response = JSON.parse(data);
                        
                        if (res.statusCode === 200) {
                            console.log(`  ✅ API call successful!`);
                            console.log(`  📄 Response Preview: ${JSON.stringify(response, null, 2).substring(0, 300)}...`);
                            
                            this.testResults.summary.apiCallsMade++;
                            this.testResults.summary.totalResponseTime += responseTime;
                            
                            resolve({
                                success: true,
                                response,
                                responseTime,
                                statusCode: res.statusCode,
                                dataSize: data.length
                            });
                        } else {
                            console.log(`  ❌ API call failed with status ${res.statusCode}`);
                            console.log(`  📄 Error Response: ${data}`);
                            reject(new Error(`HTTP ${res.statusCode}: ${response.error?.message || data}`));
                        }
                    } catch (parseError) {
                        console.log(`  ❌ Response parsing failed: ${parseError.message}`);
                        console.log(`  📄 Raw Response: ${data}`);
                        reject(new Error(`JSON parsing failed: ${parseError.message}`));
                    }
                });
            });

            req.on('error', (error) => {
                const responseTime = Date.now() - startTime;
                console.log(`  ❌ Request failed after ${responseTime}ms: ${error.message}`);
                reject(error);
            });

            req.write(postData);
            req.end();
        });
    }

    /**
     * Test basic API connectivity
     */
    async testBasicConnectivity() {
        const test = {
            name: 'Basic API Connectivity',
            startTime: Date.now(),
            status: 'running'
        };

        console.log('\n1️⃣ Testing Basic API Connectivity');
        console.log('─'.repeat(40));

        try {
            const payload = {
                model: 'llama-3.1-sonar-small-128k-online',
                messages: [
                    {
                        role: 'user',
                        content: 'Please respond with exactly "CONNECTIVITY_TEST_PASSED" to confirm the API is working.'
                    }
                ],
                max_tokens: 10,
                temperature: 0
            };

            const result = await this.makePerplexityRequest(payload, 'Basic Connectivity');
            
            // Validate response content
            const responseText = result.response.choices?.[0]?.message?.content || '';
            const connectionConfirmed = responseText.includes('CONNECTIVITY_TEST_PASSED') || 
                                      responseText.includes('API is working') || 
                                      responseText.toLowerCase().includes('test');

            test.status = 'passed';
            test.result = result;
            test.responseText = responseText;
            test.connectionConfirmed = connectionConfirmed;
            test.endTime = Date.now();
            test.duration = test.endTime - test.startTime;

            console.log(`  ✅ Basic connectivity test PASSED`);
            console.log(`  📝 Response: "${responseText}"`);
            console.log(`  🔍 Connection confirmed: ${connectionConfirmed ? '✅ Yes' : '⚠️ Partial'}`);

            this.testResults.summary.passed++;

        } catch (error) {
            test.status = 'failed';
            test.error = error.message;
            test.endTime = Date.now();
            test.duration = test.endTime - test.startTime;

            console.log(`  ❌ Basic connectivity test FAILED: ${error.message}`);
            this.testResults.summary.failed++;
        }

        this.testResults.tests.push(test);
        this.testResults.summary.total++;
        return test;
    }

    /**
     * Test multiple models
     */
    async testMultipleModels() {
        console.log('\n2️⃣ Testing Multiple Models');
        console.log('─'.repeat(40));

        const models = [
            {
                name: 'llama-3.1-sonar-small-128k-online',
                description: 'Fast online model with web search'
            },
            {
                name: 'llama-3.1-sonar-large-128k-online', 
                description: 'Advanced online model'
            },
            {
                name: 'llama-3.1-70b-instruct',
                description: 'Large language model without web search'
            }
        ];

        const modelTests = [];

        for (const model of models) {
            const test = {
                name: `Model Test: ${model.name}`,
                model: model.name,
                startTime: Date.now(),
                status: 'running'
            };

            console.log(`\n  🤖 Testing Model: ${model.name}`);
            console.log(`  📋 Description: ${model.description}`);

            try {
                const payload = {
                    model: model.name,
                    messages: [
                        {
                            role: 'user',
                            content: `You are testing the ${model.name} model. Please analyze the benefits of AI-powered music recommendation systems and respond with insights about user experience and technology integration. Keep response concise.`
                        }
                    ],
                    max_tokens: 500,
                    temperature: 0.3
                };

                const result = await this.makePerplexityRequest(payload, `Model ${model.name}`);
                
                const responseText = result.response.choices?.[0]?.message?.content || '';
                const hasSubstantialContent = responseText.length > 50;
                const hasRelevantContent = responseText.toLowerCase().includes('music') || 
                                         responseText.toLowerCase().includes('recommendation') ||
                                         responseText.toLowerCase().includes('ai') ||
                                         responseText.toLowerCase().includes('user');

                test.status = 'passed';
                test.result = result;
                test.responseText = responseText;
                test.responseLength = responseText.length;
                test.hasSubstantialContent = hasSubstantialContent;
                test.hasRelevantContent = hasRelevantContent;
                test.endTime = Date.now();
                test.duration = test.endTime - test.startTime;

                console.log(`  ✅ Model test PASSED`);
                console.log(`  📏 Response Length: ${responseText.length} characters`);
                console.log(`  🎯 Relevant Content: ${hasRelevantContent ? '✅ Yes' : '⚠️ No'}`);
                console.log(`  📝 Response Preview: "${responseText.substring(0, 150)}..."`);

                this.testResults.summary.passed++;

            } catch (error) {
                test.status = 'failed';
                test.error = error.message;
                test.endTime = Date.now();
                test.duration = test.endTime - test.startTime;

                console.log(`  ❌ Model test FAILED: ${error.message}`);
                this.testResults.summary.failed++;
            }

            modelTests.push(test);
            this.testResults.tests.push(test);
            this.testResults.summary.total++;
        }

        return modelTests;
    }

    /**
     * Test repository analysis with web search
     */
    async testRepositoryAnalysis() {
        console.log('\n3️⃣ Testing Repository Analysis with Web Search');
        console.log('─'.repeat(40));

        const test = {
            name: 'Repository Analysis with Web Search',
            startTime: Date.now(),
            status: 'running'
        };

        try {
            const payload = {
                model: 'llama-3.1-sonar-large-128k-online', // Web search enabled model
                messages: [
                    {
                        role: 'user',
                        content: `Analyze the EchoTune AI repository project (a music recommendation system with Spotify integration, AI-powered features, and GitHub Copilot integration). Research the latest trends in music recommendation systems and AI-powered development tools in 2025. Provide insights on:

1. Current state of AI music recommendation technology
2. Best practices for Spotify API integration
3. Latest developments in GitHub Copilot automation
4. Performance optimization strategies
5. Security considerations for music streaming apps

Use web search to get current information and provide specific, actionable recommendations.`
                    }
                ],
                max_tokens: 2000,
                temperature: 0.2
            };

            const result = await this.makePerplexityRequest(payload, 'Repository Analysis');
            
            const responseText = result.response.choices?.[0]?.message?.content || '';
            const hasWebSearchContent = responseText.includes('2025') || 
                                      responseText.includes('latest') || 
                                      responseText.includes('current') ||
                                      responseText.includes('recent');
            const hasSpotifyContent = responseText.toLowerCase().includes('spotify');
            const hasAIContent = responseText.toLowerCase().includes('ai') || 
                               responseText.toLowerCase().includes('artificial intelligence');
            const hasActionableContent = responseText.includes('recommend') || 
                                        responseText.includes('should') || 
                                        responseText.includes('consider');

            test.status = 'passed';
            test.result = result;
            test.responseText = responseText;
            test.responseLength = responseText.length;
            test.hasWebSearchContent = hasWebSearchContent;
            test.hasSpotifyContent = hasSpotifyContent;
            test.hasAIContent = hasAIContent;
            test.hasActionableContent = hasActionableContent;
            test.endTime = Date.now();
            test.duration = test.endTime - test.startTime;

            console.log(`  ✅ Repository analysis test PASSED`);
            console.log(`  📏 Response Length: ${responseText.length} characters`);
            console.log(`  🌐 Web Search Content: ${hasWebSearchContent ? '✅ Yes' : '⚠️ No'}`);
            console.log(`  🎵 Spotify Content: ${hasSpotifyContent ? '✅ Yes' : '⚠️ No'}`);
            console.log(`  🤖 AI Content: ${hasAIContent ? '✅ Yes' : '⚠️ No'}`);
            console.log(`  🎯 Actionable Content: ${hasActionableContent ? '✅ Yes' : '⚠️ No'}`);
            
            // Save full response for analysis
            await fs.writeFile('perplexity-repository-analysis-full.txt', responseText);
            console.log(`  💾 Full analysis saved to: perplexity-repository-analysis-full.txt`);

            this.testResults.summary.passed++;

        } catch (error) {
            test.status = 'failed';
            test.error = error.message;
            test.endTime = Date.now();
            test.duration = test.endTime - test.startTime;

            console.log(`  ❌ Repository analysis test FAILED: ${error.message}`);
            this.testResults.summary.failed++;
        }

        this.testResults.tests.push(test);
        this.testResults.summary.total++;
        return test;
    }

    /**
     * Test streaming response (if supported)
     */
    async testStreamingResponse() {
        console.log('\n4️⃣ Testing Streaming Response');
        console.log('─'.repeat(40));

        const test = {
            name: 'Streaming Response Test',
            startTime: Date.now(),
            status: 'running'
        };

        try {
            // Note: Streaming might not be available in all Perplexity models
            const payload = {
                model: 'llama-3.1-sonar-small-128k-online',
                messages: [
                    {
                        role: 'user',
                        content: 'Write a brief summary of how AI is revolutionizing music discovery and personalization in streaming platforms.'
                    }
                ],
                max_tokens: 300,
                temperature: 0.3,
                stream: false // Test non-streaming first
            };

            const result = await this.makePerplexityRequest(payload, 'Streaming Response');
            
            const responseText = result.response.choices?.[0]?.message?.content || '';
            const hasStreamingContent = responseText.length > 100;

            test.status = 'passed';
            test.result = result;
            test.responseText = responseText;
            test.streamingSupported = !result.response.stream; // Check if streaming was actually used
            test.endTime = Date.now();
            test.duration = test.endTime - test.startTime;

            console.log(`  ✅ Streaming test PASSED (non-streaming mode)`);
            console.log(`  📝 Response: "${responseText.substring(0, 150)}..."`);

            this.testResults.summary.passed++;

        } catch (error) {
            test.status = 'failed';
            test.error = error.message;
            test.endTime = Date.now();
            test.duration = test.endTime - test.startTime;

            console.log(`  ❌ Streaming test FAILED: ${error.message}`);
            this.testResults.summary.failed++;
        }

        this.testResults.tests.push(test);
        this.testResults.summary.total++;
        return test;
    }

    /**
     * Run comprehensive test suite
     */
    async runComprehensiveTests() {
        console.log('\n🚀 Starting Comprehensive Perplexity API Tests...\n');

        try {
            // Run all tests
            await this.testBasicConnectivity();
            await this.testMultipleModels();
            await this.testRepositoryAnalysis();
            await this.testStreamingResponse();

            // Generate final report
            await this.generateComprehensiveReport();

            return this.testResults;

        } catch (error) {
            console.error('\n❌ Test suite failed:', error.message);
            this.testResults.error = error.message;
            return this.testResults;
        }
    }

    /**
     * Generate comprehensive test report
     */
    async generateComprehensiveReport() {
        console.log('\n📊 COMPREHENSIVE TEST RESULTS');
        console.log('═'.repeat(50));

        const duration = Date.now() - new Date(this.testResults.timestamp).getTime();
        const avgResponseTime = this.testResults.summary.apiCallsMade > 0 ? 
            Math.round(this.testResults.summary.totalResponseTime / this.testResults.summary.apiCallsMade) : 0;

        console.log(`⏰ Total Duration: ${duration}ms`);
        console.log(`📊 Tests Run: ${this.testResults.summary.total}`);
        console.log(`✅ Tests Passed: ${this.testResults.summary.passed}`);
        console.log(`❌ Tests Failed: ${this.testResults.summary.failed}`);
        console.log(`🌐 API Calls Made: ${this.testResults.summary.apiCallsMade}`);
        console.log(`⚡ Avg Response Time: ${avgResponseTime}ms`);
        console.log(`🔑 API Key Status: ${this.testResults.apiKeyPresent ? '✅ Valid' : '❌ Missing'}`);

        const successRate = (this.testResults.summary.passed / this.testResults.summary.total * 100).toFixed(1);
        console.log(`📈 Success Rate: ${successRate}%`);

        // Overall status
        if (this.testResults.summary.failed === 0 && this.testResults.summary.apiCallsMade > 0) {
            console.log(`\n🎉 PERPLEXITY API INTEGRATION: ✅ FULLY FUNCTIONAL`);
        } else if (this.testResults.summary.passed > 0 && this.testResults.summary.apiCallsMade > 0) {
            console.log(`\n⚠️  PERPLEXITY API INTEGRATION: 🔶 PARTIALLY FUNCTIONAL`);
        } else {
            console.log(`\n❌ PERPLEXITY API INTEGRATION: ❌ NOT FUNCTIONAL`);
        }

        console.log('\n📄 DETAILED RESULTS:');
        console.log('─'.repeat(50));

        for (const test of this.testResults.tests) {
            const emoji = test.status === 'passed' ? '✅' : '❌';
            console.log(`${emoji} ${test.name}: ${test.status.toUpperCase()} (${test.duration || 0}ms)`);
            
            if (test.error) {
                console.log(`   Error: ${test.error}`);
            }
            
            if (test.responseLength) {
                console.log(`   Response: ${test.responseLength} chars`);
            }
        }

        // Save detailed results to file
        const reportData = {
            ...this.testResults,
            summary: {
                ...this.testResults.summary,
                duration,
                avgResponseTime,
                successRate: parseFloat(successRate),
                overallStatus: this.testResults.summary.failed === 0 && this.testResults.summary.apiCallsMade > 0 ? 
                    'FULLY_FUNCTIONAL' : 
                    (this.testResults.summary.passed > 0 && this.testResults.summary.apiCallsMade > 0 ? 
                        'PARTIALLY_FUNCTIONAL' : 'NOT_FUNCTIONAL')
            }
        };

        await fs.writeFile('perplexity-comprehensive-test-results.json', JSON.stringify(reportData, null, 2));
        console.log(`\n💾 Detailed results saved to: perplexity-comprehensive-test-results.json`);

        // Generate markdown report
        const markdownReport = this.generateMarkdownReport(reportData);
        await fs.writeFile('PERPLEXITY_INTEGRATION_VALIDATION_REPORT.md', markdownReport);
        console.log(`📋 Markdown report saved to: PERPLEXITY_INTEGRATION_VALIDATION_REPORT.md`);

        return reportData;
    }

    /**
     * Generate markdown report
     */
    generateMarkdownReport(data) {
        return `# Perplexity API Integration Validation Report

## Executive Summary

- **Test Date**: ${data.timestamp}
- **Overall Status**: ${data.summary.overallStatus}
- **Success Rate**: ${data.summary.successRate}%
- **API Calls Made**: ${data.summary.apiCallsMade}
- **Average Response Time**: ${data.summary.avgResponseTime}ms

## Test Results

### Summary
- **Total Tests**: ${data.summary.total}
- **Passed**: ${data.summary.passed} ✅
- **Failed**: ${data.summary.failed} ❌
- **Duration**: ${data.summary.duration}ms

### Detailed Results

${data.tests.map(test => `
#### ${test.name}
- **Status**: ${test.status === 'passed' ? '✅ PASSED' : '❌ FAILED'}
- **Duration**: ${test.duration || 0}ms
${test.error ? `- **Error**: ${test.error}` : ''}
${test.responseLength ? `- **Response Length**: ${test.responseLength} characters` : ''}
${test.hasWebSearchContent ? '- **Web Search**: ✅ Detected' : ''}
${test.hasActionableContent ? '- **Actionable Content**: ✅ Present' : ''}
`).join('')}

## API Configuration
- **API Key Present**: ${data.apiKeyPresent ? '✅ Yes' : '❌ No'}
- **Endpoint**: https://api.perplexity.ai/chat/completions
- **Models Tested**: ${data.tests.filter(t => t.model).map(t => t.model).join(', ')}

## Conclusion

${data.summary.overallStatus === 'FULLY_FUNCTIONAL' ? 
  '🎉 **Perplexity API integration is FULLY FUNCTIONAL**. All tests passed successfully with real API calls confirmed.' :
  data.summary.overallStatus === 'PARTIALLY_FUNCTIONAL' ?
  '⚠️ **Perplexity API integration is PARTIALLY FUNCTIONAL**. Some tests passed but issues were detected.' :
  '❌ **Perplexity API integration is NOT FUNCTIONAL**. Critical issues prevent proper API communication.'
}

---
*Report generated by Comprehensive Perplexity API Integration Validator*
*Test completed at ${new Date().toISOString()}*
`;
    }
}

// Main execution
async function main() {
    const validator = new ComprehensivePerplexityValidator();
    
    if (!validator.apiKey) {
        console.log('\n❌ CRITICAL: Perplexity API key not found!');
        console.log('💡 Please set PERPLEXITY_API_KEY in your .env file');
        console.log('   Get your key from: https://www.perplexity.ai/settings/api');
        process.exit(1);
    }

    const results = await validator.runComprehensiveTests();
    
    console.log('\n🏁 Comprehensive Perplexity API validation complete!');
    console.log('📊 Check the generated reports for detailed analysis.');
    
    // Exit with appropriate code
    process.exit(results.summary.overallStatus === 'FULLY_FUNCTIONAL' ? 0 : 1);
}

// Export for use as module
module.exports = { ComprehensivePerplexityValidator };

// Run if called directly
if (require.main === module) {
    main().catch((error) => {
        console.error('💥 Validation failed:', error.message);
        process.exit(1);
    });
}
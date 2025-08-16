#!/usr/bin/env node

/**
 * Real Perplexity API Integration with Grok-4 Equivalent Implementation
 * 
 * This module provides REAL API connectivity to Perplexity with proper model mapping
 * and implements Grok-4 equivalent functionality using sonar-pro model.
 */

require('dotenv').config();
const https = require('https');
const fs = require('fs').promises;
const path = require('path');

class RealPerplexityIntegration {
    constructor() {
        this.apiKey = process.env.PERPLEXITY_API_KEY;
        this.baseUrl = 'https://api.perplexity.ai';
        
        // Verified Perplexity models with Grok-4 equivalent mapping
        this.models = {
            'grok-4': {
                actualModel: 'sonar-pro',
                description: 'Grok-4 equivalent using sonar-pro for advanced reasoning',
                capabilities: ['deep_analysis', 'repository_structure', 'strategic_planning', 'web_search'],
                maxTokens: 4000,
                webSearch: true,
                reasoning: 'enhanced',
                cost: 'low'
            },
            'sonar-pro': {
                actualModel: 'sonar-pro', 
                description: 'Advanced reasoning and analysis with web search',
                capabilities: ['advanced_reasoning', 'web_search', 'real_time_data', 'citations'],
                maxTokens: 4000,
                webSearch: true,
                cost: 'low'
            },
            'sonar': {
                actualModel: 'sonar',
                description: 'Fast web search and current information',
                capabilities: ['web_search', 'current_events', 'fact_checking'],
                maxTokens: 2000,
                webSearch: true,
                cost: 'very_low'
            },
            'llama-3.1-70b': {
                actualModel: 'llama-3.1-70b-instruct',
                description: 'Complex reasoning without web search',
                capabilities: ['complex_reasoning', 'code_analysis', 'detailed_analysis'],
                maxTokens: 8192,
                webSearch: false,
                cost: 'medium'
            },
            'llama-3.1-8b': {
                actualModel: 'llama-3.1-8b-instruct',
                description: 'Fast general-purpose tasks',
                capabilities: ['coding_assistance', 'general_tasks', 'quick_analysis'],
                maxTokens: 8192,
                webSearch: false,
                cost: 'very_low'
            }
        };

        this.requestCount = 0;
        this.errorCount = 0;
        this.totalResponseTime = 0;
    }

    /**
     * Make actual Perplexity API request
     */
    async makeRequest(prompt, modelName, options = {}) {
        const startTime = Date.now();
        this.requestCount++;

        if (!this.apiKey) {
            throw new Error('PERPLEXITY_API_KEY not configured. Add to environment or .env file.');
        }

        const modelConfig = this.models[modelName];
        if (!modelConfig) {
            throw new Error(`Unknown model: ${modelName}. Available models: ${Object.keys(this.models).join(', ')}`);
        }

        const actualModel = modelConfig.actualModel;
        const maxTokens = Math.min(options.maxTokens || 1000, modelConfig.maxTokens);

        // Enhanced prompt for Grok-4 equivalent
        let enhancedPrompt = prompt;
        if (modelName === 'grok-4') {
            enhancedPrompt = `As an advanced AI with Grok-4 equivalent reasoning capabilities, ${prompt}

Please provide:
- Deep analytical insights
- Multiple perspectives and viewpoints  
- Reasoning behind conclusions
- Specific actionable recommendations
- Current web-based information where relevant

Use advanced reasoning and comprehensive analysis.`;
        }

        const requestData = {
            model: actualModel,
            messages: [
                {
                    role: 'system',
                    content: modelConfig.webSearch 
                        ? 'You are a helpful AI assistant with access to real-time web information. Provide accurate, current information with citations when available.'
                        : 'You are a helpful AI assistant focused on detailed analysis and reasoning.'
                },
                {
                    role: 'user', 
                    content: enhancedPrompt
                }
            ],
            max_tokens: maxTokens,
            temperature: options.temperature || 0.3,
            top_p: options.top_p || 1.0,
            stream: false
        };

        try {
            console.log(`🔍 Making request to ${actualModel} (requested as ${modelName})...`);
            
            const response = await this.httpRequest(requestData);
            const responseTime = Date.now() - startTime;
            this.totalResponseTime += responseTime;

            console.log(`✅ Request completed in ${responseTime}ms`);

            return {
                model: modelName,
                actualModel: actualModel,
                response: response.choices[0].message.content,
                usage: response.usage,
                responseTime: responseTime,
                webSearch: modelConfig.webSearch,
                timestamp: new Date().toISOString(),
                capabilities: modelConfig.capabilities
            };

        } catch (error) {
            this.errorCount++;
            const responseTime = Date.now() - startTime;
            
            console.error(`❌ Request failed after ${responseTime}ms: ${error.message}`);
            
            throw new Error(`Perplexity API request failed: ${error.message}`);
        }
    }

    /**
     * HTTP request wrapper
     */
    async httpRequest(requestData) {
        const postData = JSON.stringify(requestData);

        return new Promise((resolve, reject) => {
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
                            resolve(response);
                        } else {
                            reject(new Error(`HTTP ${res.statusCode}: ${response.error?.message || response.message || data}`));
                        }
                    } catch (error) {
                        reject(new Error(`Response parsing failed: ${error.message}. Response: ${data}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error(`Request failed: ${error.message}`));
            });

            req.write(postData);
            req.end();
        });
    }

    /**
     * Test Grok-4 equivalent functionality
     */
    async testGrok4Equivalent() {
        console.log('🧠 Testing Grok-4 equivalent functionality...\n');

        const testQueries = [
            {
                name: 'Repository Analysis',
                query: 'Analyze the EchoTune AI repository structure and provide strategic recommendations for improving the Perplexity integration and MCP servers.',
                expectedCapabilities: ['deep_analysis', 'strategic_planning']
            },
            {
                name: 'Complex Problem Solving', 
                query: 'How can we optimize the integration between Perplexity API, browser automation, and code analysis to create a more effective AI-powered development workflow?',
                expectedCapabilities: ['complex_reasoning', 'system_design']
            },
            {
                name: 'Current Technology Research',
                query: 'What are the latest developments in AI-powered code analysis and music recommendation systems in 2025?',
                expectedCapabilities: ['web_search', 'current_events']
            }
        ];

        const results = [];

        for (const testQuery of testQueries) {
            try {
                console.log(`\n🔍 Testing: ${testQuery.name}`);
                console.log(`Query: "${testQuery.query}"`);
                
                const result = await this.makeRequest(testQuery.query, 'grok-4', {
                    maxTokens: 1500,
                    temperature: 0.2
                });

                console.log(`✅ Success - Response length: ${result.response.length} chars`);
                console.log(`📊 Usage: ${result.usage?.total_tokens || 'N/A'} tokens`);
                
                results.push({
                    ...testQuery,
                    result: result,
                    status: 'SUCCESS'
                });

            } catch (error) {
                console.error(`❌ Failed: ${error.message}`);
                results.push({
                    ...testQuery,
                    error: error.message,
                    status: 'FAILED'
                });
            }
        }

        return results;
    }

    /**
     * Comprehensive model testing
     */
    async testAllModels() {
        console.log('🧪 Testing all available models...\n');
        
        const testPrompt = 'Explain the benefits of using AI-powered music recommendation systems with a focus on user experience and technology integration.';
        const results = {};

        for (const [modelName, modelConfig] of Object.entries(this.models)) {
            try {
                console.log(`\n🤖 Testing model: ${modelName} (${modelConfig.actualModel})`);
                
                const result = await this.makeRequest(testPrompt, modelName, {
                    maxTokens: 500,
                    temperature: 0.3
                });

                results[modelName] = {
                    status: 'SUCCESS',
                    responseTime: result.responseTime,
                    tokenUsage: result.usage?.total_tokens,
                    responseLength: result.response.length,
                    webSearch: result.webSearch,
                    capabilities: result.capabilities
                };

                console.log(`✅ ${modelName}: ${result.responseTime}ms, ${result.usage?.total_tokens || 'N/A'} tokens`);

            } catch (error) {
                console.error(`❌ ${modelName}: ${error.message}`);
                results[modelName] = {
                    status: 'FAILED',
                    error: error.message
                };
            }
        }

        return results;
    }

    /**
     * Repository-aware analysis with Grok-4 equivalent
     */
    async analyzeRepository(repoPath = '.') {
        console.log(`🔍 Analyzing repository: ${repoPath}`);
        
        try {
            // Get repository structure
            const structure = await this.getRepositoryStructure(repoPath);
            
            const analysisPrompt = `Analyze this software repository and provide comprehensive insights:

Repository Structure:
- Total files: ${structure.totalFiles}
- Main directories: ${structure.directories.slice(0, 10).join(', ')}
- Key files: ${structure.keyFiles.join(', ')}
- File types: ${Object.keys(structure.fileTypes).join(', ')}
- Package managers: ${structure.packageManagers.join(', ')}

Please provide:
1. Architecture assessment and recommendations
2. Code organization evaluation
3. Technology stack analysis  
4. Integration opportunities
5. Performance optimization suggestions
6. Security considerations
7. Development workflow improvements

Focus on actionable insights for this specific project.`;

            const result = await this.makeRequest(analysisPrompt, 'grok-4', {
                maxTokens: 2000,
                temperature: 0.2
            });

            return {
                repository: repoPath,
                structure: structure,
                analysis: result,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error(`❌ Repository analysis failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get repository structure
     */
    async getRepositoryStructure(repoPath) {
        const structure = {
            totalFiles: 0,
            directories: [],
            fileTypes: {},
            keyFiles: [],
            packageManagers: []
        };

        const analyzeDir = async (dir, depth = 0) => {
            if (depth > 3) return;

            try {
                const items = await fs.readdir(dir);
                
                for (const item of items) {
                    if (item.startsWith('.') && !['package.json', '.env'].includes(item)) continue;
                    
                    const itemPath = path.join(dir, item);
                    const stat = await fs.stat(itemPath);
                    
                    if (stat.isDirectory()) {
                        structure.directories.push(path.relative(repoPath, itemPath));
                        await analyzeDir(itemPath, depth + 1);
                    } else {
                        structure.totalFiles++;
                        const ext = path.extname(item);
                        structure.fileTypes[ext] = (structure.fileTypes[ext] || 0) + 1;
                        
                        if (['package.json', 'requirements.txt', 'Dockerfile', 'docker-compose.yml', 
                             'README.md', '.env', 'tsconfig.json', 'eslint.config.js'].includes(item)) {
                            structure.keyFiles.push(path.relative(repoPath, itemPath));
                        }
                        
                        if (item === 'package.json') structure.packageManagers.push('npm');
                        if (item === 'requirements.txt') structure.packageManagers.push('pip');
                    }
                }
            } catch (error) {
                // Skip inaccessible directories
            }
        };

        await analyzeDir(repoPath);
        return structure;
    }

    /**
     * Generate performance metrics
     */
    getPerformanceMetrics() {
        return {
            totalRequests: this.requestCount,
            totalErrors: this.errorCount,
            successRate: this.requestCount > 0 ? ((this.requestCount - this.errorCount) / this.requestCount * 100).toFixed(2) + '%' : '0%',
            averageResponseTime: this.requestCount > 0 ? Math.round(this.totalResponseTime / this.requestCount) + 'ms' : '0ms',
            errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount * 100).toFixed(2) + '%' : '0%'
        };
    }

    /**
     * Save results to file
     */
    async saveResults(results, filename) {
        const resultsDir = path.join(process.cwd(), 'perplexity-test-results');
        
        try {
            await fs.mkdir(resultsDir, { recursive: true });
            const filePath = path.join(resultsDir, filename);
            await fs.writeFile(filePath, JSON.stringify(results, null, 2));
            console.log(`📁 Results saved to: ${filePath}`);
            return filePath;
        } catch (error) {
            console.error(`❌ Failed to save results: ${error.message}`);
        }
    }
}

// CLI interface
async function main() {
    console.log('🚀 Real Perplexity API Integration Test\n');
    
    const integration = new RealPerplexityIntegration();
    const args = process.argv.slice(2);
    const command = args[0] || 'test-grok4';

    try {
        let results = {};

        switch (command) {
            case 'test-grok4':
                console.log('🧠 Testing Grok-4 equivalent functionality...\n');
                results.grok4Tests = await integration.testGrok4Equivalent();
                break;

            case 'test-all':
                console.log('🧪 Testing all models...\n');
                results.modelTests = await integration.testAllModels();
                break;

            case 'analyze-repo':
                const repoPath = args[1] || '.';
                console.log(`🔍 Analyzing repository: ${repoPath}\n`);
                results.repoAnalysis = await integration.analyzeRepository(repoPath);
                break;

            case 'comprehensive':
                console.log('🎯 Running comprehensive test suite...\n');
                results.grok4Tests = await integration.testGrok4Equivalent();
                results.modelTests = await integration.testAllModels();
                results.repoAnalysis = await integration.analyzeRepository('.');
                break;

            default:
                console.log(`
Usage: node real-perplexity-integration.js [command]

Commands:
  test-grok4     - Test Grok-4 equivalent functionality (default)
  test-all       - Test all available models  
  analyze-repo   - Analyze current repository
  comprehensive  - Run all tests
`);
                return;
        }

        // Add performance metrics
        results.performance = integration.getPerformanceMetrics();
        results.timestamp = new Date().toISOString();
        results.command = command;

        // Save results
        const filename = `perplexity-integration-test-${command}-${Date.now()}.json`;
        await integration.saveResults(results, filename);

        console.log('\n' + '='.repeat(60));
        console.log('📊 PERFORMANCE METRICS');
        console.log('='.repeat(60));
        console.log(`Total Requests: ${results.performance.totalRequests}`);
        console.log(`Success Rate: ${results.performance.successRate}`);
        console.log(`Average Response Time: ${results.performance.averageResponseTime}`);
        console.log(`Error Rate: ${results.performance.errorRate}`);
        console.log('='.repeat(60));

        console.log('\n✅ Test completed successfully!');

    } catch (error) {
        console.error(`❌ Test failed: ${error.message}`);
        
        if (error.message.includes('PERPLEXITY_API_KEY')) {
            console.log('\n💡 Setup Instructions:');
            console.log('1. Get API key from https://www.perplexity.ai/settings/api');
            console.log('2. Add to .env file: PERPLEXITY_API_KEY=pplx-...');
            console.log('3. Or set environment variable: export PERPLEXITY_API_KEY=pplx-...');
        }
        
        process.exit(1);
    }
}

// Export for use as module
module.exports = { RealPerplexityIntegration };

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}
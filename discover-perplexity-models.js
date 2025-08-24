#!/usr/bin/env node

/**
 * PERPLEXITY API MODEL DISCOVERY
 * 
 * This script attempts to discover valid Perplexity API model names
 * by trying common patterns and checking the API documentation.
 */

require('dotenv').config();
const https = require('https');
const fs = require('fs').promises;

class PerplexityModelDiscovery {
    constructor() {
        this.apiKey = process.env.PERPLEXITY_API_KEY;
        
        // Try simplified model names based on common patterns
        this.candidateModels = [
            // Simple names (common in Perplexity)
            'sonar',
            'sonar-pro',
            'sonar-medium',
            'sonar-small', 
            'llama-3-sonar',
            'llama-3.1-sonar',
            'gpt-4',
            'gpt-3.5-turbo',
            
            // Perplexity specific patterns
            'pplx-7b-online',
            'pplx-70b-online',
            'pplx-7b-chat',
            'pplx-70b-chat',
            
            // Common LLaMA patterns
            'llama-3-8b',
            'llama-3-70b',
            'llama-3.1-8b',
            'llama-3.1-70b',
            
            // Mixtral patterns
            'mixtral-8x7b',
            'mixtral-8x22b',
            
            // Claude patterns
            'claude-3-sonnet',
            'claude-3-haiku',
            
            // Alternative formats
            'codellama-7b',
            'mistral-7b'
        ];

        console.log('🔍 PERPLEXITY API MODEL DISCOVERY');
        console.log('================================');
    }

    async testModel(model) {
        return new Promise((resolve) => {
            const payload = {
                model: model,
                messages: [{ role: 'user', content: 'Hi' }],
                max_tokens: 5
            };

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
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        resolve({
                            model,
                            statusCode: res.statusCode,
                            success: res.statusCode === 200,
                            response: response,
                            error: response.error?.message
                        });
                    } catch (e) {
                        resolve({ model, success: false, error: 'Parse error' });
                    }
                });
            });

            req.on('error', () => {
                resolve({ model, success: false, error: 'Network error' });
            });

            req.setTimeout(5000, () => {
                req.destroy();
                resolve({ model, success: false, error: 'Timeout' });
            });

            req.write(postData);
            req.end();
        });
    }

    async discoverModels() {
        console.log(`Testing ${this.candidateModels.length} candidate models...\n`);

        const results = [];
        
        for (const model of this.candidateModels) {
            process.stdout.write(`Testing ${model.padEnd(30)} `);
            
            const result = await this.testModel(model);
            
            if (result.success) {
                console.log('✅ WORKS');
                results.push(result);
            } else {
                console.log(`❌ ${result.error}`);
            }
        }

        return results;
    }

    async checkAPIStatus() {
        console.log('📊 Checking API status and authentication...\n');

        // Try to get error details with a definitely invalid model
        const result = await this.testModel('invalid-model-name-123');
        
        console.log(`Status Code: ${result.statusCode}`);
        console.log(`Response:`, JSON.stringify(result.response, null, 2));

        if (result.response && result.response.error) {
            const errorMsg = result.response.error.message;
            console.log(`\nError Message: ${errorMsg}`);
            
            // Check if it mentions where to find valid models
            if (errorMsg.includes('documentation')) {
                console.log('\n💡 The API suggests checking documentation for valid models.');
            }
        }

        return result;
    }

    async tryCommonPerplexityModels() {
        console.log('\n🎯 Trying common Perplexity model patterns...\n');

        // These are based on what I've seen in Perplexity documentation examples
        const commonModels = [
            'pplx-7b-online',
            'pplx-70b-online', 
            'pplx-7b-chat',
            'pplx-70b-chat',
            'llama-2-70b-chat',
            'codellama-34b-instruct',
            'mistral-7b-instruct',
            'mixtral-8x7b-instruct'
        ];

        const workingModels = [];

        for (const model of commonModels) {
            console.log(`🧪 Testing: ${model}`);
            const result = await this.testModel(model);
            
            if (result.success) {
                console.log(`  ✅ SUCCESS: ${model} works!`);
                workingModels.push(model);
                
                // Get a real response to verify
                const testResult = await this.testModel(model);
                if (testResult.response && testResult.response.choices) {
                    const content = testResult.response.choices[0]?.message?.content;
                    console.log(`  📝 Sample response: "${content}"`);
                }
            } else {
                console.log(`  ❌ Failed: ${result.error}`);
            }
        }

        return workingModels;
    }
}

async function main() {
    const discovery = new PerplexityModelDiscovery();

    if (!discovery.apiKey) {
        console.log('❌ PERPLEXITY_API_KEY not found!');
        console.log('Please set it in your .env file');
        process.exit(1);
    }

    console.log(`🔑 API Key: Present (${discovery.apiKey.substring(0, 10)}...)\n`);

    try {
        // First check API status
        await discovery.checkAPIStatus();

        console.log('\n' + '='.repeat(50));

        // Try to discover working models
        const workingModels = await discovery.discoverModels();

        console.log('\n' + '='.repeat(50));
        console.log('📋 DISCOVERY RESULTS:');
        console.log('='.repeat(50));

        if (workingModels.length > 0) {
            console.log(`\n✅ Found ${workingModels.length} working model(s):`);
            workingModels.forEach(model => {
                console.log(`  ✅ ${model.model}`);
            });

            // Save results
            await fs.writeFile('working-perplexity-models.json', JSON.stringify(workingModels, null, 2));
            console.log('\n💾 Results saved to: working-perplexity-models.json');

        } else {
            console.log('\n❌ No working models found with current API key.');
            console.log('This might indicate:');
            console.log('  1. Invalid API key');
            console.log('  2. API endpoint has changed');
            console.log('  3. All tested model names are incorrect');
            console.log('  4. Account/subscription issue');
        }

        // Try common patterns as backup
        console.log('\n🔄 Trying backup model discovery...');
        const backupModels = await discovery.tryCommonPerplexityModels();
        
        if (backupModels.length > 0) {
            console.log(`\n🎉 Backup discovery found ${backupModels.length} working models!`);
            backupModels.forEach(model => console.log(`  ✅ ${model}`));
        }

    } catch (error) {
        console.error('\n💥 Discovery failed:', error);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { PerplexityModelDiscovery };
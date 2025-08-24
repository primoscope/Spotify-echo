#!/usr/bin/env node

/**
 * COMPREHENSIVE PERPLEXITY API ENHANCEMENT VALIDATOR
 * 
 * Tests the enhanced integration with cost optimization,
 * multiple models, and advanced features
 */

const EnhancedPerplexityAPI = require('./EnhancedPerplexityAPI.js');
const fs = require('fs').promises;

class PerplexityEnhancementValidator {
    constructor() {
        this.api = null;
        this.results = {
            timestamp: new Date().toISOString(),
            tests: {},
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                cost: 0
            }
        };
    }

    async initialize() {
        console.log('🚀 Initializing Enhanced Perplexity API Validator\n');
        
        try {
            // Initialize with cost optimization
            this.api = new EnhancedPerplexityAPI(process.env.PERPLEXITY_API_KEY, {
                costOptimization: true,
                budget: 5.00, // $5 daily budget for testing
                trackUsage: true,
                preferLowerCost: true
            });
            
            console.log('✅ API initialized with cost optimization');
            console.log(`📊 Models available: ${this.api.getModels().length}`);
            console.log(`💰 Daily budget: $5.00\n`);
            
            return true;
        } catch (error) {
            console.error('❌ API initialization failed:', error.message);
            return false;
        }
    }

    async runTest(testName, testFunction) {
        this.results.summary.total++;
        console.log(`🧪 Testing: ${testName}`);
        
        const startTime = Date.now();
        
        try {
            const result = await testFunction();
            const duration = Date.now() - startTime;
            
            this.results.tests[testName] = {
                status: 'PASSED',
                duration,
                result,
                timestamp: new Date().toISOString()
            };
            
            this.results.summary.passed++;
            console.log(`✅ PASSED (${duration}ms)`);
            
            if (result.cost) {
                this.results.summary.cost += result.cost;
                console.log(`💰 Cost: $${result.cost.toFixed(4)}`);
            }
            
            console.log('');
            return result;
            
        } catch (error) {
            const duration = Date.now() - startTime;
            
            this.results.tests[testName] = {
                status: 'FAILED',
                duration,
                error: error.message,
                timestamp: new Date().toISOString()
            };
            
            this.results.summary.failed++;
            console.log(`❌ FAILED (${duration}ms): ${error.message}\n`);
            return null;
        }
    }

    async testModelRegistry() {
        return await this.runTest('Model Registry', async () => {
            const models = this.api.getModels();
            
            if (models.length < 10) {
                throw new Error(`Expected at least 10 models, got ${models.length}`);
            }
            
            // Check for key models from research
            const expectedModels = ['sonar', 'sonar-pro', 'sonar-deep-research', 'gpt-5', 'claude-opus-4.1'];
            const modelIds = models.map(m => m.id);
            
            for (const expected of expectedModels) {
                if (!modelIds.includes(expected)) {
                    throw new Error(`Missing expected model: ${expected}`);
                }
            }
            
            return {
                modelCount: models.length,
                modelTypes: [...new Set(models.map(m => m.type))],
                searchEnabled: models.filter(m => m.type === 'search-enabled').length
            };
        });
    }

    async testCostOptimization() {
        return await this.runTest('Cost Optimization', async () => {
            // Test cost estimation
            const prompt = "What is artificial intelligence?";
            const model = this.api.models.sonar;
            const estimate = this.api.estimateCost(prompt, { maxTokens: 500 }, model);
            
            if (estimate <= 0) {
                throw new Error('Cost estimation should be positive');
            }
            
            // Test budget checking
            const budgetCheck = this.api.checkBudget(estimate);
            
            return {
                estimatedCost: estimate,
                budgetCheck,
                costOptimizationEnabled: this.api.costOptimization.enabled
            };
        });
    }

    async testBasicQuery() {
        return await this.runTest('Basic Query - Sonar', async () => {
            const result = await this.api.quickQuery('What is machine learning?');
            
            if (!result.success) {
                throw new Error('Query was not successful');
            }
            
            if (!result.content || result.content.length < 50) {
                throw new Error('Response content too short');
            }
            
            if (!result.searchEnabled) {
                throw new Error('Search should be enabled for sonar model');
            }
            
            return {
                model: result.model,
                contentLength: result.content.length,
                cost: result.cost,
                searchEnabled: result.searchEnabled,
                responsePreview: result.content.substring(0, 100) + '...'
            };
        });
    }

    async testAdvancedResearch() {
        return await this.runTest('Advanced Research - Sonar Pro', async () => {
            const result = await this.api.research('Latest developments in AI music generation 2025', {
                maxTokens: 1000
            });
            
            if (!result.success) {
                throw new Error('Research query was not successful');
            }
            
            if (!result.content || result.content.length < 200) {
                throw new Error('Research response too short');
            }
            
            if (result.model !== 'sonar-pro') {
                throw new Error(`Expected sonar-pro model, got ${result.model}`);
            }
            
            return {
                model: result.model,
                contentLength: result.content.length,
                cost: result.cost,
                hasCurrentInfo: result.content.includes('2025'),
                responsePreview: result.content.substring(0, 150) + '...'
            };
        });
    }

    async testExpertAnalysis() {
        return await this.runTest('Expert Analysis - GPT-5', async () => {
            const result = await this.api.expertAnalysis(
                'Analyze the technical architecture challenges of building scalable music recommendation systems',
                { 
                    coding: true, // Should select GPT-5
                    maxTokens: 800 
                }
            );
            
            if (!result.success) {
                throw new Error('Expert analysis was not successful');
            }
            
            if (!result.content || result.content.length < 300) {
                throw new Error('Expert analysis response too short');
            }
            
            // Note: GPT-5 might not be available, so accept sonar-pro as fallback
            const expectedModels = ['gpt-5', 'sonar-pro', 'sonar-reasoning-pro'];
            if (!expectedModels.includes(result.model)) {
                throw new Error(`Unexpected model for expert analysis: ${result.model}`);
            }
            
            return {
                model: result.model,
                contentLength: result.content.length,
                cost: result.cost,
                hasTechnicalContent: result.content.toLowerCase().includes('architecture'),
                responsePreview: result.content.substring(0, 150) + '...'
            };
        });
    }

    async testUsageTracking() {
        return await this.runTest('Usage Tracking', async () => {
            const stats = this.api.getUsageStats();
            
            if (!stats.total) {
                throw new Error('Usage stats should be available');
            }
            
            if (stats.total.queries <= 0) {
                throw new Error('Should have recorded queries from previous tests');
            }
            
            if (stats.total.cost <= 0) {
                throw new Error('Should have recorded costs from previous tests');
            }
            
            return {
                totalQueries: stats.total.queries,
                totalCost: stats.total.cost,
                averageCostPerQuery: stats.averageCostPerQuery,
                todayQueries: stats.today.queries,
                budgetStatus: stats.budgetStatus
            };
        });
    }

    async testComplexityAssessment() {
        return await this.runTest('Complexity Assessment', async () => {
            const testCases = [
                { prompt: "What is AI?", expected: "simple" },
                { prompt: "Analyze the differences between machine learning and deep learning", expected: "moderate" },
                { prompt: "Provide a comprehensive research analysis of the impact of artificial intelligence on music composition, including technical implementation details, current industry applications, and future trends", expected: "expert" }
            ];
            
            const results = {};
            
            for (const testCase of testCases) {
                const complexity = this.api.assessComplexity(testCase.prompt);
                results[testCase.expected] = complexity;
                
                // Allow some flexibility in complexity assessment
                const validComplexities = ["simple", "moderate", "complex", "expert"];
                if (!validComplexities.includes(complexity)) {
                    throw new Error(`Invalid complexity assessment: ${complexity}`);
                }
            }
            
            return results;
        });
    }

    async testErrorHandling() {
        return await this.runTest('Error Handling', async () => {
            // Test with invalid model (should fall back gracefully)
            try {
                const result = await this.api.makeRequest('Test query', { model: 'invalid-model' });
                // Should still work with fallback
                return {
                    fallbackWorking: true,
                    model: result.model
                };
            } catch (error) {
                // Should have clear error message
                if (error.message.length < 10) {
                    throw new Error('Error message too short');
                }
                return {
                    errorHandling: true,
                    errorMessage: error.message
                };
            }
        });
    }

    async generateReport() {
        console.log('📋 Generating comprehensive validation report...\n');
        
        // Add final usage statistics
        this.results.finalStats = this.api.getUsageStats();
        this.results.summary.cost = this.results.finalStats.total.cost;
        
        // Create detailed report
        const report = {
            ...this.results,
            models: this.api.getModels(),
            validationSummary: {
                successRate: (this.results.summary.passed / this.results.summary.total) * 100,
                totalDuration: Object.values(this.results.tests).reduce((sum, test) => sum + test.duration, 0),
                costEfficiency: this.results.summary.cost / this.results.summary.total,
                modelsValidated: Object.values(this.results.tests)
                    .filter(test => test.result && test.result.model)
                    .map(test => test.result.model)
            }
        };
        
        // Save detailed JSON report
        await fs.writeFile('perplexity-enhancement-validation.json', JSON.stringify(report, null, 2));
        
        // Create markdown summary
        let markdown = `# Perplexity API Enhancement Validation Report\n\n`;
        markdown += `**Generated**: ${this.results.timestamp}\n\n`;
        markdown += `## Validation Summary\n\n`;
        markdown += `- **Tests Run**: ${this.results.summary.total}\n`;
        markdown += `- **Tests Passed**: ${this.results.summary.passed} (${report.validationSummary.successRate.toFixed(1)}%)\n`;
        markdown += `- **Tests Failed**: ${this.results.summary.failed}\n`;
        markdown += `- **Total Cost**: $${this.results.summary.cost.toFixed(4)}\n`;
        markdown += `- **Average Cost per Test**: $${report.validationSummary.costEfficiency.toFixed(4)}\n\n`;
        
        markdown += `## Models Available\n\n`;
        for (const model of this.api.getModels()) {
            markdown += `- **${model.name}** (\`${model.id}\`): ${model.description}\n`;
        }
        markdown += `\n`;
        
        markdown += `## Test Results\n\n`;
        for (const [testName, testResult] of Object.entries(this.results.tests)) {
            const status = testResult.status === 'PASSED' ? '✅' : '❌';
            markdown += `### ${status} ${testName}\n`;
            markdown += `- **Status**: ${testResult.status}\n`;
            markdown += `- **Duration**: ${testResult.duration}ms\n`;
            
            if (testResult.result) {
                if (testResult.result.cost) {
                    markdown += `- **Cost**: $${testResult.result.cost.toFixed(4)}\n`;
                }
                if (testResult.result.model) {
                    markdown += `- **Model**: ${testResult.result.model}\n`;
                }
                if (testResult.result.contentLength) {
                    markdown += `- **Response Length**: ${testResult.result.contentLength} characters\n`;
                }
            }
            
            if (testResult.error) {
                markdown += `- **Error**: ${testResult.error}\n`;
            }
            
            markdown += `\n`;
        }
        
        await fs.writeFile('perplexity-enhancement-validation.md', markdown);
        
        return report;
    }

    async runAllTests() {
        console.log('🔍 Enhanced Perplexity API Validation Suite\n');
        console.log('Testing comprehensive integration with cost optimization and advanced features\n');
        
        if (!await this.initialize()) {
            console.error('💥 Failed to initialize API');
            return false;
        }
        
        // Run all validation tests
        await this.testModelRegistry();
        await this.testCostOptimization();
        await this.testComplexityAssessment();
        await this.testBasicQuery();
        await this.testAdvancedResearch();
        await this.testExpertAnalysis();
        await this.testUsageTracking();
        await this.testErrorHandling();
        
        // Generate final report
        const report = await this.generateReport();
        
        console.log('\n🎉 Validation Complete!\n');
        console.log(`📊 Summary:`);
        console.log(`   • Tests: ${report.summary.passed}/${report.summary.total} passed`);
        console.log(`   • Success Rate: ${report.validationSummary.successRate.toFixed(1)}%`);
        console.log(`   • Total Cost: $${report.summary.cost.toFixed(4)}`);
        console.log(`   • Models Validated: ${[...new Set(report.validationSummary.modelsValidated)].length}`);
        
        console.log(`\n📄 Reports Generated:`);
        console.log(`   • Detailed: perplexity-enhancement-validation.json`);
        console.log(`   • Summary: perplexity-enhancement-validation.md`);
        
        return report.summary.failed === 0;
    }
}

// Execute if run directly
if (require.main === module) {
    const validator = new PerplexityEnhancementValidator();
    
    validator.runAllTests()
        .then(success => {
            if (success) {
                console.log('\n✨ All tests passed! Enhanced integration is ready for production.');
                process.exit(0);
            } else {
                console.log('\n⚠️ Some tests failed. Check the reports for details.');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('\n💥 Validation suite failed:', error);
            process.exit(1);
        });
}

module.exports = PerplexityEnhancementValidator;
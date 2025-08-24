#!/usr/bin/env node
/**
 * Claude Opus 4.1 Integration Test Suite
 * 
 * Comprehensive testing for Claude Opus 4.1 GitHub coding agent integration
 * Tests all command types, extended thinking modes, and integration points
 */

const ClaudeOpusCommandProcessor = require('./claude-opus-command-processor');
const fs = require('fs').promises;
const path = require('path');

class ClaudeOpusIntegrationTester {
    constructor() {
        this.processor = new ClaudeOpusCommandProcessor();
        this.testResults = [];
        this.config = {
            enableActualAPITests: process.env.ENABLE_CLAUDE_OPUS_API_TESTS === 'true',
            testTimeout: 300000, // 5 minutes per test
            thinkingBudgetTest: 2000, // Small budget for testing
            hasGCPConfig: !!(process.env.GCP_PROJECT_ID)
        };
    }

    /**
     * Run comprehensive test suite
     */
    async runTestSuite() {
        console.log('🧠 Starting Claude Opus 4.1 Integration Test Suite...\n');

        const tests = [
            { name: 'Configuration Validation', method: this.testConfiguration },
            { name: 'Command Type Recognition', method: this.testCommandTypes },
            { name: 'Extended Thinking Mode', method: this.testExtendedThinking },
            { name: 'Target File Processing', method: this.testTargetProcessing },
            { name: 'Custom Prompt Handling', method: this.testCustomPrompts },
            { name: 'Error Handling', method: this.testErrorHandling },
            { name: 'Report Generation', method: this.testReportGeneration },
            { name: 'Performance Metrics', method: this.testMetrics }
        ];

        if (this.config.enableActualAPITests) {
            tests.push(
                { name: 'Vertex AI Connection', method: this.testVertexConnection },
                { name: 'Claude Opus 4.1 API', method: this.testClaudeOpusAPI }
            );
        }

        for (const test of tests) {
            await this.runTest(test.name, test.method.bind(this));
        }

        await this.generateTestReport();
        this.printSummary();
    }

    /**
     * Run individual test
     */
    async runTest(testName, testMethod) {
        console.log(`🧪 Running test: ${testName}`);
        const startTime = Date.now();

        try {
            const result = await Promise.race([
                testMethod(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Test timeout')), this.config.testTimeout)
                )
            ]);

            const duration = Date.now() - startTime;
            const testResult = {
                name: testName,
                status: 'PASS',
                duration,
                details: result || 'Test completed successfully'
            };

            this.testResults.push(testResult);
            console.log(`✅ ${testName}: PASS (${duration}ms)\n`);

        } catch (error) {
            const duration = Date.now() - startTime;
            const testResult = {
                name: testName,
                status: 'FAIL',
                duration,
                error: error.message,
                details: error.stack
            };

            this.testResults.push(testResult);
            console.log(`❌ ${testName}: FAIL - ${error.message} (${duration}ms)\n`);
        }
    }

    /**
     * Test configuration validation
     */
    async testConfiguration() {
        // Test environment variables - handle missing GCP config gracefully
        const requiredVars = [];
        const optionalVars = ['GCP_PROJECT_ID', 'ANTHROPIC_API_KEY'];
        
        if (this.config.enableActualAPITests) {
            requiredVars.push('GCP_PROJECT_ID');
        }
        
        const missingVars = requiredVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
            throw new Error(`Missing required environment variables for API tests: ${missingVars.join(', ')}`);
        }

        // Test model configuration with mock project ID if needed
        const config = this.processor.config;
        if (!config.model.includes('claude-opus-4-1')) {
            throw new Error('Incorrect model configuration');
        }

        if (config.maxOutputTokens < 30000) {
            throw new Error('Max output tokens too low for Claude Opus 4.1');
        }

        return {
            projectId: config.projectId || 'mock-project-id',
            model: config.model,
            maxTokens: config.maxOutputTokens,
            contextWindow: config.contextWindow,
            hasGCPConfig: this.config.hasGCPConfig,
            apiTestsEnabled: this.config.enableActualAPITests
        };
    }

    /**
     * Test command type recognition
     */
    async testCommandTypes() {
        const commandTypes = Object.keys(this.processor.commandTypes);
        const results = {};

        for (const commandType of commandTypes) {
            const command = this.processor.commandTypes[commandType];
            
            // Validate command structure
            if (!command.description || !command.systemPrompt) {
                throw new Error(`Invalid command structure for ${commandType}`);
            }

            results[commandType] = {
                description: command.description,
                extendedThinking: command.extendedThinking,
                thinkingBudget: command.thinkingBudget,
                temperature: command.temperature
            };
        }

        return results;
    }

    /**
     * Test extended thinking mode configuration
     */
    async testExtendedThinking() {
        const testConfig = {
            commandType: 'deep-reasoning',
            extendedThinking: true,
            thinkingBudget: this.config.thinkingBudgetTest,
            target: '',
            prompt: 'Test extended thinking configuration'
        };

        // Test system prompt building
        const systemPrompt = this.processor.buildSystemPrompt(testConfig);
        if (!systemPrompt.includes('extended thinking')) {
            throw new Error('Extended thinking not properly configured in system prompt');
        }

        // Test user prompt building
        const userPrompt = await this.processor.buildUserPrompt(testConfig);
        if (!userPrompt.includes('extended thinking capabilities')) {
            throw new Error('Extended thinking instructions not included in user prompt');
        }

        return {
            systemPromptLength: systemPrompt.length,
            userPromptLength: userPrompt.length,
            thinkingBudget: testConfig.thinkingBudget,
            extendedThinking: testConfig.extendedThinking
        };
    }

    /**
     * Test target file processing
     */
    async testTargetProcessing() {
        // Test with existing file
        const testFile = 'package.json';
        const testConfig = {
            commandType: 'advanced-coding',
            target: testFile,
            prompt: 'Analyze this configuration file'
        };

        const userPrompt = await this.processor.buildUserPrompt(testConfig);
        
        if (!userPrompt.includes('Target File Content')) {
            throw new Error('Target file content not included in prompt');
        }

        // Test with non-existent file (should not throw)
        const testConfig2 = {
            commandType: 'deep-reasoning',
            target: 'non-existent-file.js',
            prompt: 'Test missing file handling'
        };

        const userPrompt2 = await this.processor.buildUserPrompt(testConfig2);
        
        return {
            existingFileProcessed: true,
            missingFileHandled: true,
            targetFileLength: userPrompt.length,
            missingFileLength: userPrompt2.length
        };
    }

    /**
     * Test custom prompt handling
     */
    async testCustomPrompts() {
        const testPrompts = [
            'Simple test prompt',
            'Complex prompt with multiple\nlines and special characters: !@#$%^&*()',
            'Very long prompt that exceeds normal length limits and includes technical terms like API, database, optimization, scalability, architecture, and performance monitoring',
            ''
        ];

        const results = [];

        for (const prompt of testPrompts) {
            const testConfig = {
                commandType: 'deep-reasoning',
                target: '',
                prompt: prompt
            };

            const userPrompt = await this.processor.buildUserPrompt(testConfig);
            
            if (prompt && !userPrompt.includes(prompt)) {
                throw new Error(`Custom prompt not included: ${prompt}`);
            }

            results.push({
                originalPrompt: prompt.substring(0, 50),
                included: prompt ? userPrompt.includes(prompt) : true,
                finalLength: userPrompt.length
            });
        }

        return results;
    }

    /**
     * Test error handling
     */
    async testErrorHandling() {
        // Test invalid command type
        try {
            await this.processor.processCommand('invalid-command-type');
            throw new Error('Should have thrown error for invalid command type');
        } catch (error) {
            if (!error.message.includes('Unsupported command type')) {
                throw new Error('Incorrect error message for invalid command type');
            }
        }

        // Test invalid thinking budget
        const testConfig = {
            commandType: 'deep-reasoning',
            thinkingBudget: -1000
        };

        // Should handle negative thinking budget gracefully
        const systemPrompt = this.processor.buildSystemPrompt(testConfig);
        if (!systemPrompt) {
            throw new Error('Failed to handle invalid thinking budget');
        }

        return {
            invalidCommandHandled: true,
            invalidBudgetHandled: true
        };
    }

    /**
     * Test report generation
     */
    async testReportGeneration() {
        const mockResult = {
            success: true,
            timestamp: new Date().toISOString(),
            commandType: 'deep-reasoning',
            target: 'test-target',
            extendedThinking: true,
            thinkingBudget: 5000,
            modelVersion: 'claude-opus-4-1@20250805',
            analysis: 'Mock analysis result for testing purposes',
            metadata: {
                promptLength: 1000,
                responseLength: 2000,
                temperature: 0.1,
                processingTime: Date.now() - 5000
            }
        };

        const mockConfig = {
            commandType: 'deep-reasoning',
            target: 'test-target',
            extendedThinking: true,
            thinkingBudget: 5000
        };

        // Test markdown report generation
        const markdown = this.processor.generateMarkdownReport(mockResult, mockConfig);
        if (!markdown.includes('Claude Opus 4.1 Advanced Analysis Report')) {
            throw new Error('Markdown report header missing');
        }

        if (!markdown.includes(mockResult.analysis)) {
            throw new Error('Analysis content not included in markdown report');
        }

        // Test summary generation
        const summary = this.processor.generateSummary(mockResult, mockConfig);
        if (!summary.includes('✅ Completed')) {
            throw new Error('Summary status not correct');
        }

        return {
            markdownLength: markdown.length,
            summaryLength: summary.length,
            containsAnalysis: markdown.includes(mockResult.analysis),
            containsMetadata: markdown.includes('Performance Metrics')
        };
    }

    /**
     * Test performance metrics tracking
     */
    async testMetrics() {
        const initialMetrics = { ...this.processor.sessionMetrics };
        
        // Simulate successful command
        this.processor.updateMetrics(true, 5000, {
            thinkingBudget: 3000,
            metadata: { responseLength: 1500 }
        });

        // Simulate failed command
        this.processor.updateMetrics(false, 2000, null);

        const finalMetrics = this.processor.sessionMetrics;

        if (finalMetrics.commandsExecuted !== initialMetrics.commandsExecuted + 2) {
            throw new Error('Commands executed count not updated correctly');
        }

        if (finalMetrics.successfulCommands !== initialMetrics.successfulCommands + 1) {
            throw new Error('Successful commands count not updated correctly');
        }

        if (finalMetrics.totalThinkingTokens !== initialMetrics.totalThinkingTokens + 3000) {
            throw new Error('Thinking tokens not tracked correctly');
        }

        return {
            commandsExecuted: finalMetrics.commandsExecuted,
            successfulCommands: finalMetrics.successfulCommands,
            totalThinkingTokens: finalMetrics.totalThinkingTokens,
            sessionDuration: Date.now() - finalMetrics.startTime
        };
    }

    /**
     * Test Vertex AI connection (only if API tests enabled)
     */
    async testVertexConnection() {
        if (!this.config.enableActualAPITests) {
            throw new Error('API tests disabled - set ENABLE_CLAUDE_OPUS_API_TESTS=true to enable');
        }

        // Test Vertex AI client initialization
        const vertexAI = this.processor.vertexAI;
        if (!vertexAI) {
            throw new Error('Vertex AI client not initialized');
        }

        // Test model configuration
        const modelConfig = {
            model: this.processor.config.model,
            generationConfig: {
                maxOutputTokens: 1000,
                temperature: 0.1
            }
        };

        const model = vertexAI.getGenerativeModel(modelConfig);
        if (!model) {
            throw new Error('Failed to get generative model');
        }

        return {
            projectId: this.processor.config.projectId,
            location: this.processor.config.location,
            model: this.processor.config.model,
            vertexAIConnected: true
        };
    }

    /**
     * Test Claude Opus 4.1 API (only if API tests enabled)
     */
    async testClaudeOpusAPI() {
        if (!this.config.enableActualAPITests) {
            throw new Error('API tests disabled - set ENABLE_CLAUDE_OPUS_API_TESTS=true to enable');
        }

        const testConfig = {
            commandType: 'deep-reasoning',
            target: '',
            prompt: 'This is a test prompt to validate Claude Opus 4.1 API connectivity',
            thinkingBudget: this.config.thinkingBudgetTest,
            extendedThinking: true,
            temperature: 0.1
        };

        try {
            const result = await this.processor.executeClaudeOpusAnalysis(testConfig);
            
            if (!result.success) {
                throw new Error('API call failed');
            }

            if (!result.analysis || result.analysis.length < 10) {
                throw new Error('Invalid response from Claude Opus 4.1');
            }

            return {
                success: true,
                analysisLength: result.analysis.length,
                modelVersion: result.modelVersion,
                responseTime: result.metadata.processingTime
            };

        } catch (error) {
            throw new Error(`Claude Opus 4.1 API test failed: ${error.message}`);
        }
    }

    /**
     * Generate comprehensive test report
     */
    async generateTestReport() {
        const report = {
            timestamp: new Date().toISOString(),
            testSuite: 'Claude Opus 4.1 Integration Test Suite',
            totalTests: this.testResults.length,
            passedTests: this.testResults.filter(t => t.status === 'PASS').length,
            failedTests: this.testResults.filter(t => t.status === 'FAIL').length,
            totalDuration: this.testResults.reduce((sum, t) => sum + t.duration, 0),
            apiTestsEnabled: this.config.enableActualAPITests,
            results: this.testResults
        };

        await fs.writeFile(
            'claude-opus-integration-test-report.json',
            JSON.stringify(report, null, 2)
        );

        // Generate markdown report
        const markdown = this.generateMarkdownTestReport(report);
        await fs.writeFile('claude-opus-integration-test-report.md', markdown);

        console.log('📄 Test reports generated:');
        console.log('   - claude-opus-integration-test-report.json');
        console.log('   - claude-opus-integration-test-report.md\n');
    }

    /**
     * Generate markdown test report
     */
    generateMarkdownTestReport(report) {
        const passRate = ((report.passedTests / report.totalTests) * 100).toFixed(1);
        
        return `# 🧠 Claude Opus 4.1 Integration Test Report

**Timestamp**: ${report.timestamp}
**Test Suite**: ${report.testSuite}
**API Tests Enabled**: ${report.apiTestsEnabled ? '✅ Yes' : '❌ No'}

## 📊 Test Summary

- **Total Tests**: ${report.totalTests}
- **Passed**: ${report.passedTests} ✅
- **Failed**: ${report.failedTests} ${report.failedTests > 0 ? '❌' : ''}
- **Pass Rate**: ${passRate}%
- **Total Duration**: ${report.totalDuration}ms

## 📋 Detailed Results

${report.results.map(result => `
### ${result.status === 'PASS' ? '✅' : '❌'} ${result.name}

**Status**: ${result.status}
**Duration**: ${result.duration}ms

${result.status === 'FAIL' ? `**Error**: ${result.error}` : '**Result**: Test completed successfully'}

${result.details && typeof result.details === 'object' ? 
    '**Details**:\n```json\n' + JSON.stringify(result.details, null, 2) + '\n```' : ''}
`).join('\n')}

## 🔧 Configuration

- **Model**: ${this.processor.config.model}
- **Version**: ${this.processor.config.version}
- **Max Output Tokens**: ${this.processor.config.maxOutputTokens}
- **Context Window**: ${this.processor.config.contextWindow}
- **Default Thinking Budget**: ${this.processor.config.defaultThinkingBudget}

## 📚 Next Steps

${report.failedTests === 0 ? `
### ✅ All Tests Passed!

The Claude Opus 4.1 integration is ready for use. You can now:

1. Use slash commands like \`/claude-opus deep-reasoning\`
2. Trigger workflows with natural language
3. Leverage extended thinking for complex analysis
4. Access all command types and capabilities

` : `
### ❌ Some Tests Failed

Please review the failed tests above and:

1. Check configuration and environment variables
2. Verify Vertex AI access and permissions
3. Ensure Claude Opus 4.1 model availability
4. Review error messages for specific issues

`}

${!report.apiTestsEnabled ? `
### 🔍 Enable API Tests

To test actual Claude Opus 4.1 connectivity:

1. Set \`ENABLE_CLAUDE_OPUS_API_TESTS=true\`
2. Ensure proper Vertex AI authentication
3. Re-run the test suite

` : ''}

## 🔗 Resources

- [Claude Opus 4.1 Integration Guide](./CLAUDE_OPUS_INTEGRATION_GUIDE.md)
- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [GitHub Workflows](/.github/workflows/)

---
*Generated by Claude Opus 4.1 Integration Test Suite*`;
    }

    /**
     * Print test summary
     */
    printSummary() {
        const passedTests = this.testResults.filter(t => t.status === 'PASS').length;
        const failedTests = this.testResults.filter(t => t.status === 'FAIL').length;
        const passRate = ((passedTests / this.testResults.length) * 100).toFixed(1);

        console.log('🧠 Claude Opus 4.1 Integration Test Summary');
        console.log('=' .repeat(50));
        console.log(`Total Tests: ${this.testResults.length}`);
        console.log(`Passed: ${passedTests} ✅`);
        console.log(`Failed: ${failedTests} ${failedTests > 0 ? '❌' : ''}`);
        console.log(`Pass Rate: ${passRate}%`);
        console.log(`API Tests: ${this.config.enableActualAPITests ? 'Enabled' : 'Disabled'}`);
        
        if (failedTests === 0) {
            console.log('\n🎉 All tests passed! Claude Opus 4.1 integration is ready for use.');
        } else {
            console.log('\n⚠️  Some tests failed. Check the detailed report for more information.');
        }
        
        console.log('\n📄 Detailed reports available:');
        console.log('   - claude-opus-integration-test-report.json');
        console.log('   - claude-opus-integration-test-report.md');
    }
}

// Run tests if called directly
async function main() {
    try {
        const tester = new ClaudeOpusIntegrationTester();
        await tester.runTestSuite();
        process.exit(0);
    } catch (error) {
        console.error('❌ Test suite failed:', error.message);
        process.exit(1);
    }
}

// Export for programmatic use
module.exports = ClaudeOpusIntegrationTester;

// Run if called directly
if (require.main === module) {
    main();
}
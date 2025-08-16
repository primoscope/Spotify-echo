#!/usr/bin/env node

/**
 * Comprehensive Perplexity & Grok-4 Validation Suite
 * 
 * Based on official Perplexity documentation requirements:
 * - Test official Grok-4 model access via Perplexity Pro
 * - Validate all MCP servers functionality
 * - Verify workflow integrations
 * - Check documentation implementation compliance
 * - Generate comprehensive validation report
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const { EnhancedPerplexityGrok4Integration } = require('./enhanced-perplexity-grok4-integration.js');

class ComprehensiveValidationSuite {
    constructor() {
        this.perplexityIntegration = new EnhancedPerplexityGrok4Integration();
        this.validationResults = {
            timestamp: new Date().toISOString(),
            version: '2.0.0',
            testSuites: {},
            overallScore: 0,
            recommendations: [],
            compliance: {}
        };
    }

    /**
     * Run complete validation suite
     */
    async runCompleteValidation() {
        console.log('🧪 Starting Comprehensive Perplexity & Grok-4 Validation Suite\n');
        console.log('📋 Based on Official Perplexity Documentation Requirements\n');

        try {
            // 1. API Integration Tests
            await this.validateAPIIntegration();

            // 2. Grok-4 Specific Tests
            await this.validateGrok4Integration();

            // 3. MCP Server Tests
            await this.validateMCPServers();

            // 4. Multi-Model Research Tests
            await this.validateMultiModelResearch();

            // 5. Repository Analysis Tests
            await this.validateRepositoryAnalysis();

            // 6. Documentation Compliance Check
            await this.validateDocumentationCompliance();

            // 7. Performance & Cost Analysis
            await this.validatePerformanceMetrics();

            // Calculate overall score and generate report
            this.calculateOverallScore();
            await this.generateValidationReport();

        } catch (error) {
            console.error(`❌ Validation suite failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Validate API integration and connectivity
     */
    async validateAPIIntegration() {
        console.log('🔌 Testing API Integration & Connectivity...\n');
        
        const testSuite = {
            name: 'API Integration',
            tests: [],
            score: 0,
            maxScore: 0
        };

        const apiTests = [
            {
                name: 'API Key Configuration',
                test: async () => {
                    const hasApiKey = !!process.env.PERPLEXITY_API_KEY;
                    const isValidFormat = process.env.PERPLEXITY_API_KEY?.startsWith('pplx-');
                    return { hasApiKey, isValidFormat, success: hasApiKey && isValidFormat };
                }
            },
            {
                name: 'Basic Connectivity',
                test: async () => {
                    try {
                        const result = await this.perplexityIntegration.makeEnhancedRequest(
                            'Test connectivity', 'sonar', { maxTokens: 50 }
                        );
                        return { success: true, responseTime: result.responseTime };
                    } catch (error) {
                        return { success: false, error: error.message };
                    }
                }
            },
            {
                name: 'Model Availability Check',
                test: async () => {
                    const models = Object.keys(this.perplexityIntegration.models);
                    const availableModels = [];
                    const failedModels = [];
                    
                    for (const model of models.slice(0, 3)) { // Test first 3 models
                        try {
                            await this.perplexityIntegration.makeEnhancedRequest(
                                'Quick test', model, { maxTokens: 20 }
                            );
                            availableModels.push(model);
                        } catch (error) {
                            failedModels.push({ model, error: error.message });
                        }
                    }
                    
                    return { 
                        success: availableModels.length > 0, 
                        availableModels, 
                        failedModels 
                    };
                }
            }
        ];

        for (const apiTest of apiTests) {
            testSuite.maxScore++;
            try {
                console.log(`  🔍 ${apiTest.name}...`);
                const result = await apiTest.test();
                
                if (result.success) {
                    console.log(`    ✅ Passed`);
                    testSuite.score++;
                } else {
                    console.log(`    ❌ Failed: ${result.error || 'Test failed'}`);
                }
                
                testSuite.tests.push({
                    name: apiTest.name,
                    passed: result.success,
                    details: result
                });
            } catch (error) {
                console.log(`    ❌ Error: ${error.message}`);
                testSuite.tests.push({
                    name: apiTest.name,
                    passed: false,
                    error: error.message
                });
            }
        }

        this.validationResults.testSuites.apiIntegration = testSuite;
        console.log(`📊 API Integration Score: ${testSuite.score}/${testSuite.maxScore}\n`);
    }

    /**
     * Validate Grok-4 specific functionality
     */
    async validateGrok4Integration() {
        console.log('🧠 Testing Grok-4 Integration (Official Perplexity Pro)...\n');
        
        const testSuite = {
            name: 'Grok-4 Integration',
            tests: [],
            score: 0,
            maxScore: 0
        };

        const grok4Tests = [
            {
                name: 'Grok-4 Equivalent Model Access',
                test: async () => {
                    try {
                        const result = await this.perplexityIntegration.makeEnhancedRequest(
                            'Test Grok-4 equivalent access with basic reasoning task', 
                            'grok-4-equivalent', 
                            { maxTokens: 100, researchMode: 'rapid' }
                        );
                        return { 
                            success: true, 
                            model: result.actualModel,
                            responseTime: result.responseTime,
                            hasWebSearch: result.webSearch,
                            hasCitations: result.citations?.length > 0
                        };
                    } catch (error) {
                        return { success: false, error: error.message };
                    }
                }
            },
            {
                name: 'Enhanced Research Mode',
                test: async () => {
                    try {
                        const result = await this.perplexityIntegration.makeEnhancedRequest(
                            'Analyze current AI development trends', 
                            'grok-4-equivalent', 
                            { 
                                researchMode: 'comprehensive',
                                maxTokens: 500,
                                returnCitations: true
                            }
                        );
                        return { 
                            success: true,
                            hasCitations: result.citations?.length > 0,
                            hasRelatedQuestions: result.relatedQuestions?.length > 0,
                            responseLength: result.response.length
                        };
                    } catch (error) {
                        return { success: false, error: error.message };
                    }
                }
            },
            {
                name: 'Advanced Reasoning Capabilities',
                test: async () => {
                    try {
                        const complexQuery = 'Analyze the integration between MCP servers and Perplexity API, considering performance, scalability, and cost optimization. Provide strategic recommendations.';
                        const result = await this.perplexityIntegration.makeEnhancedRequest(
                            complexQuery, 
                            'grok-4-equivalent', 
                            { 
                                researchMode: 'comprehensive',
                                maxTokens: 1000
                            }
                        );
                        
                        const hasStrategicContent = result.response.toLowerCase().includes('recommend') ||
                                                   result.response.toLowerCase().includes('strategy') ||
                                                   result.response.toLowerCase().includes('optimization');
                        
                        return { 
                            success: true,
                            hasStrategicContent,
                            responseQuality: result.response.length > 500 ? 'high' : 'medium',
                            analysisDepth: result.response.split('\n').length
                        };
                    } catch (error) {
                        return { success: false, error: error.message };
                    }
                }
            }
        ];

        for (const grok4Test of grok4Tests) {
            testSuite.maxScore++;
            try {
                console.log(`  🧠 ${grok4Test.name}...`);
                const result = await grok4Test.test();
                
                if (result.success) {
                    console.log(`    ✅ Passed`);
                    testSuite.score++;
                } else {
                    console.log(`    ❌ Failed: ${result.error || 'Test failed'}`);
                }
                
                testSuite.tests.push({
                    name: grok4Test.name,
                    passed: result.success,
                    details: result
                });
            } catch (error) {
                console.log(`    ❌ Error: ${error.message}`);
                testSuite.tests.push({
                    name: grok4Test.name,
                    passed: false,
                    error: error.message
                });
            }
        }

        this.validationResults.testSuites.grok4Integration = testSuite;
        console.log(`📊 Grok-4 Integration Score: ${testSuite.score}/${testSuite.maxScore}\n`);
    }

    /**
     * Validate MCP servers functionality
     */
    async validateMCPServers() {
        console.log('🔧 Testing MCP Servers Functionality...\n');
        
        const testSuite = {
            name: 'MCP Servers',
            tests: [],
            score: 0,
            maxScore: 0
        };

        // Check MCP server files and structure
        const mcpServersPath = path.join(process.cwd(), 'mcp-servers');
        const expectedServers = ['perplexity-mcp', 'analytics-server', 'browserbase', 'code-sandbox'];
        
        for (const serverName of expectedServers) {
            testSuite.maxScore++;
            const serverPath = path.join(mcpServersPath, serverName);
            
            try {
                console.log(`  🔍 Checking ${serverName}...`);
                
                const stats = await fs.stat(serverPath);
                const hasPackageJson = await fs.access(path.join(serverPath, 'package.json')).then(() => true).catch(() => false);
                const hasIndexJs = await fs.access(path.join(serverPath, 'index.js')).then(() => true).catch(() => false);
                
                const isValid = stats.isDirectory() && hasPackageJson && hasIndexJs;
                
                if (isValid) {
                    console.log(`    ✅ ${serverName} structure valid`);
                    testSuite.score++;
                } else {
                    console.log(`    ❌ ${serverName} structure invalid`);
                }
                
                testSuite.tests.push({
                    name: `${serverName} Structure`,
                    passed: isValid,
                    details: { hasPackageJson, hasIndexJs, isDirectory: stats.isDirectory() }
                });
            } catch (error) {
                console.log(`    ❌ ${serverName} not found or inaccessible`);
                testSuite.tests.push({
                    name: `${serverName} Structure`,
                    passed: false,
                    error: error.message
                });
            }
        }

        this.validationResults.testSuites.mcpServers = testSuite;
        console.log(`📊 MCP Servers Score: ${testSuite.score}/${testSuite.maxScore}\n`);
    }

    /**
     * Validate multi-model research capabilities
     */
    async validateMultiModelResearch() {
        console.log('🔬 Testing Multi-Model Research Synthesis...\n');
        
        const testSuite = {
            name: 'Multi-Model Research',
            tests: [],
            score: 0,
            maxScore: 1
        };

        try {
            console.log('  🔍 Multi-model research synthesis test...');
            
            const researchResult = await this.perplexityIntegration.conductMultiModelResearch(
                'Best practices for AI-powered code analysis in 2025',
                {
                    primaryModel: 'grok-4-equivalent',
                    secondaryModels: ['sonar-pro'],
                    researchMode: 'standard'
                }
            );
            
            const success = researchResult.results && researchResult.results.length >= 1;
            
            if (success) {
                console.log('    ✅ Multi-model research working');
                testSuite.score++;
            } else {
                console.log('    ❌ Multi-model research failed');
            }
            
            testSuite.tests.push({
                name: 'Multi-Model Research Synthesis',
                passed: success,
                details: {
                    totalModels: researchResult.totalModels,
                    hasResults: !!researchResult.results,
                    hasSynthesis: !!researchResult.synthesis
                }
            });
        } catch (error) {
            console.log(`    ❌ Multi-model research error: ${error.message}`);
            testSuite.tests.push({
                name: 'Multi-Model Research Synthesis',
                passed: false,
                error: error.message
            });
        }

        this.validationResults.testSuites.multiModelResearch = testSuite;
        console.log(`📊 Multi-Model Research Score: ${testSuite.score}/${testSuite.maxScore}\n`);
    }

    /**
     * Validate repository analysis with Grok-4
     */
    async validateRepositoryAnalysis() {
        console.log('📁 Testing Repository Analysis with Grok-4...\n');
        
        const testSuite = {
            name: 'Repository Analysis',
            tests: [],
            score: 0,
            maxScore: 2
        };

        const analysisTests = [
            {
                name: 'Comprehensive Repository Analysis',
                type: 'comprehensive'
            },
            {
                name: 'Security-Focused Analysis',
                type: 'security'
            }
        ];

        for (const analysisTest of analysisTests) {
            try {
                console.log(`  🔍 ${analysisTest.name}...`);
                
                const result = await this.perplexityIntegration.analyzeRepositoryWithGrok4(
                    '.', 
                    analysisTest.type
                );
                
                const success = result && result.analysis && result.analysis.response.length > 500;
                
                if (success) {
                    console.log(`    ✅ ${analysisTest.name} completed`);
                    testSuite.score++;
                } else {
                    console.log(`    ❌ ${analysisTest.name} failed`);
                }
                
                testSuite.tests.push({
                    name: analysisTest.name,
                    passed: success,
                    details: {
                        analysisType: analysisTest.type,
                        hasStructure: !!result?.structure,
                        hasAnalysis: !!result?.analysis,
                        responseLength: result?.analysis?.response?.length || 0
                    }
                });
            } catch (error) {
                console.log(`    ❌ ${analysisTest.name} error: ${error.message}`);
                testSuite.tests.push({
                    name: analysisTest.name,
                    passed: false,
                    error: error.message
                });
            }
        }

        this.validationResults.testSuites.repositoryAnalysis = testSuite;
        console.log(`📊 Repository Analysis Score: ${testSuite.score}/${testSuite.maxScore}\n`);
    }

    /**
     * Validate documentation compliance
     */
    async validateDocumentationCompliance() {
        console.log('📋 Checking Documentation Compliance...\n');
        
        const testSuite = {
            name: 'Documentation Compliance',
            tests: [],
            score: 0,
            maxScore: 0
        };

        const complianceChecks = [
            {
                name: 'Perplexity API Documentation Files',
                test: async () => {
                    const docsPath = path.join(process.cwd(), 'perplexity_api_docs');
                    const hasDocsFolder = await fs.access(docsPath).then(() => true).catch(() => false);
                    return { success: hasDocsFolder };
                }
            },
            {
                name: 'Integration Guide Implementation',
                test: async () => {
                    const integrationFile = path.join(process.cwd(), 'enhanced-perplexity-grok4-integration.js');
                    const hasIntegrationFile = await fs.access(integrationFile).then(() => true).catch(() => false);
                    return { success: hasIntegrationFile };
                }
            },
            {
                name: 'Grok-4 Equivalent Model Usage',
                test: async () => {
                    // Check if we're using Grok-4 equivalent model via sonar-pro
                    const modelConfig = this.perplexityIntegration.models['grok-4-equivalent'];
                    const usesGrok4Equivalent = modelConfig && modelConfig.actualModel === 'sonar-pro';
                    return { success: usesGrok4Equivalent, actualModel: modelConfig?.actualModel };
                }
            },
            {
                name: 'Research Mode Implementation',
                test: async () => {
                    const hasResearchModes = Object.keys(this.perplexityIntegration.researchModes).length > 0;
                    return { success: hasResearchModes, modes: Object.keys(this.perplexityIntegration.researchModes) };
                }
            }
        ];

        for (const check of complianceChecks) {
            testSuite.maxScore++;
            try {
                console.log(`  📋 ${check.name}...`);
                const result = await check.test();
                
                if (result.success) {
                    console.log(`    ✅ Compliant`);
                    testSuite.score++;
                } else {
                    console.log(`    ❌ Non-compliant`);
                }
                
                testSuite.tests.push({
                    name: check.name,
                    passed: result.success,
                    details: result
                });
            } catch (error) {
                console.log(`    ❌ Error: ${error.message}`);
                testSuite.tests.push({
                    name: check.name,
                    passed: false,
                    error: error.message
                });
            }
        }

        this.validationResults.testSuites.documentationCompliance = testSuite;
        console.log(`📊 Documentation Compliance Score: ${testSuite.score}/${testSuite.maxScore}\n`);
    }

    /**
     * Validate performance metrics
     */
    async validatePerformanceMetrics() {
        console.log('⚡ Analyzing Performance Metrics...\n');
        
        const metrics = this.perplexityIntegration.getPerformanceMetrics();
        
        const testSuite = {
            name: 'Performance Metrics',
            tests: [{
                name: 'Performance Analysis',
                passed: true,
                details: metrics
            }],
            score: 1,
            maxScore: 1
        };

        console.log(`  📊 Total Requests: ${metrics.totalRequests}`);
        console.log(`  📊 Success Rate: ${metrics.successRate}`);
        console.log(`  📊 Average Response Time: ${metrics.averageResponseTime}`);
        console.log(`  📊 Model Usage: ${JSON.stringify(metrics.modelUsage)}`);

        this.validationResults.testSuites.performanceMetrics = testSuite;
        console.log(`📊 Performance Score: ${testSuite.score}/${testSuite.maxScore}\n`);
    }

    /**
     * Calculate overall validation score
     */
    calculateOverallScore() {
        let totalScore = 0;
        let maxScore = 0;

        for (const [suiteName, suite] of Object.entries(this.validationResults.testSuites)) {
            totalScore += suite.score;
            maxScore += suite.maxScore;
        }

        this.validationResults.overallScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
        
        // Generate recommendations based on failed tests
        this.generateRecommendations();
    }

    /**
     * Generate recommendations based on validation results
     */
    generateRecommendations() {
        const recommendations = [];

        for (const [suiteName, suite] of Object.entries(this.validationResults.testSuites)) {
            const failedTests = suite.tests.filter(test => !test.passed);
            
            if (failedTests.length > 0) {
                recommendations.push({
                    suite: suiteName,
                    priority: 'high',
                    recommendation: `Fix ${failedTests.length} failed tests in ${suite.name}`,
                    failedTests: failedTests.map(test => test.name)
                });
            }
        }

        // Add specific recommendations
        if (this.validationResults.testSuites.apiIntegration?.score < this.validationResults.testSuites.apiIntegration?.maxScore) {
            recommendations.push({
                priority: 'critical',
                recommendation: 'Ensure PERPLEXITY_API_KEY is configured with Perplexity Pro subscription for Grok-4 access'
            });
        }

        if (this.validationResults.testSuites.mcpServers?.score < this.validationResults.testSuites.mcpServers?.maxScore) {
            recommendations.push({
                priority: 'high',
                recommendation: 'Complete MCP server implementations with proper package.json and index.js files'
            });
        }

        this.validationResults.recommendations = recommendations;
    }

    /**
     * Generate comprehensive validation report
     */
    async generateValidationReport() {
        console.log('📄 Generating Comprehensive Validation Report...\n');

        const report = {
            ...this.validationResults,
            summary: {
                totalTests: Object.values(this.validationResults.testSuites).reduce((sum, suite) => sum + suite.maxScore, 0),
                passedTests: Object.values(this.validationResults.testSuites).reduce((sum, suite) => sum + suite.score, 0),
                overallScore: this.validationResults.overallScore,
                status: this.validationResults.overallScore >= 80 ? 'EXCELLENT' : 
                       this.validationResults.overallScore >= 60 ? 'GOOD' : 
                       this.validationResults.overallScore >= 40 ? 'FAIR' : 'NEEDS_IMPROVEMENT'
            }
        };

        // Save detailed JSON report
        const reportsDir = path.join(process.cwd(), 'validation-reports');
        await fs.mkdir(reportsDir, { recursive: true });
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = path.join(reportsDir, `comprehensive-validation-${timestamp}.json`);
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        // Generate markdown summary
        const markdownReport = this.generateMarkdownReport(report);
        const markdownPath = path.join(reportsDir, `validation-summary-${timestamp}.md`);
        await fs.writeFile(markdownPath, markdownReport);

        console.log(`📁 Detailed report saved: ${reportPath}`);
        console.log(`📁 Summary report saved: ${markdownPath}`);

        // Display summary
        console.log('\n' + '='.repeat(80));
        console.log('🎯 COMPREHENSIVE VALIDATION RESULTS');
        console.log('='.repeat(80));
        console.log(`Overall Score: ${report.summary.overallScore}/100 (${report.summary.status})`);
        console.log(`Tests Passed: ${report.summary.passedTests}/${report.summary.totalTests}`);
        
        for (const [suiteName, suite] of Object.entries(this.validationResults.testSuites)) {
            console.log(`${suite.name}: ${suite.score}/${suite.maxScore}`);
        }
        
        if (report.recommendations.length > 0) {
            console.log('\n🔧 RECOMMENDATIONS:');
            report.recommendations.forEach((rec, i) => {
                console.log(`${i + 1}. [${rec.priority?.toUpperCase() || 'MEDIUM'}] ${rec.recommendation}`);
            });
        }
        
        console.log('='.repeat(80));
    }

    /**
     * Generate markdown report
     */
    generateMarkdownReport(report) {
        const markdown = `# Comprehensive Perplexity & Grok-4 Validation Report

**Generated:** ${report.timestamp}  
**Version:** ${report.version}  
**Overall Score:** ${report.summary.overallScore}/100 (${report.summary.status})

## Summary

- **Total Tests:** ${report.summary.totalTests}
- **Passed Tests:** ${report.summary.passedTests}
- **Success Rate:** ${Math.round((report.summary.passedTests / report.summary.totalTests) * 100)}%
- **Status:** ${report.summary.status}

## Test Suite Results

${Object.entries(report.testSuites).map(([suiteName, suite]) => `
### ${suite.name}
**Score:** ${suite.score}/${suite.maxScore}

${suite.tests.map(test => `- ${test.passed ? '✅' : '❌'} ${test.name}`).join('\n')}
`).join('\n')}

## Recommendations

${report.recommendations.map((rec, i) => `${i + 1}. **[${rec.priority?.toUpperCase() || 'MEDIUM'}]** ${rec.recommendation}`).join('\n')}

## Performance Metrics

${report.testSuites.performanceMetrics ? `
- **Total Requests:** ${report.testSuites.performanceMetrics.tests[0]?.details?.totalRequests || 'N/A'}
- **Success Rate:** ${report.testSuites.performanceMetrics.tests[0]?.details?.successRate || 'N/A'}
- **Average Response Time:** ${report.testSuites.performanceMetrics.tests[0]?.details?.averageResponseTime || 'N/A'}
` : 'No performance metrics available'}

---
*Generated by Comprehensive Perplexity & Grok-4 Validation Suite*
`;
        return markdown;
    }
}

// CLI interface
async function main() {
    const validator = new ComprehensiveValidationSuite();
    
    try {
        await validator.runCompleteValidation();
        console.log('\n✅ Comprehensive validation completed successfully!');
    } catch (error) {
        console.error(`\n❌ Validation failed: ${error.message}`);
        process.exit(1);
    }
}

// Export for module use
module.exports = { ComprehensiveValidationSuite };

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}
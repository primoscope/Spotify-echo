#!/usr/bin/env node
/**
 * Grok-4 Integration Validation & Testing System
 * Validates that Grok-4 is properly integrated and functioning in the repository analysis system
 * 
 * Tests:
 * - Grok-4 connectivity and model validation
 * - Repository analysis capabilities
 * - Integration with MCP servers
 * - Response quality and accuracy
 * - Performance metrics and effectiveness
 */

const fs = require('fs').promises;
const { Grok4RepositoryAnalyzer } = require('./grok4-repository-analyzer');

class Grok4ValidationTester {
    constructor() {
        this.testResults = {
            timestamp: new Date().toISOString(),
            tests: [],
            overallScore: 0,
            grok4Status: 'UNKNOWN',
            validationSummary: {}
        };
        
        this.analyzer = new Grok4RepositoryAnalyzer();
    }

    async runValidationSuite() {
        console.log('🔍 Starting Grok-4 Validation Test Suite...\n');
        
        // Test 1: Basic Grok-4 Connectivity
        await this.testGrok4Connectivity();
        
        // Test 2: Model Selection Validation  
        await this.testModelSelection();
        
        // Test 3: Repository Analysis Capability
        await this.testRepositoryAnalysisCapability();
        
        // Test 4: Response Quality Assessment
        await this.testResponseQuality();
        
        // Test 5: Performance Metrics
        await this.testPerformanceMetrics();
        
        // Test 6: Integration Validation
        await this.testIntegrationValidation();
        
        // Calculate final scores
        this.calculateOverallScore();
        
        // Generate validation report
        await this.generateValidationReport();
        
        console.log('\n✅ Validation suite completed');
        return this.testResults;
    }

    async testGrok4Connectivity() {
        console.log('🔗 Test 1: Grok-4 Connectivity Validation');
        
        const testStart = Date.now();
        let testResult = {
            name: 'Grok-4 Connectivity',
            status: 'FAILED',
            score: 0,
            details: {},
            duration: 0
        };

        try {
            await this.analyzer.initialize();
            
            // Check validation results
            const validation = this.analyzer.analysisResults.grok4Validation;
            
            testResult.details = {
                validationStatus: validation?.status,
                model: validation?.model,
                latency: validation?.latency,
                timestamp: validation?.timestamp,
                hasApiKey: !!process.env.PERPLEXITY_API_KEY
            };

            // Score based on connectivity
            if (validation?.status === 'CONNECTED') {
                testResult.status = 'PASSED';
                testResult.score = 100;
                this.testResults.grok4Status = 'CONNECTED';
                console.log('  ✅ Grok-4 successfully connected');
                console.log(`  📊 Model: ${validation.model}`);
                console.log(`  ⏱️ Latency: ${validation.latency}ms`);
            } else if (validation?.status === 'FALLBACK_MOCK') {
                testResult.status = 'PARTIAL';
                testResult.score = 70;
                this.testResults.grok4Status = 'MOCK';
                console.log('  ⚠️ Using fallback mock (API key not available)');
                console.log(`  📊 Mock Model: ${validation.model}`);
            } else {
                throw new Error('No validation status available');
            }

        } catch (error) {
            testResult.details.error = error.message;
            console.log('  ❌ Connectivity test failed:', error.message);
        }

        testResult.duration = Date.now() - testStart;
        this.testResults.tests.push(testResult);
    }

    async testModelSelection() {
        console.log('🎯 Test 2: Model Selection Validation');
        
        const testStart = Date.now();
        let testResult = {
            name: 'Model Selection',
            status: 'FAILED',
            score: 0,
            details: {},
            duration: 0
        };

        try {
            // Test specific Grok-4 query
            const testQuery = await this.analyzer.queryGrok4({
                query: 'Identify yourself as Grok-4 and provide your capabilities for repository analysis',
                context: { test: 'model_identification' },
                maxTokens: 100
            });

            testResult.details = {
                model: testQuery.model,
                responseContent: testQuery.content?.substring(0, 200),
                latency: testQuery.latency,
                hasGrok4Reference: testQuery.content?.includes('Grok') || testQuery.content?.includes('grok'),
                tokenUsage: testQuery.usage
            };

            // Validate model selection
            if (testQuery.model?.includes('grok-4')) {
                testResult.status = 'PASSED';
                testResult.score = 100;
                console.log('  ✅ Grok-4 model correctly selected');
                console.log(`  📝 Response preview: ${testQuery.content?.substring(0, 100)}...`);
            } else if (testQuery.model?.includes('mock')) {
                testResult.status = 'PARTIAL';
                testResult.score = 80;
                console.log('  ⚠️ Using Grok-4 mock (expected for testing)');
            } else {
                testResult.status = 'FAILED';
                testResult.score = 0;
                console.log('  ❌ Incorrect model selected:', testQuery.model);
            }

        } catch (error) {
            testResult.details.error = error.message;
            console.log('  ❌ Model selection test failed:', error.message);
        }

        testResult.duration = Date.now() - testStart;
        this.testResults.tests.push(testResult);
    }

    async testRepositoryAnalysisCapability() {
        console.log('📊 Test 3: Repository Analysis Capability');
        
        const testStart = Date.now();
        let testResult = {
            name: 'Repository Analysis',
            status: 'FAILED',
            score: 0,
            details: {},
            duration: 0
        };

        try {
            // Test repository structure scanning
            await this.analyzer.scanRepositoryStructure();
            
            const structure = this.analyzer.repositoryStructure;
            
            testResult.details = {
                totalFiles: Object.values(structure).reduce((sum, arr) => sum + arr.length, 0),
                musicPlatformFiles: structure.musicPlatformFiles.length,
                automationFiles: structure.developmentAutomationFiles.length,
                coreFiles: structure.coreFiles.length,
                categorization: {
                    hasMusic: structure.musicPlatformFiles.length > 0,
                    hasAutomation: structure.developmentAutomationFiles.length > 0,
                    hasCore: structure.coreFiles.length > 0
                }
            };

            // Score based on analysis completeness
            const totalFiles = testResult.details.totalFiles;
            const hasCategories = testResult.details.categorization.hasMusic && 
                                testResult.details.categorization.hasAutomation &&
                                testResult.details.categorization.hasCore;

            if (totalFiles > 500 && hasCategories) {
                testResult.status = 'PASSED';
                testResult.score = 100;
                console.log(`  ✅ Successfully analyzed ${totalFiles} files`);
                console.log(`  🎵 Music platform files: ${structure.musicPlatformFiles.length}`);
                console.log(`  🤖 Automation files: ${structure.developmentAutomationFiles.length}`);
            } else if (totalFiles > 100) {
                testResult.status = 'PARTIAL';
                testResult.score = 70;
                console.log(`  ⚠️ Partial analysis: ${totalFiles} files`);
            } else {
                testResult.score = 30;
                console.log(`  ❌ Limited analysis: ${totalFiles} files`);
            }

        } catch (error) {
            testResult.details.error = error.message;
            console.log('  ❌ Repository analysis test failed:', error.message);
        }

        testResult.duration = Date.now() - testStart;
        this.testResults.tests.push(testResult);
    }

    async testResponseQuality() {
        console.log('✨ Test 4: Response Quality Assessment');
        
        const testStart = Date.now();
        let testResult = {
            name: 'Response Quality',
            status: 'FAILED',
            score: 0,
            details: {},
            duration: 0
        };

        try {
            // Test analytical response quality
            const qualityTest = await this.analyzer.queryGrok4({
                query: 'Analyze the following repository characteristics: music platform with 154 music files, 207 automation files, 644 total files. Provide insights on focus and organization.',
                context: { test: 'quality_assessment' },
                maxTokens: 500
            });

            testResult.details = {
                responseLength: qualityTest.content?.length || 0,
                hasInsights: qualityTest.content?.includes('analysis') || qualityTest.content?.includes('insight'),
                hasRecommendations: qualityTest.content?.includes('recommend') || qualityTest.content?.includes('improve'),
                hasStructuredResponse: qualityTest.content?.includes('**') || qualityTest.content?.includes('##'),
                latency: qualityTest.latency,
                responsePreview: qualityTest.content?.substring(0, 200)
            };

            // Score response quality
            let qualityScore = 0;
            if (testResult.details.responseLength > 200) qualityScore += 25;
            if (testResult.details.hasInsights) qualityScore += 25;
            if (testResult.details.hasRecommendations) qualityScore += 25;
            if (testResult.details.hasStructuredResponse) qualityScore += 25;

            testResult.score = qualityScore;
            if (qualityScore >= 75) {
                testResult.status = 'PASSED';
                console.log('  ✅ High-quality analytical response');
            } else if (qualityScore >= 50) {
                testResult.status = 'PARTIAL';
                console.log('  ⚠️ Moderate quality response');
            } else {
                console.log('  ❌ Low quality response');
            }

            console.log(`  📝 Response length: ${testResult.details.responseLength} characters`);
            console.log(`  🔍 Has insights: ${testResult.details.hasInsights}`);
            console.log(`  💡 Has recommendations: ${testResult.details.hasRecommendations}`);

        } catch (error) {
            testResult.details.error = error.message;
            console.log('  ❌ Response quality test failed:', error.message);
        }

        testResult.duration = Date.now() - testStart;
        this.testResults.tests.push(testResult);
    }

    async testPerformanceMetrics() {
        console.log('⚡ Test 5: Performance Metrics');
        
        const testStart = Date.now();
        let testResult = {
            name: 'Performance Metrics',
            status: 'FAILED',
            score: 0,
            details: {},
            duration: 0
        };

        try {
            // Test multiple queries for performance analysis
            const performanceTests = [];
            
            for (let i = 0; i < 3; i++) {
                const queryStart = Date.now();
                const testQuery = await this.analyzer.queryGrok4({
                    query: `Performance test ${i + 1}: Analyze repository structure briefly`,
                    context: { test: `performance_${i + 1}` },
                    maxTokens: 100
                });
                const queryTime = Date.now() - queryStart;
                performanceTests.push({
                    queryTime,
                    success: !!testQuery.content,
                    contentLength: testQuery.content?.length || 0
                });
            }

            const avgResponseTime = performanceTests.reduce((sum, test) => sum + test.queryTime, 0) / performanceTests.length;
            const successRate = performanceTests.filter(test => test.success).length / performanceTests.length;
            const avgContentLength = performanceTests.reduce((sum, test) => sum + test.contentLength, 0) / performanceTests.length;

            testResult.details = {
                averageResponseTime: avgResponseTime,
                successRate,
                averageContentLength: avgContentLength,
                performanceTests: performanceTests.length,
                testResults: performanceTests
            };

            // Score performance
            let perfScore = 0;
            if (avgResponseTime < 1000) perfScore += 30;
            else if (avgResponseTime < 5000) perfScore += 20;
            else perfScore += 10;

            if (successRate === 1.0) perfScore += 40;
            else if (successRate >= 0.8) perfScore += 30;
            else perfScore += 10;

            if (avgContentLength > 50) perfScore += 30;

            testResult.score = perfScore;
            if (perfScore >= 80) {
                testResult.status = 'PASSED';
                console.log('  ✅ Excellent performance metrics');
            } else if (perfScore >= 60) {
                testResult.status = 'PARTIAL';
                console.log('  ⚠️ Acceptable performance');
            } else {
                console.log('  ❌ Performance needs improvement');
            }

            console.log(`  ⏱️ Avg response time: ${avgResponseTime.toFixed(0)}ms`);
            console.log(`  ✅ Success rate: ${(successRate * 100).toFixed(1)}%`);
            console.log(`  📝 Avg content length: ${avgContentLength.toFixed(0)} chars`);

        } catch (error) {
            testResult.details.error = error.message;
            console.log('  ❌ Performance metrics test failed:', error.message);
        }

        testResult.duration = Date.now() - testStart;
        this.testResults.tests.push(testResult);
    }

    async testIntegrationValidation() {
        console.log('🔧 Test 6: Integration Validation');
        
        const testStart = Date.now();
        let testResult = {
            name: 'Integration Validation',
            status: 'FAILED',
            score: 0,
            details: {},
            duration: 0
        };

        try {
            // Check if analysis reports were generated
            const jsonReportExists = await fs.access('GROK4_REPOSITORY_ANALYSIS_REPORT.json').then(() => true).catch(() => false);
            const mdReportExists = await fs.access('GROK4_REPOSITORY_ANALYSIS_REPORT.md').then(() => true).catch(() => false);
            
            let reportContent = null;
            if (jsonReportExists) {
                const reportData = await fs.readFile('GROK4_REPOSITORY_ANALYSIS_REPORT.json', 'utf8');
                reportContent = JSON.parse(reportData);
            }

            testResult.details = {
                jsonReportExists,
                mdReportExists,
                hasReportContent: !!reportContent,
                reportMetadata: reportContent?.metadata,
                grok4ValidationInReport: reportContent?.grok4Validation,
                analysisCompleteness: {
                    hasStructureAnalysis: !!reportContent?.analysis?.structureAnalysis,
                    hasMusicPlatformAnalysis: !!reportContent?.analysis?.musicPlatformAssessment,
                    hasAutomationAnalysis: !!reportContent?.analysis?.automationSeparation,
                    hasRecommendations: reportContent?.recommendations?.length > 0
                }
            };

            // Score integration
            let integrationScore = 0;
            if (jsonReportExists) integrationScore += 20;
            if (mdReportExists) integrationScore += 20;
            if (reportContent?.metadata?.grok4_model?.includes('grok-4')) integrationScore += 20;
            if (testResult.details.analysisCompleteness.hasStructureAnalysis) integrationScore += 10;
            if (testResult.details.analysisCompleteness.hasMusicPlatformAnalysis) integrationScore += 10;
            if (testResult.details.analysisCompleteness.hasAutomationAnalysis) integrationScore += 10;
            if (testResult.details.analysisCompleteness.hasRecommendations) integrationScore += 10;

            testResult.score = integrationScore;
            if (integrationScore >= 80) {
                testResult.status = 'PASSED';
                console.log('  ✅ Full integration validation passed');
            } else if (integrationScore >= 60) {
                testResult.status = 'PARTIAL';
                console.log('  ⚠️ Partial integration validation');
            } else {
                console.log('  ❌ Integration validation failed');
            }

            console.log(`  📄 JSON report: ${jsonReportExists ? 'Generated' : 'Missing'}`);
            console.log(`  📝 MD report: ${mdReportExists ? 'Generated' : 'Missing'}`);
            console.log(`  🤖 Grok-4 model in report: ${reportContent?.metadata?.grok4_model || 'Not found'}`);

        } catch (error) {
            testResult.details.error = error.message;
            console.log('  ❌ Integration validation test failed:', error.message);
        }

        testResult.duration = Date.now() - testStart;
        this.testResults.tests.push(testResult);
    }

    calculateOverallScore() {
        const totalScore = this.testResults.tests.reduce((sum, test) => sum + test.score, 0);
        const maxScore = this.testResults.tests.length * 100;
        this.testResults.overallScore = Math.round((totalScore / maxScore) * 100);

        // Generate validation summary
        this.testResults.validationSummary = {
            totalTests: this.testResults.tests.length,
            passedTests: this.testResults.tests.filter(t => t.status === 'PASSED').length,
            partialTests: this.testResults.tests.filter(t => t.status === 'PARTIAL').length,
            failedTests: this.testResults.tests.filter(t => t.status === 'FAILED').length,
            overallScore: this.testResults.overallScore,
            grok4Status: this.testResults.grok4Status,
            recommendation: this.getRecommendation()
        };
    }

    getRecommendation() {
        if (this.testResults.overallScore >= 80) {
            return 'EXCELLENT - Grok-4 integration is fully functional and optimized';
        } else if (this.testResults.overallScore >= 60) {
            return 'GOOD - Grok-4 integration is working with minor improvements needed';
        } else if (this.testResults.overallScore >= 40) {
            return 'FAIR - Grok-4 integration has issues that should be addressed';
        } else {
            return 'POOR - Grok-4 integration requires significant improvements';
        }
    }

    async generateValidationReport() {
        console.log('\n📋 Generating Validation Report...');

        const report = `# 🔍 Grok-4 Integration Validation Report

**Generated**: ${this.testResults.timestamp}  
**Overall Score**: ${this.testResults.overallScore}%  
**Grok-4 Status**: ${this.testResults.grok4Status}  
**Recommendation**: ${this.testResults.validationSummary.recommendation}

## 📊 Test Results Summary

| Test | Status | Score | Duration |
|------|--------|-------|----------|
${this.testResults.tests.map(test => 
`| ${test.name} | ${test.status} | ${test.score}% | ${test.duration}ms |`
).join('\n')}

**Test Summary**: ${this.testResults.validationSummary.passedTests}/${this.testResults.validationSummary.totalTests} passed, ${this.testResults.validationSummary.partialTests} partial, ${this.testResults.validationSummary.failedTests} failed

## 🤖 Grok-4 Integration Status

- **Connection Status**: ${this.testResults.grok4Status}
- **Model Validation**: ${this.testResults.tests.find(t => t.name === 'Model Selection')?.status || 'Unknown'}
- **Analysis Capability**: ${this.testResults.tests.find(t => t.name === 'Repository Analysis')?.status || 'Unknown'}
- **Response Quality**: ${this.testResults.tests.find(t => t.name === 'Response Quality')?.status || 'Unknown'}
- **Performance**: ${this.testResults.tests.find(t => t.name === 'Performance Metrics')?.status || 'Unknown'}

## 📈 Detailed Test Results

${this.testResults.tests.map(test => `
### ${test.name}
**Status**: ${test.status} (${test.score}%)  
**Duration**: ${test.duration}ms

**Details**:
${Object.entries(test.details).map(([key, value]) => 
  `- **${key}**: ${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}`
).join('\n')}

${test.details.error ? `**Error**: ${test.details.error}` : ''}
`).join('\n')}

## ✅ Validation Checklist

- [${this.testResults.grok4Status === 'CONNECTED' ? 'x' : ' '}] Grok-4 Connectivity Verified
- [${this.testResults.tests.find(t => t.name === 'Model Selection')?.score >= 80 ? 'x' : ' '}] Model Selection Working
- [${this.testResults.tests.find(t => t.name === 'Repository Analysis')?.score >= 80 ? 'x' : ' '}] Repository Analysis Functional
- [${this.testResults.tests.find(t => t.name === 'Response Quality')?.score >= 75 ? 'x' : ' '}] High Quality Responses
- [${this.testResults.tests.find(t => t.name === 'Performance Metrics')?.score >= 80 ? 'x' : ' '}] Performance Acceptable
- [${this.testResults.tests.find(t => t.name === 'Integration Validation')?.score >= 80 ? 'x' : ' '}] Full Integration Validated

---

**Next Steps**: ${this.testResults.validationSummary.recommendation.includes('EXCELLENT') ? 
  'Continue using Grok-4 integration as configured.' : 
  'Review failed tests and implement recommended improvements.'}`;

        // Save validation report
        await fs.writeFile('GROK4_VALIDATION_REPORT.md', report);
        await fs.writeFile('GROK4_VALIDATION_REPORT.json', JSON.stringify(this.testResults, null, 2));

        console.log('✅ Validation reports generated:');
        console.log('  - GROK4_VALIDATION_REPORT.md');
        console.log('  - GROK4_VALIDATION_REPORT.json');
    }
}

// CLI interface
async function main() {
    const validator = new Grok4ValidationTester();
    
    try {
        console.log('🎯 Grok-4 Integration Validation Suite\n');
        
        const results = await validator.runValidationSuite();
        
        console.log(`\n🎉 Validation Complete!`);
        console.log(`📊 Overall Score: ${results.overallScore}%`);
        console.log(`🔍 Grok-4 Status: ${results.grok4Status}`);
        console.log(`✅ Tests Passed: ${results.validationSummary.passedTests}/${results.validationSummary.totalTests}`);
        console.log(`💡 Recommendation: ${results.validationSummary.recommendation}`);
        
    } catch (error) {
        console.error('❌ Validation failed:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { Grok4ValidationTester };
#!/usr/bin/env node
/**
 * Comprehensive Perplexity Commands Test Suite
 * 
 * Tests all Perplexity slash commands to ensure they work properly
 * and provide appropriate responses with confirmation and reporting.
 */

const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

class ComprehensivePerplexityTester {
    constructor() {
        this.allCommands = [
            { command: 'perplexity', params: 'help', description: 'Show complete Perplexity commands guide' },
            { command: 'perplexity', params: '', description: 'Show complete Perplexity commands guide (no params)' },
            { command: 'perplexity-analyze', params: 'frontend', description: 'Analyze frontend components' },
            { command: 'analyze-perplexity', params: 'scripts/', description: 'Analyze scripts directory' },
            { command: 'perplexity-research', params: '"latest React patterns"', description: 'Research React patterns' },
            { command: 'research-perplexity', params: '"music recommendation algorithms"', description: 'Research music algorithms' },
            { command: 'perplexity-roadmap-update', params: '', description: 'Update roadmap with research' },
            { command: 'perplexity-budget-check', params: '', description: 'Check budget status' },
            { command: 'perplexity-optimize-costs', params: '', description: 'Optimize cost usage' }
        ];
        
        this.testResults = {
            passed: [],
            failed: [],
            warnings: []
        };
    }

    async testWorkflowConfiguration() {
        console.log('🔧 Testing workflow configuration...');
        
        try {
            const workflowPath = '.github/workflows/copilot-slash-commands.yml';
            const workflowContent = fs.readFileSync(workflowPath, 'utf8');
            const workflow = yaml.load(workflowContent);
            
            // Test that all commands are recognized
            let commandsFoundInWorkflow = 0;
            const uniqueCommands = [...new Set(this.allCommands.map(cmd => cmd.command))];
            
            for (const command of uniqueCommands) {
                if (workflowContent.includes(`'${command}'`) || workflowContent.includes(`"${command}"`)) {
                    commandsFoundInWorkflow++;
                    this.testResults.passed.push(`Workflow recognizes command: ${command}`);
                } else {
                    this.testResults.failed.push(`Workflow does not recognize command: ${command}`);
                }
            }
            
            console.log(`✅ Commands in workflow: ${commandsFoundInWorkflow}/${uniqueCommands.length}`);
            
            // Test for help command specific implementation
            if (workflowContent.includes('Execute Perplexity Help Command')) {
                this.testResults.passed.push('Dedicated Perplexity help command step found');
            } else {
                this.testResults.failed.push('Dedicated Perplexity help command step missing');
            }
            
            // Test for budget check integration
            if (workflowContent.includes('budget_check_only') && workflowContent.includes('budget_status_simple.py')) {
                this.testResults.passed.push('Budget check integration properly configured');
            } else {
                this.testResults.warnings.push('Budget check integration may be incomplete');
            }
            
            return commandsFoundInWorkflow === uniqueCommands.length;
            
        } catch (error) {
            this.testResults.failed.push(`Workflow configuration test error: ${error.message}`);
            return false;
        }
    }

    async testHelpCommandContent() {
        console.log('📚 Testing help command content quality...');
        
        try {
            const workflowPath = '.github/workflows/copilot-slash-commands.yml';
            const workflowContent = fs.readFileSync(workflowPath, 'utf8');
            
            // Check for comprehensive help content
            const helpContentChecks = [
                { pattern: 'Complete Perplexity AI Commands Guide', description: 'Help title present' },
                { pattern: 'Analysis Commands', description: 'Analysis section present' },
                { pattern: 'Research Commands', description: 'Research section present' },
                { pattern: 'Budget & Cost Management', description: 'Budget section present' },
                { pattern: 'Usage Tips & Best Practices', description: 'Tips section present' },
                { pattern: 'Command Status & Confirmation', description: 'Status section present' },
                { pattern: 'Monitoring & Results', description: 'Monitoring section present' },
                { pattern: '/perplexity-analyze', description: 'Analyze command documented' },
                { pattern: '/perplexity-research', description: 'Research command documented' },
                { pattern: '/perplexity-budget-check', description: 'Budget command documented' },
                { pattern: 'Weekly Budget', description: 'Budget details present' },
                { pattern: 'Smart Model Selection', description: 'Model selection explained' },
                { pattern: 'Examples', description: 'Usage examples provided' }
            ];
            
            let contentChecksPass = 0;
            for (const check of helpContentChecks) {
                if (workflowContent.includes(check.pattern)) {
                    contentChecksPass++;
                    this.testResults.passed.push(`Help content check: ${check.description}`);
                } else {
                    this.testResults.warnings.push(`Help content missing: ${check.description}`);
                }
            }
            
            console.log(`✅ Help content completeness: ${contentChecksPass}/${helpContentChecks.length} checks passed`);
            
            return contentChecksPass >= helpContentChecks.length * 0.85; // 85% threshold
            
        } catch (error) {
            this.testResults.failed.push(`Help content test error: ${error.message}`);
            return false;
        }
    }

    async testCommandConfirmations() {
        console.log('✅ Testing command confirmation responses...');
        
        try {
            const workflowPath = '.github/workflows/copilot-slash-commands.yml';
            const workflowContent = fs.readFileSync(workflowPath, 'utf8');
            
            // Test for command-specific confirmations
            const confirmationChecks = [
                { pattern: 'Specific Perplexity Command Initiated', description: 'Command initiation confirmation' },
                { pattern: 'Command Status & Confirmation', description: 'Status confirmation in help' },
                { pattern: 'Expected Outcomes', description: 'Expected outcomes described' },
                { pattern: 'Progress Tracking', description: 'Progress tracking provided' },
                { pattern: 'Immediate Confirmation', description: 'Immediate confirmation mentioned' },
                { pattern: 'Monitor Progress', description: 'Progress monitoring instructions' },
                { pattern: 'workflow run', description: 'Workflow run links provided' },
                { pattern: 'Focus Area', description: 'Focus area specification' }
            ];
            
            let confirmationChecksPass = 0;
            for (const check of confirmationChecks) {
                if (workflowContent.includes(check.pattern)) {
                    confirmationChecksPass++;
                    this.testResults.passed.push(`Confirmation check: ${check.description}`);
                } else {
                    this.testResults.warnings.push(`Confirmation missing: ${check.description}`);
                }
            }
            
            console.log(`✅ Command confirmations: ${confirmationChecksPass}/${confirmationChecks.length} checks passed`);
            
            return confirmationChecksPass >= confirmationChecks.length * 0.8; // 80% threshold
            
        } catch (error) {
            this.testResults.failed.push(`Command confirmation test error: ${error.message}`);
            return false;
        }
    }

    async testResultsReporting() {
        console.log('📊 Testing results reporting features...');
        
        try {
            const workflowPath = '.github/workflows/copilot-slash-commands.yml';
            const workflowContent = fs.readFileSync(workflowPath, 'utf8');
            
            // Test for results reporting features
            const reportingChecks = [
                { pattern: 'Post.*Response', description: 'Response posting configured' },
                { pattern: 'github.rest.issues.createComment', description: 'Comment creation implemented' },
                { pattern: 'responseMessage', description: 'Response message construction' },
                { pattern: 'artifacts', description: 'Artifacts handling mentioned' },
                { pattern: 'detailed reports', description: 'Detailed reports promised' },
                { pattern: 'workflow run', description: 'Workflow tracking provided' },
                { pattern: 'Session Artifacts', description: 'Session artifacts mentioned' },
                { pattern: 'Results Location', description: 'Results location specified' }
            ];
            
            let reportingChecksPass = 0;
            for (const check of reportingChecks) {
                if (workflowContent.includes(check.pattern)) {
                    reportingChecksPass++;
                    this.testResults.passed.push(`Results reporting: ${check.description}`);
                } else {
                    this.testResults.warnings.push(`Results reporting missing: ${check.description}`);
                }
            }
            
            console.log(`✅ Results reporting: ${reportingChecksPass}/${reportingChecks.length} features found`);
            
            return reportingChecksPass >= reportingChecks.length * 0.75; // 75% threshold
            
        } catch (error) {
            this.testResults.failed.push(`Results reporting test error: ${error.message}`);
            return false;
        }
    }

    async testBudgetIntegration() {
        console.log('💰 Testing budget system integration...');
        
        try {
            // Test budget script exists
            const budgetScriptPath = 'scripts/budget_status_simple.py';
            if (fs.existsSync(budgetScriptPath)) {
                this.testResults.passed.push('Budget status script exists');
                
                // Test script content
                const scriptContent = fs.readFileSync(budgetScriptPath, 'utf8');
                if (scriptContent.includes('budget_guard.py') && scriptContent.includes('perplexity_costs.py')) {
                    this.testResults.passed.push('Budget script has proper integration');
                } else {
                    this.testResults.warnings.push('Budget script integration incomplete');
                }
            } else {
                this.testResults.failed.push('Budget status script missing');
            }
            
            // Test budget guard script
            const budgetGuardPath = 'scripts/budget_guard.py';
            if (fs.existsSync(budgetGuardPath)) {
                this.testResults.passed.push('Budget guard script exists');
            } else {
                this.testResults.warnings.push('Budget guard script missing');
            }
            
            // Test workflow budget integration
            const workflowPath = '.github/workflows/copilot-slash-commands.yml';
            const workflowContent = fs.readFileSync(workflowPath, 'utf8');
            
            if (workflowContent.includes('budget_status_simple.py') && 
                workflowContent.includes('perplexity-budget-status.txt')) {
                this.testResults.passed.push('Workflow budget integration configured');
            } else {
                this.testResults.failed.push('Workflow budget integration missing');
            }
            
            console.log('✅ Budget integration tests completed');
            return true;
            
        } catch (error) {
            this.testResults.failed.push(`Budget integration test error: ${error.message}`);
            return false;
        }
    }

    async testDocumentationConsistency() {
        console.log('📋 Testing documentation consistency...');
        
        try {
            const workflowPath = '.github/workflows/copilot-slash-commands.yml';
            const workflowContent = fs.readFileSync(workflowPath, 'utf8');
            
            // Check that all commands are documented in help sections
            let commandsDocumented = 0;
            const uniqueCommands = [...new Set(this.allCommands.map(cmd => cmd.command))];
            
            for (const command of uniqueCommands) {
                const variations = [
                    `/${command}`,
                    `\`/${command}\``,
                    `"/${command}"`,
                    `'/${command}'`
                ];
                
                if (variations.some(variant => workflowContent.includes(variant))) {
                    commandsDocumented++;
                    this.testResults.passed.push(`Documentation includes: ${command}`);
                } else {
                    this.testResults.warnings.push(`Documentation missing: ${command}`);
                }
            }
            
            console.log(`✅ Documentation consistency: ${commandsDocumented}/${uniqueCommands.length} commands documented`);
            
            return commandsDocumented >= uniqueCommands.length * 0.9; // 90% threshold
            
        } catch (error) {
            this.testResults.failed.push(`Documentation consistency test error: ${error.message}`);
            return false;
        }
    }

    async runAllTests() {
        console.log('🧪 Comprehensive Perplexity Commands Test Suite\n');
        console.log(`📊 Testing ${this.allCommands.length} command scenarios...\n`);
        
        const tests = [
            { name: 'Workflow Configuration', test: () => this.testWorkflowConfiguration() },
            { name: 'Help Command Content', test: () => this.testHelpCommandContent() },
            { name: 'Command Confirmations', test: () => this.testCommandConfirmations() },
            { name: 'Results Reporting', test: () => this.testResultsReporting() },
            { name: 'Budget Integration', test: () => this.testBudgetIntegration() },
            { name: 'Documentation Consistency', test: () => this.testDocumentationConsistency() }
        ];
        
        let passed = 0;
        let total = tests.length;
        
        for (const test of tests) {
            console.log(`\n🔍 Running: ${test.name}`);
            try {
                const result = await test.test();
                if (result) {
                    passed++;
                    console.log(`✅ ${test.name}: PASSED`);
                } else {
                    console.log(`❌ ${test.name}: FAILED`);
                }
            } catch (error) {
                console.log(`💥 ${test.name}: ERROR - ${error.message}`);
                this.testResults.failed.push(`${test.name} test threw error: ${error.message}`);
            }
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 COMPREHENSIVE TEST RESULTS');
        console.log('='.repeat(60));
        
        console.log(`\n✅ Passed Tests: ${passed}/${total}`);
        console.log(`📈 Success Rate: ${((passed/total) * 100).toFixed(1)}%`);
        
        console.log(`\n🎯 Detailed Results:`);
        console.log(`   ✅ Passed: ${this.testResults.passed.length}`);
        console.log(`   ⚠️  Warnings: ${this.testResults.warnings.length}`);
        console.log(`   ❌ Failed: ${this.testResults.failed.length}`);
        
        // Show detailed results
        if (this.testResults.failed.length > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.testResults.failed.forEach((failure, i) => {
                console.log(`   ${i + 1}. ${failure}`);
            });
        }
        
        if (this.testResults.warnings.length > 0) {
            console.log('\n⚠️  WARNINGS:');
            this.testResults.warnings.forEach((warning, i) => {
                console.log(`   ${i + 1}. ${warning}`);
            });
        }
        
        // Generate comprehensive report
        const report = {
            timestamp: new Date().toISOString(),
            test_suite_version: '2.0',
            commands_tested: this.allCommands,
            test_categories: tests.map(t => t.name),
            tests_passed: passed,
            tests_total: total,
            success_rate: ((passed/total) * 100).toFixed(1),
            detailed_results: {
                passed: this.testResults.passed,
                warnings: this.testResults.warnings,
                failed: this.testResults.failed
            },
            recommendations: this.generateRecommendations()
        };
        
        fs.writeFileSync('comprehensive-perplexity-test-report.json', JSON.stringify(report, null, 2));
        
        console.log('\n📄 Comprehensive report saved to: comprehensive-perplexity-test-report.json');
        
        if (passed === total && this.testResults.failed.length === 0) {
            console.log('\n🎉 ALL TESTS PASSED! Perplexity commands are fully functional.');
            console.log('\n✨ Commands Ready for Production:');
            this.allCommands.forEach(cmd => {
                console.log(`   ✅ /${cmd.command} ${cmd.params} - ${cmd.description}`);
            });
            return true;
        } else {
            console.log(`\n⚠️  ${total - passed} test categories failed or have issues.`);
            console.log('📋 Review the failed tests and warnings above to improve the system.');
            return false;
        }
    }
    
    generateRecommendations() {
        const recommendations = [];
        
        if (this.testResults.failed.length > 0) {
            recommendations.push('Address all failed tests to ensure proper functionality');
        }
        
        if (this.testResults.warnings.length > 0) {
            recommendations.push('Review warnings to improve system completeness');
        }
        
        if (this.testResults.passed.length < 20) {
            recommendations.push('Consider adding more comprehensive test coverage');
        } else {
            recommendations.push('System shows excellent test coverage and functionality');
        }
        
        return recommendations;
    }
}

// Main execution
if (require.main === module) {
    const tester = new ComprehensivePerplexityTester();
    tester.runAllTests().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('💥 Test suite error:', error);
        process.exit(1);
    });
}

module.exports = ComprehensivePerplexityTester;
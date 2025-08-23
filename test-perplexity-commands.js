#!/usr/bin/env node
/**
 * Test Enhanced Perplexity Slash Commands
 * 
 * Validates that all new Perplexity commands are properly recognized
 * and would trigger the correct workflow steps.
 */

const fs = require('fs');
const yaml = require('js-yaml');

class PerplexityCommandTester {
    constructor() {
        this.newCommands = [
            'perplexity',
            'perplexity-analyze',
            'analyze-perplexity', 
            'perplexity-research',
            'research-perplexity',
            'perplexity-roadmap-update',
            'perplexity-budget-check',
            'perplexity-optimize-costs'
        ];
        
        this.testResults = {
            passed: [],
            failed: []
        };
    }

    testWorkflowRecognition() {
        console.log('🔍 Testing Perplexity command recognition in workflow...');
        
        try {
            const workflowContent = fs.readFileSync('.github/workflows/copilot-slash-commands.yml', 'utf8');
            const workflow = yaml.load(workflowContent);
            
            // Check if the specific Perplexity command step exists
            const jobs = workflow.jobs;
            const processCommandsJob = jobs['process-commands'];
            
            if (!processCommandsJob) {
                this.testResults.failed.push('process-commands job not found');
                return false;
            }
            
            const steps = processCommandsJob.steps;
            
            // Find the specific Perplexity command step
            const perplexityStep = steps.find(step => 
                step.name === 'Execute Specific Perplexity Commands'
            );
            
            if (!perplexityStep) {
                this.testResults.failed.push('Specific Perplexity command step not found');
                return false;
            }
            
            // Check if all new commands are recognized in the if condition
            const ifCondition = perplexityStep.if;
            let recognizedCommands = 0;
            
            for (const command of this.newCommands) {
                if (ifCondition.includes(command)) {
                    recognizedCommands++;
                    this.testResults.passed.push(`Command recognized in workflow: ${command}`);
                } else {
                    this.testResults.failed.push(`Command not recognized in workflow: ${command}`);
                }
            }
            
            console.log(`✅ Workflow recognition: ${recognizedCommands}/${this.newCommands.length} commands`);
            return recognizedCommands === this.newCommands.length;
            
        } catch (error) {
            this.testResults.failed.push(`Workflow parsing error: ${error.message}`);
            return false;
        }
    }

    testCommandHelpText() {
        console.log('📚 Testing command help text inclusion...');
        
        try {
            const workflowContent = fs.readFileSync('.github/workflows/copilot-slash-commands.yml', 'utf8');
            
            let recognizedInHelp = 0;
            for (const command of this.newCommands) {
                if (workflowContent.includes(command)) {
                    recognizedInHelp++;
                    this.testResults.passed.push(`Command in help text: ${command}`);
                } else {
                    this.testResults.failed.push(`Command missing from help text: ${command}`);
                }
            }
            
            console.log(`✅ Help text inclusion: ${recognizedInHelp}/${this.newCommands.length} commands`);
            return recognizedInHelp >= this.newCommands.length * 0.8; // At least 80%
            
        } catch (error) {
            this.testResults.failed.push(`Help text check error: ${error.message}`);
            return false;
        }
    }

    testDocumentationUpdates() {
        console.log('📖 Testing documentation updates...');
        
        const docFiles = [
            'AUTONOMOUS_DEVELOPMENT_SYSTEM.md',
            'docs/guides/COPILOT_SLASH_COMMANDS.md'
        ];
        
        let docsUpdated = 0;
        
        for (const docFile of docFiles) {
            try {
                if (!fs.existsSync(docFile)) {
                    this.testResults.failed.push(`Documentation file missing: ${docFile}`);
                    continue;
                }
                
                const content = fs.readFileSync(docFile, 'utf8');
                let commandsInDoc = 0;
                
                for (const command of this.newCommands) {
                    if (content.includes(command)) {
                        commandsInDoc++;
                    }
                }
                
                if (commandsInDoc >= this.newCommands.length * 0.7) { // At least 70% in each doc
                    docsUpdated++;
                    this.testResults.passed.push(`Documentation updated: ${docFile} (${commandsInDoc}/${this.newCommands.length} commands)`);
                } else {
                    this.testResults.failed.push(`Insufficient documentation: ${docFile} (${commandsInDoc}/${this.newCommands.length} commands)`);
                }
                
            } catch (error) {
                this.testResults.failed.push(`Documentation check error ${docFile}: ${error.message}`);
            }
        }
        
        console.log(`✅ Documentation updates: ${docsUpdated}/${docFiles.length} files`);
        return docsUpdated >= docFiles.length * 0.5;
    }

    testBudgetCheckIntegration() {
        console.log('💰 Testing budget check integration...');
        
        try {
            const workflowContent = fs.readFileSync('.github/workflows/copilot-slash-commands.yml', 'utf8');
            
            // Check for budget-specific handling
            if (workflowContent.includes('perplexity-budget-check') && 
                workflowContent.includes('budget_check_only')) {
                this.testResults.passed.push('Budget check integration found');
                console.log('✅ Budget check integration: Present');
                return true;
            } else {
                this.testResults.failed.push('Budget check integration missing');
                console.log('❌ Budget check integration: Missing');
                return false;
            }
            
        } catch (error) {
            this.testResults.failed.push(`Budget integration check error: ${error.message}`);
            return false;
        }
    }

    testCommandParameterHandling() {
        console.log('⚙️ Testing command parameter handling...');
        
        try {
            const workflowContent = fs.readFileSync('.github/workflows/copilot-slash-commands.yml', 'utf8');
            
            // Check for parameter parsing and focus area setting
            const hasParameterHandling = workflowContent.includes('PARAMS=') && 
                                       workflowContent.includes('FOCUS_AREA=');
            
            if (hasParameterHandling) {
                this.testResults.passed.push('Parameter handling implemented');
                console.log('✅ Parameter handling: Implemented');
                return true;
            } else {
                this.testResults.failed.push('Parameter handling missing');
                console.log('❌ Parameter handling: Missing');
                return false;
            }
            
        } catch (error) {
            this.testResults.failed.push(`Parameter handling check error: ${error.message}`);
            return false;
        }
    }

    runAllTests() {
        console.log('🧪 Testing Enhanced Perplexity Slash Commands\n');
        
        const tests = [
            { name: 'Workflow Recognition', test: () => this.testWorkflowRecognition() },
            { name: 'Help Text Inclusion', test: () => this.testCommandHelpText() },
            { name: 'Documentation Updates', test: () => this.testDocumentationUpdates() },
            { name: 'Budget Check Integration', test: () => this.testBudgetCheckIntegration() },
            { name: 'Parameter Handling', test: () => this.testCommandParameterHandling() }
        ];
        
        let passed = 0;
        let total = tests.length;
        
        for (const test of tests) {
            if (test.test()) {
                passed++;
            }
        }
        
        console.log('\n📊 Test Results Summary');
        console.log(`✅ Passed: ${this.testResults.passed.length}`);
        console.log(`❌ Failed: ${this.testResults.failed.length}`);
        console.log(`📈 Overall Success Rate: ${((passed/total) * 100).toFixed(1)}%\n`);
        
        if (this.testResults.failed.length > 0) {
            console.log('❌ Failed Tests:');
            this.testResults.failed.forEach(failure => console.log(`   - ${failure}`));
            console.log();
        }
        
        // Generate report
        const report = {
            timestamp: new Date().toISOString(),
            commands_tested: this.newCommands,
            tests_passed: passed,
            tests_total: total,
            success_rate: ((passed/total) * 100).toFixed(1),
            detailed_results: this.testResults
        };
        
        fs.writeFileSync('perplexity-commands-test-report.json', JSON.stringify(report, null, 2));
        console.log('📄 Detailed report saved to: perplexity-commands-test-report.json');
        
        if (passed === total) {
            console.log('🎉 All Perplexity command tests passed! New commands are ready for use.');
            return true;
        } else {
            console.log(`⚠️ ${total - passed} tests failed. Review and fix issues.`);
            return false;
        }
    }
}

// Main execution
if (require.main === module) {
    const tester = new PerplexityCommandTester();
    const success = tester.runAllTests();
    process.exit(success ? 0 : 1);
}

module.exports = PerplexityCommandTester;
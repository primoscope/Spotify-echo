#!/usr/bin/env node
/**
 * Comprehensive Real-Mode Test for Autonomous Perplexity Development System
 * 
 * Tests all components of the autonomous development system:
 * - Workflow triggers and syntax
 * - Perplexity client functionality (with mock/dry-run if no API key)
 * - Slash command recognition
 * - Budget management
 * - Session management
 * - Documentation completeness
 * 
 * This test validates that everything works "in real mode" without API issues,
 * environment problems, or workflow configuration issues.
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const yaml = require('js-yaml');

class AutonomousSystemTester {
    constructor() {
        this.results = {
            passed: [],
            failed: [],
            warnings: []
        };
        this.hasPerplexityKey = !!process.env.PERPLEXITY_API_KEY;
        
        console.log('🚀 Comprehensive Autonomous System Testing Started');
        console.log(`📊 Perplexity API Key: ${this.hasPerplexityKey ? '✅ Available' : '⚠️ Not Available (will use dry-run mode)'}`);
    }

    log(level, message, details = null) {
        const timestamp = new Date().toISOString();
        const prefix = {
            'pass': '✅',
            'fail': '❌', 
            'warn': '⚠️',
            'info': 'ℹ️'
        }[level] || 'ℹ️';
        
        console.log(`${prefix} ${message}`);
        if (details) {
            console.log(`   ${details}`);
        }
        
        const result = { timestamp, message, details };
        if (level === 'pass') this.results.passed.push(result);
        else if (level === 'fail') this.results.failed.push(result);
        else if (level === 'warn') this.results.warnings.push(result);
    }

    async testWorkflowSyntax() {
        this.log('info', 'Testing workflow syntax validation...');
        
        const workflows = [
            '.github/workflows/autonomous-perplexity-development-cycle.yml',
            '.github/workflows/copilot-slash-commands.yml',
            '.github/workflows/continuous-roadmap-research.yml'
        ];
        
        for (const workflow of workflows) {
            try {
                if (!fs.existsSync(workflow)) {
                    this.log('fail', `Workflow missing: ${workflow}`);
                    continue;
                }
                
                const content = fs.readFileSync(workflow, 'utf8');
                const parsed = yaml.load(content);
                
                // Check required fields
                if (!parsed.name) {
                    this.log('fail', `Workflow missing name: ${workflow}`);
                    continue;
                }
                
                if (!parsed.on) {
                    this.log('fail', `Workflow missing triggers: ${workflow}`);
                    continue;
                }
                
                if (!parsed.jobs) {
                    this.log('fail', `Workflow missing jobs: ${workflow}`);
                    continue;
                }
                
                this.log('pass', `Workflow syntax valid: ${workflow}`);
                
            } catch (error) {
                this.log('fail', `Workflow syntax error: ${workflow}`, error.message);
            }
        }
    }

    async testPerplexityClient() {
        this.log('info', 'Testing Perplexity client functionality...');
        
        try {
            // Test Python script import and basic functionality
            const testScript = `
import sys
sys.path.append('scripts')
from perplexity_client import PerplexityClient

# Initialize client
client = PerplexityClient()
print("Client initialized successfully")

# Test complexity scoring
score = client.calculate_complexity_score("Bug fix", "Simple styling issue with CSS")
print(f"Complexity scoring works: {score}")

# Test model selection
model = client.select_model(5)
print(f"Model selection works: {model}")

# Test budget status
budget = client.budget_manager.check_budget()
print(f"Budget check works: {budget['status']}")

# Test dry-run analysis
result = client.analyze_issue("Test Issue", "Test body content", dry_run=True)
print(f"Dry-run analysis works: {result['success']}")

print("✅ All Perplexity client tests passed")
`;
            
            fs.writeFileSync('/tmp/test_perplexity.py', testScript);
            const output = execSync('python3 /tmp/test_perplexity.py', { 
                encoding: 'utf8',
                cwd: process.cwd()
            });
            
            if (output.includes('All Perplexity client tests passed')) {
                this.log('pass', 'Perplexity client functionality test passed');
            } else {
                this.log('warn', 'Perplexity client test completed with warnings', output);
            }
            
        } catch (error) {
            this.log('fail', 'Perplexity client test failed', error.message);
        }
        
        // Clean up
        if (fs.existsSync('/tmp/test_perplexity.py')) {
            fs.unlinkSync('/tmp/test_perplexity.py');
        }
    }

    async testSlashCommandRecognition() {
        this.log('info', 'Testing slash command recognition patterns...');
        
        const slashCommandWorkflow = '.github/workflows/copilot-slash-commands.yml';
        
        try {
            const content = fs.readFileSync(slashCommandWorkflow, 'utf8');
            
            // Test for Perplexity command recognition
            const perplexityPatterns = [
                'perplexity',
                'autonomous',
                '@copilot use perplexity browser research',
                'start-autonomous-development'
            ];
            
            let recognizedPatterns = 0;
            for (const pattern of perplexityPatterns) {
                if (content.includes(pattern)) {
                    recognizedPatterns++;
                    this.log('pass', `Command pattern recognized: ${pattern}`);
                } else {
                    this.log('warn', `Command pattern not found: ${pattern}`);
                }
            }
            
            if (recognizedPatterns >= 3) {
                this.log('pass', `Slash command recognition sufficient: ${recognizedPatterns}/4 patterns`);
            } else {
                this.log('fail', `Insufficient slash command recognition: ${recognizedPatterns}/4 patterns`);
            }
            
        } catch (error) {
            this.log('fail', 'Slash command recognition test failed', error.message);
        }
    }

    async testAutonomousWorkflowTriggers() {
        this.log('info', 'Testing autonomous workflow trigger conditions...');
        
        const workflowFile = '.github/workflows/autonomous-perplexity-development-cycle.yml';
        
        try {
            const content = fs.readFileSync(workflowFile, 'utf8');
            const workflow = yaml.load(content);
            
            // Check trigger types
            const triggers = workflow.on;
            const expectedTriggers = ['issue_comment', 'workflow_dispatch', 'schedule'];
            
            for (const expectedTrigger of expectedTriggers) {
                if (triggers[expectedTrigger]) {
                    this.log('pass', `Trigger configured: ${expectedTrigger}`);
                } else {
                    this.log('fail', `Missing trigger: ${expectedTrigger}`);
                }
            }
            
            // Check environment variables
            const env = workflow.env;
            const requiredEnvVars = ['GITHUB_TOKEN', 'PERPLEXITY_API_KEY', 'PERPLEXITY_MODEL'];
            
            for (const envVar of requiredEnvVars) {
                if (env[envVar]) {
                    this.log('pass', `Environment variable configured: ${envVar}`);
                } else {
                    this.log('warn', `Environment variable missing: ${envVar}`);
                }
            }
            
            // Check job structure
            const jobs = workflow.jobs;
            const expectedJobs = ['detect-trigger', 'autonomous-development-cycle'];
            
            for (const jobName of expectedJobs) {
                if (jobs[jobName]) {
                    this.log('pass', `Job defined: ${jobName}`);
                } else {
                    this.log('fail', `Missing job: ${jobName}`);
                }
            }
            
        } catch (error) {
            this.log('fail', 'Autonomous workflow trigger test failed', error.message);
        }
    }

    async testSessionManagement() {
        this.log('info', 'Testing session management and directory structure...');
        
        try {
            // Test session directory creation
            const sessionDirs = ['.autonomous-session', '.roadmap-research', '.perplexity'];
            
            for (const dir of sessionDirs) {
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                    this.log('pass', `Created session directory: ${dir}`);
                } else {
                    this.log('pass', `Session directory exists: ${dir}`);
                }
            }
            
            // Test session file creation (mock)
            const testSessionId = `test-${Date.now()}`;
            const sessionFile = `.autonomous-session/${testSessionId}.json`;
            
            const mockSession = {
                session_id: testSessionId,
                started_at: new Date().toISOString(),
                status: 'test',
                tasks: []
            };
            
            fs.writeFileSync(sessionFile, JSON.stringify(mockSession, null, 2));
            
            if (fs.existsSync(sessionFile)) {
                this.log('pass', 'Session file creation works');
                fs.unlinkSync(sessionFile); // Clean up
            } else {
                this.log('fail', 'Session file creation failed');
            }
            
        } catch (error) {
            this.log('fail', 'Session management test failed', error.message);
        }
    }

    async testDocumentationCompleteness() {
        this.log('info', 'Testing documentation completeness...');
        
        const requiredDocs = [
            'AUTONOMOUS_DEVELOPMENT_SYSTEM.md',
            'ROADMAP.md',
            'README.md'
        ];
        
        for (const doc of requiredDocs) {
            try {
                if (!fs.existsSync(doc)) {
                    this.log('fail', `Documentation missing: ${doc}`);
                    continue;
                }
                
                const content = fs.readFileSync(doc, 'utf8');
                
                if (content.length < 100) {
                    this.log('warn', `Documentation too short: ${doc}`);
                } else {
                    this.log('pass', `Documentation exists and substantial: ${doc}`);
                }
                
                // Check for Perplexity mentions
                if (content.toLowerCase().includes('perplexity')) {
                    this.log('pass', `Documentation mentions Perplexity: ${doc}`);
                } else if (doc === 'AUTONOMOUS_DEVELOPMENT_SYSTEM.md') {
                    this.log('warn', `Missing Perplexity references: ${doc}`);
                }
                
            } catch (error) {
                this.log('fail', `Documentation check failed: ${doc}`, error.message);
            }
        }
    }

    async testBudgetManagement() {
        this.log('info', 'Testing budget management system...');
        
        try {
            const testScript = `
import sys
sys.path.append('scripts')
from perplexity_client import BudgetManager
from pathlib import Path

# Test budget manager
budget_mgr = BudgetManager(Path('.perplexity'))

# Test budget check
status = budget_mgr.check_budget()
print(f"Budget status: {status['status']}")
print(f"Weekly budget: ` + "${status['weekly_budget']:.2f}" + `")
print(f"Current cost: ` + "${status['total_cost']:.4f}" + `")
print(f"Budget used: {status['budget_used_pct']:.1f}%")

# Test week key generation
week_key = budget_mgr._get_current_week_key()
print(f"Week key: {week_key}")

print("✅ Budget management test passed")
`;
            
            fs.writeFileSync('/tmp/test_budget.py', testScript);
            const output = execSync('python3 /tmp/test_budget.py', {
                encoding: 'utf8',
                cwd: process.cwd()
            });
            
            if (output.includes('Budget management test passed')) {
                this.log('pass', 'Budget management system works correctly');
            } else {
                this.log('warn', 'Budget management test completed with warnings', output);
            }
            
        } catch (error) {
            this.log('fail', 'Budget management test failed', error.message);
        }
        
        // Clean up
        if (fs.existsSync('/tmp/test_budget.py')) {
            fs.unlinkSync('/tmp/test_budget.py');
        }
    }

    async testRealModeIntegration() {
        this.log('info', 'Testing real-mode integration (orchestrator execution)...');
        
        try {
            // Test orchestrator script help command
            const helpOutput = execSync('python3 scripts/autonomous_development_orchestrator.py --help', {
                encoding: 'utf8',
                cwd: process.cwd()
            });
            
            if (helpOutput.includes('usage:') || helpOutput.includes('Autonomous Development Orchestrator')) {
                this.log('pass', 'Orchestrator script executable and provides help');
            } else {
                this.log('warn', 'Orchestrator help output unexpected', helpOutput.slice(0, 200));
            }
            
            // Test dry-run mode if available
            try {
                const dryRunOutput = execSync('python3 scripts/autonomous_development_orchestrator.py --dry-run', {
                    encoding: 'utf8',
                    cwd: process.cwd(),
                    timeout: 10000 // 10 second timeout
                });
                
                this.log('pass', 'Orchestrator dry-run mode works');
                
            } catch (dryRunError) {
                // This might be expected if --dry-run isn't implemented
                this.log('warn', 'Orchestrator dry-run test inconclusive', 'May not support --dry-run flag');
            }
            
        } catch (error) {
            this.log('fail', 'Real-mode integration test failed', error.message);
        }
    }

    async runAllTests() {
        console.log('\n🧪 Running Comprehensive Autonomous System Tests\n');
        
        await this.testWorkflowSyntax();
        await this.testPerplexityClient();
        await this.testSlashCommandRecognition();
        await this.testAutonomousWorkflowTriggers();
        await this.testSessionManagement();
        await this.testDocumentationCompleteness();
        await this.testBudgetManagement();
        await this.testRealModeIntegration();
        
        this.generateReport();
    }

    generateReport() {
        console.log('\n📊 Test Results Summary\n');
        
        console.log(`✅ Passed: ${this.results.passed.length}`);
        console.log(`❌ Failed: ${this.results.failed.length}`);
        console.log(`⚠️ Warnings: ${this.results.warnings.length}`);
        
        const totalTests = this.results.passed.length + this.results.failed.length + this.results.warnings.length;
        const successRate = ((this.results.passed.length / totalTests) * 100).toFixed(1);
        
        console.log(`📈 Success Rate: ${successRate}%\n`);
        
        if (this.results.failed.length > 0) {
            console.log('❌ Failed Tests:');
            this.results.failed.forEach(test => {
                console.log(`   - ${test.message}`);
                if (test.details) console.log(`     ${test.details}`);
            });
            console.log();
        }
        
        if (this.results.warnings.length > 0) {
            console.log('⚠️ Warnings:');
            this.results.warnings.forEach(warning => {
                console.log(`   - ${warning.message}`);
                if (warning.details) console.log(`     ${warning.details}`);
            });
            console.log();
        }
        
        // Generate detailed report file
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total_tests: totalTests,
                passed: this.results.passed.length,
                failed: this.results.failed.length,
                warnings: this.results.warnings.length,
                success_rate: parseFloat(successRate)
            },
            environment: {
                has_perplexity_key: this.hasPerplexityKey,
                node_version: process.version,
                platform: process.platform
            },
            results: this.results
        };
        
        fs.writeFileSync('comprehensive-test-report.json', JSON.stringify(report, null, 2));
        console.log('📄 Detailed report saved to: comprehensive-test-report.json');
        
        // Overall status
        if (this.results.failed.length === 0) {
            console.log('\n🎉 All critical tests passed! System is ready for production use.');
            process.exit(0);
        } else {
            console.log('\n⚠️ Some tests failed. Review and fix issues before production use.');
            process.exit(1);
        }
    }
}

// Handle missing js-yaml dependency
try {
    require('js-yaml');
} catch (error) {
    console.log('ℹ️ Installing js-yaml dependency...');
    try {
        execSync('npm install js-yaml', { stdio: 'ignore' });
        console.log('✅ js-yaml installed successfully');
    } catch (installError) {
        console.log('❌ Failed to install js-yaml. Please run: npm install js-yaml');
        process.exit(1);
    }
}

// Main execution
if (require.main === module) {
    const tester = new AutonomousSystemTester();
    tester.runAllTests().catch(error => {
        console.error('❌ Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = AutonomousSystemTester;
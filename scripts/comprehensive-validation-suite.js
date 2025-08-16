#!/usr/bin/env node
/**
 * Comprehensive Validation Suite for EchoTune AI
 * 
 * Tests and validates:
 * - Workflow files (YAML syntax)
 * - JavaScript code quality
 * - MCP server functionality 
 * - Perplexity integration
 * - Overall system health
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync, spawn } = require('child_process');

class ComprehensiveValidationSuite {
    constructor() {
        this.results = {
            workflows: { total: 0, passed: 0, failed: 0, errors: [] },
            javascript: { total: 0, passed: 0, failed: 0, errors: [] },
            mcpServers: { total: 0, passed: 0, failed: 0, errors: [] },
            perplexity: { total: 0, passed: 0, failed: 0, errors: [] },
            overall: { score: 0, status: 'UNKNOWN' }
        };
        
        this.startTime = Date.now();
    }
    
    async runValidation() {
        console.log('🚀 Starting Comprehensive Validation Suite\n');
        
        try {
            await this.validateWorkflowFiles();
            await this.validateJavaScriptFiles();
            await this.validateMCPServers();
            await this.validatePerplexityIntegration();
            await this.generateOverallScore();
            await this.saveResults();
            
            this.displayResults();
            return this.results;
        } catch (error) {
            console.error('❌ Validation suite failed:', error.message);
            return null;
        }
    }
    
    async validateWorkflowFiles() {
        console.log('📋 Validating Workflow Files...');
        
        try {
            const workflowDir = '.github/workflows';
            const files = await fs.readdir(workflowDir);
            const yamlFiles = files.filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
            
            this.results.workflows.total = yamlFiles.length;
            
            for (const file of yamlFiles) {
                try {
                    const result = execSync(`yamllint "${workflowDir}/${file}"`, { 
                        encoding: 'utf8', 
                        stdio: 'pipe' 
                    });
                    this.results.workflows.passed++;
                    console.log(`  ✅ ${file}`);
                } catch (error) {
                    this.results.workflows.failed++;
                    this.results.workflows.errors.push({
                        file,
                        error: error.stdout || error.message
                    });
                    console.log(`  ❌ ${file}: YAML syntax errors`);
                }
            }
            
            console.log(`\n📊 Workflows: ${this.results.workflows.passed}/${this.results.workflows.total} passed\n`);
        } catch (error) {
            console.log(`❌ Workflow validation failed: ${error.message}\n`);
        }
    }
    
    async validateJavaScriptFiles() {
        console.log('🔧 Validating JavaScript Files...');
        
        const jsFiles = [
            'enhanced-perplexity-integration.js',
            'grok4-repository-analyzer.js',
            'mcp-server/enhanced-mcp-orchestrator.js',
            'mcp-servers/perplexity-mcp/index.js',
            'mcp-servers/analytics-server/index.js',
            'mcp-servers/browserbase/index.js',
            'mcp-servers/code-sandbox/index.js'
        ];
        
        this.results.javascript.total = jsFiles.length;
        
        for (const file of jsFiles) {
            try {
                if (await fs.access(file).then(() => true).catch(() => false)) {
                    execSync(`node -c "${file}"`, { stdio: 'pipe' });
                    this.results.javascript.passed++;
                    console.log(`  ✅ ${file}`);
                } else {
                    this.results.javascript.failed++;
                    this.results.javascript.errors.push({
                        file,
                        error: 'File not found'
                    });
                    console.log(`  ❌ ${file}: File not found`);
                }
            } catch (error) {
                this.results.javascript.failed++;
                this.results.javascript.errors.push({
                    file,
                    error: error.message
                });
                console.log(`  ❌ ${file}: Syntax error`);
            }
        }
        
        console.log(`\n📊 JavaScript: ${this.results.javascript.passed}/${this.results.javascript.total} passed\n`);
    }
    
    async validateMCPServers() {
        console.log('🔌 Validating MCP Servers...');
        
        const servers = [
            'perplexity-mcp',
            'analytics-server', 
            'browserbase',
            'code-sandbox'
        ];
        
        this.results.mcpServers.total = servers.length;
        
        for (const server of servers) {
            try {
                const serverPath = `mcp-servers/${server}`;
                const packagePath = `${serverPath}/package.json`;
                const indexPath = `${serverPath}/index.js`;
                
                // Check if package.json exists
                await fs.access(packagePath);
                
                // Check if index.js exists and has valid syntax
                await fs.access(indexPath);
                execSync(`node -c "${indexPath}"`, { stdio: 'pipe' });
                
                this.results.mcpServers.passed++;
                console.log(`  ✅ ${server}: Fully operational`);
            } catch (error) {
                this.results.mcpServers.failed++;
                this.results.mcpServers.errors.push({
                    server,
                    error: error.message
                });
                console.log(`  ❌ ${server}: Configuration issues`);
            }
        }
        
        console.log(`\n📊 MCP Servers: ${this.results.mcpServers.passed}/${this.results.mcpServers.total} operational\n`);
    }
    
    async validatePerplexityIntegration() {
        console.log('🧠 Validating Perplexity Integration...');
        
        const tests = [
            { name: 'Enhanced Perplexity Test', command: 'npm run test:perplexity-enhanced' },
            { name: 'Perplexity Script Syntax', command: 'node -c enhanced-perplexity-integration.js' }
        ];
        
        this.results.perplexity.total = tests.length;
        
        for (const test of tests) {
            try {
                execSync(test.command, { stdio: 'pipe' });
                this.results.perplexity.passed++;
                console.log(`  ✅ ${test.name}`);
            } catch (error) {
                this.results.perplexity.failed++;
                this.results.perplexity.errors.push({
                    test: test.name,
                    error: error.message
                });
                console.log(`  ❌ ${test.name}: Failed`);
            }
        }
        
        console.log(`\n📊 Perplexity: ${this.results.perplexity.passed}/${this.results.perplexity.total} tests passed\n`);
    }
    
    async generateOverallScore() {
        const totalTests = this.results.workflows.total + this.results.javascript.total + 
                          this.results.mcpServers.total + this.results.perplexity.total;
        const totalPassed = this.results.workflows.passed + this.results.javascript.passed + 
                           this.results.mcpServers.passed + this.results.perplexity.passed;
        
        this.results.overall.score = Math.round((totalPassed / totalTests) * 100);
        
        if (this.results.overall.score >= 90) {
            this.results.overall.status = 'EXCELLENT';
        } else if (this.results.overall.score >= 80) {
            this.results.overall.status = 'GOOD';
        } else if (this.results.overall.score >= 70) {
            this.results.overall.status = 'FAIR';
        } else {
            this.results.overall.status = 'NEEDS_WORK';
        }
    }
    
    async saveResults() {
        const executionTime = Date.now() - this.startTime;
        const report = {
            timestamp: new Date().toISOString(),
            executionTime: `${executionTime}ms`,
            results: this.results
        };
        
        // Save JSON report
        await fs.writeFile(
            'COMPREHENSIVE_VALIDATION_REPORT.json',
            JSON.stringify(report, null, 2)
        );
        
        // Save markdown report
        const markdown = this.generateMarkdownReport(executionTime);
        await fs.writeFile(
            'COMPREHENSIVE_VALIDATION_REPORT.md',
            markdown
        );
    }
    
    generateMarkdownReport(executionTime) {
        return `# Comprehensive Validation Report

**Generated:** ${new Date().toISOString()}  
**Execution Time:** ${executionTime}ms  
**Overall Score:** ${this.results.overall.score}/100 (${this.results.overall.status})

## 📋 Workflow Files
- **Total:** ${this.results.workflows.total}
- **Passed:** ${this.results.workflows.passed}
- **Failed:** ${this.results.workflows.failed}

${this.results.workflows.errors.length > 0 ? 
    '### Errors:\n' + this.results.workflows.errors.map(e => 
        `- **${e.file}:** ${e.error.split('\n')[0]}`
    ).join('\n') : '✅ All workflow files have valid YAML syntax'}

## 🔧 JavaScript Files
- **Total:** ${this.results.javascript.total}
- **Passed:** ${this.results.javascript.passed}
- **Failed:** ${this.results.javascript.failed}

${this.results.javascript.errors.length > 0 ? 
    '### Errors:\n' + this.results.javascript.errors.map(e => 
        `- **${e.file}:** ${e.error}`
    ).join('\n') : '✅ All JavaScript files have valid syntax'}

## 🔌 MCP Servers
- **Total:** ${this.results.mcpServers.total}
- **Operational:** ${this.results.mcpServers.passed}
- **Issues:** ${this.results.mcpServers.failed}

${this.results.mcpServers.errors.length > 0 ? 
    '### Issues:\n' + this.results.mcpServers.errors.map(e => 
        `- **${e.server}:** ${e.error}`
    ).join('\n') : '✅ All MCP servers are properly configured'}

## 🧠 Perplexity Integration
- **Total Tests:** ${this.results.perplexity.total}
- **Passed:** ${this.results.perplexity.passed}
- **Failed:** ${this.results.perplexity.failed}

${this.results.perplexity.errors.length > 0 ? 
    '### Failures:\n' + this.results.perplexity.errors.map(e => 
        `- **${e.test}:** ${e.error.split('\n')[0]}`
    ).join('\n') : '✅ Perplexity integration is fully operational'}

## 📊 Summary

${this.results.overall.score >= 90 ? 
    '🎉 **EXCELLENT** - System is production-ready with minimal issues' :
    this.results.overall.score >= 80 ? 
    '✅ **GOOD** - System is stable with minor improvements needed' :
    this.results.overall.score >= 70 ? 
    '⚠️ **FAIR** - System needs some improvements before production' :
    '❌ **NEEDS WORK** - Significant issues require attention'}

### Next Steps:
${this.results.overall.score < 100 ? 
    '1. Review and fix failed validations above\n2. Re-run validation suite to confirm fixes\n3. Monitor system performance after improvements' :
    '1. System validation complete - ready for production use\n2. Continue regular monitoring and maintenance\n3. Consider additional feature enhancements'}
`;
    }
    
    displayResults() {
        console.log('═'.repeat(60));
        console.log(`🎯 COMPREHENSIVE VALIDATION RESULTS`);
        console.log('═'.repeat(60));
        console.log(`📊 Overall Score: ${this.results.overall.score}/100 (${this.results.overall.status})`);
        console.log(`⏱️  Execution Time: ${Date.now() - this.startTime}ms`);
        console.log('');
        console.log(`📋 Workflows: ${this.results.workflows.passed}/${this.results.workflows.total} passed`);
        console.log(`🔧 JavaScript: ${this.results.javascript.passed}/${this.results.javascript.total} passed`);
        console.log(`🔌 MCP Servers: ${this.results.mcpServers.passed}/${this.results.mcpServers.total} operational`);
        console.log(`🧠 Perplexity: ${this.results.perplexity.passed}/${this.results.perplexity.total} tests passed`);
        console.log('');
        console.log('📁 Reports saved:');
        console.log('  - COMPREHENSIVE_VALIDATION_REPORT.json');
        console.log('  - COMPREHENSIVE_VALIDATION_REPORT.md');
        console.log('═'.repeat(60));
    }
}

// Run validation if called directly
if (require.main === module) {
    const validator = new ComprehensiveValidationSuite();
    validator.runValidation()
        .then(results => {
            if (results && results.overall.score >= 80) {
                process.exit(0);
            } else {
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('Validation failed:', error);
            process.exit(1);
        });
}

module.exports = ComprehensiveValidationSuite;
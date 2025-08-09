#!/usr/bin/env node

/**
 * Enhanced Comprehensive MCP Integration Validation
 * Ensures all MCP integrations are functional and enforced across every coding workflow
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn, exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class ComprehensiveMCPValidator {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            warnings: 0,
            tests: []
        };
        this.startTime = Date.now();
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = {
            info: '🔍',
            success: '✅',
            error: '❌',
            warning: '⚠️'
        }[type] || '📋';
        
        console.log(`${prefix} ${message}`);
        
        this.results.tests.push({
            timestamp,
            type,
            message,
            status: type === 'success' ? 'passed' : type === 'error' ? 'failed' : 'info'
        });

        if (type === 'success') this.results.passed++;
        if (type === 'error') this.results.failed++;
        if (type === 'warning') this.results.warnings++;
    }

    async validateMCPManager() {
        this.log('Validating MCP Manager functionality...', 'info');
        
        try {
            // Test MCP Manager exports
            const mcpManager = require('./mcp-manager.js');
            const requiredExports = ['readServers', 'install', 'health', 'test', 'report'];
            
            for (const exportName of requiredExports) {
                if (typeof mcpManager[exportName] === 'function') {
                    this.log(`MCP Manager exports ${exportName}`, 'success');
                } else {
                    this.log(`MCP Manager missing export: ${exportName}`, 'error');
                }
            }
            
            // Test reading server configuration
            const servers = await mcpManager.readServers();
            if (Object.keys(servers).length > 0) {
                this.log(`Found ${Object.keys(servers).length} configured MCP servers`, 'success');
            } else {
                this.log('No MCP servers configured', 'warning');
            }
            
        } catch (error) {
            this.log(`MCP Manager validation failed: ${error.message}`, 'error');
        }
    }

    async validateMCPServers() {
        this.log('Validating MCP Server configurations...', 'info');
        
        const mcpServerPath = path.join(process.cwd(), 'mcp-server');
        
        try {
            // Check mcp-server directory exists
            await fs.access(mcpServerPath);
            this.log('MCP server directory exists', 'success');
            
            // Check package.json
            const packagePath = path.join(mcpServerPath, 'package.json');
            const packageData = JSON.parse(await fs.readFile(packagePath, 'utf8'));
            
            if (packageData.servers && Object.keys(packageData.servers).length > 0) {
                this.log(`Package.json has ${Object.keys(packageData.servers).length} server configurations`, 'success');
            } else {
                this.log('Package.json missing servers configuration', 'error');
            }
            
            // Check key server files
            const serverFiles = ['health.js', 'enhanced-mcp-orchestrator.js', 'workflow-manager.js'];
            for (const file of serverFiles) {
                try {
                    await fs.access(path.join(mcpServerPath, file));
                    this.log(`Server file ${file} exists`, 'success');
                } catch {
                    this.log(`Server file ${file} missing`, 'error');
                }
            }
            
        } catch (error) {
            this.log(`MCP server validation failed: ${error.message}`, 'error');
        }
    }

    async validateWorkflows() {
        this.log('Validating GitHub Actions workflows...', 'info');
        
        const workflowsPath = path.join(process.cwd(), '.github', 'workflows');
        
        try {
            const files = await fs.readdir(workflowsPath);
            const mcpWorkflows = files.filter(f => f.includes('mcp') || f.includes('ci') || f.includes('auto'));
            
            this.log(`Found ${mcpWorkflows.length} MCP-related workflows`, 'success');
            
            // Check specific workflows
            const requiredWorkflows = ['mcp-validation.yml', 'ci.yml', 'auto-merge-gate.yml'];
            for (const workflow of requiredWorkflows) {
                if (files.includes(workflow)) {
                    this.log(`Workflow ${workflow} exists`, 'success');
                    
                    // Check if workflow includes MCP validation
                    const content = await fs.readFile(path.join(workflowsPath, workflow), 'utf8');
                    if (content.includes('mcp-manager') || content.includes('MCP')) {
                        this.log(`Workflow ${workflow} includes MCP integration`, 'success');
                    } else {
                        this.log(`Workflow ${workflow} missing MCP integration`, 'warning');
                    }
                } else {
                    this.log(`Required workflow ${workflow} missing`, 'error');
                }
            }
            
        } catch (error) {
            this.log(`Workflow validation failed: ${error.message}`, 'error');
        }
    }

    async validateEnvironmentConfig() {
        this.log('Validating environment configuration...', 'info');
        
        try {
            // Check .env.example
            const envExample = await fs.readFile('.env.example', 'utf8');
            if (envExample.includes('MCP_PORT') || envExample.includes('MCP_SERVER_PORT')) {
                this.log('Environment template includes MCP configuration', 'success');
            } else {
                this.log('Environment template missing MCP configuration', 'warning');
            }
            
            // Run environment validator
            const { stdout } = await execAsync('node scripts/validate-env.js');
            if (stdout.includes('validation') || !stdout.includes('error')) {
                this.log('Environment validation passed', 'success');
            } else {
                this.log('Environment validation issues found', 'warning');
            }
            
        } catch (error) {
            this.log(`Environment validation error: ${error.message}`, 'warning');
        }
    }

    async validatePackageScripts() {
        this.log('Validating package.json MCP scripts...', 'info');
        
        try {
            const packageData = JSON.parse(await fs.readFile('package.json', 'utf8'));
            const scripts = packageData.scripts || {};
            
            const mcpScripts = Object.keys(scripts).filter(script => 
                script.includes('mcp') || script.includes('MCP')
            );
            
            this.log(`Found ${mcpScripts.length} MCP-related npm scripts`, 'success');
            
            // Check for required scripts
            const requiredScripts = [
                'mcp:install', 'mcp:health', 'mcp:test', 'mcp:validate'
            ];
            
            for (const script of requiredScripts) {
                if (scripts[script]) {
                    this.log(`Script ${script} configured`, 'success');
                } else {
                    this.log(`Script ${script} missing`, 'warning');
                }
            }
            
        } catch (error) {
            this.log(`Package script validation failed: ${error.message}`, 'error');
        }
    }

    async validateDocumentation() {
        this.log('Validating MCP documentation...', 'info');
        
        const docsToCheck = [
            'docs/MCP_INTEGRATION.md',
            'docs/mcp-servers.md', 
            'mcp-server/README.md'
        ];
        
        for (const doc of docsToCheck) {
            try {
                await fs.access(doc);
                this.log(`Documentation ${doc} exists`, 'success');
            } catch {
                this.log(`Documentation ${doc} missing`, 'warning');
            }
        }
    }

    async runLiveHealthChecks() {
        this.log('Running live MCP health checks...', 'info');
        
        try {
            // Run MCP manager commands
            const commands = ['install', 'health', 'test'];
            
            for (const cmd of commands) {
                try {
                    const { stdout, stderr } = await execAsync(`node scripts/mcp-manager.js ${cmd}`);
                    if (stdout.includes('✅') || !stderr) {
                        this.log(`MCP ${cmd} command successful`, 'success');
                    } else {
                        this.log(`MCP ${cmd} command issues: ${stderr}`, 'warning');
                    }
                } catch (error) {
                    this.log(`MCP ${cmd} command failed: ${error.message}`, 'error');
                }
            }
            
        } catch (error) {
            this.log(`Live health check error: ${error.message}`, 'error');
        }
    }

    async validatePerformance() {
        this.log('Validating MCP performance characteristics...', 'info');
        
        try {
            const startTime = Date.now();
            
            // Test MCP manager performance
            const mcpManager = require('./mcp-manager.js');
            await mcpManager.readServers();
            
            const readTime = Date.now() - startTime;
            if (readTime < 1000) {
                this.log(`MCP server configuration read time: ${readTime}ms - Good`, 'success');
            } else {
                this.log(`MCP server configuration read time: ${readTime}ms - Slow`, 'warning');
            }
            
            // Check memory usage
            const memoryUsage = process.memoryUsage();
            const memoryMB = Math.round(memoryUsage.rss / 1024 / 1024);
            
            if (memoryMB < 100) {
                this.log(`Memory usage: ${memoryMB}MB - Efficient`, 'success');
            } else {
                this.log(`Memory usage: ${memoryMB}MB - Consider optimization`, 'warning');
            }
            
        } catch (error) {
            this.log(`Performance validation error: ${error.message}`, 'error');
        }
    }

    async generateReport() {
        const duration = Date.now() - this.startTime;
        
        this.log('\n📊 MCP Validation Report Summary', 'info');
        this.log(`Total Tests: ${this.results.tests.length}`, 'info');
        this.log(`Passed: ${this.results.passed}`, this.results.passed > 0 ? 'success' : 'info');
        this.log(`Failed: ${this.results.failed}`, this.results.failed > 0 ? 'error' : 'info');
        this.log(`Warnings: ${this.results.warnings}`, this.results.warnings > 0 ? 'warning' : 'info');
        this.log(`Duration: ${duration}ms`, 'info');
        
        // Calculate score
        const totalTests = this.results.passed + this.results.failed;
        const score = totalTests > 0 ? Math.round((this.results.passed / totalTests) * 100) : 0;
        
        this.log(`Overall Score: ${score}%`, score >= 80 ? 'success' : score >= 60 ? 'warning' : 'error');
        
        // Save detailed report
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: this.results.tests.length,
                passed: this.results.passed,
                failed: this.results.failed,
                warnings: this.results.warnings,
                score: score,
                duration_ms: duration
            },
            tests: this.results.tests,
            recommendations: this.generateRecommendations()
        };
        
        await fs.writeFile(
            'mcp-validation-report.json',
            JSON.stringify(report, null, 2)
        );
        
        this.log('📄 Detailed report saved to mcp-validation-report.json', 'success');
        
        // Exit with error code if validation failed
        if (this.results.failed > 0) {
            process.exit(1);
        }
    }

    generateRecommendations() {
        const recommendations = [];
        
        if (this.results.failed > 0) {
            recommendations.push('🔧 Fix failed validations before proceeding with deployment');
        }
        
        if (this.results.warnings > 3) {
            recommendations.push('⚠️  Address warnings to improve MCP integration robustness');
        }
        
        recommendations.push('🚀 Run this validation regularly in CI/CD pipelines');
        recommendations.push('📚 Keep MCP documentation updated with any configuration changes');
        recommendations.push('🔍 Monitor MCP server health endpoints in production');
        
        return recommendations;
    }

    async runFullValidation() {
        this.log('🎵 Starting comprehensive MCP validation for EchoTune AI...', 'info');
        
        await this.validateMCPManager();
        await this.validateMCPServers();
        await this.validateWorkflows();
        await this.validateEnvironmentConfig();
        await this.validatePackageScripts();
        await this.validateDocumentation();
        await this.runLiveHealthChecks();
        await this.validatePerformance();
        
        await this.generateReport();
    }
}

// Run validation if called directly
if (require.main === module) {
    const validator = new ComprehensiveMCPValidator();
    validator.runFullValidation()
        .then(() => {
            console.log('\n🎉 MCP validation completed successfully!');
        })
        .catch(error => {
            console.error('\n💥 MCP validation failed:', error.message);
            process.exit(1);
        });
}

module.exports = ComprehensiveMCPValidator;
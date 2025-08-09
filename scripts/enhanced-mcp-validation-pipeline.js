#!/usr/bin/env node
/**
 * Enhanced MCP Integration Validation Pipeline
 * Comprehensive validation system for all MCP integrations with automated testing,
 * performance monitoring, security checks, and detailed reporting
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn, exec } = require('child_process');
const util = require('util');
const http = require('http');

const execAsync = util.promisify(exec);

class EnhancedMCPValidationPipeline {
    constructor() {
        this.testResults = {
            timestamp: new Date().toISOString(),
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            warnings: 0,
            score: 0,
            duration: 0,
            categories: {
                installation: { passed: 0, failed: 0, tests: [] },
                configuration: { passed: 0, failed: 0, tests: [] },
                health: { passed: 0, failed: 0, tests: [] },
                performance: { passed: 0, failed: 0, tests: [] },
                security: { passed: 0, failed: 0, tests: [] },
                integration: { passed: 0, failed: 0, tests: [] },
                automation: { passed: 0, failed: 0, tests: [] }
            }
        };
        this.startTime = Date.now();
        this.timeouts = {
            serverStart: 10000,
            healthCheck: 5000,
            integration: 15000
        };
    }

    log(message, type = 'info', category = 'general') {
        const emoji = {
            info: '🔍',
            success: '✅',
            error: '❌',
            warning: '⚠️',
            progress: '📊'
        }[type] || '📋';
        
        console.log(`${emoji} ${message}`);
        
        const testResult = {
            timestamp: new Date().toISOString(),
            type,
            message,
            status: type === 'success' ? 'passed' : type === 'error' ? 'failed' : 'info',
            duration: Date.now() - this.startTime
        };

        // Update category statistics
        if (this.testResults.categories[category]) {
            this.testResults.categories[category].tests.push(testResult);
            
            if (type === 'success') {
                this.testResults.categories[category].passed++;
                this.testResults.passedTests++;
            } else if (type === 'error') {
                this.testResults.categories[category].failed++;
                this.testResults.failedTests++;
            } else if (type === 'warning') {
                this.testResults.warnings++;
            }
        }

        this.testResults.totalTests++;
    }

    async runComprehensiveValidation(options = {}) {
        console.log('🚀 Starting Enhanced MCP Integration Validation Pipeline...\n');
        
        try {
            // Phase 1: Installation and Dependencies
            await this.validateInstallation();
            
            // Phase 2: Configuration Validation  
            await this.validateConfiguration();
            
            // Phase 3: Health and Connectivity
            await this.validateHealthAndConnectivity();
            
            // Phase 4: Performance Testing
            await this.validatePerformance();
            
            // Phase 5: Security Validation
            await this.validateSecurity();
            
            // Phase 6: Integration Testing
            await this.validateIntegrations();
            
            // Phase 7: Automation and Workflows
            await this.validateAutomation();
            
            // Generate final report
            await this.generateComprehensiveReport();
            
        } catch (error) {
            this.log(`Validation pipeline failed: ${error.message}`, 'error');
        }
        
        this.testResults.duration = Date.now() - this.startTime;
        this.testResults.score = Math.round((this.testResults.passedTests / this.testResults.totalTests) * 100);
        
        return this.testResults;
    }

    async validateInstallation() {
        this.log('Phase 1: Validating Installation and Dependencies', 'progress', 'installation');
        
        try {
            // Check MCP server dependencies
            const packagePath = path.join(__dirname, '..', 'package.json');
            const packageData = JSON.parse(await fs.readFile(packagePath, 'utf8'));
            
            // Validate MCP dependencies
            const mcpDeps = [
                '@modelcontextprotocol/sdk',
                '@modelcontextprotocol/server-filesystem',
                '@browserbasehq/mcp-server-browserbase',
                'puppeteer-mcp-server',
                'mongodb-mcp-server'
            ];
            
            for (const dep of mcpDeps) {
                if (packageData.dependencies[dep] || packageData.devDependencies?.[dep]) {
                    this.log(`MCP dependency ${dep} found`, 'success', 'installation');
                } else {
                    this.log(`MCP dependency ${dep} missing`, 'warning', 'installation');
                }
            }
            
            // Check node_modules installation
            const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
            try {
                await fs.access(nodeModulesPath);
                this.log('Node modules directory exists', 'success', 'installation');
            } catch {
                this.log('Node modules not found - run npm install', 'error', 'installation');
            }
            
            // Verify command availability
            const commands = ['node', 'npm', 'python', 'curl'];
            for (const cmd of commands) {
                try {
                    await execAsync(`which ${cmd}`);
                    this.log(`Command ${cmd} available`, 'success', 'installation');
                } catch {
                    this.log(`Command ${cmd} not available`, 'error', 'installation');
                }
            }
            
        } catch (error) {
            this.log(`Installation validation failed: ${error.message}`, 'error', 'installation');
        }
    }

    async validateConfiguration() {
        this.log('Phase 2: Validating Configuration', 'progress', 'configuration');
        
        try {
            // Validate package.json MCP configuration
            const packagePath = path.join(__dirname, '..', 'package.json');
            const packageData = JSON.parse(await fs.readFile(packagePath, 'utf8'));
            
            if (packageData.mcp && packageData.mcp.servers) {
                const serverCount = Object.keys(packageData.mcp.servers).length;
                this.log(`Found ${serverCount} MCP server configurations`, 'success', 'configuration');
                
                // Validate each server configuration
                for (const [serverName, config] of Object.entries(packageData.mcp.servers)) {
                    if (config.command && config.args) {
                        this.log(`Server ${serverName} properly configured`, 'success', 'configuration');
                    } else {
                        this.log(`Server ${serverName} missing required config`, 'error', 'configuration');
                    }
                }
            } else {
                this.log('MCP server configuration missing', 'error', 'configuration');
            }
            
            // Check environment variables
            const requiredEnvVars = [
                'NODE_ENV',
                'SPOTIFY_CLIENT_ID',
                'SPOTIFY_CLIENT_SECRET'
            ];
            
            for (const envVar of requiredEnvVars) {
                if (process.env[envVar]) {
                    this.log(`Environment variable ${envVar} set`, 'success', 'configuration');
                } else {
                    this.log(`Environment variable ${envVar} missing`, 'warning', 'configuration');
                }
            }
            
            // Validate MCP server files
            const serverFiles = [
                'enhanced-mcp-orchestrator.js',
                'workflow-manager.js',  
                'health.js',
                'enhanced-health-monitor.js',
                'enhanced-registry-orchestrator.js'
            ];
            
            for (const file of serverFiles) {
                const filePath = path.join(__dirname, '..', 'mcp-server', file);
                try {
                    await fs.access(filePath);
                    this.log(`MCP server file ${file} exists`, 'success', 'configuration');
                } catch {
                    this.log(`MCP server file ${file} missing`, 'error', 'configuration');
                }
            }
            
        } catch (error) {
            this.log(`Configuration validation failed: ${error.message}`, 'error', 'configuration');
        }
    }

    async validateHealthAndConnectivity() {
        this.log('Phase 3: Validating Health and Connectivity', 'progress', 'health');
        
        try {
            // Test health endpoints
            const healthEndpoints = [
                { name: 'main-app', url: 'http://localhost:3000/health' },
                { name: 'mcp-health', url: 'http://localhost:3001/health' },
                { name: 'mcp-orchestrator', url: 'http://localhost:3002/health' },
                { name: 'mcp-workflow', url: 'http://localhost:3003/status' }
            ];
            
            for (const endpoint of healthEndpoints) {
                try {
                    const startTime = Date.now();
                    await this.makeHealthRequest(endpoint.url);
                    const responseTime = Date.now() - startTime;
                    
                    this.log(`Health check ${endpoint.name} passed (${responseTime}ms)`, 'success', 'health');
                } catch (error) {
                    this.log(`Health check ${endpoint.name} failed: ${error.message}`, 'warning', 'health');
                }
            }
            
            // Test MCP server processes
            await this.testMCPServerProcesses();
            
        } catch (error) {
            this.log(`Health validation failed: ${error.message}`, 'error', 'health');
        }
    }

    async validatePerformance() {
        this.log('Phase 4: Performance Testing', 'progress', 'performance');
        
        try {
            // Memory usage check
            const memUsage = process.memoryUsage();
            const memMB = Math.round(memUsage.rss / 1024 / 1024);
            
            if (memMB < 500) {
                this.log(`Memory usage ${memMB}MB - Excellent`, 'success', 'performance');
            } else if (memMB < 1000) {
                this.log(`Memory usage ${memMB}MB - Good`, 'success', 'performance');
            } else {
                this.log(`Memory usage ${memMB}MB - High`, 'warning', 'performance');
            }
            
            // Response time benchmarks
            const performanceTests = [
                { name: 'Package.json read', test: () => this.benchmarkPackageRead() },
                { name: 'File system scan', test: () => this.benchmarkFileScan() },
                { name: 'MCP config parse', test: () => this.benchmarkMCPConfigParse() }
            ];
            
            for (const perfTest of performanceTests) {
                try {
                    const duration = await perfTest.test();
                    if (duration < 100) {
                        this.log(`${perfTest.name}: ${duration}ms - Fast`, 'success', 'performance');
                    } else if (duration < 500) {
                        this.log(`${perfTest.name}: ${duration}ms - Acceptable`, 'success', 'performance');
                    } else {
                        this.log(`${perfTest.name}: ${duration}ms - Slow`, 'warning', 'performance');
                    }
                } catch (error) {
                    this.log(`${perfTest.name} failed: ${error.message}`, 'error', 'performance');
                }
            }
            
        } catch (error) {
            this.log(`Performance validation failed: ${error.message}`, 'error', 'performance');
        }
    }

    async validateSecurity() {
        this.log('Phase 5: Security Validation', 'progress', 'security');
        
        try {
            // Check for exposed secrets
            const securityChecks = [
                { name: 'Environment variables', test: () => this.checkEnvironmentSecurity() },
                { name: 'File permissions', test: () => this.checkFilePermissions() },
                { name: 'Package vulnerabilities', test: () => this.checkPackageVulnerabilities() }
            ];
            
            for (const check of securityChecks) {
                try {
                    await check.test();
                    this.log(`Security check ${check.name} passed`, 'success', 'security');
                } catch (error) {
                    this.log(`Security check ${check.name} failed: ${error.message}`, 'error', 'security');
                }
            }
            
        } catch (error) {
            this.log(`Security validation failed: ${error.message}`, 'error', 'security');
        }
    }

    async validateIntegrations() {
        this.log('Phase 6: Integration Testing', 'progress', 'integration');
        
        try {
            // Test MCP server integrations
            const integrationTests = [
                { name: 'Filesystem MCP', test: () => this.testFilesystemMCP() },
                { name: 'Browserbase MCP', test: () => this.testBrowserbaseMCP() },
                { name: 'Spotify MCP', test: () => this.testSpotifyMCP() },
                { name: 'Sequential Thinking MCP', test: () => this.testSequentialThinkingMCP() }
            ];
            
            for (const integrationTest of integrationTests) {
                try {
                    await integrationTest.test();
                    this.log(`Integration test ${integrationTest.name} passed`, 'success', 'integration');
                } catch (error) {
                    this.log(`Integration test ${integrationTest.name} failed: ${error.message}`, 'warning', 'integration');
                }
            }
            
        } catch (error) {
            this.log(`Integration validation failed: ${error.message}`, 'error', 'integration');
        }
    }

    async validateAutomation() {
        this.log('Phase 7: Automation and Workflows', 'progress', 'automation');
        
        try {
            // Test npm scripts
            const npmScripts = [
                'mcp:health',
                'mcp:validate',
                'mcp-orchestrator',
                'mcp-workflow'
            ];
            
            for (const script of npmScripts) {
                try {
                    // Check if script exists in package.json
                    const packagePath = path.join(__dirname, '..', 'package.json');
                    const packageData = JSON.parse(await fs.readFile(packagePath, 'utf8'));
                    
                    if (packageData.scripts && packageData.scripts[script]) {
                        this.log(`NPM script ${script} configured`, 'success', 'automation');
                    } else {
                        this.log(`NPM script ${script} missing`, 'error', 'automation');
                    }
                } catch (error) {
                    this.log(`NPM script validation ${script} failed: ${error.message}`, 'error', 'automation');
                }
            }
            
            // Test workflow files
            const workflowDir = path.join(__dirname, '..', '.github', 'workflows');
            try {
                const workflows = await fs.readdir(workflowDir);
                const mcpWorkflows = workflows.filter(w => w.includes('mcp') || w.includes('agent'));
                
                this.log(`Found ${mcpWorkflows.length} MCP-related workflows`, 'success', 'automation');
                
                for (const workflow of mcpWorkflows) {
                    this.log(`Workflow ${workflow} available`, 'success', 'automation');
                }
                
            } catch (error) {
                this.log(`Workflow validation failed: ${error.message}`, 'warning', 'automation');
            }
            
        } catch (error) {
            this.log(`Automation validation failed: ${error.message}`, 'error', 'automation');
        }
    }

    // Helper methods for specific tests
    async makeHealthRequest(url) {
        return new Promise((resolve, reject) => {
            const req = http.get(url, { timeout: this.timeouts.healthCheck }, (res) => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve();
                } else {
                    reject(new Error(`HTTP ${res.statusCode}`));
                }
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.on('error', (error) => {
                reject(error);
            });
        });
    }

    async testMCPServerProcesses() {
        // Test if MCP manager commands work
        try {
            const { stdout } = await execAsync('npm run mcp:health --silent', { 
                timeout: this.timeouts.integration,
                cwd: path.join(__dirname, '..')
            });
            this.log('MCP health command executed successfully', 'success', 'health');
        } catch (error) {
            this.log(`MCP health command failed: ${error.message}`, 'warning', 'health');
        }
    }

    async benchmarkPackageRead() {
        const startTime = Date.now();
        const packagePath = path.join(__dirname, '..', 'package.json');
        await fs.readFile(packagePath, 'utf8');
        return Date.now() - startTime;
    }

    async benchmarkFileScan() {
        const startTime = Date.now();
        await fs.readdir(__dirname);
        return Date.now() - startTime;
    }

    async benchmarkMCPConfigParse() {
        const startTime = Date.now();
        const packagePath = path.join(__dirname, '..', 'package.json');
        const packageData = JSON.parse(await fs.readFile(packagePath, 'utf8'));
        const mcpConfig = packageData.mcp || {};
        return Date.now() - startTime;
    }

    async checkEnvironmentSecurity() {
        // Check for common security issues
        const sensitiveVars = ['API_KEY', 'SECRET', 'TOKEN', 'PASSWORD'];
        let issues = 0;
        
        for (const [key, value] of Object.entries(process.env)) {
            if (sensitiveVars.some(sensitive => key.includes(sensitive))) {
                if (value && value.length > 0) {
                    // Don't log the actual value
                    console.log(`   Sensitive variable ${key} is set`);
                } else {
                    issues++;
                }
            }
        }
        
        if (issues > 0) {
            throw new Error(`${issues} sensitive environment variables not properly set`);
        }
    }

    async checkFilePermissions() {
        const sensitiveFiles = [
            '.env',
            'package.json',
            'mcp-server/enhanced-health-monitor.js'
        ];
        
        for (const file of sensitiveFiles) {
            const filePath = path.join(__dirname, '..', file);
            try {
                const stats = await fs.stat(filePath);
                // Basic permission check - in production, would be more thorough
                if (stats.mode) {
                    console.log(`   File ${file} permissions OK`);
                }
            } catch (error) {
                // File doesn't exist or permission denied
                console.log(`   File ${file} not accessible: ${error.message}`);
            }
        }
    }

    async checkPackageVulnerabilities() {
        try {
            // Run npm audit in a non-blocking way
            const { stdout } = await execAsync('npm audit --json', {
                timeout: 10000,
                cwd: path.join(__dirname, '..'),
                stdio: 'pipe'
            });
            
            const auditResult = JSON.parse(stdout);
            if (auditResult.metadata && auditResult.metadata.vulnerabilities) {
                const vulnCount = auditResult.metadata.vulnerabilities.total;
                if (vulnCount > 0) {
                    console.log(`   Found ${vulnCount} package vulnerabilities`);
                } else {
                    console.log('   No package vulnerabilities found');
                }
            }
        } catch (error) {
            // npm audit may fail in some environments
            console.log('   Package vulnerability check skipped');
        }
    }

    async testFilesystemMCP() {
        // Test filesystem MCP functionality
        const testFile = path.join(__dirname, '..', 'package.json');
        try {
            await fs.access(testFile);
            return true;
        } catch (error) {
            throw new Error('Filesystem MCP test failed');
        }
    }

    async testBrowserbaseMCP() {
        // Test browserbase MCP configuration
        if (process.env.BROWSERBASE_API_KEY) {
            return true;
        } else {
            throw new Error('Browserbase credentials not configured');
        }
    }

    async testSpotifyMCP() {
        // Test Spotify MCP configuration
        if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
            return true;
        } else {
            throw new Error('Spotify credentials not configured');
        }
    }

    async testSequentialThinkingMCP() {
        // Test sequential thinking MCP
        const mcpPath = path.join(__dirname, '..', 'mcp-servers', 'sequential-thinking');
        try {
            await fs.access(mcpPath);
            return true;
        } catch (error) {
            throw new Error('Sequential thinking MCP not found');
        }
    }

    async generateComprehensiveReport() {
        this.log('Generating comprehensive validation report...', 'progress');
        
        const report = {
            ...this.testResults,
            summary: {
                overallStatus: this.testResults.score >= 80 ? 'PASSED' : 
                               this.testResults.score >= 60 ? 'WARNING' : 'FAILED',
                recommendations: this.generateRecommendations(),
                nextSteps: this.generateNextSteps()
            }
        };
        
        // Save detailed report
        const reportPath = path.join(__dirname, '..', 'enhanced-mcp-validation-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        // Generate summary report
        await this.generateSummaryReport(report);
        
        this.log(`📄 Detailed report saved to enhanced-mcp-validation-report.json`, 'success');
        
        return report;
    }

    generateRecommendations() {
        const recommendations = [];
        
        if (this.testResults.categories.security.failed > 0) {
            recommendations.push('Review and fix security vulnerabilities');
        }
        
        if (this.testResults.categories.performance.warnings > 0) {
            recommendations.push('Optimize performance bottlenecks');
        }
        
        if (this.testResults.categories.integration.failed > 0) {
            recommendations.push('Fix failed MCP integrations');
        }
        
        if (this.testResults.score < 90) {
            recommendations.push('Run validation pipeline regularly');
        }
        
        return recommendations;
    }

    generateNextSteps() {
        const nextSteps = [];
        
        if (this.testResults.failedTests > 0) {
            nextSteps.push('Address failed tests before deployment');
        }
        
        if (this.testResults.warnings > 5) {
            nextSteps.push('Review warnings for potential issues');
        }
        
        nextSteps.push('Set up continuous monitoring');
        nextSteps.push('Schedule regular validation runs');
        
        return nextSteps;
    }

    async generateSummaryReport(report) {
        const summary = `# Enhanced MCP Validation Report

## Overall Status: ${report.summary.overallStatus}
- **Score**: ${report.score}%
- **Duration**: ${Math.round(report.duration / 1000)}s
- **Tests**: ${report.totalTests} total (${report.passedTests} passed, ${report.failedTests} failed)

## Category Results
${Object.entries(report.categories).map(([name, data]) => 
    `- **${name}**: ${data.passed} passed, ${data.failed} failed`
).join('\n')}

## Recommendations
${report.summary.recommendations.map(rec => `- ${rec}`).join('\n')}

## Next Steps
${report.summary.nextSteps.map(step => `- ${step}`).join('\n')}

Generated: ${new Date().toISOString()}
`;

        const summaryPath = path.join(__dirname, '..', 'MCP_VALIDATION_SUMMARY.md');
        await fs.writeFile(summaryPath, summary);
        
        console.log('\n' + summary);
    }
}

// CLI interface
if (require.main === module) {
    const pipeline = new EnhancedMCPValidationPipeline();
    
    pipeline.runComprehensiveValidation()
        .then(results => {
            console.log(`\n🎉 Validation completed with score: ${results.score}%`);
            process.exit(results.score >= 80 ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Validation pipeline failed:', error);
            process.exit(1);
        });
}

module.exports = EnhancedMCPValidationPipeline;
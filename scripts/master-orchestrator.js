#!/usr/bin/env node

/**
 * Master Orchestration Script for EchoTune AI
 * Coordinates comprehensive testing, validation, and deployment workflows
 * Utilizes all available MCP servers in coordinated automation
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

// Import our custom validators
const ComprehensiveMCPWorkflowTester = require('./comprehensive-mcp-workflow-test');
const DeploymentValidator = require('./deployment-validator');

class EchoTuneMasterOrchestrator {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            phases: {},
            summary: {
                totalPhases: 0,
                completedPhases: 0,
                failedPhases: 0,
                overallStatus: 'unknown',
                duration: 0
            }
        };
        
        this.startTime = Date.now();
        
        this.phases = [
            {
                name: 'Environment Setup',
                description: 'Validate and setup development environment',
                required: true,
                steps: [
                    'Install dependencies',
                    'Validate environment variables',
                    'Check system requirements',
                    'Setup configuration files'
                ]
            },
            {
                name: 'MCP Server Validation',
                description: 'Test all installed MCP servers',
                required: true,
                steps: [
                    'Start MCP server orchestrator',
                    'Test individual MCP servers',
                    'Validate MCP integrations',
                    'Test MCP workflows'
                ]
            },
            {
                name: 'Application Testing',
                description: 'Test core application functionality',
                required: true,
                steps: [
                    'Run unit tests',
                    'Run integration tests',
                    'Test API endpoints',
                    'Validate chat functionality'
                ]
            },
            {
                name: 'Performance Validation',
                description: 'Validate application performance',
                required: false,
                steps: [
                    'Run performance benchmarks',
                    'Test database performance',
                    'Validate caching systems',
                    'Test concurrent users'
                ]
            },
            {
                name: 'Security Validation',
                description: 'Validate security configuration',
                required: true,
                steps: [
                    'Security audit',
                    'Dependency vulnerability check',
                    'Authentication testing',
                    'Authorization testing'
                ]
            },
            {
                name: 'Deployment Preparation',
                description: 'Prepare for deployment',
                required: true,
                steps: [
                    'Build production assets',
                    'Validate deployment configuration',
                    'Test Docker containers',
                    'Prepare deployment scripts'
                ]
            },
            {
                name: 'Production Deployment',
                description: 'Deploy to production environment',
                required: false,
                steps: [
                    'Deploy to staging',
                    'Run smoke tests',
                    'Deploy to production',
                    'Monitor deployment'
                ]
            }
        ];
    }

    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'success' ? '✅' : 'ℹ️';
        console.log(`${prefix} [${timestamp}] ${message}`);
    }

    async executeCommand(command, description, options = {}) {
        this.log(`Executing: ${description}`, 'info');
        
        try {
            const result = await execAsync(command, {
                timeout: options.timeout || 60000,
                maxBuffer: 1024 * 1024 * 10, // 10MB buffer
                ...options
            });
            
            this.log(`✅ ${description} completed successfully`, 'success');
            return {
                success: true,
                stdout: result.stdout,
                stderr: result.stderr
            };
        } catch (error) {
            this.log(`❌ ${description} failed: ${error.message}`, 'error');
            return {
                success: false,
                error: error.message,
                stdout: error.stdout || '',
                stderr: error.stderr || ''
            };
        }
    }

    async runPhase1_EnvironmentSetup() {
        this.log('🚀 Phase 1: Environment Setup', 'info');
        
        const phase = {
            name: 'Environment Setup',
            status: 'running',
            startTime: Date.now(),
            steps: []
        };
        
        try {
            // Step 1: Install dependencies
            const npmInstall = await this.executeCommand(
                'npm install',
                'Installing npm dependencies',
                { timeout: 120000 }
            );
            phase.steps.push({
                name: 'Install dependencies',
                success: npmInstall.success,
                details: npmInstall.success ? 'Dependencies installed' : npmInstall.error
            });
            
            // Step 2: Validate environment
            const envValidation = await this.executeCommand(
                'node scripts/validate-env.js',
                'Validating environment variables'
            );
            phase.steps.push({
                name: 'Validate environment variables',
                success: envValidation.success,
                details: envValidation.success ? 'Environment validated' : envValidation.error
            });
            
            // Step 3: Check system requirements
            const nodeVersion = await this.executeCommand(
                'node --version',
                'Checking Node.js version'
            );
            phase.steps.push({
                name: 'Check system requirements',
                success: nodeVersion.success,
                details: nodeVersion.success ? `Node.js ${nodeVersion.stdout.trim()}` : nodeVersion.error
            });
            
            // Step 4: Setup MCP configuration
            if (fs.existsSync('.env.mcp.example') && !fs.existsSync('.env.mcp')) {
                fs.copyFileSync('.env.mcp.example', '.env.mcp');
                phase.steps.push({
                    name: 'Setup MCP configuration',
                    success: true,
                    details: 'MCP configuration file created'
                });
            } else {
                phase.steps.push({
                    name: 'Setup MCP configuration',
                    success: true,
                    details: 'MCP configuration already exists'
                });
            }
            
            phase.status = 'completed';
            phase.endTime = Date.now();
            
        } catch (error) {
            phase.status = 'failed';
            phase.error = error.message;
            phase.endTime = Date.now();
        }
        
        this.results.phases['Environment Setup'] = phase;
        return phase;
    }

    async runPhase2_MCPValidation() {
        this.log('🤖 Phase 2: MCP Server Validation', 'info');
        
        const phase = {
            name: 'MCP Server Validation',
            status: 'running',
            startTime: Date.now(),
            steps: []
        };
        
        try {
            // Run comprehensive MCP workflow test
            const mcpTester = new ComprehensiveMCPWorkflowTester();
            const mcpResults = await mcpTester.runComprehensiveTest();
            
            phase.steps.push({
                name: 'MCP Server Testing',
                success: mcpResults.summary.failedTests === 0,
                details: `${mcpResults.summary.passedTests}/${mcpResults.summary.totalTests} tests passed`
            });
            
            // Test MCP orchestrator
            const orchestratorTest = await this.executeCommand(
                'npm run mcp:orchestrator-status',
                'Testing MCP orchestrator'
            );
            phase.steps.push({
                name: 'MCP Orchestrator',
                success: orchestratorTest.success,
                details: orchestratorTest.success ? 'Orchestrator operational' : orchestratorTest.error
            });
            
            // Validate MCP connectivity
            const connectivityTest = await this.executeCommand(
                './mcp-config/validate_mcp.sh',
                'Validating MCP connectivity'
            );
            phase.steps.push({
                name: 'MCP Connectivity',
                success: connectivityTest.success,
                details: connectivityTest.success ? 'Connectivity validated' : connectivityTest.error
            });
            
            phase.status = mcpResults.summary.failedTests === 0 ? 'completed' : 'failed';
            phase.endTime = Date.now();
            
        } catch (error) {
            phase.status = 'failed';
            phase.error = error.message;
            phase.endTime = Date.now();
        }
        
        this.results.phases['MCP Server Validation'] = phase;
        return phase;
    }

    async runPhase3_ApplicationTesting() {
        this.log('🧪 Phase 3: Application Testing', 'info');
        
        const phase = {
            name: 'Application Testing',
            status: 'running',
            startTime: Date.now(),
            steps: []
        };
        
        try {
            // Run unit tests
            const unitTests = await this.executeCommand(
                'npm run test:unit',
                'Running unit tests',
                { timeout: 60000 }
            );
            phase.steps.push({
                name: 'Unit tests',
                success: unitTests.success,
                details: unitTests.success ? 'Unit tests passed' : unitTests.error
            });
            
            // Run integration tests
            const integrationTests = await this.executeCommand(
                'npm run test:integration',
                'Running integration tests',
                { timeout: 120000 }
            );
            phase.steps.push({
                name: 'Integration tests',
                success: integrationTests.success,
                details: integrationTests.success ? 'Integration tests passed' : integrationTests.error
            });
            
            // Test API validation
            const apiValidation = await this.executeCommand(
                'npm run validate:api-comprehensive',
                'Validating API endpoints'
            );
            phase.steps.push({
                name: 'API validation',
                success: apiValidation.success,
                details: apiValidation.success ? 'API endpoints validated' : apiValidation.error
            });
            
            // Start application and test health
            this.log('Starting application for health check...', 'info');
            const appStart = spawn('npm', ['start'], {
                stdio: ['ignore', 'pipe', 'pipe'],
                detached: true
            });
            
            // Wait for application to start
            await new Promise(resolve => setTimeout(resolve, 10000));
            
            const healthCheck = await this.executeCommand(
                'curl -f http://localhost:3000/health',
                'Testing application health'
            );
            phase.steps.push({
                name: 'Application health',
                success: healthCheck.success,
                details: healthCheck.success ? 'Application healthy' : healthCheck.error
            });
            
            // Stop application
            if (appStart.pid) {
                process.kill(-appStart.pid, 'SIGTERM');
            }
            
            phase.status = 'completed';
            phase.endTime = Date.now();
            
        } catch (error) {
            phase.status = 'failed';
            phase.error = error.message;
            phase.endTime = Date.now();
        }
        
        this.results.phases['Application Testing'] = phase;
        return phase;
    }

    async runPhase4_PerformanceValidation() {
        this.log('⚡ Phase 4: Performance Validation', 'info');
        
        const phase = {
            name: 'Performance Validation',
            status: 'running',
            startTime: Date.now(),
            steps: []
        };
        
        try {
            // Run performance benchmarks
            const perfTest = await this.executeCommand(
                'npm run performance:smoke-test',
                'Running performance smoke test'
            );
            phase.steps.push({
                name: 'Performance benchmarks',
                success: perfTest.success,
                details: perfTest.success ? 'Performance benchmarks passed' : perfTest.error
            });
            
            // Test database performance
            const dbPerf = await this.executeCommand(
                'npm run validate:mongodb-enhanced',
                'Testing database performance'
            );
            phase.steps.push({
                name: 'Database performance',
                success: dbPerf.success,
                details: dbPerf.success ? 'Database performance validated' : dbPerf.error
            });
            
            // Test Redis caching
            const redisTest = await this.executeCommand(
                'npm run redis:health',
                'Testing Redis caching'
            );
            phase.steps.push({
                name: 'Caching systems',
                success: redisTest.success,
                details: redisTest.success ? 'Redis caching validated' : redisTest.error
            });
            
            phase.status = 'completed';
            phase.endTime = Date.now();
            
        } catch (error) {
            phase.status = 'failed';
            phase.error = error.message;
            phase.endTime = Date.now();
        }
        
        this.results.phases['Performance Validation'] = phase;
        return phase;
    }

    async runPhase5_SecurityValidation() {
        this.log('🔒 Phase 5: Security Validation', 'info');
        
        const phase = {
            name: 'Security Validation',
            status: 'running',
            startTime: Date.now(),
            steps: []
        };
        
        try {
            // Run security audit
            const securityAudit = await this.executeCommand(
                'npm audit',
                'Running security audit'
            );
            phase.steps.push({
                name: 'Security audit',
                success: securityAudit.success,
                details: securityAudit.success ? 'Security audit passed' : securityAudit.error
            });
            
            // Check for vulnerabilities
            const vulnCheck = await this.executeCommand(
                'npm audit --audit-level=high',
                'Checking for high-severity vulnerabilities'
            );
            phase.steps.push({
                name: 'Vulnerability check',
                success: vulnCheck.success,
                details: vulnCheck.success ? 'No high-severity vulnerabilities' : vulnCheck.error
            });
            
            // Validate authentication
            const authTest = await this.executeCommand(
                'npm run validate:security',
                'Validating authentication system'
            );
            phase.steps.push({
                name: 'Authentication testing',
                success: authTest.success,
                details: authTest.success ? 'Authentication validated' : authTest.error
            });
            
            phase.status = 'completed';
            phase.endTime = Date.now();
            
        } catch (error) {
            phase.status = 'failed';
            phase.error = error.message;
            phase.endTime = Date.now();
        }
        
        this.results.phases['Security Validation'] = phase;
        return phase;
    }

    async runPhase6_DeploymentPreparation() {
        this.log('📦 Phase 6: Deployment Preparation', 'info');
        
        const phase = {
            name: 'Deployment Preparation',
            status: 'running',
            startTime: Date.now(),
            steps: []
        };
        
        try {
            // Build production assets
            const buildTest = await this.executeCommand(
                'npm run build',
                'Building production assets',
                { timeout: 120000 }
            );
            phase.steps.push({
                name: 'Build production assets',
                success: buildTest.success,
                details: buildTest.success ? 'Production assets built' : buildTest.error
            });
            
            // Run deployment validator
            const deploymentValidator = new DeploymentValidator();
            const deployResults = await deploymentValidator.runValidation();
            
            phase.steps.push({
                name: 'Deployment validation',
                success: deployResults.summary.readiness !== 'not-ready',
                details: `Deployment readiness: ${deployResults.summary.readiness}`
            });
            
            // Test Docker build
            const dockerBuild = await this.executeCommand(
                'docker build -t echotune-test .',
                'Testing Docker build',
                { timeout: 300000 }
            );
            phase.steps.push({
                name: 'Docker build test',
                success: dockerBuild.success,
                details: dockerBuild.success ? 'Docker build successful' : dockerBuild.error
            });
            
            phase.status = 'completed';
            phase.endTime = Date.now();
            
        } catch (error) {
            phase.status = 'failed';
            phase.error = error.message;
            phase.endTime = Date.now();
        }
        
        this.results.phases['Deployment Preparation'] = phase;
        return phase;
    }

    async runPhase7_ProductionDeployment() {
        this.log('🚀 Phase 7: Production Deployment', 'info');
        
        const phase = {
            name: 'Production Deployment',
            status: 'running',
            startTime: Date.now(),
            steps: []
        };
        
        try {
            // Check if we should deploy
            const shouldDeploy = process.env.DEPLOY_TO_PRODUCTION === 'true' || 
                                process.argv.includes('--deploy');
            
            if (!shouldDeploy) {
                phase.steps.push({
                    name: 'Production deployment',
                    success: true,
                    details: 'Skipped (use --deploy flag or DEPLOY_TO_PRODUCTION=true to deploy)'
                });
                
                phase.status = 'skipped';
                phase.endTime = Date.now();
                return phase;
            }
            
            // Deploy to DigitalOcean
            const doDeployment = await this.executeCommand(
                'npm run deploy:digitalocean',
                'Deploying to DigitalOcean',
                { timeout: 600000 }
            );
            phase.steps.push({
                name: 'DigitalOcean deployment',
                success: doDeployment.success,
                details: doDeployment.success ? 'Deployed to DigitalOcean' : doDeployment.error
            });
            
            // Run post-deployment smoke tests
            if (doDeployment.success) {
                await new Promise(resolve => setTimeout(resolve, 30000)); // Wait for deployment
                
                const smokeTest = await this.executeCommand(
                    'curl -f https://your-domain.com/health',
                    'Running post-deployment smoke test'
                );
                phase.steps.push({
                    name: 'Post-deployment smoke test',
                    success: smokeTest.success,
                    details: smokeTest.success ? 'Smoke test passed' : smokeTest.error
                });
            }
            
            phase.status = doDeployment.success ? 'completed' : 'failed';
            phase.endTime = Date.now();
            
        } catch (error) {
            phase.status = 'failed';
            phase.error = error.message;
            phase.endTime = Date.now();
        }
        
        this.results.phases['Production Deployment'] = phase;
        return phase;
    }

    async generateComprehensiveReport() {
        this.results.summary.totalPhases = this.phases.length;
        this.results.summary.completedPhases = Object.values(this.results.phases)
            .filter(phase => phase.status === 'completed').length;
        this.results.summary.failedPhases = Object.values(this.results.phases)
            .filter(phase => phase.status === 'failed').length;
        this.results.summary.duration = Date.now() - this.startTime;
        
        // Determine overall status
        if (this.results.summary.failedPhases === 0) {
            this.results.summary.overallStatus = 'success';
        } else if (this.results.summary.completedPhases > this.results.summary.failedPhases) {
            this.results.summary.overallStatus = 'partial-success';
        } else {
            this.results.summary.overallStatus = 'failed';
        }
        
        // Save detailed report
        const reportPath = path.join(__dirname, '..', 'MASTER_ORCHESTRATION_REPORT.json');
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        
        // Generate markdown summary
        this.generateMarkdownReport();
        
        this.log(`📊 Master orchestration report saved to: ${reportPath}`, 'info');
        
        return this.results;
    }

    generateMarkdownReport() {
        const statusEmoji = {
            'success': '🟢',
            'partial-success': '🟡',
            'failed': '🔴',
            'unknown': '⚪'
        };
        
        const phaseEmoji = {
            'completed': '✅',
            'failed': '❌',
            'skipped': '⚠️',
            'running': '🔄'
        };
        
        const markdown = `# EchoTune AI - Master Orchestration Report

## ${statusEmoji[this.results.summary.overallStatus]} Overall Status: ${this.results.summary.overallStatus.replace('-', ' ').toUpperCase()}

### Executive Summary
- **Total Phases**: ${this.results.summary.totalPhases}
- **Completed**: ${this.results.summary.completedPhases}
- **Failed**: ${this.results.summary.failedPhases}
- **Duration**: ${Math.round(this.results.summary.duration / 1000)}s
- **Generated**: ${this.results.timestamp}

### Phase Results

${Object.entries(this.results.phases).map(([name, phase]) => `
#### ${phaseEmoji[phase.status]} ${name}
- **Status**: ${phase.status}
- **Duration**: ${phase.endTime ? Math.round((phase.endTime - phase.startTime) / 1000) : 'N/A'}s
- **Steps**: ${phase.steps.length}
${phase.steps.map(step => `  - ${step.success ? '✅' : '❌'} ${step.name}: ${step.details}`).join('\n')}
${phase.error ? `- **Error**: ${phase.error}` : ''}
`).join('\n')}

### Recommendations

${this.generateRecommendations()}

### Next Steps

${this.generateNextSteps()}

---
*Report generated by EchoTune AI Master Orchestrator on ${this.results.timestamp}*
`;
        
        const markdownPath = path.join(__dirname, '..', 'MASTER_ORCHESTRATION_REPORT.md');
        fs.writeFileSync(markdownPath, markdown);
        
        this.log(`📋 Markdown report saved to: ${markdownPath}`, 'info');
    }

    generateRecommendations() {
        const recommendations = [];
        
        if (this.results.summary.overallStatus === 'success') {
            recommendations.push('🟢 **Excellent**: All phases completed successfully!');
            recommendations.push('🚀 **Ready**: System is ready for production deployment');
        } else if (this.results.summary.overallStatus === 'partial-success') {
            recommendations.push('🟡 **Review**: Some phases failed - review failed steps');
            recommendations.push('🔧 **Fix**: Address failed components before deployment');
        } else {
            recommendations.push('🔴 **Critical**: Multiple phases failed - system not ready');
            recommendations.push('🛠️ **Debug**: Investigate and fix critical issues');
        }
        
        return recommendations.join('\n\n');
    }

    generateNextSteps() {
        const steps = [];
        
        if (this.results.summary.overallStatus === 'success') {
            steps.push('1. Review detailed reports in test-results/ directory');
            steps.push('2. Monitor application performance in production');
            steps.push('3. Set up automated monitoring and alerting');
        } else {
            steps.push('1. Review failed phases and error messages');
            steps.push('2. Fix identified issues and re-run orchestration');
            steps.push('3. Consult documentation for troubleshooting');
        }
        
        return steps.join('\n');
    }

    async runMasterOrchestration() {
        this.log('🎭 Starting EchoTune AI Master Orchestration', 'info');
        this.log('=' .repeat(50), 'info');
        
        try {
            // Run all phases
            await this.runPhase1_EnvironmentSetup();
            await this.runPhase2_MCPValidation();
            await this.runPhase3_ApplicationTesting();
            await this.runPhase4_PerformanceValidation();
            await this.runPhase5_SecurityValidation();
            await this.runPhase6_DeploymentPreparation();
            await this.runPhase7_ProductionDeployment();
            
            // Generate comprehensive report
            await this.generateComprehensiveReport();
            
            this.log('=' .repeat(50), 'info');
            this.log('🎉 Master Orchestration completed!', 'success');
            this.log(`📊 Status: ${this.results.summary.overallStatus}`, 'info');
            this.log(`⏱️ Duration: ${Math.round(this.results.summary.duration / 1000)}s`, 'info');
            
            return this.results;
            
        } catch (error) {
            this.log(`💥 Master Orchestration failed: ${error.message}`, 'error');
            throw error;
        }
    }
}

// Run orchestration if called directly
if (require.main === module) {
    const orchestrator = new EchoTuneMasterOrchestrator();
    orchestrator.runMasterOrchestration()
        .then((results) => {
            const exitCode = results.summary.overallStatus === 'failed' ? 1 : 0;
            process.exit(exitCode);
        })
        .catch((error) => {
            console.error('💥 Orchestration crashed:', error);
            process.exit(1);
        });
}

module.exports = EchoTuneMasterOrchestrator;
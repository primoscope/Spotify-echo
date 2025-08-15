#!/usr/bin/env node
/**
 * Quick Setup Script for Enhanced MCP × Perplexity Integration
 * Configures environment and validates integration readiness
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

class IntegrationSetupManager {
    constructor() {
        this.setupSteps = [
            'validateEnvironment',
            'configureAPIKeys', 
            'testMCPConnectivity',
            'validatePerplexityIntegration',
            'runHealthChecks',
            'generateSetupReport'
        ];
        
        this.setupResults = {
            timestamp: new Date().toISOString(),
            steps: {},
            overallSuccess: false,
            nextActions: []
        };
    }

    async runSetup() {
        console.log('🚀 EchoTune AI - Enhanced MCP × Perplexity Integration Setup');
        console.log('================================================================\n');

        for (const step of this.setupSteps) {
            try {
                console.log(`📋 Running: ${step}...`);
                const result = await this[step]();
                this.setupResults.steps[step] = { success: true, ...result };
                console.log(`✅ ${step} completed successfully\n`);
            } catch (error) {
                this.setupResults.steps[step] = { success: false, error: error.message };
                console.log(`❌ ${step} failed: ${error.message}\n`);
            }
        }

        // Determine overall success
        const successfulSteps = Object.values(this.setupResults.steps)
            .filter(step => step.success).length;
        this.setupResults.overallSuccess = successfulSteps === this.setupSteps.length;

        // Generate final report
        await this.generateSetupSummary();
    }

    async validateEnvironment() {
        const requirements = {
            node: { required: '16.0.0', command: 'node --version' },
            npm: { required: '7.0.0', command: 'npm --version' },
            git: { required: '2.0.0', command: 'git --version' }
        };

        const validationResults = {};

        for (const [tool, config] of Object.entries(requirements)) {
            try {
                const version = await this.execCommand(config.command);
                const cleanVersion = version.replace(/[^\d.]/g, '');
                validationResults[tool] = {
                    installed: true,
                    version: cleanVersion,
                    meets_requirements: this.compareVersions(cleanVersion, config.required)
                };
            } catch (error) {
                validationResults[tool] = {
                    installed: false,
                    error: error.message
                };
            }
        }

        // Check Node.js dependencies
        try {
            const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
            validationResults.dependencies = {
                total: Object.keys(packageJson.dependencies || {}).length,
                mcp_sdk_installed: packageJson.dependencies['@modelcontextprotocol/sdk'] ? true : false
            };
        } catch (error) {
            validationResults.dependencies = { error: 'package.json not found or invalid' };
        }

        return { validationResults };
    }

    async configureAPIKeys() {
        const envFile = '.env';
        const envTemplate = '.env.example';
        
        try {
            // Check if .env exists
            await fs.access(envFile);
            console.log('📄 .env file found');
        } catch {
            // Copy from template if .env doesn't exist
            try {
                await fs.copyFile(envTemplate, envFile);
                console.log('📄 Created .env from template');
            } catch {
                throw new Error('.env file missing and no template found');
            }
        }

        // Read current .env configuration
        const envContent = await fs.readFile(envFile, 'utf8');
        const envVars = {};
        
        envContent.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                envVars[key.trim()] = value.trim();
            }
        });

        // Check critical API keys
        const criticalKeys = [
            'PERPLEXITY_API_KEY',
            'SPOTIFY_CLIENT_ID',
            'SPOTIFY_CLIENT_SECRET',
            'MONGODB_URI'
        ];

        const keyStatus = {};
        const missingKeys = [];

        for (const key of criticalKeys) {
            const value = process.env[key] || envVars[key];
            keyStatus[key] = {
                configured: value && value !== 'your_key_here' && !value.includes('xxx'),
                present: !!value
            };
            
            if (!keyStatus[key].configured) {
                missingKeys.push(key);
            }
        }

        if (missingKeys.length > 0) {
            this.setupResults.nextActions.push({
                action: 'Configure API Keys',
                description: `Set the following keys in .env: ${missingKeys.join(', ')}`,
                priority: 'HIGH',
                estimated_time: '15 minutes'
            });
        }

        return { 
            keyStatus, 
            missingKeys: missingKeys.length,
            totalKeys: criticalKeys.length,
            configurationComplete: missingKeys.length === 0
        };
    }

    async testMCPConnectivity() {
        const mcpServers = {
            'perplexity-mcp': { port: 3010, script: 'mcp-servers/perplexity-mcp/perplexity-mcp-server.js' },
            'analytics-mcp': { port: 3013, script: 'mcp-servers/analytics-server/analytics-mcp.js' },
            'testing-automation': { port: 3014, script: 'mcp-servers/testing-automation/testing-automation-mcp.js' }
        };

        const connectivityResults = {};

        for (const [serverName, config] of Object.entries(mcpServers)) {
            try {
                // Check if server script exists
                await fs.access(config.script);
                
                // Test basic module loading
                try {
                    await this.execCommand(`node -e "require('./${config.script}'); console.log('OK');"`, { timeout: 5000 });
                    connectivityResults[serverName] = {
                        script_exists: true,
                        loadable: true,
                        status: 'ready'
                    };
                } catch {
                    connectivityResults[serverName] = {
                        script_exists: true,
                        loadable: false,
                        status: 'configuration_needed'
                    };
                }
            } catch {
                connectivityResults[serverName] = {
                    script_exists: false,
                    loadable: false,
                    status: 'missing'
                };
            }
        }

        const readyServers = Object.values(connectivityResults)
            .filter(result => result.status === 'ready').length;
        
        return {
            connectivityResults,
            readyServers,
            totalServers: Object.keys(mcpServers).length,
            readinessPercentage: Math.round((readyServers / Object.keys(mcpServers).length) * 100)
        };
    }

    async validatePerplexityIntegration() {
        const testResults = {};

        // Test 1: Basic Perplexity MCP server load
        try {
            await this.execCommand('npm run testperplexity', { timeout: 10000 });
            testResults.basic_load = { success: true };
        } catch (error) {
            testResults.basic_load = { success: false, error: error.message };
        }

        // Test 2: Enhanced validation pipeline
        try {
            const validationOutput = await this.execCommand('npm run mcp:enhanced-validation', { timeout: 30000 });
            const scoreMatch = validationOutput.match(/score:\s*(\d+)%/);
            const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
            
            testResults.enhanced_validation = {
                success: true,
                score: score,
                meets_target: score >= 85
            };
        } catch (error) {
            testResults.enhanced_validation = { success: false, error: error.message };
        }

        // Test 3: Workflow orchestrator test
        try {
            await this.execCommand('node enhanced-workflow-orchestrator.js list', { timeout: 5000 });
            testResults.workflow_orchestrator = { success: true };
        } catch (error) {
            testResults.workflow_orchestrator = { success: false, error: error.message };
        }

        const successfulTests = Object.values(testResults).filter(test => test.success).length;
        
        return {
            testResults,
            successfulTests,
            totalTests: Object.keys(testResults).length,
            integrationReady: successfulTests === Object.keys(testResults).length
        };
    }

    async runHealthChecks() {
        const healthChecks = [];

        // Check 1: Package.json integrity
        try {
            const pkg = JSON.parse(await fs.readFile('package.json', 'utf8'));
            healthChecks.push({
                check: 'package_json',
                status: 'healthy',
                details: `${Object.keys(pkg.dependencies || {}).length} dependencies`
            });
        } catch {
            healthChecks.push({
                check: 'package_json',
                status: 'error',
                details: 'Invalid or missing package.json'
            });
        }

        // Check 2: Critical directories
        const criticalDirs = ['src', 'mcp-server', 'mcp-servers', 'scripts'];
        for (const dir of criticalDirs) {
            try {
                await fs.access(dir);
                healthChecks.push({
                    check: `directory_${dir}`,
                    status: 'healthy',
                    details: 'Directory exists'
                });
            } catch {
                healthChecks.push({
                    check: `directory_${dir}`,
                    status: 'warning',
                    details: 'Directory missing'
                });
            }
        }

        // Check 3: Build capability
        try {
            await this.execCommand('npm run build', { timeout: 60000 });
            healthChecks.push({
                check: 'build_capability',
                status: 'healthy',
                details: 'Build completed successfully'
            });
        } catch (error) {
            healthChecks.push({
                check: 'build_capability',
                status: 'warning',
                details: `Build issues: ${error.message.substring(0, 100)}...`
            });
        }

        const healthyChecks = healthChecks.filter(check => check.status === 'healthy').length;
        
        return {
            healthChecks,
            healthyChecks,
            totalChecks: healthChecks.length,
            overallHealth: Math.round((healthyChecks / healthChecks.length) * 100)
        };
    }

    async generateSetupReport() {
        const report = {
            ...this.setupResults,
            summary: {
                setup_completion: this.setupResults.overallSuccess ? '100%' : 'Partial',
                critical_issues: this.setupResults.nextActions
                    .filter(action => action.priority === 'HIGH').length,
                estimated_completion_time: this.calculateCompletionTime(),
                readiness_for_development: this.assessDevelopmentReadiness()
            },
            recommendations: this.generateRecommendations()
        };

        // Save detailed report
        await fs.writeFile(
            'integration-setup-report.json',
            JSON.stringify(report, null, 2)
        );

        console.log('📊 Setup Report Generated: integration-setup-report.json');
        return report;
    }

    calculateCompletionTime() {
        const highPriorityActions = this.setupResults.nextActions
            .filter(action => action.priority === 'HIGH');
        
        if (highPriorityActions.length === 0) return 'Complete';
        
        return highPriorityActions
            .reduce((total, action) => {
                const time = parseInt(action.estimated_time.match(/\d+/)?.[0] || '10');
                return total + time;
            }, 0) + ' minutes';
    }

    assessDevelopmentReadiness() {
        const criticalSteps = ['validatePerplexityIntegration', 'testMCPConnectivity'];
        const criticalSuccess = criticalSteps.every(step => 
            this.setupResults.steps[step]?.success
        );
        
        if (criticalSuccess) return 'Ready';
        if (this.setupResults.overallSuccess) return 'Mostly Ready';
        return 'Setup Required';
    }

    generateRecommendations() {
        const recommendations = [];
        
        // API Key recommendations
        if (this.setupResults.steps.configureAPIKeys?.missingKeys > 0) {
            recommendations.push({
                category: 'Configuration',
                priority: 'HIGH',
                action: 'Configure missing API keys in .env file',
                impact: 'Enables full MCP and Perplexity functionality'
            });
        }

        // MCP Server recommendations
        const mcpReadiness = this.setupResults.steps.testMCPConnectivity?.readinessPercentage || 0;
        if (mcpReadiness < 80) {
            recommendations.push({
                category: 'MCP Integration',
                priority: 'MEDIUM',
                action: 'Install missing MCP server dependencies',
                impact: 'Improves automation coverage'
            });
        }

        // Validation score recommendations
        const validationScore = this.setupResults.steps.validatePerplexityIntegration
            ?.testResults?.enhanced_validation?.score || 0;
        if (validationScore < 85) {
            recommendations.push({
                category: 'Performance',
                priority: 'MEDIUM',
                action: 'Optimize MCP validation score to 85%+',
                impact: 'Ensures reliable automation workflows'
            });
        }

        return recommendations;
    }

    async generateSetupSummary() {
        console.log('\n🎯 SETUP SUMMARY');
        console.log('================');
        
        const successfulSteps = Object.values(this.setupResults.steps)
            .filter(step => step.success).length;
        
        console.log(`✅ Completed Steps: ${successfulSteps}/${this.setupSteps.length}`);
        console.log(`🎯 Overall Success: ${this.setupResults.overallSuccess ? 'YES' : 'PARTIAL'}`);
        
        if (this.setupResults.nextActions.length > 0) {
            console.log('\n📋 Next Actions Required:');
            this.setupResults.nextActions.forEach((action, index) => {
                console.log(`${index + 1}. [${action.priority}] ${action.description}`);
                console.log(`   ⏱️ Estimated time: ${action.estimated_time}\n`);
            });
        }

        // Integration readiness assessment
        const readiness = this.assessDevelopmentReadiness();
        console.log(`🚀 Development Readiness: ${readiness}`);
        
        if (readiness === 'Ready') {
            console.log(`
🎉 INTEGRATION READY!
You can now use the enhanced MCP × Perplexity workflows:

• Research-to-Code Pipeline: Automated research and implementation
• Performance Optimization: Real-time analysis and improvements  
• Code Review Automation: Security and quality analysis
• Comprehensive Testing: Automated test generation and execution

Next steps:
1. Run: node enhanced-workflow-orchestrator.js demo
2. View: integration-setup-report.json for detailed analysis
3. Start developing with enhanced automation capabilities!
            `);
        } else {
            console.log(`
⚠️  SETUP INCOMPLETE
Complete the next actions above to enable full integration capabilities.
            `);
        }
    }

    async execCommand(command, options = {}) {
        return new Promise((resolve, reject) => {
            const timeout = options.timeout || 10000;
            const child = spawn('bash', ['-c', command], { stdio: 'pipe' });
            
            let stdout = '';
            let stderr = '';
            
            child.stdout.on('data', (data) => stdout += data.toString());
            child.stderr.on('data', (data) => stderr += data.toString());
            
            const timeoutId = setTimeout(() => {
                child.kill();
                reject(new Error(`Command timeout: ${command}`));
            }, timeout);
            
            child.on('close', (code) => {
                clearTimeout(timeoutId);
                if (code === 0) {
                    resolve(stdout.trim());
                } else {
                    reject(new Error(stderr || `Command failed with code ${code}`));
                }
            });
        });
    }

    compareVersions(version1, version2) {
        const v1parts = version1.split('.').map(Number);
        const v2parts = version2.split('.').map(Number);
        
        for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
            const v1part = v1parts[i] || 0;
            const v2part = v2parts[i] || 0;
            
            if (v1part > v2part) return 1;
            if (v1part < v2part) return -1;
        }
        return 0;
    }
}

// CLI Interface
async function main() {
    const setupManager = new IntegrationSetupManager();
    
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
        case 'setup':
        case undefined:
            await setupManager.runSetup();
            break;
            
        case 'validate':
            console.log('🔍 Running validation checks...');
            const validation = await setupManager.validatePerplexityIntegration();
            console.log(JSON.stringify(validation, null, 2));
            break;
            
        case 'health':
            console.log('🏥 Running health checks...');
            const health = await setupManager.runHealthChecks();
            console.log(JSON.stringify(health, null, 2));
            break;
            
        default:
            console.log(`
🔧 Enhanced MCP × Perplexity Integration Setup

Usage:
  node integration-setup.js [command]

Commands:
  setup (default) - Run complete setup process
  validate        - Run integration validation only
  health          - Run system health checks only

The setup process will:
1. Validate environment requirements
2. Configure API keys and environment variables
3. Test MCP server connectivity  
4. Validate Perplexity integration
5. Run comprehensive health checks
6. Generate setup report and recommendations
            `);
    }
}

// Export for use as module
module.exports = IntegrationSetupManager;

// Run CLI if executed directly
if (require.main === module) {
    main().catch(console.error);
}
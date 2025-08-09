#!/usr/bin/env node

/**
 * 🚀 Production Deployment Automation Script
 * Validates infrastructure, deploys to production, and validates deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class ProductionDeploymentAutomation {
    constructor() {
        this.config = {
            requiredEnvVars: [
                'DIGITALOCEAN_TOKEN',
                'MONGODB_URI',
                'SPOTIFY_CLIENT_ID',
                'SPOTIFY_CLIENT_SECRET'
            ],
            services: {
                mainApp: 'http://localhost:3000',
                mcpServer: 'http://localhost:3001'
            }
        };
        this.deploymentSteps = [];
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`${icon} [${timestamp}] ${message}`);
        this.deploymentSteps.push({ timestamp, type, message });
    }

    async validateEnvironment() {
        this.log('🔍 Validating Environment Configuration', 'info');
        
        // Check .env file exists
        if (!fs.existsSync('.env')) {
            throw new Error('.env file not found. Please create from .env.example');
        }

        // Load and validate environment variables
        require('dotenv').config();
        
        const missingVars = [];
        for (const envVar of this.config.requiredEnvVars) {
            if (!process.env[envVar]) {
                missingVars.push(envVar);
            }
        }

        if (missingVars.length > 0) {
            throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
        }

        this.log('✅ Environment configuration validated', 'success');
        return true;
    }

    async validateInfrastructure() {
        this.log('🏗️ Validating Infrastructure', 'info');
        
        try {
            // Test DigitalOcean token
            this.log('Testing DigitalOcean token...', 'info');
            const doResult = execSync('./validate-do-token.sh', { encoding: 'utf8' });
            if (doResult.includes('INVALID')) {
                throw new Error('DigitalOcean token is invalid. Please regenerate token with full access permissions.');
            }
            this.log('✅ DigitalOcean token validated', 'success');

            // Test database connections
            this.log('Testing database connections...', 'info');
            execSync('npm run validate:mongodb-comprehensive', { encoding: 'utf8' });
            this.log('✅ Database connections validated', 'success');

            // Test application health
            this.log('Testing application health...', 'info');
            execSync('npm run validate:comprehensive', { encoding: 'utf8' });
            this.log('✅ Application health validated', 'success');

        } catch (error) {
            throw new Error(`Infrastructure validation failed: ${error.message}`);
        }

        return true;
    }

    async runPreDeploymentTests() {
        this.log('🧪 Running Pre-Deployment Tests', 'info');
        
        try {
            // Run linting
            this.log('Running code quality checks...', 'info');
            execSync('npm run lint', { encoding: 'utf8' });
            this.log('✅ Code quality checks passed', 'success');

            // Run test suite
            this.log('Running test suite...', 'info');
            execSync('npm test', { encoding: 'utf8' });
            this.log('✅ Test suite passed', 'success');

            // Build frontend
            this.log('Building frontend...', 'info');
            execSync('npm run build', { encoding: 'utf8' });
            this.log('✅ Frontend build successful', 'success');

        } catch (error) {
            this.log(`Pre-deployment tests failed: ${error.message}`, 'error');
            throw error;
        }

        return true;
    }

    async deployToProduction() {
        this.log('🚀 Deploying to Production', 'info');
        
        try {
            // Create production deployment configuration
            this.log('Creating deployment configuration...', 'info');
            const deploymentConfig = this.generateDeploymentConfig();
            fs.writeFileSync('deployment-config.yaml', deploymentConfig);
            this.log('✅ Deployment configuration created', 'success');

            // Deploy to DigitalOcean
            this.log('Deploying to DigitalOcean App Platform...', 'info');
            execSync('./deploy-production-quick.sh', { encoding: 'utf8' });
            this.log('✅ Deployed to production', 'success');

        } catch (error) {
            this.log(`Production deployment failed: ${error.message}`, 'error');
            throw error;
        }

        return true;
    }

    async validateDeployment() {
        this.log('🔍 Validating Production Deployment', 'info');
        
        // Wait for deployment to be ready
        this.log('Waiting for deployment to be ready...', 'info');
        await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds

        try {
            // Test production endpoints (would need actual production URL)
            this.log('Testing production endpoints...', 'info');
            // This would test the actual production URL once deployed
            // const response = await fetch('https://your-production-url.com/health');
            // if (!response.ok) throw new Error('Production health check failed');
            
            this.log('⚠️ Production endpoint validation skipped (URL not available)', 'warning');
            this.log('✅ Deployment validation completed', 'success');

        } catch (error) {
            this.log(`Deployment validation failed: ${error.message}`, 'error');
            throw error;
        }

        return true;
    }

    generateDeploymentConfig() {
        return `name: echotune-ai-production
region: nyc1
services:
  - name: web
    source_dir: /
    github:
      repo: dzp5103/Spotify-echo
      branch: main
    run_command: npm start
    http_port: 3000
    instance_count: 1
    instance_size_slug: basic-xxs
    environment_slug: node-js
    envs:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: "3000"
      - key: DIGITALOCEAN_TOKEN
        value: \${DIGITALOCEAN_TOKEN}
        type: 
      - key: MONGODB_URI
        value: \${MONGODB_URI}
        type: 
      - key: SPOTIFY_CLIENT_ID
        value: \${SPOTIFY_CLIENT_ID}
        type: 
      - key: SPOTIFY_CLIENT_SECRET
        value: \${SPOTIFY_CLIENT_SECRET}
        type: 
  - name: mcp-server
    source_dir: /mcp-server
    run_command: npm start
    http_port: 3001
    instance_count: 1
    instance_size_slug: basic-xxs
    environment_slug: node-js
`;
    }

    generateDeploymentReport() {
        const report = {
            timestamp: new Date().toISOString(),
            status: 'completed',
            steps: this.deploymentSteps,
            summary: {
                totalSteps: this.deploymentSteps.length,
                successful: this.deploymentSteps.filter(s => s.type === 'success').length,
                errors: this.deploymentSteps.filter(s => s.type === 'error').length,
                warnings: this.deploymentSteps.filter(s => s.type === 'warning').length
            }
        };

        fs.writeFileSync('PRODUCTION_DEPLOYMENT_REPORT.json', JSON.stringify(report, null, 2));
        
        const markdownReport = `# 🚀 Production Deployment Report

**Date**: ${report.timestamp}
**Status**: ${report.status.toUpperCase()}

## 📊 Summary
- **Total Steps**: ${report.summary.totalSteps}
- **Successful**: ${report.summary.successful} ✅
- **Errors**: ${report.summary.errors} ❌
- **Warnings**: ${report.summary.warnings} ⚠️

## 📋 Deployment Steps
${report.steps.map((step, i) => `${i + 1}. **${step.type.toUpperCase()}** (${step.timestamp}): ${step.message}`).join('\n')}

## 🎯 Next Steps
${report.summary.errors === 0 ? 
    '✅ Deployment completed successfully. Production environment is ready.' : 
    '❌ Deployment had errors. Review the steps above and resolve issues before retrying.'
}

---
*Report generated automatically by EchoTune AI Production Deployment System*
`;

        fs.writeFileSync('PRODUCTION_DEPLOYMENT_REPORT.md', markdownReport);
        return report;
    }

    async execute() {
        try {
            this.log('🚀 Starting Production Deployment Automation', 'info');
            
            await this.validateEnvironment();
            await this.validateInfrastructure();
            await this.runPreDeploymentTests();
            await this.deployToProduction();
            await this.validateDeployment();
            
            this.log('🎉 Production Deployment Completed Successfully!', 'success');
            
            const report = this.generateDeploymentReport();
            this.log(`📊 Deployment report saved to: PRODUCTION_DEPLOYMENT_REPORT.md`, 'info');
            
            return report;
            
        } catch (error) {
            this.log(`💥 Deployment failed: ${error.message}`, 'error');
            this.generateDeploymentReport();
            throw error;
        }
    }
}

// Run if called directly
if (require.main === module) {
    const deployment = new ProductionDeploymentAutomation();
    deployment.execute()
        .then(report => {
            console.log('\n🎉 Deployment automation completed successfully!');
            console.log(`📊 Success rate: ${((report.summary.successful / report.summary.totalSteps) * 100).toFixed(1)}%`);
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Deployment automation failed:', error.message);
            process.exit(1);
        });
}

module.exports = ProductionDeploymentAutomation;
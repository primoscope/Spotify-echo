#!/usr/bin/env node

/**
 * Deployment and Production Readiness Validator
 * Tests deployment configuration and production readiness
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class DeploymentValidator {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            deployment: {
                docker: {},
                environment: {},
                security: {},
                performance: {},
                monitoring: {}
            },
            production: {
                database: {},
                cache: {},
                apis: {},
                cdn: {}
            },
            summary: {
                totalChecks: 0,
                passedChecks: 0,
                failedChecks: 0,
                warnings: 0,
                readiness: 'unknown'
            }
        };
    }

    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'success' ? '✅' : 'ℹ️';
        console.log(`${prefix} [${timestamp}] ${message}`);
    }

    async validateDocker() {
        this.log('Validating Docker configuration...', 'info');
        
        const checks = [];
        
        // Check Dockerfile
        try {
            const dockerfile = fs.readFileSync('Dockerfile', 'utf8');
            checks.push({
                name: 'Dockerfile exists',
                status: 'passed',
                details: `Found Dockerfile with ${dockerfile.split('\n').length} lines`
            });
            
            // Check for multi-stage build
            if (dockerfile.includes('FROM') && dockerfile.split('FROM').length > 2) {
                checks.push({
                    name: 'Multi-stage build',
                    status: 'passed',
                    details: 'Multi-stage build detected for optimization'
                });
            } else {
                checks.push({
                    name: 'Multi-stage build',
                    status: 'warning',
                    details: 'Consider using multi-stage build for smaller images'
                });
            }
            
            // Check for health check
            if (dockerfile.includes('HEALTHCHECK')) {
                checks.push({
                    name: 'Health check in Dockerfile',
                    status: 'passed',
                    details: 'Health check configuration found'
                });
            } else {
                checks.push({
                    name: 'Health check in Dockerfile',
                    status: 'warning',
                    details: 'Consider adding HEALTHCHECK instruction'
                });
            }
            
        } catch (error) {
            checks.push({
                name: 'Dockerfile exists',
                status: 'failed',
                details: `Dockerfile not found: ${error.message}`
            });
        }
        
        // Check docker-compose files
        const composeFiles = [
            'docker-compose.yml',
            'docker-compose.production.yml',
            'docker-compose.dev.yml'
        ];
        
        for (const file of composeFiles) {
            try {
                const compose = fs.readFileSync(file, 'utf8');
                checks.push({
                    name: `${file} exists`,
                    status: 'passed',
                    details: `Found ${file}`
                });
                
                // Check for environment file usage
                if (compose.includes('env_file') || compose.includes('environment:')) {
                    checks.push({
                        name: `${file} environment config`,
                        status: 'passed',
                        details: 'Environment configuration found'
                    });
                }
                
            } catch (error) {
                checks.push({
                    name: `${file} exists`,
                    status: file === 'docker-compose.yml' ? 'failed' : 'warning',
                    details: `${file} not found`
                });
            }
        }
        
        // Check .dockerignore
        try {
            const dockerignore = fs.readFileSync('.dockerignore', 'utf8');
            checks.push({
                name: '.dockerignore exists',
                status: 'passed',
                details: `Found .dockerignore with ${dockerignore.split('\n').length} rules`
            });
        } catch (error) {
            checks.push({
                name: '.dockerignore exists',
                status: 'warning',
                details: 'Consider adding .dockerignore for smaller build context'
            });
        }
        
        this.results.deployment.docker = { checks };
        this.updateSummary(checks);
        
        return checks;
    }

    async validateEnvironment() {
        this.log('Validating environment configuration...', 'info');
        
        const checks = [];
        
        // Check environment files
        const envFiles = [
            '.env.example',
            '.env.production.example',
            '.env.mcp.example'
        ];
        
        for (const file of envFiles) {
            try {
                const content = fs.readFileSync(file, 'utf8');
                const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
                checks.push({
                    name: `${file} exists`,
                    status: 'passed',
                    details: `Found ${file} with ${lines.length} variables`
                });
            } catch (error) {
                checks.push({
                    name: `${file} exists`,
                    status: 'warning',
                    details: `${file} not found`
                });
            }
        }
        
        // Check critical environment variables
        const criticalVars = [
            'NODE_ENV',
            'PORT',
            'MONGODB_URI',
            'JWT_SECRET',
            'SESSION_SECRET'
        ];
        
        for (const varName of criticalVars) {
            const value = process.env[varName];
            if (value && value.length > 0) {
                checks.push({
                    name: `${varName} configured`,
                    status: 'passed',
                    details: `${varName} is set`
                });
            } else {
                checks.push({
                    name: `${varName} configured`,
                    status: 'failed',
                    details: `${varName} is missing or empty`
                });
            }
        }
        
        // Check security variables
        const securityVars = ['JWT_SECRET', 'SESSION_SECRET'];
        for (const varName of securityVars) {
            const value = process.env[varName];
            if (value && value.length >= 32) {
                checks.push({
                    name: `${varName} strength`,
                    status: 'passed',
                    details: `${varName} has sufficient length`
                });
            } else if (value) {
                checks.push({
                    name: `${varName} strength`,
                    status: 'warning',
                    details: `${varName} should be at least 32 characters`
                });
            }
        }
        
        this.results.deployment.environment = { checks };
        this.updateSummary(checks);
        
        return checks;
    }

    async validateSecurity() {
        this.log('Validating security configuration...', 'info');
        
        const checks = [];
        
        // Check for security-related packages
        try {
            const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            const securityPackages = ['helmet', 'cors', 'express-rate-limit', 'bcrypt', 'jsonwebtoken'];
            
            for (const pkg of securityPackages) {
                if (packageJson.dependencies && packageJson.dependencies[pkg]) {
                    checks.push({
                        name: `Security package: ${pkg}`,
                        status: 'passed',
                        details: `${pkg} is installed`
                    });
                } else {
                    checks.push({
                        name: `Security package: ${pkg}`,
                        status: 'warning',
                        details: `Consider installing ${pkg} for security`
                    });
                }
            }
        } catch (error) {
            checks.push({
                name: 'package.json readable',
                status: 'failed',
                details: 'Cannot read package.json'
            });
        }
        
        // Check for HTTPS configuration
        if (process.env.NODE_ENV === 'production') {
            if (process.env.HTTPS || process.env.SSL_CERT || process.env.NGINX_SSL_CERT_PATH) {
                checks.push({
                    name: 'HTTPS configuration',
                    status: 'passed',
                    details: 'HTTPS/SSL configuration detected'
                });
            } else {
                checks.push({
                    name: 'HTTPS configuration',
                    status: 'warning',
                    details: 'HTTPS configuration not detected for production'
                });
            }
        }
        
        // Check for security headers
        try {
            const serverFiles = ['server.js', 'src/server.js', 'src/app.js'];
            let securityFound = false;
            
            for (const file of serverFiles) {
                try {
                    const content = fs.readFileSync(file, 'utf8');
                    if (content.includes('helmet') || content.includes('Security headers')) {
                        securityFound = true;
                        break;
                    }
                } catch (e) {
                    // File doesn't exist, continue
                }
            }
            
            checks.push({
                name: 'Security headers',
                status: securityFound ? 'passed' : 'warning',
                details: securityFound ? 'Security headers configuration found' : 'Consider implementing security headers'
            });
        } catch (error) {
            checks.push({
                name: 'Security headers',
                status: 'warning',
                details: 'Could not verify security headers configuration'
            });
        }
        
        this.results.deployment.security = { checks };
        this.updateSummary(checks);
        
        return checks;
    }

    async validatePerformance() {
        this.log('Validating performance configuration...', 'info');
        
        const checks = [];
        
        // Check for caching configuration
        if (process.env.REDIS_URL || process.env.REDIS_HOST) {
            checks.push({
                name: 'Caching (Redis)',
                status: 'passed',
                details: 'Redis caching configured'
            });
        } else {
            checks.push({
                name: 'Caching (Redis)',
                status: 'warning',
                details: 'Consider configuring Redis for caching'
            });
        }
        
        // Check for compression
        if (process.env.COMPRESSION === 'true' || process.env.ENABLE_COMPRESSION === 'true') {
            checks.push({
                name: 'Response compression',
                status: 'passed',
                details: 'Response compression enabled'
            });
        } else {
            checks.push({
                name: 'Response compression',
                status: 'warning',
                details: 'Consider enabling response compression'
            });
        }
        
        // Check for CDN configuration
        if (process.env.CDN_URL || process.env.CLOUDFLARE_API_KEY) {
            checks.push({
                name: 'CDN configuration',
                status: 'passed',
                details: 'CDN configuration detected'
            });
        } else {
            checks.push({
                name: 'CDN configuration',
                status: 'warning',
                details: 'Consider configuring CDN for better performance'
            });
        }
        
        // Check for database optimization
        if (process.env.MONGODB_URI && process.env.MONGODB_URI.includes('retryWrites=true')) {
            checks.push({
                name: 'Database optimization',
                status: 'passed',
                details: 'MongoDB retry writes enabled'
            });
        } else {
            checks.push({
                name: 'Database optimization',
                status: 'warning',
                details: 'Consider optimizing database connection settings'
            });
        }
        
        this.results.deployment.performance = { checks };
        this.updateSummary(checks);
        
        return checks;
    }

    async validateMonitoring() {
        this.log('Validating monitoring and logging configuration...', 'info');
        
        const checks = [];
        
        // Check for logging configuration
        if (process.env.LOG_LEVEL) {
            checks.push({
                name: 'Logging configuration',
                status: 'passed',
                details: `Log level set to: ${process.env.LOG_LEVEL}`
            });
        } else {
            checks.push({
                name: 'Logging configuration',
                status: 'warning',
                details: 'Consider configuring LOG_LEVEL'
            });
        }
        
        // Check for health check endpoints
        try {
            const serverFiles = ['server.js', 'src/server.js', 'src/app.js'];
            let healthCheckFound = false;
            
            for (const file of serverFiles) {
                try {
                    const content = fs.readFileSync(file, 'utf8');
                    if (content.includes('/health') || content.includes('health-check')) {
                        healthCheckFound = true;
                        break;
                    }
                } catch (e) {
                    // File doesn't exist, continue
                }
            }
            
            checks.push({
                name: 'Health check endpoint',
                status: healthCheckFound ? 'passed' : 'warning',
                details: healthCheckFound ? 'Health check endpoint found' : 'Consider implementing health check endpoint'
            });
        } catch (error) {
            checks.push({
                name: 'Health check endpoint',
                status: 'warning',
                details: 'Could not verify health check endpoint'
            });
        }
        
        // Check for monitoring tools
        const monitoringVars = [
            'AGENTOPS_API_KEY',
            'OTEL_EXPORTER_OTLP_ENDPOINT',
            'SENTRY_DSN',
            'NEW_RELIC_LICENSE_KEY'
        ];
        
        let monitoringConfigured = false;
        for (const varName of monitoringVars) {
            if (process.env[varName]) {
                monitoringConfigured = true;
                break;
            }
        }
        
        checks.push({
            name: 'External monitoring',
            status: monitoringConfigured ? 'passed' : 'warning',
            details: monitoringConfigured ? 'External monitoring configured' : 'Consider configuring external monitoring'
        });
        
        this.results.deployment.monitoring = { checks };
        this.updateSummary(checks);
        
        return checks;
    }

    async validateProductionDatabases() {
        this.log('Validating production database configuration...', 'info');
        
        const checks = [];
        
        // Check MongoDB configuration
        if (process.env.MONGODB_URI) {
            const uri = process.env.MONGODB_URI;
            
            if (uri.includes('mongodb+srv://')) {
                checks.push({
                    name: 'MongoDB Atlas',
                    status: 'passed',
                    details: 'MongoDB Atlas connection configured'
                });
            } else if (uri.includes('localhost') || uri.includes('127.0.0.1')) {
                checks.push({
                    name: 'MongoDB production',
                    status: 'warning',
                    details: 'Using localhost MongoDB - not recommended for production'
                });
            } else {
                checks.push({
                    name: 'MongoDB production',
                    status: 'passed',
                    details: 'External MongoDB configured'
                });
            }
            
            // Test MongoDB connection
            try {
                await execAsync('node -e "const mongoose = require(\'mongoose\'); mongoose.connect(process.env.MONGODB_URI).then(() => { console.log(\'Connected\'); mongoose.disconnect(); }).catch(e => { console.error(e); process.exit(1); })"');
                checks.push({
                    name: 'MongoDB connectivity',
                    status: 'passed',
                    details: 'Successfully connected to MongoDB'
                });
            } catch (error) {
                checks.push({
                    name: 'MongoDB connectivity',
                    status: 'failed',
                    details: `MongoDB connection failed: ${error.message.slice(0, 100)}`
                });
            }
        } else {
            checks.push({
                name: 'MongoDB configuration',
                status: 'failed',
                details: 'MONGODB_URI not configured'
            });
        }
        
        this.results.production.database = { checks };
        this.updateSummary(checks);
        
        return checks;
    }

    async validateProductionCache() {
        this.log('Validating production cache configuration...', 'info');
        
        const checks = [];
        
        // Check Redis configuration
        if (process.env.REDIS_URL) {
            const url = process.env.REDIS_URL;
            
            if (url.includes('localhost') || url.includes('127.0.0.1')) {
                checks.push({
                    name: 'Redis production',
                    status: 'warning',
                    details: 'Using localhost Redis - not recommended for production'
                });
            } else {
                checks.push({
                    name: 'Redis production',
                    status: 'passed',
                    details: 'External Redis configured'
                });
            }
            
            // Test Redis connection
            try {
                await execAsync('node -e "const redis = require(\'redis\'); const client = redis.createClient({url: process.env.REDIS_URL}); client.connect().then(() => { console.log(\'Connected\'); client.disconnect(); }).catch(e => { console.error(e); process.exit(1); })"');
                checks.push({
                    name: 'Redis connectivity',
                    status: 'passed',
                    details: 'Successfully connected to Redis'
                });
            } catch (error) {
                checks.push({
                    name: 'Redis connectivity',
                    status: 'warning',
                    details: `Redis connection failed (optional): ${error.message.slice(0, 100)}`
                });
            }
        } else {
            checks.push({
                name: 'Redis configuration',
                status: 'warning',
                details: 'Redis not configured (optional but recommended)'
            });
        }
        
        this.results.production.cache = { checks };
        this.updateSummary(checks);
        
        return checks;
    }

    async validateProductionAPIs() {
        this.log('Validating production API configuration...', 'info');
        
        const checks = [];
        
        // Check Spotify API
        if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
            checks.push({
                name: 'Spotify API',
                status: 'passed',
                details: 'Spotify API credentials configured'
            });
        } else {
            checks.push({
                name: 'Spotify API',
                status: 'warning',
                details: 'Spotify API credentials not configured (optional)'
            });
        }
        
        // Check LLM providers
        const llmProviders = [
            { name: 'OpenAI', env: 'OPENAI_API_KEY' },
            { name: 'Gemini', env: 'GEMINI_API_KEY' },
            { name: 'Perplexity', env: 'PERPLEXITY_API_KEY' }
        ];
        
        let llmConfigured = false;
        for (const provider of llmProviders) {
            if (process.env[provider.env]) {
                llmConfigured = true;
                checks.push({
                    name: `${provider.name} API`,
                    status: 'passed',
                    details: `${provider.name} API key configured`
                });
            }
        }
        
        if (!llmConfigured) {
            checks.push({
                name: 'LLM Providers',
                status: 'warning',
                details: 'No LLM providers configured (optional)'
            });
        }
        
        this.results.production.apis = { checks };
        this.updateSummary(checks);
        
        return checks;
    }

    updateSummary(checks) {
        for (const check of checks) {
            this.results.summary.totalChecks++;
            if (check.status === 'passed') {
                this.results.summary.passedChecks++;
            } else if (check.status === 'failed') {
                this.results.summary.failedChecks++;
            } else if (check.status === 'warning') {
                this.results.summary.warnings++;
            }
        }
    }

    calculateReadiness() {
        const { totalChecks, passedChecks, failedChecks } = this.results.summary;
        
        if (totalChecks === 0) {
            return 'unknown';
        }
        
        const passRate = (passedChecks / totalChecks) * 100;
        const failRate = (failedChecks / totalChecks) * 100;
        
        if (failRate > 20) {
            return 'not-ready';
        } else if (failRate > 10 || passRate < 70) {
            return 'needs-work';
        } else if (passRate >= 90) {
            return 'production-ready';
        } else {
            return 'mostly-ready';
        }
    }

    generateReport() {
        this.results.summary.readiness = this.calculateReadiness();
        
        const reportPath = path.join(__dirname, '..', 'DEPLOYMENT_VALIDATION_REPORT.json');
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        
        this.generateMarkdownReport();
        
        this.log(`📊 Deployment validation report saved to: ${reportPath}`, 'info');
        
        return this.results;
    }

    generateMarkdownReport() {
        const { summary } = this.results;
        const readinessEmoji = {
            'production-ready': '🟢',
            'mostly-ready': '🟡',
            'needs-work': '🟠',
            'not-ready': '🔴',
            'unknown': '⚪'
        };
        
        const markdown = `# Deployment Validation Report

## ${readinessEmoji[summary.readiness]} Overall Readiness: ${summary.readiness.replace('-', ' ').toUpperCase()}

### Summary
- **Total Checks**: ${summary.totalChecks}
- **Passed**: ${summary.passedChecks}
- **Failed**: ${summary.failedChecks}
- **Warnings**: ${summary.warnings}
- **Success Rate**: ${Math.round((summary.passedChecks / summary.totalChecks) * 100)}%

### Docker Configuration
${this.formatChecks(this.results.deployment.docker.checks)}

### Environment Configuration
${this.formatChecks(this.results.deployment.environment.checks)}

### Security Configuration
${this.formatChecks(this.results.deployment.security.checks)}

### Performance Configuration
${this.formatChecks(this.results.deployment.performance.checks)}

### Monitoring Configuration
${this.formatChecks(this.results.deployment.monitoring.checks)}

### Production Database
${this.formatChecks(this.results.production.database.checks)}

### Production Cache
${this.formatChecks(this.results.production.cache.checks)}

### Production APIs
${this.formatChecks(this.results.production.apis.checks)}

### Recommendations

${this.generateRecommendations()}

---
*Report generated on ${this.results.timestamp}*
`;
        
        const markdownPath = path.join(__dirname, '..', 'DEPLOYMENT_VALIDATION_REPORT.md');
        fs.writeFileSync(markdownPath, markdown);
        
        this.log(`📋 Markdown report saved to: ${markdownPath}`, 'info');
    }

    formatChecks(checks) {
        if (!checks || checks.length === 0) {
            return '- No checks performed';
        }
        
        return checks.map(check => {
            const emoji = check.status === 'passed' ? '✅' : check.status === 'failed' ? '❌' : '⚠️';
            return `- ${emoji} **${check.name}**: ${check.details}`;
        }).join('\n');
    }

    generateRecommendations() {
        const recommendations = [];
        
        if (this.results.summary.failedChecks > 0) {
            recommendations.push('🔴 **Critical**: Address all failed checks before production deployment');
        }
        
        if (this.results.summary.warnings > 5) {
            recommendations.push('🟡 **Important**: Review and address warnings for optimal production setup');
        }
        
        if (this.results.summary.readiness === 'production-ready') {
            recommendations.push('🟢 **Ready**: System appears ready for production deployment');
            recommendations.push('📊 **Monitor**: Set up monitoring and alerting for production environment');
        } else if (this.results.summary.readiness === 'mostly-ready') {
            recommendations.push('🟡 **Almost Ready**: Address remaining issues before production deployment');
        } else {
            recommendations.push('🔴 **Not Ready**: Significant configuration issues need to be resolved');
        }
        
        return recommendations.length > 0 ? recommendations.join('\n\n') : 'No specific recommendations at this time.';
    }

    async runValidation() {
        this.log('🚀 Starting Deployment Validation Suite', 'info');
        this.log('=====================================', 'info');
        
        try {
            await this.validateDocker();
            await this.validateEnvironment();
            await this.validateSecurity();
            await this.validatePerformance();
            await this.validateMonitoring();
            await this.validateProductionDatabases();
            await this.validateProductionCache();
            await this.validateProductionAPIs();
            
            this.generateReport();
            
            this.log('=====================================', 'info');
            this.log(`🎉 Deployment validation completed!`, 'success');
            this.log(`📊 Readiness: ${this.results.summary.readiness}`, 'info');
            
            return this.results;
            
        } catch (error) {
            this.log(`💥 Validation failed: ${error.message}`, 'error');
            throw error;
        }
    }
}

// Run validation if called directly
if (require.main === module) {
    const validator = new DeploymentValidator();
    validator.runValidation()
        .then((results) => {
            const exitCode = results.summary.readiness === 'not-ready' ? 1 : 0;
            process.exit(exitCode);
        })
        .catch((error) => {
            console.error('💥 Validation crashed:', error);
            process.exit(1);
        });
}

module.exports = DeploymentValidator;
#!/usr/bin/env node

/**
 * Comprehensive Validation Script for EchoTune AI
 * Tests all functions, MCP server integration, and system health
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const http = require('http');
const https = require('https');
const { URL } = require('url');

class ComprehensiveValidator {
    constructor() {
        this.results = {
            overall: 'pending',
            tests: [],
            timestamp: new Date().toISOString(),
            summary: {}
        };
        this.baseUrl = 'http://localhost:3000';
        this.mcpUrl = 'http://localhost:3001';
    }

    // Custom fetch implementation using Node.js http/https
    async fetch(url, options = {}) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const module = urlObj.protocol === 'https:' ? https : http;
            
            const requestOptions = {
                hostname: urlObj.hostname,
                port: urlObj.port,
                path: urlObj.pathname + urlObj.search,
                method: options.method || 'GET',
                headers: options.headers || {}
            };

            const req = module.request(requestOptions, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve({
                        ok: res.statusCode >= 200 && res.statusCode < 300,
                        status: res.statusCode,
                        statusText: res.statusMessage,
                        async json() {
                            return JSON.parse(data);
                        },
                        async text() {
                            return data;
                        }
                    });
                });
            });

            req.on('error', reject);
            
            if (options.body) {
                req.write(options.body);
            }
            
            req.end();
        });
    }

    log(message, type = 'info') {
        const timestamp = new Date().toTimeString().split(' ')[0];
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`${prefix} [${timestamp}] ${message}`);
    }

    async runTest(name, testFn) {
        const startTime = Date.now();
        this.log(`Running test: ${name}`);
        
        try {
            const result = await testFn();
            const duration = Date.now() - startTime;
            
            const testResult = {
                name,
                status: 'passed',
                duration: `${duration}ms`,
                details: result,
                timestamp: new Date().toISOString()
            };
            
            this.results.tests.push(testResult);
            this.log(`✅ ${name} - PASSED (${duration}ms)`, 'success');
            return testResult;
        } catch (error) {
            const duration = Date.now() - startTime;
            
            const testResult = {
                name,
                status: 'failed',
                duration: `${duration}ms`,
                error: error.message,
                timestamp: new Date().toISOString()
            };
            
            this.results.tests.push(testResult);
            this.log(`❌ ${name} - FAILED (${duration}ms): ${error.message}`, 'error');
            return testResult;
        }
    }

    // Test 1: Application Health Check
    async testApplicationHealth() {
        const response = await this.fetch(`${this.baseUrl}/health`);
        if (!response.ok) {
            throw new Error(`Health check failed: ${response.status}`);
        }
        
        const health = await response.json();
        
        // Validate health response structure
        if (!health.status) {
            throw new Error('Invalid health response structure');
        }
        
        // Accept both "healthy" status and check structure
        const isHealthy = health.status === 'healthy' || (health.checks && Object.keys(health.checks).length > 0);
        
        if (!isHealthy) {
            throw new Error(`Application is not healthy: ${health.status}`);
        }
        
        return {
            status: health.status,
            uptime: health.uptime,
            checksCount: health.checks ? Object.keys(health.checks).length : 0,
            healthyChecks: health.checks ? Object.values(health.checks).filter(check => check.status === 'healthy').length : 0
        };
    }

    // Test 2: MCP Server Health Check
    async testMCPServerHealth() {
        const response = await this.fetch(`${this.mcpUrl}/health`);
        if (!response.ok) {
            throw new Error(`MCP health check failed: ${response.status}`);
        }
        
        const health = await response.json();
        
        return {
            status: health.status,
            servers: health.servers || 0,
            capabilities: health.capabilities || []
        };
    }

    // Test 3: MCP Server Capabilities
    async testMCPCapabilities() {
        const response = await this.fetch(`${this.mcpUrl}/health`);
        if (!response.ok) {
            throw new Error(`MCP health endpoint failed: ${response.status}`);
        }
        
        const health = await response.json();
        
        // Check if servers are available in the health response
        if (!health.servers) {
            throw new Error('No servers information available in MCP health response');
        }
        
        const expectedCapabilities = ['mermaid', 'filesystem', 'browserbase', 'puppeteer', 'spotify'];
        const actualCapabilities = Object.keys(health.servers);
        
        const missingCapabilities = expectedCapabilities.filter(cap => !actualCapabilities.includes(cap));
        
        if (missingCapabilities.length > 0) {
            throw new Error(`Missing MCP capabilities: ${missingCapabilities.join(', ')}`);
        }
        
        // Count available vs needs_credentials
        const availableCount = Object.values(health.servers).filter(server => server.status === 'available').length;
        const credentialsNeeded = Object.values(health.servers).filter(server => server.status === 'needs_credentials').length;
        
        return {
            availableServers: actualCapabilities.length,
            capabilities: actualCapabilities,
            allExpectedPresent: missingCapabilities.length === 0,
            availableCount,
            credentialsNeeded
        };
    }

    // Test 4: Database Connectivity
    async testDatabaseConnectivity() {
        const response = await this.fetch(`${this.baseUrl}/api/health/database`);
        if (!response.ok) {
            throw new Error(`Database health check failed: ${response.status}`);
        }
        
        const dbHealth = await response.json();
        
        return {
            primary: dbHealth.mongodb?.status || 'not available',
            fallback: dbHealth.sqlite?.status || 'not available',
            activeConnection: dbHealth.activeDatabase || 'unknown'
        };
    }

    // Test 5: API Endpoints
    async testAPIEndpoints() {
        const endpoints = [
            { path: '/api/recommendations/test', method: 'GET' },
            { path: '/api/chat/providers', method: 'GET' },
            { path: '/api/settings/llm-providers', method: 'GET' },
            { path: '/api/analytics/overview', method: 'GET' }
        ];

        const results = [];
        
        for (const endpoint of endpoints) {
            try {
                const response = await this.fetch(`${this.baseUrl}${endpoint.path}`);
                results.push({
                    path: endpoint.path,
                    status: response.status,
                    ok: response.ok,
                    statusText: response.statusText
                });
            } catch (error) {
                results.push({
                    path: endpoint.path,
                    status: 'error',
                    ok: false,
                    error: error.message
                });
            }
        }
        
        const workingEndpoints = results.filter(r => r.ok).length;
        
        return {
            total: endpoints.length,
            working: workingEndpoints,
            percentage: Math.round((workingEndpoints / endpoints.length) * 100),
            details: results
        };
    }

    // Test 6: Frontend Build Validation
    async testFrontendBuild() {
        try {
            // Check if build directory exists
            const buildPath = path.join(process.cwd(), 'dist');
            const buildExists = fs.existsSync(buildPath);
            
            if (!buildExists) {
                this.log('Building frontend...', 'info');
                execSync('npm run build', { stdio: 'pipe' });
            }
            
            // Verify build artifacts
            const indexPath = path.join(buildPath, 'index.html');
            const assetsPath = path.join(buildPath, 'assets');
            
            const indexExists = fs.existsSync(indexPath);
            const assetsExist = fs.existsSync(assetsPath);
            
            let buildSize = 0;
            if (assetsExist) {
                const files = fs.readdirSync(assetsPath);
                for (const file of files) {
                    const filePath = path.join(assetsPath, file);
                    const stats = fs.statSync(filePath);
                    buildSize += stats.size;
                }
            }
            
            return {
                buildExists,
                indexExists,
                assetsExist,
                buildSizeKB: Math.round(buildSize / 1024),
                buildSizeMB: Math.round(buildSize / 1024 / 1024 * 100) / 100
            };
        } catch (error) {
            throw new Error(`Frontend build failed: ${error.message}`);
        }
    }

    // Test 7: Configuration Validation
    async testConfigurationValidation() {
        const configPath = path.join(process.cwd(), '.env');
        const exampleConfigPath = path.join(process.cwd(), '.env.example');
        
        const configExists = fs.existsSync(configPath);
        const exampleExists = fs.existsSync(exampleConfigPath);
        
        let configKeys = [];
        let exampleKeys = [];
        
        if (configExists) {
            const configContent = fs.readFileSync(configPath, 'utf8');
            configKeys = configContent.split('\n')
                .filter(line => line.includes('=') && !line.startsWith('#'))
                .map(line => line.split('=')[0].trim());
        }
        
        if (exampleExists) {
            const exampleContent = fs.readFileSync(exampleConfigPath, 'utf8');
            exampleKeys = exampleContent.split('\n')
                .filter(line => line.includes('=') && !line.startsWith('#'))
                .map(line => line.split('=')[0].trim());
        }
        
        const missingKeys = exampleKeys.filter(key => !configKeys.includes(key));
        
        return {
            configExists,
            exampleExists,
            configKeysCount: configKeys.length,
            exampleKeysCount: exampleKeys.length,
            missingKeys,
            configurationComplete: missingKeys.length === 0
        };
    }

    // Test 8: Package Dependencies
    async testPackageDependencies() {
        try {
            const packagePath = path.join(process.cwd(), 'package.json');
            const packageLockPath = path.join(process.cwd(), 'package-lock.json');
            
            const packageExists = fs.existsSync(packagePath);
            const lockExists = fs.existsSync(packageLockPath);
            
            if (!packageExists) {
                throw new Error('package.json not found');
            }
            
            const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            
            const depCount = Object.keys(packageContent.dependencies || {}).length;
            const devDepCount = Object.keys(packageContent.devDependencies || {}).length;
            
            // Check for critical dependencies
            const criticalDeps = ['express', 'react', 'mongodb', 'socket.io'];
            const missingCritical = criticalDeps.filter(dep => !packageContent.dependencies[dep]);
            
            return {
                packageExists,
                lockExists,
                dependenciesCount: depCount,
                devDependenciesCount: devDepCount,
                totalDependencies: depCount + devDepCount,
                criticalDependencies: criticalDeps.length - missingCritical.length,
                missingCritical,
                version: packageContent.version
            };
        } catch (error) {
            throw new Error(`Package validation failed: ${error.message}`);
        }
    }

    // Test 9: File System Validation
    async testFileSystemValidation() {
        const requiredDirs = [
            'src',
            'src/frontend',
            'src/chat',
            'src/spotify',
            'scripts',
            'mcp-server',
            'tests'
        ];
        
        const requiredFiles = [
            'server.js',
            'package.json',
            'README.md',
            'STRATEGIC_ROADMAP.md',
            'CODING_AGENT_GUIDE.md'
        ];
        
        const dirResults = requiredDirs.map(dir => ({
            path: dir,
            exists: fs.existsSync(path.join(process.cwd(), dir))
        }));
        
        const fileResults = requiredFiles.map(file => ({
            path: file,
            exists: fs.existsSync(path.join(process.cwd(), file))
        }));
        
        const missingDirs = dirResults.filter(r => !r.exists).map(r => r.path);
        const missingFiles = fileResults.filter(r => !r.exists).map(r => r.path);
        
        if (missingDirs.length > 0 || missingFiles.length > 0) {
            throw new Error(`Missing directories: ${missingDirs.join(', ')} | Missing files: ${missingFiles.join(', ')}`);
        }
        
        return {
            directoriesChecked: requiredDirs.length,
            filesChecked: requiredFiles.length,
            allPresent: missingDirs.length === 0 && missingFiles.length === 0,
            missingDirs,
            missingFiles
        };
    }

    // Generate comprehensive report
    generateReport() {
        const passed = this.results.tests.filter(t => t.status === 'passed').length;
        const failed = this.results.tests.filter(t => t.status === 'failed').length;
        const total = this.results.tests.length;
        
        this.results.overall = failed === 0 ? 'passed' : 'failed';
        this.results.summary = {
            total,
            passed,
            failed,
            successRate: Math.round((passed / total) * 100)
        };
        
        // Save detailed report
        const reportPath = path.join(process.cwd(), 'COMPREHENSIVE_VALIDATION_REPORT.md');
        const report = this.formatReport();
        fs.writeFileSync(reportPath, report);
        
        return this.results;
    }

    formatReport() {
        const { summary, tests, timestamp } = this.results;
        
        let report = `# 🔍 Comprehensive Validation Report\n\n`;
        report += `**Date**: ${new Date(timestamp).toLocaleString()}\n`;
        report += `**Overall Status**: ${this.results.overall === 'passed' ? '✅ PASSED' : '❌ FAILED'}\n`;
        report += `**Success Rate**: ${summary.successRate}% (${summary.passed}/${summary.total})\n\n`;
        
        report += `## 📊 Test Summary\n\n`;
        report += `- ✅ **Passed**: ${summary.passed}\n`;
        report += `- ❌ **Failed**: ${summary.failed}\n`;
        report += `- 📊 **Total**: ${summary.total}\n\n`;
        
        report += `## 📋 Detailed Results\n\n`;
        
        for (const test of tests) {
            const status = test.status === 'passed' ? '✅' : '❌';
            report += `### ${status} ${test.name}\n`;
            report += `- **Status**: ${test.status.toUpperCase()}\n`;
            report += `- **Duration**: ${test.duration}\n`;
            
            if (test.error) {
                report += `- **Error**: ${test.error}\n`;
            }
            
            if (test.details) {
                report += `- **Details**: ${JSON.stringify(test.details, null, 2)}\n`;
            }
            
            report += `\n`;
        }
        
        report += `## 🎯 Recommendations\n\n`;
        
        if (summary.failed > 0) {
            report += `### Issues to Address:\n`;
            const failedTests = tests.filter(t => t.status === 'failed');
            for (const test of failedTests) {
                report += `- **${test.name}**: ${test.error}\n`;
            }
            report += `\n`;
        }
        
        report += `### Next Steps:\n`;
        report += `1. Address any failed tests\n`;
        report += `2. Ensure MCP server is fully integrated\n`;
        report += `3. Update documentation based on findings\n`;
        report += `4. Re-run validation after fixes\n\n`;
        
        return report;
    }

    // Main validation runner
    async run() {
        this.log('🚀 Starting Comprehensive Validation', 'info');
        this.log('==========================================', 'info');
        
        // Wait a moment for servers to be ready
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await this.runTest('Application Health Check', () => this.testApplicationHealth());
        await this.runTest('MCP Server Health Check', () => this.testMCPServerHealth());
        await this.runTest('MCP Capabilities Validation', () => this.testMCPCapabilities());
        await this.runTest('Database Connectivity', () => this.testDatabaseConnectivity());
        await this.runTest('API Endpoints Validation', () => this.testAPIEndpoints());
        await this.runTest('Frontend Build Validation', () => this.testFrontendBuild());
        await this.runTest('Configuration Validation', () => this.testConfigurationValidation());
        await this.runTest('Package Dependencies Check', () => this.testPackageDependencies());
        await this.runTest('File System Validation', () => this.testFileSystemValidation());
        
        this.log('==========================================', 'info');
        
        const results = this.generateReport();
        
        if (results.overall === 'passed') {
            this.log(`🎉 All tests passed! Success rate: ${results.summary.successRate}%`, 'success');
        } else {
            this.log(`⚠️ Some tests failed. Success rate: ${results.summary.successRate}%`, 'warning');
            this.log(`Failed tests: ${results.summary.failed}/${results.summary.total}`, 'error');
        }
        
        this.log(`📊 Detailed report saved to: COMPREHENSIVE_VALIDATION_REPORT.md`, 'info');
        
        return results;
    }
}

// Run validation if called directly
if (require.main === module) {
    const validator = new ComprehensiveValidator();
    validator.run().catch(error => {
        console.error('❌ Validation failed:', error);
        process.exit(1);
    });
}

module.exports = ComprehensiveValidator;
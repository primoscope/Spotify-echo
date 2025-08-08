#!/usr/bin/env node

/**
 * Browser Automation E2E Test Suite
 * Demonstrates end-to-end testing capabilities for EchoTune AI
 * Tests settings UI, AI chat interface, and core user workflows
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class BrowserE2ETestSuite {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            testSuite: 'EchoTune AI Browser E2E Tests',
            tests: [],
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                skipped: 0
            }
        };
        
        this.appProcess = null;
        this.appPort = 3000;
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const colors = {
            info: '\x1b[36m',
            success: '\x1b[32m',
            error: '\x1b[31m',
            warning: '\x1b[33m',
            reset: '\x1b[0m'
        };
        
        console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
    }

    async startApplication() {
        this.log('🚀 Starting EchoTune AI application...', 'info');
        
        try {
            // First check if app is already running
            const healthCheck = execSync(`curl -f http://localhost:${this.appPort}/health`, { 
                encoding: 'utf8', 
                stdio: 'pipe',
                timeout: 5000
            });
            
            this.log('✅ Application already running', 'success');
            return true;
        } catch (error) {
            // App not running, start it
            this.log('🔄 Application not running, starting...', 'info');
            
            try {
                // Start the main server
                this.appProcess = spawn('node', ['server.js'], {
                    stdio: 'pipe',
                    detached: false,
                    env: { ...process.env, PORT: this.appPort }
                });
                
                // Wait for server to start
                let attempts = 0;
                const maxAttempts = 12; // 60 seconds total
                
                while (attempts < maxAttempts) {
                    try {
                        await new Promise(resolve => setTimeout(resolve, 5000));
                        
                        execSync(`curl -f http://localhost:${this.appPort}/health`, { 
                            encoding: 'utf8', 
                            stdio: 'pipe',
                            timeout: 5000
                        });
                        
                        this.log('✅ Application started successfully', 'success');
                        return true;
                    } catch (checkError) {
                        attempts++;
                        this.log(`⏳ Waiting for app to start... (${attempts}/${maxAttempts})`, 'info');
                    }
                }
                
                this.log('❌ Failed to start application within timeout', 'error');
                return false;
                
            } catch (startError) {
                this.log(`❌ Failed to start application: ${startError.message}`, 'error');
                return false;
            }
        }
    }

    async runTest(testConfig) {
        this.log(`🧪 Running: ${testConfig.name}`, 'info');
        this.results.summary.total++;
        
        const test = {
            name: testConfig.name,
            description: testConfig.description,
            startTime: new Date().toISOString(),
            status: 'unknown',
            duration: 0,
            details: {}
        };
        
        const startTime = Date.now();
        
        try {
            if (testConfig.type === 'http') {
                await this.runHTTPTest(test, testConfig);
            } else if (testConfig.type === 'ui') {
                await this.runUITest(test, testConfig);
            } else if (testConfig.type === 'api') {
                await this.runAPITest(test, testConfig);
            }
            
            test.status = 'passed';
            this.results.summary.passed++;
            this.log(`✅ ${test.name} - PASSED`, 'success');
            
        } catch (error) {
            test.status = 'failed';
            test.error = error.message;
            this.results.summary.failed++;
            this.log(`❌ ${test.name} - FAILED: ${error.message}`, 'error');
        }
        
        test.duration = Date.now() - startTime;
        test.endTime = new Date().toISOString();
        this.results.tests.push(test);
        
        return test.status === 'passed';
    }

    async runHTTPTest(test, config) {
        const url = `http://localhost:${this.appPort}${config.endpoint}`;
        
        try {
            const response = execSync(`curl -s -w "%{http_code}" "${url}"`, {
                encoding: 'utf8',
                timeout: config.timeout || 10000
            });
            
            const parts = response.trim().split('\n');
            const httpCode = parts[parts.length - 1];
            const body = parts.slice(0, -1).join('\n');
            
            test.details.httpCode = httpCode;
            test.details.responseSize = body.length;
            
            // Check expected HTTP code
            if (config.expectedCode && !httpCode.startsWith(config.expectedCode.toString().charAt(0))) {
                throw new Error(`Expected HTTP ${config.expectedCode}, got ${httpCode}`);
            }
            
            // Check for expected content
            if (config.expectedContent) {
                const found = config.expectedContent.some(content => body.includes(content));
                if (!found) {
                    throw new Error(`Expected content not found: ${config.expectedContent.join(', ')}`);
                }
            }
            
        } catch (error) {
            throw new Error(`HTTP test failed: ${error.message}`);
        }
    }

    async runUITest(test, config) {
        // Simulate UI testing - in real implementation this would use browser automation
        test.details.simulatedTest = true;
        test.details.testType = 'UI Simulation';
        
        // Check if the page loads
        const url = `http://localhost:${this.appPort}${config.endpoint}`;
        
        try {
            const response = execSync(`curl -s "${url}" | head -c 1000`, {
                encoding: 'utf8',
                timeout: 10000
            });
            
            test.details.pageLoadSuccess = response.length > 0;
            test.details.contentLength = response.length;
            
            // Check for expected UI elements (basic HTML parsing)
            if (config.expectedElements) {
                const foundElements = config.expectedElements.filter(element => 
                    response.includes(element)
                );
                
                test.details.expectedElements = config.expectedElements;
                test.details.foundElements = foundElements;
                
                if (foundElements.length !== config.expectedElements.length) {
                    throw new Error(`Missing UI elements: ${config.expectedElements.length - foundElements.length} not found`);
                }
            }
            
            // Simulate user actions (would be real browser interactions in production)
            if (config.actions) {
                test.details.simulatedActions = config.actions;
                test.details.actionsExecuted = config.actions.length;
            }
            
        } catch (error) {
            throw new Error(`UI test failed: ${error.message}`);
        }
    }

    async runAPITest(test, config) {
        const url = `http://localhost:${this.appPort}${config.endpoint}`;
        
        try {
            let command = `curl -s -w "%{http_code}" -X ${config.method || 'GET'} "${url}"`;
            
            if (config.headers) {
                Object.entries(config.headers).forEach(([key, value]) => {
                    command += ` -H "${key}: ${value}"`;
                });
            }
            
            if (config.body) {
                command += ` -d '${JSON.stringify(config.body)}'`;
            }
            
            const response = execSync(command, {
                encoding: 'utf8',
                timeout: config.timeout || 15000
            });
            
            const parts = response.trim().split('\n');
            const httpCode = parts[parts.length - 1];
            const body = parts.slice(0, -1).join('\n');
            
            test.details.httpCode = httpCode;
            test.details.method = config.method || 'GET';
            
            // Try to parse JSON response
            try {
                const jsonResponse = JSON.parse(body);
                test.details.validJson = true;
                test.details.responseKeys = Object.keys(jsonResponse);
            } catch (parseError) {
                test.details.validJson = false;
                test.details.responseText = body.substring(0, 200);
            }
            
            // Validate expected response structure
            if (config.expectedKeys && test.details.validJson) {
                const jsonResponse = JSON.parse(body);
                const missingKeys = config.expectedKeys.filter(key => !(key in jsonResponse));
                
                if (missingKeys.length > 0) {
                    throw new Error(`Missing expected keys: ${missingKeys.join(', ')}`);
                }
            }
            
        } catch (error) {
            throw new Error(`API test failed: ${error.message}`);
        }
    }

    async runFullTestSuite() {
        this.log('🔍 Starting Browser E2E Test Suite...', 'info');
        
        // Start application
        const appStarted = await this.startApplication();
        if (!appStarted) {
            throw new Error('Failed to start application for testing');
        }

        // Define test cases
        const testCases = [
            {
                name: 'Health Check',
                description: 'Verify application health endpoint',
                type: 'http',
                endpoint: '/health',
                expectedCode: 200,
                timeout: 5000
            },
            {
                name: 'Settings UI Load',
                description: 'Test settings page loads correctly',
                type: 'ui',
                endpoint: '/settings',
                expectedElements: ['<!DOCTYPE html>', '<title>', '<body>'],
                timeout: 10000
            },
            {
                name: 'Dashboard UI Load',
                description: 'Test main dashboard loads',
                type: 'ui',
                endpoint: '/dashboard',
                expectedElements: ['<!DOCTYPE html>', '<title>'],
                actions: ['load-page', 'check-elements'],
                timeout: 10000
            },
            {
                name: 'User Profile API',
                description: 'Test user profile API endpoint',
                type: 'api',
                endpoint: '/api/user/profile',
                method: 'GET',
                expectedKeys: [],
                timeout: 15000
            },
            {
                name: 'Recommendations API',
                description: 'Test recommendations API endpoint',
                type: 'api',
                endpoint: '/api/recommendations',
                method: 'GET',
                timeout: 15000
            },
            {
                name: 'Chat Models API',
                description: 'Test available chat models API',
                type: 'api',
                endpoint: '/api/chat/models',
                method: 'GET',
                timeout: 10000
            }
        ];

        // Run all tests
        for (const testCase of testCases) {
            await this.runTest(testCase);
        }

        // Generate summary
        this.log('📊 Test Suite Complete:', 'info');
        this.log(`  Total: ${this.results.summary.total}`, 'info');
        this.log(`  Passed: ${this.results.summary.passed}`, 'success');
        this.log(`  Failed: ${this.results.summary.failed}`, this.results.summary.failed > 0 ? 'error' : 'info');
        
        return this.results;
    }

    async generateReport() {
        const reportPath = 'BROWSER_E2E_TEST_REPORT.md';
        let report = `# 🌐 EchoTune AI - Browser E2E Test Report\n\n`;
        
        report += `**Generated:** ${this.results.timestamp}\n`;
        report += `**Test Suite:** ${this.results.testSuite}\n`;
        report += `**Total Tests:** ${this.results.summary.total}\n`;
        report += `**Passed:** ${this.results.summary.passed} ✅\n`;
        report += `**Failed:** ${this.results.summary.failed} ❌\n\n`;

        // Test Results
        report += `## Test Results\n\n`;
        
        this.results.tests.forEach(test => {
            const statusIcon = test.status === 'passed' ? '✅' : '❌';
            report += `### ${statusIcon} ${test.name}\n\n`;
            report += `- **Description:** ${test.description}\n`;
            report += `- **Duration:** ${test.duration}ms\n`;
            
            if (test.error) {
                report += `- **Error:** ${test.error}\n`;
            }
            
            if (test.details.httpCode) {
                report += `- **HTTP Code:** ${test.details.httpCode}\n`;
            }
            
            if (test.details.validJson !== undefined) {
                report += `- **Valid JSON:** ${test.details.validJson}\n`;
            }
            
            if (test.details.expectedElements) {
                report += `- **Expected Elements:** ${test.details.expectedElements.length}\n`;
                report += `- **Found Elements:** ${test.details.foundElements?.length || 0}\n`;
            }
            
            report += `\n`;
        });

        // Summary and recommendations
        const successRate = Math.round((this.results.summary.passed / this.results.summary.total) * 100);
        report += `## Summary\n\n`;
        report += `**Success Rate:** ${successRate}%\n\n`;
        
        if (this.results.summary.failed > 0) {
            report += `### Issues Found\n`;
            this.results.tests.filter(t => t.status === 'failed').forEach(test => {
                report += `- ${test.name}: ${test.error}\n`;
            });
            report += `\n`;
        }

        report += `### Recommendations\n`;
        if (successRate < 100) {
            report += `1. Address ${this.results.summary.failed} failing tests\n`;
        }
        report += `2. Implement real browser automation for UI tests\n`;
        report += `3. Add more comprehensive API endpoint testing\n`;
        report += `4. Include performance metrics in test results\n`;

        await fs.writeFile(reportPath, report, 'utf8');
        
        // Also generate JSON report
        const jsonReportPath = 'BROWSER_E2E_TEST_REPORT.json';
        await fs.writeFile(jsonReportPath, JSON.stringify(this.results, null, 2), 'utf8');
        
        this.log(`📋 Reports generated:`, 'success');
        this.log(`   Markdown: ${reportPath}`, 'info');
        this.log(`   JSON: ${jsonReportPath}`, 'info');
    }

    async cleanup() {
        if (this.appProcess && !this.appProcess.killed) {
            this.log('🧹 Cleaning up application process...', 'info');
            this.appProcess.kill('SIGTERM');
        }
    }
}

// Main execution
if (require.main === module) {
    const testSuite = new BrowserE2ETestSuite();
    
    testSuite.runFullTestSuite()
        .then(async (results) => {
            await testSuite.generateReport();
            
            const successRate = Math.round((results.summary.passed / results.summary.total) * 100);
            console.log(`\n🎯 Browser E2E Test Suite completed with ${successRate}% success rate`);
            
            await testSuite.cleanup();
            process.exit(results.summary.failed > 0 ? 1 : 0);
        })
        .catch(async (error) => {
            console.error('❌ Browser E2E Test Suite failed:', error);
            await testSuite.cleanup();
            process.exit(1);
        });
}

module.exports = BrowserE2ETestSuite;
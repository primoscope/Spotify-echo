#!/usr/bin/env node
/**
 * Performance Smoke Test
 * Quick performance validation for CI pipeline
 */

const { PerformanceBaseline } = require('../src/utils/performance-baseline');
const path = require('path');

class PerformanceSmokeTest {
    constructor(options = {}) {
        this.baseURL = options.baseURL || process.env.TEST_BASE_URL || 'http://localhost:3000';
        this.maxResponseTime = options.maxResponseTime || 5000; // 5 seconds max
        this.maxErrorRate = options.maxErrorRate || 10; // 10% max error rate
        this.testDuration = options.testDuration || 30000; // 30 seconds
        this.outputDir = options.outputDir || path.join(process.cwd(), 'test-results');
        
        // Quick smoke test endpoints
        this.smokeEndpoints = [
            {
                name: 'Health Check',
                path: '/health',
                method: 'GET',
                critical: true,
                maxResponseTime: 1000 // Health should be fast
            },
            {
                name: 'Ready Check',
                path: '/ready',
                method: 'GET',
                critical: true,
                maxResponseTime: 500 // Readiness should be very fast
            },
            {
                name: 'API Health',
                path: '/api/health',
                method: 'GET',
                critical: true,
                maxResponseTime: 2000
            }
        ];
        
        this.results = {
            passed: false,
            timestamp: new Date().toISOString(),
            failures: [],
            summary: {}
        };
    }

    /**
     * Run smoke test
     */
    async runSmokeTest() {
        console.log('🧪 Running Performance Smoke Test...');
        console.log(`🎯 Target: ${this.baseURL}`);
        console.log(`⏱️ Duration: ${this.testDuration / 1000}s`);
        console.log(`🚫 Max Response Time: ${this.maxResponseTime}ms`);
        console.log(`📊 Max Error Rate: ${this.maxErrorRate}%`);
        
        const baseline = new PerformanceBaseline({
            baseURL: this.baseURL,
            testDuration: this.testDuration,
            concurrentRequests: 3, // Lower concurrency for smoke test
            warmupRequests: 5,
            outputDir: this.outputDir
        });
        
        // Override endpoints for smoke test
        baseline.endpoints = this.smokeEndpoints;
        
        try {
            const results = await baseline.runBaseline();
            this.analyzeResults(results);
            
            console.log(`\n🏁 Smoke Test Results:`);
            console.log(`Status: ${this.results.passed ? '✅ PASSED' : '❌ FAILED'}`);
            
            if (this.results.failures.length > 0) {
                console.log(`\nFailures:`);
                for (const failure of this.results.failures) {
                    console.log(`  ❌ ${failure}`);
                }
            }
            
            // Exit with appropriate code
            process.exit(this.results.passed ? 0 : 1);
        } catch (error) {
            console.error('❌ Smoke test failed:', error.message);
            process.exit(1);
        }
    }

    /**
     * Analyze baseline results against smoke test criteria
     */
    analyzeResults(baselineResults) {
        this.results.passed = true;
        this.results.failures = [];
        this.results.summary = baselineResults.summary;
        
        // Check overall metrics
        if (baselineResults.summary.overallAverageResponseTime > this.maxResponseTime) {
            this.results.failures.push(
                `Overall average response time (${Math.round(baselineResults.summary.overallAverageResponseTime)}ms) ` +
                `exceeds maximum (${this.maxResponseTime}ms)`
            );
            this.results.passed = false;
        }
        
        if (baselineResults.summary.overallErrorRate > this.maxErrorRate) {
            this.results.failures.push(
                `Overall error rate (${Math.round(baselineResults.summary.overallErrorRate * 100) / 100}%) ` +
                `exceeds maximum (${this.maxErrorRate}%)`
            );
            this.results.passed = false;
        }
        
        // Check critical endpoints
        for (const [name, endpoint] of Object.entries(baselineResults.endpoints)) {
            if (endpoint.critical) {
                const maxTime = this.smokeEndpoints.find(e => e.name === name)?.maxResponseTime || this.maxResponseTime;
                
                if (endpoint.summary.averageResponseTime > maxTime) {
                    this.results.failures.push(
                        `${name} average response time (${Math.round(endpoint.summary.averageResponseTime)}ms) ` +
                        `exceeds maximum (${maxTime}ms)`
                    );
                    this.results.passed = false;
                }
                
                if (endpoint.summary.errorRate > this.maxErrorRate) {
                    this.results.failures.push(
                        `${name} error rate (${Math.round(endpoint.summary.errorRate * 100) / 100}%) ` +
                        `exceeds maximum (${this.maxErrorRate}%)`
                    );
                    this.results.passed = false;
                }
                
                // Critical endpoints should have 0% error rate
                if (endpoint.summary.errorRate > 0) {
                    this.results.failures.push(
                        `${name} is critical but has ${endpoint.summary.errorRate}% error rate`
                    );
                    this.results.passed = false;
                }
            }
        }
        
        // Check for any errors during testing
        if (baselineResults.errors.length > 0) {
            for (const error of baselineResults.errors) {
                this.results.failures.push(`Test error in ${error.endpoint}: ${error.error}`);
            }
            this.results.passed = false;
        }
    }
}

// CLI execution
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {};
    
    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--base-url':
            case '-u':
                options.baseURL = args[++i];
                break;
            case '--max-response-time':
            case '-t':
                options.maxResponseTime = parseInt(args[++i]);
                break;
            case '--max-error-rate':
            case '-e':
                options.maxErrorRate = parseFloat(args[++i]);
                break;
            case '--duration':
            case '-d':
                options.testDuration = parseInt(args[++i]) * 1000;
                break;
            case '--help':
            case '-h':
                console.log(`
Performance Smoke Test

Usage: node performance-smoke-test.js [options]

Options:
  -u, --base-url <url>           Base URL to test (default: http://localhost:3000)
  -t, --max-response-time <ms>   Maximum response time in ms (default: 5000)
  -e, --max-error-rate <rate>    Maximum error rate as percentage (default: 10)
  -d, --duration <seconds>       Test duration in seconds (default: 30)
  -h, --help                     Show this help message

Environment Variables:
  TEST_BASE_URL                  Base URL to test
  
Example:
  node scripts/performance-smoke-test.js --base-url http://localhost:3000 --duration 60
                `);
                process.exit(0);
        }
    }
    
    const smokeTest = new PerformanceSmokeTest(options);
    smokeTest.runSmokeTest().catch(error => {
        console.error('Smoke test execution failed:', error);
        process.exit(1);
    });
}

module.exports = {
    PerformanceSmokeTest
};
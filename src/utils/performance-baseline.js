/**
 * Performance Baseline System
 * Creates baseline performance metrics and reports for comparison
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

class PerformanceBaseline {
    constructor(options = {}) {
        this.baseURL = options.baseURL || `http://localhost:${process.env.PORT || 3000}`;
        this.outputDir = options.outputDir || path.join(process.cwd(), 'reports', 'performance');
        this.testDuration = options.testDuration || 60000; // 1 minute
        this.concurrentRequests = options.concurrentRequests || 5;
        this.warmupRequests = options.warmupRequests || 10;
        
        // Critical endpoints to test
        this.endpoints = [
            {
                name: 'Health Check',
                path: '/health',
                method: 'GET',
                critical: true
            },
            {
                name: 'API Health',
                path: '/api/health',
                method: 'GET',
                critical: true
            },
            {
                name: 'Cache Stats',
                path: '/api/cache/stats',
                method: 'GET',
                critical: false
            },
            {
                name: 'Performance Metrics',
                path: '/api/performance',
                method: 'GET',
                critical: false
            },
            {
                name: 'Redis Health',
                path: '/api/redis/health',
                method: 'GET',
                critical: false
            },
            {
                name: 'Chat Endpoint',
                path: '/api/chat',
                method: 'POST',
                body: { message: 'Hello, this is a performance test' },
                critical: true
            },
            {
                name: 'Provider Status',
                path: '/api/providers/status',
                method: 'GET',
                critical: false
            }
        ];

        this.results = {
            timestamp: null,
            duration: 0,
            environment: {
                nodeVersion: process.version,
                platform: process.platform,
                memory: process.memoryUsage(),
                cpus: require('os').cpus().length
            },
            endpoints: {},
            summary: {},
            errors: []
        };
    }

    /**
     * Ensure output directory exists
     */
    ensureOutputDir() {
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    /**
     * Warm up the server
     */
    async warmUp() {
        console.log(`🔥 Warming up server with ${this.warmupRequests} requests...`);
        
        const warmupPromises = [];
        for (let i = 0; i < this.warmupRequests; i++) {
            warmupPromises.push(this.makeRequest(this.endpoints[0])); // Use health check for warmup
        }
        
        await Promise.allSettled(warmupPromises);
        console.log('✅ Warmup completed');
    }

    /**
     * Make a request to an endpoint
     */
    async makeRequest(endpoint, timeout = 30000) {
        const startTime = process.hrtime.bigint();
        
        try {
            const config = {
                method: endpoint.method,
                url: `${this.baseURL}${endpoint.path}`,
                timeout: timeout,
                validateStatus: () => true // Don't throw on HTTP error status
            };
            
            if (endpoint.body && endpoint.method !== 'GET') {
                config.data = endpoint.body;
                config.headers = { 'Content-Type': 'application/json' };
            }
            
            const response = await axios(config);
            const endTime = process.hrtime.bigint();
            const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
            
            return {
                success: true,
                statusCode: response.status,
                responseTime: Math.round(responseTime * 100) / 100,
                size: JSON.stringify(response.data).length,
                error: null
            };
        } catch (error) {
            const endTime = process.hrtime.bigint();
            const responseTime = Number(endTime - startTime) / 1000000;
            
            return {
                success: false,
                statusCode: error.response?.status || 0,
                responseTime: Math.round(responseTime * 100) / 100,
                size: 0,
                error: error.message
            };
        }
    }

    /**
     * Test a single endpoint
     */
    async testEndpoint(endpoint) {
        console.log(`📊 Testing ${endpoint.name}...`);
        
        const results = {
            name: endpoint.name,
            path: endpoint.path,
            method: endpoint.method,
            critical: endpoint.critical,
            requests: [],
            summary: {
                totalRequests: 0,
                successfulRequests: 0,
                failedRequests: 0,
                averageResponseTime: 0,
                minResponseTime: Infinity,
                maxResponseTime: 0,
                p95ResponseTime: 0,
                p99ResponseTime: 0,
                totalTime: 0,
                requestsPerSecond: 0,
                errorRate: 0,
                averageSize: 0
            }
        };
        
        const startTime = Date.now();
        const requests = [];
        
        // Run concurrent requests for the test duration
        while (Date.now() - startTime < this.testDuration) {
            const batch = [];
            
            for (let i = 0; i < this.concurrentRequests; i++) {
                batch.push(this.makeRequest(endpoint));
            }
            
            const batchResults = await Promise.allSettled(batch);
            
            for (const result of batchResults) {
                if (result.status === 'fulfilled') {
                    requests.push(result.value);
                } else {
                    requests.push({
                        success: false,
                        statusCode: 0,
                        responseTime: 0,
                        size: 0,
                        error: result.reason.message
                    });
                }
            }
            
            // Small delay to prevent overwhelming
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        results.requests = requests;
        
        // Calculate summary statistics
        const successfulRequests = requests.filter(r => r.success && r.statusCode < 400);
        const responseTimes = requests.map(r => r.responseTime).filter(rt => rt > 0);
        
        results.summary.totalRequests = requests.length;
        results.summary.successfulRequests = successfulRequests.length;
        results.summary.failedRequests = requests.length - successfulRequests.length;
        results.summary.errorRate = (results.summary.failedRequests / results.summary.totalRequests) * 100;
        
        if (responseTimes.length > 0) {
            results.summary.totalTime = responseTimes.reduce((sum, time) => sum + time, 0);
            results.summary.averageResponseTime = results.summary.totalTime / responseTimes.length;
            results.summary.minResponseTime = Math.min(...responseTimes);
            results.summary.maxResponseTime = Math.max(...responseTimes);
            
            // Calculate percentiles
            const sortedTimes = responseTimes.sort((a, b) => a - b);
            results.summary.p95ResponseTime = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
            results.summary.p99ResponseTime = sortedTimes[Math.floor(sortedTimes.length * 0.99)];
            
            results.summary.requestsPerSecond = (results.summary.totalRequests / (this.testDuration / 1000));
        }
        
        // Calculate average response size
        const sizes = requests.map(r => r.size).filter(s => s > 0);
        if (sizes.length > 0) {
            results.summary.averageSize = sizes.reduce((sum, size) => sum + size, 0) / sizes.length;
        }
        
        console.log(`✅ ${endpoint.name}: ${results.summary.successfulRequests}/${results.summary.totalRequests} requests successful, avg: ${Math.round(results.summary.averageResponseTime)}ms`);
        
        return results;
    }

    /**
     * Run full performance baseline test
     */
    async runBaseline() {
        console.log('🚀 Starting Performance Baseline Test...');
        console.log(`📍 Testing ${this.baseURL}`);
        console.log(`⏱️ Test duration: ${this.testDuration / 1000}s per endpoint`);
        console.log(`🔀 Concurrent requests: ${this.concurrentRequests}`);
        
        this.ensureOutputDir();
        
        const startTime = Date.now();
        this.results.timestamp = new Date().toISOString();
        
        try {
            // Warm up the server
            await this.warmUp();
            
            // Test each endpoint
            for (const endpoint of this.endpoints) {
                try {
                    const endpointResults = await this.testEndpoint(endpoint);
                    this.results.endpoints[endpoint.name] = endpointResults;
                } catch (error) {
                    console.error(`❌ Failed to test ${endpoint.name}:`, error.message);
                    this.results.errors.push({
                        endpoint: endpoint.name,
                        error: error.message,
                        timestamp: new Date().toISOString()
                    });
                }
            }
            
            // Calculate overall summary
            this.calculateOverallSummary();
            
            this.results.duration = Date.now() - startTime;
            
            // Save results
            await this.saveResults();
            
            console.log('✅ Performance baseline test completed!');
            console.log(`📊 Total time: ${Math.round(this.results.duration / 1000)}s`);
            console.log(`📁 Results saved to: ${this.outputDir}`);
            
            return this.results;
        } catch (error) {
            console.error('❌ Performance baseline test failed:', error);
            throw error;
        }
    }

    /**
     * Calculate overall performance summary
     */
    calculateOverallSummary() {
        const endpoints = Object.values(this.results.endpoints);
        
        this.results.summary = {
            totalEndpoints: endpoints.length,
            criticalEndpoints: endpoints.filter(e => e.critical).length,
            healthyEndpoints: endpoints.filter(e => e.summary.errorRate < 5).length,
            overallAverageResponseTime: 0,
            overallP95ResponseTime: 0,
            overallRequestsPerSecond: 0,
            overallErrorRate: 0,
            status: 'unknown'
        };
        
        if (endpoints.length > 0) {
            // Calculate weighted averages
            let totalRequests = 0;
            let totalResponseTime = 0;
            let totalErrors = 0;
            let allResponseTimes = [];
            
            for (const endpoint of endpoints) {
                totalRequests += endpoint.summary.totalRequests;
                totalResponseTime += endpoint.summary.totalTime;
                totalErrors += endpoint.summary.failedRequests;
                
                // Collect all response times for overall percentiles
                const responseTimes = endpoint.requests
                    .map(r => r.responseTime)
                    .filter(rt => rt > 0);
                allResponseTimes = allResponseTimes.concat(responseTimes);
            }
            
            this.results.summary.overallAverageResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;
            this.results.summary.overallErrorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
            this.results.summary.overallRequestsPerSecond = totalRequests / (this.results.duration / 1000);
            
            // Calculate overall P95
            if (allResponseTimes.length > 0) {
                const sortedTimes = allResponseTimes.sort((a, b) => a - b);
                this.results.summary.overallP95ResponseTime = sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0;
            }
            
            // Determine overall status
            this.results.summary.status = this.determineOverallStatus();
        }
    }

    /**
     * Determine overall performance status
     */
    determineOverallStatus() {
        const { overallAverageResponseTime, overallErrorRate, overallP95ResponseTime } = this.results.summary;
        const criticalEndpointsFailed = Object.values(this.results.endpoints)
            .filter(e => e.critical && e.summary.errorRate > 10)
            .length;
        
        if (criticalEndpointsFailed > 0 || overallErrorRate > 20) {
            return 'critical';
        } else if (overallAverageResponseTime > 2000 || overallP95ResponseTime > 5000) {
            return 'slow';
        } else if (overallAverageResponseTime > 1000 || overallErrorRate > 5) {
            return 'warning';
        } else {
            return 'good';
        }
    }

    /**
     * Save results to files
     */
    async saveResults() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // Save detailed JSON report
        const jsonPath = path.join(this.outputDir, `baseline-${timestamp}.json`);
        fs.writeFileSync(jsonPath, JSON.stringify(this.results, null, 2));
        
        // Save summary report
        const summaryPath = path.join(this.outputDir, `baseline-summary-${timestamp}.md`);
        const summaryReport = this.generateSummaryReport();
        fs.writeFileSync(summaryPath, summaryReport);
        
        // Save latest baseline (for comparison)
        const latestPath = path.join(this.outputDir, 'latest-baseline.json');
        fs.writeFileSync(latestPath, JSON.stringify(this.results, null, 2));
        
        console.log(`📄 Detailed report: ${jsonPath}`);
        console.log(`📋 Summary report: ${summaryPath}`);
    }

    /**
     * Generate markdown summary report
     */
    generateSummaryReport() {
        const { summary, timestamp, duration, environment } = this.results;
        const statusEmoji = {
            good: '✅',
            warning: '⚠️',
            slow: '🐌',
            critical: '🚨'
        };
        
        let report = `# Performance Baseline Report\n\n`;
        report += `**Generated:** ${timestamp}\n`;
        report += `**Duration:** ${Math.round(duration / 1000)}s\n`;
        report += `**Status:** ${statusEmoji[summary.status] || '❓'} ${summary.status.toUpperCase()}\n\n`;
        
        // Environment info
        report += `## Environment\n`;
        report += `- Node.js: ${environment.nodeVersion}\n`;
        report += `- Platform: ${environment.platform}\n`;
        report += `- CPUs: ${environment.cpus}\n`;
        report += `- Memory: ${Math.round(environment.memory.heapUsed / 1024 / 1024)}MB used\n\n`;
        
        // Overall metrics
        report += `## Overall Performance\n`;
        report += `- **Average Response Time:** ${Math.round(summary.overallAverageResponseTime)}ms\n`;
        report += `- **P95 Response Time:** ${Math.round(summary.overallP95ResponseTime)}ms\n`;
        report += `- **Requests per Second:** ${Math.round(summary.overallRequestsPerSecond)}\n`;
        report += `- **Error Rate:** ${Math.round(summary.overallErrorRate * 100) / 100}%\n`;
        report += `- **Healthy Endpoints:** ${summary.healthyEndpoints}/${summary.totalEndpoints}\n\n`;
        
        // Endpoint details
        report += `## Endpoint Performance\n\n`;
        for (const [name, endpoint] of Object.entries(this.results.endpoints)) {
            const status = endpoint.summary.errorRate < 5 ? '✅' : '❌';
            const critical = endpoint.critical ? '🔴' : '🔵';
            
            report += `### ${critical} ${name} ${status}\n`;
            report += `- **Path:** \`${endpoint.method} ${endpoint.path}\`\n`;
            report += `- **Requests:** ${endpoint.summary.successfulRequests}/${endpoint.summary.totalRequests}\n`;
            report += `- **Average Response Time:** ${Math.round(endpoint.summary.averageResponseTime)}ms\n`;
            report += `- **P95 Response Time:** ${Math.round(endpoint.summary.p95ResponseTime)}ms\n`;
            report += `- **Error Rate:** ${Math.round(endpoint.summary.errorRate * 100) / 100}%\n`;
            report += `- **Requests/sec:** ${Math.round(endpoint.summary.requestsPerSecond)}\n\n`;
        }
        
        // Errors
        if (this.results.errors.length > 0) {
            report += `## Errors\n\n`;
            for (const error of this.results.errors) {
                report += `- **${error.endpoint}:** ${error.error}\n`;
            }
        }
        
        return report;
    }

    /**
     * Compare with previous baseline
     */
    async compareWithPrevious() {
        const latestPath = path.join(this.outputDir, 'latest-baseline.json');
        
        if (!fs.existsSync(latestPath)) {
            return null;
        }
        
        try {
            const previousResults = JSON.parse(fs.readFileSync(latestPath, 'utf8'));
            const comparison = {
                timestamp: new Date().toISOString(),
                previous: {
                    timestamp: previousResults.timestamp,
                    averageResponseTime: previousResults.summary.overallAverageResponseTime,
                    errorRate: previousResults.summary.overallErrorRate,
                    requestsPerSecond: previousResults.summary.overallRequestsPerSecond
                },
                current: {
                    timestamp: this.results.timestamp,
                    averageResponseTime: this.results.summary.overallAverageResponseTime,
                    errorRate: this.results.summary.overallErrorRate,
                    requestsPerSecond: this.results.summary.overallRequestsPerSecond
                },
                changes: {}
            };
            
            // Calculate changes
            comparison.changes.responseTime = comparison.current.averageResponseTime - comparison.previous.averageResponseTime;
            comparison.changes.errorRate = comparison.current.errorRate - comparison.previous.errorRate;
            comparison.changes.requestsPerSecond = comparison.current.requestsPerSecond - comparison.previous.requestsPerSecond;
            
            return comparison;
        } catch (error) {
            console.error('Error comparing with previous baseline:', error);
            return null;
        }
    }
}

module.exports = {
    PerformanceBaseline
};
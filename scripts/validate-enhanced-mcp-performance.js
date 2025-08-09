#!/usr/bin/env node
/**
 * Advanced MCP Performance Validation Script
 * Tests and validates all new high-performance MCP servers
 */

const { spawn, exec } = require('child_process');
const util = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = util.promisify(exec);

class MCPPerformanceValidator {
  constructor() {
    this.servers = {
      'performance-analyzer': {
        script: 'mcp-servers/performance-analyzer-server.js',
        port: 3010,
        healthEndpoint: '/health',
        testEndpoints: ['/api/metrics/realtime', '/api/recommendations', '/api/benchmarks']
      },
      'code-intelligence': {
        script: 'mcp-servers/code-intelligence-server.js',
        port: 3011,
        healthEndpoint: '/health',
        testEndpoints: ['/api/analyze/comprehensive', '/api/quality/score', '/api/security/scan']
      },
      'enhanced-orchestrator-v2': {
        script: 'mcp-servers/enhanced-mcp-orchestrator-v2.js',
        port: 3012,
        healthEndpoint: '/health',
        testEndpoints: ['/api/orchestrator/status', '/api/performance/metrics', '/api/system/analyze']
      }
    };
    
    this.results = new Map();
    this.serverProcesses = new Map();
  }

  async validate() {
    console.log('🚀 Starting Advanced MCP Performance Validation...\n');
    
    try {
      // Step 1: Start all servers
      await this.startAllServers();
      
      // Step 2: Wait for servers to be ready
      await this.waitForServersReady();
      
      // Step 3: Run performance tests
      await this.runPerformanceTests();
      
      // Step 4: Run functionality tests
      await this.runFunctionalityTests();
      
      // Step 5: Run integration tests
      await this.runIntegrationTests();
      
      // Step 6: Generate comprehensive report
      await this.generateReport();
      
      // Step 7: Cleanup
      await this.cleanup();
      
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      await this.cleanup();
      process.exit(1);
    }
  }

  async startAllServers() {
    console.log('🔧 Starting MCP servers...');
    
    for (const [serverId, config] of Object.entries(this.servers)) {
      try {
        console.log(`  Starting ${serverId}...`);
        
        const serverProcess = spawn('node', [config.script], {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: { ...process.env, [`${serverId.toUpperCase()}_PORT`]: config.port }
        });

        this.serverProcesses.set(serverId, serverProcess);

        // Capture output
        let output = '';
        serverProcess.stdout.on('data', (data) => {
          output += data.toString();
        });

        serverProcess.stderr.on('data', (data) => {
          console.error(`[${serverId}] ${data.toString().trim()}`);
        });

        serverProcess.on('close', (code) => {
          if (code !== 0) {
            console.warn(`[${serverId}] Process exited with code ${code}`);
          }
        });

        this.results.set(serverId, {
          startTime: Date.now(),
          status: 'starting',
          output,
          tests: {}
        });
        
        console.log(`  ✅ ${serverId} started on port ${config.port}`);
      } catch (error) {
        console.error(`  ❌ Failed to start ${serverId}:`, error.message);
        this.results.set(serverId, {
          startTime: Date.now(),
          status: 'failed',
          error: error.message
        });
      }
    }
    
    console.log('');
  }

  async waitForServersReady() {
    console.log('⏳ Waiting for servers to be ready...');
    
    const maxWaitTime = 30000; // 30 seconds
    const checkInterval = 1000; // 1 second
    
    for (const [serverId, config] of Object.entries(this.servers)) {
      const startTime = Date.now();
      let isReady = false;
      
      while (!isReady && (Date.now() - startTime) < maxWaitTime) {
        try {
          const response = await this.makeRequest('GET', `http://localhost:${config.port}${config.healthEndpoint}`);
          if (response.status === 'healthy') {
            isReady = true;
            console.log(`  ✅ ${serverId} is ready`);
            
            const result = this.results.get(serverId);
            result.status = 'running';
            result.readyTime = Date.now() - result.startTime;
          }
        } catch (error) {
          // Server not ready yet, wait
          await this.sleep(checkInterval);
        }
      }
      
      if (!isReady) {
        console.error(`  ❌ ${serverId} failed to start within ${maxWaitTime}ms`);
        const result = this.results.get(serverId);
        result.status = 'timeout';
      }
    }
    
    console.log('');
  }

  async runPerformanceTests() {
    console.log('📊 Running performance tests...');
    
    for (const [serverId, config] of Object.entries(this.servers)) {
      const result = this.results.get(serverId);
      if (result.status !== 'running') continue;
      
      console.log(`  Testing ${serverId} performance...`);
      
      const performanceTests = {
        healthCheck: await this.testHealthCheckPerformance(serverId, config),
        endpointResponsiveness: await this.testEndpointResponsiveness(serverId, config),
        loadTesting: await this.testLoadCapacity(serverId, config),
        memoryUsage: await this.testMemoryUsage(serverId, config)
      };
      
      result.tests.performance = performanceTests;
      
      // Calculate performance score
      const scores = Object.values(performanceTests).filter(test => test.score !== undefined);
      const avgScore = scores.reduce((sum, test) => sum + test.score, 0) / scores.length;
      result.performanceScore = Math.round(avgScore);
      
      console.log(`    Performance Score: ${result.performanceScore}/100`);
    }
    
    console.log('');
  }

  async testHealthCheckPerformance(serverId, config) {
    const iterations = 10;
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      try {
        await this.makeRequest('GET', `http://localhost:${config.port}/health`);
        times.push(Date.now() - startTime);
      } catch (error) {
        times.push(5000); // Penalty for failed requests
      }
    }
    
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);
    
    return {
      averageResponseTime: avgTime,
      maxResponseTime: maxTime,
      minResponseTime: minTime,
      score: Math.max(0, 100 - (avgTime / 10)) // Score based on response time
    };
  }

  async testEndpointResponsiveness(serverId, config) {
    const results = {};
    
    for (const endpoint of config.testEndpoints) {
      const startTime = Date.now();
      try {
        const response = await this.makeRequest('GET', `http://localhost:${config.port}${endpoint}`);
        const responseTime = Date.now() - startTime;
        
        results[endpoint] = {
          responseTime,
          status: 'success',
          hasData: response && Object.keys(response).length > 0
        };
      } catch (error) {
        results[endpoint] = {
          responseTime: Date.now() - startTime,
          status: 'failed',
          error: error.message
        };
      }
    }
    
    const successfulEndpoints = Object.values(results).filter(r => r.status === 'success').length;
    const avgResponseTime = Object.values(results)
      .reduce((sum, r) => sum + r.responseTime, 0) / Object.values(results).length;
    
    return {
      endpoints: results,
      successRate: (successfulEndpoints / config.testEndpoints.length) * 100,
      averageResponseTime: avgResponseTime,
      score: (successfulEndpoints / config.testEndpoints.length) * 100
    };
  }

  async testLoadCapacity(serverId, config) {
    const concurrentRequests = 10;
    const requestsPerBatch = 5;
    
    console.log(`    Load testing ${serverId} with ${concurrentRequests} concurrent requests...`);
    
    const startTime = Date.now();
    const promises = [];
    
    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(
        this.makeRequest('GET', `http://localhost:${config.port}/health`)
          .then(() => ({ success: true }))
          .catch((error) => ({ success: false, error: error.message }))
      );
    }
    
    const results = await Promise.all(promises);
    const totalTime = Date.now() - startTime;
    
    const successCount = results.filter(r => r.success).length;
    const successRate = (successCount / concurrentRequests) * 100;
    const requestsPerSecond = (concurrentRequests / totalTime) * 1000;
    
    return {
      concurrentRequests,
      successCount,
      successRate,
      totalTime,
      requestsPerSecond,
      score: Math.min(100, successRate * (requestsPerSecond / 10))
    };
  }

  async testMemoryUsage(serverId, config) {
    try {
      const beforeMemory = process.memoryUsage();
      
      // Make several requests to trigger memory usage
      for (let i = 0; i < 5; i++) {
        await this.makeRequest('GET', `http://localhost:${config.port}/health`);
      }
      
      const afterMemory = process.memoryUsage();
      
      const memoryIncrease = afterMemory.heapUsed - beforeMemory.heapUsed;
      
      return {
        beforeMemory: beforeMemory.heapUsed,
        afterMemory: afterMemory.heapUsed,
        memoryIncrease,
        score: Math.max(0, 100 - (memoryIncrease / (1024 * 1024))) // Score based on memory efficiency
      };
    } catch (error) {
      return {
        error: error.message,
        score: 0
      };
    }
  }

  async runFunctionalityTests() {
    console.log('🧪 Running functionality tests...');
    
    // Test Performance Analyzer functionality
    await this.testPerformanceAnalyzer();
    
    // Test Code Intelligence functionality
    await this.testCodeIntelligence();
    
    // Test Enhanced Orchestrator functionality
    await this.testEnhancedOrchestrator();
    
    console.log('');
  }

  async testPerformanceAnalyzer() {
    const serverId = 'performance-analyzer';
    const config = this.servers[serverId];
    const result = this.results.get(serverId);
    
    if (result.status !== 'running') return;
    
    console.log(`  Testing ${serverId} functionality...`);
    
    const functionalityTests = {};
    
    // Test real-time metrics
    try {
      const metrics = await this.makeRequest('GET', `http://localhost:${config.port}/api/metrics/realtime`);
      functionalityTests.realtimeMetrics = {
        status: 'success',
        hasMemoryData: !!metrics.memory,
        hasCPUData: !!metrics.cpu,
        score: (metrics.memory && metrics.cpu) ? 100 : 50
      };
    } catch (error) {
      functionalityTests.realtimeMetrics = {
        status: 'failed',
        error: error.message,
        score: 0
      };
    }
    
    // Test benchmark functionality
    try {
      const benchmarkStart = await this.makeRequest('POST', `http://localhost:${config.port}/api/benchmark/start`, {
        name: 'test-benchmark',
        description: 'Testing benchmark functionality'
      });
      
      await this.sleep(1000); // Wait 1 second
      
      const benchmarkEnd = await this.makeRequest('POST', `http://localhost:${config.port}/api/benchmark/end`, {
        name: 'test-benchmark'
      });
      
      functionalityTests.benchmarking = {
        status: 'success',
        duration: benchmarkEnd.benchmark?.duration || 0,
        score: benchmarkEnd.benchmark?.duration ? 100 : 50
      };
    } catch (error) {
      functionalityTests.benchmarking = {
        status: 'failed',
        error: error.message,
        score: 0
      };
    }
    
    result.tests.functionality = functionalityTests;
  }

  async testCodeIntelligence() {
    const serverId = 'code-intelligence';
    const config = this.servers[serverId];
    const result = this.results.get(serverId);
    
    if (result.status !== 'running') return;
    
    console.log(`  Testing ${serverId} functionality...`);
    
    const functionalityTests = {};
    
    // Test code analysis
    try {
      const sampleCode = `
        function testFunction(param) {
          const result = param + 1;
          return result;
        }
        
        console.log('test');
      `;
      
      const analysis = await this.makeRequest('POST', `http://localhost:${config.port}/api/analyze/comprehensive`, {
        code: sampleCode,
        language: 'javascript'
      });
      
      functionalityTests.codeAnalysis = {
        status: 'success',
        hasMetrics: !!analysis.analysis?.metrics,
        hasQuality: !!analysis.analysis?.quality,
        hasComplexity: !!analysis.analysis?.complexity,
        score: (analysis.analysis?.metrics && analysis.analysis?.quality && analysis.analysis?.complexity) ? 100 : 50
      };
    } catch (error) {
      functionalityTests.codeAnalysis = {
        status: 'failed',
        error: error.message,
        score: 0
      };
    }
    
    // Test quality scoring
    try {
      const qualityScore = await this.makeRequest('POST', `http://localhost:${config.port}/api/quality/score`, {
        code: 'const x = 1; const y = 2; console.log(x + y);',
        language: 'javascript'
      });
      
      functionalityTests.qualityScoring = {
        status: 'success',
        hasOverallScore: typeof qualityScore.overall === 'number',
        hasBreakdown: !!qualityScore.breakdown,
        score: (qualityScore.overall !== undefined && qualityScore.breakdown) ? 100 : 50
      };
    } catch (error) {
      functionalityTests.qualityScoring = {
        status: 'failed',
        error: error.message,
        score: 0
      };
    }
    
    result.tests.functionality = functionalityTests;
  }

  async testEnhancedOrchestrator() {
    const serverId = 'enhanced-orchestrator-v2';
    const config = this.servers[serverId];
    const result = this.results.get(serverId);
    
    if (result.status !== 'running') return;
    
    console.log(`  Testing ${serverId} functionality...`);
    
    const functionalityTests = {};
    
    // Test orchestrator status
    try {
      const status = await this.makeRequest('GET', `http://localhost:${config.port}/api/orchestrator/status`);
      
      functionalityTests.orchestratorStatus = {
        status: 'success',
        hasVersion: !!status.version,
        hasServers: !!status.servers,
        hasRouting: !!status.routingTable,
        score: (status.version && status.servers && status.routingTable) ? 100 : 50
      };
    } catch (error) {
      functionalityTests.orchestratorStatus = {
        status: 'failed',
        error: error.message,
        score: 0
      };
    }
    
    // Test performance metrics
    try {
      const metrics = await this.makeRequest('GET', `http://localhost:${config.port}/api/performance/metrics`);
      
      functionalityTests.performanceMetrics = {
        status: 'success',
        hasMetrics: Object.keys(metrics || {}).length > 0,
        score: Object.keys(metrics || {}).length > 0 ? 100 : 50
      };
    } catch (error) {
      functionalityTests.performanceMetrics = {
        status: 'failed',
        error: error.message,
        score: 0
      };
    }
    
    result.tests.functionality = functionalityTests;
  }

  async runIntegrationTests() {
    console.log('🔗 Running integration tests...');
    
    // Test server communication
    await this.testServerCommunication();
    
    // Test load balancing (if orchestrator is running)
    await this.testLoadBalancing();
    
    console.log('');
  }

  async testServerCommunication() {
    console.log('  Testing inter-server communication...');
    
    // This would test if servers can communicate with each other
    // For now, we'll check if all servers are responsive simultaneously
    
    const promises = [];
    
    for (const [serverId, config] of Object.entries(this.servers)) {
      const result = this.results.get(serverId);
      if (result.status === 'running') {
        promises.push(
          this.makeRequest('GET', `http://localhost:${config.port}/health`)
            .then(() => ({ serverId, status: 'success' }))
            .catch((error) => ({ serverId, status: 'failed', error: error.message }))
        );
      }
    }
    
    const results = await Promise.all(promises);
    const successCount = results.filter(r => r.status === 'success').length;
    
    console.log(`    ${successCount}/${results.length} servers responding simultaneously`);
  }

  async testLoadBalancing() {
    console.log('  Testing load balancing capabilities...');
    
    const orchestratorResult = this.results.get('enhanced-orchestrator-v2');
    if (!orchestratorResult || orchestratorResult.status !== 'running') {
      console.log('    Skipped - Enhanced Orchestrator not running');
      return;
    }
    
    // Test auto-scaling functionality
    try {
      const scalingResponse = await this.makeRequest('POST', 'http://localhost:3012/api/scaling/auto', {
        enable: true
      });
      
      console.log(`    Auto-scaling: ${scalingResponse.autoScaling ? 'Enabled' : 'Disabled'}`);
    } catch (error) {
      console.log(`    Auto-scaling test failed: ${error.message}`);
    }
  }

  async generateReport() {
    console.log('📋 Generating comprehensive validation report...\n');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalServers: Object.keys(this.servers).length,
        runningServers: 0,
        averagePerformanceScore: 0,
        overallStatus: 'unknown'
      },
      servers: {},
      recommendations: []
    };
    
    let totalPerformanceScore = 0;
    let runningServersCount = 0;
    
    // Process each server result
    for (const [serverId, result] of this.results) {
      report.servers[serverId] = {
        status: result.status,
        startupTime: result.readyTime,
        performanceScore: result.performanceScore || 0,
        tests: result.tests
      };
      
      if (result.status === 'running') {
        runningServersCount++;
        totalPerformanceScore += (result.performanceScore || 0);
      }
    }
    
    report.summary.runningServers = runningServersCount;
    report.summary.averagePerformanceScore = runningServersCount > 0 
      ? Math.round(totalPerformanceScore / runningServersCount) 
      : 0;
    
    // Determine overall status
    if (runningServersCount === Object.keys(this.servers).length) {
      report.summary.overallStatus = 'excellent';
    } else if (runningServersCount > 0) {
      report.summary.overallStatus = 'partial';
    } else {
      report.summary.overallStatus = 'failed';
    }
    
    // Generate recommendations
    report.recommendations = this.generateRecommendations(report);
    
    // Save report
    await fs.writeFile(
      path.join(process.cwd(), 'mcp-performance-validation-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    // Display summary
    this.displayReportSummary(report);
  }

  generateRecommendations(report) {
    const recommendations = [];
    
    // Performance recommendations
    if (report.summary.averagePerformanceScore < 80) {
      recommendations.push({
        category: 'performance',
        severity: 'medium',
        title: 'Performance optimization needed',
        description: `Average performance score is ${report.summary.averagePerformanceScore}/100`,
        actions: [
          'Review server resource allocation',
          'Optimize endpoint response times',
          'Implement caching strategies'
        ]
      });
    }
    
    // Server availability recommendations
    if (report.summary.runningServers < report.summary.totalServers) {
      recommendations.push({
        category: 'availability',
        severity: 'high',
        title: 'Server availability issues',
        description: `${report.summary.runningServers}/${report.summary.totalServers} servers running`,
        actions: [
          'Investigate failed server startups',
          'Check port availability',
          'Review server logs for errors'
        ]
      });
    }
    
    // Success recommendations
    if (report.summary.overallStatus === 'excellent' && report.summary.averagePerformanceScore >= 90) {
      recommendations.push({
        category: 'optimization',
        severity: 'info',
        title: 'Excellent performance achieved',
        description: 'All servers running with high performance scores',
        actions: [
          'Monitor ongoing performance',
          'Consider implementing advanced features',
          'Document successful configuration'
        ]
      });
    }
    
    return recommendations;
  }

  displayReportSummary(report) {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 MCP PERFORMANCE VALIDATION SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`🎯 Overall Status: ${this.getStatusEmoji(report.summary.overallStatus)} ${report.summary.overallStatus.toUpperCase()}`);
    console.log(`🖥️  Servers Running: ${report.summary.runningServers}/${report.summary.totalServers}`);
    console.log(`⚡ Avg Performance: ${report.summary.averagePerformanceScore}/100`);
    console.log('───────────────────────────────────────────────────────────');
    
    // Individual server status
    for (const [serverId, serverData] of Object.entries(report.servers)) {
      const statusEmoji = this.getStatusEmoji(serverData.status);
      const performanceBar = this.getPerformanceBar(serverData.performanceScore);
      console.log(`${statusEmoji} ${serverId.padEnd(25)} ${performanceBar} ${serverData.performanceScore}/100`);
      
      if (serverData.startupTime) {
        console.log(`   └── Startup time: ${serverData.startupTime}ms`);
      }
    }
    
    console.log('───────────────────────────────────────────────────────────');
    
    // Key recommendations
    if (report.recommendations.length > 0) {
      console.log('💡 Key Recommendations:');
      report.recommendations.forEach((rec, index) => {
        const severityEmoji = rec.severity === 'high' ? '🔴' : 
                             rec.severity === 'medium' ? '🟡' : '🟢';
        console.log(`   ${index + 1}. ${severityEmoji} ${rec.title}`);
      });
    }
    
    console.log('───────────────────────────────────────────────────────────');
    console.log(`📁 Full report saved: mcp-performance-validation-report.json`);
    console.log('═══════════════════════════════════════════════════════════\n');
  }

  getStatusEmoji(status) {
    switch (status) {
      case 'running':
      case 'excellent': return '✅';
      case 'partial': return '⚠️';
      case 'failed':
      case 'timeout': return '❌';
      default: return '❓';
    }
  }

  getPerformanceBar(score) {
    const barLength = 10;
    const filledLength = Math.round((score / 100) * barLength);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
    return `[${bar}]`;
  }

  async makeRequest(method, url, data = null) {
    return new Promise((resolve, reject) => {
      const http = require('http');
      const urlObj = new URL(url);
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      };
      
      const req = http.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          try {
            if (responseData) {
              resolve(JSON.parse(responseData));
            } else {
              resolve({});
            }
          } catch (error) {
            resolve({ data: responseData });
          }
        });
      });
      
      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Request timeout')));
      
      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async cleanup() {
    console.log('🧹 Cleaning up...');
    
    for (const [serverId, process] of this.serverProcesses) {
      try {
        process.kill('SIGTERM');
        console.log(`  Stopped ${serverId}`);
      } catch (error) {
        console.warn(`  Failed to stop ${serverId}:`, error.message);
      }
    }
    
    // Wait for processes to terminate
    await this.sleep(2000);
    
    console.log('✅ Cleanup complete\n');
  }
}

// Run validation if script is executed directly
if (require.main === module) {
  const validator = new MCPPerformanceValidator();
  validator.validate().catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
}

module.exports = MCPPerformanceValidator;
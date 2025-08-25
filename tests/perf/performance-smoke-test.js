/**
 * EchoTune AI - Performance Testing Suite
 * Phase 1 Epic E06: Comprehensive Testing & QA
 * 
 * Provides performance smoke testing with:
 * - Load testing scenarios
 * - Latency budget validation
 * - Throughput measurement
 * - Resource utilization monitoring
 */

const autocannon = require('autocannon');
const { performance } = require('perf_hooks');
const fs = require('fs').promises;
const path = require('path');

class PerformanceTester {
  constructor(config = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'http://localhost:3000',
      testDuration: config.testDuration || 30, // seconds
      connections: config.connections || 10,
      timeout: config.timeout || 10, // seconds
      budgets: {
        p95_latency_ms: 400,
        throughput_rps: 50,
        error_rate_percent: 1,
        memory_usage_mb: 512,
        cpu_usage_percent: 70
      },
      ...config
    };
    
    this.results = [];
    this.baselines = null;
  }

  /**
   * Load performance baselines from file
   */
  async loadBaselines() {
    try {
      const baselinePath = path.join(__dirname, '../../enhanced-mcp-performance-baseline.json');
      const data = await fs.readFile(baselinePath, 'utf8');
      this.baselines = JSON.parse(data);
      console.log('📊 Loaded performance baselines');
    } catch (error) {
      console.warn('⚠️ No baseline file found, will create new baseline');
      this.baselines = null;
    }
  }

  /**
   * Save current results as baseline
   */
  async saveBaseline(results) {
    const baselinePath = path.join(__dirname, '../../enhanced-mcp-performance-baseline.json');
    const baseline = {
      timestamp: new Date().toISOString(),
      test_config: this.config,
      results: results,
      version: process.env.npm_package_version || '1.0.0'
    };
    
    await fs.writeFile(baselinePath, JSON.stringify(baseline, null, 2));
    console.log('💾 Saved performance baseline');
  }

  /**
   * Run comprehensive performance test suite
   */
  async runTestSuite() {
    console.log('🚀 Starting performance test suite...');
    
    await this.loadBaselines();
    
    const testScenarios = [
      { name: 'Health Check', path: '/health', method: 'GET' },
      { name: 'Metrics Endpoint', path: '/metrics', method: 'GET' },
      { name: 'Home Page', path: '/', method: 'GET' },
      { name: 'API Status', path: '/api/status', method: 'GET' },
      { name: 'Auth Health', path: '/auth/health', method: 'GET' }
    ];
    
    const results = {};
    let overallSuccess = true;
    
    for (const scenario of testScenarios) {
      console.log(`\n📈 Testing: ${scenario.name}`);
      
      try {
        const result = await this.runLoadTest(scenario);
        results[scenario.name] = result;
        
        // Validate against budgets
        const validation = this.validatePerformanceBudget(result);
        if (!validation.passed) {
          overallSuccess = false;
          console.log(`❌ ${scenario.name} failed budget validation:`, validation.violations);
        } else {
          console.log(`✅ ${scenario.name} passed budget validation`);
        }
        
      } catch (error) {
        console.error(`❌ Test failed for ${scenario.name}:`, error.message);
        results[scenario.name] = { error: error.message };
        overallSuccess = false;
      }
    }
    
    // Generate comprehensive report
    const report = await this.generateReport(results, overallSuccess);
    
    // Save as baseline if this is a clean run
    if (overallSuccess && !this.baselines) {
      await this.saveBaseline(results);
    }
    
    return report;
  }

  /**
   * Run load test for specific scenario
   */
  async runLoadTest(scenario) {
    const startTime = performance.now();
    
    // Warm up
    console.log('🔥 Warming up...');
    await this.makeRequest(scenario.path);
    
    // Main load test
    console.log(`🔄 Running load test (${this.config.testDuration}s, ${this.config.connections} connections)...`);
    
    const result = await autocannon({
      url: `${this.config.baseUrl}${scenario.path}`,
      method: scenario.method,
      duration: this.config.testDuration,
      connections: this.config.connections,
      timeout: this.config.timeout,
      headers: {
        'User-Agent': 'EchoTune-Performance-Test/1.0',
        'Accept': 'application/json'
      }
    });
    
    const endTime = performance.now();
    
    // Process results
    const processedResult = {
      scenario: scenario.name,
      timestamp: new Date().toISOString(),
      test_duration: endTime - startTime,
      connections: this.config.connections,
      requests: {
        total: result.requests.total,
        average_per_second: result.requests.average,
        sent: result.requests.sent
      },
      latency: {
        mean_ms: result.latency.mean,
        max_ms: result.latency.max,
        min_ms: result.latency.min,
        p50_ms: result.latency.p50,
        p75_ms: result.latency.p75,
        p90_ms: result.latency.p90,
        p95_ms: result.latency.p95,
        p99_ms: result.latency.p99
      },
      throughput: {
        mean_bytes_per_second: result.throughput.mean,
        total_bytes: result.throughput.total
      },
      errors: {
        total: result.errors,
        rate_percent: (result.errors / result.requests.total) * 100
      },
      status_codes: result.statusCodeStats || {}
    };
    
    return processedResult;
  }

  /**
   * Validate performance against budgets
   */
  validatePerformanceBudget(result) {
    const violations = [];
    
    // Check p95 latency budget
    if (result.latency.p95_ms > this.config.budgets.p95_latency_ms) {
      violations.push({
        metric: 'p95_latency_ms',
        actual: result.latency.p95_ms,
        budget: this.config.budgets.p95_latency_ms,
        severity: 'high'
      });
    }
    
    // Check throughput budget
    if (result.requests.average_per_second < this.config.budgets.throughput_rps) {
      violations.push({
        metric: 'throughput_rps',
        actual: result.requests.average_per_second,
        budget: this.config.budgets.throughput_rps,
        severity: 'medium'
      });
    }
    
    // Check error rate budget
    if (result.errors.rate_percent > this.config.budgets.error_rate_percent) {
      violations.push({
        metric: 'error_rate_percent',
        actual: result.errors.rate_percent,
        budget: this.config.budgets.error_rate_percent,
        severity: 'high'
      });
    }
    
    return {
      passed: violations.length === 0,
      violations
    };
  }

  /**
   * Compare results with baseline
   */
  compareWithBaseline(results) {
    if (!this.baselines) {
      return { hasBaseline: false, message: 'No baseline available for comparison' };
    }
    
    const comparisons = {};
    
    for (const [scenarioName, currentResult] of Object.entries(results)) {
      const baselineResult = this.baselines.results[scenarioName];
      
      if (!baselineResult || currentResult.error) {
        continue;
      }
      
      const comparison = {
        latency_p95_change_percent: this.calculatePercentChange(
          baselineResult.latency.p95_ms,
          currentResult.latency.p95_ms
        ),
        throughput_change_percent: this.calculatePercentChange(
          baselineResult.requests.average_per_second,
          currentResult.requests.average_per_second
        ),
        error_rate_change_percent: this.calculatePercentChange(
          baselineResult.errors.rate_percent,
          currentResult.errors.rate_percent
        ),
        regression: false
      };
      
      // Mark as regression if significant degradation
      if (comparison.latency_p95_change_percent > 10 || 
          comparison.throughput_change_percent < -10 ||
          comparison.error_rate_change_percent > 50) {
        comparison.regression = true;
      }
      
      comparisons[scenarioName] = comparison;
    }
    
    return {
      hasBaseline: true,
      baseline_timestamp: this.baselines.timestamp,
      comparisons
    };
  }

  /**
   * Calculate percentage change
   */
  calculatePercentChange(baseline, current) {
    if (baseline === 0) return current > 0 ? 100 : 0;
    return ((current - baseline) / baseline) * 100;
  }

  /**
   * Generate comprehensive performance report
   */
  async generateReport(results, overallSuccess) {
    const baselineComparison = this.compareWithBaseline(results);
    
    const report = {
      timestamp: new Date().toISOString(),
      overall_success: overallSuccess,
      test_config: this.config,
      results: results,
      baseline_comparison: baselineComparison,
      summary: this.generateSummary(results),
      recommendations: this.generateRecommendations(results, baselineComparison)
    };
    
    // Save detailed report
    const reportPath = path.join(__dirname, '../../reports/performance-smoke-test.json');
    await this.ensureDirectoryExists(path.dirname(reportPath));
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Generate human-readable summary
    this.printReportSummary(report);
    
    return report;
  }

  /**
   * Generate performance summary
   */
  generateSummary(results) {
    const validResults = Object.values(results).filter(r => !r.error);
    
    if (validResults.length === 0) {
      return { status: 'error', message: 'No valid test results' };
    }
    
    const avgLatencyP95 = validResults.reduce((sum, r) => sum + r.latency.p95_ms, 0) / validResults.length;
    const avgThroughput = validResults.reduce((sum, r) => sum + r.requests.average_per_second, 0) / validResults.length;
    const avgErrorRate = validResults.reduce((sum, r) => sum + r.errors.rate_percent, 0) / validResults.length;
    
    return {
      total_scenarios: Object.keys(results).length,
      successful_scenarios: validResults.length,
      average_p95_latency_ms: Math.round(avgLatencyP95),
      average_throughput_rps: Math.round(avgThroughput),
      average_error_rate_percent: parseFloat(avgErrorRate.toFixed(2)),
      status: avgLatencyP95 <= this.config.budgets.p95_latency_ms ? 'good' : 'warning'
    };
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations(results, baselineComparison) {
    const recommendations = [];
    
    // Check for high latency
    for (const [name, result] of Object.entries(results)) {
      if (result.error) continue;
      
      if (result.latency.p95_ms > this.config.budgets.p95_latency_ms) {
        recommendations.push({
          type: 'latency',
          scenario: name,
          message: `P95 latency (${result.latency.p95_ms}ms) exceeds budget (${this.config.budgets.p95_latency_ms}ms)`,
          suggestions: [
            'Consider adding caching for this endpoint',
            'Optimize database queries',
            'Review application logic for bottlenecks'
          ]
        });
      }
      
      if (result.errors.rate_percent > this.config.budgets.error_rate_percent) {
        recommendations.push({
          type: 'errors',
          scenario: name,
          message: `Error rate (${result.errors.rate_percent}%) exceeds budget (${this.config.budgets.error_rate_percent}%)`,
          suggestions: [
            'Review application logs for error causes',
            'Implement better error handling',
            'Check for resource constraints'
          ]
        });
      }
    }
    
    // Check for regressions
    if (baselineComparison.hasBaseline) {
      for (const [name, comparison] of Object.entries(baselineComparison.comparisons)) {
        if (comparison.regression) {
          recommendations.push({
            type: 'regression',
            scenario: name,
            message: `Performance regression detected since baseline`,
            suggestions: [
              'Review recent code changes',
              'Check for new dependencies or database migrations',
              'Monitor resource usage patterns'
            ]
          });
        }
      }
    }
    
    return recommendations;
  }

  /**
   * Make a simple HTTP request for warm-up
   */
  async makeRequest(path) {
    try {
      const response = await fetch(`${this.config.baseUrl}${path}`);
      return response.status;
    } catch (error) {
      throw new Error(`Failed to reach ${path}: ${error.message}`);
    }
  }

  /**
   * Ensure directory exists
   */
  async ensureDirectoryExists(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  /**
   * Print human-readable report summary
   */
  printReportSummary(report) {
    console.log('\n📊 Performance Test Report');
    console.log('='.repeat(50));
    console.log(`📅 Timestamp: ${report.timestamp}`);
    console.log(`✅ Overall Success: ${report.overall_success ? 'PASS' : 'FAIL'}`);
    console.log(`📈 Test Duration: ${this.config.testDuration}s`);
    console.log(`🔗 Connections: ${this.config.connections}`);
    
    console.log('\n📋 Summary:');
    const summary = report.summary;
    console.log(`  Total Scenarios: ${summary.total_scenarios}`);
    console.log(`  Successful: ${summary.successful_scenarios}`);
    console.log(`  Avg P95 Latency: ${summary.average_p95_latency_ms}ms`);
    console.log(`  Avg Throughput: ${summary.average_throughput_rps} RPS`);
    console.log(`  Avg Error Rate: ${summary.average_error_rate_percent}%`);
    
    if (report.baseline_comparison.hasBaseline) {
      console.log('\n📊 Baseline Comparison:');
      console.log(`  Baseline Date: ${report.baseline_comparison.baseline_timestamp}`);
      
      for (const [scenario, comparison] of Object.entries(report.baseline_comparison.comparisons)) {
        const regressionFlag = comparison.regression ? '🔴' : '🟢';
        console.log(`  ${regressionFlag} ${scenario}:`);
        console.log(`    Latency: ${comparison.latency_p95_change_percent > 0 ? '+' : ''}${comparison.latency_p95_change_percent.toFixed(1)}%`);
        console.log(`    Throughput: ${comparison.throughput_change_percent > 0 ? '+' : ''}${comparison.throughput_change_percent.toFixed(1)}%`);
      }
    }
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. [${rec.type.toUpperCase()}] ${rec.scenario}: ${rec.message}`);
      });
    }
    
    console.log(`\n📄 Detailed report saved to: reports/performance-smoke-test.json`);
  }
}

// CLI interface for standalone testing
if (require.main === module) {
  const tester = new PerformanceTester({
    baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
    testDuration: parseInt(process.env.TEST_DURATION) || 30,
    connections: parseInt(process.env.TEST_CONNECTIONS) || 10
  });
  
  tester.runTestSuite()
    .then(report => {
      process.exit(report.overall_success ? 0 : 1);
    })
    .catch(error => {
      console.error('Performance test suite failed:', error);
      process.exit(1);
    });
}

module.exports = PerformanceTester;
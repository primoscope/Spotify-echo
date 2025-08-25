/**
 * Performance Testing Suite for EchoTune AI
 * Load testing and baseline establishment for AI routing and recommendation systems
 */

const AgentRouter = require('../../src/ai/agent/router');
const recommendationEngine = require('../../src/ml/recommendation-engine-enhanced');
const PlaylistClusterer = require('../../src/ml/playlist-clustering');

class PerformanceTestSuite {
  constructor() {
    this.router = null;
    this.recommendationEngine = null;
    this.clusterer = null;
    this.results = {
      aiRouting: {},
      recommendations: {},
      clustering: {},
      baseline: {}
    };
  }

  /**
   * Initialize all test components
   */
  async initialize() {
    console.log('🚀 Initializing Performance Test Suite...');
    
    this.router = new AgentRouter();
    this.recommendationEngine = recommendationEngine;
    this.clusterer = new PlaylistClusterer();
    
    // Initialize recommendation engine
    await this.recommendationEngine.initialize();
    
    console.log('✅ Performance Test Suite initialized');
  }

  /**
   * Run complete performance test suite
   */
  async runFullSuite(options = {}) {
    const {
      iterations = 100,
      concurrency = 10,
      warmupIterations = 10,
      timeoutMs = 30000
    } = options;

    console.log('📊 Starting Performance Test Suite...');
    console.log(`Iterations: ${iterations}, Concurrency: ${concurrency}, Warmup: ${warmupIterations}`);

    try {
      // Warmup phase
      console.log('🔥 Warming up systems...');
      await this.warmupPhase(warmupIterations);

      // AI Routing Performance
      console.log('🧠 Testing AI Routing Performance...');
      this.results.aiRouting = await this.testAIRoutingPerformance(iterations, concurrency);

      // Recommendation Performance  
      console.log('🎵 Testing Recommendation Performance...');
      this.results.recommendations = await this.testRecommendationPerformance(iterations, concurrency);

      // Clustering Performance
      console.log('🎯 Testing Clustering Performance...');
      this.results.clustering = await this.testClusteringPerformance(Math.min(iterations, 20), 1);

      // Generate baseline metrics
      console.log('📈 Generating Baseline Metrics...');
      this.results.baseline = this.generateBaseline();

      // Print results
      this.printResults();

      return this.results;
    } catch (error) {
      console.error('❌ Performance test suite failed:', error);
      throw error;
    }
  }

  /**
   * Warmup phase to stabilize performance
   */
  async warmupPhase(iterations) {
    const warmupRequests = [];
    
    for (let i = 0; i < iterations; i++) {
      warmupRequests.push(this.singleAIRoutingTest());
    }
    
    await Promise.allSettled(warmupRequests);
    console.log(`✅ Warmup complete: ${iterations} requests`);
  }

  /**
   * Test AI routing performance
   */
  async testAIRoutingPerformance(iterations, concurrency) {
    const strategies = ['balanced', 'low-cost', 'low-latency', 'high-quality'];
    const results = {};

    for (const strategy of strategies) {
      console.log(`  Testing strategy: ${strategy}`);
      results[strategy] = await this.runConcurrentAITests(iterations, concurrency, strategy);
    }

    return results;
  }

  /**
   * Run concurrent AI routing tests
   */
  async runConcurrentAITests(iterations, concurrency, strategy) {
    const batches = Math.ceil(iterations / concurrency);
    const allResults = [];

    for (let batch = 0; batch < batches; batch++) {
      const batchSize = Math.min(concurrency, iterations - batch * concurrency);
      const batchPromises = [];

      for (let i = 0; i < batchSize; i++) {
        batchPromises.push(this.singleAIRoutingTest(strategy));
      }

      const batchResults = await Promise.allSettled(batchPromises);
      allResults.push(...batchResults.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean));
    }

    return this.calculateStatistics(allResults);
  }

  /**
   * Single AI routing test
   */
  async singleAIRoutingTest(strategy = 'balanced') {
    const startTime = performance.now();
    
    try {
      const request = {
        type: 'text-generation',
        payload: { content: `Performance test request for ${strategy} strategy` },
        options: {}
      };

      const response = await this.router.route(request, { strategy });
      const endTime = performance.now();
      
      return {
        success: true,
        latency: endTime - startTime,
        strategy,
        responseLength: (response.content || response.text || '').length,
        provider: response.provider || 'unknown'
      };
    } catch (error) {
      const endTime = performance.now();
      return {
        success: false,
        latency: endTime - startTime,
        strategy,
        error: error.message
      };
    }
  }

  /**
   * Test recommendation performance
   */
  async testRecommendationPerformance(iterations, concurrency) {
    console.log('  Testing recommendation generation...');
    
    const testCases = [
      { userId: 'perf_test_user_1', limit: 10 },
      { userId: 'perf_test_user_2', limit: 20 },
      { userId: 'perf_test_user_3', limit: 50 }
    ];

    const results = {};

    for (const testCase of testCases) {
      const key = `limit_${testCase.limit}`;
      results[key] = await this.runConcurrentRecommendationTests(
        Math.ceil(iterations / testCases.length), 
        concurrency, 
        testCase
      );
    }

    return results;
  }

  /**
   * Run concurrent recommendation tests
   */
  async runConcurrentRecommendationTests(iterations, concurrency, testCase) {
    const batches = Math.ceil(iterations / concurrency);
    const allResults = [];

    for (let batch = 0; batch < batches; batch++) {
      const batchSize = Math.min(concurrency, iterations - batch * concurrency);
      const batchPromises = [];

      for (let i = 0; i < batchSize; i++) {
        batchPromises.push(this.singleRecommendationTest(testCase));
      }

      const batchResults = await Promise.allSettled(batchPromises);
      allResults.push(...batchResults.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean));
    }

    return this.calculateStatistics(allResults);
  }

  /**
   * Single recommendation test
   */
  async singleRecommendationTest(testCase) {
    const startTime = performance.now();
    
    try {
      const recommendations = await this.recommendationEngine.generateRecommendations(
        testCase.userId, 
        { 
          limit: testCase.limit,
          context: { mode: 'performance_test' }
        }
      );
      
      const endTime = performance.now();
      
      return {
        success: true,
        latency: endTime - startTime,
        recommendationCount: recommendations.length,
        userId: testCase.userId,
        limit: testCase.limit
      };
    } catch (error) {
      const endTime = performance.now();
      return {
        success: false,
        latency: endTime - startTime,
        error: error.message
      };
    }
  }

  /**
   * Test clustering performance
   */
  async testClusteringPerformance(iterations, concurrency) {
    console.log('  Testing clustering performance...');
    
    const testCases = [
      { trackCount: 50, k: 3 },
      { trackCount: 100, k: 5 },
      { trackCount: 200, k: 8 }
    ];

    const results = {};

    for (const testCase of testCases) {
      const key = `tracks_${testCase.trackCount}_k${testCase.k}`;
      results[key] = await this.runClusteringTests(
        Math.ceil(iterations / testCases.length), 
        testCase
      );
    }

    return results;
  }

  /**
   * Run clustering tests
   */
  async runClusteringTests(iterations, testCase) {
    const allResults = [];

    for (let i = 0; i < iterations; i++) {
      const result = await this.singleClusteringTest(testCase);
      if (result) {
        allResults.push(result);
      }
    }

    return this.calculateStatistics(allResults);
  }

  /**
   * Single clustering test
   */
  async singleClusteringTest(testCase) {
    const startTime = performance.now();
    
    try {
      // Generate mock track IDs for testing
      const trackIds = Array.from({ length: testCase.trackCount }, (_, i) => `test_track_${i}`);
      
      // Mock the clustering since we don't have real audio features in test environment
      const mockClusterResults = {
        clusterId: `test_cluster_${Date.now()}`,
        clusters: Array.from({ length: testCase.k }, (_, i) => 
          trackIds.slice(i * Math.floor(trackIds.length / testCase.k), (i + 1) * Math.floor(trackIds.length / testCase.k))
        ),
        centroids: Array.from({ length: testCase.k }, () => Array.from({ length: 8 }, () => Math.random())),
        labels: Array.from({ length: testCase.k }, (_, i) => `Test Cluster ${i + 1}`),
        metrics: { clusterSizes: Array.from({ length: testCase.k }, () => Math.floor(trackIds.length / testCase.k)) }
      };
      
      const endTime = performance.now();
      
      return {
        success: true,
        latency: endTime - startTime,
        trackCount: testCase.trackCount,
        k: testCase.k,
        clusterCount: mockClusterResults.clusters.length
      };
    } catch (error) {
      const endTime = performance.now();
      return {
        success: false,
        latency: endTime - startTime,
        error: error.message
      };
    }
  }

  /**
   * Calculate statistics for performance results
   */
  calculateStatistics(results) {
    if (results.length === 0) {
      return { count: 0, error: 'No results to analyze' };
    }

    const successful = results.filter(r => r.success);
    const latencies = successful.map(r => r.latency);
    
    if (latencies.length === 0) {
      return {
        count: results.length,
        successRate: 0,
        errors: results.map(r => r.error).filter(Boolean)
      };
    }

    latencies.sort((a, b) => a - b);
    
    const stats = {
      count: results.length,
      successCount: successful.length,
      successRate: (successful.length / results.length * 100).toFixed(2) + '%',
      latency: {
        min: Math.min(...latencies).toFixed(2),
        max: Math.max(...latencies).toFixed(2),
        mean: (latencies.reduce((sum, val) => sum + val, 0) / latencies.length).toFixed(2),
        p50: latencies[Math.floor(latencies.length * 0.5)].toFixed(2),
        p95: latencies[Math.floor(latencies.length * 0.95)].toFixed(2),
        p99: latencies[Math.floor(latencies.length * 0.99)].toFixed(2)
      }
    };

    // Add throughput calculation
    if (successful.length > 0) {
      const totalTime = Math.max(...latencies) - Math.min(...latencies);
      stats.throughput = totalTime > 0 ? (successful.length / (totalTime / 1000)).toFixed(2) + ' req/sec' : 'N/A';
    }

    return stats;
  }

  /**
   * Generate baseline performance metrics
   */
  generateBaseline() {
    const baseline = {
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      nodeVersion: process.version,
      platform: process.platform,
      recommendations: {}
    };

    // AI Routing baselines
    if (this.results.aiRouting) {
      baseline.aiRouting = {
        acceptableLatency: '< 2000ms',
        targetSuccessRate: '> 95%',
        targetThroughput: '> 10 req/sec'
      };
    }

    // Recommendation baselines
    if (this.results.recommendations) {
      baseline.recommendations = {
        acceptableLatency: '< 5000ms',
        targetSuccessRate: '> 90%',
        targetRecommendationCount: '> 0'
      };
    }

    // Clustering baselines
    if (this.results.clustering) {
      baseline.clustering = {
        acceptableLatency: '< 30000ms',
        targetSuccessRate: '> 80%',
        maxTrackCount: '< 1000'
      };
    }

    return baseline;
  }

  /**
   * Print formatted results
   */
  printResults() {
    console.log('\n📊 PERFORMANCE TEST RESULTS');
    console.log('===============================');

    // AI Routing Results
    if (this.results.aiRouting) {
      console.log('\n🧠 AI Routing Performance:');
      console.log('---------------------------');
      for (const [strategy, stats] of Object.entries(this.results.aiRouting)) {
        console.log(`${strategy.padEnd(15)}: ${stats.successRate} success, ${stats.latency?.mean}ms avg, ${stats.latency?.p95}ms p95`);
      }
    }

    // Recommendation Results
    if (this.results.recommendations) {
      console.log('\n🎵 Recommendation Performance:');
      console.log('------------------------------');
      for (const [testCase, stats] of Object.entries(this.results.recommendations)) {
        console.log(`${testCase.padEnd(15)}: ${stats.successRate} success, ${stats.latency?.mean}ms avg`);
      }
    }

    // Clustering Results
    if (this.results.clustering) {
      console.log('\n🎯 Clustering Performance:');
      console.log('--------------------------');
      for (const [testCase, stats] of Object.entries(this.results.clustering)) {
        console.log(`${testCase.padEnd(20)}: ${stats.successRate} success, ${stats.latency?.mean}ms avg`);
      }
    }

    console.log('\n✅ Performance testing complete!\n');
  }

  /**
   * Save results to file
   */
  async saveResults(filename = 'performance-test-results.json') {
    const fs = require('fs').promises;
    const path = require('path');
    
    const outputPath = path.join(process.cwd(), 'test-results', filename);
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    
    const output = {
      timestamp: new Date().toISOString(),
      results: this.results,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: process.memoryUsage(),
        cpus: require('os').cpus().length
      }
    };
    
    await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
    console.log(`💾 Results saved to: ${outputPath}`);
  }
}

module.exports = PerformanceTestSuite;
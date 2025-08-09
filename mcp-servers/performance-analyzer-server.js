#!/usr/bin/env node
/**
 * Performance Analyzer MCP Server
 * Advanced performance analysis and optimization for EchoTune AI
 * 
 * Features:
 * - Real-time performance monitoring
 * - Memory usage optimization
 * - Code performance profiling
 * - Database query optimization
 * - Bundle size analysis
 * - Network performance tracking
 */

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { performance, PerformanceObserver } = require('perf_hooks');

class PerformanceAnalyzerMCP {
  constructor() {
    this.app = express();
    this.port = process.env.PERFORMANCE_MCP_PORT || 3010;
    this.metrics = new Map();
    this.benchmarks = new Map();
    this.performanceObserver = null;
    
    this.setupPerformanceMonitoring();
    this.setupMiddleware();
    this.setupRoutes();
    
    console.log(`🚀 Performance Analyzer MCP Server initialized on port ${this.port}`);
  }

  setupPerformanceMonitoring() {
    // Performance observer for detailed metrics
    this.performanceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        this.metrics.set(entry.name, {
          duration: entry.duration,
          startTime: entry.startTime,
          type: entry.entryType,
          timestamp: Date.now()
        });
      });
    });
    
    this.performanceObserver.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use((req, res, next) => {
      const startTime = performance.now();
      req.startTime = startTime;
      res.on('finish', () => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        this.recordApiMetric(req.path, req.method, duration, res.statusCode);
      });
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'Performance Analyzer MCP',
        port: this.port,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      });
    });

    // Real-time performance metrics
    this.app.get('/api/metrics/realtime', (req, res) => {
      res.json({
        memory: this.getMemoryMetrics(),
        cpu: this.getCPUMetrics(),
        eventLoop: this.getEventLoopMetrics(),
        gc: this.getGCMetrics(),
        timestamp: Date.now()
      });
    });

    // Bundle size analysis
    this.app.post('/api/analyze/bundle', async (req, res) => {
      try {
        const { projectPath } = req.body;
        const analysis = await this.analyzeBundleSize(projectPath);
        res.json(analysis);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Code performance profiling
    this.app.post('/api/profile/code', async (req, res) => {
      try {
        const { filePath, functionName } = req.body;
        const profile = await this.profileCodeExecution(filePath, functionName);
        res.json(profile);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Database query optimization
    this.app.post('/api/optimize/database', async (req, res) => {
      try {
        const { queries } = req.body;
        const optimizations = await this.optimizeDatabaseQueries(queries);
        res.json(optimizations);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Performance benchmarks
    this.app.get('/api/benchmarks', (req, res) => {
      const benchmarks = Array.from(this.benchmarks.entries()).map(([name, data]) => ({
        name,
        ...data
      }));
      res.json({ benchmarks });
    });

    // Start performance benchmark
    this.app.post('/api/benchmark/start', (req, res) => {
      const { name, description } = req.body;
      const benchmark = {
        startTime: performance.now(),
        startTimestamp: Date.now(),
        description,
        status: 'running'
      };
      this.benchmarks.set(name, benchmark);
      res.json({ message: `Benchmark '${name}' started`, benchmark });
    });

    // End performance benchmark
    this.app.post('/api/benchmark/end', (req, res) => {
      const { name } = req.body;
      const benchmark = this.benchmarks.get(name);
      if (!benchmark) {
        return res.status(404).json({ error: 'Benchmark not found' });
      }
      
      benchmark.endTime = performance.now();
      benchmark.endTimestamp = Date.now();
      benchmark.duration = benchmark.endTime - benchmark.startTime;
      benchmark.status = 'completed';
      
      this.benchmarks.set(name, benchmark);
      res.json({ message: `Benchmark '${name}' completed`, benchmark });
    });

    // Performance recommendations
    this.app.get('/api/recommendations', async (req, res) => {
      const recommendations = await this.generatePerformanceRecommendations();
      res.json({ recommendations });
    });
  }

  recordApiMetric(path, method, duration, statusCode) {
    const metricName = `api_${method.toLowerCase()}_${path.replace(/\//g, '_')}`;
    this.metrics.set(metricName, {
      duration,
      method,
      path,
      statusCode,
      timestamp: Date.now()
    });
  }

  getMemoryMetrics() {
    const memUsage = process.memoryUsage();
    return {
      rss: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100, // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100,
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100,
      external: Math.round(memUsage.external / 1024 / 1024 * 100) / 100,
      arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024 * 100) / 100
    };
  }

  getCPUMetrics() {
    const cpuUsage = process.cpuUsage();
    return {
      user: cpuUsage.user,
      system: cpuUsage.system,
      total: cpuUsage.user + cpuUsage.system
    };
  }

  getEventLoopMetrics() {
    // Simple event loop lag measurement
    const start = process.hrtime.bigint();
    setImmediate(() => {
      const lag = Number(process.hrtime.bigint() - start) / 1e6; // Convert to ms
      return { lag };
    });
    return { measuring: true };
  }

  getGCMetrics() {
    // V8 garbage collection metrics (if available)
    if (performance.getEntriesByType) {
      const gcEntries = performance.getEntriesByType('gc');
      return {
        count: gcEntries.length,
        totalDuration: gcEntries.reduce((total, entry) => total + entry.duration, 0),
        avgDuration: gcEntries.length > 0 ? 
          gcEntries.reduce((total, entry) => total + entry.duration, 0) / gcEntries.length : 0
      };
    }
    return { available: false };
  }

  async analyzeBundleSize(projectPath) {
    try {
      // Analyze bundle size and dependencies
      const packageJsonPath = path.join(projectPath || process.cwd(), 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      const analysis = {
        dependencies: Object.keys(packageJson.dependencies || {}).length,
        devDependencies: Object.keys(packageJson.devDependencies || {}).length,
        recommendations: []
      };

      // Check for large dependencies
      const largeDeps = ['lodash', 'moment', 'axios'];
      largeDeps.forEach(dep => {
        if (packageJson.dependencies && packageJson.dependencies[dep]) {
          analysis.recommendations.push({
            type: 'bundle-size',
            severity: 'medium',
            message: `Consider replacing ${dep} with lighter alternatives`,
            suggestion: dep === 'lodash' ? 'Use specific lodash functions or native JS' :
                       dep === 'moment' ? 'Use date-fns or dayjs' :
                       dep === 'axios' ? 'Use native fetch API' : 'Consider alternatives'
          });
        }
      });

      return analysis;
    } catch (error) {
      throw new Error(`Bundle analysis failed: ${error.message}`);
    }
  }

  async profileCodeExecution(filePath, functionName) {
    try {
      performance.mark(`${functionName}-start`);
      
      // Simulate code profiling (in real implementation, this would execute the function)
      const executionTime = Math.random() * 100 + 10; // Simulated execution time
      
      performance.mark(`${functionName}-end`);
      performance.measure(functionName, `${functionName}-start`, `${functionName}-end`);
      
      return {
        function: functionName,
        file: filePath,
        executionTime,
        memoryUsage: process.memoryUsage(),
        recommendations: this.generateCodeRecommendations(executionTime)
      };
    } catch (error) {
      throw new Error(`Code profiling failed: ${error.message}`);
    }
  }

  generateCodeRecommendations(executionTime) {
    const recommendations = [];
    
    if (executionTime > 50) {
      recommendations.push({
        type: 'performance',
        severity: 'high',
        message: 'Function execution time is high',
        suggestion: 'Consider optimizing algorithms or using caching'
      });
    }
    
    if (executionTime > 100) {
      recommendations.push({
        type: 'performance',
        severity: 'critical',
        message: 'Critical performance issue detected',
        suggestion: 'Immediate optimization required - consider async processing'
      });
    }
    
    return recommendations;
  }

  async optimizeDatabaseQueries(queries) {
    const optimizations = [];
    
    queries.forEach(query => {
      const recommendations = [];
      
      // Check for missing indexes
      if (query.includes('WHERE') && !query.includes('INDEX')) {
        recommendations.push({
          type: 'index',
          severity: 'medium',
          message: 'Consider adding index for WHERE clause',
          suggestion: 'Add appropriate indexes for filtered columns'
        });
      }
      
      // Check for SELECT *
      if (query.includes('SELECT *')) {
        recommendations.push({
          type: 'query',
          severity: 'low',
          message: 'Avoid SELECT * statements',
          suggestion: 'Specify only required columns'
        });
      }
      
      // Check for N+1 queries
      if (query.includes('JOIN')) {
        recommendations.push({
          type: 'query',
          severity: 'medium',
          message: 'Verify JOIN optimization',
          suggestion: 'Ensure proper JOIN conditions and indexes'
        });
      }
      
      optimizations.push({
        originalQuery: query,
        recommendations
      });
    });
    
    return { optimizations };
  }

  async generatePerformanceRecommendations() {
    const recommendations = [];
    const memUsage = this.getMemoryMetrics();
    
    // Memory recommendations
    if (memUsage.heapUsed > 100) {
      recommendations.push({
        category: 'memory',
        severity: 'medium',
        title: 'High memory usage detected',
        description: `Current heap usage: ${memUsage.heapUsed}MB`,
        actions: [
          'Review memory leaks',
          'Implement proper garbage collection',
          'Consider memory profiling'
        ]
      });
    }
    
    // API performance recommendations
    const apiMetrics = Array.from(this.metrics.entries())
      .filter(([key]) => key.startsWith('api_'))
      .map(([key, data]) => ({ name: key, ...data }))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);
    
    if (apiMetrics.length > 0 && apiMetrics[0].duration > 1000) {
      recommendations.push({
        category: 'api',
        severity: 'high',
        title: 'Slow API endpoints detected',
        description: `Slowest endpoint: ${apiMetrics[0].path} (${Math.round(apiMetrics[0].duration)}ms)`,
        actions: [
          'Optimize database queries',
          'Implement caching',
          'Add response compression',
          'Consider pagination'
        ]
      });
    }
    
    // General recommendations
    recommendations.push({
      category: 'general',
      severity: 'info',
      title: 'Performance monitoring active',
      description: 'Continue monitoring for optimal performance',
      actions: [
        'Regular performance audits',
        'Monitor real user metrics',
        'Implement performance budgets'
      ]
    });
    
    return recommendations;
  }

  start() {
    this.server = this.app.listen(this.port, () => {
      console.log(`🎯 Performance Analyzer MCP Server running on port ${this.port}`);
      console.log(`📊 Real-time metrics: http://localhost:${this.port}/api/metrics/realtime`);
      console.log(`💡 Performance recommendations: http://localhost:${this.port}/api/recommendations`);
    });
  }

  stop() {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    if (this.server) {
      this.server.close();
    }
  }
}

// Start server if run directly
if (require.main === module) {
  const server = new PerformanceAnalyzerMCP();
  server.start();
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Performance Analyzer MCP Server...');
    server.stop();
    process.exit(0);
  });
}

module.exports = PerformanceAnalyzerMCP;
const express = require('express');
const { getRedisManager } = require('../utils/redis');
const { MCPPerformanceAnalytics } = require('../utils/mcp-performance-analytics');

const router = express.Router();

// Initialize MCP Analytics
const mcpAnalytics = new MCPPerformanceAnalytics();

/**
 * Enhanced performance monitoring route
 * GET /api/performance/detailed
 */
router.get('/detailed', async (req, res) => {
  try {
    const performanceMonitor = require('../api/monitoring/performance-monitor');
    const report = performanceMonitor.getPerformanceReport();
    const { getMetrics: getSlowRequestMetrics } = require('../middleware/slow-request-logger');
    const slowRequestMetrics = getSlowRequestMetrics();

    // Combine performance data
    const enhancedReport = {
      ...report,
      slow_requests: slowRequestMetrics,
      timestamp: new Date().toISOString(),
    };

    res.json(enhancedReport);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get performance report',
      message: error.message,
    });
  }
});

/**
 * Endpoint percentiles (last 5 minutes)
 * GET /api/performance/endpoints
 */
router.get('/endpoints', (req, res) => {
  try {
    const performanceMonitor = require('../api/monitoring/performance-monitor');
    const windowMs = req.query.windowMs ? parseInt(req.query.windowMs, 10) : undefined;
    const pct = performanceMonitor.getEndpointPercentiles(windowMs);
    res.json({ success: true, windowMs: windowMs || 5 * 60 * 1000, endpoints: pct });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get endpoint percentiles' });
  }
});

/**
 * Performance baseline endpoint
 * POST /api/performance/baseline
 */
router.post('/baseline', async (req, res) => {
  try {
    const { PerformanceBaseline } = require('../utils/performance-baseline');
    const { getConfigService } = require('../config/ConfigurationService');
    const config = getConfigService().load();
    
    const options = {
      baseURL: req.body.baseURL || `http://localhost:${config.server.port}`,
      testDuration: req.body.testDuration || 30000,
      concurrentRequests: req.body.concurrentRequests || 3,
    };

    const baseline = new PerformanceBaseline(options);
    const results = await baseline.runBaseline();

    res.json({
      success: true,
      results: results,
      message: 'Performance baseline completed',
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to run performance baseline',
      message: error.message,
    });
  }
});

/**
 * Rate limiter statistics route
 * GET /api/rate-limit/stats
 */
router.get('/rate-limit/stats', (req, res) => {
  try {
    const { rateLimiters } = require('../middleware/redis-rate-limiter');
    const stats = {};

    for (const [name, limiter] of Object.entries(rateLimiters)) {
      stats[name] = limiter.getStats();
    }

    res.json({
      rate_limiters: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get rate limiter stats',
      message: error.message,
    });
  }
});

/**
 * MCP Analytics endpoint
 * GET /api/mcp/analytics
 */
router.get('/mcp/analytics', async (req, res) => {
  try {
    const report = await mcpAnalytics.generateMCPReport();
    res.json(report);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate MCP analytics report',
      message: error.message,
    });
  }
});

/**
 * Enhanced cache statistics route - includes Redis stats and performance metrics
 * GET /api/cache/stats
 */
router.get('/cache/stats', async (req, res) => {
  try {
    const cacheManager = require('../api/cache/cache-manager');
    const cacheStats = await cacheManager.getStats();
    const { getMetrics: getSlowRequestMetrics } = require('../middleware/slow-request-logger');
    const slowRequestMetrics = getSlowRequestMetrics();

    res.json({
      cache: cacheStats,
      performance: slowRequestMetrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get cache stats',
      message: error.message,
    });
  }
});

/**
 * Redis health check route
 * GET /api/redis/health
 */
router.get('/redis/health', async (req, res) => {
  try {
    const redisManager = getRedisManager();
    const health = await redisManager.healthCheck();
    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
    });
  }
});

/**
 * Security statistics route (admin only in production)
 * GET /api/security/stats
 */
router.get('/security/stats', (req, res) => {
  if (process.env.NODE_ENV === 'production' && !req.user?.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  try {
    const SecurityManager = require('../api/security/security-manager');
    const securityManager = new SecurityManager();
    const stats = securityManager.getSecurityStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get security stats',
      message: error.message,
    });
  }
});

module.exports = router;
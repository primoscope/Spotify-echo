/**
 * System monitoring routes
 * Extracted from server.js for better organization
 */

const express = require('express');
const router = express.Router();

// Import system utilities
const cacheManager = require('../api/cache/cache-manager');
const SecurityManager = require('../api/security/security-manager');
const securityManager = new SecurityManager();

// Rate limit stats endpoint
router.get('/rate-limit/stats', (req, res) => {
  try {
    // Get rate limiting statistics from performance monitor
    const performanceMonitor = require('../api/monitoring/performance-monitor');
    const rateLimitStats = performanceMonitor.getRateLimitStats();
    
    res.json({
      success: true,
      rateLimiting: rateLimitStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Rate limit stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Cache statistics endpoint
router.get('/cache/stats', async (req, res) => {
  try {
    const cacheStats = await cacheManager.getStats();
    res.json({
      success: true,
      cache: cacheStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cache stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Redis health endpoint
router.get('/redis/health', async (req, res) => {
  try {
    const { getRedisManager } = require('../utils/redis');
    const redisManager = getRedisManager();
    
    if (!redisManager || !redisManager.useRedis) {
      return res.json({
        success: true,
        redis: {
          status: 'disabled',
          message: 'Redis not configured or disabled'
        }
      });
    }
    
    const redisHealth = await redisManager.healthCheck();
    res.json({
      success: true,
      redis: redisHealth,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Redis health check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Security statistics route (admin only in production)
router.get('/security/stats', (req, res) => {
  if (process.env.NODE_ENV === 'production' && !req.user?.isAdmin) {
    return res.status(403).json({ 
      success: false,
      error: 'Admin access required' 
    });
  }
  
  try {
    const stats = securityManager.getSecurityStats();
    res.json({
      success: true,
      security: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Security stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Ready endpoint
router.get('/ready', (req, res) => {
  res.json({
    status: 'ready',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;
/**
 * Health check routes
 * Extracted from server.js for better organization
 */

const express = require('express');
const router = express.Router();

// Import health check utilities
const HealthCheckSystem = require('../utils/health-check');
const healthChecker = new HealthCheckSystem();

// Comprehensive health check endpoint (bypass rate limiting)
router.get('/', async (req, res) => {
  try {
    const healthResults = await healthChecker.runHealthChecks();
    
    // Determine overall status
    const allPassed = Object.values(healthResults).every(result => 
      result.status === 'pass' || result.status === 'warn'
    );
    
    const statusCode = allPassed ? 200 : 503;
    
    res.status(statusCode).json({
      status: allPassed ? 'pass' : 'fail',
      timestamp: new Date().toISOString(),
      checks: healthResults,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '2.1.0'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Specific health checks
router.get('/:check', async (req, res) => {
  const { check } = req.params;
  
  try {
    const result = await healthChecker.runSpecificCheck(check);
    
    if (!result) {
      return res.status(404).json({
        status: 'error',
        error: `Health check '${check}' not found`
      });
    }
    
    const statusCode = result.status === 'pass' ? 200 : 503;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error(`Health check '${check}' error:`, error);
    res.status(503).json({
      status: 'error',
      error: error.message,
      check
    });
  }
});

module.exports = router;
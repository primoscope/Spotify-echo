/**
 * Enhanced Metrics Routes for EchoTune AI Phase 2
 * Provides Prometheus exposition and health endpoints with optional authentication
 */

const express = require('express');
const { register } = require('../infra/observability/metrics');
const { execSync } = require('child_process');

const router = express.Router();

// Get git commit hash for health endpoint
function getCommitHash() {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    return 'unknown';
  }
}

/**
 * Health endpoint - /healthz
 * Returns basic status with uptime and commit info
 * No authentication required - suitable for load balancer health checks
 */
router.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime_s: Math.floor(process.uptime()),
    commit: getCommitHash(),
    timestamp: new Date().toISOString(),
    service: 'echotune-ai',
    version: process.env.npm_package_version || '2.1.0'
  });
});

/**
 * Metrics endpoint - /metrics  
 * Returns Prometheus exposition format metrics
 * Optional token authentication via X-Metrics-Token header
 */
router.get('/metrics', async (req, res) => {
  try {
    // Check if metrics authentication is enabled
    const metricsAuthToken = process.env.METRICS_AUTH_TOKEN;
    
    if (metricsAuthToken) {
      const providedToken = req.headers['x-metrics-token'];
      
      if (!providedToken) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'X-Metrics-Token header required'
        });
      }
      
      if (providedToken !== metricsAuthToken) {
        return res.status(403).json({
          error: 'Authentication failed',
          message: 'Invalid metrics token'
        });
      }
    }
    
    // Return Prometheus metrics
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    res.status(500).send(`# Metrics collection error\n${error.message}`);
  }
});

module.exports = router;
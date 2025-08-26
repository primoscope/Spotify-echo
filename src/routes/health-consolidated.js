/**
 * Consolidated Health Check Routes
 * Phase 5B: Extracted from server.js for modular health monitoring
 * Provides comprehensive health endpoints for infrastructure monitoring
 */

const express = require('express');
const router = express.Router();

/**
 * Configure health check routes
 * @param {Express} app - Express application instance
 */
function configureHealthRoutes(app) {
  // Enhanced health check endpoints
  const HealthCheckSystem = require('../utils/health-check');
  const healthChecker = new HealthCheckSystem();

  // Comprehensive health check endpoint (bypass rate limiting)
  app.get('/health', async (req, res) => {
    try {
      const healthReport = await healthChecker.runAllChecks();

      // For production deployment health checks, only fail on critical errors
      // Warnings and missing optional services should not cause 503s
      const hasCriticalErrors = Object.values(healthReport.checks).some(
        (check) => check.status === 'unhealthy' && !check.optional
      );

      const statusCode = hasCriticalErrors ? 503 : 200;
      res.status(statusCode).json(healthReport);
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Health check system failure',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Individual health check endpoints
  app.get('/health/:check', async (req, res) => {
    try {
      const checkName = req.params.check;
      const result = await healthChecker.runCheck(checkName);

      const statusCode = result.status === 'healthy' ? 200 : result.status === 'warning' ? 200 : 503;
      res.status(statusCode).json(result);
    } catch (error) {
      res.status(404).json({
        error: 'Invalid health check',
        message: error.message,
        availableChecks: Array.from(healthChecker.checks.keys()),
      });
    }
  });

  console.log('🏥 Health check routes configured');
}

module.exports = {
  configureHealthRoutes,
};
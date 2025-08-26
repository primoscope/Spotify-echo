/**
 * Metrics and AI routing routes
 * Extracted from server.js for better organization
 */

const express = require('express');
const router = express.Router();

// Prometheus metrics endpoint
router.get('/', async (req, res) => {
  try {
    // Try AI metrics first, fall back to Prometheus registry
    try {
      const aiMetrics = require('../metrics/aiMetrics');
      const metrics = await aiMetrics.getMetrics();
      
      res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
      res.send(metrics);
      return;
    } catch (aiError) {
      // Fall back to Prometheus registry
      const register = require('prom-client').register;
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    }
  } catch (error) {
    console.error('Metrics collection error:', error);
    res.status(500).json({
      error: 'Failed to collect metrics',
      message: error.message
    });
  }
});

// AI metrics endpoint
router.get('/ai', async (req, res) => {
  try {
    const aiMetrics = require('../metrics/aiMetrics');
    const values = await aiMetrics.getMetricValues();
    const report = await aiMetrics.generatePerformanceReport();
    const costReport = await aiMetrics.generateCostReport();
    
    res.json({
      success: true,
      data: {
        performance: report,
        cost: costReport,
        raw: values
      }
    });
  } catch (error) {
    console.error('Failed to get AI metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// AI routing analytics endpoint
router.get('/ai/routing', async (req, res) => {
  try {
    const AgentRouter = require('../ai/agent/router');
    const router = new AgentRouter();
    const analytics = router.getAnalytics();
    const health = await router.healthCheck();
    
    res.json({
      success: true,
      data: {
        analytics,
        health,
        providers: router.getProviders()
      }
    });
  } catch (error) {
    console.error('Failed to get routing analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// MCP analytics endpoint
router.get('/mcp', async (req, res) => {
  try {
    const MCPPerformanceAnalytics = require('../utils/mcp-performance-analytics');
    const analytics = new MCPPerformanceAnalytics();
    const mcpMetrics = await analytics.getMetrics();
    
    res.json({
      success: true,
      mcp: mcpMetrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('MCP analytics error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
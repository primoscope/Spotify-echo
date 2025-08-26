/**
 * Performance monitoring routes
 * Extracted from server.js for better organization
 */

const express = require('express');
const router = express.Router();

// Import performance monitoring utilities
const performanceMonitor = require('../api/monitoring/performance-monitor');

// Performance metrics endpoint
router.get('/', async (req, res) => {
  try {
    const perfStats = performanceMonitor.getPerformanceStats();
    res.json({
      success: true,
      ...perfStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Performance stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint performance stats
router.get('/endpoints', (req, res) => {
  try {
    const endpointStats = performanceMonitor.getEndpointStats();
    res.json({
      success: true,
      endpoints: endpointStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Endpoint stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Performance baseline endpoint
router.post('/baseline', async (req, res) => {
  try {
    const { duration = 30 } = req.body;
    
    // Validate duration
    if (duration < 10 || duration > 300) {
      return res.status(400).json({
        success: false,
        error: 'Duration must be between 10 and 300 seconds'
      });
    }
    
    const baseline = await performanceMonitor.createBaseline(duration);
    res.json({
      success: true,
      baseline,
      message: `Performance baseline created over ${duration} seconds`
    });
  } catch (error) {
    console.error('Performance baseline error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
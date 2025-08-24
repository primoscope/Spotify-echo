// Performance metrics API endpoint
const express = require('express');
const router = express.Router();

// Initialize global metrics store
if (!global.performanceMetrics) {
  global.performanceMetrics = [];
}

// Get performance metrics
router.get('/metrics', (req, res) => {
  const metrics = global.performanceMetrics.slice(-1000); // Last 1000 requests
  
  const analysis = {
    totalRequests: metrics.length,
    averageResponseTime: metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length || 0,
    slowRequests: metrics.filter(m => m.responseTime > 1000).length,
    fastRequests: metrics.filter(m => m.responseTime < 100).length,
    endpoints: {}
  };
  
  // Group by endpoint
  metrics.forEach(m => {
    const key = `${m.method} ${m.url}`;
    if (!analysis.endpoints[key]) {
      analysis.endpoints[key] = { count: 0, totalTime: 0, avgTime: 0 };
    }
    analysis.endpoints[key].count++;
    analysis.endpoints[key].totalTime += m.responseTime;
    analysis.endpoints[key].avgTime = analysis.endpoints[key].totalTime / analysis.endpoints[key].count;
  });
  
  res.json(analysis);
});

// Clear metrics
router.delete('/metrics', (req, res) => {
  global.performanceMetrics = [];
  res.json({ message: 'Performance metrics cleared' });
});

module.exports = router;
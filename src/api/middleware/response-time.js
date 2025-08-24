// Response time middleware for performance monitoring
const responseTime = require('response-time');

const responseTimeMiddleware = responseTime((req, res, time) => {
  // Log slow requests
  if (time > 1000) {
    console.warn(`Slow request: ${req.method} ${req.url} - ${time.toFixed(2)}ms`);
  }
  
  // Add performance header
  res.setHeader('X-Response-Time', `${time.toFixed(2)}ms`);
  
  // Optional: Store metrics for analytics
  if (global.performanceMetrics) {
    global.performanceMetrics.push({
      method: req.method,
      url: req.url,
      responseTime: time,
      timestamp: Date.now()
    });
  }
});

module.exports = responseTimeMiddleware;
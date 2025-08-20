/**
 * Response Time Optimization Middleware
 * Basic response time tracking and optimization
 */

const responseTime = require('response-time');

const responseTimeOptimization = responseTime((req, res, time) => {
  // Log slow responses
  if (time > 1000) {
    console.warn(`🐌 Slow response: ${req.method} ${req.url} - ${time}ms`);
  }

  // Add response time header
  res.set('X-Response-Time', `${time}ms`);
});

module.exports = responseTimeOptimization;
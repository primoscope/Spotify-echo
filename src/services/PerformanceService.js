/**
 * Performance Monitoring Service
 * Centralized performance tracking and analytics
 */

class PerformanceService {
  constructor() {
    this.metrics = {
      requests: new Map(),
      endpoints: new Map(),
      errors: new Map(),
      responseTime: []
    };
    this.startTime = Date.now();
  }

  trackRequest(method, path, duration, statusCode) {
    const timestamp = Date.now();
    const key = `${method} ${path}`;
    
    // Track endpoint statistics
    if (!this.metrics.endpoints.has(key)) {
      this.metrics.endpoints.set(key, {
        count: 0,
        totalDuration: 0,
        errors: 0,
        lastAccess: null
      });
    }
    
    const endpoint = this.metrics.endpoints.get(key);
    endpoint.count++;
    endpoint.totalDuration += duration;
    endpoint.lastAccess = timestamp;
    
    if (statusCode >= 400) {
      endpoint.errors++;
    }
    
    // Track response times (keep last 1000)
    this.metrics.responseTime.push({
      timestamp,
      duration,
      path,
      method,
      statusCode
    });
    
    if (this.metrics.responseTime.length > 1000) {
      this.metrics.responseTime.shift();
    }
  }

  getPerformanceStats() {
    const now = Date.now();
    const uptime = now - this.startTime;
    
    // Calculate overall statistics
    const totalRequests = Array.from(this.metrics.endpoints.values())
      .reduce((sum, ep) => sum + ep.count, 0);
    
    const totalErrors = Array.from(this.metrics.endpoints.values())
      .reduce((sum, ep) => sum + ep.errors, 0);
    
    const avgResponseTime = this.metrics.responseTime.length > 0
      ? this.metrics.responseTime.reduce((sum, r) => sum + r.duration, 0) / this.metrics.responseTime.length
      : 0;
    
    return {
      uptime,
      requests: {
        total: totalRequests,
        errors: totalErrors,
        errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0
      },
      performance: {
        avgResponseTime: Math.round(avgResponseTime),
        requestsPerSecond: totalRequests / (uptime / 1000)
      },
      memory: process.memoryUsage(),
      timestamp: now
    };
  }

  getEndpointStats() {
    const stats = {};
    
    for (const [endpoint, data] of this.metrics.endpoints) {
      stats[endpoint] = {
        requests: data.count,
        errors: data.errors,
        errorRate: data.count > 0 ? (data.errors / data.count) * 100 : 0,
        avgResponseTime: data.count > 0 ? Math.round(data.totalDuration / data.count) : 0,
        lastAccess: data.lastAccess
      };
    }
    
    return stats;
  }

  getRateLimitStats() {
    // This would typically integrate with rate limiting middleware
    // For now, return basic stats
    return {
      enabled: true,
      globalLimit: process.env.RATE_LIMIT_MAX || 1000,
      windowMs: process.env.RATE_LIMIT_WINDOW || 900000,
      // Additional rate limit stats would be gathered from middleware
    };
  }

  async createBaseline(durationSeconds = 30) {
    const startTime = Date.now();
    const baseline = {
      startTime,
      durationSeconds,
      metrics: {
        initialMemory: process.memoryUsage(),
        initialStats: this.getPerformanceStats()
      }
    };
    
    // Wait for the specified duration
    await new Promise(resolve => setTimeout(resolve, durationSeconds * 1000));
    
    baseline.endTime = Date.now();
    baseline.metrics.finalMemory = process.memoryUsage();
    baseline.metrics.finalStats = this.getPerformanceStats();
    
    // Calculate deltas
    baseline.deltas = {
      memoryGrowth: baseline.metrics.finalMemory.heapUsed - baseline.metrics.initialMemory.heapUsed,
      requestsProcessed: baseline.metrics.finalStats.requests.total - baseline.metrics.initialStats.requests.total,
      errorsDelta: baseline.metrics.finalStats.requests.errors - baseline.metrics.initialStats.requests.errors
    };
    
    return baseline;
  }

  // Middleware function for Express
  requestTracker() {
    return (req, res, next) => {
      const startTime = process.hrtime.bigint();
      
      res.on('finish', () => {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1e6; // Convert to milliseconds
        
        this.trackRequest(req.method, req.path, duration, res.statusCode);
      });
      
      next();
    };
  }
}

// Singleton instance
let instance = null;

function getPerformanceService() {
  if (!instance) {
    instance = new PerformanceService();
  }
  return instance;
}

module.exports = PerformanceService;
module.exports.getPerformanceService = getPerformanceService;
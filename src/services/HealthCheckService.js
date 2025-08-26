/**
 * Health Check Service
 * Centralized health checking logic
 */

class HealthCheckService {
  constructor() {
    this.checks = new Map();
    this.registerDefaultChecks();
  }

  registerDefaultChecks() {
    // Register basic system checks
    this.registerCheck('system', this.checkSystem.bind(this));
    this.registerCheck('memory', this.checkMemory.bind(this));
    this.registerCheck('database', this.checkDatabase.bind(this));
    this.registerCheck('redis', this.checkRedis.bind(this));
  }

  registerCheck(name, checkFunction) {
    this.checks.set(name, checkFunction);
  }

  async runAllChecks() {
    const results = {};
    
    for (const [name, checkFn] of this.checks) {
      try {
        results[name] = await checkFn();
      } catch (error) {
        results[name] = {
          status: 'fail',
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    }
    
    return results;
  }

  async runSpecificCheck(checkName) {
    const checkFn = this.checks.get(checkName);
    if (!checkFn) {
      return null;
    }

    try {
      return await checkFn();
    } catch (error) {
      return {
        status: 'fail',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async checkSystem() {
    const uptime = process.uptime();
    const memory = process.memoryUsage();
    
    return {
      status: 'pass',
      uptime: uptime,
      memory: {
        used: memory.rss,
        heap: memory.heapUsed,
        heapTotal: memory.heapTotal,
        external: memory.external
      },
      timestamp: new Date().toISOString()
    };
  }

  async checkMemory() {
    const memory = process.memoryUsage();
    const usedMB = memory.heapUsed / 1024 / 1024;
    const totalMB = memory.heapTotal / 1024 / 1024;
    const utilization = (usedMB / totalMB) * 100;

    const status = utilization > 90 ? 'fail' : utilization > 75 ? 'warn' : 'pass';

    return {
      status,
      metrics: {
        usedMB: Math.round(usedMB),
        totalMB: Math.round(totalMB),
        utilization: Math.round(utilization)
      },
      timestamp: new Date().toISOString()
    };
  }

  async checkDatabase() {
    try {
      // Import database manager to check connection
      const DatabaseManager = require('../database/manager');
      const status = DatabaseManager.getStatus();
      
      return {
        status: status.connected ? 'pass' : 'fail',
        database: status,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'fail',
        error: 'Database connection check failed',
        details: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async checkRedis() {
    try {
      const { getRedisManager } = require('../utils/redis');
      const redisManager = getRedisManager();
      
      if (!redisManager || !redisManager.useRedis) {
        return {
          status: 'pass',
          message: 'Redis not configured',
          timestamp: new Date().toISOString()
        };
      }
      
      const health = await redisManager.healthCheck();
      return {
        status: health.connected ? 'pass' : 'fail',
        redis: health,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'fail',
        error: 'Redis health check failed',
        details: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = HealthCheckService;
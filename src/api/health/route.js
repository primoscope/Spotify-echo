const express = require('express');
const router = express.Router();
const { success, error } = require('../utils/response-formatter');
const { getRedisManager } = require('../../utils/redis');
const packageJson = require('../../../package.json');

// Health check with dependency validation
router.get('/health', async (req, res) => {
  const startTime = Date.now();
  let overallStatus = 'ok';
  
  const healthChecks = {
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    version: packageJson.version,
    timestamp: new Date().toISOString(),
    redis: 'unknown',
    mongo: 'unknown',
    checks: {}
  };

  // Check Redis connection
  try {
    const redisManager = getRedisManager();
    if (redisManager && redisManager.isConnected && redisManager.isConnected()) {
      const pingStart = Date.now();
      await Promise.race([
        redisManager.ping(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 500))
      ]);
      healthChecks.redis = 'ok';
      healthChecks.checks.redis = { 
        status: 'ok', 
        responseTime: Date.now() - pingStart 
      };
    } else {
      healthChecks.redis = 'down';
      healthChecks.checks.redis = { 
        status: 'down', 
        error: 'Not connected' 
      };
      overallStatus = 'degraded';
    }
  } catch (error) {
    healthChecks.redis = 'down';
    healthChecks.checks.redis = { 
      status: 'down', 
      error: error.message 
    };
    overallStatus = 'degraded';
  }

  // Check MongoDB connection
  try {
    const mongodb = require('mongodb');
    if (process.env.MONGODB_URI) {
      const mongoStart = Date.now();
      const client = new mongodb.MongoClient(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 500,
        connectTimeoutMS: 500
      });
      
      await Promise.race([
        client.connect().then(() => client.db().admin().ping()).finally(() => client.close()),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 500))
      ]);
      
      healthChecks.mongo = 'ok';
      healthChecks.checks.mongo = { 
        status: 'ok', 
        responseTime: Date.now() - mongoStart 
      };
    } else {
      healthChecks.mongo = 'not_configured';
      healthChecks.checks.mongo = { 
        status: 'not_configured', 
        error: 'MONGODB_URI not set' 
      };
    }
  } catch (error) {
    healthChecks.mongo = 'down';
    healthChecks.checks.mongo = { 
      status: 'down', 
      error: error.message 
    };
    overallStatus = 'degraded';
  }

  // Update overall status
  healthChecks.status = overallStatus;
  healthChecks.responseTime = Date.now() - startTime;

  // Return appropriate HTTP status
  const httpStatus = overallStatus === 'ok' ? 200 : 503;
  const responseBody = httpStatus === 200 ? success(healthChecks) : error('Health check failed', healthChecks);
  
  res.status(httpStatus).json(responseBody);
});

module.exports = router;

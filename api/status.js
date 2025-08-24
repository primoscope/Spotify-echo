/**
 * Vercel serverless function for basic status endpoint
 * Provides system status without sensitive information
 */
const { ENV } = require('../src/config/env');

module.exports = async (req, res) => {
  try {
    const memory = process.memoryUsage();
    const uptime = process.uptime();
    
    const status = {
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      environment: ENV.NODE_ENV || 'development',
      version: process.env.npm_package_version || '2.1.0',
      
      // Process information (safe to expose)
      process: {
        pid: process.pid,
        memory: {
          used: Math.round(memory.rss / 1024 / 1024), // MB
          heap: Math.round(memory.heapUsed / 1024 / 1024), // MB
        }
      },
      
      // Feature flags (public info)
      features: {
        ssl: ENV.SSL_ENABLED === 'true',
        compression: ENV.COMPRESSION !== 'false',
        analytics: ENV.ENABLE_ANALYTICS_DASHBOARD !== 'false',
        streaming: true,
        voiceInput: true,
        mcp: true
      }
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=30'); // Cache for 30 seconds
    
    return res.status(200).json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Status check error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      status: {
        health: 'error',
        timestamp: new Date().toISOString()
      }
    });
  }
};
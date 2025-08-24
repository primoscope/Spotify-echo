/**
 * Vercel serverless function for health check endpoint
 * Extracts health check logic from existing system routes
 */
const { ENV } = require('../src/config/env');

module.exports = async (req, res) => {
  try {
    // Simple health check - responsive application
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '2.1.0',
      environment: ENV.NODE_ENV || 'development'
    };

    // Set appropriate headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    return res.status(200).json({
      success: true,
      health
    });
  } catch (error) {
    console.error('Health check error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      health: {
        status: 'error',
        timestamp: new Date().toISOString()
      }
    });
  }
};
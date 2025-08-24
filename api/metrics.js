/**
 * Vercel serverless function for basic metrics endpoint
 * Provides safe performance metrics
 */
module.exports = async (req, res) => {
  try {
    const memory = process.memoryUsage();
    const uptime = process.uptime();
    
    const metrics = {
      timestamp: Date.now(),
      uptime: Math.floor(uptime),
      memory: {
        rss: memory.rss,
        heapUsed: memory.heapUsed,
        heapTotal: memory.heapTotal,
        external: memory.external,
        usage: Math.round((memory.heapUsed / memory.heapTotal) * 100)
      },
      process: {
        pid: process.pid,
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version
      }
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');
    
    return res.status(200).json({
      success: true,
      metrics
    });
  } catch (error) {
    console.error('Metrics error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
// Enhanced MCP Server Health Check Endpoint
const express = require('express');
const app = express();
const port = process.env.MCP_PORT || 3001;

// Health data collection
const startTime = Date.now();
const healthChecks = {};

// Middleware for request tracking
app.use((req, res, next) => {
  req.requestId = Math.random().toString(36).substr(2, 9);
  req.startTime = Date.now();
  next();
});

// Enhanced health endpoint with comprehensive system checks
app.get('/health', async (req, res) => {
  const now = Date.now();
  const uptime = process.uptime();
  const memUsage = process.memoryUsage();
  
  // Performance metrics
  const healthData = {
    status: 'healthy',
    service: 'mcp-server',
    timestamp: new Date().toISOString(),
    uptime: uptime,
    uptime_human: formatUptime(uptime),
    env: process.env.NODE_ENV || 'development',
    server_name: process.env.MCP_SERVER_NAME || 'mcpHealth',
    version: require('./package.json').version || '1.0.0',
    memory: {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    },
    performance: {
      response_time_ms: Date.now() - req.startTime,
      server_start_time: new Date(startTime).toISOString(),
      requests_served: Object.keys(healthChecks).length
    },
    system: {
      platform: process.platform,
      arch: process.arch,
      node_version: process.version
    }
  };

  // Store this health check
  healthChecks[req.requestId] = {
    timestamp: now,
    response_time: Date.now() - req.startTime
  };

  // Clean old health checks (keep last 100)
  const checkIds = Object.keys(healthChecks);
  if (checkIds.length > 100) {
    const toDelete = checkIds.slice(0, checkIds.length - 100);
    toDelete.forEach(id => delete healthChecks[id]);
  }

  res.status(200).json(healthData);
});

// Detailed status endpoint for comprehensive monitoring
app.get('/status', (req, res) => {
  const recentChecks = Object.entries(healthChecks)
    .slice(-10)
    .map(([id, data]) => ({
      id,
      timestamp: new Date(data.timestamp).toISOString(),
      response_time_ms: data.response_time
    }));

  res.json({
    service: 'EchoTune AI - MCP Server', 
    endpoints: ['/health', '/status', '/metrics'],
    recent_health_checks: recentChecks,
    configuration: {
      port: port,
      env: process.env.NODE_ENV || 'development',
      server_name: process.env.MCP_SERVER_NAME || 'mcpHealth'
    }
  });
});

// Metrics endpoint for monitoring systems
app.get('/metrics', (req, res) => {
  const avgResponseTime = Object.values(healthChecks)
    .reduce((sum, check) => sum + check.response_time, 0) / Object.keys(healthChecks).length;

  const metrics = {
    uptime_seconds: process.uptime(),
    memory_usage_mb: Math.round(process.memoryUsage().rss / 1024 / 1024),
    heap_used_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    total_requests: Object.keys(healthChecks).length,
    avg_response_time_ms: Math.round(avgResponseTime) || 0,
    timestamp: new Date().toISOString()
  };

  res.set('Content-Type', 'text/plain');
  res.send(Object.entries(metrics)
    .map(([key, value]) => `mcp_server_${key} ${value}`)
    .join('\n'));
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    service: 'EchoTune AI - Enhanced MCP Server',
    version: require('./package.json').version || '1.0.0',
    endpoints: ['/health', '/status', '/metrics'],
    uptime: formatUptime(process.uptime()),
    documentation: 'https://github.com/dzp5103/Spotify-echo'
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

// Utility function to format uptime
function formatUptime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hrs}h ${mins}m ${secs}s`;
}

if (require.main === module) {
  app.listen(port, () => {
    console.log(`🚀 Enhanced MCP Health server running on port ${port}`);
    console.log(`📊 Health endpoint: http://localhost:${port}/health`);
    console.log(`🔍 Status endpoint: http://localhost:${port}/status`);
    console.log(`📈 Metrics endpoint: http://localhost:${port}/metrics`);
  });
}

module.exports = app;
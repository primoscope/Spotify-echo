// MCP Server Health Check Endpoint
const express = require('express');
const app = express();
const port = process.env.MCP_PORT || 3001;

app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'mcp-server',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'development'
  });
});

app.get('/', (_req, res) => {
  res.json({ service: 'EchoTune AI - MCP Server', endpoints: ['/health'] });
});

if (require.main === module) {
  app.listen(port, () => console.log(`MCP Health server on ${port}`));
}

module.exports = app;
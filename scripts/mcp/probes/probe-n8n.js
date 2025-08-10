#!/usr/bin/env node
const path = require('path');

(async () => {
  try {
    const modPath = path.resolve(__dirname, '../../..', 'mcp-servers/new-candidates/n8n-mcp/integration.js');
    const Integration = require(modPath);
    const inst = new Integration();
    if (typeof inst.initialize === 'function') {
      await inst.initialize();
    } else if (typeof inst.setupConfiguration === 'function') {
      await inst.setupConfiguration();
    }
    console.log('n8n-mcp probe: OK');
  } catch (e) {
    if (process.env.N8N_BASE_URL && process.env.N8N_API_KEY) {
      console.error('n8n-mcp probe: FAILED', e?.message || e);
      process.exit(1);
    } else {
      console.log('n8n-mcp probe: skipped (missing N8N_* secrets)');
    }
  }
})();
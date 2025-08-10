#!/usr/bin/env node
const path = require('path');

(async () => {
  try {
    const modPath = path.resolve(__dirname, '../../..', 'mcp-servers/new-candidates/mongodb-mcp-server/integration.js');
    const Integration = require(modPath);
    const inst = new Integration();
    if (typeof inst.initialize === 'function') {
      await inst.initialize();
    } else if (typeof inst.setupConfiguration === 'function') {
      await inst.setupConfiguration();
    }
    console.log('mongodb-mcp-server probe: OK');
  } catch (e) {
    if (process.env.MONGODB_URI && process.env.MONGODB_DB) {
      console.error('mongodb-mcp-server probe: FAILED', e?.message || e);
      process.exit(1);
    } else {
      console.log('mongodb-mcp-server probe: skipped (missing MongoDB secrets)');
    }
  }
})();
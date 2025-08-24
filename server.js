#!/usr/bin/env node

/**
 * EchoTune AI - Root Server Entry Point
 * DigitalOcean App Platform compatible entry point
 * 
 * This file serves as the main entry point for deployment platforms
 * that expect server.js in the root directory (like DigitalOcean App Platform)
 */

// Initialize OpenTelemetry tracing before any other imports (with feature flag)
if (process.env.ENABLE_TRACING !== 'false') {
  require('./src/infra/observability/tracing').initializeTracing();
} else {
  console.log('⚪ OpenTelemetry tracing disabled (ENABLE_TRACING=false)');
}

// Load environment variables first
require('dotenv').config();

// Initialize AgentOps with feature flag
let agentops = null;
const enableAgentOps = process.env.ENABLE_AGENTOPS !== 'false' && process.env.AGENTOPS_API_KEY;

if (enableAgentOps) {
  try {
    agentops = require('agentops');
    agentops.init(process.env.AGENTOPS_API_KEY, {
      auto_start_session: false,
      tags: ['spotify-echo', 'server-entry', 'deployment']
    });
    console.log('🔍 AgentOps initialized from server entry point');
  } catch (error) {
    console.log('📊 AgentOps not available:', error.message);
  }
} else {
  console.log('⚪ AgentOps disabled (ENABLE_AGENTOPS=false or no API key)');
}

// Start the application by requiring the main server
require('./src/server');
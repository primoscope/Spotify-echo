#!/usr/bin/env node

/**
 * EchoTune AI - Root Server Entry Point
 * DigitalOcean App Platform compatible entry point
 * 
 * This file serves as the main entry point for deployment platforms
 * that expect server.js in the root directory (like DigitalOcean App Platform)
 */

// Initialize OpenTelemetry tracing before any other imports
require('./src/infra/observability/tracing').initializeTracing();

// Load environment variables first
require('dotenv').config();

// Initialize AgentOps
// Optional agentops integration
let agentops = null;
try {
  agentops = require('agentops');
} catch (error) {
  console.log('📊 AgentOps not installed, skipping telemetry integration');
}
if (process.env.AGENTOPS_API_KEY && agentops) {
  agentops.init(process.env.AGENTOPS_API_KEY, {
    auto_start_session: false,
    tags: ['spotify-echo', 'server-entry', 'deployment']
  });
  console.log('🔍 AgentOps initialized from server entry point');
} else {
  console.warn('⚠️ AGENTOPS_API_KEY not found, AgentOps disabled');
}

// Start the application by requiring the main server
require('./src/server');
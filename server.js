#!/usr/bin/env node

/**
 * EchoTune AI - Root Server Entry Point
 * DigitalOcean App Platform compatible entry point
 * 
 * This file serves as the main entry point for deployment platforms
 * that expect server.js in the root directory (like DigitalOcean App Platform)
 */

// Load environment variables first
require('dotenv').config();

// Initialize AgentOps
const agentops = require('agentops');
if (process.env.AGENTOPS_API_KEY) {
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
#!/usr/bin/env node

/**
 * EchoTune AI - Root Index Entry Point
 * DigitalOcean App Platform and other deployment platform compatible entry point
 * 
 * This file serves as an alternative entry point for deployment platforms
 * that expect index.js in the root directory
 */

// Load environment variables first
require('dotenv').config();

// Initialize AgentOps
const agentops = require('agentops');
if (process.env.AGENTOPS_API_KEY) {
  agentops.init(process.env.AGENTOPS_API_KEY, {
    auto_start_session: false,
    tags: ['spotify-echo', 'root-entry', 'deployment']
  });
  console.log('🔍 AgentOps initialized from root entry point');
} else {
  console.warn('⚠️ AGENTOPS_API_KEY not found, AgentOps disabled');
}

// Start the application by requiring the main server
require('./src/server');
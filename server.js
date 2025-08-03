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

// Start the application by requiring the main server
require('./src/server');
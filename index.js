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

// Start the application by requiring the main server
require('./src/server');
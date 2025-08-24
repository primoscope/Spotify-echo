const serverless = require('serverless-http');

// Ensure env is loaded for serverless invocations
try { require('dotenv').config(); } catch {}

// Import the existing Express app
const app = require('../src/server');

// Export serverless handler for Vercel
module.exports = serverless(app);
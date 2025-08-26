const express = require('express');
const path = require('path');

const router = express.Router();

/**
 * Main page - React Application
 * GET /
 */
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

/**
 * Legacy interface (for comparison)
 * GET /legacy
 */
router.get('/legacy', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

/**
 * Catch-all handler for React Router (client-side routing)
 * Handle all non-API routes for SPA
 */
router.get('*', (req, res) => {
  // Only serve the React app for non-API routes
  if (!req.path.startsWith('/api/') && !req.path.startsWith('/auth/') && !req.path.startsWith('/internal/')) {
    res.sendFile(path.join(__dirname, '../../dist/index.html'));
  } else {
    // Let the 404 handler take care of API routes
    const { createNotFoundError } = require('../errors/createError');
    const error = createNotFoundError('API Endpoint', req.path);
    
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp: error.timestamp
      }
    });
  }
});

module.exports = router;
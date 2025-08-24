'use strict';

const express = require('express');
const router = express.Router();
const { isReady } = require('../../infra/lifecycle/readiness');

/**
 * Readiness endpoint - separate from health checks
 * Returns 503 if app is not ready to serve traffic, 200 if ready
 */
router.get('/', (req, res) => {
  const ready = isReady();
  const response = {
    ready,
    timestamp: new Date().toISOString()
  };

  // Return 503 Service Unavailable if not ready, 200 OK if ready
  const statusCode = ready ? 200 : 503;
  res.status(statusCode).json(response);
});

module.exports = router;
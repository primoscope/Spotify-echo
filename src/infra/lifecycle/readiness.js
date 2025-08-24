'use strict';

/**
 * Application readiness state management
 * Separate from health checks - tracks whether app is ready to serve traffic
 */

let isAppReady = false;
const logger = require('../observability/logger');

/**
 * Set the application ready state
 * @param {boolean} ready - Ready state
 */
function setReady(ready = true) {
  const previousState = isAppReady;
  isAppReady = ready;
  
  logger.info({
    msg: 'Readiness state changed',
    previousState,
    currentState: ready,
    timestamp: new Date().toISOString()
  });
}

/**
 * Check if the application is ready
 * @returns {boolean} Ready state
 */
function isReady() {
  return isAppReady;
}

/**
 * Initialize readiness - set to ready after async operations complete
 * Simulates readiness check after server fully starts
 */
function initializeReadiness() {
  logger.info({
    msg: 'Initializing readiness check',
    timestamp: new Date().toISOString()
  });

  // Use setImmediate to simulate async readiness after event loop
  setImmediate(() => {
    setReady(true);
    logger.info({
      msg: 'Application readiness set to true',
      timestamp: new Date().toISOString()
    });
  });
}

module.exports = {
  setReady,
  isReady,
  initializeReadiness
};
'use strict';

/**
 * Graceful shutdown handler for application lifecycle
 */

const logger = require('../observability/logger');
const { setReady } = require('./readiness');

let server = null;
let isDraining = false;
let activeConnections = new Set();
const GRACEFUL_SHUTDOWN_TIMEOUT_MS = parseInt(process.env.GRACEFUL_SHUTDOWN_TIMEOUT_MS) || 10000;

/**
 * Initialize graceful shutdown handlers
 * @param {http.Server} httpServer - HTTP server instance
 */
function initializeGracefulShutdown(httpServer) {
  server = httpServer;
  
  // Track active connections
  server.on('connection', (connection) => {
    activeConnections.add(connection);
    connection.on('close', () => {
      activeConnections.delete(connection);
    });
  });

  // Handle shutdown signals
  process.on('SIGINT', handleShutdownSignal);
  process.on('SIGTERM', handleShutdownSignal);
  
  logger.info({
    msg: 'Graceful shutdown handlers initialized',
    timeout: GRACEFUL_SHUTDOWN_TIMEOUT_MS
  });
}

/**
 * Handle shutdown signals
 * @param {string} signal - Signal name
 */
function handleShutdownSignal(signal) {
  if (isDraining) {
    logger.warn({
      msg: 'Shutdown already in progress',
      signal
    });
    return;
  }

  isDraining = true;
  
  logger.info({
    msg: 'Shutdown signal received',
    signal,
    activeConnections: activeConnections.size,
    timestamp: new Date().toISOString()
  });

  // Set readiness to false immediately
  setReady(false);
  
  gracefulShutdown();
}

/**
 * Perform graceful shutdown
 */
function gracefulShutdown() {
  logger.info({
    msg: 'Shutdown process initiated',
    activeConnections: activeConnections.size,
    timeout: GRACEFUL_SHUTDOWN_TIMEOUT_MS
  });

  // Set shutdown timeout
  const forceExitTimer = setTimeout(() => {
    logger.error({
      msg: 'Graceful shutdown timeout exceeded, forcing exit',
      activeConnections: activeConnections.size,
      timeout: GRACEFUL_SHUTDOWN_TIMEOUT_MS
    });
    process.exit(1);
  }, GRACEFUL_SHUTDOWN_TIMEOUT_MS);

  // Close server and wait for connections to finish
  server.close((err) => {
    if (err) {
      logger.error({
        msg: 'Error during server close',
        error: err.message
      });
      clearTimeout(forceExitTimer);
      process.exit(1);
      return;
    }

    logger.info({
      msg: 'Server closed successfully',
      timestamp: new Date().toISOString()
    });
    
    // Wait for active connections to close
    if (activeConnections.size === 0) {
      logger.info({
        msg: 'Graceful shutdown completed',
        timestamp: new Date().toISOString()
      });
      clearTimeout(forceExitTimer);
      process.exit(0);
    } else {
      logger.info({
        msg: 'Waiting for active connections to close',
        activeConnections: activeConnections.size
      });
      
      // Check periodically for connection closure
      const connectionCheckInterval = setInterval(() => {
        if (activeConnections.size === 0) {
          logger.info({
            msg: 'All connections closed, shutdown complete',
            timestamp: new Date().toISOString()
          });
          clearInterval(connectionCheckInterval);
          clearTimeout(forceExitTimer);
          process.exit(0);
        } else {
          logger.info({
            msg: 'Still waiting for connections to close',
            activeConnections: activeConnections.size
          });
        }
      }, 1000);
    }
  });
}

/**
 * Check if server is draining
 * @returns {boolean} Draining state
 */
function isDrainingConnections() {
  return isDraining;
}

module.exports = {
  initializeGracefulShutdown,
  isDrainingConnections
};
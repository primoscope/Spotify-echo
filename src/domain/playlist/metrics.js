'use strict';

/**
 * Playlist Domain Metrics
 * Business domain metrics for playlist generation and management
 */

const logger = require('../../infra/observability/logger');
const { getCorrelationId } = require('../../infra/observability/requestContext');

// Initialize domain metrics
let playlistGenerationRequestsTotal;
let playlistGenerationDurationMs; 
let playlistGenerationErrorsTotal;

try {
  const { register } = require('../../infra/observability/metrics');
  const client = require('prom-client');
  
  // Counter for playlist generation requests
  playlistGenerationRequestsTotal = new client.Counter({
    name: 'playlist_generation_requests_total',
    help: 'Total playlist generation requests',
    labelNames: ['source']
  });
  
  // Histogram for playlist generation duration
  playlistGenerationDurationMs = new client.Histogram({
    name: 'playlist_generation_duration_ms',
    help: 'Playlist generation duration in milliseconds',
    labelNames: ['source'],
    buckets: [10, 25, 50, 100, 200, 400, 800, 1600, 5000]
  });
  
  // Counter for playlist generation errors
  playlistGenerationErrorsTotal = new client.Counter({
    name: 'playlist_generation_errors_total',
    help: 'Total playlist generation errors',
    labelNames: ['source', 'error_type']
  });
  
  // Register all metrics
  register.registerMetric(playlistGenerationRequestsTotal);
  register.registerMetric(playlistGenerationDurationMs);
  register.registerMetric(playlistGenerationErrorsTotal);
  
} catch (error) {
  logger.warn('Failed to register playlist domain metrics:', error.message);
}

/**
 * Instrument playlist generation with metrics
 * @param {string} source - Source of the playlist generation (ai, manual, recommended, etc.)
 * @param {Function} fn - Async function to execute
 * @returns {*} Result of the function
 */
async function instrumentPlaylistGeneration(source, fn) {
  const startTime = Date.now();
  
  // Increment request counter
  if (playlistGenerationRequestsTotal) {
    playlistGenerationRequestsTotal.inc({ source });
  }
  
  logger.info({
    msg: 'Playlist generation started',
    requestId: getCorrelationId(),
    source,
    timestamp: new Date().toISOString()
  });

  try {
    // Execute the playlist generation function
    const result = await fn();
    
    const duration = Date.now() - startTime;
    
    // Record successful duration
    if (playlistGenerationDurationMs) {
      playlistGenerationDurationMs.observe({ source }, duration);
    }
    
    logger.info({
      msg: 'Playlist generation completed',
      requestId: getCorrelationId(),
      source,
      duration,
      tracksGenerated: result?.tracks?.length || result?.trackCount || 'unknown'
    });
    
    return result;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Record error
    if (playlistGenerationErrorsTotal) {
      const errorType = determineErrorType(error);
      playlistGenerationErrorsTotal.inc({ source, error_type: errorType });
    }
    
    // Still record duration for failed attempts
    if (playlistGenerationDurationMs) {
      playlistGenerationDurationMs.observe({ source }, duration);
    }
    
    logger.error({
      msg: 'Playlist generation failed',
      requestId: getCorrelationId(),
      source,
      duration,
      error: error.message
    });
    
    throw error;
  }
}

/**
 * Determine error type for metrics categorization
 * @param {Error} error - The error object
 * @returns {string} Error type category
 */
function determineErrorType(error) {
  if (error.message?.includes('timeout')) return 'timeout';
  if (error.message?.includes('rate limit')) return 'rate_limit';
  if (error.message?.includes('auth')) return 'auth';
  if (error.message?.includes('network')) return 'network';
  if (error.message?.includes('validation')) return 'validation';
  if (error.statusCode >= 400 && error.statusCode < 500) return 'client_error';
  if (error.statusCode >= 500) return 'server_error';
  return 'unknown';
}

/**
 * Record manual playlist generation metrics
 * @param {string} source - Source identifier
 * @param {number} trackCount - Number of tracks in playlist
 * @param {number} duration - Generation time in milliseconds
 */
function recordPlaylistGeneration(source, trackCount, duration = null) {
  if (playlistGenerationRequestsTotal) {
    playlistGenerationRequestsTotal.inc({ source });
  }
  
  if (duration && playlistGenerationDurationMs) {
    playlistGenerationDurationMs.observe({ source }, duration);
  }
  
  logger.info({
    msg: 'Playlist generation recorded',
    requestId: getCorrelationId(),
    source,
    trackCount,
    duration
  });
}

/**
 * Record playlist generation error
 * @param {string} source - Source identifier  
 * @param {Error} error - Error object
 * @param {number} duration - Time elapsed before error
 */
function recordPlaylistError(source, error, duration = null) {
  const errorType = determineErrorType(error);
  
  if (playlistGenerationErrorsTotal) {
    playlistGenerationErrorsTotal.inc({ source, error_type: errorType });
  }
  
  if (duration && playlistGenerationDurationMs) {
    playlistGenerationDurationMs.observe({ source }, duration);
  }
  
  logger.error({
    msg: 'Playlist generation error recorded',
    requestId: getCorrelationId(),
    source,
    errorType,
    error: error.message,
    duration
  });
}

module.exports = {
  instrumentPlaylistGeneration,
  recordPlaylistGeneration,
  recordPlaylistError
};
'use strict';

/**
 * Standardized Error Codes
 * Provides consistent error codes across the application
 */

const ERROR_CODES = {
  // Validation errors
  E_VALIDATION: 'E_VALIDATION',
  
  // Resource not found
  E_NOT_FOUND: 'E_NOT_FOUND',
  
  // Internal server errors
  E_INTERNAL: 'E_INTERNAL',
  
  // Authentication/Authorization errors (for future use)
  E_AUTH_REQUIRED: 'E_AUTH_REQUIRED',
  E_AUTH_INVALID: 'E_AUTH_INVALID',
  E_FORBIDDEN: 'E_FORBIDDEN',
  
  // Rate limiting errors
  E_RATE_LIMIT: 'E_RATE_LIMIT',
  
  // External service errors
  E_EXTERNAL_SERVICE: 'E_EXTERNAL_SERVICE',
  
  // Configuration errors
  E_CONFIG: 'E_CONFIG'
};

/**
 * HTTP Status Code mappings for error codes
 */
const STATUS_CODES = {
  [ERROR_CODES.E_VALIDATION]: 400,
  [ERROR_CODES.E_NOT_FOUND]: 404,
  [ERROR_CODES.E_INTERNAL]: 500,
  [ERROR_CODES.E_AUTH_REQUIRED]: 401,
  [ERROR_CODES.E_AUTH_INVALID]: 401,
  [ERROR_CODES.E_FORBIDDEN]: 403,
  [ERROR_CODES.E_RATE_LIMIT]: 429,
  [ERROR_CODES.E_EXTERNAL_SERVICE]: 502,
  [ERROR_CODES.E_CONFIG]: 500
};

/**
 * Get HTTP status code for error code
 * @param {string} errorCode - Error code
 * @returns {number} HTTP status code
 */
function getStatusCode(errorCode) {
  return STATUS_CODES[errorCode] || 500;
}

/**
 * Check if error code is a client error (4xx)
 * @param {string} errorCode - Error code
 * @returns {boolean} True if client error
 */
function isClientError(errorCode) {
  const statusCode = getStatusCode(errorCode);
  return statusCode >= 400 && statusCode < 500;
}

/**
 * Check if error code is a server error (5xx)
 * @param {string} errorCode - Error code  
 * @returns {boolean} True if server error
 */
function isServerError(errorCode) {
  const statusCode = getStatusCode(errorCode);
  return statusCode >= 500;
}

module.exports = {
  ERROR_CODES,
  STATUS_CODES,
  getStatusCode,
  isClientError,
  isServerError
};
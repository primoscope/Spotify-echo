'use strict';

/**
 * Error creation helper
 * Creates standardized error objects with codes and HTTP status
 */

const { ERROR_CODES, getStatusCode } = require('./codes');

/**
 * Create a standardized error
 * @param {string} code - Error code from ERROR_CODES
 * @param {string} message - User-friendly error message
 * @param {Object} options - Additional options
 * @param {*} options.details - Additional error details
 * @param {number} options.statusCode - Override HTTP status code
 * @param {Error} options.cause - Original error that caused this
 * @returns {Error} Formatted error object
 */
function createError(code, message, options = {}) {
  const {
    details,
    statusCode,
    cause
  } = options;

  // Validate error code
  if (!Object.values(ERROR_CODES).includes(code)) {
    throw new Error(`Invalid error code: ${code}`);
  }

  const error = new Error(message);
  
  // Add custom properties
  error.code = code;
  error.statusCode = statusCode || getStatusCode(code);
  error.details = details;
  error.timestamp = new Date().toISOString();
  
  if (cause) {
    error.cause = cause;
  }

  return error;
}

/**
 * Create validation error
 * @param {string} message - Validation error message
 * @param {Object} details - Validation details (field errors, etc.)
 * @returns {Error} Validation error
 */
function createValidationError(message, details = null) {
  return createError(ERROR_CODES.E_VALIDATION, message, { details });
}

/**
 * Create not found error
 * @param {string} resource - Resource that was not found
 * @param {string} identifier - Resource identifier
 * @returns {Error} Not found error
 */
function createNotFoundError(resource = 'Resource', identifier = '') {
  const message = identifier 
    ? `${resource} '${identifier}' not found`
    : `${resource} not found`;
  
  return createError(ERROR_CODES.E_NOT_FOUND, message, {
    details: { resource, identifier }
  });
}

/**
 * Create internal server error
 * @param {string} message - Error message
 * @param {Error} cause - Original error
 * @returns {Error} Internal server error
 */
function createInternalError(message = 'An internal server error occurred', cause = null) {
  return createError(ERROR_CODES.E_INTERNAL, message, { cause });
}

/**
 * Create authentication required error
 * @param {string} message - Auth error message
 * @returns {Error} Authentication error
 */
function createAuthRequiredError(message = 'Authentication required') {
  return createError(ERROR_CODES.E_AUTH_REQUIRED, message);
}

/**
 * Create invalid authentication error
 * @param {string} message - Auth error message
 * @returns {Error} Authentication error
 */
function createAuthInvalidError(message = 'Invalid authentication credentials') {
  return createError(ERROR_CODES.E_AUTH_INVALID, message);
}

/**
 * Create forbidden error
 * @param {string} message - Forbidden error message
 * @returns {Error} Forbidden error
 */
function createForbiddenError(message = 'Access forbidden') {
  return createError(ERROR_CODES.E_FORBIDDEN, message);
}

/**
 * Create rate limit error
 * @param {string} message - Rate limit message
 * @param {Object} details - Rate limit details (limit, window, etc.)
 * @returns {Error} Rate limit error
 */
function createRateLimitError(message = 'Too many requests', details = null) {
  return createError(ERROR_CODES.E_RATE_LIMIT, message, { details });
}

/**
 * Create external service error
 * @param {string} service - External service name
 * @param {string} message - Error message
 * @param {Error} cause - Original error
 * @returns {Error} External service error
 */
function createExternalServiceError(service, message, cause = null) {
  const fullMessage = `External service error (${service}): ${message}`;
  return createError(ERROR_CODES.E_EXTERNAL_SERVICE, fullMessage, {
    details: { service },
    cause
  });
}

/**
 * Wrap an unknown error with standard formatting
 * @param {Error} error - Original error
 * @param {string} fallbackMessage - Fallback message if error has no message
 * @returns {Error} Standardized error
 */
function wrapError(error, fallbackMessage = 'An error occurred') {
  // If already a standardized error, return as-is
  if (error.code && Object.values(ERROR_CODES).includes(error.code)) {
    return error;
  }

  // Determine appropriate error code based on error properties
  let code = ERROR_CODES.E_INTERNAL;
  let statusCode = 500;

  if (error.statusCode) {
    statusCode = error.statusCode;
    if (statusCode === 400) code = ERROR_CODES.E_VALIDATION;
    else if (statusCode === 404) code = ERROR_CODES.E_NOT_FOUND;
    else if (statusCode === 401) code = ERROR_CODES.E_AUTH_INVALID;
    else if (statusCode === 403) code = ERROR_CODES.E_FORBIDDEN;
    else if (statusCode === 429) code = ERROR_CODES.E_RATE_LIMIT;
    else if (statusCode >= 500) code = ERROR_CODES.E_INTERNAL;
  }

  const message = error.message || fallbackMessage;
  
  return createError(code, message, {
    statusCode,
    cause: error
  });
}

module.exports = {
  createError,
  createValidationError,
  createNotFoundError,
  createInternalError,
  createAuthRequiredError,
  createAuthInvalidError,
  createForbiddenError,
  createRateLimitError,
  createExternalServiceError,
  wrapError
};
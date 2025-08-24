'use strict';
/** Centralized error handler (must be last). */
const logger = require('../infra/observability/logger');
const { wrapError, ERROR_CODES } = require('../errors/createError');
const { getCorrelationId } = require('../infra/observability/requestContext');

module.exports = function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  // Wrap error with standardized format if needed
  const standardizedError = wrapError(err);
  
  const status = standardizedError.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';
  
  logger.error({
    msg: 'Unhandled error',
    requestId: getCorrelationId(),
    status,
    code: standardizedError.code,
    err: {
      message: standardizedError.message,
      stack: isProd ? undefined : standardizedError.stack,
      details: standardizedError.details
    }
  });

  // Build error response
  const errorResponse = {
    error: {
      code: standardizedError.code || ERROR_CODES.E_INTERNAL,
      message: standardizedError.message,
      timestamp: standardizedError.timestamp
    }
  };

  // Include details in non-production or for client errors
  if (!isProd || (status >= 400 && status < 500)) {
    if (standardizedError.details) {
      errorResponse.error.details = standardizedError.details;
    }
  }

  res.status(status).json(errorResponse);
};
'use strict';
/** Centralized error handler (must be last). */
const logger = require('../infra/observability/logger');
module.exports = function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const status = err.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';
  logger.error({
    msg: 'Unhandled error',
    status,
    err: {
      message: err.message,
      stack: isProd ? undefined : err.stack,
      code: err.code
    }
  });
  res.status(status).json({
    error: {
      message: err.publicMessage || (status === 500 ? 'Internal Server Error' : err.message),
      code: err.code || 'internal_error'
    }
  });
};
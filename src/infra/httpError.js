/**
 * HTTP Error utilities
 * Standardized error handling for API responses
 */

class HttpError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.code = code;
    this.timestamp = new Date().toISOString();
  }
}

class BadRequestError extends HttpError {
  constructor(message = 'Bad Request', code = 'BAD_REQUEST') {
    super(message, 400, code);
    this.name = 'BadRequestError';
  }
}

class UnauthorizedError extends HttpError {
  constructor(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    super(message, 401, code);
    this.name = 'UnauthorizedError';
  }
}

class ForbiddenError extends HttpError {
  constructor(message = 'Forbidden', code = 'FORBIDDEN') {
    super(message, 403, code);
    this.name = 'ForbiddenError';
  }
}

class NotFoundError extends HttpError {
  constructor(message = 'Not Found', code = 'NOT_FOUND') {
    super(message, 404, code);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends HttpError {
  constructor(message = 'Conflict', code = 'CONFLICT') {
    super(message, 409, code);
    this.name = 'ConflictError';
  }
}

class ValidationError extends BadRequestError {
  constructor(message = 'Validation Error', errors = []) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

class InternalServerError extends HttpError {
  constructor(message = 'Internal Server Error', code = 'INTERNAL_ERROR') {
    super(message, 500, code);
    this.name = 'InternalServerError';
  }
}

class ServiceUnavailableError extends HttpError {
  constructor(message = 'Service Unavailable', code = 'SERVICE_UNAVAILABLE') {
    super(message, 503, code);
    this.name = 'ServiceUnavailableError';
  }
}

// Error formatting utilities
function formatErrorResponse(error, includeStack = false) {
  const response = {
    success: false,
    error: {
      message: error.message,
      code: error.code || 'UNKNOWN_ERROR',
      timestamp: error.timestamp || new Date().toISOString()
    }
  };

  if (error.errors) {
    response.error.details = error.errors;
  }

  if (includeStack && error.stack) {
    response.error.stack = error.stack;
  }

  return response;
}

function isHttpError(error) {
  return error instanceof HttpError;
}

function getStatusCode(error) {
  if (isHttpError(error)) {
    return error.statusCode;
  }
  
  // Default status codes for common error types
  if (error.name === 'ValidationError') {
    return 400;
  }
  
  if (error.name === 'CastError' || error.name === 'SyntaxError') {
    return 400;
  }
  
  if (error.name === 'UnauthorizedError') {
    return 401;
  }
  
  if (error.name === 'MongoError' && error.code === 11000) {
    return 409; // Duplicate key
  }
  
  return 500;
}

module.exports = {
  HttpError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  InternalServerError,
  ServiceUnavailableError,
  formatErrorResponse,
  isHttpError,
  getStatusCode
};
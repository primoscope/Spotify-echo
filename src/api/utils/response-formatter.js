const { v4: uuidv4 } = require('uuid');

/**
 * Enhanced Response Formatter for EchoTune AI
 *
 * Provides consistent API response formatting with:
 * - Standardized success/error responses
 * - Request tracking and correlation IDs
 * - Performance metadata
 * - Caching information
 * - Pagination support
 * - API version compatibility
 */

class ResponseFormatter {
  constructor() {
    this.correlationIds = new Map();
  }

  /**
   * Format successful response
   */
  success(data, options = {}) {
    const {
      message = 'Success',
      cached = false,
      cacheAge = null,
      pagination = null,
      metadata = {},
      requestId = null,
      performanceMetrics = null,
    } = options;

    const response = {
      success: true,
      message,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        request_id: requestId || uuidv4(),
        ...metadata,
      },
    };

    // Add caching information if applicable
    if (cached) {
      response.cache = {
        cached: true,
        age: cacheAge,
        expires: metadata.cacheExpires || null,
      };
    }

    // Add pagination if applicable
    if (pagination) {
      response.pagination = {
        page: pagination.page || 1,
        limit: pagination.limit || 20,
        total: pagination.total || 0,
        total_pages: Math.ceil((pagination.total || 0) / (pagination.limit || 20)),
        has_next: pagination.hasNext || false,
        has_prev: pagination.hasPrev || false,
      };
    }

    // Add performance metrics if available
    if (performanceMetrics) {
      response.performance = {
        response_time_ms: Math.round(performanceMetrics.responseTime || 0),
        database_time_ms: Math.round(performanceMetrics.databaseTime || 0),
        cache_time_ms: Math.round(performanceMetrics.cacheTime || 0),
        processing_time_ms: Math.round(performanceMetrics.processingTime || 0),
      };
    }

    return response;
  }

  /**
   * Format error response
   */
  error(error, options = {}) {
    const {
      statusCode = 500,
      errorCode = 'INTERNAL_SERVER_ERROR',
      details = null,
      requestId = null,
      stack = null,
      suggestions = null,
    } = options;

    const response = {
      success: false,
      error: {
        code: errorCode,
        message: error.message || 'An error occurred',
        status_code: statusCode,
        details: details,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        request_id: requestId || uuidv4(),
      },
    };

    // Add stack trace in development
    if (process.env.NODE_ENV === 'development' && stack) {
      response.debug = {
        stack: stack,
        error_name: error.name,
      };
    }

    // Add helpful suggestions
    if (suggestions) {
      response.help = {
        suggestions: Array.isArray(suggestions) ? suggestions : [suggestions],
        documentation: '/api/docs',
        support: 'support@echotune.ai',
      };
    }

    return response;
  }

  /**
   * Format validation error response
   */
  validationError(validationErrors, requestId = null) {
    return this.error(new Error('Validation failed'), {
      statusCode: 400,
      errorCode: 'VALIDATION_ERROR',
      details: {
        validation_errors: validationErrors,
        total_errors: validationErrors.length,
      },
      requestId,
      suggestions: [
        'Check the request parameters against the API documentation',
        'Ensure all required fields are provided',
        'Verify data types and formats',
      ],
    });
  }

  /**
   * Format rate limit error response
   */
  rateLimitError(retryAfter, requestId = null) {
    return this.error(new Error('Rate limit exceeded'), {
      statusCode: 429,
      errorCode: 'RATE_LIMIT_EXCEEDED',
      details: {
        retry_after_seconds: retryAfter,
        retry_after_date: new Date(Date.now() + retryAfter * 1000).toISOString(),
      },
      requestId,
      suggestions: [
        'Wait before making another request',
        'Consider caching responses to reduce API calls',
        'Review rate limiting documentation',
      ],
    });
  }

  /**
   * Format authentication error response
   */
  authError(message = 'Authentication required', requestId = null) {
    return this.error(new Error(message), {
      statusCode: 401,
      errorCode: 'AUTHENTICATION_ERROR',
      details: {
        auth_required: true,
        auth_type: 'spotify_oauth',
      },
      requestId,
      suggestions: [
        'Provide a valid Spotify access token',
        'Check if your token has expired',
        'Ensure proper OAuth flow implementation',
      ],
    });
  }

  /**
   * Format authorization error response
   */
  authorizationError(requiredPermissions = [], requestId = null) {
    return this.error(new Error('Insufficient permissions'), {
      statusCode: 403,
      errorCode: 'AUTHORIZATION_ERROR',
      details: {
        required_permissions: requiredPermissions,
        current_permissions: [],
      },
      requestId,
      suggestions: [
        'Ensure your Spotify token has the required scopes',
        'Re-authenticate with additional permissions',
        'Contact support if you believe this is an error',
      ],
    });
  }

  /**
   * Format not found error response
   */
  notFoundError(resource = 'Resource', requestId = null) {
    return this.error(new Error(`${resource} not found`), {
      statusCode: 404,
      errorCode: 'NOT_FOUND',
      details: {
        resource_type: resource.toLowerCase(),
        searched_at: new Date().toISOString(),
      },
      requestId,
      suggestions: [
        'Check the resource ID or parameters',
        'Ensure the resource exists and is accessible',
        'Review the API documentation for correct usage',
      ],
    });
  }

  /**
   * Format service unavailable error response
   */
  serviceUnavailableError(service = 'Service', retryAfter = 60, requestId = null) {
    return this.error(new Error(`${service} is temporarily unavailable`), {
      statusCode: 503,
      errorCode: 'SERVICE_UNAVAILABLE',
      details: {
        service_name: service.toLowerCase(),
        retry_after_seconds: retryAfter,
        estimated_recovery: new Date(Date.now() + retryAfter * 1000).toISOString(),
      },
      requestId,
      suggestions: [
        'Try again after the retry period',
        'Check service status page',
        'Use cached data if available',
      ],
    });
  }

  /**
   * Middleware for request ID generation
   */
  generateRequestId() {
    return (req, res, next) => {
      req.requestId = req.headers['x-request-id'] || uuidv4();
      res.setHeader('X-Request-ID', req.requestId);

      // Store correlation for tracking
      this.correlationIds.set(req.requestId, {
        timestamp: Date.now(),
        ip: req.ip,
        method: req.method,
        path: req.path,
        userAgent: req.get('User-Agent'),
      });

      next();
    };
  }

  /**
   * Middleware for consistent error handling
   */
  errorHandler() {
    return (error, req, res, _next) => {
      const requestId = req.requestId;

      // Log error with correlation info
      console.error(`[${requestId}] Error:`, {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
      });

      // Determine error type and format response
      let errorResponse;

      if (error.name === 'ValidationError') {
        errorResponse = this.validationError(error.details, requestId);
      } else if (error.name === 'UnauthorizedError') {
        errorResponse = this.authError(error.message, requestId);
      } else if (error.name === 'ForbiddenError') {
        errorResponse = this.authorizationError(error.requiredPermissions, requestId);
      } else if (error.name === 'NotFoundError') {
        errorResponse = this.notFoundError(error.resource, requestId);
      } else if (error.name === 'RateLimitError') {
        errorResponse = this.rateLimitError(error.retryAfter, requestId);
      } else if (error.name === 'ServiceUnavailableError') {
        errorResponse = this.serviceUnavailableError(error.service, error.retryAfter, requestId);
      } else {
        // Generic error
        errorResponse = this.error(error, {
          statusCode: error.statusCode || 500,
          errorCode: error.code || 'INTERNAL_SERVER_ERROR',
          requestId,
          stack: error.stack,
        });
      }

      res.status(errorResponse.error.status_code).json(errorResponse);
    };
  }

  /**
   * Helper to send formatted success response
   */
  sendSuccess(res, data, options = {}) {
    const response = this.success(data, options);
    res.json(response);
  }

  /**
   * Helper to send formatted error response
   */
  sendError(res, error, options = {}) {
    const response = this.error(error, options);
    res.status(response.error.status_code).json(response);
  }

  /**
   * Clean up old correlation data to prevent memory leaks
   */
  cleanupCorrelationData() {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [id, data] of this.correlationIds.entries()) {
      if (data.timestamp < oneHourAgo) {
        this.correlationIds.delete(id);
      }
    }
  }
}

// Export singleton instance
const responseFormatter = new ResponseFormatter();

// Clean up correlation data every hour
setInterval(
  () => {
    responseFormatter.cleanupCorrelationData();
  },
  60 * 60 * 1000
);

module.exports = responseFormatter;

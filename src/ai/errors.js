/**
 * Centralized AI Error Classes for Vertex AI Integration
 * Provides structured error handling with retry classification
 */

/**
 * Base AI Error class with structured metadata
 */
class AIError extends Error {
  constructor(message, code, retryable = false, metadata = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.retryable = retryable;
    this.metadata = metadata;
    this.timestamp = new Date().toISOString();
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      retryable: this.retryable,
      metadata: this.metadata,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

/**
 * Rate limiting errors - retryable with exponential backoff
 */
class RateLimitError extends AIError {
  constructor(message, retryAfter = null, metadata = {}) {
    super(message, 'RATE_LIMIT_EXCEEDED', true, { 
      retryAfter, 
      ...metadata 
    });
    this.retryAfter = retryAfter;
  }
}

/**
 * Transient errors - network, timeout, temporary server issues
 */
class TransientError extends AIError {
  constructor(message, originalError = null, metadata = {}) {
    super(message, 'TRANSIENT_ERROR', true, {
      originalError: originalError?.message,
      originalCode: originalError?.code,
      ...metadata
    });
    this.originalError = originalError;
  }
}

/**
 * Fatal model errors - authentication, validation, permanent failures
 */
class FatalModelError extends AIError {
  constructor(message, code = 'FATAL_ERROR', metadata = {}) {
    super(message, code, false, metadata);
  }
}

/**
 * Validation errors - bad input, configuration, etc.
 */
class ValidationError extends AIError {
  constructor(message, field = null, value = null, metadata = {}) {
    super(message, 'VALIDATION_ERROR', false, {
      field,
      value: value ? String(value).substring(0, 100) : null, // Truncate for security
      ...metadata
    });
    this.field = field;
    this.value = value;
  }
}

/**
 * Endpoint deployment errors
 */
class EndpointError extends AIError {
  constructor(message, endpointId = null, operation = null, metadata = {}) {
    super(message, 'ENDPOINT_ERROR', true, {
      endpointId,
      operation,
      ...metadata
    });
    this.endpointId = endpointId;
    this.operation = operation;
  }
}

/**
 * Model not found or unavailable errors
 */
class ModelUnavailableError extends AIError {
  constructor(message, modelId = null, metadata = {}) {
    super(message, 'MODEL_UNAVAILABLE', false, {
      modelId,
      ...metadata
    });
    this.modelId = modelId;
  }
}

/**
 * Circuit breaker state management
 */
class CircuitBreakerError extends AIError {
  constructor(message, state = 'OPEN', metadata = {}) {
    super(message, 'CIRCUIT_BREAKER', false, {
      state,
      ...metadata
    });
    this.state = state;
  }
}

/**
 * Authentication and authorization errors
 */
class AuthenticationError extends FatalModelError {
  constructor(message, provider = null, metadata = {}) {
    super(message, 'AUTHENTICATION_ERROR', {
      provider,
      ...metadata
    });
    this.provider = provider;
  }
}

/**
 * Configuration errors
 */
class ConfigurationError extends FatalModelError {
  constructor(message, configKey = null, metadata = {}) {
    super(message, 'CONFIGURATION_ERROR', {
      configKey,
      ...metadata
    });
    this.configKey = configKey;
  }
}

/**
 * Error classification utility
 */
class ErrorClassifier {
  /**
   * Classify an error and determine retry strategy
   * @param {Error} error - The error to classify
   * @returns {Object} Classification result
   */
  static classify(error) {
    // Already classified
    if (error instanceof AIError) {
      return {
        type: error.constructor.name,
        retryable: error.retryable,
        code: error.code,
        backoffMultiplier: error instanceof RateLimitError ? 2 : 1.5,
        maxRetries: error instanceof RateLimitError ? 5 : 3
      };
    }

    // HTTP errors
    if (error.response || error.status || error.statusCode) {
      const status = error.status || error.statusCode || error.response?.status;
      
      if (status === 401 || status === 403) {
        return {
          type: 'AuthenticationError',
          retryable: false,
          code: 'HTTP_AUTH_ERROR',
          httpStatus: status
        };
      }
      
      if (status === 429) {
        return {
          type: 'RateLimitError',
          retryable: true,
          code: 'HTTP_RATE_LIMIT',
          httpStatus: status,
          backoffMultiplier: 2,
          maxRetries: 5
        };
      }
      
      if (status >= 500) {
        return {
          type: 'TransientError',
          retryable: true,
          code: 'HTTP_SERVER_ERROR',
          httpStatus: status,
          maxRetries: 3
        };
      }
      
      if (status >= 400) {
        return {
          type: 'ValidationError',
          retryable: false,
          code: 'HTTP_CLIENT_ERROR',
          httpStatus: status
        };
      }
    }

    // Network errors
    const networkErrors = ['ECONNRESET', 'ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT'];
    if (networkErrors.includes(error.code)) {
      return {
        type: 'TransientError',
        retryable: true,
        code: error.code,
        maxRetries: 3
      };
    }

    // Timeout errors
    if (error.message?.toLowerCase().includes('timeout')) {
      return {
        type: 'TransientError',
        retryable: true,
        code: 'TIMEOUT_ERROR',
        maxRetries: 2
      };
    }

    // Default: non-retryable
    return {
      type: 'FatalModelError',
      retryable: false,
      code: 'UNKNOWN_ERROR'
    };
  }

  /**
   * Create appropriate error instance from classification
   * @param {Error} originalError - Original error
   * @param {Object} classification - Error classification
   * @returns {AIError} Structured error instance
   */
  static createError(originalError, classification = null) {
    const cls = classification || ErrorClassifier.classify(originalError);
    
    switch (cls.type) {
      case 'RateLimitError':
        return new RateLimitError(
          originalError.message,
          originalError.retryAfter || cls.retryAfter,
          { classification: cls, originalError: originalError.message }
        );
      
      case 'TransientError':
        return new TransientError(
          originalError.message,
          originalError,
          { classification: cls }
        );
      
      case 'ValidationError':
        return new ValidationError(
          originalError.message,
          null,
          null,
          { classification: cls, originalError: originalError.message }
        );
      
      case 'AuthenticationError':
        return new AuthenticationError(
          originalError.message,
          null,
          { classification: cls, originalError: originalError.message }
        );
      
      default:
        return new FatalModelError(
          originalError.message,
          cls.code,
          { classification: cls, originalError: originalError.message }
        );
    }
  }
}

/**
 * Circuit breaker implementation for AI services
 */
class CircuitBreaker {
  constructor(options = {}) {
    this.options = {
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      monitorTimeout: 30000, // 30 seconds
      ...options
    };
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
  }

  /**
   * Execute operation with circuit breaker protection
   * @param {Function} operation - Async operation to execute
   * @returns {Promise} Operation result
   */
  async execute(operation) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttemptTime) {
        throw new CircuitBreakerError(
          'Circuit breaker is OPEN - requests blocked',
          'OPEN',
          {
            nextAttemptTime: this.nextAttemptTime,
            failureCount: this.failureCount
          }
        );
      }
      // Try to transition to HALF_OPEN
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.options.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttemptTime = Date.now() + this.options.resetTimeout;
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
      healthy: this.state === 'CLOSED'
    };
  }
}

module.exports = {
  AIError,
  RateLimitError,
  TransientError,
  FatalModelError,
  ValidationError,
  EndpointError,
  ModelUnavailableError,
  CircuitBreakerError,
  AuthenticationError,
  ConfigurationError,
  ErrorClassifier,
  CircuitBreaker
};
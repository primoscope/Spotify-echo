/**
 * Unit tests for AI error classes and circuit breaker
 */

const {
  AIError,
  RateLimitError,
  TransientError,
  FatalModelError,
  ValidationError,
  ErrorClassifier,
  CircuitBreaker
} = require('../../../src/ai/errors');

describe('AI Error Classes', () => {
  describe('AIError', () => {
    it('should create base error with metadata', () => {
      const error = new AIError('Test error', 'TEST_CODE', true, { test: 'data' });
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.retryable).toBe(true);
      expect(error.metadata.test).toBe('data');
      expect(error.timestamp).toBeDefined();
      expect(error.name).toBe('AIError');
    });

    it('should serialize to JSON correctly', () => {
      const error = new AIError('Test error', 'TEST_CODE');
      const json = error.toJSON();
      
      expect(json.name).toBe('AIError');
      expect(json.message).toBe('Test error');
      expect(json.code).toBe('TEST_CODE');
      expect(json.timestamp).toBeDefined();
    });
  });

  describe('RateLimitError', () => {
    it('should create retryable rate limit error', () => {
      const error = new RateLimitError('Rate limited', 30);
      
      expect(error.retryable).toBe(true);
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(error.retryAfter).toBe(30);
      expect(error.metadata.retryAfter).toBe(30);
    });
  });

  describe('TransientError', () => {
    it('should create retryable transient error', () => {
      const originalError = new Error('Network error');
      const error = new TransientError('Request failed', originalError);
      
      expect(error.retryable).toBe(true);
      expect(error.code).toBe('TRANSIENT_ERROR');
      expect(error.originalError).toBe(originalError);
      expect(error.metadata.originalError).toBe('Network error');
    });
  });

  describe('FatalModelError', () => {
    it('should create non-retryable error', () => {
      const error = new FatalModelError('Authentication failed');
      
      expect(error.retryable).toBe(false);
      expect(error.code).toBe('FATAL_ERROR');
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with field info', () => {
      const error = new ValidationError('Invalid input', 'temperature', 2.5);
      
      expect(error.retryable).toBe(false);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.field).toBe('temperature');
      expect(error.value).toBe(2.5);
      expect(error.metadata.field).toBe('temperature');
    });
  });
});

describe('ErrorClassifier', () => {
  describe('classify', () => {
    it('should classify AIError correctly', () => {
      const error = new RateLimitError('Rate limited');
      const classification = ErrorClassifier.classify(error);
      
      expect(classification.type).toBe('RateLimitError');
      expect(classification.retryable).toBe(true);
      expect(classification.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(classification.backoffMultiplier).toBe(2);
    });

    it('should classify HTTP 401 as non-retryable', () => {
      const error = { status: 401, message: 'Unauthorized' };
      const classification = ErrorClassifier.classify(error);
      
      expect(classification.type).toBe('AuthenticationError');
      expect(classification.retryable).toBe(false);
      expect(classification.httpStatus).toBe(401);
    });

    it('should classify HTTP 429 as retryable', () => {
      const error = { status: 429, message: 'Too Many Requests' };
      const classification = ErrorClassifier.classify(error);
      
      expect(classification.type).toBe('RateLimitError');
      expect(classification.retryable).toBe(true);
      expect(classification.httpStatus).toBe(429);
      expect(classification.maxRetries).toBe(5);
    });

    it('should classify HTTP 500 as retryable', () => {
      const error = { status: 500, message: 'Internal Server Error' };
      const classification = ErrorClassifier.classify(error);
      
      expect(classification.type).toBe('TransientError');
      expect(classification.retryable).toBe(true);
      expect(classification.httpStatus).toBe(500);
    });

    it('should classify network errors as retryable', () => {
      const error = { code: 'ECONNRESET', message: 'Connection reset' };
      const classification = ErrorClassifier.classify(error);
      
      expect(classification.type).toBe('TransientError');
      expect(classification.retryable).toBe(true);
      expect(classification.code).toBe('ECONNRESET');
    });

    it('should classify timeout errors as retryable', () => {
      const error = { message: 'Request timeout occurred' };
      const classification = ErrorClassifier.classify(error);
      
      expect(classification.type).toBe('TransientError');
      expect(classification.retryable).toBe(true);
      expect(classification.code).toBe('TIMEOUT_ERROR');
    });

    it('should classify unknown errors as non-retryable', () => {
      const error = { message: 'Unknown error' };
      const classification = ErrorClassifier.classify(error);
      
      expect(classification.type).toBe('FatalModelError');
      expect(classification.retryable).toBe(false);
      expect(classification.code).toBe('UNKNOWN_ERROR');
    });
  });

  describe('createError', () => {
    it('should create appropriate error instance', () => {
      const originalError = { status: 429, message: 'Rate limited' };
      const error = ErrorClassifier.createError(originalError);
      
      expect(error).toBeInstanceOf(RateLimitError);
      expect(error.message).toBe('Rate limited');
      expect(error.retryable).toBe(true);
    });
  });
});

describe('CircuitBreaker', () => {
  let circuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 1000,
      monitorTimeout: 500
    });
  });

  describe('execute', () => {
    it('should execute operation when circuit is closed', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await circuitBreaker.execute(operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
      expect(circuitBreaker.getState().state).toBe('CLOSED');
    });

    it('should record failures and open circuit', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Operation failed'));
      
      // Execute 3 failing operations
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(operation);
        } catch (error) {
          // Expected to fail
        }
      }
      
      expect(circuitBreaker.getState().state).toBe('OPEN');
      expect(circuitBreaker.getState().failureCount).toBe(3);
    });

    it('should block requests when circuit is open', async () => {
      // Force circuit to open
      circuitBreaker.failureCount = 3;
      circuitBreaker.state = 'OPEN';
      circuitBreaker.nextAttemptTime = Date.now() + 10000; // 10 seconds in future
      
      const operation = jest.fn().mockResolvedValue('success');
      
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('Circuit breaker is OPEN');
      expect(operation).not.toHaveBeenCalled();
    });

    it('should transition to half-open after timeout', async () => {
      // Force circuit to open with past timeout
      circuitBreaker.failureCount = 3;
      circuitBreaker.state = 'OPEN';
      circuitBreaker.nextAttemptTime = Date.now() - 1000; // 1 second in past
      
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await circuitBreaker.execute(operation);
      
      expect(result).toBe('success');
      expect(circuitBreaker.getState().state).toBe('CLOSED');
      expect(circuitBreaker.getState().failureCount).toBe(0);
    });

    it('should reset failure count on success', async () => {
      // Set some initial failures
      circuitBreaker.failureCount = 2;
      
      const operation = jest.fn().mockResolvedValue('success');
      
      await circuitBreaker.execute(operation);
      
      expect(circuitBreaker.getState().failureCount).toBe(0);
      expect(circuitBreaker.getState().state).toBe('CLOSED');
    });
  });

  describe('getState', () => {
    it('should return current circuit breaker state', () => {
      const state = circuitBreaker.getState();
      
      expect(state.state).toBe('CLOSED');
      expect(state.failureCount).toBe(0);
      expect(state.healthy).toBe(true);
      expect(state.lastFailureTime).toBeNull();
      expect(state.nextAttemptTime).toBeNull();
    });

    it('should indicate unhealthy when circuit is open', () => {
      circuitBreaker.state = 'OPEN';
      
      const state = circuitBreaker.getState();
      
      expect(state.healthy).toBe(false);
      expect(state.state).toBe('OPEN');
    });
  });
});
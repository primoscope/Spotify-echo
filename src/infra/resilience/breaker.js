'use strict';

/**
 * Circuit Breaker & Retry Wrapper
 * Implements circuit breaker pattern with exponential backoff retry logic
 */

const logger = require('../observability/logger');
const { getCorrelationId } = require('../observability/requestContext');
const { 
  externalCircuitState, 
  externalCallRetriesTotal 
} = require('../observability/metrics');

// Circuit breaker states
const CircuitState = {
  CLOSED: 0,
  OPEN: 1,
  HALF_OPEN: 2
};

/**
 * Create a circuit breaker wrapper for async operations
 * @param {string} name - Circuit breaker name for metrics
 * @param {Object} options - Configuration options
 * @returns {Function} Wrapped function with circuit breaker and retry logic
 */
function createBreaker(name, options = {}) {
  const config = {
    failureThreshold: options.failureThreshold || 5,
    resetTimeoutMs: options.resetTimeoutMs || 30000,
    halfOpenTrialCount: options.halfOpenTrialCount || 1,
    maxRetries: options.maxRetries || 2,
    baseDelayMs: options.baseDelayMs || 50,
    backoffFactor: options.backoffFactor || 2,
    retryOn: options.retryOn || defaultRetryCondition,
    onStateChange: options.onStateChange || (() => {}),
    ...options
  };

  let state = CircuitState.CLOSED;
  let failureCount = 0;
  let lastFailureTime = null;
  let nextAttemptTime = 0;
  let halfOpenTrialCount = 0;

  // Update metrics on state change
  const updateStateMetric = () => {
    if (externalCircuitState) {
      externalCircuitState.set({ breaker: name }, state);
    }
  };

  // Initialize state metric
  updateStateMetric();

  /**
   * Change circuit breaker state
   */
  const changeState = (newState, reason) => {
    const previousState = state;
    state = newState;
    
    logger.info({
      msg: 'Circuit breaker state change',
      requestId: getCorrelationId(),
      breaker: name,
      previousState,
      newState,
      reason,
      timestamp: new Date().toISOString()
    });

    updateStateMetric();
    config.onStateChange({ name, previousState, newState, reason });
  };

  /**
   * Record failure
   */
  const recordFailure = () => {
    failureCount++;
    lastFailureTime = Date.now();
    
    if (state === CircuitState.CLOSED && failureCount >= config.failureThreshold) {
      changeState(CircuitState.OPEN, 'failure_threshold_exceeded');
      nextAttemptTime = lastFailureTime + config.resetTimeoutMs;
    } else if (state === CircuitState.HALF_OPEN) {
      changeState(CircuitState.OPEN, 'half_open_failure');
      nextAttemptTime = Date.now() + config.resetTimeoutMs;
    }
  };

  /**
   * Record success
   */
  const recordSuccess = () => {
    if (state === CircuitState.HALF_OPEN) {
      halfOpenTrialCount++;
      if (halfOpenTrialCount >= config.halfOpenTrialCount) {
        failureCount = 0;
        halfOpenTrialCount = 0;
        changeState(CircuitState.CLOSED, 'half_open_success');
      }
    } else if (state === CircuitState.CLOSED) {
      failureCount = 0;
    }
  };

  /**
   * Check if circuit should allow request
   */
  const canExecute = () => {
    if (state === CircuitState.CLOSED) return true;
    if (state === CircuitState.OPEN && Date.now() >= nextAttemptTime) {
      changeState(CircuitState.HALF_OPEN, 'reset_timeout_elapsed');
      halfOpenTrialCount = 0;
      return true;
    }
    return state === CircuitState.HALF_OPEN;
  };

  /**
   * Sleep for delay with exponential backoff
   */
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  /**
   * Calculate delay for retry attempt
   */
  const getRetryDelay = (attempt) => {
    return config.baseDelayMs * Math.pow(config.backoffFactor, attempt);
  };

  /**
   * Execute operation with circuit breaker and retry logic
   */
  return async function wrappedOperation(operation) {
    if (!canExecute()) {
      const error = new Error(`Circuit breaker ${name} is OPEN`);
      error.circuitBreakerOpen = true;
      throw error;
    }

    let lastError;
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        const result = await operation();
        recordSuccess();
        
        if (externalCallRetriesTotal && attempt > 0) {
          externalCallRetriesTotal.inc({ breaker: name, outcome: 'success' });
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        const shouldRetry = config.retryOn(error, attempt);
        
        if (attempt < config.maxRetries && shouldRetry) {
          const delay = getRetryDelay(attempt);
          
          logger.warn({
            msg: 'Operation failed, retrying',
            requestId: getCorrelationId(),
            breaker: name,
            attempt: attempt + 1,
            maxRetries: config.maxRetries,
            delay,
            error: error.message
          });
          
          if (externalCallRetriesTotal) {
            externalCallRetriesTotal.inc({ breaker: name, outcome: 'retry' });
          }
          
          await sleep(delay);
        } else {
          recordFailure();
          
          if (externalCallRetriesTotal) {
            externalCallRetriesTotal.inc({ breaker: name, outcome: 'failure' });
          }
          
          logger.error({
            msg: 'Operation failed after all retries',
            requestId: getCorrelationId(),
            breaker: name,
            attempts: attempt + 1,
            finalError: error.message
          });
          
          throw error;
        }
      }
    }

    throw lastError;
  };
}

/**
 * Default retry condition - retry on network/timeout errors but not client errors
 */
function defaultRetryCondition(error, attempt) {
  // Don't retry client errors (4xx)
  if (error.response && error.response.status >= 400 && error.response.status < 500) {
    return false;
  }
  
  // Retry on network errors, timeouts, 5xx errors
  return true;
}

/**
 * Wrapper that combines circuit breaker with existing timeExternal metrics
 * @param {Function} breaker - Circuit breaker function
 * @param {Function} fn - Function to wrap
 * @param {string} service - Service name for metrics
 * @param {string} operation - Operation name for metrics
 * @returns {Function} Wrapped function with resilience and timing
 */
function withResilience(breaker, fn, service = 'unknown', operation = 'call') {
  const { timeExternal } = require('../observability/metrics');
  
  return async function resilientOperation(...args) {
    return await breaker(async () => {
      return await timeExternal(service, operation, async () => {
        return await fn(...args);
      });
    });
  };
}

module.exports = {
  createBreaker,
  withResilience,
  CircuitState
};
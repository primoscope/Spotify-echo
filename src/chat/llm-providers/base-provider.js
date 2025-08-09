/**
 * Base LLM Provider Interface
 * Abstract class for all LLM providers with enhanced retry/backoff and telemetry
 */
class BaseLLMProvider {
  constructor(config) {
    this.config = {
      maxRetries: 3,
      baseDelay: 1000, // 1 second
      maxDelay: 30000, // 30 seconds
      backoffMultiplier: 2,
      timeout: 30000,
      enableTelemetry: true,
      ...config,
    };
    this.name = this.constructor.name;
    this.isInitialized = false;
    this.telemetry = {
      requests: 0,
      successes: 0,
      failures: 0,
      totalLatency: 0,
      averageLatency: 0,
      lastRequestTime: null,
      errors: [],
      retryAttempts: 0,
    };
  }

  /**
   * Initialize the provider
   */
  async initialize() {
    this.isInitialized = true;
    this.resetTelemetry();
  }

  /**
   * Generate chat completion with retry logic and telemetry
   * @param {Array} messages - Array of message objects
   * @param {Object} options - Generation options
   * @returns {Object} Response object
   */
  async generateCompletion(messages, options = {}) {
    return await this.executeWithRetry(async () => {
      const startTime = Date.now();

      try {
        this.recordRequest();

        const response = await this._generateCompletion(messages, options);
        const latency = Date.now() - startTime;

        this.recordSuccess(latency);

        return this.parseResponse(response);
      } catch (error) {
        const latency = Date.now() - startTime;
        this.recordFailure(error, latency);
        throw error;
      }
    });
  }

  /**
   * Internal method to be implemented by subclasses
   */
  async _generateCompletion() {
    throw new Error('_generateCompletion must be implemented by subclass');
  }

  /**
   * Generate streaming completion
   * @param {Array} messages - Array of message objects
   * @param {Object} options - Generation options
   * @returns {AsyncGenerator} Stream of response chunks
   */
  async *generateStreamingCompletion() {
    throw new Error('generateStreamingCompletion must be implemented by subclass');
    // eslint-disable-next-line no-unreachable
    yield; // This will never execute but satisfies the generator requirement
  }

  /**
   * Check if provider is available and configured
   */
  isAvailable() {
    return this.isInitialized && this.config && this.validateConfig();
  }

  /**
   * Validate provider configuration
   */
  validateConfig() {
    throw new Error('validateConfig must be implemented by subclass');
  }

  /**
   * Get provider capabilities
   */
  getCapabilities() {
    return {
      streaming: false,
      functionCalling: false,
      maxTokens: 4096,
      supportedModels: [],
    };
  }

  /**
   * Format messages for provider
   */
  formatMessages(messages) {
    return messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  /**
   * Parse response from provider
   */
  parseResponse(response) {
    return {
      content: response.content || '',
      role: 'assistant',
      model: response.model || 'unknown',
      usage: response.usage || {},
      metadata: response.metadata || {},
    };
  }

  /**
   * Handle errors from provider
   */
  handleError(error) {
    console.error(`${this.name} error:`, error);
    return {
      error: true,
      message: error.message || 'Unknown error occurred',
      provider: this.name,
    };
  }

  /**
   * Execute operation with exponential backoff retry logic
   */
  async executeWithRetry(operation, attempt = 0) {
    try {
      return await this.withTimeout(operation(), this.config.timeout);
    } catch (error) {
      if (attempt >= this.config.maxRetries) {
        throw error;
      }

      // Check if error is retryable
      if (!this.isRetryableError(error)) {
        throw error;
      }

      this.telemetry.retryAttempts++;

      const delay = Math.min(
        this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt),
        this.config.maxDelay
      );

      console.warn(
        `${this.name} retry attempt ${attempt + 1}/${this.config.maxRetries} after ${delay}ms:`,
        error.message
      );

      await this.sleep(delay);
      return this.executeWithRetry(operation, attempt + 1);
    }
  }

  /**
   * Determine if an error is retryable
   */
  isRetryableError(error) {
    // Retry on network errors, rate limits, and temporary server errors
    const retryableErrors = [
      'ECONNRESET',
      'ENOTFOUND',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'rate_limit_exceeded',
      'service_unavailable',
      'internal_server_error',
    ];

    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code?.toLowerCase() || '';
    const httpStatus = error.status || error.statusCode;

    // Don't retry on authentication errors
    if (httpStatus === 401 || httpStatus === 403) {
      return false;
    }

    // Retry on 5xx errors and 429 (rate limit)
    if (httpStatus >= 500 || httpStatus === 429) {
      return true;
    }

    // Check error message/code
    return retryableErrors.some(
      (retryable) => errorMessage.includes(retryable) || errorCode.includes(retryable)
    );
  }

  /**
   * Add timeout wrapper to operations
   */
  withTimeout(promise, timeoutMs) {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
      ),
    ]);
  }

  /**
   * Sleep utility for retry delays
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  /**
   * Record telemetry data for requests
   */
  recordRequest() {
    if (!this.config.enableTelemetry) return;

    this.telemetry.requests++;
    this.telemetry.lastRequestTime = new Date().toISOString();
  }

  /**
   * Record successful request telemetry
   */
  recordSuccess(latency) {
    if (!this.config.enableTelemetry) return;

    this.telemetry.successes++;
    this.telemetry.totalLatency += latency;
    this.telemetry.averageLatency = this.telemetry.totalLatency / this.telemetry.successes;
  }

  /**
   * Record failed request telemetry
   */
  recordFailure(error, latency) {
    if (!this.config.enableTelemetry) return;

    this.telemetry.failures++;
    this.telemetry.totalLatency += latency;

    // Keep last 10 errors
    this.telemetry.errors.unshift({
      message: error.message,
      timestamp: new Date().toISOString(),
      latency,
    });

    if (this.telemetry.errors.length > 10) {
      this.telemetry.errors.pop();
    }
  }

  /**
   * Get telemetry data
   */
  getTelemetry() {
    return {
      ...this.telemetry,
      successRate:
        this.telemetry.requests > 0
          ? ((this.telemetry.successes / this.telemetry.requests) * 100).toFixed(2) + '%'
          : '0%',
      failureRate:
        this.telemetry.requests > 0
          ? ((this.telemetry.failures / this.telemetry.requests) * 100).toFixed(2) + '%'
          : '0%',
    };
  }

  /**
   * Reset telemetry data
   */
  resetTelemetry() {
    this.telemetry = {
      requests: 0,
      successes: 0,
      failures: 0,
      totalLatency: 0,
      averageLatency: 0,
      lastRequestTime: null,
      errors: [],
      retryAttempts: 0,
    };
  }

  /**
   * Get token count estimate
   */
  estimateTokens(text) {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
}

module.exports = BaseLLMProvider;

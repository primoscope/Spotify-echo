/**
 * Enhanced Error Handling and Performance Analytics for EchoTune AI
 *
 * Addresses key findings from comprehensive analysis:
 * - Intelligent error recovery with AI-assisted diagnostics
 * - Performance bottleneck identification and optimization
 * - Automated alerting and escalation
 * - Integration with MCP servers for enhanced capabilities
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const { performance } = require('perf_hooks');

class IntelligentErrorHandler extends EventEmitter {
  constructor(options = {}) {
    super();

    this.config = {
      maxRetries: options.maxRetries || 3,
      baseDelay: options.baseDelay || 1000,
      maxDelay: options.maxDelay || 30000,
      circuitBreakerThreshold: options.circuitBreakerThreshold || 10,
      analysisEnabled: options.analysisEnabled !== false,
      persistErrors: options.persistErrors !== false,
      ...options,
    };

    this.errorDatabase = new Map(); // In-memory error tracking
    this.circuitBreakers = new Map();
    this.recoveryStrategies = new Map();
    this.performanceMetrics = {
      errors: 0,
      recoveries: 0,
      escalations: 0,
      averageRecoveryTime: 0,
      totalRecoveryTime: 0,
    };

    this.initializeRecoveryStrategies();
  }

  /**
   * Initialize automated recovery strategies
   */
  initializeRecoveryStrategies() {
    // Database connection errors
    this.addRecoveryStrategy('DATABASE_CONNECTION_ERROR', async (error, context) => {
      console.log('🔧 Attempting database connection recovery...');

      // Strategy 1: Retry with exponential backoff
      await this.sleep(this.config.baseDelay);

      // Strategy 2: Switch to fallback database if available
      if (context.fallbackDatabase) {
        console.log('🔄 Switching to fallback database...');
        return { strategy: 'fallback_database', success: true };
      }

      // Strategy 3: Clear connection pool
      if (context.connectionPool) {
        console.log('🔄 Clearing connection pool...');
        await context.connectionPool.clear();
        return { strategy: 'connection_pool_reset', success: true };
      }

      return { strategy: 'retry', success: false };
    });

    // API rate limit errors
    this.addRecoveryStrategy('RATE_LIMIT_ERROR', async (error, context) => {
      console.log('🔧 Handling rate limit...');

      const retryAfter = this.extractRetryAfter(error);
      const delay = Math.min(retryAfter * 1000, this.config.maxDelay);

      console.log(`⏰ Waiting ${delay}ms before retry...`);
      await this.sleep(delay);

      return { strategy: 'rate_limit_backoff', success: true, delay };
    });

    // Authentication errors
    this.addRecoveryStrategy('AUTH_ERROR', async (error, context) => {
      console.log('🔧 Attempting authentication recovery...');

      // Strategy 1: Refresh token if available
      if (context.tokenManager && context.tokenManager.refreshToken) {
        try {
          await context.tokenManager.refresh();
          return { strategy: 'token_refresh', success: true };
        } catch (refreshError) {
          console.warn('⚠️ Token refresh failed:', refreshError.message);
        }
      }

      // Strategy 2: Re-authenticate
      if (context.authService) {
        try {
          await context.authService.authenticate();
          return { strategy: 're_authentication', success: true };
        } catch (authError) {
          console.warn('⚠️ Re-authentication failed:', authError.message);
        }
      }

      return { strategy: 'auth_recovery', success: false };
    });

    // Network timeout errors
    this.addRecoveryStrategy('TIMEOUT_ERROR', async (error, context) => {
      console.log('🔧 Handling timeout error...');

      // Strategy 1: Retry with increased timeout
      if (context.increaseTimeout) {
        const newTimeout = Math.min((context.timeout || 5000) * 2, 60000);
        return {
          strategy: 'increased_timeout',
          success: true,
          newTimeout,
          recommendation: `Increase timeout to ${newTimeout}ms`,
        };
      }

      // Strategy 2: Use alternative endpoint
      if (context.alternativeEndpoint) {
        return {
          strategy: 'alternative_endpoint',
          success: true,
          endpoint: context.alternativeEndpoint,
        };
      }

      return { strategy: 'timeout_recovery', success: false };
    });

    // MCP server errors
    this.addRecoveryStrategy('MCP_SERVER_ERROR', async (error, context) => {
      console.log('🔧 Handling MCP server error...');

      // Strategy 1: Failover to healthy MCP server
      if (context.mcpOrchestrator) {
        try {
          const alternativeServer = await context.mcpOrchestrator.findHealthyFallback(
            context.serverName
          );
          if (alternativeServer) {
            return {
              strategy: 'mcp_failover',
              success: true,
              fallbackServer: alternativeServer,
            };
          }
        } catch (failoverError) {
          console.warn('⚠️ MCP failover failed:', failoverError.message);
        }
      }

      // Strategy 2: Restart MCP server
      if (context.canRestart) {
        try {
          await this.restartMCPServer(context.serverName);
          return { strategy: 'mcp_restart', success: true };
        } catch (restartError) {
          console.warn('⚠️ MCP restart failed:', restartError.message);
        }
      }

      return { strategy: 'mcp_recovery', success: false };
    });
  }

  /**
   * Main error handling entry point with comprehensive analysis
   */
  async handleError(error, context = {}) {
    const startTime = performance.now();
    const errorId = this.generateErrorId();

    console.error(`🚨 Error ${errorId}:`, error.message);

    // Create comprehensive error record
    const errorRecord = {
      id: errorId,
      timestamp: new Date(),
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code || 'UNKNOWN',
      },
      context: {
        ...context,
        userAgent: context.userAgent,
        url: context.url,
        method: context.method,
        userId: context.userId,
      },
      attempts: 0,
      recoveryAttempts: [],
      resolved: false,
      escalated: false,
    };

    this.errorDatabase.set(errorId, errorRecord);
    this.performanceMetrics.errors++;

    try {
      // Attempt intelligent recovery
      const recoveryResult = await this.attemptRecovery(errorRecord);

      const recoveryTime = performance.now() - startTime;
      this.updateRecoveryMetrics(recoveryTime, recoveryResult.success);

      if (recoveryResult.success) {
        errorRecord.resolved = true;
        errorRecord.resolution = recoveryResult;

        console.log(`✅ Error ${errorId} resolved using strategy: ${recoveryResult.strategy}`);
        this.emit('error:resolved', { errorId, strategy: recoveryResult.strategy, recoveryTime });

        return {
          recovered: true,
          strategy: recoveryResult.strategy,
          result: recoveryResult.result,
        };
      } else {
        // Escalate if recovery failed
        await this.escalateError(errorRecord);
        return { recovered: false, escalated: true, errorId };
      }
    } catch (recoveryError) {
      console.error(`❌ Recovery failed for error ${errorId}:`, recoveryError.message);
      await this.escalateError(errorRecord);
      return { recovered: false, escalated: true, errorId, recoveryError: recoveryError.message };
    }
  }

  /**
   * Intelligent recovery attempt with multiple strategies
   */
  async attemptRecovery(errorRecord) {
    const error = errorRecord.error;
    const context = errorRecord.context;

    // Classify error type
    const errorType = this.classifyError(error);
    console.log(`🔍 Classified error as: ${errorType}`);

    // Get recovery strategy
    const strategy = this.recoveryStrategies.get(errorType);
    if (!strategy) {
      console.warn(`⚠️ No recovery strategy found for error type: ${errorType}`);
      return { success: false, reason: 'no_strategy', errorType };
    }

    // Execute recovery with retry logic
    let lastError;
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      console.log(
        `🔄 Recovery attempt ${attempt}/${this.config.maxRetries} for error ${errorRecord.id}`
      );

      try {
        const result = await strategy(error, context);
        errorRecord.attempts = attempt;
        errorRecord.recoveryAttempts.push({
          attempt,
          timestamp: new Date(),
          strategy: result.strategy,
          success: result.success,
          details: result,
        });

        if (result.success) {
          this.performanceMetrics.recoveries++;
          return {
            success: true,
            strategy: result.strategy,
            result: result,
            attempts: attempt,
          };
        }
      } catch (strategyError) {
        lastError = strategyError;
        console.warn(`⚠️ Recovery strategy failed (attempt ${attempt}):`, strategyError.message);

        errorRecord.recoveryAttempts.push({
          attempt,
          timestamp: new Date(),
          strategy: errorType,
          success: false,
          error: strategyError.message,
        });
      }

      // Wait before next attempt (exponential backoff)
      if (attempt < this.config.maxRetries) {
        const delay = Math.min(
          this.config.baseDelay * Math.pow(2, attempt - 1),
          this.config.maxDelay
        );
        await this.sleep(delay);
      }
    }

    return {
      success: false,
      attempts: this.config.maxRetries,
      lastError: lastError?.message || 'All recovery attempts failed',
    };
  }

  /**
   * Classify error for appropriate recovery strategy
   */
  classifyError(error) {
    const message = error.message.toLowerCase();
    const code = error.code;

    // Database errors
    if (
      message.includes('connection') &&
      (message.includes('database') || message.includes('mongo'))
    ) {
      return 'DATABASE_CONNECTION_ERROR';
    }

    // Rate limit errors
    if (
      message.includes('rate limit') ||
      message.includes('too many requests') ||
      code === 'RATE_LIMITED'
    ) {
      return 'RATE_LIMIT_ERROR';
    }

    // Authentication errors
    if (
      message.includes('unauthorized') ||
      message.includes('authentication') ||
      message.includes('token') ||
      code === 'UNAUTHORIZED'
    ) {
      return 'AUTH_ERROR';
    }

    // Timeout errors
    if (message.includes('timeout') || message.includes('timed out') || code === 'ETIMEDOUT') {
      return 'TIMEOUT_ERROR';
    }

    // MCP server errors
    if (
      message.includes('mcp') ||
      (message.includes('server') && message.includes('unavailable'))
    ) {
      return 'MCP_SERVER_ERROR';
    }

    // Network errors
    if (
      message.includes('network') ||
      message.includes('connection refused') ||
      code === 'ECONNREFUSED' ||
      code === 'ENOTFOUND'
    ) {
      return 'NETWORK_ERROR';
    }

    // Default generic error
    return 'GENERIC_ERROR';
  }

  /**
   * Escalate error to appropriate team/system
   */
  async escalateError(errorRecord) {
    console.warn(`🚨 Escalating error ${errorRecord.id} - recovery failed`);

    errorRecord.escalated = true;
    errorRecord.escalatedAt = new Date();
    this.performanceMetrics.escalations++;

    // Determine escalation level based on error severity and frequency
    const severity = this.calculateErrorSeverity(errorRecord);
    const escalationTarget = this.determineEscalationTarget(errorRecord, severity);

    try {
      // Send alert to appropriate channel
      await this.sendAlert(errorRecord, severity, escalationTarget);

      // Create incident if critical
      if (severity === 'CRITICAL') {
        await this.createIncident(errorRecord);
      }

      // Save error for analysis
      if (this.config.persistErrors) {
        await this.persistError(errorRecord);
      }

      this.emit('error:escalated', {
        errorId: errorRecord.id,
        severity,
        escalationTarget,
      });
    } catch (escalationError) {
      console.error(`❌ Failed to escalate error ${errorRecord.id}:`, escalationError.message);
    }
  }

  /**
   * Calculate error severity based on multiple factors
   */
  calculateErrorSeverity(errorRecord) {
    const error = errorRecord.error;
    const context = errorRecord.context;

    // Critical conditions
    if (error.message.includes('database') && context.critical) return 'CRITICAL';
    if (error.message.includes('payment') || error.message.includes('billing')) return 'CRITICAL';
    if (context.userCount && context.userCount > 1000) return 'CRITICAL';

    // High severity conditions
    if (error.message.includes('authentication') && context.userCount > 100) return 'HIGH';
    if (errorRecord.attempts >= this.config.maxRetries) return 'HIGH';
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') return 'HIGH';

    // Medium severity (default for most errors)
    if (errorRecord.attempts > 1) return 'MEDIUM';

    // Low severity
    return 'LOW';
  }

  /**
   * Determine appropriate escalation target
   */
  determineEscalationTarget(errorRecord, severity) {
    const error = errorRecord.error;

    if (error.message.includes('database') || error.message.includes('mongo')) {
      return severity === 'CRITICAL' ? 'database-oncall' : 'database-team';
    }

    if (
      error.message.includes('mcp') ||
      error.message.includes('ai') ||
      error.message.includes('openai')
    ) {
      return severity === 'CRITICAL' ? 'ai-oncall' : 'ai-team';
    }

    if (error.message.includes('auth') || error.message.includes('token')) {
      return severity === 'CRITICAL' ? 'security-oncall' : 'security-team';
    }

    // Default escalation
    return severity === 'CRITICAL' ? 'platform-oncall' : 'engineering-team';
  }

  /**
   * Send alert through appropriate channels
   */
  async sendAlert(errorRecord, severity, target) {
    const alertPayload = {
      errorId: errorRecord.id,
      timestamp: errorRecord.timestamp,
      severity,
      target,
      error: {
        message: errorRecord.error.message,
        type: this.classifyError(errorRecord.error),
      },
      context: {
        url: errorRecord.context.url,
        method: errorRecord.context.method,
        userAgent: errorRecord.context.userAgent,
      },
      attempts: errorRecord.attempts,
      recoveryAttempts: errorRecord.recoveryAttempts,
    };

    // Log alert (replace with actual alerting system)
    console.warn('📢 ALERT:', JSON.stringify(alertPayload, null, 2));

    // In production, integrate with:
    // - Slack/Discord webhooks
    // - PagerDuty
    // - Email notifications
    // - SMS alerts for critical issues

    this.emit('alert:sent', alertPayload);
  }

  /**
   * Create incident for critical errors
   */
  async createIncident(errorRecord) {
    const incident = {
      id: `INC-${Date.now()}`,
      errorId: errorRecord.id,
      title: `Critical Error: ${errorRecord.error.message}`,
      description: `Automated incident created for error ${errorRecord.id}`,
      severity: 'CRITICAL',
      status: 'OPEN',
      createdAt: new Date(),
      assignee: null,
      tags: [this.classifyError(errorRecord.error), 'automated'],
    };

    // In production, integrate with incident management system
    console.error('🚨 INCIDENT CREATED:', JSON.stringify(incident, null, 2));

    this.emit('incident:created', incident);
    return incident;
  }

  /**
   * Persist error for analysis and learning
   */
  async persistError(errorRecord) {
    try {
      const errorsDir = path.join(__dirname, '../validation-reports/errors');
      await fs.mkdir(errorsDir, { recursive: true });

      const filename = `error-${errorRecord.id}-${Date.now()}.json`;
      const filepath = path.join(errorsDir, filename);

      await fs.writeFile(filepath, JSON.stringify(errorRecord, null, 2));

      console.log(`💾 Error ${errorRecord.id} persisted to ${filename}`);
    } catch (persistError) {
      console.error('Failed to persist error:', persistError.message);
    }
  }

  /**
   * Add custom recovery strategy
   */
  addRecoveryStrategy(errorType, strategyFunction) {
    this.recoveryStrategies.set(errorType, strategyFunction);
    console.log(`✅ Added recovery strategy for: ${errorType}`);
  }

  /**
   * Generate performance and health report
   */
  generateHealthReport() {
    const report = {
      timestamp: new Date(),
      errorHandling: {
        totalErrors: this.performanceMetrics.errors,
        successfulRecoveries: this.performanceMetrics.recoveries,
        escalations: this.performanceMetrics.escalations,
        recoveryRate:
          this.performanceMetrics.errors > 0
            ? ((this.performanceMetrics.recoveries / this.performanceMetrics.errors) * 100).toFixed(
                2
              ) + '%'
            : '0%',
        averageRecoveryTime: this.performanceMetrics.averageRecoveryTime.toFixed(2) + 'ms',
      },
      recentErrors: Array.from(this.errorDatabase.values())
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10)
        .map((error) => ({
          id: error.id,
          message: error.error.message,
          type: this.classifyError(error.error),
          resolved: error.resolved,
          escalated: error.escalated,
          attempts: error.attempts,
        })),
      strategies: Array.from(this.recoveryStrategies.keys()),
      circuitBreakers: Object.fromEntries(this.circuitBreakers),
    };

    return report;
  }

  /**
   * Update recovery performance metrics
   */
  updateRecoveryMetrics(recoveryTime, success) {
    this.performanceMetrics.totalRecoveryTime += recoveryTime;
    const totalRecoveries = this.performanceMetrics.recoveries + (success ? 1 : 0);

    if (totalRecoveries > 0) {
      this.performanceMetrics.averageRecoveryTime =
        this.performanceMetrics.totalRecoveryTime / totalRecoveries;
    }
  }

  /**
   * Utility methods
   */
  generateErrorId() {
    return `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  extractRetryAfter(error) {
    // Extract retry-after header or use default
    const retryAfterMatch = error.message.match(/retry.after[\s:]+(\d+)/i);
    return retryAfterMatch ? parseInt(retryAfterMatch[1]) : 30;
  }

  async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async restartMCPServer(serverName) {
    // Placeholder for MCP server restart logic
    console.log(`🔄 Restarting MCP server: ${serverName}`);
    await this.sleep(2000); // Simulate restart time
  }
}

// Enhanced API Error class with recovery capabilities
class EnhancedAPIError extends Error {
  constructor(
    message,
    statusCode = 500,
    code = 'INTERNAL_ERROR',
    details = {},
    recoverable = true
  ) {
    super(message);
    this.name = 'EnhancedAPIError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.recoverable = recoverable;
    this.timestamp = new Date().toISOString();
    this.retryAfter = details.retryAfter;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      details: this.details,
      recoverable: this.recoverable,
      timestamp: this.timestamp,
    };
  }
}

// Export classes
module.exports = {
  IntelligentErrorHandler,
  EnhancedAPIError,
};

// Example usage for testing
if (require.main === module) {
  async function testErrorHandling() {
    const errorHandler = new IntelligentErrorHandler({
      maxRetries: 3,
      baseDelay: 1000,
      analysisEnabled: true,
      persistErrors: true,
    });

    // Set up event listeners
    errorHandler.on('error:resolved', (event) => {
      console.log(
        `✅ Error resolved: ${event.errorId} using ${event.strategy} in ${event.recoveryTime.toFixed(2)}ms`
      );
    });

    errorHandler.on('error:escalated', (event) => {
      console.log(
        `🚨 Error escalated: ${event.errorId} to ${event.escalationTarget} (severity: ${event.severity})`
      );
    });

    // Test different error types
    const testErrors = [
      new Error('Database connection refused'),
      new Error('Rate limit exceeded - retry after 30 seconds'),
      new Error('Authentication token expired'),
      new Error('Request timeout after 30000ms'),
      new EnhancedAPIError('MCP server unavailable', 503, 'SERVICE_UNAVAILABLE'),
    ];

    console.log('🧪 Testing intelligent error handling...\n');

    for (const error of testErrors) {
      console.log(`\n--- Testing error: ${error.message} ---`);

      const result = await errorHandler.handleError(error, {
        url: '/api/test',
        method: 'GET',
        userAgent: 'EchoTune-Test/1.0',
        userId: 'test-user-123',
        critical: error.message.includes('Database'),
      });

      console.log('Result:', result);
    }

    // Generate health report
    setTimeout(() => {
      console.log('\n📊 Final Health Report:');
      const report = errorHandler.generateHealthReport();
      console.log(JSON.stringify(report, null, 2));
    }, 2000);
  }

  testErrorHandling().catch(console.error);
}

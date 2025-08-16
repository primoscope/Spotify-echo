/**
 * Enhanced MCP Server Orchestrator with Intelligent Failover and Performance Monitoring
 *
 * This enhanced orchestrator addresses key issues identified in the comprehensive analysis:
 * - Automatic health monitoring and recovery
 * - Circuit breaker patterns for resilience
 * - Performance analytics and optimization
 * - Intelligent load balancing and failover
 */

const EventEmitter = require('events');
const { performance } = require('perf_hooks');
const fs = require('fs').promises;
const path = require('path');

class CircuitBreaker {
  constructor(name, options = {}) {
    this.name = name;
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.monitoringInterval = options.monitoringInterval || 30000; // 30 seconds

    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failures = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
    this.requestCount = 0;
  }

  async execute(fn, ...args) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
      } else {
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      }
    }

    try {
      const result = await fn(...args);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failures = 0;
    this.requestCount++;

    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= 3) {
        // Require 3 successes to close
        this.state = 'CLOSED';
      }
    }
  }

  onFailure() {
    this.failures++;
    this.requestCount++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getStats() {
    return {
      name: this.name,
      state: this.state,
      failures: this.failures,
      requestCount: this.requestCount,
      successRate:
        this.requestCount > 0 ? (this.requestCount - this.failures) / this.requestCount : 0,
    };
  }
}

class MCPServerManager extends EventEmitter {
  constructor() {
    super();
    this.servers = new Map();
    this.circuitBreakers = new Map();
    this.healthChecks = new Map();
    this.performanceMetrics = new Map();
    this.isRunning = false;

    // Configuration
    this.config = {
      healthCheckInterval: 30000, // 30 seconds
      performanceReportInterval: 300000, // 5 minutes
      maxRetries: 3,
      requestTimeout: 30000,
      circuitBreakerOptions: {
        failureThreshold: 5,
        resetTimeout: 60000,
        monitoringInterval: 30000,
      },
    };

    // Initialize monitoring
    this.startMonitoring();
  }

  /**
   * Register an MCP server with enhanced configuration
   */
  async registerServer(name, config) {
    const serverInfo = {
      name,
      config,
      status: 'INITIALIZING',
      lastHealthCheck: null,
      healthHistory: [],
      performanceHistory: [],
      connection: null,
      startedAt: new Date(),
      restartCount: 0,
    };

    this.servers.set(name, serverInfo);
    this.circuitBreakers.set(name, new CircuitBreaker(name, this.config.circuitBreakerOptions));
    this.performanceMetrics.set(name, {
      requests: 0,
      successes: 0,
      failures: 0,
      totalResponseTime: 0,
      averageResponseTime: 0,
      lastRequest: null,
    });

    try {
      await this.initializeServer(serverInfo);
      this.emit('server:registered', { name, status: 'SUCCESS' });
      console.log(`✅ MCP Server '${name}' registered successfully`);
    } catch (error) {
      serverInfo.status = 'FAILED';
      this.emit('server:registered', { name, status: 'FAILED', error: error.message });
      console.error(`❌ Failed to register MCP Server '${name}':`, error.message);
    }
  }

  /**
   * Initialize individual server with connection and health monitoring
   */
  async initializeServer(serverInfo) {
    const startTime = performance.now();

    try {
      // Simulate server initialization - replace with actual MCP connection logic
      await this.connectToServer(serverInfo);

      serverInfo.status = 'HEALTHY';
      serverInfo.lastHealthCheck = new Date();

      const responseTime = performance.now() - startTime;
      this.updatePerformanceMetrics(serverInfo.name, responseTime, true);

      console.log(`🚀 Server '${serverInfo.name}' initialized in ${responseTime.toFixed(2)}ms`);
    } catch (error) {
      serverInfo.status = 'UNHEALTHY';
      this.updatePerformanceMetrics(serverInfo.name, performance.now() - startTime, false);
      throw error;
    }
  }

  /**
   * Execute request with circuit breaker and performance monitoring
   */
  async executeRequest(serverName, operation, ...args) {
    const server = this.servers.get(serverName);
    if (!server) {
      throw new Error(`Server '${serverName}' not found`);
    }

    const circuitBreaker = this.circuitBreakers.get(serverName);
    const startTime = performance.now();

    try {
      const result = await circuitBreaker.execute(async () => {
        // Simulate server request - replace with actual MCP operation
        const response = await this.performServerOperation(server, operation, ...args);
        return response;
      });

      const responseTime = performance.now() - startTime;
      this.updatePerformanceMetrics(serverName, responseTime, true);

      this.emit('request:success', {
        serverName,
        operation,
        responseTime,
        timestamp: new Date(),
      });

      return result;
    } catch (error) {
      const responseTime = performance.now() - startTime;
      this.updatePerformanceMetrics(serverName, responseTime, false);

      this.emit('request:failure', {
        serverName,
        operation,
        error: error.message,
        responseTime,
        timestamp: new Date(),
      });

      // Attempt failover if available
      const fallbackResult = await this.attemptFailover(serverName, operation, ...args);
      if (fallbackResult) {
        return fallbackResult;
      }

      throw error;
    }
  }

  /**
   * Intelligent failover mechanism
   */
  async attemptFailover(failedServerName, operation, ...args) {
    const fallbackServers = this.findHealthyFallbackServers(failedServerName);

    if (fallbackServers.length === 0) {
      console.warn(`⚠️ No healthy fallback servers available for '${failedServerName}'`);
      return null;
    }

    for (const fallbackName of fallbackServers) {
      try {
        console.log(`🔄 Attempting failover from '${failedServerName}' to '${fallbackName}'`);
        const result = await this.executeRequest(fallbackName, operation, ...args);

        this.emit('failover:success', {
          from: failedServerName,
          to: fallbackName,
          operation,
          timestamp: new Date(),
        });

        return result;
      } catch (error) {
        console.warn(`⚠️ Failover to '${fallbackName}' also failed:`, error.message);
      }
    }

    return null;
  }

  /**
   * Find healthy servers that can serve as fallbacks
   */
  findHealthyFallbackServers(excludeServerName) {
    const healthyServers = [];

    for (const [name, server] of this.servers) {
      if (name !== excludeServerName && server.status === 'HEALTHY') {
        const circuitBreaker = this.circuitBreakers.get(name);
        if (circuitBreaker.state === 'CLOSED') {
          healthyServers.push(name);
        }
      }
    }

    // Sort by performance (fastest first)
    return healthyServers.sort((a, b) => {
      const aMetrics = this.performanceMetrics.get(a);
      const bMetrics = this.performanceMetrics.get(b);
      return aMetrics.averageResponseTime - bMetrics.averageResponseTime;
    });
  }

  /**
   * Comprehensive health monitoring
   */
  async performHealthCheck(serverName) {
    const server = this.servers.get(serverName);
    if (!server) return;

    const startTime = performance.now();
    let isHealthy = false;

    try {
      // Perform actual health check - replace with real implementation
      await this.checkServerHealth(server);
      isHealthy = true;
      server.status = 'HEALTHY';
    } catch (error) {
      server.status = 'UNHEALTHY';
      console.warn(`⚠️ Health check failed for '${serverName}':`, error.message);

      // Attempt automatic recovery
      await this.attemptServerRecovery(server);
    }

    const responseTime = performance.now() - startTime;
    const healthRecord = {
      timestamp: new Date(),
      isHealthy,
      responseTime,
      status: server.status,
    };

    server.healthHistory.push(healthRecord);
    server.lastHealthCheck = new Date();

    // Keep only last 100 health records
    if (server.healthHistory.length > 100) {
      server.healthHistory = server.healthHistory.slice(-100);
    }

    this.emit('health:checked', { serverName, ...healthRecord });
  }

  /**
   * Automatic server recovery
   */
  async attemptServerRecovery(server) {
    console.log(`🔧 Attempting recovery for server '${server.name}'...`);

    try {
      // Graceful shutdown
      await this.shutdownServer(server);

      // Wait a moment
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Restart
      await this.initializeServer(server);

      server.restartCount++;
      console.log(
        `✅ Server '${server.name}' recovered successfully (restart #${server.restartCount})`
      );

      this.emit('server:recovered', {
        serverName: server.name,
        restartCount: server.restartCount,
      });
    } catch (error) {
      console.error(`❌ Recovery failed for server '${server.name}':`, error.message);
      this.emit('server:recovery_failed', {
        serverName: server.name,
        error: error.message,
      });
    }
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics(serverName, responseTime, success) {
    const metrics = this.performanceMetrics.get(serverName);
    if (!metrics) return;

    metrics.requests++;
    metrics.totalResponseTime += responseTime;
    metrics.averageResponseTime = metrics.totalResponseTime / metrics.requests;
    metrics.lastRequest = new Date();

    if (success) {
      metrics.successes++;
    } else {
      metrics.failures++;
    }

    // Add to performance history
    const server = this.servers.get(serverName);
    if (server) {
      server.performanceHistory.push({
        timestamp: new Date(),
        responseTime,
        success,
      });

      // Keep only last 1000 records
      if (server.performanceHistory.length > 1000) {
        server.performanceHistory = server.performanceHistory.slice(-1000);
      }
    }
  }

  /**
   * Start comprehensive monitoring
   */
  startMonitoring() {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('🔍 Starting MCP server monitoring...');

    // Health check interval
    this.healthCheckTimer = setInterval(async () => {
      const healthCheckPromises = Array.from(this.servers.keys()).map((serverName) =>
        this.performHealthCheck(serverName)
      );
      await Promise.allSettled(healthCheckPromises);
    }, this.config.healthCheckInterval);

    // Performance reporting interval
    this.performanceTimer = setInterval(() => {
      this.generatePerformanceReport();
    }, this.config.performanceReportInterval);

    // Circuit breaker monitoring
    this.circuitBreakerTimer = setInterval(() => {
      this.monitorCircuitBreakers();
    }, this.config.circuitBreakerOptions.monitoringInterval);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    this.isRunning = false;

    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    if (this.performanceTimer) {
      clearInterval(this.performanceTimer);
    }
    if (this.circuitBreakerTimer) {
      clearInterval(this.circuitBreakerTimer);
    }

    console.log('🛑 MCP server monitoring stopped');
  }

  /**
   * Generate comprehensive performance report
   */
  generatePerformanceReport() {
    const report = {
      timestamp: new Date(),
      totalServers: this.servers.size,
      healthyServers: 0,
      unhealthyServers: 0,
      circuitBreakerStates: {},
      serverMetrics: {},
      overallHealth: 0,
    };

    for (const [name, server] of this.servers) {
      if (server.status === 'HEALTHY') {
        report.healthyServers++;
      } else {
        report.unhealthyServers++;
      }

      const circuitBreaker = this.circuitBreakers.get(name);
      const metrics = this.performanceMetrics.get(name);

      report.circuitBreakerStates[name] = circuitBreaker.getStats();
      report.serverMetrics[name] = {
        status: server.status,
        uptime: Date.now() - server.startedAt.getTime(),
        restartCount: server.restartCount,
        ...metrics,
        successRate: metrics.requests > 0 ? metrics.successes / metrics.requests : 0,
      };
    }

    report.overallHealth =
      this.servers.size > 0 ? (report.healthyServers / this.servers.size) * 100 : 0;

    // Save report to file
    this.savePerformanceReport(report);

    // Emit event
    this.emit('performance:report', report);

    // Log summary
    console.log(
      `📊 Performance Report: ${report.healthyServers}/${this.servers.size} servers healthy (${report.overallHealth.toFixed(1)}%)`
    );

    return report;
  }

  /**
   * Monitor circuit breaker states
   */
  monitorCircuitBreakers() {
    for (const [name, circuitBreaker] of this.circuitBreakers) {
      const stats = circuitBreaker.getStats();

      if (stats.state === 'OPEN') {
        console.warn(`⚠️ Circuit breaker '${name}' is OPEN - ${stats.failures} failures`);
      } else if (stats.state === 'HALF_OPEN') {
        console.info(`🔄 Circuit breaker '${name}' is HALF_OPEN - testing recovery`);
      }

      // Alert on poor performance
      if (stats.successRate < 0.8 && stats.requestCount > 10) {
        this.emit('alert:low_success_rate', {
          serverName: name,
          successRate: stats.successRate,
          requestCount: stats.requestCount,
        });
      }
    }
  }

  /**
   * Get comprehensive server status
   */
  getServerStatus() {
    const status = {
      timestamp: new Date(),
      servers: {},
      circuitBreakers: {},
      overallHealth: 0,
    };

    let healthyCount = 0;
    for (const [name, server] of this.servers) {
      if (server.status === 'HEALTHY') healthyCount++;

      status.servers[name] = {
        name: server.name,
        status: server.status,
        uptime: Date.now() - server.startedAt.getTime(),
        lastHealthCheck: server.lastHealthCheck,
        restartCount: server.restartCount,
      };

      status.circuitBreakers[name] = this.circuitBreakers.get(name).getStats();
    }

    status.overallHealth = this.servers.size > 0 ? (healthyCount / this.servers.size) * 100 : 0;
    return status;
  }

  /**
   * Save performance report to file
   */
  async savePerformanceReport(report) {
    try {
      const reportsDir = path.join(__dirname, '../validation-reports');
      await fs.mkdir(reportsDir, { recursive: true });

      const filename = `mcp-performance-report-${Date.now()}.json`;
      const filepath = path.join(reportsDir, filename);

      await fs.writeFile(filepath, JSON.stringify(report, null, 2));
    } catch (error) {
      console.error('Failed to save performance report:', error);
    }
  }

  // Placeholder methods - replace with actual MCP implementation
  async connectToServer(serverInfo) {
    // Simulate connection delay
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000 + 500));

    // Simulate occasional connection failures
    if (Math.random() < 0.1) {
      throw new Error('Connection failed');
    }
  }

  async performServerOperation(server, operation, ...args) {
    // Simulate operation execution
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 500 + 100));

    // Simulate occasional operation failures
    if (Math.random() < 0.05) {
      throw new Error('Operation failed');
    }

    return { result: 'success', operation, timestamp: new Date() };
  }

  async checkServerHealth(server) {
    // Simulate health check
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 200 + 50));

    // Simulate occasional health check failures
    if (Math.random() < 0.08) {
      throw new Error('Health check failed');
    }
  }

  async shutdownServer(server) {
    // Simulate graceful shutdown
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

// Export enhanced orchestrator
module.exports = { MCPServerManager, CircuitBreaker };

// CLI interface for testing
if (require.main === module) {
  async function main() {
    const orchestrator = new MCPServerManager();

    // Example server configurations
    const servers = [
      { name: 'filesystem-mcp', config: { type: 'filesystem', port: 3010 } },
      { name: 'memory-mcp', config: { type: 'memory', port: 3011 } },
      { name: 'perplexity-mcp', config: { type: 'perplexity', port: 3012 } },
      { name: 'analytics-mcp', config: { type: 'analytics', port: 3013 } },
    ];

    // Register servers
    for (const server of servers) {
      await orchestrator.registerServer(server.name, server.config);
    }

    // Set up event listeners
    orchestrator.on('server:registered', (event) => {
      console.log(`📝 Event: Server registered - ${event.name} (${event.status})`);
    });

    orchestrator.on('request:failure', (event) => {
      console.log(`📝 Event: Request failed - ${event.serverName}: ${event.error}`);
    });

    orchestrator.on('failover:success', (event) => {
      console.log(`📝 Event: Failover successful - ${event.from} → ${event.to}`);
    });

    orchestrator.on('server:recovered', (event) => {
      console.log(
        `📝 Event: Server recovered - ${event.serverName} (restart #${event.restartCount})`
      );
    });

    // Simulate some operations
    setTimeout(async () => {
      try {
        console.log('\n🔄 Testing server operations...');
        const result = await orchestrator.executeRequest('filesystem-mcp', 'list-files', '/tmp');
        console.log('Operation result:', result);
      } catch (error) {
        console.error('Operation error:', error.message);
      }
    }, 5000);

    // Generate periodic reports
    setTimeout(() => {
      const status = orchestrator.getServerStatus();
      console.log('\n📊 Server Status:', JSON.stringify(status, null, 2));
    }, 10000);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down orchestrator...');
      orchestrator.stopMonitoring();
      process.exit(0);
    });

    console.log('\n✅ Enhanced MCP Server Orchestrator started successfully!');
    console.log('📊 Monitoring health checks every 30 seconds');
    console.log('📈 Performance reports every 5 minutes');
    console.log('Press Ctrl+C to stop\n');
  }

  main().catch(console.error);
}

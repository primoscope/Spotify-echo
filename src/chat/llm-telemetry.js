/**
 * LLM Telemetry System
 * Collects and aggregates performance metrics from all LLM providers
 */

class LLMTelemetry {
  constructor() {
    this.providers = new Map();
    this.aggregatedMetrics = {
      totalRequests: 0,
      totalSuccesses: 0,
      totalFailures: 0,
      averageLatency: 0,
      startTime: new Date().toISOString(),
    };
    this.metricsHistory = [];
    this.collectionInterval = null;
  }

  /**
   * Initialize telemetry collection
   */
  initialize(options = {}) {
    const {
      collectionIntervalMs = 60000, // 1 minute
      historyRetentionHours = 24,
    } = options;

    this.startCollection(collectionIntervalMs);
    this.startHistoryCleanup(historyRetentionHours);

    console.log('📊 LLM Telemetry system initialized');
  }

  /**
   * Register a provider for telemetry collection
   */
  registerProvider(providerId, provider) {
    this.providers.set(providerId, {
      provider,
      lastSnapshot: null,
      metrics: [],
    });
  }

  /**
   * Unregister a provider
   */
  unregisterProvider(providerId) {
    this.providers.delete(providerId);
  }

  /**
   * Collect metrics from all registered providers
   */
  collectMetrics() {
    const timestamp = new Date().toISOString();
    const snapshot = {
      timestamp,
      providers: {},
      aggregated: { ...this.aggregatedMetrics },
    };

    let totalRequests = 0;
    let totalSuccesses = 0;
    let totalFailures = 0;
    let totalLatency = 0;
    let activeProviders = 0;

    for (const [providerId, providerInfo] of this.providers) {
      try {
        const telemetry = providerInfo.provider.getTelemetry();

        snapshot.providers[providerId] = {
          ...telemetry,
          timestamp,
        };

        // Update provider metrics history
        providerInfo.metrics.push({
          timestamp,
          ...telemetry,
        });

        // Keep only last 100 snapshots per provider
        if (providerInfo.metrics.length > 100) {
          providerInfo.metrics.shift();
        }

        providerInfo.lastSnapshot = telemetry;

        // Aggregate metrics
        totalRequests += telemetry.requests;
        totalSuccesses += telemetry.successes;
        totalFailures += telemetry.failures;

        if (telemetry.requests > 0) {
          totalLatency += telemetry.averageLatency * telemetry.requests;
          activeProviders++;
        }
      } catch (error) {
        console.error(`Failed to collect metrics for provider ${providerId}:`, error);
        snapshot.providers[providerId] = {
          error: error.message,
          timestamp,
        };
      }
    }

    // Calculate aggregated metrics
    this.aggregatedMetrics = {
      totalRequests,
      totalSuccesses,
      totalFailures,
      averageLatency: totalRequests > 0 ? totalLatency / totalRequests : 0,
      successRate:
        totalRequests > 0 ? ((totalSuccesses / totalRequests) * 100).toFixed(2) + '%' : '0%',
      failureRate:
        totalRequests > 0 ? ((totalFailures / totalRequests) * 100).toFixed(2) + '%' : '0%',
      activeProviders,
      lastUpdated: timestamp,
    };

    snapshot.aggregated = this.aggregatedMetrics;

    // Store in history
    this.metricsHistory.push(snapshot);

    return snapshot;
  }

  /**
   * Start automatic metrics collection
   */
  startCollection(intervalMs = 60000) {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
    }

    this.collectionInterval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);
  }

  /**
   * Stop automatic metrics collection
   */
  stopCollection() {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
  }

  /**
   * Start automatic history cleanup
   */
  startHistoryCleanup(retentionHours = 24) {
    setInterval(
      () => {
        const cutoff = new Date();
        cutoff.setHours(cutoff.getHours() - retentionHours);

        this.metricsHistory = this.metricsHistory.filter(
          (snapshot) => new Date(snapshot.timestamp) > cutoff
        );
      },
      60 * 60 * 1000
    ); // Check every hour
  }

  /**
   * Get current metrics snapshot
   */
  getCurrentMetrics() {
    return this.collectMetrics();
  }

  /**
   * Get aggregated metrics
   */
  getAggregatedMetrics() {
    return {
      ...this.aggregatedMetrics,
      providersCount: this.providers.size,
    };
  }

  /**
   * Get metrics for a specific provider
   */
  getProviderMetrics(providerId) {
    const providerInfo = this.providers.get(providerId);
    return providerInfo
      ? {
          current: providerInfo.lastSnapshot,
          history: providerInfo.metrics,
        }
      : null;
  }

  /**
   * Get performance insights
   */
  getPerformanceInsights() {
    const insights = {
      recommendations: [],
      alerts: [],
      trends: {},
    };

    // Analyze each provider
    for (const [providerId, providerInfo] of this.providers) {
      const metrics = providerInfo.lastSnapshot;
      if (!metrics || metrics.requests === 0) continue;

      // Performance recommendations
      if (metrics.averageLatency > 5000) {
        insights.recommendations.push({
          type: 'performance',
          provider: providerId,
          message: `High latency detected (${metrics.averageLatency.toFixed(0)}ms). Consider switching to a faster model.`,
          severity: 'medium',
        });
      }

      if (parseFloat(metrics.successRate) < 95) {
        insights.alerts.push({
          type: 'reliability',
          provider: providerId,
          message: `Low success rate (${metrics.successRate}). Check provider health.`,
          severity: 'high',
        });
      }

      if (parseFloat(metrics.successRate) < 80) {
        insights.alerts.push({
          type: 'critical',
          provider: providerId,
          message: `Critical success rate (${metrics.successRate}). Provider may be unhealthy.`,
          severity: 'critical',
        });
      }

      // Retry analysis
      if (metrics.retryAttempts > metrics.requests * 0.1) {
        insights.recommendations.push({
          type: 'reliability',
          provider: providerId,
          message:
            'High retry rate detected. Consider adjusting retry configuration or switching providers.',
          severity: 'medium',
        });
      }
    }

    // Trend analysis (last 10 snapshots)
    if (this.metricsHistory.length >= 10) {
      const recent = this.metricsHistory.slice(-10);
      const older = this.metricsHistory.slice(-20, -10);

      if (older.length >= 10) {
        const recentAvgLatency =
          recent.reduce((sum, s) => sum + s.aggregated.averageLatency, 0) / recent.length;
        const olderAvgLatency =
          older.reduce((sum, s) => sum + s.aggregated.averageLatency, 0) / older.length;

        const latencyTrend = ((recentAvgLatency - olderAvgLatency) / olderAvgLatency) * 100;

        insights.trends.latency = {
          direction: latencyTrend > 5 ? 'increasing' : latencyTrend < -5 ? 'decreasing' : 'stable',
          change: latencyTrend.toFixed(2) + '%',
          current: recentAvgLatency.toFixed(0) + 'ms',
        };
      }
    }

    return insights;
  }

  /**
   * Get metrics history within a time range
   */
  getMetricsHistory(hours = 24) {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - hours);

    return this.metricsHistory.filter((snapshot) => new Date(snapshot.timestamp) > cutoff);
  }

  /**
   * Export metrics data
   */
  exportMetrics(format = 'json') {
    const data = {
      aggregated: this.aggregatedMetrics,
      providers: {},
      exportTime: new Date().toISOString(),
    };

    // Include current provider metrics
    for (const [providerId, providerInfo] of this.providers) {
      data.providers[providerId] = providerInfo.lastSnapshot;
    }

    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'csv':
        return this.convertToCSV(data);
      default:
        return data;
    }
  }

  /**
   * Convert metrics to CSV format
   */
  convertToCSV(data) {
    const headers = [
      'Provider',
      'Requests',
      'Successes',
      'Failures',
      'Success Rate',
      'Average Latency',
      'Retry Attempts',
    ];
    const rows = [headers.join(',')];

    // Add aggregated row
    rows.push(
      [
        'TOTAL',
        data.aggregated.totalRequests,
        data.aggregated.totalSuccesses,
        data.aggregated.totalFailures,
        data.aggregated.successRate,
        data.aggregated.averageLatency.toFixed(2),
        'N/A',
      ].join(',')
    );

    // Add provider rows
    for (const [providerId, metrics] of Object.entries(data.providers)) {
      if (metrics.error) continue;

      rows.push(
        [
          providerId,
          metrics.requests,
          metrics.successes,
          metrics.failures,
          metrics.successRate,
          metrics.averageLatency.toFixed(2),
          metrics.retryAttempts,
        ].join(',')
      );
    }

    return rows.join('\n');
  }

  /**
   * Reset all metrics
   */
  resetMetrics() {
    // Reset provider metrics
    for (const [, providerInfo] of this.providers) {
      if (providerInfo.provider.resetTelemetry) {
        providerInfo.provider.resetTelemetry();
      }
      providerInfo.metrics = [];
      providerInfo.lastSnapshot = null;
    }

    // Reset aggregated metrics
    this.aggregatedMetrics = {
      totalRequests: 0,
      totalSuccesses: 0,
      totalFailures: 0,
      averageLatency: 0,
      startTime: new Date().toISOString(),
    };

    // Clear history
    this.metricsHistory = [];
  }

  /**
   * Record a request with telemetry data
   */
  recordRequest(providerId, data) {
    const { latency, success, requestId, timestamp } = data;
    
    // Store in memory for immediate access
    const providerInfo = this.providers.get(providerId);
    if (providerInfo) {
      providerInfo.metrics.push({
        timestamp: new Date(timestamp).toISOString(),
        latency,
        success,
        requestId
      });

      // Keep only last 1000 requests per provider
      if (providerInfo.metrics.length > 1000) {
        providerInfo.metrics.shift();
      }
    }

    // If we have database connection, persist to MongoDB
    this.persistTelemetryRecord(providerId, {
      provider: providerId,
      model: null, // TODO: get from request context
      latencyMs: latency,
      success,
      errorCode: success ? null : 'unknown',
      ts: new Date(timestamp),
      requestId
    });
  }

  /**
   * Record circuit breaker events
   */
  recordCircuitBreakerEvent(providerId, state, metadata = {}) {
    console.log(`📊 Circuit breaker ${state} for ${providerId}`, metadata);
    
    // Store event data
    const event = {
      providerId,
      state,
      timestamp: new Date().toISOString(),
      ...metadata
    };

    // Add to provider info if exists
    const providerInfo = this.providers.get(providerId);
    if (providerInfo) {
      if (!providerInfo.circuitBreakerEvents) {
        providerInfo.circuitBreakerEvents = [];
      }
      providerInfo.circuitBreakerEvents.push(event);

      // Keep only last 100 events
      if (providerInfo.circuitBreakerEvents.length > 100) {
        providerInfo.circuitBreakerEvents.shift();
      }
    }
  }

  /**
   * Get provider metrics with calculated statistics
   */
  async getProviderMetrics(providerId) {
    const providerInfo = this.providers.get(providerId);
    if (!providerInfo || !providerInfo.metrics.length) {
      return {
        avgLatency: 0,
        p50Latency: 0,
        p95Latency: 0,
        successRate: 0,
        requestCount: 0
      };
    }

    const metrics = providerInfo.metrics.slice(-100); // Last 100 requests
    const latencies = metrics.map(m => m.latency).sort((a, b) => a - b);
    const successes = metrics.filter(m => m.success).length;

    return {
      avgLatency: latencies.reduce((sum, l) => sum + l, 0) / latencies.length,
      p50Latency: latencies[Math.floor(latencies.length * 0.5)] || 0,
      p95Latency: latencies[Math.floor(latencies.length * 0.95)] || 0,
      successRate: (successes / metrics.length) * 100,
      requestCount: metrics.length
    };
  }

  /**
   * Persist telemetry record to database
   */
  async persistTelemetryRecord(providerId, record) {
    try {
      // This will be implemented when we have database connection
      // For now, just log for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log(`📊 Telemetry: ${providerId} - ${record.latencyMs}ms (${record.success ? 'success' : 'failure'})`);
      }
    } catch (error) {
      console.error('Failed to persist telemetry:', error);
    }
  }
}

// Singleton instance
const llmTelemetry = new LLMTelemetry();

module.exports = llmTelemetry;

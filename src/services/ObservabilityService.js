/**
 * Observability Service
 * 
 * Comprehensive monitoring, logging, tracing, and metrics collection
 * with distributed system support and performance analytics
 */

const { EventEmitter } = require('events');

class ObservabilityService extends EventEmitter {
  constructor(options = {}) {
    super();
    this.metrics = new Map(); // Custom metrics storage
    this.traces = new Map(); // Active traces
    this.logs = []; // Log buffer
    this.alerts = new Map(); // Active alerts
    this.config = {
      metricsRetention: options.metricsRetention || 86400000, // 24 hours
      traceRetention: options.traceRetention || 3600000, // 1 hour
      logRetention: options.logRetention || 604800000, // 7 days
      alertThresholds: options.alertThresholds || {},
      enableDistributedTracing: options.enableDistributedTracing !== false,
      enableMetrics: options.enableMetrics !== false,
      enableLogging: options.enableLogging !== false,
      enableAlerting: options.enableAlerting !== false,
      samplingRate: options.samplingRate || 1.0, // 100% sampling by default
      exportInterval: options.exportInterval || 60000, // 1 minute
      maxLogBuffer: options.maxLogBuffer || 10000
    };
    this.initialized = false;
    this.exportTimer = null;
    this.cleanupTimer = null;
  }

  /**
   * Initialize observability service
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Initialize OpenTelemetry if enabled
      if (this.config.enableDistributedTracing) {
        this.initializeTracing();
      }

      // Initialize metrics collection
      if (this.config.enableMetrics) {
        this.initializeMetrics();
      }

      // Initialize logging
      if (this.config.enableLogging) {
        this.initializeLogging();
      }

      // Initialize alerting
      if (this.config.enableAlerting) {
        this.initializeAlerting();
      }

      // Start export timer
      this.startExportTimer();
      
      // Start cleanup timer
      this.startCleanupTimer();

      this.initialized = true;
      console.log('📊 Observability service initialized');
      this.emit('initialized');
    } catch (error) {
      console.error('❌ Observability service initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize distributed tracing
   */
  initializeTracing() {
    try {
      // Initialize OpenTelemetry tracing
      const { NodeSDK } = require('@opentelemetry/sdk-node');
      const { Resource } = require('@opentelemetry/semantic-conventions');
      
      this.tracingSdk = new NodeSDK({
        resource: new Resource({
          'service.name': 'echotune-ai',
          'service.version': process.env.npm_package_version || '1.0.0',
          'service.environment': process.env.NODE_ENV || 'development'
        }),
        instrumentations: [], // Would add instrumentations
        spanProcessors: [], // Would add span processors
        metricReader: null // Would add metric readers
      });

      console.log('🔍 Distributed tracing initialized');
    } catch (error) {
      console.warn('⚠️ Tracing initialization failed:', error.message);
    }
  }

  /**
   * Initialize metrics collection
   */
  initializeMetrics() {
    // Initialize default metrics
    this.registerMetric('http_requests_total', 'counter', 'Total HTTP requests');
    this.registerMetric('http_request_duration', 'histogram', 'HTTP request duration');
    this.registerMetric('active_connections', 'gauge', 'Active connections');
    this.registerMetric('memory_usage', 'gauge', 'Memory usage');
    this.registerMetric('cpu_usage', 'gauge', 'CPU usage');
    this.registerMetric('error_rate', 'gauge', 'Error rate');

    console.log('📈 Metrics collection initialized');
  }

  /**
   * Initialize logging
   */
  initializeLogging() {
    this.logger = {
      debug: (message, metadata = {}) => this.log('debug', message, metadata),
      info: (message, metadata = {}) => this.log('info', message, metadata),
      warn: (message, metadata = {}) => this.log('warn', message, metadata),
      error: (message, metadata = {}) => this.log('error', message, metadata),
      fatal: (message, metadata = {}) => this.log('fatal', message, metadata)
    };

    console.log('📝 Logging initialized');
  }

  /**
   * Initialize alerting
   */
  initializeAlerting() {
    // Setup default alert rules
    this.addAlertRule('high_error_rate', {
      metric: 'error_rate',
      condition: 'gt',
      threshold: 0.05, // 5%
      duration: 300000, // 5 minutes
      severity: 'critical'
    });

    this.addAlertRule('high_memory_usage', {
      metric: 'memory_usage',
      condition: 'gt',
      threshold: 0.9, // 90%
      duration: 600000, // 10 minutes
      severity: 'warning'
    });

    console.log('🚨 Alerting initialized');
  }

  /**
   * Register a metric
   */
  registerMetric(name, type, description, labels = []) {
    const metric = {
      name,
      type, // counter, gauge, histogram, summary
      description,
      labels,
      values: new Map(),
      createdAt: new Date()
    };

    this.metrics.set(name, metric);
    return metric;
  }

  /**
   * Record metric value
   */
  recordMetric(name, value, labels = {}) {
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`⚠️ Unknown metric: ${name}`);
      return;
    }

    const labelKey = JSON.stringify(labels);
    const existing = metric.values.get(labelKey);

    switch (metric.type) {
      case 'counter':
        metric.values.set(labelKey, (existing || 0) + value);
        break;
      case 'gauge':
        metric.values.set(labelKey, value);
        break;
      case 'histogram':
        if (!existing) {
          metric.values.set(labelKey, {
            count: 0,
            sum: 0,
            buckets: new Map(),
            values: []
          });
        }
        const hist = metric.values.get(labelKey);
        hist.count++;
        hist.sum += value;
        hist.values.push(value);
        break;
      case 'summary':
        if (!existing) {
          metric.values.set(labelKey, {
            count: 0,
            sum: 0,
            quantiles: new Map()
          });
        }
        const summary = metric.values.get(labelKey);
        summary.count++;
        summary.sum += value;
        break;
    }

    this.emit('metricRecorded', { name, value, labels });
  }

  /**
   * Start a trace span
   */
  startSpan(operationName, parentSpan = null) {
    const spanId = this.generateSpanId();
    const traceId = parentSpan ? parentSpan.traceId : this.generateTraceId();
    
    const span = {
      spanId,
      traceId,
      operationName,
      parentSpanId: parentSpan ? parentSpan.spanId : null,
      startTime: Date.now(),
      endTime: null,
      duration: null,
      tags: new Map(),
      logs: [],
      status: 'active'
    };

    this.traces.set(spanId, span);
    this.emit('spanStarted', span);
    
    return span;
  }

  /**
   * Finish a trace span
   */
  finishSpan(span, tags = {}) {
    if (!span || span.status !== 'active') {
      return;
    }

    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = 'finished';

    // Add tags
    for (const [key, value] of Object.entries(tags)) {
      span.tags.set(key, value);
    }

    this.emit('spanFinished', span);
  }

  /**
   * Add log to span
   */
  addSpanLog(span, level, message, fields = {}) {
    if (!span) {
      return;
    }

    span.logs.push({
      timestamp: Date.now(),
      level,
      message,
      fields
    });
  }

  /**
   * Log message
   */
  log(level, message, metadata = {}) {
    if (!this.config.enableLogging) {
      return;
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata,
      service: 'echotune-ai',
      traceId: metadata.traceId,
      spanId: metadata.spanId
    };

    // Add to buffer
    this.logs.push(logEntry);
    
    // Trim buffer if needed
    if (this.logs.length > this.config.maxLogBuffer) {
      this.logs = this.logs.slice(-this.config.maxLogBuffer);
    }

    // Emit log event
    this.emit('log', logEntry);

    // Console output
    const logMethod = console[level] || console.log;
    logMethod(`[${level.toUpperCase()}] ${message}`, metadata);
  }

  /**
   * Add alert rule
   */
  addAlertRule(name, rule) {
    this.alerts.set(name, {
      ...rule,
      name,
      active: false,
      triggeredAt: null,
      lastCheck: null
    });
  }

  /**
   * Check alert rules
   */
  checkAlertRules() {
    if (!this.config.enableAlerting) {
      return;
    }

    for (const [name, alert] of this.alerts.entries()) {
      const metric = this.metrics.get(alert.metric);
      if (!metric) {
        continue;
      }

      const value = this.getMetricValue(metric);
      const shouldTrigger = this.evaluateAlertCondition(alert, value);

      if (shouldTrigger && !alert.active) {
        this.triggerAlert(name, alert, value);
      } else if (!shouldTrigger && alert.active) {
        this.resolveAlert(name, alert);
      }

      alert.lastCheck = new Date();
    }
  }

  /**
   * Evaluate alert condition
   */
  evaluateAlertCondition(alert, value) {
    switch (alert.condition) {
      case 'gt':
        return value > alert.threshold;
      case 'lt':
        return value < alert.threshold;
      case 'eq':
        return value === alert.threshold;
      case 'gte':
        return value >= alert.threshold;
      case 'lte':
        return value <= alert.threshold;
      default:
        return false;
    }
  }

  /**
   * Trigger alert
   */
  triggerAlert(name, alert, value) {
    alert.active = true;
    alert.triggeredAt = new Date();

    const alertEvent = {
      name,
      severity: alert.severity,
      metric: alert.metric,
      value,
      threshold: alert.threshold,
      triggeredAt: alert.triggeredAt
    };

    console.warn(`🚨 Alert triggered: ${name} (${alert.severity})`);
    this.emit('alertTriggered', alertEvent);
  }

  /**
   * Resolve alert
   */
  resolveAlert(name, alert) {
    alert.active = false;
    const resolvedAt = new Date();

    const alertEvent = {
      name,
      resolvedAt,
      duration: resolvedAt - alert.triggeredAt
    };

    console.log(`✅ Alert resolved: ${name}`);
    this.emit('alertResolved', alertEvent);
  }

  /**
   * Get metric value
   */
  getMetricValue(metric) {
    if (metric.values.size === 0) {
      return 0;
    }

    // For simplicity, return the first value
    // In practice, you might want to aggregate values
    const firstValue = metric.values.values().next().value;
    
    if (typeof firstValue === 'number') {
      return firstValue;
    }

    if (firstValue && typeof firstValue === 'object') {
      return firstValue.sum || firstValue.count || 0;
    }

    return 0;
  }

  /**
   * Get all metrics
   */
  getAllMetrics() {
    const metricsData = {};
    
    for (const [name, metric] of this.metrics.entries()) {
      metricsData[name] = {
        type: metric.type,
        description: metric.description,
        values: Object.fromEntries(metric.values)
      };
    }

    return metricsData;
  }

  /**
   * Get active traces
   */
  getActiveTraces() {
    const activeTraces = [];
    
    for (const span of this.traces.values()) {
      if (span.status === 'active') {
        activeTraces.push(span);
      }
    }

    return activeTraces;
  }

  /**
   * Get recent logs
   */
  getRecentLogs(limit = 100) {
    return this.logs.slice(-limit);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts() {
    const activeAlerts = [];
    
    for (const alert of this.alerts.values()) {
      if (alert.active) {
        activeAlerts.push(alert);
      }
    }

    return activeAlerts;
  }

  /**
   * Generate span ID
   */
  generateSpanId() {
    return Math.random().toString(16).slice(2, 18);
  }

  /**
   * Generate trace ID
   */
  generateTraceId() {
    return Math.random().toString(16).slice(2, 18) + Math.random().toString(16).slice(2, 18);
  }

  /**
   * Start export timer
   */
  startExportTimer() {
    this.exportTimer = setInterval(() => {
      this.exportMetrics();
      this.checkAlertRules();
    }, this.config.exportInterval);
  }

  /**
   * Start cleanup timer
   */
  startCleanupTimer() {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.exportInterval * 10); // Cleanup every 10 export intervals
  }

  /**
   * Export metrics (placeholder for external systems)
   */
  exportMetrics() {
    // This would export to external monitoring systems
    // console.log('📊 Exporting metrics...');
  }

  /**
   * Cleanup old data
   */
  cleanup() {
    const now = Date.now();

    // Cleanup old traces
    for (const [spanId, span] of this.traces.entries()) {
      if (span.endTime && (now - span.endTime) > this.config.traceRetention) {
        this.traces.delete(spanId);
      }
    }

    // Cleanup old logs
    const logCutoff = now - this.config.logRetention;
    this.logs = this.logs.filter(log => 
      new Date(log.timestamp).getTime() > logCutoff
    );

    console.log('🧹 Observability cleanup completed');
  }

  /**
   * Create Express middleware for request tracking
   */
  createRequestTrackingMiddleware() {
    return (req, res, next) => {
      const span = this.startSpan(`HTTP ${req.method} ${req.path}`);
      req.observabilitySpan = span;

      // Record request metric
      this.recordMetric('http_requests_total', 1, {
        method: req.method,
        path: req.path
      });

      // Track request duration
      const startTime = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - startTime;
        
        // Record duration metric
        this.recordMetric('http_request_duration', duration, {
          method: req.method,
          path: req.path,
          status: res.statusCode
        });

        // Finish span
        this.finishSpan(span, {
          'http.method': req.method,
          'http.path': req.path,
          'http.status_code': res.statusCode,
          'http.duration': duration
        });
      });

      next();
    };
  }

  /**
   * Get service statistics
   */
  getStatistics() {
    return {
      metrics: this.metrics.size,
      activeTraces: Array.from(this.traces.values()).filter(s => s.status === 'active').length,
      totalTraces: this.traces.size,
      logs: this.logs.length,
      activeAlerts: Array.from(this.alerts.values()).filter(a => a.active).length,
      totalAlerts: this.alerts.size,
      uptime: process.uptime(),
      initialized: this.initialized
    };
  }

  /**
   * Shutdown observability service
   */
  async shutdown() {
    // Stop timers
    if (this.exportTimer) {
      clearInterval(this.exportTimer);
    }
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    // Shutdown tracing SDK
    if (this.tracingSdk) {
      await this.tracingSdk.shutdown();
    }

    this.initialized = false;
    console.log('📊 Observability service shutdown');
    this.emit('shutdown');
  }
}

// Default observability service instance
let defaultInstance = null;

/**
 * Get or create default observability service instance
 */
function getObservabilityService(options) {
  if (!defaultInstance) {
    defaultInstance = new ObservabilityService(options);
  }
  return defaultInstance;
}

/**
 * Initialize default observability service
 */
async function initializeObservabilityService(options) {
  const service = getObservabilityService(options);
  await service.initialize();
  return service;
}

module.exports = {
  ObservabilityService,
  getObservabilityService,
  initializeObservabilityService
};
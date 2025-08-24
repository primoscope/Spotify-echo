/**
 * Unit tests for AI metrics instrumentation
 */

const aiMetrics = require('../../../src/metrics/aiMetrics');

// Mock prom-client to avoid conflicts in test environment
jest.mock('prom-client', () => {
  const mockMetric = {
    inc: jest.fn(),
    observe: jest.fn(),
    set: jest.fn(),
    reset: jest.fn()
  };

  return {
    register: {
      clear: jest.fn(),
      metrics: jest.fn().mockReturnValue('# Mocked metrics'),
      getMetricsAsJSON: jest.fn().mockResolvedValue([
        {
          name: 'echotune_ai_invocations_total',
          values: [
            { labels: { provider: 'vertex', model: 'text-bison', status: 'success' }, value: 10 },
            { labels: { provider: 'vertex', model: 'text-bison', status: 'error' }, value: 2 }
          ]
        }
      ])
    },
    collectDefaultMetrics: jest.fn(),
    Counter: jest.fn(() => mockMetric),
    Histogram: jest.fn(() => mockMetric),
    Gauge: jest.fn(() => mockMetric)
  };
});

describe('AIMetrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('recordSuccess', () => {
    it('should record successful invocation', () => {
      const labels = {
        provider: 'vertex',
        model: 'text-bison@latest',
        type: 'text-generation'
      };

      aiMetrics.recordSuccess(labels);

      expect(aiMetrics.metrics.invocationsTotal.inc).toHaveBeenCalledWith({
        ...labels,
        status: 'success'
      });
    });

    it('should use default labels for missing values', () => {
      aiMetrics.recordSuccess();

      expect(aiMetrics.metrics.invocationsTotal.inc).toHaveBeenCalledWith({
        provider: 'unknown',
        model: 'unknown',
        type: 'unknown',
        status: 'success'
      });
    });
  });

  describe('recordFailure', () => {
    it('should record failed invocation', () => {
      const labels = {
        provider: 'vertex',
        model: 'text-bison@latest',
        type: 'text-generation',
        error_class: 'RateLimitError',
        error_code: 'RATE_LIMIT_EXCEEDED'
      };

      aiMetrics.recordFailure(labels);

      expect(aiMetrics.metrics.invocationsTotal.inc).toHaveBeenCalledWith({
        provider: 'vertex',
        model: 'text-bison@latest',
        type: 'text-generation',
        status: 'error'
      });

      expect(aiMetrics.metrics.failuresTotal.inc).toHaveBeenCalledWith({
        ...labels,
        status: 'error'  // recordFailure adds status internally
      });
    });
  });

  describe('recordLatency', () => {
    it('should record latency observation', () => {
      const labels = {
        provider: 'vertex',
        model: 'text-bison@latest',
        type: 'text-generation'
      };

      aiMetrics.recordLatency(1250, labels);

      expect(aiMetrics.metrics.latencyHistogram.observe).toHaveBeenCalledWith(labels, 1250);
    });
  });

  describe('recordCost', () => {
    it('should record cost and update gauges', () => {
      const labels = {
        provider: 'vertex',
        model: 'text-bison@latest',
        type: 'text-generation'
      };

      aiMetrics.recordCost(0.005, labels);

      expect(aiMetrics.metrics.costCounter.inc).toHaveBeenCalledWith(labels, 0.005);
      
      // Should update cost gauges for different periods
      ['hour', 'day', 'month'].forEach(period => {
        expect(aiMetrics.metrics.costGauge.inc).toHaveBeenCalledWith({
          ...labels,
          period
        }, 0.005);
      });
    });
  });

  describe('recordRetry', () => {
    it('should record retry attempt', () => {
      const labels = {
        provider: 'vertex',
        model: 'text-bison@latest',
        type: 'text-generation',
        attempt: '2'
      };

      aiMetrics.recordRetry(2, {
        provider: 'vertex',
        model: 'text-bison@latest',
        type: 'text-generation'
      });

      expect(aiMetrics.metrics.retriesTotal.inc).toHaveBeenCalledWith(labels);
    });
  });

  describe('recordTokens', () => {
    it('should record token usage', () => {
      const labels = {
        provider: 'vertex',
        model: 'text-bison@latest',
        type: 'text-generation',
        direction: 'input'
      };

      aiMetrics.recordTokens(500, 'input', {
        provider: 'vertex',
        model: 'text-bison@latest',
        type: 'text-generation'
      });

      expect(aiMetrics.metrics.tokensTotal.inc).toHaveBeenCalledWith(labels, 500);
    });
  });

  describe('updateCircuitBreakerState', () => {
    it('should update circuit breaker metrics', () => {
      const labels = {
        provider: 'vertex',
        endpoint: 'text-generation-primary'
      };

      aiMetrics.updateCircuitBreakerState('OPEN', 5, labels);

      expect(aiMetrics.metrics.circuitBreakerState.set).toHaveBeenCalledWith(labels, 1); // OPEN = 1
      expect(aiMetrics.metrics.circuitBreakerFailures.set).toHaveBeenCalledWith(labels, 5);
    });

    it('should handle different circuit breaker states', () => {
      const labels = { provider: 'vertex', endpoint: 'test' };

      aiMetrics.updateCircuitBreakerState('CLOSED', 0, labels);
      expect(aiMetrics.metrics.circuitBreakerState.set).toHaveBeenCalledWith(labels, 0);

      aiMetrics.updateCircuitBreakerState('HALF_OPEN', 3, labels);
      expect(aiMetrics.metrics.circuitBreakerState.set).toHaveBeenCalledWith(labels, 2);

      aiMetrics.updateCircuitBreakerState('UNKNOWN', 1, labels);
      expect(aiMetrics.metrics.circuitBreakerState.set).toHaveBeenCalledWith(labels, 0); // Default
    });
  });

  describe('updateEndpointHealth', () => {
    it('should update endpoint health status', () => {
      const labels = {
        provider: 'vertex',
        endpoint: 'text-generation-primary',
        model: 'text-bison@latest'
      };

      aiMetrics.updateEndpointHealth(true, labels);
      expect(aiMetrics.metrics.endpointHealth.set).toHaveBeenCalledWith(labels, 1);

      aiMetrics.updateEndpointHealth(false, labels);
      expect(aiMetrics.metrics.endpointHealth.set).toHaveBeenCalledWith(labels, 0);
    });
  });

  describe('recordCacheHit and recordCacheMiss', () => {
    it('should record cache hits and misses', () => {
      const labels = {
        provider: 'vertex',
        model: 'text-bison@latest',
        type: 'text-generation'
      };

      aiMetrics.recordCacheHit(labels);
      expect(aiMetrics.metrics.cacheHits.inc).toHaveBeenCalledWith(labels);

      aiMetrics.recordCacheMiss(labels);
      expect(aiMetrics.metrics.cacheMisses.inc).toHaveBeenCalledWith(labels);
    });
  });

  describe('getMetrics', () => {
    it('should return prometheus metrics', () => {
      const metrics = aiMetrics.getMetrics();
      expect(metrics).toBe('# Mocked metrics');
    });
  });

  describe('generateCostReport', () => {
    it('should generate cost report from metrics', async () => {
      const report = await aiMetrics.generateCostReport('day');

      expect(report).toHaveProperty('timeRange', 'day');
      expect(report).toHaveProperty('totalCost');
      expect(report).toHaveProperty('breakdown');
      expect(report).toHaveProperty('message'); // Since mock returns no cost data
    });
  });

  describe('generatePerformanceReport', () => {
    it('should generate performance report', async () => {
      const report = await aiMetrics.generatePerformanceReport();

      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('invocations');
      expect(report).toHaveProperty('latency');
      expect(report).toHaveProperty('cost');
      expect(report).toHaveProperty('failures');
      expect(report).toHaveProperty('tokens');
    });
  });

  describe('utility methods', () => {
    describe('sumMetricValues', () => {
      it('should sum metric values with optional filtering', () => {
        const metric = {
          values: [
            { labels: { status: 'success' }, value: 10 },
            { labels: { status: 'error' }, value: 2 },
            { labels: { status: 'success' }, value: 5 }
          ]
        };

        const total = aiMetrics.sumMetricValues(metric);
        expect(total).toBe(17);

        const successOnly = aiMetrics.sumMetricValues(metric, { status: 'success' });
        expect(successOnly).toBe(15);
      });

      it('should return 0 for empty or undefined metrics', () => {
        expect(aiMetrics.sumMetricValues({})).toBe(0);
        expect(aiMetrics.sumMetricValues({ values: [] })).toBe(0);
      });
    });

    describe('groupMetricValues', () => {
      it('should group metric values by specified field', () => {
        const metric = {
          values: [
            { labels: { provider: 'vertex' }, value: 10 },
            { labels: { provider: 'openai' }, value: 5 },
            { labels: { provider: 'vertex' }, value: 3 }
          ]
        };

        const grouped = aiMetrics.groupMetricValues(metric, 'provider');
        
        expect(grouped).toEqual({
          vertex: 13,
          openai: 5
        });
      });

      it('should handle missing labels', () => {
        const metric = {
          values: [
            { labels: {}, value: 10 },
            { labels: { provider: 'vertex' }, value: 5 }
          ]
        };

        const grouped = aiMetrics.groupMetricValues(metric, 'provider');
        
        expect(grouped).toEqual({
          unknown: 10,
          vertex: 5
        });
      });
    });
  });
});
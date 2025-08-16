const LLMProviderManager = require('../../src/chat/llm-provider-manager');

// Mock dependencies
jest.mock('../../src/chat/model-registry', () => ({
  initialize: jest.fn(),
  recommendModel: jest.fn(() => ({
    id: 'test-model',
    providerId: 'mock'
  }))
}));

jest.mock('../../src/chat/llm-telemetry', () => ({
  initialize: jest.fn(),
  registerProvider: jest.fn(),
  getProviderMetrics: jest.fn(() => ({
    current: {
      averageLatency: 150,
      successRate: 95,
      totalRequests: 100
    }
  })),
  getAggregatedMetrics: jest.fn(() => ({
    activeProviders: 2,
    totalRequests: 100,
    successRate: 95
  })),
  getPerformanceInsights: jest.fn(() => ({
    alerts: [],
    recommendations: []
  }))
}));

jest.mock('../../src/chat/utils/key-pool', () => {
  return jest.fn().mockImplementation(() => ({
    getCurrentKey: jest.fn(() => 'test-key'),
    reportFailure: jest.fn(),
  }));
});

describe('Circuit Breaker Integration', () => {
  let manager;
  
  beforeEach(async () => {
    manager = new LLMProviderManager();
    
    // Mock provider configs
    manager.providerConfigs.set('mock', {
      name: 'Mock Provider',
      available: true,
      status: 'connected',
      model: 'mock-model'
    });
    
    manager.providerConfigs.set('test-provider', {
      name: 'Test Provider', 
      available: true,
      status: 'connected',
      model: 'test-model'
    });
    
    // Mock providers
    manager.providers.set('mock', {
      generateCompletion: jest.fn(() => Promise.resolve({
        content: 'Mock response'
      }))
    });
    
    manager.providers.set('test-provider', {
      generateCompletion: jest.fn()
    });
    
    manager.initialized = true;
    manager.initializeCircuitBreakers();
  });

  describe('Circuit Breaker States', () => {
    it('should initialize circuit breakers in CLOSED state', () => {
      const breaker = manager.circuitBreakers.get('test-provider');
      
      expect(breaker).toBeDefined();
      expect(breaker.state).toBe('CLOSED');
      expect(breaker.failureCount).toBe(0);
      expect(breaker.successCount).toBe(0);
    });

    it('should open circuit after failure threshold', () => {
      const breaker = manager.circuitBreakers.get('test-provider');
      
      // Simulate 5 failures (threshold)
      for (let i = 0; i < 5; i++) {
        manager.recordRequestLatency('test-provider', 1000, false);
      }
      
      expect(breaker.state).toBe('OPEN');
      expect(breaker.failureCount).toBe(5);
      expect(breaker.openUntil).toBeTruthy();
    });

    it('should open circuit after consecutive high latency requests', () => {
      const breaker = manager.circuitBreakers.get('test-provider');
      
      // Simulate 5 consecutive high-latency requests (> 2000ms threshold)
      for (let i = 0; i < 5; i++) {
        manager.recordRequestLatency('test-provider', 2500, true);
      }
      
      expect(breaker.state).toBe('OPEN');
      expect(breaker.consecutiveLatencyFailures).toBe(5);
    });

    it('should reset consecutive latency failures on good latency', () => {
      const breaker = manager.circuitBreakers.get('test-provider');
      
      // 3 high latency requests
      for (let i = 0; i < 3; i++) {
        manager.recordRequestLatency('test-provider', 2500, true);
      }
      
      expect(breaker.consecutiveLatencyFailures).toBe(3);
      
      // 1 good latency request should reset
      manager.recordRequestLatency('test-provider', 800, true);
      
      expect(breaker.consecutiveLatencyFailures).toBe(0);
    });
  });

  describe('Provider Availability', () => {
    it('should return false when circuit is OPEN', () => {
      const breaker = manager.circuitBreakers.get('test-provider');
      breaker.state = 'OPEN';
      
      expect(manager.isProviderAvailable('test-provider')).toBe(false);
    });

    it('should return true when circuit is CLOSED', () => {
      expect(manager.isProviderAvailable('test-provider')).toBe(true);
    });

    it('should return true when circuit is HALF_OPEN', () => {
      const breaker = manager.circuitBreakers.get('test-provider');
      breaker.state = 'HALF_OPEN';
      
      expect(manager.isProviderAvailable('test-provider')).toBe(true);
    });
  });

  describe('Request Correlation', () => {
    it('should generate unique correlation IDs', () => {
      const id1 = manager.generateCorrelationId();
      const id2 = manager.generateCorrelationId();
      
      expect(id1).toMatch(/^llm_/);
      expect(id2).toMatch(/^llm_/);
      expect(id1).not.toBe(id2);
    });

    it('should track request metadata', async () => {
      const testProvider = manager.providers.get('test-provider');
      testProvider.generateCompletion.mockResolvedValue({
        content: 'Test response'
      });
      
      const response = await manager.sendMessage('Test message', {
        provider: 'test-provider'
      });
      
      expect(response.metadata.correlationId).toMatch(/^llm_/);
      expect(response.metadata.latency).toBeGreaterThan(0);
      expect(response.metadata.timestamp).toBeTruthy();
    });
  });

  describe('Fallback Behavior', () => {
    it('should fallback to mock when provider circuit is open', async () => {
      // Open the test-provider circuit
      const breaker = manager.circuitBreakers.get('test-provider');
      breaker.state = 'OPEN';
      
      const response = await manager.sendMessage('Test message', {
        provider: 'test-provider'
      });
      
      expect(response.provider).toBe('mock');
      expect(response.fallback).toBe(true);
      expect(response.originalProvider).toBe('test-provider');
    });

    it('should include circuit breaker info in provider status', () => {
      // Open a circuit
      manager.recordRequestLatency('test-provider', 1000, false);
      manager.recordRequestLatency('test-provider', 1000, false);
      
      const status = manager.getProviderStatus();
      const testProviderStatus = status['test-provider'];
      
      expect(testProviderStatus.circuitBreaker).toBeDefined();
      expect(testProviderStatus.circuitBreaker.state).toBe('CLOSED'); // Still closed, needs 5 failures
      expect(testProviderStatus.circuitBreaker.failureCount).toBe(2);
      expect(testProviderStatus.circuitBreaker.thresholds).toEqual({
        latency: 2000,
        failures: 5,
        consecutiveLatency: 5
      });
    });
  });

  describe('Recovery Behavior', () => {
    it('should attempt recovery when openUntil time has passed', () => {
      const breaker = manager.circuitBreakers.get('test-provider');
      breaker.state = 'OPEN';
      breaker.openUntil = Date.now() - 1000; // Past time
      
      expect(manager.shouldAttemptRecovery(breaker)).toBe(true);
    });

    it('should not attempt recovery when openUntil time has not passed', () => {
      const breaker = manager.circuitBreakers.get('test-provider');
      breaker.state = 'OPEN';
      breaker.openUntil = Date.now() + 60000; // Future time
      
      expect(manager.shouldAttemptRecovery(breaker)).toBe(false);
    });
  });
});
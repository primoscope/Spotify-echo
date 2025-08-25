/**
 * EchoTune AI - Integration Tests for Phase 1 Implementation
 * Tests the integrated performance monitoring, security, and recommendation systems
 */

const request = require('supertest');
const { describe, test, expect, beforeAll, afterAll } = require('@jest/globals');

// Import Phase 1 components
const { register, metrics, middleware, helpers } = require('../../instrumentation/metrics');
const SecurityHardening = require('../../security/security-hardening');
const { AdaptiveRateLimiter, CircuitBreaker } = require('../../security/rate-limiter');
const { RecommendationEngine } = require('../../reco-core/engine');
const { createConfigManager, VALIDATION_LEVELS } = require('../../config');

describe('EchoTune AI Phase 1 Integration Tests', () => {
  let app;
  let server;
  let configManager;
  let securityHardening;
  let rateLimiter;
  let recommendationEngine;

  beforeAll(async () => {
    // Initialize configuration manager
    configManager = createConfigManager(VALIDATION_LEVELS.MINIMAL);
    configManager.initialize();

    // Create Express app with Phase 1 integrations
    const express = require('express');
    app = express();

    // Initialize security hardening
    securityHardening = new SecurityHardening({
      enableCSP: true,
      enableRateLimit: false, // We'll use our custom rate limiter
      trustProxy: false
    });

    // Initialize adaptive rate limiter
    rateLimiter = new AdaptiveRateLimiter();

    // Initialize recommendation engine
    recommendationEngine = new RecommendationEngine();

    // Apply middleware
    app.use(express.json());
    
    // Apply security middleware
    const securityMiddlewares = securityHardening.initializeSecurityMiddleware();
    securityMiddlewares.forEach(middleware => app.use(middleware));

    // Apply performance monitoring middleware
    app.use(middleware.createMetricsMiddleware());

    // Apply rate limiting middleware
    app.use('/api', rateLimiter.createMiddleware(
      (req) => req.ip || 'test-ip',
      { type: 'api', enableQueue: true }
    ));

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          metrics: helpers.getMetricsHealth(),
          security: securityHardening.getSecurityHealth(),
          rateLimiter: rateLimiter.getMetrics(),
          recommendations: recommendationEngine.getHealth()
        }
      });
    });

    // Metrics endpoint
    app.get('/metrics', async (req, res) => {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    });

    // API endpoints for testing
    app.get('/api/status', (req, res) => {
      res.json({ status: 'ok', version: '1.0.0' });
    });

    app.get('/api/recommendations/:userId', async (req, res) => {
      try {
        const userId = req.params.userId;
        const recommendations = await recommendationEngine.generateRecommendations(userId);
        res.json(recommendations);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post('/api/feedback', async (req, res) => {
      try {
        const event = await recommendationEngine.processFeedback(req.body);
        res.json({ status: 'processed', event_id: event.event_id });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Error handling
    app.use((error, req, res, next) => {
      console.error('Test app error:', error);
      res.status(500).json({ error: 'Internal server error' });
    });

    // Start server
    server = app.listen(0); // Let system assign port
    const port = server.address().port;
    console.log(`Test server running on port ${port}`);
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
    if (rateLimiter) {
      rateLimiter.shutdown();
    }
  });

  describe('Performance Monitoring Integration', () => {
    test('should expose metrics endpoint', async () => {
      const response = await request(app)
        .get('/metrics')
        .expect(200);

      expect(response.text).toContain('# HELP');
      expect(response.text).toContain('echotune_http_request_duration_seconds');
      expect(response.headers['content-type']).toMatch(/text\/plain/);
    });

    test('should record HTTP request metrics', async () => {
      // Make a request to generate metrics
      await request(app)
        .get('/api/status')
        .expect(200);

      // Get metrics
      const metricsResponse = await request(app)
        .get('/metrics')
        .expect(200);

      expect(metricsResponse.text).toContain('echotune_http_request_duration_seconds');
      expect(metricsResponse.text).toContain('method="GET"');
      expect(metricsResponse.text).toContain('route="/api/status"');
    });

    test('should add response time headers', async () => {
      const response = await request(app)
        .get('/api/status')
        .expect(200);

      expect(response.headers).toHaveProperty('x-response-time');
      expect(response.headers['x-response-time']).toMatch(/\d+ms/);
    });

    test('should validate performance budgets', () => {
      const validation = helpers.validatePerformanceBudget();
      
      expect(validation).toHaveProperty('violations');
      expect(validation).toHaveProperty('metrics');
      expect(validation).toHaveProperty('budgets');
      expect(Array.isArray(validation.violations)).toBe(true);
    });
  });

  describe('Security Hardening Integration', () => {
    test('should apply security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Check for security headers
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('content-security-policy');
    });

    test('should detect and block threats', async () => {
      // Test SQL injection attempt
      const response = await request(app)
        .get('/api/status?id=1\' OR 1=1--')
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('security policy');
    });

    test('should provide security health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.services.security).toHaveProperty('status');
      expect(response.body.services.security.checks).toHaveProperty('csp');
      expect(response.body.services.security.checks).toHaveProperty('threatDetection');
    });

    test('should track security events', () => {
      const metrics = securityHardening.getSecurityMetrics();
      
      expect(metrics).toHaveProperty('totalEvents');
      expect(metrics).toHaveProperty('eventsByType');
      expect(metrics).toHaveProperty('eventsBySeverity');
      expect(typeof metrics.totalEvents).toBe('number');
    });
  });

  describe('Rate Limiting Integration', () => {
    test('should allow requests within limits', async () => {
      const response = await request(app)
        .get('/api/status')
        .expect(200);

      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
      expect(response.headers).toHaveProperty('x-ratelimit-reset');
    });

    test('should track rate limiter metrics', () => {
      const metrics = rateLimiter.getMetrics();
      
      expect(metrics).toHaveProperty('global');
      expect(metrics).toHaveProperty('buckets');
      expect(metrics).toHaveProperty('totalBuckets');
      expect(typeof metrics.global.requests).toBe('number');
    });

    test('should handle different endpoint types', async () => {
      // Test API endpoint
      const apiResponse = await request(app)
        .get('/api/status')
        .expect(200);

      expect(parseInt(apiResponse.headers['x-ratelimit-limit'])).toBeGreaterThan(0);
    });
  });

  describe('Recommendation Engine Integration', () => {
    test('should generate recommendations', async () => {
      const response = await request(app)
        .get('/api/recommendations/test-user-123')
        .expect(200);

      expect(response.body).toHaveProperty('tracks');
      expect(response.body).toHaveProperty('algorithm');
      expect(response.body).toHaveProperty('confidence');
      expect(Array.isArray(response.body.tracks)).toBe(true);
    });

    test('should process feedback events', async () => {
      const feedbackEvent = {
        user_id: 'test-user-123',
        session_id: 'test-session-456',
        event_type: 'recommendation_clicked',
        track_id: 'test-track-789',
        context: {
          algorithm_used: 'collaborative',
          recommendation_position: 1,
          recommendation_score: 0.85
        }
      };

      const response = await request(app)
        .post('/api/feedback')
        .send(feedbackEvent)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'processed');
      expect(response.body).toHaveProperty('event_id');
    });

    test('should validate feedback event schema', async () => {
      const invalidEvent = {
        user_id: 'test-user-123',
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/feedback')
        .send(invalidEvent)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should provide engine health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      const recoHealth = response.body.services.recommendations;
      expect(recoHealth).toHaveProperty('status', 'healthy');
      expect(recoHealth.components).toHaveProperty('feature_manager');
      expect(recoHealth.components).toHaveProperty('feedback_processor');
      expect(recoHealth.components).toHaveProperty('experiment_framework');
      expect(recoHealth.components).toHaveProperty('algorithms');
    });
  });

  describe('Configuration Management Integration', () => {
    test('should provide valid configuration', () => {
      expect(configManager.config).toBeDefined();
      expect(configManager.get('NODE_ENV')).toBeDefined();
      expect(configManager.get('PORT')).toBeDefined();
    });

    test('should validate environment variables', () => {
      const jwt = configManager.get('JWT_SECRET');
      expect(jwt).toBeDefined();
      expect(jwt.length).toBeGreaterThanOrEqual(32);
    });

    test('should export safe configuration', () => {
      const safeConfig = configManager.exportSafeConfig();
      
      expect(safeConfig).toHaveProperty('NODE_ENV');
      expect(safeConfig).toHaveProperty('PORT');
      expect(safeConfig.JWT_SECRET).toBe('***REDACTED***');
    });
  });

  describe('Circuit Breaker Integration', () => {
    test('should create circuit breaker', () => {
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: 3,
        timeout: 5000,
        resetTimeout: 10000
      });

      expect(circuitBreaker.state).toBe('CLOSED');
      expect(circuitBreaker.failureCount).toBe(0);
    });

    test('should execute function successfully', async () => {
      const circuitBreaker = new CircuitBreaker();
      
      const result = await circuitBreaker.execute(async () => {
        return 'success';
      });

      expect(result).toBe('success');
      expect(circuitBreaker.state).toBe('CLOSED');
    });

    test('should open circuit on failures', async () => {
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: 2,
        timeout: 1000
      });

      // Cause failures
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(async () => {
            throw new Error('Test failure');
          });
        } catch (error) {
          // Expected to fail
        }
      }

      expect(circuitBreaker.state).toBe('OPEN');
      expect(circuitBreaker.failureCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('End-to-End Integration', () => {
    test('should handle complete recommendation flow', async () => {
      const userId = 'integration-test-user';

      // 1. Get initial recommendations
      const recoResponse = await request(app)
        .get(`/api/recommendations/${userId}`)
        .expect(200);

      expect(recoResponse.body.tracks).toBeDefined();
      const algorithm = recoResponse.body.algorithm;

      // 2. Simulate user clicking a recommendation
      const feedbackEvent = {
        user_id: userId,
        session_id: 'integration-test-session',
        event_type: 'recommendation_clicked',
        track_id: 'integration-test-track',
        context: {
          algorithm_used: algorithm,
          recommendation_position: 1,
          recommendation_score: 0.9
        }
      };

      const feedbackResponse = await request(app)
        .post('/api/feedback')
        .send(feedbackEvent)
        .expect(200);

      expect(feedbackResponse.body.status).toBe('processed');

      // 3. Check system health after processing
      const healthResponse = await request(app)
        .get('/health')
        .expect(200);

      expect(healthResponse.body.status).toBe('healthy');
    });

    test('should maintain performance under load', async () => {
      const startTime = Date.now();
      const promises = [];

      // Simulate concurrent requests
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .get('/api/status')
            .expect(200)
        );
      }

      await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should complete all requests within reasonable time
      expect(totalTime).toBeLessThan(5000); // 5 seconds max

      // Check that metrics were recorded
      const metricsResponse = await request(app)
        .get('/metrics')
        .expect(200);

      expect(metricsResponse.text).toContain('echotune_http_request_duration_seconds');
    });

    test('should handle error scenarios gracefully', async () => {
      // Test with invalid user ID
      const response = await request(app)
        .get('/api/recommendations/')
        .expect(404);

      // Test with malformed feedback
      const feedbackResponse = await request(app)
        .post('/api/feedback')
        .send({ invalid: 'data' })
        .expect(400);

      expect(feedbackResponse.body).toHaveProperty('error');

      // System should still be healthy
      const healthResponse = await request(app)
        .get('/health')
        .expect(200);

      expect(healthResponse.body.status).toBe('healthy');
    });
  });
});
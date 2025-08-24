/**
 * Tests for Enhanced Metrics Routes (Phase 2 Vertex AI)
 */

const request = require('supertest');
const express = require('express');

// Mock the metrics registry before importing the route
jest.mock('../../../src/infra/observability/metrics', () => ({
  register: {
    contentType: 'text/plain; version=0.0.4; charset=utf-8',
    metrics: jest.fn().mockResolvedValue('# HELP test_metric Test metric help\n# TYPE test_metric counter\ntest_metric 1')
  }
}));

const metricsRoute = require('../../../src/server/metricsRoute');

describe('Enhanced Metrics Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use('/', metricsRoute);
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.METRICS_AUTH_TOKEN;
  });

  describe('GET /healthz', () => {
    it('should return 200 with health status', async () => {
      const response = await request(app)
        .get('/healthz')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('uptime_s');
      expect(response.body).toHaveProperty('commit');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('service', 'echotune-ai');
      expect(response.body).toHaveProperty('version');
      expect(typeof response.body.uptime_s).toBe('number');
    });

    it('should include git commit hash', async () => {
      const response = await request(app)
        .get('/healthz')
        .expect(200);

      expect(response.body.commit).toBeDefined();
      expect(typeof response.body.commit).toBe('string');
    });
  });

  describe('GET /metrics', () => {
    it('should return prometheus metrics without authentication when no token set', async () => {
      const response = await request(app)
        .get('/metrics')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/plain');
      expect(response.text).toContain('# HELP');
      expect(response.text).toContain('# TYPE');
    });

    it('should require authentication when METRICS_AUTH_TOKEN is set', async () => {
      process.env.METRICS_AUTH_TOKEN = 'test-secret-token';
      
      const response = await request(app)
        .get('/metrics')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Authentication required');
      expect(response.body).toHaveProperty('message', 'X-Metrics-Token header required');
    });

    it('should reject invalid authentication token', async () => {
      process.env.METRICS_AUTH_TOKEN = 'test-secret-token';
      
      const response = await request(app)
        .get('/metrics')
        .set('X-Metrics-Token', 'wrong-token')
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Authentication failed');
      expect(response.body).toHaveProperty('message', 'Invalid metrics token');
    });

    it('should return metrics with valid authentication token', async () => {
      process.env.METRICS_AUTH_TOKEN = 'test-secret-token';
      
      const response = await request(app)
        .get('/metrics')
        .set('X-Metrics-Token', 'test-secret-token')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/plain');
      expect(response.text).toContain('# HELP');
      expect(response.text).toContain('# TYPE');
    });
  });
});
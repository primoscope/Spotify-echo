/**
 * Metrics endpoint integration tests
 * Tests the /internal/metrics endpoint
 */

const request = require('supertest');
const app = require('../../src/server');

describe('/internal/metrics', () => {
  test('should return 200 with Prometheus metrics', async () => {
    const response = await request(app)
      .get('/internal/metrics')
      .expect(200);

    expect(response.headers['content-type']).toMatch(/text\/plain/);
    expect(typeof response.text).toBe('string');
    expect(response.text.length).toBeGreaterThan(0);
  });

  test('should include http_server_requests_total metric', async () => {
    const response = await request(app)
      .get('/internal/metrics')
      .expect(200);

    expect(response.text).toContain('http_server_requests_total');
  });

  test('should include process metrics', async () => {
    const response = await request(app)
      .get('/internal/metrics')
      .expect(200);

    // Check for common process metrics
    expect(response.text).toContain('echotune_process_');
    expect(response.text).toContain('nodejs_heap_size_total_bytes');
  });

  test('should include HTTP duration metrics', async () => {
    const response = await request(app)
      .get('/internal/metrics')
      .expect(200);

    expect(response.text).toContain('http_server_request_duration_ms');
  });

  test('should include external API latency metrics', async () => {
    const response = await request(app)
      .get('/internal/metrics')
      .expect(200);

    expect(response.text).toContain('external_api_latency_ms');
  });

  test('should include cache metrics', async () => {
    const response = await request(app)
      .get('/internal/metrics')
      .expect(200);

    expect(response.text).toContain('cache_hits_total');
    expect(response.text).toContain('cache_misses_total');
    expect(response.text).toContain('cache_hit_ratio');
  });

  test('should include circuit breaker metrics', async () => {
    const response = await request(app)
      .get('/internal/metrics')
      .expect(200);

    expect(response.text).toContain('external_circuit_state');
    expect(response.text).toContain('external_call_retries_total');
  });

  test('should include domain metrics for playlist generation', async () => {
    const response = await request(app)
      .get('/internal/metrics')
      .expect(200);

    expect(response.text).toContain('playlist_generation_requests_total');
    expect(response.text).toContain('playlist_generation_duration_ms');
    expect(response.text).toContain('playlist_generation_errors_total');
  });

  test('should include auth metrics', async () => {
    const response = await request(app)
      .get('/internal/metrics')
      .expect(200);

    expect(response.text).toContain('auth_token_validation_total');
  });

  test('should have valid Prometheus format', async () => {
    const response = await request(app)
      .get('/internal/metrics')
      .expect(200);

    const lines = response.text.split('\n');
    
    // Should have HELP and TYPE comments
    const helpLines = lines.filter(line => line.startsWith('# HELP'));
    const typeLines = lines.filter(line => line.startsWith('# TYPE'));
    
    expect(helpLines.length).toBeGreaterThan(0);
    expect(typeLines.length).toBeGreaterThan(0);
    
    // Should have metric data lines (not just comments)
    const metricLines = lines.filter(line => 
      line.length > 0 && 
      !line.startsWith('#')
    );
    expect(metricLines.length).toBeGreaterThan(0);
  });

  test('should not expose sensitive information', async () => {
    const response = await request(app)
      .get('/internal/metrics')
      .expect(200);

    // Should not contain common sensitive patterns
    expect(response.text).not.toMatch(/password|secret|key|token/i);
    expect(response.text).not.toContain('Bearer ');
    expect(response.text).not.toContain('mongodb://');
  });
});
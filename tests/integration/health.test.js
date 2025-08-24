/**
 * Health endpoint integration tests
 * Tests the /internal/health endpoint
 */

const request = require('supertest');
const app = require('../../src/server');

describe('/internal/health', () => {
  test('should return 200 with health status', async () => {
    const response = await request(app)
      .get('/internal/health')
      .expect(200);

    expect(response.body).toMatchObject({
      ok: true,
      service: 'echotune-api'
    });
    
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime_seconds');
    expect(typeof response.body.uptime_seconds).toBe('number');
    expect(response.body.uptime_seconds).toBeGreaterThanOrEqual(0);
  });

  test('should return consistent service name', async () => {
    const response = await request(app)
      .get('/internal/health')
      .expect(200);

    expect(response.body.service).toBe('echotune-api');
  });

  test('should include node version', async () => {
    const response = await request(app)
      .get('/internal/health')
      .expect(200);

    expect(response.body).toHaveProperty('node');
    expect(typeof response.body.node).toBe('string');
    expect(response.body.node).toMatch(/^v\d+\.\d+\.\d+/);
  });
});
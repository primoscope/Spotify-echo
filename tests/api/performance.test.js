// Performance API endpoint tests
const request = require('supertest');
const app = require('../../server');

describe('Performance API', () => {
  test('GET /api/performance/metrics should return metrics', async () => {
    const response = await request(app)
      .get('/api/performance/metrics')
      .expect(200);
      
    expect(response.body).toHaveProperty('totalRequests');
    expect(response.body).toHaveProperty('averageResponseTime');
    expect(response.body).toHaveProperty('endpoints');
  });
  
  test('DELETE /api/performance/metrics should clear metrics', async () => {
    await request(app)
      .delete('/api/performance/metrics')
      .expect(200);
      
    const response = await request(app)
      .get('/api/performance/metrics')
      .expect(200);
      
    expect(response.body.totalRequests).toBe(0);
  });
  
  test('Response time headers should be present', async () => {
    const response = await request(app)
      .get('/api/performance/metrics');
      
    expect(response.headers).toHaveProperty('x-response-time');
    expect(response.headers['x-response-time']).toMatch(/\d+\.\d+ms/);
  });
});
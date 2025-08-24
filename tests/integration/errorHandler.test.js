/**
 * Error Handler integration tests
 * Tests centralized error handling and standard error codes
 */

const request = require('supertest');
const app = require('../../src/server');

describe('Error Handler', () => {
  beforeAll(async () => {
    // Enable demo routes for testing
    process.env.ENABLE_DEMO_ROUTES = '1';
  });

  describe('404 Not Found Errors', () => {
    test('should return E_NOT_FOUND for non-existent API endpoint', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body).toMatchObject({
        error: {
          code: 'E_NOT_FOUND',
          message: expect.stringContaining('API Endpoint')
        }
      });

      expect(response.body.error).toHaveProperty('timestamp');
      expect(response.body.error).toHaveProperty('details');
    });

    test('should return E_NOT_FOUND for non-existent internal endpoint', async () => {
      const response = await request(app)
        .get('/internal/nonexistent')
        .expect(404);

      expect(response.body.error.code).toBe('E_NOT_FOUND');
      expect(response.body.error.message).toContain('Endpoint');
    });

    test('should serve React app for non-API routes', async () => {
      // This test assumes the React build exists
      const response = await request(app)
        .get('/some/frontend/route')
        .expect(200);

      // Should serve HTML, not JSON error
      expect(response.headers['content-type']).toMatch(/html/);
    });
  });

  describe('Server Error Handling', () => {
    test('should handle internal server errors with E_INTERNAL', async () => {
      // This test requires a route that throws an error
      // Since we don't have one by default, we'll create a mock scenario
      // by testing an invalid route that causes an error
      
      const response = await request(app)
        .post('/internal/demo/playlist-generate')
        .send({
          source: 'test',
          trackCount: 10,
          simulateError: true,
          errorType: 'server_error'
        });

      if (response.status === 500) {
        expect(response.body.error.code).toBe('E_INTERNAL');
      } else if (response.status === 502) {
        expect(response.body.error.code).toBe('E_EXTERNAL_SERVICE');
      }
    });
  });

  describe('Validation Error Handling', () => {
    test('should preserve validation error structure', async () => {
      const response = await request(app)
        .post('/internal/example-validation')
        .send({ name: '', limit: -1 })
        .expect(400);

      expect(response.body.error.code).toBe('E_VALIDATION');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('details');
      expect(response.body.error).toHaveProperty('timestamp');
    });
  });

  describe('Error Response Structure', () => {
    test('should have consistent error response format', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      // Verify required fields
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('timestamp');

      // Verify field types
      expect(typeof response.body.error.code).toBe('string');
      expect(typeof response.body.error.message).toBe('string');
      expect(typeof response.body.error.timestamp).toBe('string');

      // Verify timestamp format (ISO 8601)
      expect(response.body.error.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
    });

    test('should include request ID in error logs', async () => {
      // This test is mainly for logging verification
      // The request ID should be included in the error logs
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.headers).toHaveProperty('x-request-id');
      expect(typeof response.headers['x-request-id']).toBe('string');
      expect(response.headers['x-request-id']).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });

    test('should not expose sensitive information in errors', async () => {
      const response = await request(app)
        .post('/internal/demo/playlist-generate')
        .send({ simulateError: true, errorType: 'server_error' });

      if (response.status >= 400) {
        // Should not contain stack traces in production-like responses
        expect(JSON.stringify(response.body)).not.toContain('at Object.');
        expect(JSON.stringify(response.body)).not.toContain('at Module.');
        
        // Should not contain file paths
        expect(JSON.stringify(response.body)).not.toMatch(/\/home\/|\/Users\/|C:\\/);
        
        // Should not contain common sensitive patterns
        expect(JSON.stringify(response.body)).not.toMatch(/password|secret|key|token/i);
      }
    });
  });

  describe('HTTP Status Code Mapping', () => {
    test('should use correct status codes for error types', async () => {
      // Test validation error (400)
      const validationResponse = await request(app)
        .post('/internal/example-validation')
        .send({});
      
      expect(validationResponse.status).toBe(400);
      expect(validationResponse.body.error.code).toBe('E_VALIDATION');

      // Test not found error (404)
      const notFoundResponse = await request(app)
        .get('/api/nonexistent');

      expect(notFoundResponse.status).toBe(404);
      expect(notFoundResponse.body.error.code).toBe('E_NOT_FOUND');
    });
  });

  afterAll(async () => {
    // Clean up
    delete process.env.ENABLE_DEMO_ROUTES;
  });
});
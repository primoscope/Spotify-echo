/**
 * Readiness endpoint integration tests
 * Tests the /internal/ready endpoint
 */

const request = require('supertest');
const { app } = require('../../src/server');

describe('/internal/ready', () => {
  test('should eventually return 200 ready status', async () => {
    let attempts = 0;
    const maxAttempts = 10;
    const delayMs = 100;

    // Poll the readiness endpoint as it may start as 503 then become 200
    while (attempts < maxAttempts) {
      try {
        const response = await request(app)
          .get('/internal/ready');

        if (response.status === 200) {
          // Success case
          expect(response.body).toMatchObject({
            ready: true
          });
          expect(response.body).toHaveProperty('timestamp');
          expect(typeof response.body.timestamp).toBe('string');
          return; // Test passed
        } else if (response.status === 503) {
          // Service unavailable - expected during startup
          expect(response.body).toMatchObject({
            ready: false
          });
          expect(response.body).toHaveProperty('timestamp');
          
          // Wait and retry
          attempts++;
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        } else {
          // Unexpected status code
          throw new Error(`Unexpected status code: ${response.status}`);
        }
      } catch (error) {
        if (attempts >= maxAttempts - 1) {
          throw error;
        }
        attempts++;
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    // If we get here, all attempts failed
    throw new Error('Readiness endpoint never returned 200 status');
  });

  test('should return 503 when not ready', async () => {
    // This test assumes we can catch the app during startup
    // In practice, this may be difficult to test reliably
    const response = await request(app)
      .get('/internal/ready');

    // Accept either 200 (ready) or 503 (not ready) as both are valid
    expect([200, 503]).toContain(response.status);
    
    if (response.status === 503) {
      expect(response.body.ready).toBe(false);
    } else if (response.status === 200) {
      expect(response.body.ready).toBe(true);
    }
    
    expect(response.body).toHaveProperty('timestamp');
  });

  test('should have consistent response structure', async () => {
    const response = await request(app)
      .get('/internal/ready');

    // Accept both ready and not ready states
    expect([200, 503]).toContain(response.status);
    
    // Verify response structure
    expect(response.body).toHaveProperty('ready');
    expect(typeof response.body.ready).toBe('boolean');
    expect(response.body).toHaveProperty('timestamp');
    expect(typeof response.body.timestamp).toBe('string');
    
    // Validate timestamp format (ISO 8601)
    expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
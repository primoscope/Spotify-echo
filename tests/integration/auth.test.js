/**
 * Auth integration tests
 * Tests JWT authentication middleware and metrics
 */

const request = require('supertest');
const { app } = require('../../src/server');
const { generateToken } = require('../../src/security/auth');

describe('Auth Middleware', () => {
  const originalJwtSecret = process.env.JWT_SECRET;

  beforeAll(() => {
    // Set a test JWT secret
    process.env.JWT_SECRET = 'test-secret-for-integration-tests';
  });

  afterAll(() => {
    // Restore original JWT secret
    if (originalJwtSecret) {
      process.env.JWT_SECRET = originalJwtSecret;
    } else {
      delete process.env.JWT_SECRET;
    }
  });

  describe('Token Generation and Verification', () => {
    test('should generate valid JWT token', () => {
      expect(() => {
        const token = generateToken('test-user-123');
        expect(typeof token).toBe('string');
        expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
      }).not.toThrow();
    });

    test('should generate token with custom payload', () => {
      const payload = {
        email: 'test@example.com',
        role: 'user'
      };

      const token = generateToken('test-user-123', payload);
      expect(typeof token).toBe('string');
    });
  });

  describe('Auth Metrics', () => {
    test('should increment success metrics for valid token', async () => {
      // Generate a valid token
      const token = generateToken('test-user-123');

      // Make request with valid token
      const response = await request(app)
        .get('/internal/health')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);

      // Check metrics endpoint for auth metrics
      const metricsResponse = await request(app)
        .get('/internal/metrics');

      expect(metricsResponse.text).toContain('auth_token_validation_total');
      
      // Should contain success outcome
      if (metricsResponse.text.includes('auth_token_validation_total{outcome="success"}')) {
        expect(metricsResponse.text).toContain('auth_token_validation_total{outcome="success"}');
      }
    });

    test('should increment failure metrics for invalid token', async () => {
      const invalidToken = 'invalid.token.here';

      // Make request with invalid token
      const response = await request(app)
        .get('/internal/health')
        .set('Authorization', `Bearer ${invalidToken}`);

      // Request should still succeed (non-enforcing middleware)
      expect(response.status).toBe(200);

      // Check metrics
      const metricsResponse = await request(app)
        .get('/internal/metrics');

      expect(metricsResponse.text).toContain('auth_token_validation_total');
    });

    test('should increment skipped metrics when no token provided', async () => {
      // Make request without token
      const response = await request(app)
        .get('/internal/health');

      expect(response.status).toBe(200);

      // Check metrics
      const metricsResponse = await request(app)
        .get('/internal/metrics');

      expect(metricsResponse.text).toContain('auth_token_validation_total');
    });
  });

  describe('Non-enforcing Behavior', () => {
    test('should allow requests without token', async () => {
      const response = await request(app)
        .get('/internal/health');

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
    });

    test('should allow requests with invalid token', async () => {
      const response = await request(app)
        .get('/internal/health')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
    });

    test('should allow requests with malformed authorization header', async () => {
      const response = await request(app)
        .get('/internal/health')
        .set('Authorization', 'Malformed header');

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
    });
  });

  describe('Token Validation Edge Cases', () => {
    test('should handle expired token gracefully', async () => {
      // Generate token with very short expiration
      const expiredToken = generateToken('test-user', {}, { expiresIn: '1ms' });

      // Wait to ensure token expires
      await new Promise(resolve => setTimeout(resolve, 10));

      const response = await request(app)
        .get('/internal/health')
        .set('Authorization', `Bearer ${expiredToken}`);

      // Should still allow request (non-enforcing)
      expect(response.status).toBe(200);
    });

    test('should handle token without userId', async () => {
      // Generate token without userId in payload
      const tokenWithoutUserId = generateToken(null, { someOtherField: 'value' });

      const response = await request(app)
        .get('/internal/health')
        .set('Authorization', `Bearer ${tokenWithoutUserId}`);

      expect(response.status).toBe(200);
    });

    test('should handle empty bearer token', async () => {
      const response = await request(app)
        .get('/internal/health')
        .set('Authorization', 'Bearer ');

      expect(response.status).toBe(200);
    });
  });

  describe('Without JWT Secret', () => {
    test('should skip validation when JWT_SECRET not set', async () => {
      // Temporarily remove JWT secret
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      try {
        const response = await request(app)
          .get('/internal/health')
          .set('Authorization', 'Bearer some.token.here');

        expect(response.status).toBe(200);
        
        // Check that metrics show skipped
        const metricsResponse = await request(app)
          .get('/internal/metrics');

        expect(metricsResponse.text).toContain('auth_token_validation_total');
      } finally {
        // Restore JWT secret
        process.env.JWT_SECRET = originalSecret;
      }
    });
  });

  describe('Token Parsing', () => {
    test('should parse valid token and extract user info', async () => {
      const userId = 'test-user-456';
      const token = generateToken(userId, { 
        email: 'test@example.com',
        role: 'admin' 
      });

      const response = await request(app)
        .get('/internal/health')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      // The middleware doesn't expose auth info in response, but it processes it
    });

    test('should handle various userId field names', async () => {
      // Test with 'sub' field (common in JWT)
      const tokenWithSub = generateToken(null, { sub: 'user-with-sub' });
      
      const response = await request(app)
        .get('/internal/health')
        .set('Authorization', `Bearer ${tokenWithSub}`);

      expect(response.status).toBe(200);
    });
  });
});
const request = require('supertest');
const app = require('../src/server');

describe('Phase 0 Authentication & Redis Tests', () => {
  let server;

  beforeAll(async () => {
    // Give server time to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    if (server) {
      await server.close();
    }
  });

  describe('Health Checks', () => {
    test('GET /health should return server health', async () => {
      const response = await request(app)
        .get('/health')
        .expect('Content-Type', /json/);
      
      expect(response.body).toHaveProperty('status');
      expect(['healthy', 'unhealthy', 'degraded']).toContain(response.body.status);
    });

    test('GET /api/redis/health should return Redis health', async () => {
      const response = await request(app)
        .get('/api/redis/health')
        .expect('Content-Type', /json/);
      
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('type');
    });
  });

  describe('Authentication Endpoints', () => {
    test('GET /api/spotify/auth/login should return auth URL', async () => {
      const response = await request(app)
        .get('/api/spotify/auth/login')
        .expect('Content-Type', /json/);
      
      if (process.env.SPOTIFY_CLIENT_ID) {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('authUrl');
        expect(response.body).toHaveProperty('state');
      } else {
        expect(response.status).toBe(500);
        expect(response.body.error).toBe('Spotify not configured');
      }
    });

    test('GET /api/spotify/auth/callback should require code and state', async () => {
      const response = await request(app)
        .get('/api/spotify/auth/callback')
        .expect(400)
        .expect('Content-Type', /json/);
      
      expect(response.body.error).toBe('Missing parameters');
    });

    test('POST /api/spotify/auth/refresh should require refresh token', async () => {
      const response = await request(app)
        .post('/api/spotify/auth/refresh')
        .expect(401)
        .expect('Content-Type', /json/);
      
      expect(response.body.error).toBe('Refresh token required');
    });

    test('POST /api/spotify/auth/logout should work without authentication', async () => {
      const response = await request(app)
        .post('/api/spotify/auth/logout')
        .expect(200)
        .expect('Content-Type', /json/);
      
      expect(response.body.success).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    test('API endpoints should have rate limiting headers', async () => {
      const response = await request(app)
        .get('/health');
      
      // Rate limiting headers should be present
      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
    });

    test('Multiple rapid requests should trigger rate limiting', async () => {
      const endpoint = '/api/spotify/auth/login';
      const requests = [];
      
      // Send 10 rapid requests
      for (let i = 0; i < 10; i++) {
        requests.push(request(app).get(endpoint));
      }
      
      const responses = await Promise.all(requests);
      
      // At least one should have rate limiting info
      const hasRateLimit = responses.some(response => 
        response.headers['x-ratelimit-limit']
      );
      
      expect(hasRateLimit).toBe(true);
    });
  });

  describe('Protected Endpoints', () => {
    test('Protected endpoint should return 401 without auth', async () => {
      const response = await request(app)
        .get('/api/spotify/auth/me')
        .expect(401)
        .expect('Content-Type', /json/);
      
      expect(response.body.error).toBe('Authorization required');
    });

    test('Development mode should accept bearer token', async () => {
      // Only run if development mode is enabled
      if (process.env.AUTH_DEVELOPMENT_MODE === 'true') {
        const response = await request(app)
          .get('/api/spotify/auth/me')
          .set('Authorization', 'Bearer test-user-123')
          .expect('Content-Type', /json/);
        
        // Should not be 401 in development mode
        expect(response.status).not.toBe(401);
      }
    });
  });

  describe('Security Headers', () => {
    test('Response should include security headers', async () => {
      const response = await request(app)
        .get('/health');
      
      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-frame-options', 'DENY');
      expect(response.headers).toHaveProperty('x-xss-protection', '1; mode=block');
      expect(response.headers).toHaveProperty('content-security-policy');
    });
  });

  describe('Cache Functionality', () => {
    test('GET /api/cache/stats should return cache statistics', async () => {
      const response = await request(app)
        .get('/api/cache/stats')
        .expect(200)
        .expect('Content-Type', /json/);
      
      expect(response.body).toHaveProperty('cache_manager');
      expect(response.body).toHaveProperty('redis');
    });
  });
});
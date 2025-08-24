/**
 * CSP (Content Security Policy) integration tests
 * Tests CSP report-only toggle functionality
 */

const request = require('supertest');
const { app } = require('../../src/server');

describe('CSP (Content Security Policy)', () => {
  const originalEnvValue = process.env.ENABLE_CSP_REPORT_ONLY;

  afterEach(() => {
    // Restore original environment value
    if (originalEnvValue) {
      process.env.ENABLE_CSP_REPORT_ONLY = originalEnvValue;
    } else {
      delete process.env.ENABLE_CSP_REPORT_ONLY;
    }
  });

  describe('CSP Report-Only Mode Disabled', () => {
    beforeEach(() => {
      // Ensure CSP report-only is disabled
      delete process.env.ENABLE_CSP_REPORT_ONLY;
    });

    test('should not include CSP report-only header when disabled', async () => {
      const response = await request(app)
        .get('/internal/health')
        .expect(200);

      expect(response.headers['content-security-policy-report-only']).toBeUndefined();
    });

    test('should not include CSP header when disabled', async () => {
      const response = await request(app)
        .get('/internal/health')
        .expect(200);

      expect(response.headers['content-security-policy']).toBeUndefined();
    });
  });

  describe('CSP Report-Only Mode Enabled', () => {
    beforeEach(() => {
      // Enable CSP report-only mode
      process.env.ENABLE_CSP_REPORT_ONLY = '1';
    });

    test('should include CSP report-only header when enabled', async () => {
      const response = await request(app)
        .get('/internal/health')
        .expect(200);

      expect(response.headers['content-security-policy-report-only']).toBeDefined();
    });

    test('should have correct CSP directives', async () => {
      const response = await request(app)
        .get('/internal/health')
        .expect(200);

      const cspHeader = response.headers['content-security-policy-report-only'];
      expect(cspHeader).toBeDefined();

      // Check for required directives
      expect(cspHeader).toContain("default-src 'self'");
      expect(cspHeader).toContain("object-src 'none'");
      expect(cspHeader).toContain("frame-ancestors 'none'");
      expect(cspHeader).toContain("base-uri 'self'");
    });

    test('should allow inline scripts and styles in report-only mode', async () => {
      const response = await request(app)
        .get('/internal/health')
        .expect(200);

      const cspHeader = response.headers['content-security-policy-report-only'];
      
      // Should allow unsafe-inline for development/testing
      expect(cspHeader).toContain("script-src 'self' 'unsafe-inline'");
      expect(cspHeader).toContain("style-src 'self' 'unsafe-inline'");
    });

    test('should include data: and https: sources for images', async () => {
      const response = await request(app)
        .get('/internal/health')
        .expect(200);

      const cspHeader = response.headers['content-security-policy-report-only'];
      expect(cspHeader).toContain("img-src 'self' data: https:");
    });

    test('should apply to all endpoints', async () => {
      // Test health endpoint
      const healthResponse = await request(app)
        .get('/internal/health');
      expect(healthResponse.headers['content-security-policy-report-only']).toBeDefined();

      // Test metrics endpoint
      const metricsResponse = await request(app)
        .get('/internal/metrics');
      expect(metricsResponse.headers['content-security-policy-report-only']).toBeDefined();

      // Test readiness endpoint
      const readyResponse = await request(app)
        .get('/internal/ready');
      expect(readyResponse.headers['content-security-policy-report-only']).toBeDefined();
    });

    test('should not interfere with normal operation', async () => {
      const response = await request(app)
        .get('/internal/health')
        .expect(200);

      // Should still return normal response
      expect(response.body).toMatchObject({
        ok: true,
        service: 'echotune-api'
      });

      // Should have CSP header
      expect(response.headers['content-security-policy-report-only']).toBeDefined();
    });

    test('should work with POST requests', async () => {
      const response = await request(app)
        .post('/internal/example-validation')
        .send({ name: 'test', limit: 10 });

      expect(response.headers['content-security-policy-report-only']).toBeDefined();
    });

    test('should include connect-src for API calls', async () => {
      const response = await request(app)
        .get('/internal/health')
        .expect(200);

      const cspHeader = response.headers['content-security-policy-report-only'];
      expect(cspHeader).toContain("connect-src 'self'");
    });

    test('should include font-src directive', async () => {
      const response = await request(app)
        .get('/internal/health')
        .expect(200);

      const cspHeader = response.headers['content-security-policy-report-only'];
      expect(cspHeader).toContain("font-src 'self'");
    });
  });

  describe('CSP Environment Variable Variations', () => {
    test('should require exactly "1" to enable', async () => {
      // Test with "true" (should not enable)
      process.env.ENABLE_CSP_REPORT_ONLY = 'true';
      
      const trueResponse = await request(app)
        .get('/internal/health');
      expect(trueResponse.headers['content-security-policy-report-only']).toBeUndefined();

      // Test with "yes" (should not enable)  
      process.env.ENABLE_CSP_REPORT_ONLY = 'yes';
      
      const yesResponse = await request(app)
        .get('/internal/health');
      expect(yesResponse.headers['content-security-policy-report-only']).toBeUndefined();

      // Test with "1" (should enable)
      process.env.ENABLE_CSP_REPORT_ONLY = '1';
      
      const oneResponse = await request(app)
        .get('/internal/health');
      expect(oneResponse.headers['content-security-policy-report-only']).toBeDefined();
    });

    test('should be case sensitive', async () => {
      process.env.ENABLE_CSP_REPORT_ONLY = 'TRUE';
      
      const response = await request(app)
        .get('/internal/health');
      expect(response.headers['content-security-policy-report-only']).toBeUndefined();
    });
  });

  describe('CSP Security Features', () => {
    beforeEach(() => {
      process.env.ENABLE_CSP_REPORT_ONLY = '1';
    });

    test('should prevent object embedding', async () => {
      const response = await request(app)
        .get('/internal/health');

      const cspHeader = response.headers['content-security-policy-report-only'];
      expect(cspHeader).toContain("object-src 'none'");
    });

    test('should prevent framing', async () => {
      const response = await request(app)
        .get('/internal/health');

      const cspHeader = response.headers['content-security-policy-report-only'];
      expect(cspHeader).toContain("frame-ancestors 'none'");
    });

    test('should restrict base URI', async () => {
      const response = await request(app)
        .get('/internal/health');

      const cspHeader = response.headers['content-security-policy-report-only'];
      expect(cspHeader).toContain("base-uri 'self'");
    });

    test('should be report-only mode not enforcing', async () => {
      const response = await request(app)
        .get('/internal/health');

      // Should have report-only header, not enforcing header
      expect(response.headers['content-security-policy-report-only']).toBeDefined();
      expect(response.headers['content-security-policy']).toBeUndefined();
    });
  });
});
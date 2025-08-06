/**
 * Tests for API middleware
 */

const { requestLogger, errorHandler, corsMiddleware, createRateLimit } = require('../../src/api/middleware/index');

// Test helpers for this file
const testHelpers = {
  createMockRequest: (overrides = {}) => ({
    method: 'GET',
    url: '/test',
    headers: {},
    body: {},
    userId: 'test_user_id',
    ip: '127.0.0.1',
    connection: { remoteAddress: '127.0.0.1' },
    get: jest.fn(() => 'Test User Agent'),
    ...overrides
  }),

  createMockResponse: () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
      on: jest.fn(),
      statusCode: 200
    };
    return res;
  }
};

describe('API Middleware', () => {
  
  describe('requestLogger', () => {
    test('should log request details', (done) => {
      const req = testHelpers.createMockRequest({
        method: 'GET',
        url: '/api/test'
      });
      const res = testHelpers.createMockResponse();
      const next = jest.fn();

      // Mock res.on to simulate request completion
      res.on = jest.fn((event, callback) => {
        if (event === 'finish') {
          // Simulate request completion
          setTimeout(() => {
            callback();
            expect(console.log).toHaveBeenCalled();
            done();
          }, 10);
        }
      });

      requestLogger(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('errorHandler', () => {
    test('should handle validation errors', () => {
      const err = new Error('Validation failed');
      err.name = 'ValidationError';
      err.errors = { field: 'required' };

      const req = testHelpers.createMockRequest();
      const res = testHelpers.createMockResponse();
      const next = jest.fn();

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation Error',
        message: 'Validation failed',
        details: { field: 'required' }
      });
    });

    test('should handle database errors', () => {
      const err = new Error('Database connection failed');
      err.name = 'MongoError';

      const req = testHelpers.createMockRequest();
      const res = testHelpers.createMockResponse();
      const next = jest.fn();

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Database Error',
        message: 'A database error occurred'
      });
    });

    test('should handle generic errors', () => {
      const err = new Error('Something went wrong');

      const req = testHelpers.createMockRequest();
      const res = testHelpers.createMockResponse();
      const next = jest.fn();

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'Something went wrong'
      });
    });
  });

  describe('corsMiddleware', () => {
    test('should set CORS headers for allowed origins', () => {
      const req = testHelpers.createMockRequest({
        headers: { origin: 'http://localhost:3000' }
      });
      const res = testHelpers.createMockResponse();
      const next = jest.fn();

      corsMiddleware(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'http://localhost:3000');
      expect(next).toHaveBeenCalled();
    });

    test('should handle preflight requests', () => {
      const req = testHelpers.createMockRequest({
        method: 'OPTIONS',
        headers: { origin: 'http://localhost:3000' }
      });
      const res = testHelpers.createMockResponse();
      const next = jest.fn();

      corsMiddleware(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      expect(res.end).toHaveBeenCalled();
    });
  });

  describe('createRateLimit', () => {
    test('should create rate limiter with correct configuration', () => {
      const limiter = createRateLimit();
      expect(limiter).toBeDefined();
      expect(typeof limiter).toBe('function');
    });

    test('should handle rate limiting', () => {
      const req = testHelpers.createMockRequest();
      const res = testHelpers.createMockResponse();
      const next = jest.fn();

      const limiter = createRateLimit();
      limiter(req, res, next);

      // Rate limiter should call next() for normal requests
      expect(next).toHaveBeenCalled();
    });
  });
});
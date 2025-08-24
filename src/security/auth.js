'use strict';

/**
 * Auth Scaffold - Non-enforcing JWT middleware
 * Parses and validates JWT tokens if present but does not enforce authentication
 */

const jwt = require('jsonwebtoken');
const logger = require('../infra/observability/logger');
const { getCorrelationId } = require('../infra/observability/requestContext');

// Metrics for auth token validation
let authTokenValidationTotal;
try {
  const { register } = require('../infra/observability/metrics');
  const client = require('prom-client');
  
  authTokenValidationTotal = new client.Counter({
    name: 'auth_token_validation_total',
    help: 'Auth token validation attempts',
    labelNames: ['outcome']
  });
  
  register.registerMetric(authTokenValidationTotal);
} catch (error) {
  logger.warn('Failed to register auth metrics:', error.message);
}

/**
 * Auth middleware - non-enforcing
 * Parses Authorization Bearer token if present and validates it
 * Attaches req.auth with authentication status
 */
function authMiddleware(req, res, next) {
  // Initialize auth object
  req.auth = {
    authenticated: false,
    userId: null,
    raw: null
  };

  // Extract token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No token present - skip validation gracefully
    if (authTokenValidationTotal) {
      authTokenValidationTotal.inc({ outcome: 'skipped' });
    }
    return next();
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    // No JWT secret configured - skip validation gracefully
    logger.warn({
      msg: 'JWT_SECRET not configured, skipping token validation',
      requestId: getCorrelationId()
    });
    
    if (authTokenValidationTotal) {
      authTokenValidationTotal.inc({ outcome: 'skipped' });
    }
    return next();
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, jwtSecret, {
      algorithms: ['HS256'] // Only allow HS256 for security
    });

    // Token is valid
    req.auth = {
      authenticated: true,
      userId: decoded.userId || decoded.sub || decoded.id,
      raw: decoded
    };

    if (authTokenValidationTotal) {
      authTokenValidationTotal.inc({ outcome: 'success' });
    }

    logger.debug({
      msg: 'Token validation successful',
      requestId: getCorrelationId(),
      userId: req.auth.userId
    });

  } catch (error) {
    // Token validation failed - continue with unauthenticated state
    req.auth = {
      authenticated: false,
      userId: null,
      raw: null,
      error: error.message
    };

    if (authTokenValidationTotal) {
      authTokenValidationTotal.inc({ outcome: 'failure' });
    }

    logger.debug({
      msg: 'Token validation failed',
      requestId: getCorrelationId(),
      error: error.message
    });
  }

  next();
}

/**
 * Optional auth enforcement middleware
 * Use this to enforce authentication on specific routes
 * This is separate from the main middleware to keep it non-enforcing by default
 */
function requireAuth(req, res, next) {
  if (!req.auth || !req.auth.authenticated) {
    const { createAuthRequiredError } = require('../errors/createError');
    const error = createAuthRequiredError('Authentication required for this endpoint');
    
    return res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        timestamp: error.timestamp
      }
    });
  }
  
  next();
}

/**
 * Generate a JWT token (utility function for testing)
 * @param {string} userId - User ID
 * @param {Object} payload - Additional payload data
 * @param {Object} options - JWT options
 * @returns {string} JWT token
 */
function generateToken(userId, payload = {}, options = {}) {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET not configured');
  }

  const tokenPayload = {
    userId,
    ...payload,
    iat: Math.floor(Date.now() / 1000)
  };

  const defaultOptions = {
    algorithm: 'HS256',
    expiresIn: '7d' // Default 7 days
  };

  return jwt.sign(tokenPayload, jwtSecret, { ...defaultOptions, ...options });
}

/**
 * Verify a JWT token (utility function)
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
function verifyToken(token) {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET not configured');
  }

  return jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
}

module.exports = {
  authMiddleware,
  requireAuth,
  generateToken,
  verifyToken
};
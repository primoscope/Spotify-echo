/**
 * Authentication and User Management Middleware
 */

const mongoManager = require('../../database/mongodb');

/**
 * Extract user from Spotify token or session
 */
async function extractUser(req, res, next) {
  try {
    let userId = null;
    let userProfile = null;

    // Check for Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // For now, treat token as user ID (in production, validate JWT)
      userId = token;
    }

    // Check for user_id in request body
    if (!userId && req.body.user_id) {
      userId = req.body.user_id;
    }

    // Check for session-based user
    if (!userId && req.session?.user_id) {
      userId = req.session.user_id;
    }

    if (userId) {
      // Load user profile from database
      const db = mongoManager.getDb();
      const userProfilesCollection = db.collection('user_profiles');
      userProfile = await userProfilesCollection.findOne({ spotify_id: userId });

      if (!userProfile && userId) {
        // Create minimal user profile if not exists
        userProfile = {
          spotify_id: userId,
          display_name: 'Unknown User',
          created_at: new Date(),
          preferences: {}
        };
        
        await userProfilesCollection.insertOne(userProfile);
      }
    }

    req.user = userProfile;
    req.userId = userId;
    next();
  } catch (error) {
    console.error('Error in extractUser middleware:', error);
    next();
  }
}

/**
 * Require authentication
 */
function requireAuth(req, res, next) {
  if (!req.userId) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please provide a valid user token or ID'
    });
  }
  next();
}

/**
 * Rate limiting middleware
 */
function createRateLimit(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // requests per window
    message = 'Too many requests, please try again later'
  } = options;

  const requests = new Map();

  return (req, res, next) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    
    // Clean old entries
    for (const [k, data] of requests.entries()) {
      if (now - data.firstRequest > windowMs) {
        requests.delete(k);
      }
    }

    const userRequests = requests.get(key);
    if (!userRequests) {
      requests.set(key, { count: 1, firstRequest: now });
      next();
    } else if (userRequests.count < max) {
      userRequests.count++;
      next();
    } else {
      res.status(429).json({
        error: 'Rate limit exceeded',
        message,
        retryAfter: Math.ceil((userRequests.firstRequest + windowMs - now) / 1000)
      });
    }
  };
}

/**
 * Error handling middleware
 */
function errorHandler(err, req, res, _next) {
  // Future enhancement: implement structured error logging
  // eslint-disable-next-line no-unused-vars
  const nextFn = _next;
  console.error('API Error:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      details: err.errors
    });
  }

  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    return res.status(500).json({
      error: 'Database Error',
      message: 'A database error occurred'
    });
  }

  if (err.status) {
    return res.status(err.status).json({
      error: err.message || 'An error occurred',
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message
  });
}

/**
 * Request logging middleware
 */
function requestLogger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Log request details (logData available for future structured logging)
    console.log(`${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
  });
  
  next();
}

/**
 * CORS middleware with dynamic origins
 */
function corsMiddleware(req, res, next) {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://primosphere.studio',
    'https://www.primosphere.studio'
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  next();
}

/**
 * Input validation middleware
 */
function validateInput(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message,
        details: error.details
      });
    }
    next();
  };
}

/**
 * Database connection middleware
 */
async function ensureDatabase(req, res, next) {
  try {
    if (!mongoManager.isConnected) {
      await mongoManager.connect();
    }
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({
      error: 'Database Unavailable',
      message: 'Unable to connect to database'
    });
  }
}

module.exports = {
  extractUser,
  requireAuth,
  createRateLimit,
  errorHandler,
  requestLogger,
  corsMiddleware,
  validateInput,
  ensureDatabase
};
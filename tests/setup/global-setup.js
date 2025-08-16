/**
 * Comprehensive Testing Setup for EchoTune AI
 * 
 * Global test configuration that runs before all tests
 * Addresses the 44% validation success rate by ensuring robust test infrastructure
 */

const { MCPServerManager } = require('../../src/mcp/enhanced-mcp-orchestrator');
const { IntelligentErrorHandler } = require('../../src/utils/intelligent-error-handler');

// Global test configuration
global.testConfig = {
  timeout: 30000,
  retries: 2,
  verbose: process.env.TEST_VERBOSE === 'true',
  parallel: process.env.TEST_PARALLEL !== 'false'
};

// Enhanced test utilities
global.testUtils = {
  // Create mock user for testing
  createMockUser: () => ({
    id: 'test-user-' + Math.random().toString(36).substr(2, 9),
    email: 'test@echotune.ai',
    spotifyId: 'spotify-' + Math.random().toString(36).substr(2, 9),
    preferences: {
      genres: ['rock', 'pop', 'electronic'],
      mood: 'upbeat',
      explicitContent: false
    },
    createdAt: new Date(),
    lastActive: new Date()
  }),

  // Create mock track for testing
  createMockTrack: () => ({
    id: 'track-' + Math.random().toString(36).substr(2, 9),
    name: 'Test Track',
    artists: [{ name: 'Test Artist', id: 'artist-123' }],
    album: { name: 'Test Album', id: 'album-123' },
    duration_ms: 210000,
    explicit: false,
    popularity: 75,
    preview_url: 'https://example.com/preview.mp3',
    audio_features: {
      danceability: 0.8,
      energy: 0.7,
      key: 5,
      loudness: -5.2,
      mode: 1,
      speechiness: 0.04,
      acousticness: 0.12,
      instrumentalness: 0.00,
      liveness: 0.1,
      valence: 0.9,
      tempo: 128.0
    }
  }),

  // Create mock playlist
  createMockPlaylist: () => ({
    id: 'playlist-' + Math.random().toString(36).substr(2, 9),
    name: 'Test Playlist',
    description: 'Test playlist for unit testing',
    public: false,
    collaborative: false,
    tracks: {
      total: 10,
      items: []
    },
    owner: {
      id: 'test-user',
      display_name: 'Test User'
    }
  }),

  // Wait utility for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Retry utility for flaky tests
  retry: async (fn, maxAttempts = 3, delay = 1000) => {
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (attempt < maxAttempts) {
          await global.testUtils.wait(delay);
          delay *= 2; // Exponential backoff
        }
      }
    }
    throw lastError;
  },

  // Environment checker
  isCI: () => process.env.CI === 'true',
  
  // Clean test data utility
  cleanupTestData: async () => {
    // Cleanup logic for test data
    if (global.testMCPManager) {
      global.testMCPManager.stopMonitoring();
    }
  }
};

// Mock implementations for external services
global.mocks = {
  spotify: {
    // Mock Spotify API responses
    getMe: jest.fn().mockResolvedValue({
      id: 'test-user',
      display_name: 'Test User',
      email: 'test@example.com',
      country: 'US'
    }),

    getPlaylists: jest.fn().mockResolvedValue({
      items: [global.testUtils.createMockPlaylist()],
      total: 1,
      limit: 20,
      offset: 0
    }),

    getTrack: jest.fn().mockResolvedValue(global.testUtils.createMockTrack()),

    getAudioFeatures: jest.fn().mockResolvedValue({
      danceability: 0.8,
      energy: 0.7,
      key: 5,
      loudness: -5.2,
      mode: 1,
      speechiness: 0.04,
      acousticness: 0.12,
      instrumentalness: 0.00,
      liveness: 0.1,
      valence: 0.9,
      tempo: 128.0
    }),

    search: jest.fn().mockResolvedValue({
      tracks: {
        items: [global.testUtils.createMockTrack()],
        total: 100
      }
    })
  },

  openai: {
    createCompletion: jest.fn().mockResolvedValue({
      choices: [{
        message: {
          content: 'Mock AI response for testing'
        }
      }]
    })
  },

  gemini: {
    generateContent: jest.fn().mockResolvedValue({
      response: {
        text: () => 'Mock Gemini response for testing'
      }
    })
  },

  perplexity: {
    query: jest.fn().mockResolvedValue({
      choices: [{
        message: {
          content: 'Mock Perplexity research response'
        }
      }],
      citations: ['https://example.com/source1']
    })
  }
};

// Database mocks for testing
global.dbMocks = {
  mongodb: {
    connect: jest.fn().mockResolvedValue(true),
    collection: jest.fn().mockReturnValue({
      find: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([])
      }),
      findOne: jest.fn().mockResolvedValue(null),
      insertOne: jest.fn().mockResolvedValue({ insertedId: 'mock-id' }),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 })
    }),
    close: jest.fn().mockResolvedValue(true)
  },

  redis: {
    connect: jest.fn().mockResolvedValue(true),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    ping: jest.fn().mockResolvedValue('PONG'),
    quit: jest.fn().mockResolvedValue('OK')
  }
};

// Initialize test MCP manager for MCP-related tests
global.setupMCPForTests = async () => {
  if (global.testMCPManager) return global.testMCPManager;

  global.testMCPManager = new MCPServerManager();
  
  // Register mock MCP servers for testing
  const testServers = [
    { name: 'test-filesystem', config: { type: 'filesystem', mock: true } },
    { name: 'test-memory', config: { type: 'memory', mock: true } },
    { name: 'test-analytics', config: { type: 'analytics', mock: true } }
  ];

  for (const server of testServers) {
    await global.testMCPManager.registerServer(server.name, server.config);
  }

  return global.testMCPManager;
};

// Initialize error handler for testing
global.setupErrorHandlerForTests = () => {
  if (global.testErrorHandler) return global.testErrorHandler;

  global.testErrorHandler = new IntelligentErrorHandler({
    maxRetries: 2, // Reduced for testing
    baseDelay: 100, // Shorter delays for testing
    persistErrors: false // Don't persist during tests
  });

  return global.testErrorHandler;
};

// Performance testing utilities
global.performanceUtils = {
  measureAsync: async (fn, name = 'operation') => {
    const start = process.hrtime.bigint();
    const result = await fn();
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    
    console.log(`⏱️  ${name} took ${duration.toFixed(2)}ms`);
    return { result, duration };
  },

  measureSync: (fn, name = 'operation') => {
    const start = process.hrtime.bigint();
    const result = fn();
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000;
    
    console.log(`⏱️  ${name} took ${duration.toFixed(2)}ms`);
    return { result, duration };
  },

  // Memory usage tracking
  getMemoryUsage: () => {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024 * 100) / 100, // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100, // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100, // MB
      external: Math.round(usage.external / 1024 / 1024 * 100) / 100 // MB
    };
  }
};

// Security testing utilities
global.securityUtils = {
  // Generate test JWT token
  createTestJWT: (payload = {}, secret = 'test-secret') => {
    const jwt = require('jsonwebtoken');
    return jwt.sign({ 
      userId: 'test-user',
      ...payload 
    }, secret, { 
      expiresIn: '1h' 
    });
  },

  // Test for SQL injection attempts
  containsSQLInjection: (input) => {
    const sqlPatterns = [
      /(\b(union|select|insert|delete|update|drop|create|alter|exec|execute)\b)/gi,
      /(\'|\"|;|--|\*|\/\*|\*\/)/g,
      /(\b(or|and)\s+\d+\s*=\s*\d+)/gi
    ];
    
    return sqlPatterns.some(pattern => pattern.test(input));
  },

  // Test for XSS attempts
  containsXSS: (input) => {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b/gi,
      /<object\b/gi,
      /<embed\b/gi
    ];
    
    return xssPatterns.some(pattern => pattern.test(input));
  }
};

// API testing utilities
global.apiUtils = {
  // Create test request
  createTestRequest: (overrides = {}) => ({
    method: 'GET',
    url: '/api/test',
    headers: {
      'content-type': 'application/json',
      'user-agent': 'EchoTune-Test/1.0'
    },
    body: null,
    user: global.testUtils.createMockUser(),
    ...overrides
  }),

  // Create test response
  createTestResponse: () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      header: jest.fn().mockReturnThis()
    };
    return res;
  },

  // Validate API response format
  validateAPIResponse: (response, expectedFields = []) => {
    expect(response).toBeDefined();
    expect(typeof response).toBe('object');
    
    if (expectedFields.length > 0) {
      expectedFields.forEach(field => {
        expect(response).toHaveProperty(field);
      });
    }
  }
};

// Custom Jest matchers
expect.extend({
  // Check if response has valid API structure
  toBeValidAPIResponse(received) {
    const hasStatus = received.hasOwnProperty('status');
    const hasData = received.hasOwnProperty('data') || received.hasOwnProperty('error');
    
    const pass = hasStatus && hasData;
    
    if (pass) {
      return {
        message: () => `Expected response not to be a valid API response`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected response to be a valid API response with 'status' and 'data'/'error' properties`,
        pass: false,
      };
    }
  },

  // Check if execution time is within acceptable range
  toCompleteWithin(received, expectedMaxDuration) {
    const pass = received <= expectedMaxDuration;
    
    if (pass) {
      return {
        message: () => `Expected operation not to complete within ${expectedMaxDuration}ms, but it completed in ${received}ms`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected operation to complete within ${expectedMaxDuration}ms, but it took ${received}ms`,
        pass: false,
      };
    }
  },

  // Check if MCP server response is valid
  toBeValidMCPResponse(received) {
    const hasResult = received.hasOwnProperty('result') || received.hasOwnProperty('error');
    const hasId = received.hasOwnProperty('id');
    
    const pass = hasResult && hasId;
    
    return {
      message: () => pass 
        ? `Expected response not to be a valid MCP response`
        : `Expected response to be a valid MCP response with 'result'/'error' and 'id' properties`,
      pass,
    };
  }
});

// Environment setup
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error'; // Reduce log noise during testing
  
  // Initialize global utilities if needed
  if (global.testConfig.verbose) {
    console.log('🧪 Initializing comprehensive test environment...');
  }
});

afterAll(async () => {
  // Cleanup global resources
  await global.testUtils.cleanupTestData();
  
  if (global.testConfig.verbose) {
    console.log('🧹 Test environment cleanup completed');
  }
});

// Handle uncaught exceptions and rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection in tests:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception in tests:', error);
});

// Export for use in other test files
module.exports = {
  testConfig: global.testConfig,
  testUtils: global.testUtils,
  mocks: global.mocks,
  performanceUtils: global.performanceUtils,
  securityUtils: global.securityUtils,
  apiUtils: global.apiUtils
};
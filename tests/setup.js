/**
 * Test setup and configuration
 */

// Import OpenAI shims for Node.js environment (conditionally)
try {
  require('openai/shims/node');
} catch (e) {
  // OpenAI shims may not be available in all test environments
}

// Set test environment
process.env.NODE_ENV = 'test';

// Mock environment variables for testing
process.env.SPOTIFY_CLIENT_ID = 'test_client_id';
process.env.SPOTIFY_CLIENT_SECRET = 'test_client_secret';
process.env.OPENAI_API_KEY = 'test_openai_key';
process.env.GOOGLE_API_KEY = 'test_google_key';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test_db';

// Global test utilities
global.testHelpers = {
  // Mock Spotify API responses
  mockSpotifyTrack: {
    id: 'test_track_id',
    name: 'Test Song',
    artists: [{ name: 'Test Artist' }],
    album: { name: 'Test Album' },
    audio_features: {
      danceability: 0.7,
      energy: 0.8,
      valence: 0.6
    }
  },

  // Mock user data
  mockUser: {
    id: 'test_user_id',
    display_name: 'Test User',
    preferences: {
      genres: ['pop', 'rock'],
      audio_features: {
        danceability: 0.6,
        energy: 0.7,
        valence: 0.65
      }
    }
  },

  // Helper to create mock requests
  createMockRequest: (overrides = {}) => ({
    method: 'GET',
    url: '/test',
    headers: {},
    body: {},
    userId: 'test_user_id',
    ...overrides
  }),

  // Helper to create mock responses
  createMockResponse: () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis()
    };
    return res;
  }
};

// Console override for cleaner test output
if (process.env.NODE_ENV === 'test') {
  // Only override console if jest is available
  if (typeof jest !== 'undefined') {
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  }
}
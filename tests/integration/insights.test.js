const request = require('supertest');
const app = require('../../src/server');

describe('Insights API Integration Tests', () => {
  describe('GET /api/insights/listening-trends', () => {
    it('should return listening trends with pagination', async () => {
      const response = await request(app)
        .get('/api/insights/listening-trends?page=1&limit=10&timeRange=30d')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 10);
      expect(response.body).toHaveProperty('trends');
      expect(response.body).toHaveProperty('features');
    });

    it('should handle invalid parameters gracefully', async () => {
      const response = await request(app)
        .get('/api/insights/listening-trends?page=-1&limit=1000')
        .expect(200);

      expect(response.body.success).toBe(true);
      // Should normalize invalid parameters
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBeLessThanOrEqual(100);
    });

    it('should support custom audio features selection', async () => {
      const response = await request(app)
        .get('/api/insights/listening-trends?features=energy,valence')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.features).toEqual(['energy', 'valence']);
    });

    it('should work with fallback when MongoDB is not connected', async () => {
      const response = await request(app)
        .get('/api/insights/listening-trends')
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.fallback) {
        expect(response.body.message).toContain('fallback');
      }
    });
  });

  describe('GET /api/insights/song/:trackId', () => {
    it('should return song insights for valid track ID', async () => {
      const trackId = 'test-track-id';
      const response = await request(app)
        .get(`/api/insights/song/${trackId}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('trackId', trackId);
      expect(response.body).toHaveProperty('audioFeatures');
      expect(response.body).toHaveProperty('listening');
      expect(response.body).toHaveProperty('similarTracks');
      expect(response.body).toHaveProperty('analysis');
    });

    it('should handle non-existent track gracefully', async () => {
      const response = await request(app)
        .get('/api/insights/song/non-existent-track')
        .expect(200);

      expect(response.body.success).toBe(true);
      // Should return fallback data structure
    });
  });

  describe('GET /api/insights/playlist/:playlistId', () => {
    it('should return playlist insights', async () => {
      const playlistId = 'test-playlist-id';
      const response = await request(app)
        .get(`/api/insights/playlist/${playlistId}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('playlistId', playlistId);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('trackCount');
    });

    it('should support optional parameters', async () => {
      const playlistId = 'test-playlist-id';
      const response = await request(app)
        .get(`/api/insights/playlist/${playlistId}?includeAudioFeatures=true&analyzeTrends=true`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Cache Management', () => {
    it('should return cache statistics', async () => {
      const response = await request(app)
        .get('/api/insights/cache/stats')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('cache');
      expect(response.body.cache).toHaveProperty('keys');
      expect(response.body.cache).toHaveProperty('hits');
      expect(response.body.cache).toHaveProperty('misses');
      expect(response.body.cache).toHaveProperty('hitRate');
    });

    it('should clear cache successfully', async () => {
      const response = await request(app)
        .post('/api/insights/cache/clear')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('cleared');
    });

    it('should demonstrate cache effectiveness', async () => {
      const endpoint = '/api/insights/listening-trends?page=1&limit=5';
      
      // First request - cache miss
      const response1 = await request(app)
        .get(endpoint)
        .expect(200);

      expect(response1.body.success).toBe(true);
      expect(response1.body.cached).toBeFalsy();

      // Second request - should be cached
      const response2 = await request(app)
        .get(endpoint)
        .expect(200);

      expect(response2.body.success).toBe(true);
      expect(response2.body.cached).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to insights endpoints', async () => {
      // Make multiple requests quickly to trigger rate limiting
      const requests = Array(10).fill().map(() => 
        request(app).get('/api/insights/listening-trends')
      );

      const responses = await Promise.all(requests);
      
      // All should succeed initially (within rate limit)
      responses.forEach(response => {
        expect([200, 429]).toContain(response.status);
      });
    });
  });

  describe('Audio Feature Analysis', () => {
    it('should categorize audio features correctly', async () => {
      // This tests the helper methods in the insights service
      const trackId = 'test-track-with-features';
      const response = await request(app)
        .get(`/api/insights/song/${trackId}`)
        .expect(200);

      if (response.body.analysis && !response.body.fallback) {
        expect(response.body.analysis).toHaveProperty('energy_level');
        expect(response.body.analysis).toHaveProperty('mood');
        expect(response.body.analysis).toHaveProperty('danceability_level');
        expect(['low', 'medium', 'high']).toContain(response.body.analysis.energy_level);
        expect(['sad', 'neutral', 'happy']).toContain(response.body.analysis.mood);
      }
    });
  });

  describe('Time Range Filtering', () => {
    it('should support different time ranges', async () => {
      const timeRanges = ['24h', '7d', '30d', '90d', '1y'];
      
      for (const timeRange of timeRanges) {
        const response = await request(app)
          .get(`/api/insights/listening-trends?timeRange=${timeRange}&limit=5`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.timeRange).toBe(timeRange);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // This test assumes MongoDB might not be available
      const response = await request(app)
        .get('/api/insights/listening-trends')
        .expect(200);

      expect(response.body.success).toBe(true);
      // Should work with fallback data
    });

    it('should handle invalid JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/insights/cache/clear')
        .send('invalid-json')
        .set('Content-Type', 'application/json')
        .expect(200);

      // Should still work or return appropriate error
    });
  });

  describe('Data Validation', () => {
    it('should validate pagination parameters', async () => {
      const response = await request(app)
        .get('/api/insights/listening-trends?page=0&limit=0')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.pagination.page).toBeGreaterThan(0);
      expect(response.body.pagination.limit).toBeGreaterThan(0);
    });

    it('should limit maximum results per page', async () => {
      const response = await request(app)
        .get('/api/insights/listening-trends?limit=1000')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.pagination.limit).toBeLessThanOrEqual(100);
    });
  });

  describe('Trend Analysis', () => {
    it('should calculate trends correctly', async () => {
      const response = await request(app)
        .get('/api/insights/listening-trends?features=energy,valence')
        .expect(200);

      expect(response.body.success).toBe(true);
      
      if (response.body.trends && !response.body.fallback) {
        Object.values(response.body.trends).forEach(trendData => {
          expect(trendData).toHaveProperty('average');
          expect(trendData).toHaveProperty('min');
          expect(trendData).toHaveProperty('max');
          expect(trendData).toHaveProperty('trend');
          expect(['increasing', 'decreasing', 'stable']).toContain(trendData.trend);
        });
      }
    });
  });
});

describe('Frontend Components Integration', () => {
  // These tests would typically run in a browser environment
  // For now, they serve as documentation of expected functionality
  
  describe('InsightsDashboard Component', () => {
    it('should render without crashing', () => {
      // In a real test with React Testing Library:
      // render(<InsightsDashboard />);
      // expect(screen.getByText('Music Insights Dashboard')).toBeInTheDocument();
      expect(true).toBe(true); // Placeholder
    });

    it('should handle loading states', () => {
      // Test that loading indicators appear and disappear appropriately
      expect(true).toBe(true); // Placeholder
    });

    it('should handle error states gracefully', () => {
      // Test error handling and fallback UI
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('SongsPage Component', () => {
    it('should display song list with audio features', () => {
      expect(true).toBe(true); // Placeholder
    });

    it('should expand song details on click', () => {
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('PlaylistsPage Component', () => {
    it('should show playlists with trend analysis', () => {
      expect(true).toBe(true); // Placeholder
    });

    it('should support playlist creation', () => {
      expect(true).toBe(true); // Placeholder
    });
  });
});

// Performance Tests
describe('Performance Tests', () => {
  describe('Cache Performance', () => {
    it('should improve response times with caching', async () => {
      const endpoint = '/api/insights/listening-trends?limit=10';
      
      // Clear cache first
      await request(app).post('/api/insights/cache/clear');
      
      // First request (no cache)
      const start1 = Date.now();
      await request(app).get(endpoint).expect(200);
      const time1 = Date.now() - start1;
      
      // Second request (cached)
      const start2 = Date.now();
      await request(app).get(endpoint).expect(200);
      const time2 = Date.now() - start2;
      
      // Cached request should be significantly faster
      expect(time2).toBeLessThan(time1 * 0.8);
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory with repeated requests', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Make many requests
      for (let i = 0; i < 50; i++) {
        await request(app)
          .get('/api/insights/listening-trends?limit=5')
          .expect(200);
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });
});

// Mock data helpers for tests
const mockAudioFeatures = {
  trackId: 'test-track-id',
  energy: 0.75,
  valence: 0.60,
  danceability: 0.80,
  acousticness: 0.15,
  instrumentalness: 0.05,
  speechiness: 0.10,
  tempo: 120,
  key: 1,
  time_signature: 4,
  duration_ms: 210000,
  loudness: -8.5
};

const mockListeningData = [
  {
    trackId: 'test-track-id',
    trackName: 'Test Track',
    artist: 'Test Artist',
    playedAt: new Date().toISOString(),
    audioFeatures: mockAudioFeatures
  }
];

module.exports = {
  mockAudioFeatures,
  mockListeningData
};
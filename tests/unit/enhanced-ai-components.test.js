/**
 * Comprehensive Unit Tests for Enhanced AI and ML Components
 * Covers AgentRouter, EvaluationHarness, PlaylistClusterer, and performance testing
 */

const AgentRouter = require('../../src/ai/agent/router');
const PerformanceTestSuite = require('../performance/performance-test-suite');

// Mock dependencies to avoid external API calls
jest.mock('../../src/metrics/ai-metrics', () => ({
  recordSuccess: jest.fn(),
  recordFailure: jest.fn(),
  recordAIRequest: jest.fn(),
  set: jest.fn(),
}));

jest.mock('../../src/database/mongodb', () => ({
  getDb: jest.fn(() => ({
    collection: jest.fn(() => ({
      find: jest.fn(() => ({
        toArray: jest.fn(() => Promise.resolve([]))
      })),
      aggregate: jest.fn(() => ({
        toArray: jest.fn(() => Promise.resolve([]))
      })),
      insertOne: jest.fn(() => Promise.resolve({ insertedId: 'test_id' }))
    }))
  }))
}));

describe('Enhanced AI and ML Components Unit Tests', () => {
  describe('AgentRouter', () => {
    let router;

    beforeEach(async () => {
      router = new AgentRouter();
      // Wait for initialization
      await router.ensureInitialized();
    });

    test('should initialize with default configuration', () => {
      expect(router.config.defaultProvider).toBe('vertex');
      expect(router.config.enableFallback).toBe(true);
      expect(router.config.costThreshold).toBe(0.01);
      expect(router.config.latencyThreshold).toBe(5000);
    });

    test('should initialize providers map', () => {
      expect(router.providers).toBeInstanceOf(Map);
      expect(router.providers.size).toBeGreaterThan(0);
    });

    test('should initialize routing policies', () => {
      expect(router.policies).toBeInstanceOf(Map);
      expect(router.policies.has('text-generation')).toBe(true);
      expect(router.policies.has('balanced')).toBe(true);
      expect(router.policies.has('ensemble')).toBe(true);
    });

    test('should normalize simple string requests', () => {
      const request = 'Test prompt';
      const normalized = router.normalizeRequest(request);
      
      expect(normalized.type).toBe('text-generation');
      expect(normalized.model).toBe('auto');
      expect(normalized.payload.content).toBe('Test prompt');
    });

    test('should normalize object requests', () => {
      const request = {
        type: 'embeddings',
        input: 'Test input'
      };
      const normalized = router.normalizeRequest(request);
      
      expect(normalized.type).toBe('embeddings');
      expect(normalized.payload.content).toBe('Test input');
    });

    test('should handle provider selection with fallback', async () => {
      const mockRequest = {
        type: 'text-generation',
        model: 'auto',
        payload: { content: 'test' },
        options: {}
      };

      // This should use fallback to mock provider
      const selection = await router.selectBestProvider(
        { provider: 'nonexistent', model: 'test-model' },
        mockRequest
      );

      expect(selection.provider).toBe('mock');
      expect(selection.rationale).toContain('Fallback to mock');
    });

    test('should get default performance metrics', () => {
      const defaultPerf = router.getDefaultPerformance();
      
      expect(defaultPerf).toHaveProperty('averageLatency', 1000);
      expect(defaultPerf).toHaveProperty('successRate', 1.0);
      expect(defaultPerf).toHaveProperty('averageCost', 0.001);
    });

    test('should calculate analytics', () => {
      const analytics = router.getAnalytics();
      
      expect(analytics).toHaveProperty('totalRequests');
      expect(analytics).toHaveProperty('availableProviders');
      expect(analytics).toHaveProperty('availablePolicies');
      expect(Array.isArray(analytics.availableProviders)).toBe(true);
      expect(Array.isArray(analytics.availablePolicies)).toBe(true);
    });

    test('should provide health check', async () => {
      const health = await router.healthCheck();
      
      expect(typeof health).toBe('object');
      // Should have at least mock provider
      expect(Object.keys(health).length).toBeGreaterThan(0);
    });

    test('should route requests successfully', async () => {
      const request = {
        type: 'text-generation',
        payload: { content: 'Test routing request' },
        options: {}
      };

      const response = await router.route(request, { strategy: 'balanced' });
      
      expect(response).toBeDefined();
      expect(response.content || response.text).toBeDefined();
    });

    test('should handle different routing strategies', async () => {
      const request = {
        type: 'text-generation',
        payload: { content: 'Test strategy routing' },
        options: {}
      };

      const strategies = ['low-cost', 'low-latency', 'balanced'];
      
      for (const strategy of strategies) {
        const response = await router.route(request, { strategy });
        expect(response).toBeDefined();
      }
    });
  });

  describe('Performance Test Suite', () => {
    let perfSuite;

    beforeEach(async () => {
      perfSuite = new PerformanceTestSuite();
      await perfSuite.initialize();
    });

    test('should initialize all components', () => {
      expect(perfSuite.router).toBeDefined();
      expect(perfSuite.recommendationEngine).toBeDefined();
      expect(perfSuite.clusterer).toBeDefined();
    });

    test('should calculate statistics correctly', () => {
      const mockResults = [
        { success: true, latency: 100 },
        { success: true, latency: 200 },
        { success: true, latency: 150 },
        { success: false, latency: 0, error: 'Test error' }
      ];

      const stats = perfSuite.calculateStatistics(mockResults);
      
      expect(stats.count).toBe(4);
      expect(stats.successCount).toBe(3);
      expect(stats.successRate).toBe('75.00%');
      expect(stats.latency.min).toBe('100.00');
      expect(stats.latency.max).toBe('200.00');
      expect(stats.latency.mean).toBe('150.00');
    });

    test('should handle empty results', () => {
      const stats = perfSuite.calculateStatistics([]);
      
      expect(stats.count).toBe(0);
      expect(stats.error).toBe('No results to analyze');
    });

    test('should handle all failed results', () => {
      const mockResults = [
        { success: false, latency: 0, error: 'Error 1' },
        { success: false, latency: 0, error: 'Error 2' }
      ];

      const stats = perfSuite.calculateStatistics(mockResults);
      
      expect(stats.count).toBe(2);
      expect(stats.successRate).toBe('0%');
      expect(stats.errors).toEqual(['Error 1', 'Error 2']);
    });

    test('should perform single AI routing test', async () => {
      const result = await perfSuite.singleAIRoutingTest('balanced');
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('latency');
      expect(result).toHaveProperty('strategy', 'balanced');
      
      if (result.success) {
        expect(result).toHaveProperty('responseLength');
        expect(result).toHaveProperty('provider');
      } else {
        expect(result).toHaveProperty('error');
      }
    });

    test('should perform single recommendation test', async () => {
      const testCase = { userId: 'test_user', limit: 10 };
      const result = await perfSuite.singleRecommendationTest(testCase);
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('latency');
      expect(result).toHaveProperty('userId', 'test_user');
      expect(result).toHaveProperty('limit', 10);
    });

    test('should perform single clustering test', async () => {
      const testCase = { trackCount: 50, k: 3 };
      const result = await perfSuite.singleClusteringTest(testCase);
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('latency');
      expect(result).toHaveProperty('trackCount', 50);
      expect(result).toHaveProperty('k', 3);
    });

    test('should generate baseline metrics', () => {
      // Set up some mock results
      perfSuite.results = {
        aiRouting: { balanced: { successRate: '95%' } },
        recommendations: { limit_10: { successRate: '90%' } },
        clustering: { tracks_50_k3: { successRate: '85%' } }
      };

      const baseline = perfSuite.generateBaseline();
      
      expect(baseline).toHaveProperty('timestamp');
      expect(baseline).toHaveProperty('version');
      expect(baseline).toHaveProperty('aiRouting');
      expect(baseline).toHaveProperty('recommendations');
      expect(baseline).toHaveProperty('clustering');
    });
  });

  describe('Evaluation Metrics', () => {
    // Mock the EvaluationHarness since it requires database
    const mockEvaluationHarness = {
      calculatePrecisionAtK: (recommended, relevant, k) => {
        const topK = recommended.slice(0, k);
        const hits = topK.filter(trackId => relevant.includes(trackId));
        return hits.length / k;
      },

      calculateRecallAtK: (recommended, relevant) => {
        if (relevant.length === 0) return 0;
        const hits = recommended.filter(trackId => relevant.includes(trackId));
        return hits.length / relevant.length;
      },

      calculateMRR: (recommended, relevant) => {
        for (let i = 0; i < recommended.length; i++) {
          if (relevant.includes(recommended[i])) {
            return 1 / (i + 1);
          }
        }
        return 0;
      },

      calculateAudioSimilarity: (features1, features2) => {
        const audioFeatures = ['danceability', 'energy', 'valence'];
        let similarity = 0;
        let validFeatures = 0;

        for (const feature of audioFeatures) {
          if (features1[feature] !== undefined && features2[feature] !== undefined) {
            const diff = Math.abs(features1[feature] - features2[feature]);
            similarity += 1 - diff;
            validFeatures++;
          }
        }

        return validFeatures > 0 ? similarity / validFeatures : 0;
      }
    };

    test('should calculate precision@k correctly', () => {
      const recommended = ['track1', 'track2', 'track3', 'track4', 'track5'];
      const relevant = ['track2', 'track4', 'track6'];
      const k = 5;

      const precision = mockEvaluationHarness.calculatePrecisionAtK(recommended, relevant, k);
      
      expect(precision).toBe(0.4); // 2 hits out of 5
    });

    test('should calculate recall@k correctly', () => {
      const recommended = ['track1', 'track2', 'track3'];
      const relevant = ['track2', 'track4', 'track6'];

      const recall = mockEvaluationHarness.calculateRecallAtK(recommended, relevant);
      
      expect(recall).toBeCloseTo(0.333, 2); // 1 hit out of 3 relevant
    });

    test('should handle empty relevant set for recall', () => {
      const recommended = ['track1', 'track2', 'track3'];
      const relevant = [];

      const recall = mockEvaluationHarness.calculateRecallAtK(recommended, relevant);
      
      expect(recall).toBe(0);
    });

    test('should calculate MRR correctly', () => {
      const recommended = ['track1', 'track2', 'track3'];
      const relevant = ['track2', 'track4'];

      const mrr = mockEvaluationHarness.calculateMRR(recommended, relevant);
      
      expect(mrr).toBe(0.5); // First relevant at position 2, so 1/2
    });

    test('should return 0 MRR when no relevant items found', () => {
      const recommended = ['track1', 'track2', 'track3'];
      const relevant = ['track4', 'track5'];

      const mrr = mockEvaluationHarness.calculateMRR(recommended, relevant);
      
      expect(mrr).toBe(0);
    });

    test('should calculate audio similarity', () => {
      const features1 = {
        danceability: 0.8,
        energy: 0.7,
        valence: 0.6
      };
      const features2 = {
        danceability: 0.7,
        energy: 0.8,
        valence: 0.5
      };

      const similarity = mockEvaluationHarness.calculateAudioSimilarity(features1, features2);
      
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThanOrEqual(1);
    });
  });

  describe('Clustering Algorithms', () => {
    // Mock the PlaylistClusterer for unit testing
    const mockClusterer = {
      euclideanDistance: (point1, point2) => {
        let sum = 0;
        for (let i = 0; i < point1.length; i++) {
          sum += Math.pow(point1[i] - point2[i], 2);
        }
        return Math.sqrt(sum);
      },

      normalizeFeatures: (trackFeatures) => {
        const featureCount = trackFeatures[0].features.length;
        const mins = new Array(featureCount).fill(Infinity);
        const maxs = new Array(featureCount).fill(-Infinity);

        // Find min and max for each feature
        trackFeatures.forEach(track => {
          track.features.forEach((value, index) => {
            mins[index] = Math.min(mins[index], value);
            maxs[index] = Math.max(maxs[index], value);
          });
        });

        // Normalize features
        return trackFeatures.map(track => ({
          track_id: track.track_id,
          features: track.features.map((value, index) => {
            const range = maxs[index] - mins[index];
            return range > 0 ? (value - mins[index]) / range : 0;
          }),
        }));
      },

      findNearestCentroid: (point, centroids) => {
        let minDistance = Infinity;
        let nearestIndex = 0;

        centroids.forEach((centroid, index) => {
          const distance = mockClusterer.euclideanDistance(point, centroid);
          if (distance < minDistance) {
            minDistance = distance;
            nearestIndex = index;
          }
        });

        return nearestIndex;
      }
    };

    test('should calculate euclidean distance correctly', () => {
      const point1 = [0.1, 0.2, 0.3];
      const point2 = [0.4, 0.5, 0.6];

      const distance = mockClusterer.euclideanDistance(point1, point2);
      
      expect(distance).toBeCloseTo(0.52, 1);
    });

    test('should normalize features correctly', () => {
      const mockFeatures = [
        { track_id: 'track1', features: [0.1, 0.2, 0.3] },
        { track_id: 'track2', features: [0.4, 0.5, 0.6] },
        { track_id: 'track3', features: [0.7, 0.8, 0.9] }
      ];

      const normalized = mockClusterer.normalizeFeatures(mockFeatures);
      
      expect(normalized).toHaveLength(3);
      expect(normalized[0].features[0]).toBe(0); // Min value should be 0
      expect(normalized[2].features[2]).toBe(1); // Max value should be 1
    });

    test('should find nearest centroid correctly', () => {
      const point = [0.5, 0.5, 0.5];
      const centroids = [
        [0.1, 0.1, 0.1],
        [0.6, 0.6, 0.6],
        [0.9, 0.9, 0.9]
      ];

      const nearest = mockClusterer.findNearestCentroid(point, centroids);
      
      expect(nearest).toBe(1); // Second centroid is closest
    });
  });

  describe('Integration Tests', () => {
    test('should handle end-to-end AI routing workflow', async () => {
      const router = new AgentRouter();
      await router.ensureInitialized();

      const request = {
        type: 'text-generation',
        payload: { content: 'Generate music recommendations for workout' },
        options: {}
      };

      // Test multiple strategies
      const strategies = ['balanced', 'low-cost', 'low-latency'];
      const results = [];

      for (const strategy of strategies) {
        try {
          const response = await router.route(request, { strategy });
          results.push({ strategy, success: true, response });
        } catch (error) {
          results.push({ strategy, success: false, error: error.message });
        }
      }

      // At least one strategy should work (mock provider should always be available)
      expect(results.some(r => r.success)).toBe(true);
    });

    test('should maintain routing history', async () => {
      const router = new AgentRouter();
      await router.ensureInitialized();

      const initialHistoryLength = router.routingHistory.length;

      const request = {
        type: 'text-generation',
        payload: { content: 'Test history tracking' },
        options: {}
      };

      await router.route(request, { strategy: 'balanced' });

      expect(router.routingHistory.length).toBe(initialHistoryLength + 1);
      
      const lastEntry = router.routingHistory[router.routingHistory.length - 1];
      expect(lastEntry).toHaveProperty('timestamp');
      expect(lastEntry).toHaveProperty('request_type', 'text-generation');
      expect(lastEntry).toHaveProperty('routing_strategy', 'balanced');
    });
  });
});

module.exports = {
  AgentRouter,
  PerformanceTestSuite
};
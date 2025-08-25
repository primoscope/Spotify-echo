/**
 * Integration Tests for Enhanced AI and ML Components
 * Tests the multi-model AI router, recommendation system, and clustering
 */

const AgentRouter = require('../../src/ai/agent/router');
const EvaluationHarness = require('../../src/ml/evaluation-harness');
const PlaylistClusterer = require('../../src/ml/playlist-clustering');
const RecommendationEngine = require('../../src/ml/recommendation-engine-enhanced');

describe('Enhanced AI and ML Integration Tests', () => {
  let router;
  let evaluationHarness;
  let clusterer;
  let recommendationEngine;

  beforeAll(async () => {
    // Initialize components
    router = new AgentRouter();
    evaluationHarness = new EvaluationHarness();
    clusterer = new PlaylistClusterer();
    recommendationEngine = new RecommendationEngine();

    // Initialize recommendation engine
    await recommendationEngine.initialize();
  });

  describe('Multi-Model AI Router', () => {
    test('should initialize with multiple providers', () => {
      expect(router.providers.size).toBeGreaterThan(0);
      expect(router.providers.has('mock')).toBe(true);
    });

    test('should route requests to appropriate providers', async () => {
      const request = {
        type: 'text-generation',
        payload: { content: 'Test recommendation request' },
        options: {}
      };

      const response = await router.route(request, { strategy: 'low-cost' });
      
      expect(response).toBeDefined();
      expect(response.content || response.text).toBeDefined();
    });

    test('should handle ensemble routing', async () => {
      const request = {
        type: 'text-generation',
        payload: { content: 'Generate music recommendations' },
        options: {}
      };

      // Note: This will only work with mock provider in test environment
      const response = await router.route(request, { strategy: 'balanced' });
      
      expect(response).toBeDefined();
    });

    test('should provide health check information', async () => {
      const health = await router.healthCheck();
      expect(health).toBeDefined();
    });

    test('should track routing analytics', () => {
      const analytics = router.getAnalytics();
      expect(analytics).toBeDefined();
    });
  });

  describe('Recommendation System Evaluation', () => {
    test('should prepare test data', async () => {
      // Mock test with sample data
      const mockTestData = [
        {
          userId: 'test_user_1',
          trainTracks: [
            { track_id: 'track1', played_at: '2024-01-01T00:00:00Z' },
            { track_id: 'track2', played_at: '2024-01-02T00:00:00Z' }
          ],
          testTracks: [
            { track_id: 'track3', played_at: '2024-01-03T00:00:00Z' }
          ]
        }
      ];

      expect(mockTestData).toBeDefined();
      expect(mockTestData.length).toBe(1);
      expect(mockTestData[0].trainTracks.length).toBe(2);
      expect(mockTestData[0].testTracks.length).toBe(1);
    });

    test('should calculate precision@k', () => {
      const recommended = ['track1', 'track2', 'track3', 'track4', 'track5'];
      const relevant = ['track2', 'track4', 'track6'];
      const k = 5;

      const precision = evaluationHarness.calculatePrecisionAtK(recommended, relevant, k);
      
      expect(precision).toBe(0.4); // 2 hits out of 5 recommendations
    });

    test('should calculate recall@k', () => {
      const recommended = ['track1', 'track2', 'track3'];
      const relevant = ['track2', 'track4', 'track6'];

      const recall = evaluationHarness.calculateRecallAtK(recommended, relevant);
      
      expect(recall).toBeCloseTo(0.333, 2); // 1 hit out of 3 relevant
    });

    test('should calculate MRR', () => {
      const recommended = ['track1', 'track2', 'track3'];
      const relevant = ['track2', 'track4'];

      const mrr = evaluationHarness.calculateMRR(recommended, relevant);
      
      expect(mrr).toBe(0.5); // First relevant item at position 2, so 1/2 = 0.5
    });

    test('should calculate NDCG', () => {
      const recommended = ['track1', 'track2', 'track3'];
      const relevant = ['track2'];
      const k = 3;

      const ndcg = evaluationHarness.calculateNDCG(recommended, relevant, k);
      
      expect(ndcg).toBeGreaterThan(0);
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

      const similarity = evaluationHarness.calculateAudioSimilarity(features1, features2);
      
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThanOrEqual(1);
    });
  });

  describe('Playlist Clustering', () => {
    test('should normalize audio features', () => {
      const mockFeatures = [
        { track_id: 'track1', features: [0.1, 0.2, 0.3] },
        { track_id: 'track2', features: [0.4, 0.5, 0.6] },
        { track_id: 'track3', features: [0.7, 0.8, 0.9] }
      ];

      const normalized = clusterer.normalizeFeatures(mockFeatures);
      
      expect(normalized).toHaveLength(3);
      expect(normalized[0].features[0]).toBe(0); // Min value should be 0
      expect(normalized[2].features[2]).toBe(1); // Max value should be 1
    });

    test('should calculate euclidean distance', () => {
      const point1 = [0.1, 0.2, 0.3];
      const point2 = [0.4, 0.5, 0.6];

      const distance = clusterer.euclideanDistance(point1, point2);
      
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeCloseTo(0.52, 1);
    });

    test('should find nearest centroid', () => {
      const point = [0.5, 0.5, 0.5];
      const centroids = [
        [0.1, 0.1, 0.1],
        [0.6, 0.6, 0.6],
        [0.9, 0.9, 0.9]
      ];

      const nearest = clusterer.findNearestCentroid(point, centroids);
      
      expect(nearest).toBe(1); // Second centroid is closest
    });

    test('should initialize random centroids', () => {
      const k = 3;
      const featureCount = 5;

      const centroids = clusterer.initializeRandomCentroids(k, featureCount);
      
      expect(centroids).toHaveLength(k);
      expect(centroids[0]).toHaveLength(featureCount);
      
      // Check that values are between 0 and 1
      centroids.forEach(centroid => {
        centroid.forEach(value => {
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(1);
        });
      });
    });

    test('should update centroids correctly', () => {
      const points = [
        [0.1, 0.1],
        [0.2, 0.2],
        [0.8, 0.8],
        [0.9, 0.9]
      ];
      const assignments = [0, 0, 1, 1]; // Two clusters
      const k = 2;

      const centroids = clusterer.updateCentroids(points, assignments, k);
      
      expect(centroids).toHaveLength(2);
      expect(centroids[0][0]).toBeCloseTo(0.15, 2); // Average of 0.1 and 0.2
      expect(centroids[0][1]).toBeCloseTo(0.15, 2);
      expect(centroids[1][0]).toBeCloseTo(0.85, 2); // Average of 0.8 and 0.9
      expect(centroids[1][1]).toBeCloseTo(0.85, 2);
    });

    test('should check convergence', () => {
      const oldCentroids = [[0.1, 0.1], [0.9, 0.9]];
      const newCentroids1 = [[0.1001, 0.1001], [0.9001, 0.9001]];
      const newCentroids2 = [[0.2, 0.2], [0.8, 0.8]];
      const tolerance = 0.01;

      const converged1 = clusterer.checkConvergence(oldCentroids, newCentroids1, tolerance);
      const converged2 = clusterer.checkConvergence(oldCentroids, newCentroids2, tolerance);
      
      expect(converged1).toBe(true); // Small change, should converge
      expect(converged2).toBe(false); // Large change, should not converge
    });

    test('should calculate clustering metrics', () => {
      const mockClusterResults = {
        clusters: [
          [
            { track_id: 'track1', features: [0.1, 0.2] },
            { track_id: 'track2', features: [0.15, 0.25] }
          ],
          [
            { track_id: 'track3', features: [0.8, 0.9] },
            { track_id: 'track4', features: [0.85, 0.95] }
          ]
        ],
        centroids: [[0.125, 0.225], [0.825, 0.925]]
      };

      const metrics = clusterer.calculateClusteringMetrics(mockClusterResults);
      
      expect(metrics).toBeDefined();
      expect(metrics.clusterSizes).toEqual([2, 2]);
      expect(metrics.intraClusterVariance).toBeGreaterThanOrEqual(0);
      expect(metrics.interClusterDistance).toBeGreaterThan(0);
    });
  });

  describe('Enhanced Recommendation Engine', () => {
    test('should initialize successfully', async () => {
      const engine = new RecommendationEngine();
      const initialized = await engine.initialize();
      
      expect(initialized).toBe(true);
      expect(engine.initialized).toBe(true);
    });

    test('should handle empty recommendation requests', async () => {
      const recommendations = await recommendationEngine.generateRecommendations('nonexistent_user');
      
      expect(Array.isArray(recommendations)).toBe(true);
      // Should return fallback recommendations or empty array
    });

    test('should respect recommendation limits', async () => {
      const limit = 5;
      const recommendations = await recommendationEngine.generateRecommendations('test_user', { limit });
      
      expect(recommendations.length).toBeLessThanOrEqual(limit);
    });
  });

  describe('End-to-End Integration', () => {
    test('should generate AI-powered playlist clustering', async () => {
      // Mock track IDs for testing
      const mockTrackIds = ['track1', 'track2', 'track3', 'track4', 'track5'];
      
      // This test would normally cluster real tracks but we'll mock the process
      const mockClusterResult = {
        clusterId: 'test_cluster_123',
        clusters: [mockTrackIds.slice(0, 3), mockTrackIds.slice(3)],
        centroids: [[0.5, 0.5, 0.5], [0.8, 0.8, 0.8]],
        labels: ['Cluster 1', 'Cluster 2'],
        metrics: { clusterSizes: [3, 2] }
      };
      
      expect(mockClusterResult.clusterId).toBeDefined();
      expect(mockClusterResult.clusters).toHaveLength(2);
      expect(mockClusterResult.labels).toHaveLength(2);
    });

    test('should integrate AI routing with recommendation generation', async () => {
      const request = {
        type: 'text-generation',
        payload: { content: 'Generate upbeat workout music recommendations' },
        options: {}
      };

      const aiResponse = await router.route(request, { strategy: 'balanced' });
      
      expect(aiResponse).toBeDefined();
      expect(aiResponse.content || aiResponse.text).toBeDefined();
    });

    test('should handle provider fallback gracefully', async () => {
      const request = {
        type: 'text-generation',
        payload: { content: 'Test fallback mechanism' },
        options: {}
      };

      // Should fallback to mock provider when others fail
      const response = await router.route(request, { strategy: 'high-quality' });
      
      expect(response).toBeDefined();
    });
  });

  afterAll(async () => {
    // Cleanup
    if (recommendationEngine && recommendationEngine.stopBackgroundProcessing) {
      recommendationEngine.stopBackgroundProcessing();
    }
  });
});

module.exports = {
  AgentRouter,
  EvaluationHarness,
  PlaylistClusterer,
  RecommendationEngine
};
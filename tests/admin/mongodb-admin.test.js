const request = require('supertest');
const express = require('express');
const adminRoutes = require('../../src/api/routes/admin');
const mongoDBManager = require('../../src/database/mongodb-manager');

// Mock MongoDB manager for testing
jest.mock('../../src/database/mongodb-manager');

describe('MongoDB Admin API Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/admin', adminRoutes);
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('GET /api/admin/health', () => {
    it('should return healthy status when MongoDB is connected', async () => {
      mongoDBManager.isConnected.mockReturnValue(true);
      mongoDBManager.healthCheck.mockResolvedValue({
        status: 'healthy',
        message: 'MongoDB connection is healthy',
        responseTime: '25ms',
        database: 'echotune'
      });

      const response = await request(app)
        .get('/api/admin/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.mongodb.connected).toBe(true);
      expect(response.body.adminTools.available).toBe(true);
      expect(response.body.adminTools.readOnly).toBe(true);
    });

    it('should return unhealthy status when MongoDB is disconnected', async () => {
      mongoDBManager.isConnected.mockReturnValue(false);
      mongoDBManager.healthCheck.mockResolvedValue({
        status: 'unhealthy',
        message: 'Not connected to MongoDB'
      });

      const response = await request(app)
        .get('/api/admin/health')
        .expect(200);

      expect(response.body.success).toBe(false);
      expect(response.body.mongodb.connected).toBe(false);
      expect(response.body.adminTools.available).toBe(false);
    });

    it('should handle health check errors gracefully', async () => {
      mongoDBManager.isConnected.mockReturnValue(true);
      mongoDBManager.healthCheck.mockRejectedValue(new Error('Connection timeout'));

      const response = await request(app)
        .get('/api/admin/health')
        .expect(200); // Changed from 500 to 200 as we now handle gracefully

      expect(response.body.success).toBe(false);
      expect(response.body.mongodb.status).toBe('unhealthy');
      expect(response.body.mongodb.message).toContain('Connection timeout');
    });
  });

  describe('GET /api/admin/dashboard', () => {
    const mockDashboardData = {
      overview: {
        database: 'echotune',
        totalCollections: 5,
        totalDocuments: 10000,
        totalDataSize: 52428800,
        totalIndexSize: 1048576,
        uptime: 86400,
        connections: { current: 5, available: 195, totalCreated: 100 }
      },
      collections: [
        { name: 'echotune_users', count: 1000, size: 1048576, avgSize: 1024, indexCount: 3 },
        { name: 'echotune_listening_history', count: 8000, size: 41943040, avgSize: 5243, indexCount: 4 }
      ],
      indexHealth: {
        healthy: 12,
        problematic: 1,
        unused: 2,
        recommendations: [
          {
            type: 'unused_index',
            collection: 'echotune_users',
            severity: 'medium',
            description: 'Index "old_index" has never been used'
          }
        ]
      }
    };

    it('should return comprehensive dashboard data when connected', async () => {
      mongoDBManager.isConnected.mockReturnValue(true);
      mongoDBManager.getCollectionStats.mockResolvedValue({
        collections: mockDashboardData.collections,
        totalCollections: 5,
        totalDocuments: 10000,
        totalDataSize: 52428800,
        totalIndexSize: 1048576
      });
      mongoDBManager.analyzeIndexHealth.mockResolvedValue({
        healthyIndexes: 12, // Changed from healthy to healthyIndexes
        problematicIndexes: 1, // Changed from problematic to problematicIndexes  
        unusedIndexes: 2, // Changed from unused to unusedIndexes
        recommendations: mockDashboardData.indexHealth.recommendations
      });
      mongoDBManager.getDatabaseStats.mockResolvedValue(mockDashboardData.overview);
      mongoDBManager.validateAdminAccess.mockResolvedValue({
        permissions: { readAccess: true, adminAccess: true }
      });

      const response = await request(app)
        .get('/api/admin/dashboard')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.dashboard.overview.database).toBe('echotune');
      expect(response.body.dashboard.overview.totalCollections).toBe(5);
      expect(response.body.dashboard.collections).toHaveLength(2);
      expect(response.body.dashboard.indexHealth.healthy).toBe(12);
      expect(response.body.dashboard.lastUpdated).toBeDefined();
    });

    it('should return graceful response when MongoDB is not connected', async () => {
      mongoDBManager.isConnected.mockReturnValue(false);

      const response = await request(app)
        .get('/api/admin/dashboard')
        .expect(200); // Changed from 503 to 200 as we now provide fallback dashboard

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('MongoDB not connected');
      expect(response.body.dashboard).toBeDefined();
      expect(response.body.dashboard.overview.database).toBe('N/A');
    });

    it('should handle dashboard data loading errors gracefully', async () => {
      mongoDBManager.isConnected.mockReturnValue(true);
      mongoDBManager.getCollectionStats.mockRejectedValue(new Error('Access denied'));

      const response = await request(app)
        .get('/api/admin/dashboard')
        .expect(200); // Changed from 500 to 200 as we now handle errors gracefully

      expect(response.body.success).toBe(true);
      expect(response.body.dashboard).toBeDefined();
      expect(response.body.dashboard.warnings).toContain('Collection stats: Access denied');
    });
  });

  describe('GET /api/admin/collections', () => {
    const mockCollectionStats = {
      collections: [
        {
          name: 'echotune_users',
          count: 1000,
          size: 1048576,
          storageSize: 2097152,
          avgObjSize: 1024,
          indexCount: 3,
          indexes: [
            { name: '_id_', key: { _id: 1 } },
            { name: 'spotifyId_1', key: { spotifyId: 1 }, unique: true },
            { name: 'email_1', key: { email: 1 } }
          ]
        }
      ],
      totalCollections: 1,
      totalDocuments: 1000,
      totalDataSize: 1048576,
      totalIndexSize: 65536
    };

    it('should return collection statistics', async () => {
      mongoDBManager.isConnected.mockReturnValue(true);
      mongoDBManager.getCollectionStats.mockResolvedValue(mockCollectionStats);

      const response = await request(app)
        .get('/api/admin/collections')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.collections).toHaveLength(1);
      expect(response.body.collections[0].name).toBe('echotune_users');
      expect(response.body.collections[0].count).toBe(1000);
      expect(response.body.summary.totalCollections).toBe(1);
      expect(response.body.summary.totalDocuments).toBe(1000);
    });

    it('should handle collection stats errors', async () => {
      mongoDBManager.isConnected.mockReturnValue(true);
      mongoDBManager.getCollectionStats.mockRejectedValue(new Error('Permission denied'));

      const response = await request(app)
        .get('/api/admin/collections')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to get collection statistics');
    });
  });

  describe('GET /api/admin/indexes', () => {
    const mockIndexHealth = {
      healthyIndexes: 10,
      problematicIndexes: 1,
      unusedIndexes: 2,
      recommendations: [
        {
          type: 'unused_index',
          collection: 'echotune_test',
          index: 'unused_index_1',
          severity: 'medium',
          description: 'Index has never been used',
          recommendation: 'Consider dropping this index'
        },
        {
          type: 'missing_index',
          collection: 'echotune_users',
          index: { userId: 1, createdAt: -1 },
          severity: 'high',
          description: 'Missing recommended index',
          reason: 'Frequently queried fields'
        }
      ]
    };

    it('should return index health analysis', async () => {
      mongoDBManager.isConnected.mockReturnValue(true);
      mongoDBManager.analyzeIndexHealth.mockResolvedValue(mockIndexHealth);

      const response = await request(app)
        .get('/api/admin/indexes')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.indexAnalysis.healthyIndexes).toBe(10);
      expect(response.body.indexAnalysis.unusedIndexes).toBe(2);
      expect(response.body.indexAnalysis.recommendations).toHaveLength(2);
    });
  });

  describe('GET /api/admin/slow-queries', () => {
    const mockSlowQueries = {
      threshold: 100,
      totalSlowQueries: 5,
      queries: [
        {
          timestamp: new Date(),
          duration: 250,
          collection: 'users',
          operation: 'find',
          planSummary: 'COLLSCAN',
          docsExamined: 1000,
          docsReturned: 1,
          efficiency: '0.10%'
        }
      ],
      recommendations: [
        {
          type: 'performance',
          collection: 'users',
          severity: 'high',
          description: 'Collection has queries requiring collection scans',
          recommendation: 'Add appropriate indexes'
        }
      ]
    };

    it('should return slow query analysis with default parameters', async () => {
      mongoDBManager.isConnected.mockReturnValue(true);
      mongoDBManager.analyzeSlowQueries.mockResolvedValue(mockSlowQueries);

      const response = await request(app)
        .get('/api/admin/slow-queries')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.slowQueries.threshold).toBe(100);
      expect(response.body.slowQueries.queries).toHaveLength(1);
      expect(mongoDBManager.analyzeSlowQueries).toHaveBeenCalledWith({
        threshold: 100,
        limit: 50
      });
    });

    it('should accept custom threshold and limit parameters', async () => {
      mongoDBManager.isConnected.mockReturnValue(true);
      mongoDBManager.analyzeSlowQueries.mockResolvedValue(mockSlowQueries);

      const response = await request(app)
        .get('/api/admin/slow-queries?threshold=200&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mongoDBManager.analyzeSlowQueries).toHaveBeenCalledWith({
        threshold: 200,
        limit: 10
      });
    });

    it('should handle profiling access errors gracefully', async () => {
      mongoDBManager.isConnected.mockReturnValue(true);
      mongoDBManager.analyzeSlowQueries.mockRejectedValue(new Error('Profiling not enabled'));

      const response = await request(app)
        .get('/api/admin/slow-queries')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to analyze slow queries');
      expect(response.body.note).toBe('Query profiling may need to be enabled');
    });
  });

  describe('POST /api/admin/collections/:name/export', () => {
    const mockExportData = {
      collection: 'echotune_users',
      count: 100,
      totalInCollection: 1000,
      exportedAt: new Date().toISOString(),
      format: 'json',
      data: [
        { _id: '1', name: 'User 1', email: '[REDACTED]' },
        { _id: '2', name: 'User 2', email: '[REDACTED]' }
      ]
    };

    it('should export collection data with default parameters', async () => {
      mongoDBManager.isConnected.mockReturnValue(true);
      mongoDBManager.exportCollectionData.mockResolvedValue(mockExportData);

      const response = await request(app)
        .post('/api/admin/collections/echotune_users/export')
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.export.collection).toBe('echotune_users');
      expect(response.body.export.count).toBe(100);
      expect(response.body.export.data).toHaveLength(2);
      
      expect(mongoDBManager.exportCollectionData).toHaveBeenCalledWith('echotune_users', {
        limit: 1000,
        skip: 0,
        query: {},
        projection: {},
        format: 'json',
        sanitize: true
      });
    });

    it('should accept custom export parameters', async () => {
      mongoDBManager.isConnected.mockReturnValue(true);
      mongoDBManager.exportCollectionData.mockResolvedValue(mockExportData);

      const response = await request(app)
        .post('/api/admin/collections/echotune_users/export')
        .send({
          limit: 500,
          skip: 100,
          query: { active: true },
          format: 'csv',
          sanitize: false
        })
        .expect(200);

      expect(mongoDBManager.exportCollectionData).toHaveBeenCalledWith('echotune_users', {
        limit: 500,
        skip: 100,
        query: { active: true },
        projection: {},
        format: 'csv',
        sanitize: false
      });
    });

    it('should reject exports exceeding safety limits', async () => {
      const response = await request(app)
        .post('/api/admin/collections/echotune_users/export')
        .send({ limit: 15000 })
        .expect(200); // Changed from 400 to 200 as we now return JSON instead of status code

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Export limit cannot exceed 10,000 documents for safety');
    });

    it('should handle export errors gracefully', async () => {
      mongoDBManager.isConnected.mockReturnValue(true);
      mongoDBManager.exportCollectionData.mockResolvedValue({
        error: 'Collection not found',
        collection: 'nonexistent',
        count: 0,
        data: []
      });

      const response = await request(app)
        .post('/api/admin/collections/nonexistent/export')
        .send({})
        .expect(200); // Changed from 500 to 200 as we handle gracefully

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Collection not found');
    });
  });

  describe('GET /api/admin/collections/:name/export-info', () => {
    const mockExportMetadata = {
      collection: 'echotune_users',
      totalDocuments: 1000,
      avgDocumentSize: 1024,
      totalDataSize: 1048576,
      sampleDocument: { _id: '1', name: 'User 1' },
      availableFields: ['_id', 'name', 'email', 'createdAt'],
      indexes: [{ name: '_id_', keys: ['_id'] }],
      recommendedBatchSize: 5000
    };

    it('should return export metadata for collection', async () => {
      mongoDBManager.isConnected.mockReturnValue(true);
      mongoDBManager.getExportMetadata.mockResolvedValue(mockExportMetadata);

      const response = await request(app)
        .get('/api/admin/collections/echotune_users/export-info')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.exportMetadata.collection).toBe('echotune_users');
      expect(response.body.exportMetadata.totalDocuments).toBe(1000);
      expect(response.body.exportMetadata.availableFields).toContain('name');
      expect(response.body.exportMetadata.recommendedBatchSize).toBe(5000);
    });
  });

  describe('GET /api/admin/access-check', () => {
    const mockAccessValidation = {
      isValid: true,
      permissions: {
        connection: true,
        readAccess: true,
        adminAccess: true,
        profilingAccess: false,
        indexAccess: true
      },
      recommendations: ['No profiling access - slow query analysis unavailable']
    };

    it('should validate admin access and permissions', async () => {
      mongoDBManager.validateAdminAccess.mockResolvedValue(mockAccessValidation);

      const response = await request(app)
        .get('/api/admin/access-check')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.access.isValid).toBe(true);
      expect(response.body.access.permissions.readAccess).toBe(true);
      expect(response.body.access.recommendations).toHaveLength(1);
    });
  });

  describe('GET /api/admin/recommendations', () => {
    const mockIndexHealth = {
      recommendations: [
        { type: 'missing_index', severity: 'high' },
        { type: 'unused_index', severity: 'medium' }
      ]
    };

    const mockSlowQueries = {
      recommendations: [
        { type: 'performance', severity: 'high' }
      ]
    };

    it('should return categorized system recommendations', async () => {
      mongoDBManager.isConnected.mockReturnValue(true);
      mongoDBManager.analyzeIndexHealth.mockResolvedValue(mockIndexHealth);
      mongoDBManager.analyzeSlowQueries.mockResolvedValue(mockSlowQueries);

      const response = await request(app)
        .get('/api/admin/recommendations')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.recommendations.total).toBe(3);
      expect(response.body.recommendations.summary.criticalCount).toBe(2);
      expect(response.body.recommendations.summary.importantCount).toBe(1);
      expect(response.body.recommendations.categories.critical).toHaveLength(2);
    });

    it('should handle slow query analysis failures gracefully', async () => {
      mongoDBManager.isConnected.mockReturnValue(true);
      mongoDBManager.analyzeIndexHealth.mockResolvedValue(mockIndexHealth);
      mongoDBManager.analyzeSlowQueries.mockRejectedValue(new Error('Profiling disabled'));

      const response = await request(app)
        .get('/api/admin/recommendations')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.recommendations.total).toBe(2); // Only index recommendations
    });
  });
});
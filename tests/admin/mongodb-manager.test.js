const MongoDBManager = require('../../src/database/mongodb-manager');
const { MongoClient } = require('mongodb');

// Mock MongoDB client
jest.mock('mongodb');

describe('MongoDBManager Admin Tools', () => {
  let mongoDBManager;
  let mockClient;
  let mockDb;
  let mockAdminDb;
  let mockCollection;

  beforeEach(() => {
    // Reset MongoDB manager instance
    jest.clearAllMocks();
    
    mockCollection = {
      stats: jest.fn(),
      indexes: jest.fn().mockResolvedValue([{ name: '_id_', key: { _id: 1 } }]),
      find: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue([])
      }),
      findOne: jest.fn().mockResolvedValue({}),
      countDocuments: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([])
      })
    };

    mockAdminDb = {
      command: jest.fn().mockResolvedValue({ ok: 1 })
    };
    
    mockDb = {
      listCollections: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([
          { name: 'echotune_users' },
          { name: 'echotune_listening_history' }
        ])
      }),
      collection: jest.fn().mockReturnValue(mockCollection),
      admin: jest.fn().mockReturnValue(mockAdminDb),
      databaseName: 'echotune'
    };
    
    mockClient = {
      connect: jest.fn().mockResolvedValue(),
      close: jest.fn().mockResolvedValue(),
      db: jest.fn((name) => {
        if (name === 'admin') return mockAdminDb;
        return mockDb;
      }),
      on: jest.fn()
    };
    
    MongoClient.mockImplementation(() => mockClient);
    
    // Create a fresh instance for each test
    const MongoDBManagerClass = require('../../src/database/mongodb-manager').constructor;
    mongoDBManager = new MongoDBManagerClass();
    mongoDBManager.client = mockClient;
    mongoDBManager.db = mockDb;
    mongoDBManager._isConnected = true;
  });

  describe('getCollectionStats()', () => {
    it('should return comprehensive collection statistics', async () => {
      const mockCollections = [
        { name: 'echotune_users' },
        { name: 'echotune_listening_history' }
      ];
      
      const mockStats = {
        count: 1000,
        size: 1048576,
        storageSize: 2097152,
        totalIndexSize: 65536,
        avgObjSize: 1024
      };
      
      const mockIndexes = [
        { name: '_id_', key: { _id: 1 } },
        { name: 'email_1', key: { email: 1 }, unique: true }
      ];

      mockDb.listCollections.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockCollections)
      });
      mockCollection.stats.mockResolvedValue(mockStats);
      mockCollection.indexes.mockResolvedValue(mockIndexes);

      const result = await mongoDBManager.getCollectionStats();

      expect(result).toEqual({
        collections: expect.arrayContaining([
          expect.objectContaining({
            name: 'echotune_users',
            count: 1000,
            size: 1048576,
            storageSize: 2097152,
            totalIndexSize: 65536,
            avgObjSize: 1024,
            indexCount: 2,
            indexes: expect.arrayContaining([
              expect.objectContaining({
                name: '_id_',
                key: { _id: 1 }
              }),
              expect.objectContaining({
                name: 'email_1',
                key: { email: 1 },
                unique: true
              })
            ])
          })
        ]),
        totalCollections: 2,
        totalDocuments: 2000, // 1000 * 2 collections
        totalDataSize: 2097152, // 1048576 * 2 collections  
        totalIndexSize: 131072 // 65536 * 2 collections
      });
    });

    it('should handle collection stats errors gracefully', async () => {
      const mockCollections = [{ name: 'problematic_collection' }];
      
      mockDb.listCollections.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockCollections)
      });
      mockCollection.stats.mockRejectedValue(new Error('Access denied'));

      const result = await mongoDBManager.getCollectionStats();

      expect(result.collections[0]).toEqual({
        name: 'problematic_collection',
        error: 'Access denied',
        count: 0,
        size: 0,
        indexes: []
      });
    });

    it('should throw error when MongoDB is not connected', async () => {
      mongoDBManager._isConnected = false;

      await expect(mongoDBManager.getCollectionStats())
        .rejects.toThrow('MongoDB not connected');
    });
  });

  describe('analyzeIndexHealth()', () => {
    it('should analyze index usage and provide recommendations', async () => {
      const mockCollections = [{ name: 'echotune_users' }];
      const mockIndexes = [
        { name: '_id_', key: { _id: 1 } },
        { name: 'unused_index', key: { oldField: 1 } },
        { name: 'active_index', key: { email: 1 } }
      ];
      const mockIndexStats = [
        { name: '_id_', accesses: { ops: 100 } },
        { name: 'unused_index', accesses: { ops: 0 } },
        { name: 'active_index', accesses: { ops: 50 } }
      ];

      mockDb.listCollections.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockCollections)
      });
      mockCollection.indexes.mockResolvedValue(mockIndexes);
      mockCollection.aggregate.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockIndexStats)
      });

      const result = await mongoDBManager.analyzeIndexHealth();

      expect(result).toEqual({
        healthyIndexes: 2, // _id_ and active_index
        problematicIndexes: 0,
        unusedIndexes: 1, // unused_index
        recommendations: expect.arrayContaining([
          expect.objectContaining({
            type: 'unused_index',
            collection: 'echotune_users',
            index: 'unused_index',
            severity: 'medium',
            description: expect.stringContaining('never been used')
          })
        ])
      });
    });

    it('should check for missing recommended indexes', async () => {
      const mockCollections = [{ name: 'echotune_users' }];
      const mockIndexes = [{ name: '_id_', key: { _id: 1 } }]; // Missing recommended indexes
      const mockIndexStats = [{ name: '_id_', accesses: { ops: 100 } }];

      mockDb.listCollections.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockCollections)
      });
      mockCollection.indexes.mockResolvedValue(mockIndexes);
      mockCollection.aggregate.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockIndexStats)
      });

      const result = await mongoDBManager.analyzeIndexHealth();

      expect(result.recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'missing_index',
            collection: 'echotune_users',
            severity: 'high',
            reason: expect.stringContaining('Frequently queried')
          })
        ])
      );
    });
  });

  describe('analyzeSlowQueries()', () => {
    it('should analyze slow queries from profiler collection', async () => {
      const mockProfilingStatus = { was: 0 };
      const mockSlowQueries = [
        {
          ts: new Date(),
          millis: 250,
          ns: 'echotune.echotune_users',
          op: 'find',
          command: { find: 'users' },
          planSummary: 'COLLSCAN',
          docsExamined: 1000,
          docsReturned: 1
        }
      ];

      mockDb.admin().command
        .mockResolvedValueOnce(mockProfilingStatus) // Initial profiling status
        .mockResolvedValueOnce({ ok: 1 }) // Enable profiling
        .mockResolvedValueOnce({ ok: 1 }); // Disable profiling

      mockDb.collection.mockReturnValue({
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              toArray: jest.fn().mockResolvedValue(mockSlowQueries)
            })
          })
        })
      });

      const result = await mongoDBManager.analyzeSlowQueries({ threshold: 100, limit: 50 });

      expect(result).toEqual({
        threshold: 100,
        totalSlowQueries: 1,
        queries: [
          {
            timestamp: expect.any(Date),
            duration: 250,
            collection: 'echotune_users',
            operation: 'find',
            command: { find: 'users' },
            planSummary: 'COLLSCAN',
            docsExamined: 1000,
            docsReturned: 1,
            keysExamined: 0
          }
        ],
        recommendations: expect.arrayContaining([
          'Found 1 slow queries in the last 24 hours',
          'Consider adding indexes for frequently slow queries',
          'Review query patterns and optimize where possible'
        ])
      });
    });

    it('should handle profiling access errors gracefully', async () => {
      mockDb.admin().command.mockRejectedValue(new Error('Profiling not available'));

      const result = await mongoDBManager.analyzeSlowQueries();
      
      expect(result.error).toBe('Profiling not available');
      expect(result.queries).toEqual([]);
      expect(result.recommendations).toContain('MongoDB profiling is disabled or not accessible');
    });
  });

  describe('exportCollectionData()', () => {
    it('should export collection data with sanitization', async () => {
      const mockDocuments = [
        { _id: '1', name: 'John', email: 'john@example.com', password: 'secret123' },
        { _id: '2', name: 'Jane', email: 'jane@example.com', token: 'abc123' }
      ];

      mockDb.listCollections.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{ name: 'test_collection' }])
      });
      
      mockCollection.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue(mockDocuments)
      });
      mockCollection.countDocuments.mockResolvedValue(1000);

      const result = await mongoDBManager.exportCollectionData('test_collection', {
        limit: 100,
        sanitize: true,
        format: 'json'
      });

      expect(result.collection).toBe('test_collection');
      expect(result.count).toBe(2);
      expect(result.totalInCollection).toBe(1000);
      expect(result.format).toBe('json');
      
      // Check sanitization
      expect(result.data[0].password).toBe('[REDACTED]');
      expect(result.data[1].token).toBe('[REDACTED]');
      expect(result.data[0].name).toBe('John'); // Non-sensitive data preserved
    });

    it('should convert data to CSV format', async () => {
      const mockDocuments = [
        { _id: '1', name: 'John', age: 30 },
        { _id: '2', name: 'Jane', age: 25 }
      ];

      mockDb.listCollections.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{ name: 'test_collection' }])
      });
      
      mockCollection.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue(mockDocuments)
      });
      mockCollection.countDocuments.mockResolvedValue(2);

      const result = await mongoDBManager.exportCollectionData('test_collection', {
        format: 'csv',
        sanitize: false
      });

      expect(result.format).toBe('csv');
      expect(result.data).toContain('_id,name,age');
      expect(result.data).toContain('1,John,30');
      expect(result.data).toContain('2,Jane,25');
    });

    it('should handle export for non-existent collection gracefully', async () => {
      mockDb.listCollections.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]) // No collections found
      });

      const result = await mongoDBManager.exportCollectionData('nonexistent');
      
      expect(result.error).toBe("Collection 'nonexistent' not found");
      expect(result.count).toBe(0);
      expect(result.data).toEqual([]);
      expect(result.recommendations).toContain('Verify collection name spelling');
    });
  });

  describe('getDatabaseStats()', () => {
    it('should return comprehensive database statistics', async () => {
      const mockDbStats = {
        collections: 5,
        objects: 10000,
        avgObjSize: 1024,
        dataSize: 10485760,
        storageSize: 20971520,
        indexSize: 1048576,
        fileSize: 52428800
      };

      const mockServerStatus = {
        uptime: 86400,
        connections: {
          current: 10,
          available: 190,
          totalCreated: 100
        },
        opcounters: {
          insert: 1000,
          query: 5000,
          update: 500,
          delete: 100,
          getmore: 200,
          command: 10000
        },
        mem: {
          resident: 256,
          virtual: 512,
          mapped: 128
        }
      };

      mockDb.admin().command
        .mockResolvedValueOnce(mockDbStats)
        .mockResolvedValueOnce(mockServerStatus);

      const result = await mongoDBManager.getDatabaseStats();

      expect(result).toEqual({
        database: 'echotune',
        collections: 5,
        objects: 10000,
        avgObjSize: 1024,
        dataSize: 10485760,
        storageSize: 20971520,
        indexSize: 1048576,
        fileSize: 52428800,
        uptime: 86400,
        connections: {
          current: 10,
          available: 190,
          totalCreated: 100
        },
        operations: {
          insert: 1000,
          query: 5000,
          update: 500,
          delete: 100,
          getmore: 200,
          command: 10000
        },
        memory: {
          resident: 256,
          virtual: 512,
          mapped: 128
        }
      });
    });
  });

  describe('validateAdminAccess()', () => {
    it('should validate all admin permissions', async () => {
      mockDb.admin().command
        .mockResolvedValueOnce({ ok: 1 }) // ping
        .mockResolvedValueOnce({ ok: 1 }) // serverStatus
        .mockResolvedValueOnce({ was: 1 }); // profile check

      mockDb.listCollections.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{ name: 'test_collection' }])
      });
      mockCollection.indexes.mockResolvedValue([{ name: '_id_' }]);

      const result = await mongoDBManager.validateAdminAccess();

      expect(result.isValid).toBe(true);
      expect(result.permissions).toEqual({
        connection: true,
        readAccess: true,
        adminAccess: true,
        profilingAccess: true,
        indexAccess: true
      });
      expect(result.recommendations).toContain('Full access granted - all admin features available');
    });

    it('should handle limited permissions gracefully', async () => {
      mockDb.admin().command
        .mockResolvedValueOnce({ ok: 1 }) // ping succeeds
        .mockRejectedValueOnce(new Error('Access denied')); // serverStatus fails

      mockDb.listCollections.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([])
      });

      const result = await mongoDBManager.validateAdminAccess();

      expect(result.isValid).toBe(true); // Connection and read access still work
      expect(result.permissions.connection).toBe(true);
      expect(result.permissions.adminAccess).toBe(false);
      expect(result.recommendations).toContain('Limited admin access - some features may not be available');
    });
  });
});
#!/usr/bin/env node

/**
 * MongoDB MCP Server - EchoTune AI
 * Provides MongoDB database statistics and observability through Model Context Protocol
 * 
 * This is a scaffold implementation following MCP specifications
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { 
  CallToolRequestSchema, 
  ListToolsRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema
} = require('@modelcontextprotocol/sdk/types.js');

const { MongoClient } = require('mongodb');

// MCP Server implementation
const server = new Server(
  {
    name: 'mongodb-observability-server',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {},
      prompts: {},
      resources: {}
    }
  }
);

// MongoDB client instance
let mongoClient = null;
let database = null;

// Initialize MongoDB connection
async function initializeMongoClient() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/echotune';
  
  try {
    if (!mongoClient) {
      mongoClient = new MongoClient(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000
      });
      await mongoClient.connect();
      database = mongoClient.db();
    }
    return true;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    return false;
  }
}

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_database_stats',
        description: 'Get MongoDB database statistics and metrics',
        inputSchema: {
          type: 'object',
          properties: {
            database: {
              type: 'string',
              description: 'Database name (defaults to current database)'
            }
          }
        }
      },
      {
        name: 'get_collection_stats',
        description: 'Get statistics for all collections or a specific collection',
        inputSchema: {
          type: 'object',
          properties: {
            collection: {
              type: 'string',
              description: 'Collection name (optional, returns all if not specified)'
            }
          }
        }
      },
      {
        name: 'check_mongodb_health',
        description: 'Perform MongoDB health check with connection and performance tests',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'get_index_stats',
        description: 'Get index usage statistics for collections',
        inputSchema: {
          type: 'object',
          properties: {
            collection: {
              type: 'string',
              description: 'Collection name (optional, returns all if not specified)'
            }
          }
        }
      },
      {
        name: 'get_slow_operations',
        description: 'Get currently running slow operations',
        inputSchema: {
          type: 'object',
          properties: {
            threshold_ms: {
              type: 'number',
              description: 'Minimum operation duration in milliseconds',
              default: 1000
            }
          }
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    // Initialize MongoDB connection if needed
    const connected = await initializeMongoClient();
    if (!connected) {
      throw new Error('Cannot connect to MongoDB');
    }
    
    switch (name) {
      case 'get_database_stats': {
        const targetDb = args?.database ? mongoClient.db(args.database) : database;
        const stats = await getDatabaseStats(targetDb);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(stats, null, 2)
            }
          ]
        };
      }
      
      case 'get_collection_stats': {
        const collectionName = args?.collection;
        const stats = await getCollectionStats(database, collectionName);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(stats, null, 2)
            }
          ]
        };
      }
      
      case 'check_mongodb_health': {
        const health = await performMongoHealthCheck();
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(health, null, 2)
            }
          ]
        };
      }
      
      case 'get_index_stats': {
        const collectionName = args?.collection;
        const indexStats = await getIndexStats(database, collectionName);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(indexStats, null, 2)
            }
          ]
        };
      }
      
      case 'get_slow_operations': {
        const thresholdMs = args?.threshold_ms || 1000;
        const slowOps = await getSlowOperations(thresholdMs);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(slowOps, null, 2)
            }
          ]
        };
      }
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`
        }
      ],
      isError: true
    };
  }
});

// Utility functions
async function getDatabaseStats(db) {
  const stats = {
    timestamp: new Date().toISOString(),
    database: db.databaseName,
    collections: {},
    totals: {
      collections: 0,
      documents: 0,
      indexes: 0,
      dataSize: 0,
      storageSize: 0
    }
  };
  
  try {
    // Get database stats
    const dbStats = await db.stats();
    stats.totals = {
      collections: dbStats.collections || 0,
      documents: dbStats.objects || 0,
      indexes: dbStats.indexes || 0,
      dataSize: dbStats.dataSize || 0,
      storageSize: dbStats.storageSize || 0,
      avgObjSize: dbStats.avgObjSize || 0
    };
    
    // Get collection list
    const collections = await db.listCollections().toArray();
    
    for (const collection of collections) {
      const collectionStats = await db.collection(collection.name).stats();
      stats.collections[collection.name] = {
        documents: collectionStats.count || 0,
        size: collectionStats.size || 0,
        storageSize: collectionStats.storageSize || 0,
        indexes: collectionStats.nindexes || 0,
        avgObjSize: collectionStats.avgObjSize || 0
      };
    }
    
  } catch (error) {
    stats.error = error.message;
  }
  
  return stats;
}

async function getCollectionStats(db, collectionName) {
  const result = {
    timestamp: new Date().toISOString(),
    database: db.databaseName
  };
  
  try {
    if (collectionName) {
      // Get stats for specific collection
      const collection = db.collection(collectionName);
      const stats = await collection.stats();
      
      result.collection = collectionName;
      result.stats = {
        documents: stats.count || 0,
        size: stats.size || 0,
        storageSize: stats.storageSize || 0,
        indexes: stats.nindexes || 0,
        avgObjSize: stats.avgObjSize || 0,
        indexSizes: stats.indexSizes || {}
      };
      
      // Get sample documents
      const sampleDocs = await collection.find({}).limit(3).toArray();
      result.sampleDocuments = sampleDocs.map(doc => {
        const { _id, ...rest } = doc;
        return { _id, ...Object.keys(rest).slice(0, 5).reduce((obj, key) => ({ ...obj, [key]: rest[key] }), {}) };
      });
      
    } else {
      // Get stats for all collections
      const collections = await db.listCollections().toArray();
      result.collections = {};
      
      for (const collection of collections) {
        const stats = await db.collection(collection.name).stats();
        result.collections[collection.name] = {
          documents: stats.count || 0,
          size: stats.size || 0,
          storageSize: stats.storageSize || 0,
          indexes: stats.nindexes || 0
        };
      }
    }
    
  } catch (error) {
    result.error = error.message;
  }
  
  return result;
}

async function performMongoHealthCheck() {
  const health = {
    timestamp: new Date().toISOString(),
    status: 'unknown',
    checks: {}
  };
  
  try {
    if (!mongoClient) {
      health.status = 'disconnected';
      health.checks.connection = { status: 'fail', error: 'MongoDB client not initialized' };
      return health;
    }
    
    // Connection check with timing
    const pingStart = process.hrtime.bigint();
    await database.admin().ping();
    const pingEnd = process.hrtime.bigint();
    const pingLatency = Number(pingEnd - pingStart) / 1_000_000; // Convert to ms
    
    health.checks.ping = {
      status: 'pass',
      latency_ms: Math.round(pingLatency * 100) / 100
    };
    
    // Server status
    const serverStatus = await database.admin().serverStatus();
    health.checks.server = {
      status: 'pass',
      version: serverStatus.version,
      uptime_seconds: serverStatus.uptime,
      connections: {
        current: serverStatus.connections.current,
        available: serverStatus.connections.available,
        totalCreated: serverStatus.connections.totalCreated
      }
    };
    
    // Database stats
    const dbStats = await database.stats();
    health.checks.database = {
      status: 'pass',
      collections: dbStats.collections,
      objects: dbStats.objects,
      dataSize: dbStats.dataSize,
      storageSize: dbStats.storageSize
    };
    
    health.status = 'healthy';
    
  } catch (error) {
    health.status = 'unhealthy';
    health.checks.error = {
      status: 'fail',
      message: error.message
    };
  }
  
  return health;
}

async function getIndexStats(db, collectionName) {
  const result = {
    timestamp: new Date().toISOString(),
    database: db.databaseName
  };
  
  try {
    if (collectionName) {
      // Get index stats for specific collection
      const collection = db.collection(collectionName);
      const indexes = await collection.indexes();
      
      result.collection = collectionName;
      result.indexes = indexes.map(index => ({
        name: index.name,
        key: index.key,
        unique: index.unique || false,
        sparse: index.sparse || false,
        size: index.size || 'unknown'
      }));
      
      // Try to get index usage stats if available
      try {
        const indexStats = await collection.aggregate([{ $indexStats: {} }]).toArray();
        result.usage = indexStats;
      } catch (e) {
        // Index stats not available in all MongoDB versions
        result.usage_note = 'Index usage statistics not available';
      }
      
    } else {
      // Get index stats for all collections
      const collections = await db.listCollections().toArray();
      result.collections = {};
      
      for (const collectionInfo of collections) {
        const collection = db.collection(collectionInfo.name);
        const indexes = await collection.indexes();
        
        result.collections[collectionInfo.name] = {
          indexCount: indexes.length,
          indexes: indexes.map(index => ({
            name: index.name,
            key: index.key
          }))
        };
      }
    }
    
  } catch (error) {
    result.error = error.message;
  }
  
  return result;
}

async function getSlowOperations(thresholdMs) {
  const result = {
    timestamp: new Date().toISOString(),
    threshold_ms: thresholdMs,
    operations: []
  };
  
  try {
    // Get current operations
    const currentOps = await database.admin().command({ currentOp: true });
    
    if (currentOps.inprog) {
      const slowOps = currentOps.inprog.filter(op => {
        return op.secs_running && op.secs_running * 1000 >= thresholdMs;
      });
      
      result.operations = slowOps.map(op => ({
        opid: op.opid,
        operation: op.op,
        namespace: op.ns,
        duration_ms: op.secs_running * 1000,
        command: op.command ? JSON.stringify(op.command).substring(0, 200) : 'N/A'
      }));
    }
    
    result.count = result.operations.length;
    
  } catch (error) {
    result.error = error.message;
  }
  
  return result;
}

// Graceful cleanup
process.on('SIGTERM', async () => {
  if (mongoClient) {
    await mongoClient.close();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  if (mongoClient) {
    await mongoClient.close();
  }
  process.exit(0);
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception in MongoDB MCP server:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection in MongoDB MCP server:', reason);
  process.exit(1);
});

// Start server
const transport = new StdioServerTransport();
server.connect(transport).catch((error) => {
  console.error('Failed to start MongoDB MCP server:', error);
  process.exit(1);
});

console.error('MongoDB MCP Server started'); // Use stderr for logs to avoid interfering with MCP protocol
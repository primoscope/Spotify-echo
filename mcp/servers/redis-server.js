#!/usr/bin/env node

/**
 * Redis MCP Server - EchoTune AI
 * Provides Redis metrics and observability through Model Context Protocol
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

const { getRedisManager } = require('../../src/utils/redis');

// MCP Server implementation
const server = new Server(
  {
    name: 'redis-observability-server',
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

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_redis_info',
        description: 'Get Redis server information and stats',
        inputSchema: {
          type: 'object',
          properties: {
            section: {
              type: 'string',
              description: 'Redis INFO section (server, memory, stats, etc.)',
              default: 'all'
            }
          }
        }
      },
      {
        name: 'get_redis_metrics',
        description: 'Get Redis performance metrics',
        inputSchema: {
          type: 'object',
          properties: {
            format: {
              type: 'string',
              enum: ['json', 'prometheus'],
              default: 'json',
              description: 'Output format for metrics'
            }
          }
        }
      },
      {
        name: 'get_cache_stats',
        description: 'Get cache usage statistics for EchoTune AI',
        inputSchema: {
          type: 'object',
          properties: {
            namespace: {
              type: 'string',
              description: 'Cache namespace to analyze (optional)'
            }
          }
        }
      },
      {
        name: 'check_redis_health',
        description: 'Perform Redis health check with latency test',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    const redisManager = getRedisManager();
    
    switch (name) {
      case 'get_redis_info': {
        if (!redisManager || !redisManager.isConnected()) {
          throw new Error('Redis not connected');
        }
        
        const section = args?.section || 'all';
        const info = await redisManager.getClient().info(section);
        
        // Parse info into structured data
        const parsed = parseRedisInfo(info);
        
        return {
          content: [
            {
              type: 'text',
              text: `Redis Info (${section}):\n${JSON.stringify(parsed, null, 2)}`
            }
          ]
        };
      }
      
      case 'get_redis_metrics': {
        if (!redisManager || !redisManager.isConnected()) {
          throw new Error('Redis not connected');
        }
        
        const format = args?.format || 'json';
        const client = redisManager.getClient();
        
        // Get key metrics
        const info = await client.info('memory');
        const dbsize = await client.dbsize();
        const keyspace = await client.info('keyspace');
        
        const metrics = {
          timestamp: new Date().toISOString(),
          connection: {
            status: 'connected',
            uptime: await getRedisUptime(client)
          },
          memory: extractMemoryMetrics(info),
          keyspace: {
            total_keys: dbsize,
            databases: parseKeyspaceInfo(keyspace)
          },
          performance: await getPerformanceMetrics(client)
        };
        
        if (format === 'prometheus') {
          const prometheus = convertToPrometheus(metrics);
          return {
            content: [
              {
                type: 'text',
                text: prometheus
              }
            ]
          };
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(metrics, null, 2)
            }
          ]
        };
      }
      
      case 'get_cache_stats': {
        if (!redisManager || !redisManager.isConnected()) {
          throw new Error('Redis not connected');
        }
        
        const namespace = args?.namespace;
        const stats = await getEchoTuneCacheStats(redisManager, namespace);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(stats, null, 2)
            }
          ]
        };
      }
      
      case 'check_redis_health': {
        const health = await performHealthCheck(redisManager);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(health, null, 2)
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
function parseRedisInfo(infoString) {
  const lines = infoString.split('\r\n');
  const result = {};
  let currentSection = 'general';
  
  for (const line of lines) {
    if (line.startsWith('#')) {
      currentSection = line.substring(2).toLowerCase().trim();
      result[currentSection] = {};
    } else if (line.includes(':')) {
      const [key, value] = line.split(':');
      if (currentSection && key && value !== undefined) {
        result[currentSection][key] = isNaN(value) ? value : Number(value);
      }
    }
  }
  
  return result;
}

function extractMemoryMetrics(infoString) {
  const lines = infoString.split('\r\n');
  const memory = {};
  
  for (const line of lines) {
    if (line.includes(':')) {
      const [key, value] = line.split(':');
      if (key.startsWith('used_memory') || key.includes('memory')) {
        memory[key] = isNaN(value) ? value : Number(value);
      }
    }
  }
  
  return memory;
}

function parseKeyspaceInfo(infoString) {
  const lines = infoString.split('\r\n');
  const keyspace = {};
  
  for (const line of lines) {
    if (line.startsWith('db')) {
      const [db, stats] = line.split(':');
      keyspace[db] = {};
      
      const statsParts = stats.split(',');
      for (const part of statsParts) {
        const [key, value] = part.split('=');
        if (key && value) {
          keyspace[db][key] = isNaN(value) ? value : Number(value);
        }
      }
    }
  }
  
  return keyspace;
}

async function getRedisUptime(client) {
  try {
    const info = await client.info('server');
    const lines = info.split('\r\n');
    
    for (const line of lines) {
      if (line.startsWith('uptime_in_seconds:')) {
        return Number(line.split(':')[1]);
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

async function getPerformanceMetrics(client) {
  const start = process.hrtime.bigint();
  
  try {
    await client.ping();
    const end = process.hrtime.bigint();
    const latencyNs = Number(end - start);
    const latencyMs = latencyNs / 1_000_000;
    
    return {
      ping_latency_ms: Math.round(latencyMs * 100) / 100,
      status: 'healthy'
    };
  } catch (error) {
    return {
      ping_latency_ms: null,
      status: 'unhealthy',
      error: error.message
    };
  }
}

async function getEchoTuneCacheStats(redisManager, namespace) {
  const client = redisManager.getClient();
  const pattern = namespace ? `${namespace}:*` : '*';
  
  try {
    // Get keys matching pattern (limited to avoid blocking Redis)
    const keys = await client.keys(pattern);
    const sampleSize = Math.min(keys.length, 100); // Sample for performance
    const sampleKeys = keys.slice(0, sampleSize);
    
    const stats = {
      total_keys: keys.length,
      sampled_keys: sampleSize,
      namespace: namespace || 'all',
      categories: {}
    };
    
    // Categorize keys by prefix
    for (const key of sampleKeys) {
      const prefix = key.split(':')[0];
      if (!stats.categories[prefix]) {
        stats.categories[prefix] = { count: 0, sample_keys: [] };
      }
      stats.categories[prefix].count++;
      if (stats.categories[prefix].sample_keys.length < 5) {
        stats.categories[prefix].sample_keys.push(key);
      }
    }
    
    return stats;
  } catch (error) {
    return {
      error: error.message,
      namespace: namespace || 'all'
    };
  }
}

async function performHealthCheck(redisManager) {
  const health = {
    timestamp: new Date().toISOString(),
    status: 'unknown',
    checks: {}
  };
  
  try {
    if (!redisManager) {
      health.status = 'disconnected';
      health.checks.connection = { status: 'fail', error: 'Redis manager not initialized' };
      return health;
    }
    
    if (!redisManager.isConnected()) {
      health.status = 'disconnected';
      health.checks.connection = { status: 'fail', error: 'Redis not connected' };
      return health;
    }
    
    const client = redisManager.getClient();
    
    // Ping test with timing
    const pingStart = process.hrtime.bigint();
    await client.ping();
    const pingEnd = process.hrtime.bigint();
    const pingLatency = Number(pingEnd - pingStart) / 1_000_000; // Convert to ms
    
    health.checks.ping = {
      status: 'pass',
      latency_ms: Math.round(pingLatency * 100) / 100
    };
    
    // Memory check
    const info = await client.info('memory');
    const memoryUsed = extractMemoryMetrics(info).used_memory || 0;
    const memoryMB = Math.round(memoryUsed / 1024 / 1024 * 100) / 100;
    
    health.checks.memory = {
      status: 'pass',
      used_memory_mb: memoryMB
    };
    
    // Key count check
    const keyCount = await client.dbsize();
    health.checks.keyspace = {
      status: 'pass',
      total_keys: keyCount
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

function convertToPrometheus(metrics) {
  const lines = [
    '# HELP echotune_redis_memory_used_bytes Redis memory usage in bytes',
    '# TYPE echotune_redis_memory_used_bytes gauge',
    `echotune_redis_memory_used_bytes ${metrics.memory.used_memory || 0}`,
    '',
    '# HELP echotune_redis_keys_total Total number of keys in Redis',
    '# TYPE echotune_redis_keys_total gauge', 
    `echotune_redis_keys_total ${metrics.keyspace.total_keys || 0}`,
    '',
    '# HELP echotune_redis_ping_latency_ms Redis ping latency in milliseconds',
    '# TYPE echotune_redis_ping_latency_ms gauge',
    `echotune_redis_ping_latency_ms ${metrics.performance.ping_latency_ms || 0}`,
    ''
  ];
  
  return lines.join('\n');
}

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception in Redis MCP server:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection in Redis MCP server:', reason);
  process.exit(1);
});

// Start server
const transport = new StdioServerTransport();
server.connect(transport).catch((error) => {
  console.error('Failed to start Redis MCP server:', error);
  process.exit(1);
});

console.error('Redis MCP Server started'); // Use stderr for logs to avoid interfering with MCP protocol
#!/usr/bin/env node
/**
 * Perplexity MCP Server
 * Production-grade MCP server with stdio transport, performance budgets, and comprehensive validation
 * 
 * Features:
 * - Environment-gated operation (disabled when PERPLEXITY_API_KEY not provided)
 * - Performance budgets: p95 ≤ 1500ms latency, ≤ 256MB memory, ≤ 0.5 CPU cores
 * - Cost controls: $0.50 USD budget per research session
 * - Redis caching with 5-minute expiry
 * - Comprehensive error handling and validation
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} = require('@modelcontextprotocol/sdk/types.js');

class PerplexityMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'perplexity-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Environment configuration
    this.apiKey = process.env.PERPLEXITY_API_KEY;
    this.baseUrl = process.env.PERPLEXITY_BASE_URL || 'https://api.perplexity.ai';
    this.model = process.env.PERPLEXITY_MODEL || 'sonar-pro';
    
    // Performance budgets and limits
    this.performanceBudgets = {
      maxLatencyMs: parseInt(process.env.PERPLEXITY_MAX_LATENCY_MS || '1500', 10), // p95 ≤ 1500ms
      maxMemoryMB: parseInt(process.env.PERPLEXITY_MAX_MEMORY_MB || '256', 10),     // ≤ 256MB
      maxCPUCores: parseFloat(process.env.PERPLEXITY_MAX_CPU_CORES || '0.5'),      // ≤ 0.5 CPU cores
      costBudgetUSD: parseFloat(process.env.PERPLEXITY_COST_BUDGET_USD || '0.50'), // $0.50 USD per session
    };

    // Cost tracking
    this.sessionCosts = {
      current: 0.0,
      requests: 0,
      startTime: Date.now(),
    };

    // Performance tracking
    this.performanceMetrics = {
      requests: 0,
      totalLatency: 0,
      p95Latencies: [],
      errors: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
    
    // Cache configuration (Redis fallback to in-memory)
    this.cache = new Map();
    this.maxCacheSize = parseInt(process.env.PERPLEXITY_CACHE_SIZE || '100', 10);
    this.cacheExpiry = parseInt(process.env.PERPLEXITY_CACHE_EXPIRY_MS || '300000', 10); // 5 minutes
    this.redisClient = null;

    // Initialize Redis if available
    this.initializeRedis();
    
    this.setupToolHandlers();
  }

  async initializeRedis() {
    try {
      if (process.env.REDIS_URL || process.env.REDIS_HOST) {
        const redis = require('redis');
        this.redisClient = redis.createClient({
          url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
        });
        
        this.redisClient.on('error', (err) => {
          console.error('[Perplexity MCP] Redis error, falling back to memory cache:', err.message);
          this.redisClient = null;
        });
        
        await this.redisClient.connect();
        console.error('[Perplexity MCP] Redis cache initialized');
      }
    } catch (error) {
      console.error('[Perplexity MCP] Redis initialization failed, using memory cache:', error.message);
      this.redisClient = null;
    }
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      // If no API key, return empty tools list with helpful message
      if (!this.apiKey) {
        return {
          tools: [{
            name: 'unavailable',
            description: 'Perplexity MCP server is disabled. Set PERPLEXITY_API_KEY environment variable to enable research capabilities.',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          }],
        };
      }

      return {
        tools: [
          {
            name: 'research',
            description: 'Conduct AI-powered research with web search and citations (performance budgets: p95≤1500ms, ≤256MB memory, ≤$0.50/session)',
            inputSchema: {
              type: 'object',
              properties: {
                q: {
                  type: 'string',
                  description: 'Research query or question',
                },
                opts: {
                  type: 'object',
                  properties: {
                    model: {
                      type: 'string',
                      description: 'Perplexity model (sonar-large-128k-online, sonar-reasoning-pro, etc.)',
                      enum: ['sonar-pro', 'sonar', 'llama-3.1-sonar-small-128k-online', 'llama-3.1-sonar-large-128k-online'],
                    },
                    max_tokens: {
                      type: 'number',
                      description: 'Maximum tokens in response (default: 2000)',
                      minimum: 1,
                      maximum: 4096,
                    },
                    temperature: {
                      type: 'number',
                      description: 'Response temperature (default: 0.3)',
                      minimum: 0.0,
                      maximum: 1.0,
                    },
                    recency_filter: {
                      type: 'string',
                      description: 'Search recency filter',
                      enum: ['hour', 'day', 'week', 'month', 'year'],
                    },
                    domain_filter: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Domains to focus search on',
                    },
                  },
                  additionalProperties: false,
                },
              },
              required: ['q'],
            },
          },
          {
            name: 'health',
            description: 'Get Perplexity MCP server health metrics and performance budget status',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        if (name === 'unavailable') {
          throw new McpError(
            ErrorCode.InvalidRequest,
            'Perplexity MCP server is disabled. Set PERPLEXITY_API_KEY environment variable to enable research capabilities.'
          );
        } else if (name === 'research') {
          return await this.handleResearch(args);
        } else if (name === 'health') {
          return await this.handleHealth(args);
        } else {
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${name}`
          );
        }
      } catch (error) {
        this.performanceMetrics.errors++;
        
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Error executing tool ${name}: ${error.message}`
        );
      }
    });
  }

  async handleHealth() {
    const uptime = Date.now() - this.sessionCosts.startTime;
    const avgLatency = this.performanceMetrics.requests > 0 
      ? Math.round(this.performanceMetrics.totalLatency / this.performanceMetrics.requests)
      : 0;
    
    const p95Latency = this.calculateP95Latency();
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    
    const health = {
      status: this.apiKey ? 'healthy' : 'disabled',
      uptime: `${Math.round(uptime / 1000)}s`,
      performance: {
        requests: this.performanceMetrics.requests,
        errors: this.performanceMetrics.errors,
        avgLatency: `${avgLatency}ms`,
        p95Latency: `${p95Latency}ms`,
        budgetStatus: {
          latency: p95Latency <= this.performanceBudgets.maxLatencyMs ? 'PASS' : 'FAIL',
          memory: memoryUsageMB <= this.performanceBudgets.maxMemoryMB ? 'PASS' : 'FAIL',
        },
      },
      cache: {
        hits: this.performanceMetrics.cacheHits,
        misses: this.performanceMetrics.cacheMisses,
        hitRate: this.performanceMetrics.cacheMisses > 0 
          ? `${Math.round((this.performanceMetrics.cacheHits / (this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses)) * 100)}%`
          : 'N/A',
        backend: this.redisClient ? 'Redis' : 'Memory',
      },
      costs: {
        currentSession: `$${this.sessionCosts.current.toFixed(4)}`,
        budget: `$${this.performanceBudgets.costBudgetUSD.toFixed(2)}`,
        budgetUsed: `${Math.round((this.sessionCosts.current / this.performanceBudgets.costBudgetUSD) * 100)}%`,
        budgetStatus: this.sessionCosts.current <= this.performanceBudgets.costBudgetUSD ? 'PASS' : 'FAIL',
      },
      budgets: this.performanceBudgets,
      memoryUsage: {
        heapUsed: `${memoryUsageMB}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
      },
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(health, null, 2),
      }],
      meta: health,
    };
  }

  calculateP95Latency() {
    if (this.performanceMetrics.p95Latencies.length === 0) return 0;
    
    const sorted = [...this.performanceMetrics.p95Latencies].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * 0.95) - 1;
    return sorted[Math.max(0, index)];
  }

  async handleResearch(args) {
    const { q, opts = {} } = args;

    if (!this.apiKey) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'PERPLEXITY_API_KEY environment variable is required. Set this to enable research capabilities.'
      );
    }

    // Check cost budget
    if (this.sessionCosts.current >= this.performanceBudgets.costBudgetUSD) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Cost budget exceeded: $${this.sessionCosts.current.toFixed(4)} >= $${this.performanceBudgets.costBudgetUSD.toFixed(2)}. Research session limit reached.`
      );
    }

    // Validate input
    if (!q || q.trim().length === 0) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'Research query cannot be empty'
      );
    }

    if (q.length > 2000) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'Research query too long (max 2000 characters)'
      );
    }

    // Check cache first
    const cacheKey = `perplexity:${JSON.stringify({ q: q.trim(), opts })}`;
    const cached = await this.getCached(cacheKey);
    if (cached) {
      this.performanceMetrics.cacheHits++;
      return {
        content: [{
          type: 'text',
          text: `[CACHED - ${new Date(cached.timestamp).toLocaleTimeString()}] ${cached.data}`,
        }],
        meta: {
          cached: true,
          cacheTimestamp: cached.timestamp,
          budgetUsed: `$${this.sessionCosts.current.toFixed(4)}`,
        },
      };
    }

    this.performanceMetrics.cacheMisses++;
    const startTime = Date.now();
    
    try {
      // Estimate cost (rough approximation)
      const estimatedTokens = Math.max(opts.max_tokens || 2000, q.length / 3);
      const estimatedCost = (estimatedTokens / 1000) * 0.002; // Rough estimate: $0.002 per 1K tokens
      
      if (this.sessionCosts.current + estimatedCost > this.performanceBudgets.costBudgetUSD) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Estimated cost ($${estimatedCost.toFixed(4)}) would exceed remaining budget ($${(this.performanceBudgets.costBudgetUSD - this.sessionCosts.current).toFixed(4)})`
        );
      }

      const response = await this.makePerplexityRequest(q, opts);
      const duration = Date.now() - startTime;

      // Update performance metrics
      this.performanceMetrics.requests++;
      this.performanceMetrics.totalLatency += duration;
      this.performanceMetrics.p95Latencies.push(duration);
      
      // Keep only last 100 latencies for P95 calculation
      if (this.performanceMetrics.p95Latencies.length > 100) {
        this.performanceMetrics.p95Latencies.shift();
      }

      // Update cost tracking
      this.sessionCosts.current += estimatedCost;
      this.sessionCosts.requests++;

      // Check performance budget
      const p95Latency = this.calculateP95Latency();
      const budgetWarnings = [];
      
      if (p95Latency > this.performanceBudgets.maxLatencyMs) {
        budgetWarnings.push(`P95 latency ${p95Latency}ms exceeds budget ${this.performanceBudgets.maxLatencyMs}ms`);
      }
      
      const memoryUsageMB = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
      if (memoryUsageMB > this.performanceBudgets.maxMemoryMB) {
        budgetWarnings.push(`Memory usage ${memoryUsageMB}MB exceeds budget ${this.performanceBudgets.maxMemoryMB}MB`);
      }

      // Cache the response
      await this.setCached(cacheKey, response);

      const result = {
        content: [{
          type: 'text',
          text: response,
        }],
        isError: false,
        meta: {
          duration: `${duration}ms`,
          model: opts.model || this.model,
          cached: false,
          performance: {
            p95Latency: `${p95Latency}ms`,
            memoryUsage: `${memoryUsageMB}MB`,
            budgetWarnings: budgetWarnings.length > 0 ? budgetWarnings : null,
          },
          costs: {
            estimated: `$${estimatedCost.toFixed(4)}`,
            sessionTotal: `$${this.sessionCosts.current.toFixed(4)}`,
            budgetRemaining: `$${(this.performanceBudgets.costBudgetUSD - this.sessionCosts.current).toFixed(4)}`,
          },
          timestamp: new Date().toISOString(),
        },
      };

      // Add warnings to response if budget issues
      if (budgetWarnings.length > 0) {
        result.content[0].text = `⚠️ PERFORMANCE BUDGET WARNINGS:\n${budgetWarnings.join('\n')}\n\n${result.content[0].text}`;
      }

      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.performanceMetrics.errors++;
      
      return {
        content: [{
          type: 'text',
          text: `❌ Research failed: ${error.message}`,
        }],
        isError: true,
        meta: {
          duration: `${duration}ms`,
          error: error.message,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  async makePerplexityRequest(query, opts = {}) {
    const url = `${this.baseUrl}/chat/completions`;
    
    const requestBody = {
      model: opts.model || this.model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful research assistant. Provide accurate, well-researched answers with proper citations and sources. Focus on recent, authoritative information.',
        },
        {
          role: 'user',
          content: query,
        },
      ],
      max_tokens: Math.min(opts.max_tokens || 2000, 4096),
      temperature: Math.max(0.0, Math.min(1.0, opts.temperature || 0.3)),
      top_p: 0.9,
      return_citations: true,
      search_domain_filter: Array.isArray(opts.domain_filter) ? opts.domain_filter : undefined,
      return_images: false,
      return_related_questions: false,
      search_recency_filter: opts.recency_filter || 'month',
      top_k: 0,
      stream: false,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, this.performanceBudgets.maxLatencyMs + 1000); // Add 1s buffer to latency budget

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'EchoTuneAI-PerplexityMCP/1.0',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        
        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = response.headers.get('retry-after');
          throw new Error(`Rate limited. Retry after ${retryAfter} seconds. Consider reducing request frequency.`);
        }
        
        // Handle authentication errors
        if (response.status === 401) {
          throw new Error('Invalid API key. Check PERPLEXITY_API_KEY environment variable.');
        }
        
        // Handle quota exceeded
        if (response.status === 402) {
          throw new Error('API quota exceeded. Check your Perplexity account billing.');
        }
        
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response choices from Perplexity API');
      }

      const result = data.choices[0].message?.content;
      if (!result) {
        throw new Error('Empty content in API response');
      }
      
      // Process and format citations
      const citations = data.citations || [];
      let formattedResult = result;
      
      if (citations.length > 0) {
        const citationText = citations
          .filter(citation => citation.title && citation.url)
          .map((citation, index) => `[${index + 1}] ${citation.title} - ${citation.url}`)
          .join('\n');
        
        if (citationText) {
          formattedResult = `${result}\n\n📚 **Sources:**\n${citationText}`;
        }
      }

      // Add usage statistics if available
      if (data.usage) {
        const usage = data.usage;
        formattedResult += `\n\n📊 **Token Usage:** ${usage.prompt_tokens || 0} prompt + ${usage.completion_tokens || 0} completion = ${usage.total_tokens || 0} total`;
      }

      return formattedResult;
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout: exceeded ${this.performanceBudgets.maxLatencyMs}ms latency budget`);
      }
      
      throw error;
    }
  }

  async getCached(key) {
    try {
      if (this.redisClient) {
        const cached = await this.redisClient.get(key);
        if (cached) {
          const parsedCache = JSON.parse(cached);
          if (Date.now() - parsedCache.timestamp < this.cacheExpiry) {
            return parsedCache;
          } else {
            await this.redisClient.del(key);
          }
        }
        return null;
      }
    } catch (error) {
      console.error('[Perplexity MCP] Redis cache read error:', error.message);
    }

    // Fallback to memory cache
    const cached = this.cache.get(key);
    if (!cached) return null;

    const { data, timestamp } = cached;
    if (Date.now() - timestamp > this.cacheExpiry) {
      this.cache.delete(key);
      return null;
    }

    return { data, timestamp };
  }

  async setCached(key, data) {
    const cacheEntry = {
      data,
      timestamp: Date.now(),
    };

    try {
      if (this.redisClient) {
        await this.redisClient.setEx(
          key, 
          Math.floor(this.cacheExpiry / 1000), 
          JSON.stringify(cacheEntry)
        );
        return;
      }
    } catch (error) {
      console.error('[Perplexity MCP] Redis cache write error:', error.message);
    }

    // Fallback to memory cache with size management
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, cacheEntry);
  }

  async shutdown() {
    try {
      if (this.redisClient) {
        await this.redisClient.quit();
        console.error('[Perplexity MCP] Redis connection closed');
      }
    } catch (error) {
      console.error('[Perplexity MCP] Error during shutdown:', error.message);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.error('[Perplexity MCP] Received SIGINT, shutting down gracefully...');
      await this.shutdown();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.error('[Perplexity MCP] Received SIGTERM, shutting down gracefully...');
      await this.shutdown();
      process.exit(0);
    });

    await this.server.connect(transport);
    
    if (!this.apiKey) {
      console.error('[Perplexity MCP] Server running on stdio (DISABLED: PERPLEXITY_API_KEY not set)');
      console.error('[Perplexity MCP] Set PERPLEXITY_API_KEY environment variable to enable research capabilities');
    } else {
      console.error('[Perplexity MCP] Server running on stdio with research capabilities enabled');
      console.error(`[Perplexity MCP] Performance budgets: p95≤${this.performanceBudgets.maxLatencyMs}ms, ≤${this.performanceBudgets.maxMemoryMB}MB, ≤$${this.performanceBudgets.costBudgetUSD}/session`);
      console.error(`[Perplexity MCP] Cache backend: ${this.redisClient ? 'Redis' : 'Memory'}`);
    }
  }
}

// Global fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// Run server if called directly
if (require.main === module) {
  const server = new PerplexityMCPServer();
  server.run().catch((error) => {
    console.error('Failed to run server:', error);
    process.exit(1);
  });
}

module.exports = PerplexityMCPServer;
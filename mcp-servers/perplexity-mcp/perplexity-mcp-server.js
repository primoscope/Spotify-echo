#!/usr/bin/env node
/**
 * Perplexity MCP Server
 * Minimal MCP server with stdio transport for Perplexity API integration
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
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.apiKey = process.env.PERPLEXITY_API_KEY;
    this.baseUrl = process.env.PERPLEXITY_BASE_URL || 'https://api.perplexity.ai';
    this.model = process.env.PERPLEXITY_MODEL || 'llama-3.1-sonar-small-128k-online';
    
    // Simple in-memory cache (fallback if Redis not available)
    this.cache = new Map();
    this.maxCacheSize = 100;
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'query',
            description: 'Query Perplexity AI for research and information',
            inputSchema: {
              type: 'object',
              properties: {
                q: {
                  type: 'string',
                  description: 'Query string for research',
                },
                opts: {
                  type: 'object',
                  properties: {
                    model: {
                      type: 'string',
                      description: 'Perplexity model to use (optional)',
                    },
                    max_tokens: {
                      type: 'number',
                      description: 'Maximum tokens in response (optional)',
                    },
                    temperature: {
                      type: 'number',
                      description: 'Response temperature (optional)',
                    },
                  },
                  additionalProperties: false,
                },
              },
              required: ['q'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        if (name === 'query') {
          return await this.handleQuery(args);
        } else {
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${name}`
          );
        }
      } catch (error) {
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

  async handleQuery(args) {
    const { q, opts = {} } = args;

    if (!this.apiKey) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'PERPLEXITY_API_KEY environment variable is required'
      );
    }

    // Check cache first
    const cacheKey = JSON.stringify({ q, opts });
    const cached = this.getCached(cacheKey);
    if (cached) {
      return {
        content: [
          {
            type: 'text',
            text: `[CACHED] ${cached}`,
          },
        ],
      };
    }

    const startTime = Date.now();
    
    try {
      const response = await this.makePerplexityRequest(q, opts);
      const duration = Date.now() - startTime;

      // Cache the response
      this.setCached(cacheKey, response);

      return {
        content: [
          {
            type: 'text',
            text: response,
          },
        ],
        isError: false,
        meta: {
          duration,
          model: opts.model || this.model,
          cached: false,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        content: [
          {
            type: 'text',
            text: `Error querying Perplexity: ${error.message}`,
          },
        ],
        isError: true,
        meta: {
          duration,
          error: error.message,
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
          content: 'You are a helpful research assistant. Provide accurate, well-researched answers with citations when possible.',
        },
        {
          role: 'user',
          content: query,
        },
      ],
      max_tokens: opts.max_tokens || 4096,
      temperature: opts.temperature || 0.2,
      top_p: 0.9,
      return_citations: true,
      search_domain_filter: opts.domain_filter || undefined,
      return_images: false,
      return_related_questions: false,
      search_recency_filter: opts.recency_filter || 'month',
      top_k: 0,
      stream: false,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from Perplexity API');
    }

    const result = data.choices[0].message.content;
    
    // Add citations if available
    const citations = data.citations || [];
    if (citations.length > 0) {
      const citationText = citations.map((citation, index) => 
        `[${index + 1}] ${citation.title}: ${citation.url}`
      ).join('\n');
      
      return `${result}\n\n**Citations:**\n${citationText}`;
    }

    return result;
  }

  getCached(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const { data, timestamp } = cached;
    if (Date.now() - timestamp > this.cacheExpiry) {
      this.cache.delete(key);
      return null;
    }

    return data;
  }

  setCached(key, data) {
    // Simple cache size management
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Perplexity MCP Server running on stdio');
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
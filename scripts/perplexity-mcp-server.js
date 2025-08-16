#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

class PerplexityMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'perplexity-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'search_perplexity',
          description: 'Search using Perplexity API with citation support',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query'
              },
              model: {
                type: 'string',
                enum: ['sonar-pro', 'sonar-small', 'grok-4', 'claude-4-sonnet'],
                description: 'Model to use for search'
              },
              return_citations: {
                type: 'boolean',
                default: true,
                description: 'Include citations in response'
              }
            },
            required: ['query']
          }
        },
        {
          name: 'research_topic',
          description: 'Conduct comprehensive research on a topic',
          inputSchema: {
            type: 'object',
            properties: {
              topic: {
                type: 'string',
                description: 'Research topic'
              },
              depth: {
                type: 'string',
                enum: ['basic', 'comprehensive', 'expert'],
                default: 'comprehensive'
              },
              time_filter: {
                type: 'string',
                enum: ['day', 'week', 'month', 'year', 'all'],
                default: 'month'
              }
            },
            required: ['topic']
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'search_perplexity':
          return await this.searchPerplexity(args);
        case 'research_topic':
          return await this.researchTopic(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  async searchPerplexity(args) {
    try {
      const { query, model = 'sonar-pro', return_citations = true } = args;

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [{
            role: 'user',
            content: query
          }],
          return_citations,
          return_images: false
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            content: result.choices?.[0]?.message?.content,
            citations: result.citations || [],
            model_used: model,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error searching Perplexity: ${error.message}`
        }],
        isError: true
      };
    }
  }

  async researchTopic(args) {
    try {
      const { topic, depth = 'comprehensive', time_filter = 'month' } = args;
      
      const searches = [
        `${topic} overview and introduction`,
        `${topic} recent developments ${time_filter}`,
        `${topic} best practices and standards`,
        `${topic} tools and technologies`
      ];

      const results = await Promise.allSettled(
        searches.map(query => this.searchPerplexity({ 
          query, 
          model: 'sonar-pro', 
          return_citations: true 
        }))
      );

      const successfulResults = results
        .filter(result => result.status === 'fulfilled')
        .map(result => JSON.parse(result.value.content[0].text));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            topic,
            depth,
            research_results: successfulResults,
            summary: this.generateResearchSummary(successfulResults),
            conducted_at: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error conducting research: ${error.message}`
        }],
        isError: true
      };
    }
  }

  generateResearchSummary(results) {
    return {
      total_sources: results.reduce((sum, r) => sum + (r.citations?.length || 0), 0),
      key_findings: results.map(r => (r.content || '').substring(0, 200) + '...'),
      research_quality: results.length >= 3 ? 'comprehensive' : 'basic'
    };
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Server Error]:', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

if (require.main === module) {
  const server = new PerplexityMCPServer();
  server.run().catch(console.error);
}

module.exports = PerplexityMCPServer;
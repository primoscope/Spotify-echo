#!/usr/bin/env node

/**
 * Perplexity MCP Server
 * 
 * MCP server for Perplexity API research integration with Grok-like capabilities,
 * web search, and advanced AI analysis.
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const https = require('https');

class PerplexityMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'perplexity-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    
    this.apiKey = process.env.PERPLEXITY_API_KEY;
    this.baseUrl = 'https://api.perplexity.ai';
    this.setupHandlers();
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'perplexity_search',
            description: 'Search and get answers using Perplexity AI with web search capabilities',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'The search query or question',
                },
                model: {
                  type: 'string',
                  description: 'Model to use (sonar-pro, sonar-online)',
                  default: 'sonar-pro',
                },
                max_tokens: {
                  type: 'number',
                  description: 'Maximum tokens in response',
                  default: 200,
                },
                temperature: {
                  type: 'number',
                  description: 'Temperature for response generation',
                  default: 0.2,
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'perplexity_analyze_code',
            description: 'Analyze code using Perplexity AI with advanced analytical capabilities',
            inputSchema: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'The code to analyze',
                },
                language: {
                  type: 'string',
                  description: 'Programming language',
                  default: 'javascript',
                },
                analysis_type: {
                  type: 'string',
                  description: 'Type of analysis (security, performance, architecture, bugs)',
                  default: 'general',
                },
              },
              required: ['code'],
            },
          },
          {
            name: 'perplexity_research_topic',
            description: 'Conduct deep research on a topic with web search and analysis',
            inputSchema: {
              type: 'object',
              properties: {
                topic: {
                  type: 'string',
                  description: 'The research topic',
                },
                depth: {
                  type: 'string',
                  description: 'Research depth (quick, standard, deep)',
                  default: 'standard',
                },
                include_citations: {
                  type: 'boolean',
                  description: 'Include source citations',
                  default: true,
                },
              },
              required: ['topic'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'perplexity_search':
          return await this.handlePerplexitySearch(args);
        case 'perplexity_analyze_code':
          return await this.handleCodeAnalysis(args);
        case 'perplexity_research_topic':
          return await this.handleTopicResearch(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  async handlePerplexitySearch(args) {
    try {
      const { query, model = 'sonar-pro', max_tokens = 200, temperature = 0.2 } = args;

      if (!this.apiKey) {
        throw new Error('PERPLEXITY_API_KEY not configured');
      }

      const response = await this.makePerplexityRequest(query, model, {
        max_tokens,
        temperature,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              query,
              model,
              response: response.choices[0].message.content,
              usage: response.usage,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async handleCodeAnalysis(args) {
    try {
      const { code, language = 'javascript', analysis_type = 'general' } = args;

      if (!this.apiKey) {
        throw new Error('PERPLEXITY_API_KEY not configured');
      }

      const analysisPrompt = `Analyze this ${language} code for ${analysis_type} issues and provide detailed insights:

\`\`\`${language}
${code}
\`\`\`

Provide:
1. Key findings
2. Recommendations
3. Best practices
4. Potential issues

Keep the analysis comprehensive but concise.`;

      const response = await this.makePerplexityRequest(analysisPrompt, 'sonar-pro', {
        max_tokens: 300,
        temperature: 0.1,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              code_sample: code.substring(0, 100) + '...',
              language,
              analysis_type,
              analysis: response.choices[0].message.content,
              usage: response.usage,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async handleTopicResearch(args) {
    try {
      const { topic, depth = 'standard', include_citations = true } = args;

      if (!this.apiKey) {
        throw new Error('PERPLEXITY_API_KEY not configured');
      }

      const maxTokens = depth === 'quick' ? 150 : depth === 'deep' ? 400 : 250;
      const model = depth === 'deep' ? 'sonar-online' : 'sonar-pro';

      let researchPrompt = `Conduct a ${depth} research analysis on: ${topic}`;
      
      if (include_citations) {
        researchPrompt += '\n\nPlease include relevant sources and citations where possible.';
      }

      if (depth === 'deep') {
        researchPrompt += '\n\nProvide comprehensive insights including current trends, latest developments, and expert opinions.';
      }

      const response = await this.makePerplexityRequest(researchPrompt, model, {
        max_tokens: maxTokens,
        temperature: 0.3,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              topic,
              depth,
              model_used: model,
              research_findings: response.choices[0].message.content,
              usage: response.usage,
              include_citations,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async makePerplexityRequest(query, model, options = {}) {
    const requestData = {
      model: model,
      messages: [
        {
          role: 'user',
          content: query,
        },
      ],
      max_tokens: options.max_tokens || 200,
      temperature: options.temperature || 0.2,
    };

    const postData = JSON.stringify(requestData);

    return new Promise((resolve, reject) => {
      const requestOptions = {
        hostname: 'api.perplexity.ai',
        port: 443,
        path: '/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const req = https.request(requestOptions, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            
            if (res.statusCode === 200) {
              resolve(response);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${response.error?.message || data}`));
            }
          } catch (error) {
            reject(new Error(`Response parsing failed: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });

      req.write(postData);
      req.end();
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Perplexity MCP Server running on stdio');
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  const server = new PerplexityMCPServer();
  server.run().catch(console.error);
}

module.exports = PerplexityMCPServer;
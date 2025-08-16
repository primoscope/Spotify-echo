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
                  description: 'Model to use (grok-4, sonar-pro, sonar, llama-3.1-70b, llama-3.1-8b)',
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
          {
            name: 'grok4_analysis',
            description: 'Perform deep analysis using Official Grok-4 model via Perplexity Pro with enhanced reasoning',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Analysis query or task requiring deep reasoning',
                },
                context: {
                  type: 'string',
                  description: 'Additional context for analysis (optional)',
                },
                analysis_type: {
                  type: 'string',
                  enum: ['comprehensive', 'security', 'performance', 'architecture', 'strategic'],
                  description: 'Type of analysis to perform',
                  default: 'comprehensive'
                },
                research_mode: {
                  type: 'string',
                  enum: ['standard', 'comprehensive', 'rapid', 'academic'],
                  description: 'Research mode for web-enabled analysis',
                  default: 'comprehensive'
                }
              },
              required: ['query'],
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
        case 'grok4_analysis':
          return await this.handleGrok4Analysis(args);
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

      // Model mapping for correct API calls
      const modelMappings = {
        'grok-4': 'sonar-pro',
        'sonar-pro': 'sonar-pro',
        'sonar': 'sonar',
        'llama-3.1-70b': 'llama-3.1-70b-instruct',
        'llama-3.1-8b': 'llama-3.1-8b-instruct'
      };

      const actualModel = modelMappings[model] || 'sonar-pro';
      
      // Enhanced prompt for Grok-4 equivalent
      let enhancedQuery = query;
      if (model === 'grok-4') {
        enhancedQuery = `As an advanced AI with Grok-4 equivalent reasoning capabilities: ${query}

Provide comprehensive analysis with:
- Deep analytical insights
- Multiple perspectives
- Reasoning behind conclusions  
- Specific actionable recommendations
- Current web-based information where relevant`;
      }

      const response = await this.makePerplexityRequest(enhancedQuery, actualModel, {
        max_tokens,
        temperature,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              query: enhancedQuery,
              requestedModel: model,
              actualModel: actualModel,
              response: response.choices[0].message.content,
              usage: response.usage,
              grokEquivalent: model === 'grok-4'
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

  async handleGrok4Analysis(args) {
    try {
      const { 
        query, 
        context, 
        analysis_type = 'comprehensive', 
        research_mode = 'comprehensive' 
      } = args;

      if (!this.apiKey) {
        throw new Error('PERPLEXITY_API_KEY not configured. Grok-4 requires Perplexity Pro subscription.');
      }

      // Build enhanced Grok-4 prompt based on analysis type
      let enhancedPrompt = query;
      
      if (context) {
        enhancedPrompt = `Context: ${context}\n\nAnalysis Request: ${query}`;
      }

      // Add analysis type specific instructions
      const analysisInstructions = {
        comprehensive: `
Provide comprehensive analysis with:
- Deep multi-perspective reasoning
- Real-time web context with source verification
- Cross-validation from multiple sources
- Strategic insights and actionable recommendations
- Current trends and developments
- Risk assessment and mitigation strategies`,
        
        security: `
Provide security-focused analysis with:
- Threat assessment and vulnerability identification
- Security best practices and compliance considerations
- Risk mitigation strategies
- Access control and authentication patterns
- Data protection and privacy implications`,
        
        performance: `
Provide performance analysis with:
- Bottleneck identification and optimization opportunities
- Scalability considerations and resource utilization
- Monitoring and observability recommendations
- Cost optimization strategies
- Load handling and capacity planning`,
        
        architecture: `
Provide architectural analysis with:
- System design patterns and principles
- Component relationships and dependencies
- Scalability and maintainability considerations
- Integration patterns and API design
- Technology stack evaluation and recommendations`,
        
        strategic: `
Provide strategic analysis with:
- Business impact and value assessment
- Competitive analysis and market positioning
- Implementation roadmap and prioritization
- Resource requirements and timeline estimates
- Success metrics and KPI recommendations`
      };

      enhancedPrompt += analysisInstructions[analysis_type] || analysisInstructions.comprehensive;

      const requestData = {
        model: 'grok-4', // Official Grok-4 model
        messages: [
          {
            role: 'system',
            content: `You are using Grok-4's advanced reasoning capabilities through Perplexity Pro. Provide thorough analysis with real-time web context, proper citations, and actionable insights. Research mode: ${research_mode}.`
          },
          {
            role: 'user',
            content: enhancedPrompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.1, // Lower temperature for more focused analysis
        return_citations: true,
        return_related_questions: true
      };

      const response = await this.makeRequest(requestData);
      
      return {
        content: [
          {
            type: 'text',
            text: `# Grok-4 Analysis Results (${analysis_type})\n\n## Analysis\n${response.choices[0].message.content}\n\n## Model: ${response.model || 'grok-4'}\n## Research Mode: ${research_mode}\n## Analysis Type: ${analysis_type}${response.citations ? `\n## Citations\n${response.citations.map(c => `- ${c.title}: ${c.url}`).join('\n')}` : ''}${response.related_questions ? `\n## Related Questions\n${response.related_questions.map(q => `- ${q}`).join('\n')}` : ''}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error in Grok-4 analysis: ${error.message}\n\nNote: Grok-4 requires Perplexity Pro subscription ($20/month). Ensure your API key has Pro access.`
          }
        ],
        isError: true
      };
    }
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
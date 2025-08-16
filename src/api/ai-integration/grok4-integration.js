/**
 * Grok-4 Advanced Integration for Cursor AI
 * 
 * Features:
 * - Grok-4 and Grok-4 Heavy tier access
 * - Native tool use for code interpretation and web browsing
 * - Multi-agent reasoning chains
 * - Automated debugging workflows with web research
 * - Performance optimization recommendations
 */

const axios = require('axios');
const { CursorSonarIntegration } = require('./perplexity-sonar-pro');
const logger = require('../utils/logger');

class GrokClient {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.OPENROUTER_API_KEY;
    this.baseURL = 'https://openrouter.ai/api/v1';
    this.defaultModel = 'xai/grok-4';
    this.heavyModel = 'xai/grok-4-heavy';
    this.maxTokens = options.maxTokens || 4000;
    this.temperature = options.temperature || 0.7;
    
    // Initialize Perplexity integration for research
    this.perplexityClient = new CursorSonarIntegration(process.env.PERPLEXITY_API_KEY);
    
    // Rate limiting
    this.rateLimiter = {
      requests: 0,
      resetTime: Date.now() + 60000,
      maxRequests: 30 // Per minute
    };
  }

  checkRateLimit() {
    const now = Date.now();
    
    if (now > this.rateLimiter.resetTime) {
      this.rateLimiter.requests = 0;
      this.rateLimiter.resetTime = now + 60000;
    }
    
    if (this.rateLimiter.requests >= this.rateLimiter.maxRequests) {
      throw new Error('Grok-4 rate limit exceeded. Please wait before making more requests.');
    }
    
    this.rateLimiter.requests++;
  }

  /**
   * Main chat completion with tool use
   */
  async chat(options = {}) {
    const {
      messages,
      model = this.defaultModel,
      tools = [],
      temperature = this.temperature,
      maxTokens = this.maxTokens,
      useHeavy = false
    } = options;

    this.checkRateLimit();

    const selectedModel = useHeavy ? this.heavyModel : model;
    
    try {
      const requestBody = {
        model: selectedModel,
        messages,
        max_tokens: maxTokens,
        temperature,
        top_p: 0.9,
        frequency_penalty: 0,
        presence_penalty: 0
      };

      // Add tools if specified
      if (tools.length > 0) {
        requestBody.tools = this.formatTools(tools);
        requestBody.tool_choice = 'auto';
      }

      logger.info(`Grok-4 request: Model=${selectedModel}, Tools=${tools.length}`);

      const response = await axios.post(`${this.baseURL}/chat/completions`, requestBody, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://cursor.sh',
          'X-Title': 'EchoTune AI Cursor Integration'
        },
        timeout: 60000
      });

      return this.processResponse(response.data, tools);

    } catch (error) {
      logger.error('Grok-4 API error:', error.message);
      
      if (error.response?.status === 429) {
        throw new Error('Grok-4 rate limit exceeded. Please wait before retrying.');
      }
      
      if (error.response?.status === 401) {
        throw new Error('Invalid OpenRouter API key for Grok-4 access.');
      }
      
      throw new Error(`Grok-4 request failed: ${error.message}`);
    }
  }

  /**
   * Format tools for Grok-4 API
   */
  formatTools(tools) {
    const toolMap = {
      web_search: {
        type: 'function',
        function: {
          name: 'web_search',
          description: 'Search the web for current information',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query'
              },
              num_results: {
                type: 'integer',
                description: 'Number of results to return',
                default: 5
              }
            },
            required: ['query']
          }
        }
      },
      code_interpreter: {
        type: 'function',
        function: {
          name: 'code_interpreter',
          description: 'Execute code and analyze results',
          parameters: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description: 'Code to execute'
              },
              language: {
                type: 'string',
                description: 'Programming language',
                enum: ['python', 'javascript', 'bash', 'sql']
              }
            },
            required: ['code', 'language']
          }
        }
      },
      perplexity_research: {
        type: 'function',
        function: {
          name: 'perplexity_research',
          description: 'Deep research using Perplexity with citations',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Research query'
              },
              focus: {
                type: 'string',
                description: 'Research focus area',
                enum: ['security', 'performance', 'architecture', 'debugging', 'testing', 'general']
              }
            },
            required: ['query']
          }
        }
      }
    };

    return tools.map(tool => toolMap[tool]).filter(Boolean);
  }

  /**
   * Process API response and handle tool calls
   */
  async processResponse(response, enabledTools) {
    const choice = response.choices[0];
    const message = choice.message;

    let result = {
      content: message.content,
      toolCalls: [],
      finishReason: choice.finish_reason,
      usage: response.usage
    };

    // Handle tool calls
    if (message.tool_calls && message.tool_calls.length > 0) {
      for (const toolCall of message.tool_calls) {
        try {
          const toolResult = await this.executeTool(toolCall);
          result.toolCalls.push({
            id: toolCall.id,
            function: toolCall.function.name,
            arguments: JSON.parse(toolCall.function.arguments),
            result: toolResult
          });
        } catch (error) {
          logger.error(`Tool execution error: ${error.message}`);
          result.toolCalls.push({
            id: toolCall.id,
            function: toolCall.function.name,
            error: error.message
          });
        }
      }
    }

    return result;
  }

  /**
   * Execute tool functions
   */
  async executeTool(toolCall) {
    const functionName = toolCall.function.name;
    const args = JSON.parse(toolCall.function.arguments);

    switch (functionName) {
      case 'web_search':
        return await this.executeWebSearch(args);
      
      case 'code_interpreter':
        return await this.executeCode(args);
      
      case 'perplexity_research':
        return await this.executePerplexityResearch(args);
      
      default:
        throw new Error(`Unknown tool function: ${functionName}`);
    }
  }

  /**
   * Execute web search via Perplexity
   */
  async executeWebSearch(args) {
    const { query, num_results = 5 } = args;
    
    try {
      const result = await this.perplexityClient.search({
        query,
        maxResults: num_results,
        mode: 'json'
      });

      return {
        query,
        results: result.citations.slice(0, num_results),
        summary: result.content.substring(0, 500)
      };
    } catch (error) {
      throw new Error(`Web search failed: ${error.message}`);
    }
  }

  /**
   * Execute code interpretation
   */
  async executeCode(args) {
    const { code, language } = args;
    
    // For security, we'll return a structured analysis rather than executing
    return {
      language,
      code,
      analysis: this.analyzeCode(code, language),
      suggestions: this.getCodeSuggestions(code, language)
    };
  }

  /**
   * Execute Perplexity research
   */
  async executePerplexityResearch(args) {
    const { query, focus = 'general' } = args;
    
    try {
      const result = await this.perplexityClient.search({
        query,
        focus,
        mode: 'json',
        maxResults: 5
      });

      return {
        query,
        focus,
        summary: result.content,
        citations: result.citations,
        recommendations: this.perplexityClient.extractRecommendations(result.content)
      };
    } catch (error) {
      throw new Error(`Perplexity research failed: ${error.message}`);
    }
  }

  /**
   * Analyze code structure and patterns
   */
  analyzeCode(code, language) {
    const analysis = {
      language,
      lineCount: code.split('\n').length,
      complexity: 'unknown',
      patterns: [],
      issues: []
    };

    // Basic pattern detection
    if (language === 'javascript' || language === 'typescript') {
      if (code.includes('async') && code.includes('await')) {
        analysis.patterns.push('async/await');
      }
      if (code.includes('Promise')) {
        analysis.patterns.push('promises');
      }
      if (code.includes('class')) {
        analysis.patterns.push('classes');
      }
    }

    return analysis;
  }

  /**
   * Get code suggestions
   */
  getCodeSuggestions(code, language) {
    const suggestions = [];

    if (language === 'javascript') {
      if (code.includes('var ')) {
        suggestions.push('Consider using const/let instead of var');
      }
      if (code.includes('.then(') && code.includes('catch(')) {
        suggestions.push('Consider refactoring to async/await for better readability');
      }
    }

    return suggestions;
  }
}

/**
 * Cursor-specific Grok-4 integration
 */
class CursorGrokIntegration extends GrokClient {
  constructor(openrouterKey, perplexityKey) {
    super({
      apiKey: openrouterKey,
      maxTokens: 4000,
      temperature: 0.7
    });
  }

  /**
   * Analyze code with integrated web research
   */
  async analyzeWithResearch(code, context = '') {
    const messages = [
      {
        role: 'system',
        content: `You are an expert software architect and code reviewer. Analyze the provided code and use your tools to research current best practices, security considerations, and performance optimizations. Provide specific, actionable recommendations with citations.`
      },
      {
        role: 'user',
        content: `Analyze this code and research current best practices:

Code:
\`\`\`
${code}
\`\`\`

Context: ${context}

Please:
1. Use web search to find current best practices for this pattern
2. Research security considerations
3. Look for performance optimization opportunities
4. Provide specific recommendations with citations
`
      }
    ];

    return await this.chat({
      messages,
      tools: ['web_search', 'perplexity_research', 'code_interpreter'],
      temperature: 0.3
    });
  }

  /**
   * Architectural planning with Heavy tier
   */
  async architecturalPlanning(requirements, constraints = {}) {
    const messages = [
      {
        role: 'system',
        content: `You are a senior software architect. Design comprehensive system architecture based on requirements. Use web research to find current architectural patterns, technologies, and best practices for 2025.`
      },
      {
        role: 'user',
        content: `Plan architecture for: ${requirements}

Constraints: ${JSON.stringify(constraints, null, 2)}

Please research and recommend:
1. Architecture patterns suitable for these requirements
2. Technology stack recommendations
3. Scalability considerations
4. Security architecture
5. Performance optimization strategies

Use your research tools to find current best practices and provide citations.`
      }
    ];

    return await this.chat({
      messages,
      tools: ['web_search', 'perplexity_research'],
      useHeavy: true, // Use Heavy tier for complex planning
      temperature: 0.7,
      maxTokens: 6000
    });
  }

  /**
   * Multi-step debugging workflow
   */
  async debuggingWorkflow(error, codeContext, technology) {
    const messages = [
      {
        role: 'system',
        content: `You are an expert debugger. Help identify and resolve the error using systematic debugging approaches. Research current solutions and common fixes for this type of error.`
      },
      {
        role: 'user',
        content: `Debug this error systematically:

Error: ${error}
Technology: ${technology}
Code Context: ${codeContext}

Please:
1. Research common causes of this error
2. Identify likely root causes based on the context
3. Provide step-by-step debugging approach
4. Suggest specific fixes with code examples
5. Research if this is a known issue with recent solutions`
      }
    ];

    return await this.chat({
      messages,
      tools: ['web_search', 'perplexity_research', 'code_interpreter'],
      temperature: 0.2
    });
  }

  /**
   * Performance optimization recommendations
   */
  async optimizePerformance(codeSnippet, performanceMetrics, targetPlatform) {
    const messages = [
      {
        role: 'system',
        content: `You are a performance optimization expert. Analyze code and metrics to provide specific performance improvements. Research current optimization techniques and benchmarking standards.`
      },
      {
        role: 'user',
        content: `Optimize performance for:

Code:
\`\`\`
${codeSnippet}
\`\`\`

Current Metrics: ${JSON.stringify(performanceMetrics, null, 2)}
Target Platform: ${targetPlatform}

Please:
1. Research current performance benchmarks for this platform
2. Identify performance bottlenecks in the code
3. Provide specific optimization recommendations
4. Research latest optimization techniques and tools
5. Suggest performance monitoring approaches`
      }
    ];

    return await this.chat({
      messages,
      tools: ['web_search', 'perplexity_research', 'code_interpreter'],
      temperature: 0.3
    });
  }

  /**
   * Security analysis with current threat research
   */
  async securityAnalysis(codeSnippet, framework) {
    const messages = [
      {
        role: 'system',
        content: `You are a cybersecurity expert specializing in application security. Analyze code for vulnerabilities and research current security threats and best practices.`
      },
      {
        role: 'user',
        content: `Perform security analysis on:

Code:
\`\`\`
${codeSnippet}
\`\`\`

Framework: ${framework}

Please:
1. Research current security vulnerabilities for this framework
2. Identify potential security issues in the code
3. Research recent security patches and updates
4. Provide specific security recommendations
5. Suggest security testing approaches`
      }
    ];

    return await this.chat({
      messages,
      tools: ['web_search', 'perplexity_research'],
      temperature: 0.2
    });
  }

  /**
   * Multi-agent reasoning chain for complex problems
   */
  async multiAgentReasoning(problem, domain) {
    const agents = [
      {
        role: 'architect',
        prompt: `As a software architect, analyze the high-level design implications of: ${problem}`
      },
      {
        role: 'security_expert',
        prompt: `As a security expert, identify potential security considerations for: ${problem}`
      },
      {
        role: 'performance_expert',
        prompt: `As a performance expert, analyze performance implications of: ${problem}`
      }
    ];

    const results = [];

    for (const agent of agents) {
      const messages = [
        {
          role: 'system',
          content: `You are a ${agent.role} specializing in ${domain}. Provide expert analysis from your perspective. Use research tools to find current best practices and recommendations.`
        },
        {
          role: 'user',
          content: agent.prompt
        }
      ];

      const result = await this.chat({
        messages,
        tools: ['web_search', 'perplexity_research'],
        temperature: 0.6
      });

      results.push({
        agent: agent.role,
        analysis: result
      });
    }

    // Synthesize results
    const synthesisMessages = [
      {
        role: 'system',
        content: `You are a senior technical lead. Synthesize the expert analyses below into a comprehensive recommendation.`
      },
      {
        role: 'user',
        content: `Synthesize these expert analyses into actionable recommendations:

${results.map(r => `${r.agent.toUpperCase()} ANALYSIS:\n${r.analysis.content}\n`).join('\n')}

Provide a unified strategy that addresses all expert concerns.`
      }
    ];

    const synthesis = await this.chat({
      messages: synthesisMessages,
      useHeavy: true,
      temperature: 0.5
    });

    return {
      problem,
      domain,
      expertAnalyses: results,
      synthesis: synthesis.content,
      recommendations: this.extractRecommendations(synthesis.content)
    };
  }

  /**
   * Extract actionable recommendations
   */
  extractRecommendations(content) {
    const lines = content.split('\n');
    const recommendations = [];

    for (const line of lines) {
      if (line.match(/^\d+\./) || line.includes('recommend') || line.includes('should')) {
        recommendations.push(line.trim());
      }
    }

    return recommendations.slice(0, 10);
  }

  /**
   * Format results for Cursor integration
   */
  formatForCursor(grokResult) {
    return {
      content: grokResult.content,
      toolResults: grokResult.toolCalls || [],
      recommendations: this.extractRecommendations(grokResult.content),
      codeSnippets: this.extractCodeSnippets(grokResult.content),
      citations: this.extractCitations(grokResult.toolCalls || []),
      actionableItems: this.extractActionableItems(grokResult.content),
      timestamp: new Date().toISOString()
    };
  }

  extractCodeSnippets(content) {
    const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
    return codeBlocks.map(block => ({
      language: this.detectLanguage(block),
      code: block.replace(/```\w*\n?|\n?```/g, '').trim()
    }));
  }

  detectLanguage(codeBlock) {
    const langMatch = codeBlock.match(/```(\w+)/);
    return langMatch ? langMatch[1] : 'text';
  }

  extractCitations(toolCalls) {
    const citations = [];
    
    for (const toolCall of toolCalls) {
      if (toolCall.result && toolCall.result.citations) {
        citations.push(...toolCall.result.citations);
      }
    }
    
    return citations;
  }

  extractActionableItems(content) {
    const lines = content.split('\n');
    const actionable = [];

    for (const line of lines) {
      if (line.includes('TODO:') || line.includes('Action:') || line.includes('Next step:')) {
        actionable.push(line.trim());
      }
    }

    return actionable;
  }
}

module.exports = {
  GrokClient,
  CursorGrokIntegration
};
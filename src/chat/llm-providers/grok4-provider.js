const BaseLLMProvider = require('./base-provider');

/**
 * Grok-4 xAI Provider
 * Advanced reasoning and code analysis capabilities
 * Supports large context windows and multi-agent "Heavy" mode
 */
class Grok4Provider extends BaseLLMProvider {
  constructor(config) {
    super(config);
    this.baseURL = config.baseURL || 'https://api.x.ai/v1';
    this.openRouterURL = 'https://openrouter.ai/api/v1';
    this.useOpenRouter = config.useOpenRouter || false;
    this.defaultModel = config.model || 'grok-4';
    this.supportedModels = [
      'grok-4',
      'grok-4-heavy', // Multi-agent mode for complex tasks
      'grok-beta',
    ];
    this.apiKey = config.apiKey;
    this.openRouterKey = config.openRouterKey;
  }

  async initialize() {
    try {
      if (!this.apiKey && !this.openRouterKey) {
        throw new Error('Grok-4 API key (xAI direct or OpenRouter) not provided');
      }

      // Prefer xAI direct API if available, fallback to OpenRouter
      if (!this.apiKey && this.openRouterKey) {
        this.useOpenRouter = true;
        console.log('🔄 Using OpenRouter for Grok-4 access');
      }

      // Validate connection
      await this.validateConnection();
      
      this.isInitialized = true;
      console.log(`✅ Grok-4 provider initialized with model: ${this.defaultModel}`);
    } catch (error) {
      console.error('❌ Failed to initialize Grok-4 provider:', error.message);
      throw error;
    }
  }

  validateConfig() {
    return !!(this.apiKey || this.openRouterKey);
  }

  getCapabilities() {
    return {
      streaming: true,
      functionCalling: true,
      toolCalling: true, // Advanced tool integration
      codeAnalysis: true, // Key capability for repository analysis
      largeContext: true, // 256K+ tokens
      multiAgent: true, // Heavy mode support
      maxTokens: this.getMaxTokensForModel(this.defaultModel),
      supportedModels: this.supportedModels,
      features: ['chat', 'completion', 'streaming', 'code-analysis', 'reasoning', 'tool-calling'],
    };
  }

  getMaxTokensForModel(model) {
    const tokenLimits = {
      'grok-4': 256000,
      'grok-4-heavy': 256000, // Same context, enhanced reasoning
      'grok-beta': 128000,
    };
    return tokenLimits[model] || 256000;
  }

  async _generateCompletion(messages, options = {}) {
    const model = this.mapModelName(options.model || this.defaultModel);
    
    const requestBody = {
      model: model,
      messages: this.formatMessages(messages),
      max_tokens: options.maxTokens || 2000,
      temperature: options.temperature ?? 0.7,
      top_p: options.topP ?? 0.8,
      stream: options.stream || false,
    };

    // Add tool calling if specified
    if (options.tools) {
      requestBody.tools = options.tools;
      requestBody.tool_choice = options.tool_choice || 'auto';
    }

    // Heavy mode configuration for complex tasks
    if (model.includes('heavy') || options.multiAgent) {
      requestBody.reasoning_effort = 'high';
      requestBody.multi_agent = true;
    }

    const endpoint = this.useOpenRouter ? this.openRouterURL : this.baseURL;
    const headers = this.getHeaders();

    const response = await this.makeAPIRequest(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Grok-4 API error ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return this.parseGrok4Response(data);
  }

  parseGrok4Response(data) {
    const choice = data.choices?.[0];
    if (!choice) {
      throw new Error('Invalid response format from Grok-4 API');
    }

    return {
      content: choice.message?.content || '',
      role: 'assistant',
      model: data.model || this.defaultModel,
      usage: data.usage || {},
      tool_calls: choice.message?.tool_calls || [],
      metadata: {
        reasoning_time: data.reasoning_time,
        multi_agent_used: data.multi_agent_used,
        finish_reason: choice.finish_reason,
      },
    };
  }

  /**
   * Repository analysis using Grok-4's code understanding capabilities
   */
  async analyzeRepository(codeSnapshot, analysisType = 'comprehensive', options = {}) {
    const systemPrompt = this.getAnalysisPrompt(analysisType);
    
    const messages = [
      { role: 'system', content: systemPrompt },
      { 
        role: 'user', 
        content: `Analyze this codebase:\n\n${codeSnapshot}` 
      },
    ];

    const analysisOptions = {
      ...options,
      model: options.model || 'grok-4-heavy', // Use heavy mode for complex analysis
      maxTokens: options.maxTokens || 4000,
      multiAgent: true,
    };

    return this._generateCompletion(messages, analysisOptions);
  }

  /**
   * Code-specific reasoning and debugging
   */
  async debugCode(code, error, context = '', options = {}) {
    const debugPrompt = `
You are an expert code debugger. Analyze the following code and error:

Context: ${context}

Code:
\`\`\`
${code}
\`\`\`

Error:
${error}

Provide:
1. Root cause analysis
2. Step-by-step fix recommendations  
3. Potential side effects and considerations
4. Alternative approaches if applicable
5. Prevention strategies for similar issues
`;

    const messages = [
      { role: 'system', content: 'You are an expert software engineer and debugger.' },
      { role: 'user', content: debugPrompt },
    ];

    return this._generateCompletion(messages, {
      ...options,
      model: 'grok-4', // Standard model sufficient for debugging
    });
  }

  /**
   * Generate actionable development tasks from analysis
   */
  async generateTasks(analysisResult, priority = 'high', options = {}) {
    const taskPrompt = `
Based on this code analysis, generate a prioritized list of actionable development tasks:

Analysis:
${analysisResult}

Requirements:
- Focus on ${priority} priority items
- Provide specific, actionable steps
- Include time estimates
- Identify dependencies between tasks
- Consider risk levels

Format as a structured task list with priorities, estimates, and descriptions.
`;

    const messages = [
      { 
        role: 'system', 
        content: 'You are a technical project manager creating actionable development tasks.' 
      },
      { role: 'user', content: taskPrompt },
    ];

    return this._generateCompletion(messages, options);
  }

  getAnalysisPrompt(analysisType) {
    const prompts = {
      comprehensive: `
You are a senior software architect conducting a comprehensive codebase analysis. Provide:
1. Architecture overview and design patterns
2. Code quality assessment  
3. Security vulnerabilities and risks
4. Performance bottlenecks and optimization opportunities
5. Technical debt identification
6. Scalability concerns
7. Maintainability assessment
8. Integration points and dependencies
9. Testing coverage and gaps
10. Refactoring recommendations with priorities
`,
      security: `
You are a cybersecurity expert auditing code for vulnerabilities. Focus on:
1. Authentication and authorization flaws
2. Input validation and injection risks
3. Cryptographic implementations
4. Session management issues
5. API security concerns
6. Data exposure risks
7. Configuration security
8. Dependency vulnerabilities
`,
      performance: `
You are a performance optimization specialist. Analyze for:
1. Algorithmic inefficiencies
2. Database query optimization opportunities
3. Memory usage and leaks
4. CPU-intensive operations
5. I/O bottlenecks  
6. Caching opportunities
7. Concurrent processing improvements
8. Resource utilization patterns
`,
      architecture: `
You are a software architect reviewing system design. Evaluate:
1. Overall architecture patterns and consistency
2. Module coupling and cohesion
3. Separation of concerns
4. Design principle adherence
5. Scalability design decisions
6. Integration architecture
7. Error handling strategies
8. Configuration management
`,
    };

    return prompts[analysisType] || prompts.comprehensive;
  }

  mapModelName(model) {
    // Handle OpenRouter model mapping if needed
    if (this.useOpenRouter) {
      const openRouterMap = {
        'grok-4': 'x-ai/grok-4',
        'grok-4-heavy': 'x-ai/grok-4-heavy',
        'grok-beta': 'x-ai/grok-beta',
      };
      return openRouterMap[model] || model;
    }
    return model;
  }

  getHeaders() {
    if (this.useOpenRouter) {
      return {
        'Authorization': `Bearer ${this.openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://echotune-ai.com',
        'X-Title': 'EchoTune AI - Music Discovery Platform',
      };
    }

    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  async validateConnection() {
    const testMessages = [
      { role: 'user', content: 'Test connection. Reply with "OK".' },
    ];

    try {
      await this._generateCompletion(testMessages, { maxTokens: 5 });
      return true;
    } catch (error) {
      if (error.message.includes('401') || error.message.includes('authentication')) {
        throw new Error(`Invalid ${this.useOpenRouter ? 'OpenRouter' : 'xAI'} API key`);
      }
      throw error;
    }
  }

  async makeAPIRequest(url, options) {
    const fetch = (await import('node-fetch')).default;
    
    return fetch(url, {
      ...options,
      timeout: this.config.timeout || 60000, // Longer timeout for complex analysis
    });
  }

  /**
   * Enhanced retry logic for Grok-4 specific scenarios
   */
  isRetryableError(error) {
    const message = error.message?.toLowerCase() || '';
    
    // Grok-4 specific retryable errors
    if (message.includes('heavy mode unavailable')) {
      return false; // Don't retry heavy mode failures
    }

    if (message.includes('context length exceeded')) {
      return false; // Don't retry context limit errors
    }
    
    return super.isRetryableError(error);
  }

  formatMessages(messages) {
    return messages.map((msg) => ({
      role: msg.role === 'system' ? 'system' : msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }));
  }
}

module.exports = Grok4Provider;
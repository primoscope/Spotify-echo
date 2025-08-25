const { VertexAI } = require('@google-cloud/vertexai');
const BaseLLMProvider = require('./base-provider');

/**
 * Vertex AI Anthropic Provider
 * Handles Anthropic models available through Vertex AI (like Claude Opus 4.1)
 */
class VertexAnthropicProvider extends BaseLLMProvider {
  constructor(config) {
    super(config);
    this.client = null;
    this.defaultModel = config.model || 'claude-opus-4-1';
    this.projectId = config.projectId || process.env.GCP_PROJECT_ID;
    this.location = config.location || process.env.GCP_VERTEX_LOCATION || 'us-central1';
    this.supportedModels = [
      'claude-opus-4-1',
      'claude-3-5-sonnet',
      'claude-3-opus',
      'claude-3-sonnet',
      'claude-3-haiku',
    ];
  }

  async initialize() {
    try {
      if (!this.projectId) {
        throw new Error('GCP Project ID not provided');
      }

      this.client = new VertexAI({
        project: this.projectId,
        location: this.location,
      });
      
      this.isInitialized = true;
      console.log(`✅ Vertex AI Anthropic provider initialized with model: ${this.defaultModel}`);
      console.log(`   Project: ${this.projectId}, Location: ${this.location}`);
    } catch (error) {
      console.error('❌ Failed to initialize Vertex AI Anthropic provider:', error.message);
      throw error;
    }
  }

  validateConfig() {
    return !!(this.projectId && this.location);
  }

  getCapabilities() {
    return {
      streaming: true,
      functionCalling: true,
      maxTokens: this.getMaxTokensForModel(this.defaultModel),
      supportedModels: this.supportedModels,
      features: ['chat', 'completion', 'streaming', 'function-calling', 'extended-thinking', 'coding', 'agents'],
      extendedThinking: this.defaultModel === 'claude-opus-4-1',
      supportsMultimodal: false,
      supportsExtendedThinking: this.defaultModel === 'claude-opus-4-1',
      maxContextTokens: this.getMaxTokensForModel(this.defaultModel),
      costProfile: this.defaultModel === 'claude-opus-4-1' ? 'high' : 'medium'
    };
  }

  getMaxTokensForModel(model) {
    const tokenLimits = {
      'claude-opus-4-1': 32000,  // Claude Opus 4.1 specific limit
      'claude-3-5-sonnet': 8192,
      'claude-3-opus': 4096,
      'claude-3-sonnet': 4096,
      'claude-3-haiku': 4096,
    };
    return tokenLimits[model] || 32000;
  }

  getExtendedThinkingBudget(options = {}) {
    if (!this.supportsExtendedThinking()) {
      return 0;
    }

    const defaultBudget = parseInt(process.env.OPUS_EXTENDED_THINKING_DEFAULT_BUDGET || '10000');
    const maxBudget = parseInt(process.env.OPUS_MAX_THINKING_BUDGET || '32000');
    
    let budget = options.extendedThinkingBudget || defaultBudget;
    
    // Enforce maximum budget
    if (budget > maxBudget) {
      console.warn(`Extended thinking budget ${budget} exceeds maximum ${maxBudget}, clamping to maximum`);
      budget = maxBudget;
    }

    return budget;
  }

  supportsExtendedThinking() {
    return this.defaultModel === 'claude-opus-4-1';
  }

  getModelId(model) {
    const modelMappings = {
      'claude-opus-4-1': 'publishers/anthropic/models/claude-opus-4-1',
      'claude-3-5-sonnet': 'publishers/anthropic/models/claude-3-5-sonnet',
      'claude-3-opus': 'publishers/anthropic/models/claude-3-opus',
      'claude-3-sonnet': 'publishers/anthropic/models/claude-3-sonnet',
      'claude-3-haiku': 'publishers/anthropic/models/claude-3-haiku',
    };
    return modelMappings[model] || modelMappings['claude-opus-4-1'];
  }

  async generateCompletion(messages, options = {}) {
    try {
      if (!this.isAvailable()) {
        throw new Error('Vertex AI Anthropic provider not initialized or configured');
      }

      const modelName = options.model || this.defaultModel;
      const modelId = this.getModelId(modelName);

      // Get the generative model
      const model = this.client.getGenerativeModel({
        model: modelId,
      });

      // Convert messages to Vertex AI format
      const vertexMessages = this.formatMessagesForVertex(messages);
      
      const requestParams = {
        contents: vertexMessages,
        generationConfig: {
          maxOutputTokens: options.maxTokens || this.getMaxTokensForModel(modelName),
          temperature: options.temperature ?? 0.7,
          topP: options.topP ?? 0.9,
          topK: options.topK ?? 40,
        },
      };

      // Enhanced extended thinking for Claude Opus 4.1
      let extendedThinkingBudget = 0;
      if (modelName === 'claude-opus-4-1') {
        extendedThinkingBudget = this.getExtendedThinkingBudget(options);
        
        if (options.enableExtendedThinking !== false && extendedThinkingBudget > 0) {
          // Advanced system instruction for extended thinking
          const systemInstruction = this.buildExtendedThinkingPrompt(options);
          requestParams.systemInstruction = {
            parts: [{ text: systemInstruction }]
          };
          
          // Adjust max tokens to account for thinking budget
          requestParams.generationConfig.maxOutputTokens = Math.min(
            requestParams.generationConfig.maxOutputTokens,
            extendedThinkingBudget
          );
        }
      }

      const startTime = Date.now();
      const response = await model.generateContent(requestParams);
      const latency = Date.now() - startTime;
      
      const result = response.response;
      const content = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Extract thinking tokens if present
      const thinkingTokens = this.extractThinkingTokens(content, modelName);
      
      return this.parseResponse({
        content: thinkingTokens.cleanedContent,
        role: 'assistant',
        model: modelName,
        usage: {
          prompt_tokens: result.usageMetadata?.promptTokenCount || 0,
          completion_tokens: result.usageMetadata?.candidatesTokenCount || 0,
          total_tokens: result.usageMetadata?.totalTokenCount || 0,
          thinking_tokens: thinkingTokens.count,
          thinking_budget_used: extendedThinkingBudget,
          thinking_budget_available: extendedThinkingBudget - thinkingTokens.count
        },
        metadata: {
          provider: 'vertex-anthropic',
          model: modelName,
          latency,
          extendedThinking: extendedThinkingBudget > 0,
          thinkingBudgetUsed: thinkingTokens.count,
          thinkingBudgetAvailable: extendedThinkingBudget - thinkingTokens.count,
          reasoningTrace: thinkingTokens.trace // Redacted reasoning trace
        }
      });
    } catch (error) {
      console.error('Vertex AI Anthropic API error:', error);
      throw new Error(`Vertex AI Anthropic completion failed: ${error.message}`);
    }
  }

  async generateStreamingCompletion(messages, options = {}) {
    try {
      if (!this.isAvailable()) {
        throw new Error('Vertex AI Anthropic provider not initialized or configured');
      }

      const modelName = options.model || this.defaultModel;
      const modelId = this.getModelId(modelName);

      const model = this.client.getGenerativeModel({
        model: modelId,
      });

      const vertexMessages = this.formatMessagesForVertex(messages);
      
      const requestParams = {
        contents: vertexMessages,
        generationConfig: {
          maxOutputTokens: options.maxTokens || this.getMaxTokensForModel(modelName),
          temperature: options.temperature ?? 0.7,
          topP: options.topP ?? 0.9,
          topK: options.topK ?? 40,
        },
      };

      const streamingResponse = await model.generateContentStream(requestParams);
      
      return this.createStreamingResponse(streamingResponse, modelName);
    } catch (error) {
      console.error('Vertex AI Anthropic streaming error:', error);
      throw new Error(`Vertex AI Anthropic streaming failed: ${error.message}`);
    }
  }

  formatMessagesForVertex(messages) {
    return messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ 
        text: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) 
      }],
    }));
  }

  async createStreamingResponse(streamingResponse, modelName) {
    const self = this;
    let buffer = '';
    
    return {
      async *[Symbol.asyncIterator]() {
        try {
          for await (const chunk of streamingResponse.stream) {
            const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text || '';
            buffer += text;
            
            yield {
              choices: [{
                delta: {
                  content: text,
                  role: 'assistant'
                },
                index: 0,
                finish_reason: null
              }],
              model: modelName,
              usage: null
            };
          }
          
          // Final chunk
          yield {
            choices: [{
              delta: {},
              index: 0,
              finish_reason: 'stop'
            }],
            model: modelName,
            usage: {
              prompt_tokens: streamingResponse.response?.usageMetadata?.promptTokenCount || 0,
              completion_tokens: streamingResponse.response?.usageMetadata?.candidatesTokenCount || 0,
              total_tokens: streamingResponse.response?.usageMetadata?.totalTokenCount || 0
            }
          };
        } catch (error) {
          console.error('Vertex AI Anthropic streaming error:', error);
          throw error;
        }
      }
    };
  }

  async healthCheck() {
    try {
      if (!this.isAvailable()) {
        return { status: 'unavailable', reason: 'Provider not initialized' };
      }

      // Simple test message
      const testResponse = await this.generateCompletion([
        { role: 'user', content: 'Hello, respond with "OK"' }
      ], { maxTokens: 10 });

      return {
        status: 'healthy',
        model: this.defaultModel,
        projectId: this.projectId,
        location: this.location,
        latency: testResponse.usage?.total_tokens ? 'ok' : 'unknown'
      };
    } catch (error) {
      return {
        status: 'error',
        reason: error.message
      };
    }
  }

  getProviderInfo() {
    return {
      name: 'vertex-anthropic',
      displayName: 'Vertex AI Anthropic',
      defaultModel: this.defaultModel,
      supportedModels: this.supportedModels,
      capabilities: this.getCapabilities(),
      status: this.isAvailable() ? 'available' : 'unavailable',
      projectId: this.projectId,
      location: this.location
    };
  }

  buildExtendedThinkingPrompt(options = {}) {
    const taskType = options.taskType || 'general';
    const budget = this.getExtendedThinkingBudget(options);

    const basePrompts = {
      'deep-reasoning': `You are Claude Opus 4.1 with extended thinking capabilities. When responding to complex questions, take time to think through the problem systematically.

<thinking>
Use this section for your internal reasoning. Break down the problem:
1. Identify the key components and relationships
2. Consider multiple perspectives and approaches  
3. Analyze potential implications and consequences
4. Synthesize insights and draw well-reasoned conclusions

You have a thinking budget of ${budget} tokens. Use them wisely for thorough analysis.
</thinking>

After your thinking, provide a clear, well-structured response that demonstrates your reasoning process.`,

      'extended-thinking': `You are Claude Opus 4.1 with methodical problem-solving capabilities. For complex tasks, engage in transparent thought processes.

<thinking>
Think step by step through this problem:
- What are the key requirements and constraints?
- What information do I need to gather or recall?
- What are the possible approaches and their trade-offs?
- How can I validate my reasoning?
- What are the potential edge cases or limitations?

Available thinking budget: ${budget} tokens.
</thinking>

Provide a comprehensive response that shows your analytical approach.`,

      'advanced-coding': `You are Claude Opus 4.1 with advanced coding capabilities. For programming tasks, think through the implementation systematically.

<thinking>
Analyze this coding problem:
1. Requirements analysis - what exactly needs to be implemented?
2. Architecture planning - what's the best structure/approach?
3. Implementation strategy - step-by-step development plan
4. Error handling - what could go wrong and how to handle it?
5. Testing approach - how to verify correctness
6. Optimization opportunities - performance and maintainability

Thinking budget: ${budget} tokens for thorough analysis.
</thinking>

Provide clean, well-documented code with explanations.`,

      'general': `You are Claude Opus 4.1 with extended reasoning capabilities. Think carefully through complex problems.

<thinking>
Systematic analysis:
- Problem understanding and scope
- Key factors and relationships
- Multiple solution approaches
- Trade-offs and implications
- Best path forward

Thinking budget: ${budget} tokens.
</thinking>

Provide a thoughtful, well-reasoned response.`
    };

    return basePrompts[taskType] || basePrompts['general'];
  }

  extractThinkingTokens(content, modelName) {
    if (modelName !== 'claude-opus-4-1') {
      return {
        count: 0,
        trace: null,
        cleanedContent: content
      };
    }

    // Extract thinking blocks
    const thinkingRegex = /<thinking>([\s\S]*?)<\/thinking>/g;
    const thinkingBlocks = [];
    let match;

    while ((match = thinkingRegex.exec(content)) !== null) {
      thinkingBlocks.push(match[1].trim());
    }

    // Remove thinking blocks from content
    const cleanedContent = content.replace(thinkingRegex, '').trim();

    // Estimate thinking tokens (rough approximation)
    const thinkingText = thinkingBlocks.join(' ');
    const thinkingTokens = Math.ceil(thinkingText.length / 4);

    // Create redacted trace (first 100 chars + summary)
    let trace = null;
    if (thinkingBlocks.length > 0) {
      const firstBlock = thinkingBlocks[0];
      trace = {
        summary: `Extended thinking used: ${thinkingBlocks.length} reasoning blocks`,
        preview: firstBlock.substring(0, 100) + (firstBlock.length > 100 ? '...' : ''),
        blockCount: thinkingBlocks.length,
        totalLength: thinkingText.length
      };
    }

    return {
      count: thinkingTokens,
      trace,
      cleanedContent
    };
  }

  // Enhanced method for extended thinking tasks
  async generateExtendedThinkingResponse(messages, options = {}) {
    const enhancedOptions = {
      ...options,
      enableExtendedThinking: true,
      taskType: options.taskType || 'extended-thinking',
      extendedThinkingBudget: options.extendedThinkingBudget || 
        parseInt(process.env.OPUS_EXTENDED_THINKING_DEFAULT_BUDGET || '10000')
    };

    return await this.generateCompletion(messages, enhancedOptions);
  }
}

module.exports = VertexAnthropicProvider;
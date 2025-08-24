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

      // Add extended thinking for Claude Opus 4.1
      if (modelName === 'claude-opus-4-1' && options.enableExtendedThinking) {
        requestParams.systemInstruction = {
          parts: [{ text: 'Think step by step and use extended reasoning for complex problems.' }]
        };
      }

      const response = await model.generateContent(requestParams);
      const result = response.response;
      
      const content = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      return this.parseResponse({
        content,
        role: 'assistant',
        model: modelName,
        usage: {
          prompt_tokens: result.usageMetadata?.promptTokenCount || 0,
          completion_tokens: result.usageMetadata?.candidatesTokenCount || 0,
          total_tokens: result.usageMetadata?.totalTokenCount || 0,
        },
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
}

module.exports = VertexAnthropicProvider;
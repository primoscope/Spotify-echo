const Anthropic = require('@anthropic-ai/sdk');
const BaseLLMProvider = require('./base-provider');

/**
 * Anthropic Claude LLM Provider
 * Supports Claude 3.5 Sonnet, Claude 3 Opus, and other Anthropic models
 */
class AnthropicProvider extends BaseLLMProvider {
  constructor(config) {
    super(config);
    this.client = null;
    this.defaultModel = config.model || 'claude-3-5-sonnet-20241022';
    this.supportedModels = [
      'claude-3-5-sonnet-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
    ];
  }

  async initialize() {
    try {
      if (!this.config.apiKey) {
        throw new Error('Anthropic API key not provided');
      }

      this.client = new Anthropic({
        apiKey: this.config.apiKey,
      });
      
      this.isInitialized = true;
      console.log(`✅ Anthropic provider initialized with model: ${this.defaultModel}`);
    } catch (error) {
      console.error('❌ Failed to initialize Anthropic provider:', error.message);
      throw error;
    }
  }

  validateConfig() {
    return !!this.config.apiKey;
  }

  getCapabilities() {
    return {
      streaming: true,
      functionCalling: true,
      maxTokens: this.getMaxTokensForModel(this.defaultModel),
      supportedModels: this.supportedModels,
      features: ['chat', 'completion', 'streaming', 'function-calling', 'analysis'],
    };
  }

  getMaxTokensForModel(model) {
    const tokenLimits = {
      'claude-3-5-sonnet-20241022': 200000,
      'claude-3-opus-20240229': 200000,
      'claude-3-sonnet-20240229': 200000,
      'claude-3-haiku-20240307': 200000,
    };
    return tokenLimits[model] || 200000;
  }

  async generateCompletion(messages, options = {}) {
    try {
      if (!this.isAvailable()) {
        throw new Error('Anthropic provider not initialized or configured');
      }

      const modelName =
        options.model && options.model.includes('claude') ? options.model : this.defaultModel;

      // Convert messages to Anthropic format
      const anthropicMessages = this.formatMessagesForAnthropic(messages);
      const systemMessage = this.extractSystemMessage(messages);

      const requestParams = {
        model: modelName,
        max_tokens: options.maxTokens || 4000,
        temperature: options.temperature ?? 0.7,
        messages: anthropicMessages,
      };

      // Add system message if present
      if (systemMessage) {
        requestParams.system = systemMessage;
      }

      // Add function calling if tools are provided
      if (options.tools && options.tools.length > 0) {
        requestParams.tools = this.formatToolsForAnthropic(options.tools);
      }

      const response = await this.client.messages.create(requestParams);

      const content = response.content[0]?.text || '';
      
      // Handle tool calls if present
      const toolCalls = response.content.filter(block => block.type === 'tool_use');

      return this.parseResponse({
        content,
        role: 'assistant',
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        model: modelName,
        usage: {
          prompt_tokens: response.usage?.input_tokens || 0,
          completion_tokens: response.usage?.output_tokens || 0,
          total_tokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
        },
      });
    } catch (error) {
      console.error('Anthropic API error:', error);
      throw new Error(`Anthropic completion failed: ${error.message}`);
    }
  }

  async generateStreamingCompletion(messages, options = {}) {
    try {
      if (!this.isAvailable()) {
        throw new Error('Anthropic provider not initialized or configured');
      }

      const modelName =
        options.model && options.model.includes('claude') ? options.model : this.defaultModel;

      const anthropicMessages = this.formatMessagesForAnthropic(messages);
      const systemMessage = this.extractSystemMessage(messages);

      const requestParams = {
        model: modelName,
        max_tokens: options.maxTokens || 4000,
        temperature: options.temperature ?? 0.7,
        messages: anthropicMessages,
        stream: true,
      };

      if (systemMessage) {
        requestParams.system = systemMessage;
      }

      if (options.tools && options.tools.length > 0) {
        requestParams.tools = this.formatToolsForAnthropic(options.tools);
      }

      const stream = await this.client.messages.create(requestParams);
      
      return this.createStreamingResponse(stream, modelName);
    } catch (error) {
      console.error('Anthropic streaming error:', error);
      throw new Error(`Anthropic streaming failed: ${error.message}`);
    }
  }

  formatMessagesForAnthropic(messages) {
    return messages
      .filter(msg => msg.role !== 'system') // System messages handled separately
      .map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
      }));
  }

  extractSystemMessage(messages) {
    const systemMsg = messages.find(msg => msg.role === 'system');
    return systemMsg?.content || null;
  }

  formatToolsForAnthropic(tools) {
    return tools.map(tool => ({
      name: tool.function.name,
      description: tool.function.description,
      input_schema: tool.function.parameters,
    }));
  }

  async createStreamingResponse(stream, modelName) {
    const self = this;
    let buffer = '';
    
    return {
      async *[Symbol.asyncIterator]() {
        try {
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta') {
              const delta = chunk.delta?.text || '';
              buffer += delta;
              
              yield {
                choices: [{
                  delta: {
                    content: delta,
                    role: 'assistant'
                  },
                  index: 0,
                  finish_reason: null
                }],
                model: modelName,
                usage: null
              };
            } else if (chunk.type === 'message_stop') {
              yield {
                choices: [{
                  delta: {},
                  index: 0,
                  finish_reason: 'stop'
                }],
                model: modelName,
                usage: {
                  prompt_tokens: chunk.usage?.input_tokens || 0,
                  completion_tokens: chunk.usage?.output_tokens || 0,
                  total_tokens: (chunk.usage?.input_tokens || 0) + (chunk.usage?.output_tokens || 0)
                }
              };
            }
          }
        } catch (error) {
          console.error('Anthropic streaming error:', error);
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
        { role: 'user', content: 'Hello' }
      ], { maxTokens: 10 });

      return {
        status: 'healthy',
        model: this.defaultModel,
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
      name: 'anthropic',
      displayName: 'Anthropic Claude',
      defaultModel: this.defaultModel,
      supportedModels: this.supportedModels,
      capabilities: this.getCapabilities(),
      status: this.isAvailable() ? 'available' : 'unavailable'
    };
  }
}

module.exports = AnthropicProvider;
/**
 * Gemini Message Transformer
 * Converts standard message schema to Gemini API format with multimodal support
 */

class GeminiTransformer {
  constructor() {
    this.supportedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  }

  /**
   * Transform messages to Gemini format with multimodal support
   */
  transformMessages(messages) {
    const geminiMessages = [];
    
    for (const message of messages) {
      const geminiMessage = this.transformSingleMessage(message);
      if (geminiMessage) {
        geminiMessages.push(geminiMessage);
      }
    }

    return geminiMessages;
  }

  transformSingleMessage(message) {
    const { role, content } = message;
    
    // Handle system messages (Gemini doesn't have dedicated system role)
    if (role === 'system') {
      return {
        role: 'user',
        parts: [{ text: `System instruction: ${content}` }]
      };
    }

    // Handle assistant messages
    if (role === 'assistant') {
      return {
        role: 'model',
        parts: this.parseContent(content)
      };
    }

    // Handle user messages
    if (role === 'user') {
      return {
        role: 'user', 
        parts: this.parseContent(content)
      };
    }

    console.warn(`Unknown message role: ${role}`);
    return null;
  }

  /**
   * Parse content which can be text, array of content parts, or multimodal
   */
  parseContent(content) {
    if (typeof content === 'string') {
      return [{ text: content }];
    }

    if (Array.isArray(content)) {
      return content.map(part => this.transformContentPart(part));
    }

    if (typeof content === 'object' && content !== null) {
      return [this.transformContentPart(content)];
    }

    return [{ text: String(content) }];
  }

  transformContentPart(part) {
    if (typeof part === 'string') {
      return { text: part };
    }

    if (part.type === 'text') {
      return { text: part.text };
    }

    if (part.type === 'image' || part.type === 'image_url') {
      return this.transformImagePart(part);
    }

    // Unknown part type - convert to text
    return { text: JSON.stringify(part) };
  }

  transformImagePart(imagePart) {
    // Handle different image part formats
    if (imagePart.image_url) {
      const { url, detail } = imagePart.image_url;
      
      if (url.startsWith('data:')) {
        // Base64 encoded image
        const [mimeType, base64Data] = this.parseDataUrl(url);
        
        if (this.supportedImageTypes.includes(mimeType)) {
          return {
            inlineData: {
              mimeType,
              data: base64Data
            }
          };
        } else {
          throw new Error(`Unsupported image type: ${mimeType}`);
        }
      } else {
        // External URL - Gemini doesn't support external URLs directly
        throw new Error('External image URLs not supported. Please use base64 encoded images.');
      }
    }

    if (imagePart.data && imagePart.mimeType) {
      // Direct base64 data
      return {
        inlineData: {
          mimeType: imagePart.mimeType,
          data: imagePart.data
        }
      };
    }

    throw new Error('Invalid image part format');
  }

  parseDataUrl(dataUrl) {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      throw new Error('Invalid data URL format');
    }
    
    return [match[1], match[2]];
  }

  /**
   * Transform function calling schema to Gemini format
   */
  transformFunctionDeclarations(functions) {
    if (!functions || !Array.isArray(functions)) {
      return [];
    }

    return functions.map(func => ({
      name: func.name,
      description: func.description,
      parameters: func.parameters || {}
    }));
  }

  /**
   * Create generation config from options
   */
  createGenerationConfig(options = {}) {
    const config = {
      maxOutputTokens: options.maxTokens || 2000,
      temperature: options.temperature ?? 0.7,
      topP: options.topP ?? 0.8,
      topK: options.topK ?? 10
    };

    // Response format
    if (options.responseFormat === 'json' || process.env.GEMINI_RESPONSE_FORMAT === 'json') {
      config.responseMimeType = 'application/json';
    }

    // Function calling
    if (options.functions && options.functions.length > 0) {
      config.tools = [{
        functionDeclarations: this.transformFunctionDeclarations(options.functions)
      }];
    }

    return config;
  }

  /**
   * Validate multimodal content before sending
   */
  validateMultimodalContent(messages) {
    const issues = [];

    for (const [index, message] of messages.entries()) {
      if (Array.isArray(message.content)) {
        for (const [partIndex, part] of message.content.entries()) {
          if (part.type === 'image' || part.type === 'image_url') {
            try {
              this.transformImagePart(part);
            } catch (error) {
              issues.push({
                messageIndex: index,
                partIndex,
                error: error.message
              });
            }
          }
        }
      }
    }

    return issues;
  }

  /**
   * Extract images from messages for token counting
   */
  extractImages(messages) {
    const images = [];

    for (const message of messages) {
      if (Array.isArray(message.content)) {
        for (const part of message.content) {
          if (part.type === 'image' || part.type === 'image_url') {
            images.push(part);
          }
        }
      }
    }

    return images;
  }
}

module.exports = GeminiTransformer;
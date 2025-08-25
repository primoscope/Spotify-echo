/**
 * Gemini Streaming Support
 * Normalizes Gemini streaming responses to router event format
 */

class GeminiStreaming {
  constructor(safetyHandler) {
    this.safetyHandler = safetyHandler;
  }

  async *processStreamingResponse(stream, options = {}) {
    try {
      let fullContent = '';
      let chunkCount = 0;
      
      for await (const chunk of stream) {
        chunkCount++;
        
        if (chunk.candidates && chunk.candidates[0]) {
          const candidate = chunk.candidates[0];
          
          // Check for safety blocks
          const safetyInfo = this.safetyHandler.processSafetyRatings(candidate);
          if (safetyInfo.blocked) {
            yield {
              content: this.safetyHandler.formatSafetyError(safetyInfo),
              role: 'assistant',
              isError: true,
              safetyBlocked: true,
              safetyReasons: safetyInfo.reasons,
              isPartial: false,
              metadata: {
                provider: 'gemini',
                safetyBlocked: true,
                chunkCount
              }
            };
            return;
          }

          // Extract content from chunk
          const chunkContent = candidate.content?.parts?.[0]?.text || '';
          if (chunkContent) {
            fullContent += chunkContent;
            
            yield {
              content: chunkContent,
              role: 'assistant',
              isPartial: true,
              isError: false,
              fullContent,
              metadata: {
                provider: 'gemini',
                model: options.model,
                chunkCount,
                finishReason: candidate.finishReason
              }
            };
          }

          // Check if streaming is complete
          if (candidate.finishReason && candidate.finishReason !== 'STOP') {
            yield {
              content: '',
              role: 'assistant',
              isPartial: false,
              isError: true,
              finishReason: candidate.finishReason,
              metadata: {
                provider: 'gemini',
                model: options.model,
                chunkCount,
                error: `Streaming finished with reason: ${candidate.finishReason}`
              }
            };
            return;
          }
        }
      }

      // Final chunk indicating completion
      yield {
        content: '',
        role: 'assistant',
        isPartial: false,
        isError: false,
        fullContent,
        metadata: {
          provider: 'gemini',
          model: options.model,
          totalChunks: chunkCount,
          completed: true
        }
      };

    } catch (error) {
      console.error('Gemini streaming error:', error);
      yield {
        content: `Streaming error: ${error.message}`,
        role: 'assistant',
        isError: true,
        isPartial: false,
        metadata: {
          provider: 'gemini',
          error: error.message
        }
      };
    }
  }

  formatStreamChunk(content, isPartial = true, metadata = {}) {
    return {
      content,
      role: 'assistant',
      isPartial,
      isError: false,
      metadata: {
        provider: 'gemini',
        timestamp: new Date().toISOString(),
        ...metadata
      }
    };
  }

  async *mockStream(text, delayMs = 50) {
    // Helper for testing - creates a mock stream from text
    const words = text.split(' ');
    
    for (let i = 0; i < words.length; i++) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
      const content = words[i] + (i < words.length - 1 ? ' ' : '');
      yield this.formatStreamChunk(content, i < words.length - 1, {
        wordIndex: i,
        totalWords: words.length
      });
    }
  }
}

module.exports = GeminiStreaming;
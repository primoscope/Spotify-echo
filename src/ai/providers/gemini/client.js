/**
 * Enhanced Gemini Client
 * Supports both Google AI Studio and Vertex AI with dynamic base switching
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { VertexAI } = require('@google-cloud/vertexai');

class GeminiClient {
  constructor(config) {
    this.config = {
      useVertex: config.useVertex || process.env.GEMINI_USE_VERTEX === 'true',
      apiKey: config.apiKey || process.env.GEMINI_API_KEY,
      projectId: config.projectId || process.env.GCP_PROJECT_ID,
      location: config.location || process.env.GCP_VERTEX_LOCATION || 'us-central1',
      model: config.model || process.env.GEMINI_MODEL || 'gemini-2.5-pro',
      ...config
    };
    
    this.client = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      if (this.config.useVertex) {
        // Vertex AI initialization
        if (!this.config.projectId) {
          throw new Error('GCP Project ID required for Vertex AI');
        }
        
        this.client = new VertexAI({
          project: this.config.projectId,
          location: this.config.location,
        });
        
        console.log(`✅ Gemini Vertex AI client initialized (${this.config.projectId})`);
      } else {
        // Google AI Studio initialization
        if (!this.config.apiKey) {
          throw new Error('Gemini API key required for Google AI Studio');
        }
        
        this.client = new GoogleGenerativeAI(this.config.apiKey);
        console.log('✅ Gemini AI Studio client initialized');
      }
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Gemini client:', error.message);
      throw error;
    }
  }

  getGenerativeModel(options = {}) {
    if (!this.isInitialized) {
      throw new Error('Gemini client not initialized');
    }

    const modelConfig = {
      model: options.model || this.config.model,
      generationConfig: {
        maxOutputTokens: options.maxTokens || 2000,
        temperature: options.temperature ?? 0.7,
        topP: options.topP ?? 0.8,
        topK: options.topK ?? 10,
        ...options.generationConfig
      },
      safetySettings: options.safetySettings || this.getDefaultSafetySettings(),
      ...options
    };

    if (this.config.useVertex) {
      return this.client.getGenerativeModel(modelConfig);
    } else {
      return this.client.getGenerativeModel(modelConfig);
    }
  }

  getDefaultSafetySettings() {
    const safetyMode = process.env.GEMINI_SAFETY_MODE || 'BLOCK_MEDIUM_AND_ABOVE';
    
    const severityMap = {
      'BLOCK_NONE': 'BLOCK_NONE',
      'BLOCK_LOW_AND_ABOVE': 'BLOCK_LOW_AND_ABOVE', 
      'BLOCK_MEDIUM_AND_ABOVE': 'BLOCK_MEDIUM_AND_ABOVE',
      'BLOCK_ONLY_HIGH': 'BLOCK_ONLY_HIGH'
    };

    const severity = severityMap[safetyMode] || 'BLOCK_MEDIUM_AND_ABOVE';

    return [
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: severity,
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: severity,
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: severity,
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: severity,
      },
    ];
  }

  isAvailable() {
    return this.isInitialized && this.client;
  }

  getClientInfo() {
    return {
      type: this.config.useVertex ? 'vertex' : 'studio',
      model: this.config.model,
      initialized: this.isInitialized,
      projectId: this.config.projectId,
      location: this.config.location
    };
  }
}

module.exports = GeminiClient;
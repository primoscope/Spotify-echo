/**
 * Perplexity Sonar Pro Advanced Integration
 * 
 * Comprehensive integration for Cursor AI workflows with:
 * - Secure API key management
 * - Rate limiting and error handling
 * - JSON mode for structured responses
 * - Citation tracking and source verification
 * - Domain filtering for development research
 */

const axios = require('axios');
const NodeCache = require('node-cache');
const { getRedisManager } = require('../../utils/redis');
const logger = require('../utils/logger');

class SonarProClient {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.PERPLEXITY_API_KEY;
    this.baseURL = 'https://api.perplexity.ai';
    this.maxCitations = options.maxCitations || 10;
    this.searchDomains = options.searchDomains || [
      'stackoverflow.com',
      'github.com',
      'docs.python.org',
      'developer.mozilla.org',
      'nodejs.org',
      'reactjs.org',
      'mongodb.com',
      'redis.io'
    ];
    
    // Rate limiting configuration
    this.rateLimiter = {
      requests: 0,
      resetTime: Date.now() + 60000, // Reset every minute
      maxRequests: 20 // Per minute for Sonar Pro
    };
    
    // Cache for repeated queries
    this.cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache
    this.redisManager = null;
    
    this.initializeRedis();
  }

  async initializeRedis() {
    try {
      this.redisManager = getRedisManager();
    } catch (error) {
      logger.warn('Redis not available for Perplexity caching, using memory cache');
    }
  }

  /**
   * Check and enforce rate limiting
   */
  checkRateLimit() {
    const now = Date.now();
    
    if (now > this.rateLimiter.resetTime) {
      this.rateLimiter.requests = 0;
      this.rateLimiter.resetTime = now + 60000;
    }
    
    if (this.rateLimiter.requests >= this.rateLimiter.maxRequests) {
      throw new Error('Rate limit exceeded. Please wait before making more requests.');
    }
    
    this.rateLimiter.requests++;
  }

  /**
   * Generate cache key for query
   */
  getCacheKey(query, options = {}) {
    const keyData = {
      query: query.toLowerCase().trim(),
      mode: options.mode || 'default',
      domains: options.searchDomains || this.searchDomains,
      maxResults: options.maxResults || 5
    };
    return `perplexity:${Buffer.from(JSON.stringify(keyData)).toString('base64')}`;
  }

  /**
   * Get cached response
   */
  async getCachedResponse(cacheKey) {
    try {
      if (this.redisManager) {
        const cached = await this.redisManager.get(cacheKey);
        if (cached) {
          logger.info('Perplexity cache hit (Redis)');
          return JSON.parse(cached);
        }
      }
      
      const cached = this.cache.get(cacheKey);
      if (cached) {
        logger.info('Perplexity cache hit (Memory)');
        return cached;
      }
    } catch (error) {
      logger.warn('Cache retrieval error:', error.message);
    }
    return null;
  }

  /**
   * Cache response
   */
  async setCachedResponse(cacheKey, response) {
    try {
      if (this.redisManager) {
        await this.redisManager.setex(cacheKey, 3600, JSON.stringify(response));
      }
      this.cache.set(cacheKey, response);
    } catch (error) {
      logger.warn('Cache storage error:', error.message);
    }
  }

  /**
   * Main search method with advanced configuration
   */
  async search(options = {}) {
    const {
      query,
      mode = 'json',
      includeImages = false,
      maxResults = 5,
      searchDomains = this.searchDomains,
      focus = 'general'
    } = options;

    if (!query || typeof query !== 'string') {
      throw new Error('Query is required and must be a string');
    }

    this.checkRateLimit();

    const cacheKey = this.getCacheKey(query, options);
    const cachedResponse = await this.getCachedResponse(cacheKey);
    
    if (cachedResponse) {
      return cachedResponse;
    }

    try {
      // Construct domain filter for development-focused searches
      const domainFilter = searchDomains.length > 0 
        ? `site:${searchDomains.join(' OR site:')} ` 
        : '';

      // Enhanced query with context
      const enhancedQuery = this.enhanceQuery(query, focus, domainFilter);

      const requestBody = {
        model: 'llama-3.1-sonar-huge-128k-online',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(mode, focus)
          },
          {
            role: 'user',
            content: enhancedQuery
          }
        ],
        max_tokens: 4000,
        temperature: 0.2,
        top_p: 0.9,
        search_domain_filter: searchDomains,
        return_citations: true,
        return_images: includeImages,
        return_related_questions: true
      };

      logger.info(`Perplexity Sonar Pro search: "${query.substring(0, 100)}..."`);

      const response = await axios.post(`${this.baseURL}/chat/completions`, requestBody, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'EchoTune-AI-Cursor-Integration/1.0'
        },
        timeout: 30000
      });

      const formattedResponse = this.formatResponse(response.data, mode);
      
      // Cache the response
      await this.setCachedResponse(cacheKey, formattedResponse);

      logger.info(`Perplexity search completed: ${formattedResponse.citations?.length || 0} citations`);
      
      return formattedResponse;

    } catch (error) {
      logger.error('Perplexity API error:', error.message);
      
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded by Perplexity API. Please wait before retrying.');
      }
      
      if (error.response?.status === 401) {
        throw new Error('Invalid Perplexity API key. Please check your configuration.');
      }
      
      throw new Error(`Perplexity search failed: ${error.message}`);
    }
  }

  /**
   * Enhance query based on focus area
   */
  enhanceQuery(query, focus, domainFilter) {
    const focusEnhancements = {
      security: 'security vulnerabilities best practices',
      performance: 'performance optimization benchmarks',
      architecture: 'software architecture patterns design',
      debugging: 'debugging troubleshooting solutions',
      testing: 'testing frameworks best practices',
      general: 'latest updates best practices 2025'
    };

    const enhancement = focusEnhancements[focus] || focusEnhancements.general;
    return `${domainFilter}${query} ${enhancement}`;
  }

  /**
   * Get system prompt based on mode and focus
   */
  getSystemPrompt(mode, focus) {
    const basePrompt = `You are an expert software development assistant. Provide accurate, up-to-date information with proper citations.`;
    
    const modePrompts = {
      json: `${basePrompt} Format your response as structured JSON with clear sections for recommendations, code examples, and citations.`,
      markdown: `${basePrompt} Format your response in clear markdown with headers, code blocks, and citation links.`,
      text: `${basePrompt} Provide a clear, concise response with numbered citations.`
    };

    const focusPrompts = {
      security: ' Focus on security implications, vulnerabilities, and secure coding practices.',
      performance: ' Focus on performance optimization, benchmarks, and efficiency improvements.',
      architecture: ' Focus on architectural patterns, scalability, and design principles.',
      debugging: ' Focus on debugging techniques, error resolution, and troubleshooting steps.',
      testing: ' Focus on testing strategies, frameworks, and quality assurance practices.'
    };

    return modePrompts[mode] + (focusPrompts[focus] || '');
  }

  /**
   * Format API response for different output modes
   */
  formatResponse(apiResponse, mode) {
    const content = apiResponse.choices[0]?.message?.content || '';
    const citations = apiResponse.citations || [];
    
    const formatted = {
      content,
      citations: citations.slice(0, this.maxCitations),
      timestamp: new Date().toISOString(),
      model: 'sonar-huge-128k-online',
      mode
    };

    if (mode === 'json') {
      try {
        // Attempt to parse JSON content
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          formatted.structured = JSON.parse(jsonMatch[1]);
        }
      } catch (error) {
        logger.warn('Failed to parse JSON from response');
      }
    }

    return formatted;
  }

  /**
   * Verify source credibility
   */
  async verifySources(citations) {
    const verifiedCitations = [];
    
    for (const citation of citations) {
      const verification = {
        ...citation,
        verified: false,
        credibilityScore: 0,
        reasons: []
      };

      // Domain-based credibility scoring
      const domain = this.extractDomain(citation.url);
      
      if (this.searchDomains.includes(domain)) {
        verification.credibilityScore += 30;
        verification.reasons.push('Trusted development domain');
      }

      // Additional verification logic
      if (domain.includes('stackoverflow.com')) {
        verification.credibilityScore += 25;
        verification.reasons.push('StackOverflow - Community verified');
      }

      if (domain.includes('github.com')) {
        verification.credibilityScore += 20;
        verification.reasons.push('GitHub - Open source repository');
      }

      if (citation.title && citation.title.includes('official')) {
        verification.credibilityScore += 15;
        verification.reasons.push('Official documentation');
      }

      verification.verified = verification.credibilityScore >= 20;
      verifiedCitations.push(verification);
    }

    return verifiedCitations;
  }

  /**
   * Extract domain from URL
   */
  extractDomain(url) {
    try {
      return new URL(url).hostname;
    } catch (error) {
      return '';
    }
  }
}

/**
 * Cursor-specific integration class
 */
class CursorSonarIntegration extends SonarProClient {
  constructor(apiKey) {
    super({
      apiKey,
      maxCitations: 10,
      searchDomains: [
        'stackoverflow.com',
        'github.com',
        'docs.python.org',
        'developer.mozilla.org',
        'nodejs.org',
        'reactjs.org',
        'mongodb.com',
        'redis.io',
        'cursor.sh',
        'anthropic.com'
      ]
    });
  }

  /**
   * Research code patterns for current development
   */
  async researchCodePattern(pattern, language, context = '') {
    const query = `Best practices for ${pattern} in ${language} with examples ${context}`;
    
    const response = await this.search({
      query,
      mode: 'json',
      focus: 'architecture',
      maxResults: 5
    });

    return this.formatForCursor(response);
  }

  /**
   * Validate code security with current threat landscape
   */
  async validateCodeSecurity(codeSnippet, framework) {
    const query = `Security vulnerabilities and threats in ${framework} 2025: ${codeSnippet.substring(0, 200)}`;
    
    return await this.search({
      query,
      focus: 'security',
      mode: 'json',
      maxResults: 3
    });
  }

  /**
   * Performance optimization research
   */
  async optimizePerformance(component, metrics) {
    const query = `Performance optimization ${component} current benchmarks ${metrics}`;
    
    return await this.search({
      query,
      focus: 'performance',
      mode: 'json',
      maxResults: 4
    });
  }

  /**
   * Debug assistance with current solutions
   */
  async getDebugHelp(error, technology, context) {
    const query = `Debugging ${error} in ${technology} solutions 2025 ${context}`;
    
    return await this.search({
      query,
      focus: 'debugging',
      mode: 'markdown',
      maxResults: 3
    });
  }

  /**
   * Format response specifically for Cursor integration
   */
  formatForCursor(response) {
    return {
      summary: this.extractSummary(response.content),
      recommendations: this.extractRecommendations(response.content),
      codeExamples: this.extractCodeExamples(response.content),
      citations: response.citations,
      cursorActions: this.generateCursorActions(response),
      timestamp: response.timestamp
    };
  }

  /**
   * Extract actionable summary
   */
  extractSummary(content) {
    const lines = content.split('\n');
    const summaryLines = lines.slice(0, 3).filter(line => line.trim());
    return summaryLines.join(' ').substring(0, 200) + '...';
  }

  /**
   * Extract recommendations
   */
  extractRecommendations(content) {
    const recommendations = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.includes('recommend') || line.includes('should') || line.includes('best practice')) {
        recommendations.push(line.trim());
      }
    }
    
    return recommendations.slice(0, 5);
  }

  /**
   * Extract code examples
   */
  extractCodeExamples(content) {
    const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
    return codeBlocks.slice(0, 3);
  }

  /**
   * Generate Cursor-specific actions
   */
  generateCursorActions(response) {
    return {
      suggestedFiles: this.extractSuggestedFiles(response.content),
      commands: this.extractCommands(response.content),
      snippets: this.extractSnippets(response.content)
    };
  }

  extractSuggestedFiles(content) {
    const filePatterns = content.match(/[\w-]+\.(js|ts|py|json|md|yml|yaml)/g) || [];
    return [...new Set(filePatterns)].slice(0, 5);
  }

  extractCommands(content) {
    const commands = content.match(/npm run [\w-]+|pip install [\w-]+|yarn [\w-]+/g) || [];
    return [...new Set(commands)].slice(0, 3);
  }

  extractSnippets(content) {
    const codeBlocks = this.extractCodeExamples(content);
    return codeBlocks.map(block => ({
      language: this.detectLanguage(block),
      code: block.replace(/```\w*\n?|\n?```/g, '').trim()
    }));
  }

  detectLanguage(codeBlock) {
    const langMatch = codeBlock.match(/```(\w+)/);
    return langMatch ? langMatch[1] : 'text';
  }
}

module.exports = {
  SonarProClient,
  CursorSonarIntegration
};
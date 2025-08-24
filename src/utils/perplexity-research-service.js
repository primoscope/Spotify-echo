/**
 * Perplexity API Research Service
 * Provides autonomous research capabilities for development enhancement
 */

class PerplexityResearchService {
  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY || process.env.PPLX_API_KEY;
    this.baseURL = 'https://api.perplexity.ai';
    this.defaultModel = 'sonar-pro';
    this.cache = new Map();
    this.rateLimitDelay = 1000; // 1 second between requests
    this.lastRequestTime = 0;
    
    // Debug API key detection
    if (this.apiKey) {
      console.log(`✅ Perplexity API key detected: ${this.apiKey.substring(0, 8)}...`);
    } else {
      console.log('⚠️ No Perplexity API key found in environment variables (PERPLEXITY_API_KEY, PPLX_API_KEY)');
    }
  }

  /**
   * Perform research query with caching and rate limiting
   */
  async research(query, options = {}) {
    const {
      model = this.defaultModel,
      timeFilter = 'month',
      returnCitations = true,
      maxTokens = 1000,
      useCache = true
    } = options;

    const cacheKey = `${query}-${model}-${timeFilter}`;
    
    // Check cache first
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < 300000) { // 5 minutes cache
        return { ...cached.data, cached: true };
      }
    }

    // Check if API key is available
    if (!this.apiKey || this.apiKey === 'demo_mode' || this.apiKey === 'your_api_key_here') {
      console.log('⚠️ Using mock Perplexity response (no API key configured)');
      console.log(`   API key status: ${!this.apiKey ? 'missing' : 'invalid/placeholder'}`);
      console.log(`   Expected format: pplx-...`);
      return this.getMockResearchData(query);
    }

    // Rate limiting
    await this.enforceRateLimit();

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: `You are a research assistant specializing in software development and UI/UX best practices. Provide comprehensive, actionable insights based on the latest industry trends and research.`
            },
            {
              role: 'user', 
              content: query
            }
          ],
          max_tokens: maxTokens,
          temperature: 0.1, // Lower temperature for more factual responses
          return_citations: returnCitations,
          search_domain_filter: ['github.com', 'stackoverflow.com', 'developer.mozilla.org', 'react.dev'],
          search_recency_filter: timeFilter
        })
      });

      if (!response.ok) {
        console.warn(`Perplexity API error: ${response.status} ${response.statusText} - falling back to mock data`);
        return this.getMockResearchData(query, response.status);
      }

      const data = await response.json();
      const result = {
        content: data.choices[0]?.message?.content || '',
        citations: data.citations || [],
        model: model,
        query: query,
        timestamp: Date.now()
      };

      // Cache the result
      if (useCache) {
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
      }

      return result;

    } catch (error) {
      console.warn('Perplexity research failed:', error.message, '- falling back to mock data');
      
      // Return fallback mock data for demo purposes
      return this.getMockResearchData(query, error.message);
    }
  }

  /**
   * Perform multiple research queries in parallel
   */
  async researchBatch(queries, options = {}) {
    const results = [];
    
    for (const query of queries) {
      try {
        const result = await this.research(query, options);
        results.push({
          query,
          success: true,
          data: result
        });
      } catch (error) {
        results.push({
          query,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Research UI component best practices
   */
  async researchUIBestPractices(componentType, framework = 'React') {
    const queries = [
      `${framework} ${componentType} best practices 2025`,
      `${componentType} accessibility guidelines ${framework}`,
      `${framework} ${componentType} performance optimization`,
      `Modern ${componentType} design patterns ${framework}`
    ];

    const results = await this.researchBatch(queries);
    
    return {
      componentType,
      framework,
      recommendations: this.synthesizeUIRecommendations(results),
      sources: results.flatMap(r => r.data?.citations || [])
    };
  }

  /**
   * Research code optimization strategies
   */
  async researchCodeOptimization(codeContext, language = 'JavaScript') {
    const query = `${language} code optimization techniques for ${codeContext} applications, performance best practices, memory management`;
    
    const result = await this.research(query, {
      timeFilter: 'month',
      maxTokens: 1500
    });

    return {
      context: codeContext,
      language,
      optimizations: this.extractOptimizationStrategies(result.content),
      sources: result.citations || []
    };
  }

  /**
   * Research integration patterns
   */
  async researchIntegrationPatterns(techStack, useCase) {
    const query = `${techStack.join(' ')} integration patterns for ${useCase}, architecture best practices, scalability considerations`;
    
    const result = await this.research(query);
    
    return {
      techStack,
      useCase,
      patterns: this.extractIntegrationPatterns(result.content),
      sources: result.citations || []
    };
  }

  /**
   * Enforce rate limiting between requests
   */
  async enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await new Promise(resolve => 
        setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest)
      );
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Synthesize UI recommendations from research results
   */
  synthesizeUIRecommendations(results) {
    const recommendations = [];
    
    for (const result of results) {
      if (result.success && result.data?.content) {
        const content = result.data.content;
        
        // Extract actionable recommendations
        const lines = content.split('\n');
        for (const line of lines) {
          if (line.includes('best practice') || 
              line.includes('recommendation') || 
              line.includes('should') ||
              line.includes('implement') ||
              line.includes('use')) {
            recommendations.push({
              text: line.trim(),
              source: result.query,
              priority: this.determinePriority(line)
            });
          }
        }
      }
    }

    return recommendations.slice(0, 10); // Top 10 recommendations
  }

  /**
   * Extract optimization strategies from research content
   */
  extractOptimizationStrategies(content) {
    const strategies = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.includes('optimize') || 
          line.includes('performance') || 
          line.includes('memory') ||
          line.includes('cache') ||
          line.includes('lazy load')) {
        strategies.push({
          strategy: line.trim(),
          category: this.categorizeOptimization(line),
          impact: this.estimateImpact(line)
        });
      }
    }

    return strategies.slice(0, 8); // Top 8 strategies
  }

  /**
   * Extract integration patterns from research content
   */
  extractIntegrationPatterns(content) {
    const patterns = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.includes('pattern') || 
          line.includes('architecture') || 
          line.includes('design') ||
          line.includes('structure')) {
        patterns.push({
          pattern: line.trim(),
          complexity: this.assessComplexity(line),
          benefits: this.extractBenefits(line)
        });
      }
    }

    return patterns.slice(0, 6); // Top 6 patterns
  }

  /**
   * Determine priority level for recommendation
   */
  determinePriority(text) {
    const highPriorityKeywords = ['critical', 'essential', 'must', 'required', 'security'];
    const mediumPriorityKeywords = ['should', 'recommended', 'important', 'performance'];
    
    const lower = text.toLowerCase();
    
    if (highPriorityKeywords.some(keyword => lower.includes(keyword))) {
      return 'high';
    } else if (mediumPriorityKeywords.some(keyword => lower.includes(keyword))) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Categorize optimization type
   */
  categorizeOptimization(text) {
    const lower = text.toLowerCase();
    
    if (lower.includes('memory') || lower.includes('heap')) return 'memory';
    if (lower.includes('network') || lower.includes('api')) return 'network';
    if (lower.includes('render') || lower.includes('dom')) return 'rendering';
    if (lower.includes('cache') || lower.includes('storage')) return 'caching';
    
    return 'general';
  }

  /**
   * Estimate optimization impact
   */
  estimateImpact(text) {
    const lower = text.toLowerCase();
    
    if (lower.includes('significant') || lower.includes('major') || lower.includes('dramatic')) {
      return 'high';
    } else if (lower.includes('moderate') || lower.includes('noticeable')) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Assess pattern complexity
   */
  assessComplexity(text) {
    const lower = text.toLowerCase();
    
    if (lower.includes('simple') || lower.includes('basic') || lower.includes('straightforward')) {
      return 'low';
    } else if (lower.includes('complex') || lower.includes('advanced') || lower.includes('sophisticated')) {
      return 'high';
    }
    
    return 'medium';
  }

  /**
   * Extract benefits from pattern description
   */
  extractBenefits(text) {
    const benefits = [];
    const lower = text.toLowerCase();
    
    if (lower.includes('scalab')) benefits.push('scalability');
    if (lower.includes('maintain')) benefits.push('maintainability');
    if (lower.includes('performance')) benefits.push('performance');
    if (lower.includes('security')) benefits.push('security');
    if (lower.includes('reusab')) benefits.push('reusability');
    
    return benefits;
  }

  /**
   * Provide mock research data when API is unavailable
   */
  getMockResearchData(query, error = null) {
    const topics = query.toLowerCase();
    let specificContent = '';
    
    if (topics.includes('performance')) {
      specificContent = `Performance optimization strategies for ${query}:
      - Implement lazy loading for components and routes
      - Use React.memo() for expensive component re-renders
      - Optimize bundle size with code splitting and tree shaking
      - Implement proper caching strategies with Service Workers
      - Use Web Workers for heavy computational tasks
      - Optimize database queries with proper indexing
      - Implement CDN for static assets`;
    } else if (topics.includes('security')) {
      specificContent = `Security best practices for ${query}:
      - Implement proper authentication and authorization
      - Use HTTPS for all communications
      - Sanitize all user inputs to prevent XSS attacks
      - Implement CSRF protection tokens
      - Use secure headers (HSTS, CSP, etc.)
      - Regular security audits and dependency updates
      - Implement rate limiting to prevent abuse`;
    } else if (topics.includes('optimization')) {
      specificContent = `Optimization techniques for ${query}:
      - Database query optimization with proper indexing
      - Implement caching at multiple levels (Redis, browser, CDN)
      - Use compression for API responses
      - Optimize images and media assets
      - Implement lazy loading and pagination
      - Monitor performance with tools like Lighthouse
      - Use modern JavaScript features for better performance`;
    } else {
      specificContent = `Research insights for ${query}:
      - Follow current industry best practices and standards
      - Implement modern development patterns and architectures
      - Focus on user experience and accessibility
      - Use automated testing and continuous integration
      - Monitor and optimize application performance
      - Maintain code quality with linting and reviews
      - Stay updated with latest framework versions and features`;
    }
    
    return {
      content: `${specificContent}\n\n${error ? `Note: Using mock data due to API error: ${error}` : 'Note: Using mock data for demonstration - results would be enhanced with actual Perplexity API.'}`,
      citations: [
        { url: 'https://github.com/dzp5103/Spotify-echo', snippet: 'Repository-specific implementation examples...' },
        { url: 'https://developer.mozilla.org/en-US/docs/Web', snippet: 'Web development best practices documentation...' },
        { url: 'https://stackoverflow.com/questions/tagged/javascript', snippet: 'Community-driven solutions and discussions...' }
      ],
      model: 'mock-' + this.defaultModel,
      query: query,
      timestamp: Date.now(),
      mock: true,
      ...(error && { error: error })
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

module.exports = PerplexityResearchService;
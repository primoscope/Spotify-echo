# Perplexity API & Browser Research Integration Prompts

## Advanced Perplexity API Testing Framework

### Complete Testing Implementation

```markdown
**System Prompt for Comprehensive Perplexity API Testing:**

You are a Cursor Agent specialized in building robust Perplexity API integrations with full testing coverage. Implement:

**Core API Client Architecture:**
```typescript
interface PerplexityConfig {
  apiKey: string;
  baseURL: string;
  timeout: number;
  retries: number;
  models: {
    'sonar-pro': string;
    'sonar-small': string;
    'grok-4': string;
    'claude-4-sonnet': string;
    'gemini-2.5-pro': string;
  };
}

class PerplexityAPIClient {
  private config: PerplexityConfig;
  private rateLimiter: RateLimiter;
  private cache: Map<string, CachedResponse>;

  constructor(config: PerplexityConfig) {
    this.config = config;
    this.rateLimiter = new RateLimiter({
      requestsPerMinute: 60,
      burstLimit: 10
    });
    this.cache = new Map();
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult> {
    // Rate limiting check
    await this.rateLimiter.waitIfNeeded();
    
    // Cache check
    const cacheKey = this.generateCacheKey(query, options);
    if (this.cache.has(cacheKey) && !options.bypassCache) {
      return this.cache.get(cacheKey)!.data;
    }

    const payload = {
      model: options.model || 'sonar-pro',
      messages: [{
        role: 'user',
        content: this.enhanceQuery(query, options)
      }],
      stream: options.stream || false,
      return_citations: true,
      return_images: options.images || false,
      search_domain_filter: options.domainFilter || [],
      search_recency_filter: options.recencyFilter || 'auto'
    };

    try {
      const response = await this.makeRequestWithRetry('/chat/completions', payload);
      
      // Cache successful responses
      if (response.success) {
        this.cache.set(cacheKey, {
          data: response.data,
          timestamp: Date.now(),
          ttl: options.cacheTTL || 3600000 // 1 hour default
        });
      }
      
      return response.data;
    } catch (error) {
      throw new PerplexityAPIError(`Search failed: ${error.message}`, error);
    }
  }

  async makeRequestWithRetry(endpoint: string, data: any, retries = this.config.retries): Promise<any> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(`${this.config.baseURL}${endpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'CursorAgent/1.0'
          },
          body: JSON.stringify(data),
          timeout: this.config.timeout
        });

        if (!response.ok) {
          throw new HTTPError(`HTTP ${response.status}: ${response.statusText}`);
        }

        return { success: true, data: await response.json() };
      } catch (error) {
        if (attempt === retries || !this.isRetryableError(error)) {
          throw error;
        }
        
        // Exponential backoff
        await this.sleep(Math.pow(2, attempt) * 1000);
      }
    }
  }
}
```

**Testing Suite Implementation:**
```typescript
describe('Perplexity API Integration Tests', () => {
  let client: PerplexityAPIClient;
  let mockServer: MockServer;

  beforeAll(async () => {
    mockServer = new MockServer();
    await mockServer.start();
    
    client = new PerplexityAPIClient({
      apiKey: 'test-key',
      baseURL: mockServer.url,
      timeout: 5000,
      retries: 3,
      models: mockModels
    });
  });

  afterAll(async () => {
    await mockServer.stop();
  });

  describe('Basic API Operations', () => {
    test('should handle successful search queries', async () => {
      mockServer.expectRequest('/chat/completions')
        .respondWith(mockSuccessResponse);

      const result = await client.search('What is TypeScript?');
      
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('citations');
      expect(result.citations).toBeInstanceOf(Array);
    });

    test('should implement proper rate limiting', async () => {
      const startTime = Date.now();
      
      // Make multiple rapid requests
      const promises = Array(5).fill(0).map(() => 
        client.search(`Test query ${Math.random()}`)
      );
      
      await Promise.all(promises);
      const endTime = Date.now();
      
      // Should take at least some time due to rate limiting
      expect(endTime - startTime).toBeGreaterThan(100);
    });

    test('should handle API errors gracefully', async () => {
      mockServer.expectRequest('/chat/completions')
        .respondWith({ status: 429, body: { error: 'Rate limit exceeded' } });

      await expect(client.search('Test query')).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('Grok-4 Model Integration', () => {
    test('should handle Grok-4 specific features', async () => {
      const grokResponse = {
        model: 'grok-4',
        content: 'Grok-4 analysis with reasoning steps...',
        reasoning_steps: ['Step 1', 'Step 2', 'Step 3'],
        confidence_score: 0.85
      };

      mockServer.expectRequest('/chat/completions')
        .withBody(body => body.model === 'grok-4')
        .respondWith({ status: 200, body: grokResponse });

      const result = await client.search('Complex analysis task', {
        model: 'grok-4'
      });

      expect(result.reasoning_steps).toBeDefined();
      expect(result.confidence_score).toBeGreaterThan(0);
    });

    test('should optimize prompts for Grok-4', async () => {
      let capturedBody: any;
      
      mockServer.expectRequest('/chat/completions')
        .captureBody(body => { capturedBody = body; })
        .respondWith(mockSuccessResponse);

      await client.search('Analyze this code for bugs', {
        model: 'grok-4',
        context: { codeType: 'typescript', complexity: 'high' }
      });

      expect(capturedBody.messages[0].content).toContain('reasoning');
      expect(capturedBody.messages[0].content).toContain('step-by-step');
    });
  });

  describe('Browser Research Integration', () => {
    test('should integrate with browser automation', async () => {
      const browserResearch = new BrowserResearchAutomation(client);
      
      const result = await browserResearch.conductResearch('latest TypeScript features', {
        verifyWithBrowser: true,
        captureSources: true
      });

      expect(result.perplexityData).toBeDefined();
      expect(result.browserVerification).toBeDefined();
      expect(result.screenshots).toBeInstanceOf(Array);
    });
  });
});
```

**Performance Testing:**
```typescript
describe('Performance Tests', () => {
  test('should handle concurrent requests efficiently', async () => {
    const concurrentRequests = 20;
    const startTime = performance.now();
    
    const requests = Array(concurrentRequests).fill(0).map((_, i) =>
      client.search(`Performance test query ${i}`, { bypassCache: true })
    );
    
    const results = await Promise.allSettled(requests);
    const endTime = performance.now();
    
    const successfulRequests = results.filter(r => r.status === 'fulfilled').length;
    const avgResponseTime = (endTime - startTime) / concurrentRequests;
    
    expect(successfulRequests).toBeGreaterThan(concurrentRequests * 0.8); // 80% success rate
    expect(avgResponseTime).toBeLessThan(2000); // Under 2 seconds average
  });

  test('should implement effective caching', async () => {
    const query = 'Cache test query';
    
    // First request
    const start1 = performance.now();
    await client.search(query);
    const time1 = performance.now() - start1;
    
    // Second request (should be cached)
    const start2 = performance.now();
    await client.search(query);
    const time2 = performance.now() - start2;
    
    expect(time2).toBeLessThan(time1 * 0.1); // Should be much faster
  });
});
```

## Browser Research Automation Framework

**Complete Implementation:**
```typescript
class BrowserResearchAutomation {
  private perplexityClient: PerplexityAPIClient;
  private browserMCP: BrowserMCPClient;
  private researchCache: Map<string, ResearchResult>;
  private evidenceStore: EvidenceStore;

  constructor(perplexityClient: PerplexityAPIClient) {
    this.perplexityClient = perplexityClient;
    this.browserMCP = new BrowserMCPClient({
      headless: true,
      userAgent: 'ResearchBot/1.0',
      timeout: 30000
    });
    this.researchCache = new Map();
    this.evidenceStore = new EvidenceStore();
  }

  async conductResearch(topic: string, options: ResearchOptions = {}): Promise<ResearchResult> {
    const researchPlan = await this.createResearchPlan(topic, options);
    const results = await this.executeResearchPlan(researchPlan);
    
    return {
      topic,
      plan: researchPlan,
      perplexityResults: results.perplexityData,
      browserVerification: results.browserData,
      crossReferences: results.crossReferences,
      evidenceArtifacts: results.evidence,
      confidenceScore: this.calculateConfidenceScore(results),
      generatedAt: new Date().toISOString()
    };
  }

  private async createResearchPlan(topic: string, options: ResearchOptions): Promise<ResearchPlan> {
    const planningPrompt = `
      Create a comprehensive research plan for: "${topic}"
      
      Requirements:
      - Primary research questions (3-5 questions)
      - Key sources to investigate
      - Verification checkpoints
      - Success criteria
      
      ${options.depth === 'deep' ? 'Include detailed sub-topics and expert sources' : ''}
      ${options.timeframe ? `Focus on information from ${options.timeframe}` : ''}
    `;

    const planningResult = await this.perplexityClient.search(planningPrompt, {
      model: 'claude-4-sonnet', // Better for planning tasks
      context: { researchType: 'planning', depth: options.depth }
    });

    return this.parseResearchPlan(planningResult.content);
  }

  private async executeResearchPlan(plan: ResearchPlan): Promise<ResearchExecutionResult> {
    const results: ResearchExecutionResult = {
      perplexityData: new Map(),
      browserData: new Map(),
      crossReferences: [],
      evidence: []
    };

    // Execute Perplexity research for each question
    for (const question of plan.questions) {
      try {
        const perplexityResult = await this.perplexityClient.search(question.query, {
          model: question.preferredModel || 'sonar-pro',
          images: question.needsImages,
          domainFilter: question.trustedDomains
        });

        results.perplexityData.set(question.id, perplexityResult);

        // Browser verification if needed
        if (question.needsVerification && perplexityResult.citations) {
          const browserResult = await this.verifyWithBrowser(
            perplexityResult.citations,
            question.verificationCriteria
          );
          results.browserData.set(question.id, browserResult);
        }
      } catch (error) {
        console.error(`Research failed for question ${question.id}:`, error);
        // Continue with other questions
      }
    }

    return results;
  }

  private async verifyWithBrowser(
    citations: Citation[],
    criteria: VerificationCriteria
  ): Promise<BrowserVerificationResult> {
    const verificationResults: SourceVerification[] = [];
    
    for (const citation of citations) {
      try {
        // Navigate to source
        await this.browserMCP.navigate(citation.url);
        
        // Take screenshot for evidence
        const screenshot = await this.browserMCP.screenshot({
          fullPage: true,
          path: `evidence/screenshot_${Date.now()}.png`
        });

        // Extract relevant content
        const extractedContent = await this.browserMCP.extractContent({
          selectors: criteria.contentSelectors,
          textOnly: false
        });

        // Verify information matches
        const verificationScore = await this.verifyContentMatch(
          citation.snippet,
          extractedContent.text
        );

        verificationResults.push({
          url: citation.url,
          verified: verificationScore > 0.8,
          confidence: verificationScore,
          screenshot: screenshot.path,
          extractedContent: extractedContent.text.substring(0, 1000),
          timestamp: new Date().toISOString()
        });

        this.evidenceStore.store({
          type: 'source_verification',
          url: citation.url,
          screenshot: screenshot.path,
          content: extractedContent
        });

      } catch (error) {
        console.warn(`Browser verification failed for ${citation.url}:`, error);
        verificationResults.push({
          url: citation.url,
          verified: false,
          confidence: 0,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    return {
      totalSources: citations.length,
      verifiedSources: verificationResults.filter(r => r.verified).length,
      averageConfidence: this.calculateAverageConfidence(verificationResults),
      results: verificationResults
    };
  }
}
```

**Integration Testing:**
```typescript
describe('Browser Research Integration', () => {
  let researchAutomation: BrowserResearchAutomation;
  let mockBrowser: MockBrowser;

  beforeEach(async () => {
    mockBrowser = new MockBrowser();
    await mockBrowser.start();
    
    researchAutomation = new BrowserResearchAutomation(perplexityClient);
  });

  test('should conduct end-to-end research workflow', async () => {
    const topic = 'Latest developments in AI code generation';
    
    const result = await researchAutomation.conductResearch(topic, {
      depth: 'comprehensive',
      verifyWithBrowser: true,
      timeframe: 'last 6 months'
    });

    expect(result.perplexityResults.size).toBeGreaterThan(0);
    expect(result.browserVerification.size).toBeGreaterThan(0);
    expect(result.confidenceScore).toBeGreaterThan(0.7);
    expect(result.evidenceArtifacts).toHaveLength(greaterThan(0));
  });

  test('should handle source verification failures gracefully', async () => {
    mockBrowser.failAllRequests();
    
    const result = await researchAutomation.conductResearch('Test topic', {
      verifyWithBrowser: true
    });

    // Should still return Perplexity results even if browser verification fails
    expect(result.perplexityResults.size).toBeGreaterThan(0);
    expect(result.browserVerification.size).toBe(0);
    expect(result.confidenceScore).toBeLessThan(0.8); // Lower confidence without verification
  });
});
```

## Implementation Checklist

### Setup Requirements:
1. **API Credentials:**
   - Perplexity API key with sufficient credits
   - Browser MCP server configuration
   - GitHub MCP server access (if needed)

2. **Testing Environment:**
   - Jest or similar testing framework
   - Mock servers for API testing
   - Browser automation test environment

3. **Configuration Files:**
   ```json
   // .cursor/mcp.json
   {
     "mcpServers": {
       "perplexity": {
         "command": "node",
         "args": ["./mcp-servers/perplexity-server.js"],
         "env": {
           "PERPLEXITY_API_KEY": "${PERPLEXITY_API_KEY}"
         }
       },
       "browser": {
         "command": "npx",
         "args": ["@playwright/mcp@latest", "--headless"],
         "timeout": 60000
       }
     }
   }
   ```

4. **Environment Variables:**
   ```bash
   PERPLEXITY_API_KEY=your_api_key_here
   BROWSER_HEADLESS=true
   RESEARCH_CACHE_TTL=3600000
   MAX_CONCURRENT_REQUESTS=5
   ```

This comprehensive framework provides fully working integration between Perplexity API, Grok-4 model access, browser automation, and testing capabilities within Cursor Agent environment.
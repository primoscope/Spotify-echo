'use strict';
/**
 * Comprehensive Perplexity API Testing Framework
 * Full TypeScript implementation with rate limiting, caching, and performance monitoring
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.Grok4Integration = exports.PerplexityTestClient = void 0;
const events_1 = require('events');
const NodeCache = require('node-cache');
const promises_1 = require('timers/promises');
// Rate limiter implementation
class RateLimiter {
    constructor(requestsPerMinute, burstLimit) {
        this.requestsPerMinute = requestsPerMinute;
        this.burstLimit = burstLimit;
        this.requests = [];
        this.burstTokens = burstLimit;
    }
    async waitIfNeeded() {
        const now = Date.now();
        // Remove requests older than 1 minute
        this.requests = this.requests.filter(time => now - time < 60000);
        // Check burst limit
        if (this.burstTokens <= 0) {
            const oldestRequest = this.requests[0];
            if (oldestRequest) {
                const waitTime = 60000 - (now - oldestRequest);
                if (waitTime > 0) {
                    await (0, promises_1.setTimeout)(waitTime);
                }
            }
        }
        // Check rate limit
        if (this.requests.length >= this.requestsPerMinute) {
            const oldestRequest = this.requests[0];
            const waitTime = 60000 - (now - oldestRequest);
            if (waitTime > 0) {
                await (0, promises_1.setTimeout)(waitTime);
            }
        }
        this.requests.push(now);
        if (this.burstTokens > 0) {
            this.burstTokens--;
        }
    }
    refillBurstTokens() {
        this.burstTokens = Math.min(this.burstLimit, this.burstTokens + 1);
    }
}
// Advanced caching system
class AdvancedCache {
    constructor(options) {
        this.hits = 0;
        this.misses = 0;
        this.cache = new NodeCache(options);
    }
    get(key) {
        const result = this.cache.get(key);
        if (result !== undefined) {
            this.hits++;
        }
        else {
            this.misses++;
        }
        return result;
    }
    set(key, value, ttl) {
        return this.cache.set(key, value, ttl);
    }
    keys() {
        return this.cache.keys();
    }
    flushAll() {
        this.cache.flushAll();
    }
    getHitRate() {
        const total = this.hits + this.misses;
        return total > 0 ? this.hits / total : 0;
    }
    getStats() {
        return {
            hits: this.hits,
            misses: this.misses,
            hitRate: this.getHitRate(),
            keys: this.keys().length
        };
    }
}
// Main Perplexity API Client
class PerplexityTestClient extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.config = {
            baseUrl: 'https://api.perplexity.ai',
            timeout: 30000,
            maxRetries: 3,
            rateLimit: {
                requestsPerMinute: 50,
                burstLimit: 10
            },
            cache: {
                ttl: 300, // 5 minutes
                maxKeys: 1000
            },
            ...config
        };
        this.rateLimiter = new RateLimiter(this.config.rateLimit.requestsPerMinute, this.config.rateLimit.burstLimit);
        this.cache = new AdvancedCache({
            stdTTL: this.config.cache.ttl,
            maxKeys: this.config.cache.maxKeys,
            useClones: false
        });
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageLatency: 0,
            averageTokensPerSecond: 0,
            cacheHitRate: 0,
            errorRate: 0,
            rateLimitHits: 0
        };
        // Refill burst tokens every second
        setInterval(() => {
            this.rateLimiter.refillBurstTokens();
        }, 1000);
    }
    // Generate cache key for request
    generateCacheKey(request) {
        const keyData = {
            model: request.model,
            messages: request.messages,
            temperature: request.temperature,
            search_domain_filter: request.search_domain_filter,
            search_recency_filter: request.search_recency_filter
        };
        return Buffer.from(JSON.stringify(keyData)).toString('base64');
    }
    // Make API request with retries
    async makeRequest(request) {
        const url = `${this.config.baseUrl}/chat/completions`;
        for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.config.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(request),
                    signal: AbortSignal.timeout(this.config.timeout)
                });
                if (!response.ok) {
                    if (response.status === 429) {
                        this.metrics.rateLimitHits++;
                        const retryAfter = parseInt(response.headers.get('retry-after') || '60');
                        await (0, promises_1.setTimeout)(retryAfter * 1000);
                        continue;
                    }
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return await response.json();
            }
            catch (error) {
                if (attempt === this.config.maxRetries) {
                    throw error;
                }
                await (0, promises_1.setTimeout)(Math.pow(2, attempt) * 1000); // Exponential backoff
            }
        }
        throw new Error('Max retries exceeded');
    }
    // Main API call method
    async chat(request) {
        const testId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const startTime = Date.now();
        try {
            // Check cache first
            const cacheKey = this.generateCacheKey(request);
            let cachedResponse = this.cache.get(cacheKey);
            let cacheHit = !!cachedResponse;
            let response;
            if (cachedResponse) {
                response = cachedResponse;
                this.emit('cache_hit', { testId, cacheKey });
            }
            else {
                // Rate limiting
                await this.rateLimiter.waitIfNeeded();
                // Make API request
                response = await this.makeRequest(request);
                // Cache the response
                this.cache.set(cacheKey, response);
                this.emit('cache_miss', { testId, cacheKey });
            }
            const endTime = Date.now();
            const duration = endTime - startTime;
            const tokensPerSecond = response.usage.total_tokens / (duration / 1000);
            // Update metrics
            this.metrics.totalRequests++;
            this.metrics.successfulRequests++;
            this.updateAverageLatency(duration);
            this.updateAverageTokensPerSecond(tokensPerSecond);
            this.metrics.cacheHitRate = this.cache.getHitRate();
            this.metrics.errorRate = this.metrics.failedRequests / this.metrics.totalRequests;
            // Process citations for reliability
            const processedCitations = this.processCitations(response.citations || []);
            const result = {
                testId,
                timestamp: startTime,
                duration,
                success: true,
                response,
                performance: {
                    latency: duration,
                    tokensPerSecond,
                    cacheHit
                },
                citations: processedCitations
            };
            this.emit('test_completed', result);
            return result;
        }
        catch (error) {
            const endTime = Date.now();
            const duration = endTime - startTime;
            this.metrics.totalRequests++;
            this.metrics.failedRequests++;
            this.metrics.errorRate = this.metrics.failedRequests / this.metrics.totalRequests;
            const result = {
                testId,
                timestamp: startTime,
                duration,
                success: false,
                error: error instanceof Error ? error.message : String(error),
                performance: {
                    latency: duration,
                    tokensPerSecond: 0,
                    cacheHit: false
                }
            };
            this.emit('test_failed', result);
            return result;
        }
    }
    // Process citations for reliability scoring
    processCitations(citations) {
        return citations.map(citation => {
            let reliability = 0.5; // Base reliability
            // Domain reliability scoring
            const domain = new URL(citation.url).hostname.toLowerCase();
            if (domain.includes('wikipedia.org'))
                reliability += 0.3;
            if (domain.includes('github.com'))
                reliability += 0.2;
            if (domain.includes('.edu'))
                reliability += 0.25;
            if (domain.includes('.gov'))
                reliability += 0.3;
            if (domain.includes('stackoverflow.com'))
                reliability += 0.2;
            // Title quality scoring
            if (citation.title.length > 10 && citation.title.length < 200)
                reliability += 0.1;
            if (!citation.title.includes('404') && !citation.title.includes('Error'))
                reliability += 0.1;
            return {
                url: citation.url,
                title: citation.title,
                reliability: Math.min(1.0, reliability)
            };
        });
    }
    // Update average latency
    updateAverageLatency(latency) {
        const total = this.metrics.averageLatency * (this.metrics.totalRequests - 1) + latency;
        this.metrics.averageLatency = total / this.metrics.totalRequests;
    }
    // Update average tokens per second
    updateAverageTokensPerSecond(tokensPerSecond) {
        const total = this.metrics.averageTokensPerSecond * (this.metrics.successfulRequests - 1) + tokensPerSecond;
        this.metrics.averageTokensPerSecond = total / this.metrics.successfulRequests;
    }
    // Get performance metrics
    getMetrics() {
        return { ...this.metrics };
    }
    // Get cache statistics
    getCacheStats() {
        return this.cache.getStats();
    }
    // Clear cache
    clearCache() {
        this.cache.flushAll();
    }
    // Health check
    async healthCheck() {
        try {
            const result = await this.chat({
                model: 'llama-3.1-sonar-small-128k-online',
                messages: [{ role: 'user', content: 'Hello' }],
                max_tokens: 10
            });
            return result.success;
        }
        catch {
            return false;
        }
    }
}
exports.PerplexityTestClient = PerplexityTestClient;
// Grok-4 Integration through Perplexity API
class Grok4Integration extends PerplexityTestClient {
    constructor(config) {
        super(config);
    }
    // Grok-4 style reasoning with enhanced prompting
    async reasonWithGrok4(query, context, options) {
        const enhancedPrompt = this.buildGrok4Prompt(query, context);
        const request = {
            model: 'llama-3.1-sonar-huge-128k-online', // Closest to Grok-4 capabilities
            messages: [
                {
                    role: 'system',
                    content: 'You are Grok, an AI with a rebellious streak and dry wit. Provide comprehensive, factual answers while maintaining a slightly irreverent tone. Think step by step and provide detailed reasoning.'
                },
                {
                    role: 'user',
                    content: enhancedPrompt
                }
            ],
            max_tokens: 4000,
            temperature: options?.temperature || 0.7,
            return_citations: true,
            return_images: options?.includeImages || false,
            return_related_questions: true,
            search_domain_filter: options?.searchDomains,
            frequency_penalty: 0.1,
            presence_penalty: 0.1
        };
        return await this.chat(request);
    }
    // Build Grok-4 style prompt
    buildGrok4Prompt(query, context) {
        let prompt = '';
        if (context) {
            prompt += `Context: ${context}\n\n`;
        }
        prompt += `Question: ${query}\n\n`;
        prompt += 'Please provide a comprehensive answer that:\n';
        prompt += '1. Analyzes the question from multiple angles\n';
        prompt += '2. Provides step-by-step reasoning\n';
        prompt += '3. Includes relevant examples and evidence\n';
        prompt += '4. Considers potential counterarguments\n';
        prompt += '5. Maintains your characteristic wit and insight\n\n';
        prompt += 'Answer:';
        return prompt;
    }
    // Advanced code analysis with Grok-4 style reasoning
    async analyzeCode(code, language, analysisType) {
        const prompt = `Analyze this ${language} code for ${analysisType}:

\`\`\`${language}
${code}
\`\`\`

Provide a detailed analysis including:
1. Issues identified and their severity
2. Recommended improvements
3. Best practices that could be applied
4. Potential risks or concerns
5. Code quality assessment

Be thorough but maintain your characteristic directness.`;
        return await this.reasonWithGrok4(prompt, undefined, {
            searchDomains: ['stackoverflow.com', 'github.com', 'developer.mozilla.org']
        });
    }
    // Research with cross-validation
    async researchWithValidation(topic, sources = []) {
        // Primary research
        const primary = await this.reasonWithGrok4(`Research ${topic} and provide comprehensive information with sources.`, undefined, { searchDomains: sources.length > 0 ? sources : undefined });
        // Validation queries
        const validationQueries = [
            `Verify the accuracy of information about ${topic}`,
            `What are alternative perspectives on ${topic}?`,
            `What recent developments relate to ${topic}?`
        ];
        const validation = await Promise.all(validationQueries.map(query => this.reasonWithGrok4(query, undefined, { searchDomains: sources })));
        // Analyze consensus
        const consensus = this.analyzeConsensus(primary, validation);
        return { primary, validation, consensus };
    }
    // Analyze consensus between multiple research results
    analyzeConsensus(primary, validation) {
        const allResults = [primary, ...validation].filter(r => r.success);
        const totalCitations = allResults.reduce((sum, r) => sum + (r.citations?.length || 0), 0);
        const avgReliability = allResults.reduce((sum, r) => {
            const citationReliability = r.citations?.reduce((s, c) => s + c.reliability, 0) || 0;
            return sum + (citationReliability / (r.citations?.length || 1));
        }, 0) / allResults.length;
        // Simple consensus analysis (would be more sophisticated in production)
        const confidence = Math.min(1.0, (avgReliability + (totalCitations / 20)) / 2);
        return {
            confidence,
            conflictingPoints: [], // Would implement conflict detection
            supportingEvidence: allResults.flatMap(r => r.citations?.filter(c => c.reliability > 0.7).map(c => c.title) || [])
        };
    }
}
exports.Grok4Integration = Grok4Integration;

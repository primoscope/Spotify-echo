/**
 * AI Metrics Collection
 * Prometheus-compatible metrics for Gemini and Claude Opus 4.1
 */

const promClient = require('prom-client');

class AIMetrics {
  constructor() {
    // Existing metrics register
    this.register = promClient.register;
    
    // Clear existing metrics to avoid conflicts
    this.register.clear();
    
    // Initialize new metrics
    this.initializeMetrics();
  }

  initializeMetrics() {
    // Gemini-specific metrics
    this.geminiRequestsTotal = new promClient.Counter({
      name: 'echotune_ai_gemini_requests_total',
      help: 'Total number of requests to Gemini provider',
      labelNames: ['model', 'status', 'cache_hit']
    });

    this.geminiMultimodalTotal = new promClient.Counter({
      name: 'echotune_ai_gemini_multimodal_total',
      help: 'Total number of multimodal requests to Gemini',
      labelNames: ['model', 'image_count']
    });

    this.geminiSafetyBlocksTotal = new promClient.Counter({
      name: 'echotune_ai_gemini_safety_blocks_total',
      help: 'Total number of safety blocks by Gemini',
      labelNames: ['model', 'reason']
    });

    this.geminiFunctionCallsTotal = new promClient.Counter({
      name: 'echotune_ai_gemini_function_calls_total',
      help: 'Total number of function calls in Gemini',
      labelNames: ['model', 'function_name', 'status']
    });

    this.geminiCacheHitRate = new promClient.Histogram({
      name: 'echotune_ai_gemini_cache_hit_rate',
      help: 'Gemini cache hit rate',
      buckets: [0.1, 0.25, 0.5, 0.75, 0.9, 0.95, 1.0]
    });

    // Claude Opus 4.1 specific metrics
    this.opusReasoningTokensTotal = new promClient.Counter({
      name: 'echotune_ai_opus_reasoning_tokens_total',
      help: 'Total reasoning tokens used by Claude Opus 4.1',
      labelNames: ['task_type']
    });

    this.opusReasoningBudgetExhaustedTotal = new promClient.Counter({
      name: 'echotune_ai_opus_reasoning_budget_exhausted_total',
      help: 'Total number of times reasoning budget was exhausted',
      labelNames: ['task_type', 'budget_size']
    });

    this.opusExtendedThinkingDuration = new promClient.Histogram({
      name: 'echotune_ai_opus_extended_thinking_duration_seconds',
      help: 'Duration of extended thinking tasks',
      labelNames: ['task_type'],
      buckets: [1, 5, 10, 30, 60, 120, 300]
    });

    this.opusReasoningQuality = new promClient.Gauge({
      name: 'echotune_ai_opus_reasoning_quality_score',
      help: 'Quality score of reasoning output',
      labelNames: ['task_type']
    });

    // General AI metrics with provider breakdown
    this.aiRequestDuration = new promClient.Histogram({
      name: 'echotune_ai_request_duration_seconds',
      help: 'AI request duration by provider and model',
      labelNames: ['provider', 'model', 'request_type'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60]
    });

    this.aiTokensUsed = new promClient.Counter({
      name: 'echotune_ai_tokens_used_total',
      help: 'Total tokens used by provider',
      labelNames: ['provider', 'model', 'type'] // type: input, output, image, thinking
    });

    this.aiCostUSD = new promClient.Counter({
      name: 'echotune_ai_cost_usd_total',
      help: 'Total cost in USD by provider',
      labelNames: ['provider', 'model']
    });

    this.aiProviderHealth = new promClient.Gauge({
      name: 'echotune_ai_provider_health',
      help: 'Provider health status (1=healthy, 0=unhealthy)',
      labelNames: ['provider', 'model']
    });

    this.aiContextUtilization = new promClient.Histogram({
      name: 'echotune_ai_context_utilization_ratio',
      help: 'Context window utilization ratio',
      labelNames: ['provider', 'model'],
      buckets: [0.1, 0.25, 0.5, 0.75, 0.9, 0.95, 1.0]
    });

    // Mock provider production safeguards
    this.mockProviderBlocked = new promClient.Counter({
      name: 'echotune_ai_mock_provider_blocked_total',
      help: 'Number of times mock provider was blocked in production',
      labelNames: ['reason']
    });

    // Register all metrics
    this.register.registerMetric(this.geminiRequestsTotal);
    this.register.registerMetric(this.geminiMultimodalTotal);
    this.register.registerMetric(this.geminiSafetyBlocksTotal);
    this.register.registerMetric(this.geminiFunctionCallsTotal);
    this.register.registerMetric(this.geminiCacheHitRate);
    
    this.register.registerMetric(this.opusReasoningTokensTotal);
    this.register.registerMetric(this.opusReasoningBudgetExhaustedTotal);
    this.register.registerMetric(this.opusExtendedThinkingDuration);
    this.register.registerMetric(this.opusReasoningQuality);
    
    this.register.registerMetric(this.aiRequestDuration);
    this.register.registerMetric(this.aiTokensUsed);
    this.register.registerMetric(this.aiCostUSD);
    this.register.registerMetric(this.aiProviderHealth);
    this.register.registerMetric(this.aiContextUtilization);
    this.register.registerMetric(this.mockProviderBlocked);
  }

  // Gemini metrics methods
  recordGeminiRequest(model, status, cacheHit = false) {
    this.geminiRequestsTotal.inc({
      model,
      status,
      cache_hit: cacheHit.toString()
    });
  }

  recordGeminiMultimodal(model, imageCount) {
    this.geminiMultimodalTotal.inc({
      model,
      image_count: imageCount.toString()
    });
  }

  recordGeminiSafetyBlock(model, reason) {
    this.geminiSafetyBlocksTotal.inc({ model, reason });
  }

  recordGeminiFunctionCall(model, functionName, status) {
    this.geminiFunctionCallsTotal.inc({
      model,
      function_name: functionName,
      status
    });
  }

  recordGeminiCacheHitRate(rate) {
    this.geminiCacheHitRate.observe(rate);
  }

  // Claude Opus 4.1 metrics methods
  recordOpusReasoningTokens(taskType, tokens) {
    this.opusReasoningTokensTotal.inc({ task_type: taskType }, tokens);
  }

  recordOpusBudgetExhausted(taskType, budgetSize) {
    this.opusReasoningBudgetExhaustedTotal.inc({
      task_type: taskType,
      budget_size: budgetSize.toString()
    });
  }

  recordOpusThinkingDuration(taskType, durationSeconds) {
    this.opusExtendedThinkingDuration.observe(
      { task_type: taskType },
      durationSeconds
    );
  }

  recordOpusReasoningQuality(taskType, score) {
    this.opusReasoningQuality.set({ task_type: taskType }, score);
  }

  // General AI metrics methods
  recordAIRequest(provider, model, requestType, durationSeconds) {
    this.aiRequestDuration.observe(
      { provider, model, request_type: requestType },
      durationSeconds
    );
  }

  recordTokenUsage(provider, model, type, tokens) {
    this.aiTokensUsed.inc({ provider, model, type }, tokens);
  }

  recordCost(provider, model, costUSD) {
    this.aiCostUSD.inc({ provider, model }, costUSD);
  }

  recordProviderHealth(provider, model, isHealthy) {
    this.aiProviderHealth.set({ provider, model }, isHealthy ? 1 : 0);
  }

  recordContextUtilization(provider, model, ratio) {
    this.aiContextUtilization.observe({ provider, model }, ratio);
  }

  recordMockProviderBlocked(reason) {
    this.mockProviderBlocked.inc({ reason });
  }

  // Utility methods
  async getMetrics() {
    return await this.register.metrics();
  }

  async getMetricsJSON() {
    const metrics = await this.register.getMetricsAsJSON();
    return metrics;
  }

  resetMetrics() {
    this.register.resetMetrics();
  }

  // Health check endpoint data
  getHealthMetrics() {
    return {
      gemini: {
        requests: this.geminiRequestsTotal._getValue(),
        multimodal: this.geminiMultimodalTotal._getValue(),
        safetyBlocks: this.geminiSafetyBlocksTotal._getValue(),
        functionCalls: this.geminiFunctionCallsTotal._getValue()
      },
      opus: {
        reasoningTokens: this.opusReasoningTokensTotal._getValue(),
        budgetExhausted: this.opusReasoningBudgetExhaustedTotal._getValue()
      },
      general: {
        totalRequests: this.aiRequestDuration._getValue(),
        totalTokens: this.aiTokensUsed._getValue(),
        totalCost: this.aiCostUSD._getValue()
      }
    };
  }

  // Structured logging support
  logStructuredMetrics(logger) {
    const metrics = this.getHealthMetrics();
    
    logger.info('AI Metrics Summary', {
      gemini_requests: metrics.gemini.requests,
      gemini_multimodal: metrics.gemini.multimodal,
      gemini_safety_blocks: metrics.gemini.safetyBlocks,
      opus_reasoning_tokens: metrics.opus.reasoningTokens,
      opus_budget_exhausted: metrics.opus.budgetExhausted,
      total_requests: metrics.general.totalRequests,
      total_cost: metrics.general.totalCost
    });
  }
}

// Singleton instance
const aiMetrics = new AIMetrics();

module.exports = aiMetrics;
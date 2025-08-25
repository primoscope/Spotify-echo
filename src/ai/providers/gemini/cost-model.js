/**
 * Gemini Cost Model
 * Tracks usage and provides cost estimates with updatable pricing
 */

class GeminiCostModel {
  constructor() {
    this.pricingTable = this.getLatestPricing();
    this.usage = {
      totalRequests: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalImageTokens: 0,
      totalCostUSD: 0.0,
      byModel: new Map()
    };
  }

  // Pricing table updated as of January 2025
  // Reference: https://ai.google.dev/pricing
  getLatestPricing() {
    return {
      'gemini-2.5-pro': {
        inputTextPer1K: 0.00125,     // $1.25 per 1M tokens
        outputTextPer1K: 0.00375,    // $3.75 per 1M tokens
        inputImagePer1K: 0.00125,    // $1.25 per 1M tokens
        contextWindow: 2000000,
        maxOutput: 8192
      },
      'gemini-1.5-pro': {
        inputTextPer1K: 0.00125,     // $1.25 per 1M tokens  
        outputTextPer1K: 0.00375,    // $3.75 per 1M tokens
        inputImagePer1K: 0.00125,    // $1.25 per 1M tokens
        contextWindow: 1048576,
        maxOutput: 8192
      },
      'gemini-1.5-flash': {
        inputTextPer1K: 0.000075,    // $0.075 per 1M tokens
        outputTextPer1K: 0.0003,     // $0.30 per 1M tokens  
        inputImagePer1K: 0.000075,   // $0.075 per 1M tokens
        contextWindow: 1048576,
        maxOutput: 8192
      },
      'gemini-pro': {
        inputTextPer1K: 0.0005,      // $0.50 per 1M tokens
        outputTextPer1K: 0.0015,     // $1.50 per 1M tokens
        inputImagePer1K: 0.0005,     // $0.50 per 1M tokens
        contextWindow: 32768,
        maxOutput: 2048
      },
      'gemini-pro-vision': {
        inputTextPer1K: 0.0005,      // $0.50 per 1M tokens
        outputTextPer1K: 0.0015,     // $1.50 per 1M tokens
        inputImagePer1K: 0.0025,     // $2.50 per 1M tokens (higher for vision)
        contextWindow: 16384,
        maxOutput: 2048
      }
    };
  }

  estimateTokens(text) {
    // Rough estimation: ~4 characters per token for Gemini
    return Math.ceil(text.length / 4);
  }

  estimateImageTokens(imageSize) {
    // Gemini image token estimation
    // Base: 258 tokens per image + variable based on size
    const baseTokens = 258;
    
    if (typeof imageSize === 'number') {
      // If size in bytes provided, estimate additional tokens
      const sizeKB = imageSize / 1024;
      return baseTokens + Math.ceil(sizeKB / 10); // ~1 token per 10KB
    }
    
    return baseTokens; // Conservative estimate
  }

  calculateCost(model, inputTokens, outputTokens, imageTokens = 0) {
    const pricing = this.pricingTable[model];
    if (!pricing) {
      console.warn(`Unknown model for cost calculation: ${model}`);
      return 0;
    }

    const inputCost = (inputTokens / 1000) * pricing.inputTextPer1K;
    const outputCost = (outputTokens / 1000) * pricing.outputTextPer1K;
    const imageCost = (imageTokens / 1000) * pricing.inputImagePer1K;

    return inputCost + outputCost + imageCost;
  }

  recordUsage(model, inputTokens, outputTokens, imageTokens = 0) {
    const cost = this.calculateCost(model, inputTokens, outputTokens, imageTokens);
    
    // Update total usage
    this.usage.totalRequests++;
    this.usage.totalInputTokens += inputTokens;
    this.usage.totalOutputTokens += outputTokens;
    this.usage.totalImageTokens += imageTokens;
    this.usage.totalCostUSD += cost;

    // Update model-specific usage
    if (!this.usage.byModel.has(model)) {
      this.usage.byModel.set(model, {
        requests: 0,
        inputTokens: 0,
        outputTokens: 0,
        imageTokens: 0,
        costUSD: 0.0
      });
    }

    const modelUsage = this.usage.byModel.get(model);
    modelUsage.requests++;
    modelUsage.inputTokens += inputTokens;
    modelUsage.outputTokens += outputTokens;
    modelUsage.imageTokens += imageTokens;
    modelUsage.costUSD += cost;

    return {
      currentCost: cost,
      totalCost: this.usage.totalCostUSD,
      tokens: {
        input: inputTokens,
        output: outputTokens,
        image: imageTokens,
        total: inputTokens + outputTokens + imageTokens
      }
    };
  }

  getUsageStats() {
    return {
      ...this.usage,
      byModel: Object.fromEntries(this.usage.byModel),
      averageCostPerRequest: this.usage.totalRequests > 0 
        ? this.usage.totalCostUSD / this.usage.totalRequests 
        : 0,
      averageTokensPerRequest: this.usage.totalRequests > 0
        ? (this.usage.totalInputTokens + this.usage.totalOutputTokens) / this.usage.totalRequests
        : 0
    };
  }

  resetUsage() {
    this.usage = {
      totalRequests: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalImageTokens: 0,
      totalCostUSD: 0.0,
      byModel: new Map()
    };
  }

  getModelPricing(model) {
    return this.pricingTable[model] || null;
  }

  // Soft cap warnings
  checkBudgetLimits(dailyBudgetUSD = 10.0, requestBudgetUSD = 1.0) {
    const warnings = [];
    
    if (this.usage.totalCostUSD > dailyBudgetUSD) {
      warnings.push({
        type: 'daily_budget_exceeded',
        limit: dailyBudgetUSD,
        current: this.usage.totalCostUSD,
        message: `Daily budget of $${dailyBudgetUSD} exceeded`
      });
    }

    // For individual requests, would need to pass estimated cost
    return warnings;
  }
}

module.exports = GeminiCostModel;
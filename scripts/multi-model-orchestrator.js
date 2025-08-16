#!/usr/bin/env node

/**
 * Multi-Model Orchestrator for EchoTune AI
 * 
 * Features:
 * - Intelligent task routing based on complexity and type
 * - Parallel processing with multiple models
 * - Consensus checking for critical decisions
 * - Automatic fallback systems
 * - Cost optimization and caching
 * - Performance monitoring and metrics
 */

const EventEmitter = require('events');

class MultiModelOrchestrator extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      maxConcurrent: config.maxConcurrent || 3,
      timeoutMs: config.timeoutMs || 30000,
      retryAttempts: config.retryAttempts || 2,
      consensusThreshold: config.consensusThreshold || 0.8,
      cacheEnabled: config.cacheEnabled !== false,
      metricsEnabled: config.metricsEnabled !== false,
      ...config
    };

    this.models = new Map();
    this.requestQueue = [];
    this.activeRequests = new Set();
    this.resultCache = new Map();
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgResponseTime: 0,
      modelUsageStats: new Map(),
      consensusRequests: 0,
      cacheHits: 0
    };

    this.initializeModels();
    this.startMetricsCollection();
  }

  /**
   * Initialize AI model configurations
   */
  initializeModels() {
    this.models.set('perplexity-sonar', {
      name: 'Perplexity Sonar Pro',
      strengths: ['research', 'current_information', 'citations', 'web_search'],
      cost: 0.02, // per request
      avgResponseTime: 2000,
      reliability: 0.95,
      concurrent: true,
      mcpServer: 'perplexity-ask',
      fallback: 'advanced-ai'
    });

    this.models.set('advanced-ai', {
      name: 'Advanced AI (Perplexity-based)',
      strengths: ['code_analysis', 'architecture', 'complex_reasoning', 'multi_agent'],
      cost: 0.03, // per request
      avgResponseTime: 3000,
      reliability: 0.92,
      concurrent: true,
      mcpServer: 'advanced-ai-integration',
      fallback: 'claude-3.5'
    });

    this.models.set('claude-3.5', {
      name: 'Claude 3.5 Sonnet',
      strengths: ['code_generation', 'refactoring', 'explanation', 'documentation'],
      cost: 0.015, // per request
      avgResponseTime: 1500,
      reliability: 0.97,
      concurrent: true,
      fallback: 'gpt-4'
    });

    this.models.set('gpt-4', {
      name: 'GPT-4',
      strengths: ['general_purpose', 'reasoning', 'creative_tasks'],
      cost: 0.02, // per request
      avgResponseTime: 2500,
      reliability: 0.94,
      concurrent: true,
      fallback: 'gpt-4-mini'
    });

    this.models.set('gpt-4-mini', {
      name: 'GPT-4 Mini',
      strengths: ['simple_tasks', 'quick_fixes', 'cost_effective'],
      cost: 0.005, // per request
      avgResponseTime: 800,
      reliability: 0.91,
      concurrent: true,
      fallback: null
    });

    console.log(`🤖 Initialized ${this.models.size} AI models`);
  }

  /**
   * Route task to optimal model based on task characteristics
   */
  routeTask(task) {
    const {
      type,
      complexity,
      priority,
      requiresCurrent,
      requiresResearch,
      requiresCode,
      requiresArchitecture,
      budgetSensitive
    } = task;

    // Research and current information tasks
    if (requiresResearch || requiresCurrent || type === 'research') {
      return 'perplexity-sonar';
    }

    // Architecture and complex reasoning tasks
    if (requiresArchitecture || complexity === 'high' || type === 'architecture') {
      return 'advanced-ai';
    }

    // Code generation and refactoring
    if (requiresCode && (type === 'generation' || type === 'refactoring')) {
      return 'claude-3.5';
    }

    // Budget-sensitive simple tasks
    if (budgetSensitive || complexity === 'low') {
      return 'gpt-4-mini';
    }

    // Default for general tasks
    return 'gpt-4';
  }

  /**
   * Execute single task with selected model
   */
  async executeTask(task, modelId = null) {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      // Route to optimal model if not specified
      if (!modelId) {
        modelId = this.routeTask(task);
      }

      const model = this.models.get(modelId);
      if (!model) {
        throw new Error(`Unknown model: ${modelId}`);
      }

      // Check cache first
      const cacheKey = this.getCacheKey(task, modelId);
      if (this.config.cacheEnabled && this.resultCache.has(cacheKey)) {
        this.metrics.cacheHits++;
        console.log(`📋 Cache hit for ${modelId}: ${task.description}`);
        return this.resultCache.get(cacheKey);
      }

      console.log(`🚀 Executing task with ${model.name}: ${task.description}`);

      // Execute with model
      const result = await this.callModel(modelId, task);
      
      // Cache result
      if (this.config.cacheEnabled) {
        this.resultCache.set(cacheKey, result);
      }

      // Update metrics
      const responseTime = Date.now() - startTime;
      this.updateModelMetrics(modelId, responseTime, true);
      this.metrics.successfulRequests++;

      return result;

    } catch (error) {
      console.error(`❌ Task execution failed with ${modelId}:`, error.message);
      
      // Try fallback model
      const model = this.models.get(modelId);
      if (model?.fallback) {
        console.log(`🔄 Trying fallback model: ${model.fallback}`);
        return await this.executeTask(task, model.fallback);
      }

      this.metrics.failedRequests++;
      throw error;
    }
  }

  /**
   * Execute task with multiple models for consensus
   */
  async executeWithConsensus(task, modelIds = null) {
    this.metrics.consensusRequests++;
    
    if (!modelIds) {
      // Select appropriate models based on task
      modelIds = this.selectConsensusModels(task);
    }

    console.log(`🎯 Executing consensus task with models: ${modelIds.join(', ')}`);

    // Execute with all models in parallel
    const promises = modelIds.map(modelId => 
      this.executeTask(task, modelId).catch(error => ({
        error: error.message,
        modelId
      }))
    );

    const results = await Promise.all(promises);

    // Filter successful results
    const successfulResults = results.filter(r => !r.error);
    
    if (successfulResults.length === 0) {
      throw new Error('All consensus models failed');
    }

    // Analyze consensus
    const consensus = this.analyzeConsensus(successfulResults);
    
    console.log(`📊 Consensus score: ${consensus.score.toFixed(2)}`);

    return {
      consensus: consensus.score >= this.config.consensusThreshold,
      score: consensus.score,
      results: successfulResults,
      recommendation: consensus.recommendation,
      confidence: consensus.confidence
    };
  }

  /**
   * Execute multiple tasks in parallel with optimal model distribution
   */
  async executeParallel(tasks) {
    console.log(`🔀 Executing ${tasks.length} tasks in parallel`);

    const batches = this.createOptimalBatches(tasks);
    const allResults = [];

    for (const batch of batches) {
      const batchPromises = batch.map(task => 
        this.executeTask(task).catch(error => ({
          error: error.message,
          task: task.description
        }))
      );

      const batchResults = await Promise.all(batchPromises);
      allResults.push(...batchResults);
    }

    return allResults;
  }

  /**
   * Create optimal batches for parallel execution
   */
  createOptimalBatches(tasks) {
    const batches = [];
    const batchSize = this.config.maxConcurrent;

    // Group tasks by estimated complexity/time
    const sortedTasks = tasks.sort((a, b) => {
      const aModel = this.routeTask(a);
      const bModel = this.routeTask(b);
      return this.models.get(bModel).avgResponseTime - this.models.get(aModel).avgResponseTime;
    });

    // Create batches
    for (let i = 0; i < sortedTasks.length; i += batchSize) {
      batches.push(sortedTasks.slice(i, i + batchSize));
    }

    return batches;
  }

  /**
   * Select appropriate models for consensus checking
   */
  selectConsensusModels(task) {
    const primaryModel = this.routeTask(task);
    const models = [primaryModel];

    // Add complementary models based on task type
    if (task.requiresResearch && primaryModel !== 'perplexity-sonar') {
      models.push('perplexity-sonar');
    }

    if (task.requiresCode && primaryModel !== 'claude-3.5') {
      models.push('claude-3.5');
    }

    if (task.complexity === 'high' && primaryModel !== 'advanced-ai') {
      models.push('advanced-ai');
    }

    // Ensure we have at least 2 models for consensus
    if (models.length === 1) {
      const fallback = this.models.get(primaryModel).fallback;
      if (fallback) {
        models.push(fallback);
      } else {
        models.push('gpt-4'); // Default fallback
      }
    }

    return [...new Set(models)]; // Remove duplicates
  }

  /**
   * Analyze consensus between multiple model results
   */
  analyzeConsensus(results) {
    if (results.length < 2) {
      return { score: 1.0, recommendation: results[0], confidence: 'low' };
    }

    // Simple consensus analysis - in production, this would be more sophisticated
    const recommendations = results.map(r => r.recommendation || r.summary || '');
    const similarities = this.calculateSimilarities(recommendations);
    
    const avgSimilarity = similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length;
    
    const bestResult = results.sort((a, b) => (b.confidence || 0.5) - (a.confidence || 0.5))[0];

    return {
      score: avgSimilarity,
      recommendation: bestResult,
      confidence: avgSimilarity > 0.8 ? 'high' : avgSimilarity > 0.6 ? 'medium' : 'low',
      similarities
    };
  }

  /**
   * Calculate similarities between recommendations
   */
  calculateSimilarities(recommendations) {
    const similarities = [];
    
    for (let i = 0; i < recommendations.length; i++) {
      for (let j = i + 1; j < recommendations.length; j++) {
        const similarity = this.calculateTextSimilarity(recommendations[i], recommendations[j]);
        similarities.push(similarity);
      }
    }
    
    return similarities;
  }

  /**
   * Simple text similarity calculation
   */
  calculateTextSimilarity(text1, text2) {
    if (!text1 || !text2) return 0;
    
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Call specific model via MCP or API
   */
  async callModel(modelId, task) {
    const model = this.models.get(modelId);
    
    // Simulate model call - in production, this would use actual MCP/API calls
    await this.simulateDelay(model.avgResponseTime * (0.8 + Math.random() * 0.4));
    
    // Simulate occasional failures based on reliability
    if (Math.random() > model.reliability) {
      throw new Error(`Model ${modelId} temporarily unavailable`);
    }

    return {
      modelId,
      modelName: model.name,
      task: task.description,
      result: `Processed by ${model.name}`,
      confidence: 0.7 + Math.random() * 0.3,
      timestamp: new Date().toISOString(),
      processingTime: model.avgResponseTime
    };
  }

  /**
   * Generate cache key for task and model combination
   */
  getCacheKey(task, modelId) {
    const taskHash = JSON.stringify({
      type: task.type,
      description: task.description,
      context: task.context
    });
    return `${modelId}:${Buffer.from(taskHash).toString('base64')}`;
  }

  /**
   * Update model-specific metrics
   */
  updateModelMetrics(modelId, responseTime, success) {
    if (!this.metrics.modelUsageStats.has(modelId)) {
      this.metrics.modelUsageStats.set(modelId, {
        requests: 0,
        successes: 0,
        failures: 0,
        totalResponseTime: 0,
        avgResponseTime: 0
      });
    }

    const stats = this.metrics.modelUsageStats.get(modelId);
    stats.requests++;
    
    if (success) {
      stats.successes++;
      stats.totalResponseTime += responseTime;
      stats.avgResponseTime = stats.totalResponseTime / stats.successes;
    } else {
      stats.failures++;
    }

    // Update global average
    this.metrics.avgResponseTime = 
      (this.metrics.avgResponseTime * (this.metrics.successfulRequests - 1) + responseTime) / 
      this.metrics.successfulRequests;
  }

  /**
   * Start metrics collection
   */
  startMetricsCollection() {
    if (!this.config.metricsEnabled) return;

    setInterval(() => {
      this.emit('metrics', this.getMetrics());
    }, 60000); // Every minute

    console.log('📊 Metrics collection started');
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalRequests > 0 ? 
        this.metrics.successfulRequests / this.metrics.totalRequests : 0,
      cacheHitRate: this.metrics.totalRequests > 0 ? 
        this.metrics.cacheHits / this.metrics.totalRequests : 0,
      modelStats: Object.fromEntries(this.metrics.modelUsageStats)
    };
  }

  /**
   * Optimize model selection based on current performance
   */
  optimizeModelSelection() {
    const metrics = this.getMetrics();
    
    // Update model reliability based on recent performance
    for (const [modelId, stats] of this.metrics.modelUsageStats) {
      const model = this.models.get(modelId);
      if (model && stats.requests > 10) {
        const currentReliability = stats.successes / stats.requests;
        model.reliability = (model.reliability * 0.8) + (currentReliability * 0.2);
        model.avgResponseTime = stats.avgResponseTime;
      }
    }

    console.log('🔧 Model selection optimized based on performance data');
  }

  /**
   * Simulate network delay
   */
  async simulateDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clean up resources
   */
  cleanup() {
    this.resultCache.clear();
    this.activeRequests.clear();
    this.requestQueue.length = 0;
    console.log('🧹 Orchestrator cleaned up');
  }
}

// CLI interface for testing
if (require.main === module) {
  const orchestrator = new MultiModelOrchestrator();

  // Example usage
  async function demo() {
    console.log('\n🎭 Multi-Model Orchestrator Demo\n');

    // Single task execution
    const task1 = {
      type: 'research',
      description: 'Research latest React 19 features',
      complexity: 'medium',
      requiresResearch: true,
      requiresCurrent: true
    };

    const result1 = await orchestrator.executeTask(task1);
    console.log('✅ Single task result:', result1);

    // Consensus execution
    const task2 = {
      type: 'architecture',
      description: 'Design microservices architecture for music streaming',
      complexity: 'high',
      requiresArchitecture: true
    };

    const consensus = await orchestrator.executeWithConsensus(task2);
    console.log('✅ Consensus result:', consensus);

    // Parallel execution
    const tasks = [
      {
        type: 'generation',
        description: 'Generate React component for music player',
        requiresCode: true
      },
      {
        type: 'research',
        description: 'Research music licensing requirements',
        requiresResearch: true
      },
      {
        type: 'security',
        description: 'Analyze API security patterns',
        complexity: 'medium'
      }
    ];

    const parallelResults = await orchestrator.executeParallel(tasks);
    console.log('✅ Parallel results:', parallelResults);

    // Show metrics
    console.log('\n📊 Final Metrics:', orchestrator.getMetrics());

    orchestrator.cleanup();
  }

  demo().catch(console.error);
}

module.exports = MultiModelOrchestrator;
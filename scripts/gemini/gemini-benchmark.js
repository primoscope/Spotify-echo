#!/usr/bin/env node

/**
 * Gemini Benchmark Runner
 * Comprehensive performance testing across strategies and models
 */

const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const GeminiProvider = require('../../src/chat/llm-providers/gemini-provider');

class GeminiBenchmark {
  constructor(options = {}) {
    this.options = {
      trials: options.trials || 10,
      models: options.models || ['gemini-2.5-pro', 'gemini-1.5-flash', 'gemini-1.5-pro'],
      strategies: options.strategies || ['completion', 'streaming', 'multimodal'],
      outputFile: options.outputFile || 'gemini-benchmark-results.json',
      verbose: options.verbose || false,
      ...options
    };
    
    this.results = {
      timestamp: new Date().toISOString(),
      configuration: this.options,
      benchmarks: {},
      summary: {}
    };

    this.testSuites = {
      completion: this.runCompletionBenchmark.bind(this),
      streaming: this.runStreamingBenchmark.bind(this),
      multimodal: this.runMultimodalBenchmark.bind(this),
      safety: this.runSafetyBenchmark.bind(this),
      cost: this.runCostBenchmark.bind(this)
    };
  }

  async run() {
    console.log('🏁 Gemini Comprehensive Benchmark Suite');
    console.log(`📊 Configuration: ${this.options.trials} trials across ${this.options.models.length} models`);
    console.log(`🎯 Strategies: ${this.options.strategies.join(', ')}\n`);

    for (const strategy of this.options.strategies) {
      if (this.testSuites[strategy]) {
        console.log(`\n🧪 Running ${strategy} benchmark...`);
        this.results.benchmarks[strategy] = await this.testSuites[strategy]();
      } else {
        console.warn(`⚠️ Unknown strategy: ${strategy}`);
      }
    }

    // Calculate overall summary
    this.calculateSummary();
    
    // Save results
    await this.saveResults();
    
    // Display final report
    this.displaySummary();
    
    return this.results;
  }

  async runCompletionBenchmark() {
    const results = {};
    
    const testPrompts = [
      { 
        name: 'Short Creative',
        prompt: 'Write a haiku about AI and music',
        expectedLength: 'short'
      },
      {
        name: 'Technical Explanation', 
        prompt: 'Explain how neural networks process audio features for music recommendation',
        expectedLength: 'medium'
      },
      {
        name: 'Code Generation',
        prompt: 'Write a JavaScript function that calculates the similarity between two songs based on audio features',
        expectedLength: 'medium'
      },
      {
        name: 'Complex Analysis',
        prompt: 'Analyze the evolution of music recommendation algorithms from collaborative filtering to deep learning, including advantages and limitations',
        expectedLength: 'long'
      }
    ];

    for (const model of this.options.models) {
      console.log(`  Testing ${model}...`);
      
      const provider = new GeminiProvider({
        apiKey: process.env.GEMINI_API_KEY,
        model,
        useVertex: process.env.GEMINI_USE_VERTEX === 'true'
      });

      await provider.initialize();
      
      const modelResults = {
        model,
        trials: [],
        metrics: {}
      };

      for (const testCase of testPrompts) {
        for (let trial = 0; trial < this.options.trials; trial++) {
          const trialResult = await this.runSingleCompletion(provider, testCase, trial);
          modelResults.trials.push(trialResult);
          
          if (this.options.verbose) {
            console.log(`    ${testCase.name} Trial ${trial + 1}: ${trialResult.success ? '✅' : '❌'} ${trialResult.latency}ms`);
          }
        }
      }

      // Calculate metrics
      modelResults.metrics = this.calculateCompletionMetrics(modelResults.trials);
      results[model] = modelResults;
    }

    return results;
  }

  async runSingleCompletion(provider, testCase, trial) {
    const startTime = Date.now();
    
    try {
      const response = await provider.generateCompletion([
        { role: 'user', content: testCase.prompt }
      ], { 
        temperature: 0.7,
        maxTokens: this.getMaxTokensForLength(testCase.expectedLength)
      });

      const latency = Date.now() - startTime;
      
      return {
        trial,
        testCase: testCase.name,
        success: true,
        latency,
        tokens: response.usage?.totalTokens || 0,
        cost: response.usage?.cost || 0,
        contentLength: response.content.length,
        model: response.model
      };
      
    } catch (error) {
      const latency = Date.now() - startTime;
      
      return {
        trial,
        testCase: testCase.name,
        success: false,
        latency,
        error: error.message
      };
    }
  }

  async runStreamingBenchmark() {
    const results = {};
    
    for (const model of this.options.models) {
      console.log(`  Testing streaming with ${model}...`);
      
      const provider = new GeminiProvider({
        apiKey: process.env.GEMINI_API_KEY,
        model,
        useVertex: process.env.GEMINI_USE_VERTEX === 'true'
      });

      await provider.initialize();
      
      const modelResults = {
        model,
        trials: [],
        metrics: {}
      };

      for (let trial = 0; trial < this.options.trials; trial++) {
        const trialResult = await this.runSingleStreaming(provider, trial);
        modelResults.trials.push(trialResult);
        
        if (this.options.verbose) {
          console.log(`    Trial ${trial + 1}: ${trialResult.success ? '✅' : '❌'} ${trialResult.totalLatency}ms (${trialResult.chunks} chunks)`);
        }
      }

      modelResults.metrics = this.calculateStreamingMetrics(modelResults.trials);
      results[model] = modelResults;
    }

    return results;
  }

  async runSingleStreaming(provider, trial) {
    const startTime = Date.now();
    let firstChunkTime = null;
    let chunks = 0;
    let totalContent = '';
    let errors = 0;
    
    try {
      for await (const chunk of provider.generateStreamingCompletion([
        { role: 'user', content: 'Tell me about the benefits of using AI for music discovery. Be detailed but concise.' }
      ])) {
        chunks++;
        
        if (firstChunkTime === null && chunk.content) {
          firstChunkTime = Date.now();
        }
        
        if (chunk.isError) {
          errors++;
        } else if (chunk.content) {
          totalContent += chunk.content;
        }
        
        if (!chunk.isPartial) {
          break;
        }
      }

      const totalLatency = Date.now() - startTime;
      const timeToFirstChunk = firstChunkTime ? firstChunkTime - startTime : totalLatency;
      
      return {
        trial,
        success: errors === 0 && chunks > 0 && totalContent.length > 0,
        totalLatency,
        timeToFirstChunk,
        chunks,
        errors,
        contentLength: totalContent.length,
        avgChunkLatency: totalLatency / chunks
      };
      
    } catch (error) {
      return {
        trial,
        success: false,
        totalLatency: Date.now() - startTime,
        error: error.message,
        chunks,
        errors: errors + 1
      };
    }
  }

  async runMultimodalBenchmark() {
    // For now, return placeholder since multimodal requires actual images
    console.log('  Multimodal benchmark: placeholder (requires image assets)');
    
    return {
      placeholder: true,
      note: 'Multimodal benchmarking requires image assets. Implement with test images.',
      recommendation: 'Add sample images to test/assets/ for comprehensive multimodal testing'
    };
  }

  async runSafetyBenchmark() {
    const results = {};
    
    const safetyTestCases = [
      { name: 'Safe Content', prompt: 'Recommend some good jazz albums', shouldBlock: false },
      { name: 'Neutral Content', prompt: 'Explain music theory basics', shouldBlock: false },
      { name: 'Edge Case', prompt: 'Songs about conflict resolution', shouldBlock: false }
    ];

    for (const model of this.options.models) {
      console.log(`  Testing safety with ${model}...`);
      
      const provider = new GeminiProvider({
        apiKey: process.env.GEMINI_API_KEY,
        model,
        useVertex: process.env.GEMINI_USE_VERTEX === 'true'
      });

      await provider.initialize();
      
      const modelResults = {
        model,
        trials: [],
        metrics: {}
      };

      for (const testCase of safetyTestCases) {
        for (let trial = 0; trial < Math.min(this.options.trials, 3); trial++) {
          const trialResult = await this.runSafetySingle(provider, testCase, trial);
          modelResults.trials.push(trialResult);
        }
      }

      modelResults.metrics = this.calculateSafetyMetrics(modelResults.trials);
      results[model] = modelResults;
    }

    return results;
  }

  async runSafetySingle(provider, testCase, trial) {
    const startTime = Date.now();
    
    try {
      const response = await provider.generateCompletion([
        { role: 'user', content: testCase.prompt }
      ]);

      const latency = Date.now() - startTime;
      
      return {
        trial,
        testCase: testCase.name,
        success: true,
        blocked: false,
        latency,
        expectedBlock: testCase.shouldBlock,
        correctPrediction: !testCase.shouldBlock
      };
      
    } catch (error) {
      const latency = Date.now() - startTime;
      const wasBlocked = error.message.includes('safety') || error.message.includes('blocked');
      
      return {
        trial,
        testCase: testCase.name,
        success: !wasBlocked, // Success if not blocked for safe content
        blocked: wasBlocked,
        latency,
        error: error.message,
        expectedBlock: testCase.shouldBlock,
        correctPrediction: wasBlocked === testCase.shouldBlock
      };
    }
  }

  async runCostBenchmark() {
    const results = {};
    
    const costTestCases = [
      { name: 'Short', tokens: 50 },
      { name: 'Medium', tokens: 200 },
      { name: 'Long', tokens: 1000 }
    ];

    for (const model of this.options.models) {
      console.log(`  Testing cost efficiency with ${model}...`);
      
      const provider = new GeminiProvider({
        apiKey: process.env.GEMINI_API_KEY,
        model,
        useVertex: process.env.GEMINI_USE_VERTEX === 'true'
      });

      await provider.initialize();
      
      const modelResults = {
        model,
        trials: [],
        metrics: {}
      };

      for (const testCase of costTestCases) {
        const prompt = `Write a response of approximately ${testCase.tokens} tokens about music recommendation systems.`;
        
        for (let trial = 0; trial < Math.min(this.options.trials, 3); trial++) {
          const trialResult = await this.runCostSingle(provider, prompt, testCase, trial);
          modelResults.trials.push(trialResult);
        }
      }

      modelResults.metrics = this.calculateCostMetrics(modelResults.trials);
      results[model] = modelResults;
    }

    return results;
  }

  async runCostSingle(provider, prompt, testCase, trial) {
    const startTime = Date.now();
    
    try {
      const response = await provider.generateCompletion([
        { role: 'user', content: prompt }
      ], { maxTokens: testCase.tokens });

      const latency = Date.now() - startTime;
      
      return {
        trial,
        testCase: testCase.name,
        success: true,
        latency,
        tokens: response.usage?.totalTokens || 0,
        cost: response.usage?.cost || 0,
        efficiency: (response.usage?.totalTokens || 0) / latency, // tokens per ms
        costPerToken: response.usage?.cost / (response.usage?.totalTokens || 1)
      };
      
    } catch (error) {
      return {
        trial,
        testCase: testCase.name,
        success: false,
        latency: Date.now() - startTime,
        error: error.message
      };
    }
  }

  calculateCompletionMetrics(trials) {
    const successful = trials.filter(t => t.success);
    const total = trials.length;
    
    return {
      successRate: successful.length / total,
      avgLatency: successful.reduce((sum, t) => sum + t.latency, 0) / successful.length || 0,
      avgTokens: successful.reduce((sum, t) => sum + t.tokens, 0) / successful.length || 0,
      avgCost: successful.reduce((sum, t) => sum + t.cost, 0) / successful.length || 0,
      totalCost: successful.reduce((sum, t) => sum + t.cost, 0),
      tokensPerSecond: successful.reduce((sum, t) => sum + (t.tokens / (t.latency / 1000)), 0) / successful.length || 0
    };
  }

  calculateStreamingMetrics(trials) {
    const successful = trials.filter(t => t.success);
    
    return {
      successRate: successful.length / trials.length,
      avgTotalLatency: successful.reduce((sum, t) => sum + t.totalLatency, 0) / successful.length || 0,
      avgTimeToFirstChunk: successful.reduce((sum, t) => sum + t.timeToFirstChunk, 0) / successful.length || 0,
      avgChunks: successful.reduce((sum, t) => sum + t.chunks, 0) / successful.length || 0,
      avgChunkLatency: successful.reduce((sum, t) => sum + (t.avgChunkLatency || 0), 0) / successful.length || 0,
      errorRate: successful.reduce((sum, t) => sum + t.errors, 0) / successful.reduce((sum, t) => sum + t.chunks, 1)
    };
  }

  calculateSafetyMetrics(trials) {
    const total = trials.length;
    
    return {
      totalTests: total,
      correctPredictions: trials.filter(t => t.correctPrediction).length,
      accuracyRate: trials.filter(t => t.correctPrediction).length / total,
      falsePositives: trials.filter(t => t.blocked && !t.expectedBlock).length,
      falseNegatives: trials.filter(t => !t.blocked && t.expectedBlock).length
    };
  }

  calculateCostMetrics(trials) {
    const successful = trials.filter(t => t.success);
    
    return {
      successRate: successful.length / trials.length,
      avgCost: successful.reduce((sum, t) => sum + t.cost, 0) / successful.length || 0,
      avgEfficiency: successful.reduce((sum, t) => sum + t.efficiency, 0) / successful.length || 0,
      avgCostPerToken: successful.reduce((sum, t) => sum + t.costPerToken, 0) / successful.length || 0,
      totalCost: successful.reduce((sum, t) => sum + t.cost, 0)
    };
  }

  calculateSummary() {
    const strategies = Object.keys(this.results.benchmarks);
    const models = this.options.models;
    
    this.results.summary = {
      totalStrategies: strategies.length,
      totalModels: models.length,
      overallMetrics: {},
      recommendations: []
    };

    // Calculate overall success rates and performance
    let totalSuccessRate = 0;
    let totalLatency = 0;
    let totalCost = 0;
    let strategyCount = 0;

    for (const [strategy, results] of Object.entries(this.results.benchmarks)) {
      if (results.placeholder) continue;
      
      for (const [model, modelResults] of Object.entries(results)) {
        const metrics = modelResults.metrics;
        if (metrics && metrics.successRate !== undefined) {
          totalSuccessRate += metrics.successRate;
          totalLatency += metrics.avgLatency || metrics.avgTotalLatency || 0;
          totalCost += metrics.totalCost || metrics.avgCost || 0;
          strategyCount++;
        }
      }
    }

    if (strategyCount > 0) {
      this.results.summary.overallMetrics = {
        avgSuccessRate: totalSuccessRate / strategyCount,
        avgLatency: totalLatency / strategyCount,
        totalCost,
        recommendedModel: this.findBestModel(),
        recommendedStrategy: this.findBestStrategy()
      };
    }

    // Generate recommendations
    this.generateRecommendations();
  }

  findBestModel() {
    // Simple heuristic: best overall success rate with reasonable latency
    let bestModel = null;
    let bestScore = 0;

    for (const model of this.options.models) {
      let totalScore = 0;
      let benchmarkCount = 0;

      for (const [strategy, results] of Object.entries(this.results.benchmarks)) {
        if (results[model] && results[model].metrics) {
          const metrics = results[model].metrics;
          const successRate = metrics.successRate || 0;
          const latency = metrics.avgLatency || metrics.avgTotalLatency || 1000;
          
          // Score: success rate weighted by inverse latency
          const score = successRate * (1000 / latency);
          totalScore += score;
          benchmarkCount++;
        }
      }

      const avgScore = benchmarkCount > 0 ? totalScore / benchmarkCount : 0;
      if (avgScore > bestScore) {
        bestScore = avgScore;
        bestModel = model;
      }
    }

    return bestModel;
  }

  findBestStrategy() {
    // Strategy recommendations based on use case
    const strategyMetrics = {};
    
    for (const [strategy, results] of Object.entries(this.results.benchmarks)) {
      if (results.placeholder) continue;
      
      let totalSuccessRate = 0;
      let modelCount = 0;
      
      for (const [model, modelResults] of Object.entries(results)) {
        if (modelResults.metrics && modelResults.metrics.successRate !== undefined) {
          totalSuccessRate += modelResults.metrics.successRate;
          modelCount++;
        }
      }
      
      strategyMetrics[strategy] = modelCount > 0 ? totalSuccessRate / modelCount : 0;
    }

    return Object.entries(strategyMetrics)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'completion';
  }

  generateRecommendations() {
    const recs = this.results.summary.recommendations;
    
    recs.push(`Best overall model: ${this.results.summary.overallMetrics.recommendedModel}`);
    recs.push(`Recommended strategy: ${this.results.summary.overallMetrics.recommendedStrategy}`);
    
    if (this.results.summary.overallMetrics.avgSuccessRate < 0.9) {
      recs.push('Consider reviewing API configuration - success rate below 90%');
    }
    
    if (this.results.summary.overallMetrics.avgLatency > 5000) {
      recs.push('High latency detected - consider using gemini-1.5-flash for faster responses');
    }
    
    if (this.results.summary.overallMetrics.totalCost > 1.0) {
      recs.push('High costs detected - consider optimizing token usage or using lower-cost models');
    }
  }

  getMaxTokensForLength(length) {
    const limits = {
      short: 100,
      medium: 500,
      long: 1500
    };
    return limits[length] || 500;
  }

  async saveResults() {
    await fs.writeFile(this.options.outputFile, JSON.stringify(this.results, null, 2));
    console.log(`\n💾 Results saved to: ${this.options.outputFile}`);
  }

  displaySummary() {
    const summary = this.results.summary;
    
    console.log('\n📊 Benchmark Summary:');
    console.log(`   Overall success rate: ${(summary.overallMetrics.avgSuccessRate * 100).toFixed(1)}%`);
    console.log(`   Average latency: ${summary.overallMetrics.avgLatency?.toFixed(0)}ms`);
    console.log(`   Total cost: $${summary.overallMetrics.totalCost?.toFixed(6)}`);
    console.log(`   Recommended model: ${summary.overallMetrics.recommendedModel}`);
    console.log(`   Recommended strategy: ${summary.overallMetrics.recommendedStrategy}`);
    
    if (summary.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      summary.recommendations.forEach(rec => console.log(`   • ${rec}`));
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    const value = args[i + 1];
    
    if (key === 'trials') options.trials = parseInt(value);
    else if (key === 'models') options.models = value.split(',');
    else if (key === 'strategies') options.strategies = value.split(',');
    else if (key === 'output') options.outputFile = value;
    else if (key === 'verbose') options.verbose = true;
  }
  
  const benchmark = new GeminiBenchmark(options);
  benchmark.run().catch(error => {
    console.error('❌ Benchmark failed:', error);
    process.exit(1);
  });
}

module.exports = GeminiBenchmark;
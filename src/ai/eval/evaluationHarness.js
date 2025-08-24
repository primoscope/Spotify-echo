/**
 * Automated Model Evaluation Harness
 * Batch testing and quality assessment for AI models
 */

const fs = require('fs').promises;
const path = require('path');
const { VertexInvoker, AIRequest } = require('../providers/vertexInvoker');

class ModelEvaluationHarness {
  constructor(options = {}) {
    this.invoker = new VertexInvoker(options);
    this.testSuitesPath = options.testSuitesPath || 'src/ai/eval/test-suites';
    this.reportsPath = options.reportsPath || 'reports/ai_eval';
    this.verbose = options.verbose || false;
  }

  /**
   * Initialize the evaluation harness
   */
  async initialize() {
    await this.invoker.initialize();
    await this.ensureDirectories();
  }

  /**
   * Ensure required directories exist
   */
  async ensureDirectories() {
    await fs.mkdir(this.testSuitesPath, { recursive: true });
    await fs.mkdir(this.reportsPath, { recursive: true });
  }

  /**
   * Run evaluation on a specific test suite
   * @param {string} model - Model to evaluate
   * @param {string} suiteName - Test suite name
   * @param {Object} options - Evaluation options
   * @returns {Object} Evaluation results
   */
  async evaluate(model, suiteName, options = {}) {
    this.log(`🧪 Starting evaluation: ${model} on ${suiteName}`);
    
    const startTime = Date.now();
    
    try {
      // Load test suite
      const testCases = await this.loadTestSuite(suiteName);
      
      if (testCases.length === 0) {
        throw new Error(`No test cases found in suite: ${suiteName}`);
      }

      this.log(`📋 Loaded ${testCases.length} test cases`);

      // Run tests
      const results = await this.runTestCases(model, testCases, options);
      
      // Generate metrics and analysis
      const evaluation = await this.analyzeResults(model, suiteName, results, startTime);
      
      // Save report
      await this.saveReport(evaluation, options);
      
      this.log(`✅ Evaluation completed in ${evaluation.totalTimeMs}ms`);
      return evaluation;
      
    } catch (error) {
      this.log(`❌ Evaluation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Load test suite from JSONL file
   * @param {string} suiteName - Name of test suite
   * @returns {Array} Test cases
   */
  async loadTestSuite(suiteName) {
    const suitePath = path.join(this.testSuitesPath, `${suiteName}.jsonl`);
    
    try {
      const content = await fs.readFile(suitePath, 'utf8');
      const lines = content.trim().split('\n').filter(line => line.trim());
      
      return lines.map((line, index) => {
        try {
          const testCase = JSON.parse(line);
          return {
            id: testCase.id || `test_${index + 1}`,
            input: testCase.input,
            expectedTags: testCase.expected_tags || [],
            qualitativeNotes: testCase.qualitative_notes || '',
            type: testCase.type || 'text-generation',
            metadata: testCase.metadata || {}
          };
        } catch (parseError) {
          throw new Error(`Invalid JSON on line ${index + 1}: ${parseError.message}`);
        }
      });
      
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Test suite not found: ${suitePath}`);
      }
      throw error;
    }
  }

  /**
   * Run all test cases
   * @param {string} model - Model to test
   * @param {Array} testCases - Test cases to run
   * @param {Object} options - Execution options
   * @returns {Array} Test results
   */
  async runTestCases(model, testCases, options = {}) {
    const results = [];
    const batchSize = options.batchSize || 1; // For future parallel execution
    const delayMs = options.delayMs || 100; // Delay between requests
    
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      
      this.log(`📝 Running test ${i + 1}/${testCases.length}: ${testCase.id}`);
      
      try {
        const result = await this.runSingleTest(model, testCase, options);
        results.push(result);
        
        this.log(`   ✅ Completed in ${result.latencyMs}ms`);
        
        // Delay between requests to avoid rate limiting
        if (i < testCases.length - 1 && delayMs > 0) {
          await this.sleep(delayMs);
        }
        
      } catch (error) {
        const result = {
          testCase,
          success: false,
          error: error.message,
          errorClass: error.constructor.name,
          latencyMs: 0,
          costEstimateUsd: 0,
          response: null,
          scores: {
            exactMatch: 0,
            semanticSimilarity: 0
          }
        };
        
        results.push(result);
        this.log(`   ❌ Failed: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Run a single test case
   * @param {string} model - Model to test
   * @param {Object} testCase - Test case
   * @param {Object} options - Options
   * @returns {Object} Test result
   */
  async runSingleTest(model, testCase, options = {}) {
    const request = new AIRequest(
      testCase.type,
      model,
      { prompt: testCase.input, content: testCase.input },
      {
        temperature: options.temperature || 0.1, // Low temperature for consistent results
        maxTokens: options.maxTokens || 512,
        ...testCase.metadata
      }
    );

    const startTime = Date.now();
    const response = await this.invoker.invoke(request);
    const endTime = Date.now();

    // Analyze response quality
    const scores = await this.scoreResponse(testCase, response);

    return {
      testCase,
      success: true,
      response: {
        text: response.text,
        tokens: response.tokens,
        model: response.model
      },
      latencyMs: endTime - startTime,
      costEstimateUsd: response.costEstimateUsd,
      scores,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Score response quality
   * @param {Object} testCase - Original test case
   * @param {Object} response - Model response
   * @returns {Object} Quality scores
   */
  async scoreResponse(testCase, response) {
    const scores = {
      exactMatch: 0,
      semanticSimilarity: 0, // Placeholder for future implementation
      hasExpectedTags: 0,
      responseLength: response.text.length,
      tokenEfficiency: 0
    };

    // Exact match scoring (for deterministic test cases)
    if (testCase.expectedOutput) {
      scores.exactMatch = response.text.trim() === testCase.expectedOutput.trim() ? 1 : 0;
    }

    // Expected tags checking
    if (testCase.expectedTags && testCase.expectedTags.length > 0) {
      const responseText = response.text.toLowerCase();
      const foundTags = testCase.expectedTags.filter(tag => 
        responseText.includes(tag.toLowerCase())
      );
      scores.hasExpectedTags = foundTags.length / testCase.expectedTags.length;
      scores.foundTags = foundTags;
      scores.missingTags = testCase.expectedTags.filter(tag => 
        !foundTags.includes(tag)
      );
    }

    // Token efficiency (tokens per character)
    if (response.tokens && response.tokens.output > 0) {
      scores.tokenEfficiency = response.text.length / response.tokens.output;
    }

    // Basic quality heuristics
    scores.isEmpty = response.text.trim().length === 0 ? 1 : 0;
    scores.isRepeated = this.detectRepetition(response.text) ? 1 : 0;
    scores.hasSpecialTokens = /[<>{}[\]]/g.test(response.text) ? 1 : 0;

    return scores;
  }

  /**
   * Detect repetitive text
   * @param {string} text - Text to analyze
   * @returns {boolean} True if repetitive
   */
  detectRepetition(text) {
    const words = text.split(/\s+/);
    if (words.length < 10) return false;
    
    // Check for repeated phrases
    const phrases = [];
    for (let i = 0; i < words.length - 2; i++) {
      const phrase = words.slice(i, i + 3).join(' ');
      phrases.push(phrase);
    }
    
    const uniquePhrases = new Set(phrases);
    return uniquePhrases.size / phrases.length < 0.8; // More than 20% repetition
  }

  /**
   * Analyze evaluation results
   * @param {string} model - Model name
   * @param {string} suiteName - Test suite name
   * @param {Array} results - Test results
   * @param {number} startTime - Start timestamp
   * @returns {Object} Analysis
   */
  async analyzeResults(model, suiteName, results, startTime) {
    const totalTime = Date.now() - startTime;
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    // Basic statistics
    const stats = {
      total: results.length,
      successful: successful.length,
      failed: failed.length,
      successRate: results.length > 0 ? successful.length / results.length : 0
    };

    // Latency analysis
    const latencies = successful.map(r => r.latencyMs);
    const latencyStats = {
      min: Math.min(...latencies),
      max: Math.max(...latencies),
      mean: latencies.reduce((a, b) => a + b, 0) / latencies.length || 0,
      median: this.median(latencies),
      p95: this.percentile(latencies, 95),
      p99: this.percentile(latencies, 99)
    };

    // Cost analysis
    const totalCost = results.reduce((sum, r) => sum + (r.costEstimateUsd || 0), 0);
    const costStats = {
      total: totalCost,
      average: totalCost / results.length,
      successful: successful.reduce((sum, r) => sum + (r.costEstimateUsd || 0), 0)
    };

    // Quality analysis
    const qualityScores = successful.map(r => r.scores);
    const qualityStats = {
      averageExactMatch: this.average(qualityScores.map(s => s.exactMatch)),
      averageTagMatch: this.average(qualityScores.map(s => s.hasExpectedTags)),
      averageTokenEfficiency: this.average(qualityScores.map(s => s.tokenEfficiency)),
      emptyResponses: qualityScores.filter(s => s.isEmpty).length,
      repetitiveResponses: qualityScores.filter(s => s.isRepeated).length
    };

    // Error analysis
    const errorStats = {};
    failed.forEach(r => {
      const errorClass = r.errorClass || 'Unknown';
      errorStats[errorClass] = (errorStats[errorClass] || 0) + 1;
    });

    return {
      metadata: {
        model,
        suiteName,
        timestamp: new Date().toISOString(),
        totalTimeMs: totalTime,
        evaluationVersion: '1.0.0'
      },
      stats,
      latency: latencyStats,
      cost: costStats,
      quality: qualityStats,
      errors: errorStats,
      results: results.map(r => ({
        id: r.testCase.id,
        success: r.success,
        latencyMs: r.latencyMs,
        costUsd: r.costEstimateUsd,
        scores: r.scores,
        error: r.error
      })),
      summary: {
        recommendation: this.generateRecommendation(stats, latencyStats, qualityStats, errorStats),
        qualityGrade: this.calculateQualityGrade(qualityStats, stats.successRate),
        performanceGrade: this.calculatePerformanceGrade(latencyStats, costStats)
      }
    };
  }

  /**
   * Generate recommendations based on results
   */
  generateRecommendation(stats, latency, quality, errors) {
    const issues = [];
    const improvements = [];

    if (stats.successRate < 0.9) {
      issues.push(`Low success rate: ${(stats.successRate * 100).toFixed(1)}%`);
      improvements.push('Investigate and fix error causes');
    }

    if (latency.mean > 5000) {
      issues.push(`High average latency: ${latency.mean.toFixed(0)}ms`);
      improvements.push('Consider optimizing model configuration or endpoint setup');
    }

    if (quality.averageTagMatch < 0.8) {
      issues.push(`Low tag matching: ${(quality.averageTagMatch * 100).toFixed(1)}%`);
      improvements.push('Review prompt engineering and model instructions');
    }

    if (quality.emptyResponses > 0) {
      issues.push(`${quality.emptyResponses} empty responses detected`);
      improvements.push('Investigate input validation and model behavior');
    }

    return {
      issues,
      improvements,
      overallAssessment: issues.length === 0 ? 'Model performing well' : 'Model needs attention'
    };
  }

  calculateQualityGrade(quality, successRate) {
    const score = (
      successRate * 0.4 +
      quality.averageTagMatch * 0.3 +
      quality.averageTokenEfficiency * 0.1 +
      (1 - quality.emptyResponses / 100) * 0.1 +
      (1 - quality.repetitiveResponses / 100) * 0.1
    ) * 100;

    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  calculatePerformanceGrade(latency, cost) {
    // Simple performance grading based on latency and cost efficiency
    const latencyScore = latency.mean < 1000 ? 100 : Math.max(0, 100 - (latency.mean - 1000) / 100);
    const costScore = cost.average < 0.01 ? 100 : Math.max(0, 100 - (cost.average - 0.01) * 1000);
    
    const overallScore = (latencyScore + costScore) / 2;
    
    if (overallScore >= 90) return 'A';
    if (overallScore >= 80) return 'B';
    if (overallScore >= 70) return 'C';
    if (overallScore >= 60) return 'D';
    return 'F';
  }

  /**
   * Save evaluation report
   * @param {Object} evaluation - Evaluation results
   * @param {Object} options - Save options
   */
  async saveReport(evaluation, options = {}) {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${timestamp}_${evaluation.metadata.model.replace(/[^a-zA-Z0-9]/g, '_')}_${evaluation.metadata.suiteName}`;
    
    // Save JSON report
    const jsonPath = path.join(this.reportsPath, `${filename}.json`);
    await fs.writeFile(jsonPath, JSON.stringify(evaluation, null, 2));
    
    // Generate and save Markdown report
    const markdownPath = path.join(this.reportsPath, `${filename}.md`);
    const markdown = this.generateMarkdownReport(evaluation);
    await fs.writeFile(markdownPath, markdown);
    
    this.log(`📄 Reports saved: ${jsonPath}, ${markdownPath}`);
    
    return {
      jsonPath,
      markdownPath
    };
  }

  /**
   * Generate Markdown report
   * @param {Object} evaluation - Evaluation results
   * @returns {string} Markdown content
   */
  generateMarkdownReport(evaluation) {
    const { metadata, stats, latency, cost, quality, errors, summary } = evaluation;
    
    return `# AI Model Evaluation Report

## Overview
- **Model**: ${metadata.model}
- **Test Suite**: ${metadata.suiteName}
- **Date**: ${metadata.timestamp}
- **Total Time**: ${metadata.totalTimeMs}ms
- **Quality Grade**: ${summary.qualityGrade}
- **Performance Grade**: ${summary.performanceGrade}

## Results Summary
- **Total Tests**: ${stats.total}
- **Successful**: ${stats.successful} (${(stats.successRate * 100).toFixed(1)}%)
- **Failed**: ${stats.failed}

## Performance Metrics

### Latency
- **Average**: ${latency.mean.toFixed(0)}ms
- **Median**: ${latency.median.toFixed(0)}ms
- **95th percentile**: ${latency.p95.toFixed(0)}ms
- **99th percentile**: ${latency.p99.toFixed(0)}ms

### Cost
- **Total**: $${cost.total.toFixed(6)}
- **Average per request**: $${cost.average.toFixed(6)}

## Quality Metrics
- **Average Tag Matching**: ${(quality.averageTagMatch * 100).toFixed(1)}%
- **Token Efficiency**: ${quality.averageTokenEfficiency.toFixed(2)} chars/token
- **Empty Responses**: ${quality.emptyResponses}
- **Repetitive Responses**: ${quality.repetitiveResponses}

## Error Analysis
${Object.entries(errors).length > 0 ? 
  Object.entries(errors).map(([type, count]) => `- **${type}**: ${count}`).join('\n') :
  'No errors detected'
}

## Recommendations

### Issues Identified
${summary.recommendation.issues.length > 0 ?
  summary.recommendation.issues.map(issue => `- ${issue}`).join('\n') :
  'No significant issues identified'
}

### Suggested Improvements
${summary.recommendation.improvements.length > 0 ?
  summary.recommendation.improvements.map(improvement => `- ${improvement}`).join('\n') :
  'Model is performing optimally'
}

## Overall Assessment
${summary.recommendation.overallAssessment}

---
*Generated by EchoTune AI Model Evaluation Harness v${metadata.evaluationVersion}*
`;
  }

  // Utility methods
  median(values) {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }

  percentile(values, p) {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  average(values) {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  log(message) {
    if (this.verbose || message.includes('✅') || message.includes('❌') || message.includes('🧪')) {
      console.log(message);
    }
  }
}

module.exports = ModelEvaluationHarness;
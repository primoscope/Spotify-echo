#!/usr/bin/env node

/**
 * Advanced Trigger Processor for Natural Language Perplexity Integration
 * 
 * This script automatically detects and processes natural language triggers
 * like "use perplexity grok-4" and "research with sonar-pro" to configure
 * optimal workflows for coding agents.
 * 
 * Features:
 * - Pattern recognition for natural language triggers
 * - Intelligent model selection based on context
 * - Automatic workflow optimization
 * - Performance tracking and learning
 */

const fs = require('fs').promises;
const path = require('path');

class TriggerProcessor {
  constructor() {
    this.triggerPatterns = [
      // Direct model selection patterns
      {
        pattern: /use\s+perplexity\s+(grok-4|sonar-pro|gpt-5|sonar-reasoning-pro|sonar-small)\s*(?:for|to)?\s*(.*)?$/i,
        type: 'direct_selection',
        priority: 10
      },
      
      // Task-specific patterns
      {
        pattern: /(debug|troubleshoot|fix|analyze)\s+(?:this\s+)?(?:with|using)\s+perplexity\s+([\w-]+)/i,
        type: 'debugging',
        priority: 9
      },
      
      // Research patterns
      {
        pattern: /research\s+(.+?)\s+(?:with|using)\s+perplexity\s+([\w-]+)/i,
        type: 'research',
        priority: 9
      },
      
      // Code review patterns
      {
        pattern: /(review|analyze)\s+(?:this\s+)?(?:code\s+)?(?:with|using)\s+perplexity\s+([\w-]+)/i,
        type: 'code_review',
        priority: 8
      },
      
      // Optimization patterns
      {
        pattern: /optimize\s+(?:for\s+)?(.+?)\s+(?:with|using)\s+perplexity\s+([\w-]+)/i,
        type: 'optimization',
        priority: 8
      },
      
      // Comparison patterns
      {
        pattern: /compare\s+models?\s+(?:for|on)\s+(.+)/i,
        type: 'comparison',
        priority: 7
      },
      
      // Workflow generation patterns
      {
        pattern: /(?:create|generate|build)\s+(?:a\s+)?workflow\s+(?:for|to)\s+(.+?)(?:\s+with\s+perplexity\s+([\w-]+))?/i,
        type: 'workflow_generation',
        priority: 6
      }
    ];

    // Performance tracking
    this.processingMetrics = {
      totalProcessed: 0,
      successfulMatches: 0,
      failedMatches: 0,
      averageProcessingTime: 0,
      triggerTypeDistribution: {}
    };

    // Context analysis patterns
    this.contextPatterns = {
      programming_languages: [
        'javascript', 'python', 'java', 'typescript', 'go', 'rust', 'c++', 'c#',
        'php', 'ruby', 'swift', 'kotlin', 'scala', 'r', 'matlab'
      ],
      frameworks: [
        'react', 'vue', 'angular', 'nodejs', 'express', 'django', 'flask',
        'spring', 'rails', 'laravel', 'nextjs', 'nuxtjs'
      ],
      complexity_indicators: {
        simple: ['quick', 'simple', 'basic', 'easy'],
        moderate: ['standard', 'regular', 'normal', 'typical'],
        complex: ['complex', 'advanced', 'sophisticated', 'detailed'],
        enterprise: ['enterprise', 'production', 'scalable', 'critical']
      }
    };
  }

  async processTrigger(input, context = {}) {
    const startTime = Date.now();
    
    try {
      const trigger = await this.detectTrigger(input);
      if (!trigger) {
        this.processingMetrics.failedMatches++;
        return null;
      }

      const enrichedContext = await this.analyzeContext(input, context);
      const workflow = await this.generateOptimizedWorkflow(trigger, enrichedContext);
      const configuration = await this.buildConfiguration(workflow, trigger);
      
      this.processingMetrics.successfulMatches++;
      this.updateMetrics(trigger.type, Date.now() - startTime);
      
      return {
        trigger,
        workflow,
        configuration,
        processingTime: Date.now() - startTime,
        confidence: this.calculateConfidence(trigger, enrichedContext)
      };
      
    } catch (error) {
      this.processingMetrics.failedMatches++;
      console.error('Trigger processing error:', error);
      return { error: error.message };
    } finally {
      this.processingMetrics.totalProcessed++;
    }
  }

  async detectTrigger(input) {
    const normalizedInput = input.toLowerCase().trim();
    
    // Sort patterns by priority for better matching
    const sortedPatterns = this.triggerPatterns.sort((a, b) => b.priority - a.priority);
    
    for (const patternConfig of sortedPatterns) {
      const match = normalizedInput.match(patternConfig.pattern);
      
      if (match) {
        return {
          type: patternConfig.type,
          pattern: patternConfig.pattern.source,
          matches: match,
          model: this.extractModel(match),
          query: this.extractQuery(match, patternConfig.type),
          priority: patternConfig.priority,
          confidence: this.calculatePatternConfidence(match, patternConfig)
        };
      }
    }
    
    return null;
  }

  extractModel(match) {
    // Look for model names in the match
    const modelNames = ['grok-4', 'sonar-pro', 'gpt-5', 'sonar-reasoning-pro', 'sonar-small'];
    
    for (const fragment of match) {
      if (typeof fragment === 'string') {
        const normalizedFragment = fragment.toLowerCase();
        for (const model of modelNames) {
          if (normalizedFragment.includes(model)) {
            return model;
          }
        }
      }
    }
    
    return 'sonar-pro'; // Default model
  }

  extractQuery(match, type) {
    // Extract the main query/task from the match based on type
    const queryMappings = {
      direct_selection: match[2] || match[1],
      debugging: match[0],
      research: match[1],
      code_review: match[0],
      optimization: match[1],
      comparison: match[1],
      workflow_generation: match[1]
    };
    
    return queryMappings[type] || match[0];
  }

  async analyzeContext(input, context) {
    const analysis = {
      ...context,
      detectedLanguages: this.detectProgrammingLanguages(input),
      detectedFrameworks: this.detectFrameworks(input),
      complexityLevel: this.assessComplexity(input),
      codePresent: this.detectCodeInInput(input),
      urgencyLevel: this.detectUrgency(input)
    };

    return analysis;
  }

  detectProgrammingLanguages(input) {
    const detected = [];
    const normalizedInput = input.toLowerCase();
    
    for (const lang of this.contextPatterns.programming_languages) {
      if (normalizedInput.includes(lang)) {
        detected.push(lang);
      }
    }
    
    return detected;
  }

  detectFrameworks(input) {
    const detected = [];
    const normalizedInput = input.toLowerCase();
    
    for (const framework of this.contextPatterns.frameworks) {
      if (normalizedInput.includes(framework)) {
        detected.push(framework);
      }
    }
    
    return detected;
  }

  assessComplexity(input) {
    const normalizedInput = input.toLowerCase();
    
    for (const [level, indicators] of Object.entries(this.contextPatterns.complexity_indicators)) {
      for (const indicator of indicators) {
        if (normalizedInput.includes(indicator)) {
          return level;
        }
      }
    }
    
    // Default complexity assessment based on input length and technical terms
    const technicalTermCount = this.countTechnicalTerms(input);
    const inputLength = input.length;
    
    if (inputLength > 200 || technicalTermCount > 5) return 'complex';
    if (inputLength > 100 || technicalTermCount > 3) return 'moderate';
    return 'simple';
  }

  countTechnicalTerms(input) {
    const technicalTerms = [
      'api', 'database', 'algorithm', 'architecture', 'microservices', 'performance',
      'optimization', 'security', 'authentication', 'authorization', 'deployment',
      'scalability', 'async', 'await', 'promise', 'callback', 'middleware'
    ];
    
    const normalizedInput = input.toLowerCase();
    return technicalTerms.filter(term => normalizedInput.includes(term)).length;
  }

  detectCodeInInput(input) {
    // Simple heuristic to detect code presence
    const codePatterns = [
      /\{[\s\S]*\}/,  // Curly braces
      /function\s+\w+/,  // Function declarations
      /const\s+\w+\s*=/,  // Variable declarations
      /import\s+.*from/,  // Import statements
      /class\s+\w+/,  // Class declarations
      /```[\s\S]*```/  // Code blocks
    ];
    
    return codePatterns.some(pattern => pattern.test(input));
  }

  detectUrgency(input) {
    const urgentKeywords = ['urgent', 'asap', 'emergency', 'critical', 'immediately', 'now'];
    const normalizedInput = input.toLowerCase();
    
    return urgentKeywords.some(keyword => normalizedInput.includes(keyword)) ? 'high' : 'normal';
  }

  async generateOptimizedWorkflow(trigger, context) {
    const baseWorkflow = this.getBaseWorkflow(trigger.type);
    const optimizations = this.calculateOptimizations(trigger, context);
    
    return {
      ...baseWorkflow,
      model: this.selectOptimalModel(trigger, context),
      parameters: this.optimizeParameters(trigger, context, baseWorkflow.parameters),
      optimizations,
      estimatedCost: this.estimateCost(trigger, context),
      estimatedLatency: this.estimateLatency(trigger, context)
    };
  }

  calculateOptimizations(trigger, context) {
    const optimizations = [];
    
    // Model-specific optimizations
    if (trigger.model === 'grok-4') {
      optimizations.push('advanced_reasoning_enabled');
    }
    
    // Context-based optimizations
    if (context.codePresent) {
      optimizations.push('code_analysis_mode');
    }
    
    if (context.urgencyLevel === 'high') {
      optimizations.push('fast_response_priority');
    }
    
    if (context.complexityLevel === 'enterprise') {
      optimizations.push('comprehensive_analysis');
    }
    
    return optimizations;
  }

  getBaseWorkflow(type) {
    const workflows = {
      direct_selection: {
        type: 'direct_selection',
        parameters: { temperature: 0.1, max_tokens: 2000 },
        workflow_steps: ['execute_query', 'validate_response', 'format_output']
      },
      
      debugging: {
        type: 'debugging',
        parameters: { temperature: 0.05, max_tokens: 2500 },
        workflow_steps: [
          'analyze_problem',
          'identify_patterns',
          'research_solutions',
          'generate_recommendations',
          'provide_implementation'
        ]
      },
      
      research: {
        type: 'research',
        parameters: { temperature: 0.1, max_tokens: 3000 },
        workflow_steps: [
          'understand_query',
          'search_knowledge_base',
          'analyze_sources',
          'synthesize_findings',
          'provide_summary'
        ]
      },
      
      code_review: {
        type: 'code_review',
        parameters: { temperature: 0.1, max_tokens: 2800 },
        workflow_steps: [
          'analyze_code_structure',
          'identify_issues',
          'assess_security',
          'evaluate_performance',
          'provide_recommendations'
        ]
      },
      
      comparison: {
        type: 'comparison',
        parameters: { temperature: 0.1, max_tokens: 3500 },
        workflow_steps: [
          'execute_parallel_queries',
          'collect_metrics',
          'analyze_performance',
          'compare_results',
          'generate_recommendations'
        ]
      }
    };
    
    return workflows[type] || workflows.direct_selection;
  }

  selectOptimalModel(trigger, context) {
    // If model is explicitly specified, use it (with validation)
    if (trigger.model && this.isValidModel(trigger.model)) {
      return trigger.model;
    }
    
    // Intelligent model selection based on context
    const selectionCriteria = {
      complexity: context.complexityLevel,
      urgency: context.urgencyLevel,
      codePresent: context.codePresent,
      type: trigger.type
    };
    
    return this.calculateOptimalModel(selectionCriteria);
  }

  calculateOptimalModel(criteria) {
    // Complex model selection logic
    if (criteria.urgency === 'high' && criteria.complexity === 'simple') {
      return 'sonar-small'; // Fast response for urgent simple queries
    }
    
    if (criteria.type === 'debugging' && criteria.complexity === 'complex') {
      return 'grok-4'; // Advanced reasoning for complex debugging
    }
    
    if (criteria.type === 'comparison') {
      return 'GPT-5'; // Best quality for model comparisons
    }
    
    if (criteria.complexity === 'enterprise') {
      return 'GPT-5'; // Premium model for enterprise tasks
    }
    
    if (criteria.complexity === 'complex') {
      return 'grok-4'; // Good balance for complex tasks
    }
    
    return 'sonar-pro'; // Default balanced choice
  }

  optimizeParameters(trigger, context, baseParameters) {
    let optimizedParams = { ...baseParameters };
    
    // Adjust based on complexity
    if (context.complexityLevel === 'simple') {
      optimizedParams.max_tokens = Math.round(optimizedParams.max_tokens * 0.7);
    } else if (context.complexityLevel === 'enterprise') {
      optimizedParams.max_tokens = Math.round(optimizedParams.max_tokens * 1.4);
    }
    
    // Adjust based on urgency
    if (context.urgencyLevel === 'high') {
      optimizedParams.temperature += 0.05; // Slightly more creative for faster response
      optimizedParams.max_tokens = Math.round(optimizedParams.max_tokens * 0.8);
    }
    
    // Adjust based on code presence
    if (context.codePresent) {
      optimizedParams.temperature = Math.max(0.05, optimizedParams.temperature - 0.05); // More precise for code
    }
    
    return optimizedParams;
  }

  estimateCost(trigger, context) {
    const modelCosts = {
      'grok-4': 0.005,
      'sonar-pro': 0.003,
      'GPT-5': 0.008,
      'sonar-reasoning-pro': 0.004,
      'sonar-small': 0.002
    };
    
    const selectedModel = this.selectOptimalModel(trigger, context);
    const baseParams = this.getBaseWorkflow(trigger.type).parameters;
    const costPerToken = modelCosts[selectedModel] || 0.003;
    
    return (baseParams.max_tokens / 1000) * costPerToken;
  }

  estimateLatency(trigger, context) {
    const modelLatencies = {
      'grok-4': 2800,
      'sonar-pro': 1900,
      'GPT-5': 4100,
      'sonar-reasoning-pro': 2200,
      'sonar-small': 1200
    };
    
    const selectedModel = this.selectOptimalModel(trigger, context);
    const baseLatency = modelLatencies[selectedModel] || 2000;
    
    // Adjust based on complexity
    const complexityMultiplier = {
      simple: 0.8,
      moderate: 1.0,
      complex: 1.3,
      enterprise: 1.6
    };
    
    return Math.round(baseLatency * (complexityMultiplier[context.complexityLevel] || 1.0));
  }

  calculateConfidence(trigger, context) {
    let confidence = trigger.confidence || 0.5;
    
    // Increase confidence based on explicit model specification
    if (trigger.model) confidence += 0.3;
    
    // Increase confidence based on context clarity
    if (context.detectedLanguages.length > 0) confidence += 0.1;
    if (context.detectedFrameworks.length > 0) confidence += 0.1;
    if (context.codePresent) confidence += 0.1;
    
    return Math.min(1.0, confidence);
  }

  calculatePatternConfidence(match, patternConfig) {
    // Base confidence from pattern priority
    let confidence = patternConfig.priority / 10;
    
    // Increase confidence based on match quality
    if (match.length > 2) confidence += 0.1; // More capture groups
    if (match[0].length > 20) confidence += 0.1; // Longer match
    
    return Math.min(1.0, confidence);
  }

  isValidModel(model) {
    const validModels = ['grok-4', 'sonar-pro', 'gpt-5', 'sonar-reasoning-pro', 'sonar-small'];
    return validModels.includes(model.toLowerCase());
  }

  updateMetrics(triggerType, processingTime) {
    // Update trigger type distribution
    this.processingMetrics.triggerTypeDistribution[triggerType] = 
      (this.processingMetrics.triggerTypeDistribution[triggerType] || 0) + 1;
    
    // Update average processing time
    const total = this.processingMetrics.totalProcessed;
    const currentAvg = this.processingMetrics.averageProcessingTime;
    this.processingMetrics.averageProcessingTime = 
      ((currentAvg * (total - 1)) + processingTime) / total;
  }

  async buildConfiguration(workflow, trigger) {
    return {
      server_config: {
        model: workflow.model,
        parameters: workflow.parameters,
        workflow_type: workflow.type,
        estimated_cost: workflow.estimatedCost,
        estimated_latency: workflow.estimatedLatency
      },
      
      execution_plan: {
        steps: workflow.workflow_steps,
        optimizations: workflow.optimizations,
        fallback_model: this.getFallbackModel(workflow.model),
        timeout_ms: workflow.estimatedLatency * 2 // 2x estimated latency as timeout
      },
      
      monitoring: {
        track_performance: true,
        collect_feedback: true,
        enable_caching: true,
        log_level: 'info'
      }
    };
  }

  getFallbackModel(primaryModel) {
    const fallbacks = {
      'GPT-5': 'grok-4',
      'grok-4': 'sonar-pro',
      'sonar-pro': 'sonar-small',
      'sonar-reasoning-pro': 'sonar-pro',
      'sonar-small': 'sonar-pro'
    };
    
    return fallbacks[primaryModel] || 'sonar-pro';
  }

  getMetrics() {
    return {
      ...this.processingMetrics,
      successRate: this.processingMetrics.totalProcessed > 0 
        ? (this.processingMetrics.successfulMatches / this.processingMetrics.totalProcessed)
        : 0,
      averageProcessingTimeMs: Math.round(this.processingMetrics.averageProcessingTime)
    };
  }

  // CLI Interface
  static async cli() {
    if (process.argv.length < 3) {
      console.log('Usage: node trigger-processor.js "your trigger text here"');
      console.log('Example: node trigger-processor.js "use perplexity grok-4 to debug this authentication issue"');
      return;
    }
    
    const processor = new TriggerProcessor();
    const input = process.argv.slice(2).join(' ');
    
    console.log('🔍 Processing trigger:', input);
    console.log('⏳ Analyzing...\n');
    
    const result = await processor.processTrigger(input);
    
    if (result && !result.error) {
      console.log('✅ Successfully processed trigger!\n');
      console.log('📊 Analysis Results:');
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log('❌ Failed to process trigger');
      if (result?.error) {
        console.log('Error:', result.error);
      }
    }
    
    console.log('\n📈 Processing Metrics:');
    console.log(JSON.stringify(processor.getMetrics(), null, 2));
  }
}

// Export for use as module
module.exports = TriggerProcessor;

// Run CLI if called directly
if (require.main === module) {
  TriggerProcessor.cli().catch(console.error);
}
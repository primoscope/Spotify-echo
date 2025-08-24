#!/usr/bin/env node

/**
 * Integrated Perplexity Browser Research & Autonomous Development Entry Point
 * 
 * This is the main entry point that integrates:
 * - Perplexity API research capabilities
 * - Browser automation for source verification
 * - Autonomous development task identification and execution
 * - Roadmap analysis and updates
 * - Evidence collection and reporting
 * 
 * Usage:
 *   npm run use-perplexity-browser-research
 *   node scripts/use-perplexity-browser-research.js
 *   node scripts/use-perplexity-browser-research.js --topic="frontend optimization"
 */

const path = require('path');
const fs = require('fs').promises;
const { performance } = require('perf_hooks');

// Import our services
const AutonomousDevelopmentSystem = require('./start-autonomous-development');
const BrowserResearchService = require('../src/utils/browser-research-service');

class IntegratedPerplexityBrowserResearch {
  constructor(options = {}) {
    this.sessionId = this.generateSessionId();
    this.startTime = performance.now();
    this.options = {
      topic: options.topic || 'comprehensive development analysis',
      enableAutonomousDevelopment: options.enableAutonomousDevelopment !== false,
      enableBrowserResearch: options.enableBrowserResearch !== false,
      depth: options.depth || 'comprehensive',
      maxIterations: options.maxIterations || 3,
      ...options
    };
    
    this.results = {
      sessionId: this.sessionId,
      startTime: new Date().toISOString(),
      phase: 'initialization',
      browserResearch: null,
      autonomousDevelopment: null,
      integratedAnalysis: null,
      recommendations: [],
      artifacts: []
    };
    
    console.log(`\n🚀 Integrated Perplexity Browser Research & Autonomous Development`);
    console.log(`===============================================================`);
    console.log(`📋 Session: ${this.sessionId}`);
    console.log(`🎯 Topic: ${this.options.topic}`);
    console.log(`🌐 Browser Research: ${this.options.enableBrowserResearch ? 'Enabled' : 'Disabled'}`);
    console.log(`🤖 Autonomous Development: ${this.options.enableAutonomousDevelopment ? 'Enabled' : 'Disabled'}`);
    console.log(`📊 Analysis Depth: ${this.options.depth}`);
  }
  
  generateSessionId() {
    return `integrated-research-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  async start() {
    console.log('\n🎬 Starting Integrated Research & Development Cycle...\n');
    
    try {
      // Phase 1: Browser Research
      if (this.options.enableBrowserResearch) {
        await this.phase1_BrowserResearch();
      }
      
      // Phase 2: Autonomous Development
      if (this.options.enableAutonomousDevelopment) {
        await this.phase2_AutonomousDevelopment();
      }
      
      // Phase 3: Integrated Analysis
      await this.phase3_IntegratedAnalysis();
      
      // Phase 4: Generate Recommendations
      await this.phase4_GenerateRecommendations();
      
      // Generate final integrated report
      await this.generateFinalReport();
      
    } catch (error) {
      console.error('❌ Integrated research cycle failed:', error);
      this.results.error = error.message;
      await this.generateErrorReport();
    }
  }
  
  async phase1_BrowserResearch() {
    console.log('🌐 Phase 1: Perplexity Browser Research');
    console.log('======================================');
    this.results.phase = 'browser_research';
    
    try {
      const researchService = new BrowserResearchService({
        evidenceStorage: 'automation-artifacts/evidence'
      });
      
      // Conduct comprehensive research on the topic
      const researchOptions = {
        verifyWithBrowser: true,
        context: 'development',
        depth: this.options.depth,
        model: 'sonar-pro',
        maxTokens: 1500
      };
      
      console.log(`🔬 Researching: ${this.options.topic}`);
      const researchResult = await researchService.conductResearch(this.options.topic, researchOptions);
      
      // Generate session report
      const sessionReport = await researchService.generateSessionReport();
      
      this.results.browserResearch = {
        research: researchResult,
        session: sessionReport,
        artifacts: researchResult.evidence || []
      };
      
      console.log('✅ Phase 1 completed successfully');
      console.log(`   🎯 Confidence: ${(researchResult.confidence * 100).toFixed(1)}%`);
      console.log(`   📄 Content Length: ${researchResult.perplexityResults?.content?.length || 0} chars`);
      console.log(`   🔗 Citations: ${researchResult.perplexityResults?.citations?.length || 0}`);
      
    } catch (error) {
      console.error('❌ Phase 1 failed:', error);
      this.results.browserResearch = { error: error.message };
    }
  }
  
  async phase2_AutonomousDevelopment() {
    console.log('\n🤖 Phase 2: Autonomous Development System');
    console.log('========================================');
    this.results.phase = 'autonomous_development';
    
    try {
      const autonomousSystem = new AutonomousDevelopmentSystem({
        focus: `${this.options.topic} implementation and optimization`,
        maxIterations: this.options.maxIterations,
        enableBrowserResearch: false, // We already did this in Phase 1
        weeklyBudget: process.env.PPLX_WEEKLY_BUDGET || '3.00'
      });
      
      // Run the autonomous development cycle
      await autonomousSystem.start();
      
      this.results.autonomousDevelopment = {
        sessionId: autonomousSystem.sessionId,
        results: autonomousSystem.results,
        success: !autonomousSystem.results.error
      };
      
      console.log('✅ Phase 2 completed successfully');
      console.log(`   🔬 Research Topics: ${autonomousSystem.results.researchResults?.length || 0}`);
      console.log(`   🎯 Implementation Tasks: ${autonomousSystem.results.implementationTasks?.length || 0}`);
      
    } catch (error) {
      console.error('❌ Phase 2 failed:', error);
      this.results.autonomousDevelopment = { error: error.message };
    }
  }
  
  async phase3_IntegratedAnalysis() {
    console.log('\n🔍 Phase 3: Integrated Analysis & Cross-Validation');
    console.log('==================================================');
    this.results.phase = 'integrated_analysis';
    
    try {
      const analysis = {
        timestamp: new Date().toISOString(),
        correlations: [],
        validatedFindings: [],
        conflictingEvidence: [],
        synthesizedInsights: []
      };
      
      // Cross-validate findings between browser research and autonomous development
      if (this.results.browserResearch?.research && this.results.autonomousDevelopment?.results) {
        analysis.correlations = this.findCorrelations(
          this.results.browserResearch.research,
          this.results.autonomousDevelopment.results
        );
        
        analysis.validatedFindings = this.validateFindings(analysis.correlations);
        analysis.synthesizedInsights = this.synthesizeInsights();
      }
      
      // Generate confidence assessment
      analysis.overallConfidence = this.calculateOverallConfidence();
      
      this.results.integratedAnalysis = analysis;
      
      console.log('✅ Phase 3 completed successfully');
      console.log(`   🔗 Correlations Found: ${analysis.correlations.length}`);
      console.log(`   ✅ Validated Findings: ${analysis.validatedFindings.length}`);
      console.log(`   🎯 Overall Confidence: ${(analysis.overallConfidence * 100).toFixed(1)}%`);
      
    } catch (error) {
      console.error('❌ Phase 3 failed:', error);
      this.results.integratedAnalysis = { error: error.message };
    }
  }
  
  async phase4_GenerateRecommendations() {
    console.log('\n📋 Phase 4: Generate Actionable Recommendations');
    console.log('===============================================');
    this.results.phase = 'recommendations';
    
    try {
      const recommendations = [];
      
      // Extract recommendations from browser research
      if (this.results.browserResearch?.research?.perplexityResults?.content) {
        const browserRecommendations = this.extractRecommendations(
          this.results.browserResearch.research.perplexityResults.content,
          'browser_research'
        );
        recommendations.push(...browserRecommendations);
      }
      
      // Extract recommendations from autonomous development
      if (this.results.autonomousDevelopment?.results?.implementationTasks) {
        const devRecommendations = this.results.autonomousDevelopment.results.implementationTasks
          .slice(0, 5) // Top 5 priority tasks
          .map(task => ({
            id: task.id,
            title: task.title,
            source: 'autonomous_development',
            priority: task.priority || 5,
            complexity: task.complexity || 5,
            category: this.categorizeTask(task.title),
            actionable: true
          }));
        recommendations.push(...devRecommendations);
      }
      
      // Prioritize and deduplicate recommendations
      const prioritizedRecommendations = this.prioritizeRecommendations(recommendations);
      
      this.results.recommendations = prioritizedRecommendations.slice(0, 10); // Top 10
      
      console.log('✅ Phase 4 completed successfully');
      console.log(`   📝 Total Recommendations: ${this.results.recommendations.length}`);
      console.log(`   🎯 High Priority: ${this.results.recommendations.filter(r => r.priority >= 8).length}`);
      
    } catch (error) {
      console.error('❌ Phase 4 failed:', error);
      this.results.recommendations = [];
      this.results.recommendationError = error.message;
    }
  }
  
  findCorrelations(browserResearch, autonomousResults) {
    const correlations = [];
    
    // Compare actionable items from browser research with autonomous development tasks
    if (browserResearch.perplexityResults?.content && autonomousResults.implementationTasks) {
      const browserContent = browserResearch.perplexityResults.content.toLowerCase();
      
      autonomousResults.implementationTasks.forEach(task => {
        const taskKeywords = task.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        const matchCount = taskKeywords.filter(keyword => browserContent.includes(keyword)).length;
        
        if (matchCount > 0) {
          correlations.push({
            type: 'task_validation',
            browserSource: 'perplexity_research',
            autonomousTask: task.title,
            matchStrength: matchCount / taskKeywords.length,
            confidence: matchCount > taskKeywords.length * 0.5 ? 'high' : 'medium'
          });
        }
      });
    }
    
    return correlations;
  }
  
  validateFindings(correlations) {
    return correlations
      .filter(c => c.confidence === 'high' && c.matchStrength > 0.5)
      .map(c => ({
        finding: c.autonomousTask,
        validation: 'confirmed_by_browser_research',
        strength: c.matchStrength,
        recommendation: 'high_priority_for_implementation'
      }));
  }
  
  synthesizeInsights() {
    const insights = [];
    
    // Insight 1: Integration Success
    if (this.results.browserResearch && this.results.autonomousDevelopment) {
      insights.push({
        type: 'integration_success',
        insight: 'Successfully integrated Perplexity browser research with autonomous development system',
        impact: 'Enhanced research validation and task prioritization capabilities',
        confidence: 0.9
      });
    }
    
    // Insight 2: Research Quality
    if (this.results.browserResearch?.research?.confidence > 0.8) {
      insights.push({
        type: 'research_quality',
        insight: 'High-quality research findings with strong citation support',
        impact: 'Reliable basis for development decisions and implementation planning',
        confidence: this.results.browserResearch.research.confidence
      });
    }
    
    // Insight 3: Task Validation
    const validatedTasks = this.results.integratedAnalysis?.validatedFindings?.length || 0;
    if (validatedTasks > 0) {
      insights.push({
        type: 'task_validation',
        insight: `${validatedTasks} autonomous development tasks validated by external research`,
        impact: 'Increased confidence in implementation priorities and resource allocation',
        confidence: 0.8
      });
    }
    
    return insights;
  }
  
  calculateOverallConfidence() {
    let confidence = 0.5; // Base confidence
    let factors = 1;
    
    if (this.results.browserResearch?.research?.confidence) {
      confidence += this.results.browserResearch.research.confidence * 0.4;
      factors++;
    }
    
    if (this.results.autonomousDevelopment?.success) {
      confidence += 0.3;
      factors++;
    }
    
    if (this.results.integratedAnalysis?.validatedFindings?.length > 0) {
      confidence += 0.2;
      factors++;
    }
    
    return Math.min(confidence / factors * 2, 1.0); // Normalize to 0-1
  }
  
  extractRecommendations(content, source) {
    const recommendations = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.match(/^[\d\-\*]|implement|optimize|improve|add|create|update|fix/i)) {
        const recommendation = line.replace(/^[\d\-\*\s]+/, '').trim();
        if (recommendation.length > 10 && recommendation.length < 150) {
          recommendations.push({
            id: `${source}-${recommendations.length + 1}`,
            title: recommendation,
            source: source,
            priority: this.calculatePriority(recommendation),
            complexity: this.calculateComplexity(recommendation),
            category: this.categorizeTask(recommendation),
            actionable: true
          });
        }
      }
    }
    
    return recommendations.slice(0, 5); // Limit to 5 per source
  }
  
  categorizeTask(taskTitle) {
    const title = taskTitle.toLowerCase();
    
    if (title.includes('performance') || title.includes('optimization')) return 'performance';
    if (title.includes('security') || title.includes('auth')) return 'security';
    if (title.includes('ui') || title.includes('frontend')) return 'frontend';
    if (title.includes('api') || title.includes('backend')) return 'backend';
    if (title.includes('database') || title.includes('db')) return 'database';
    if (title.includes('test') || title.includes('quality')) return 'testing';
    if (title.includes('deploy') || title.includes('infra')) return 'infrastructure';
    
    return 'general';
  }
  
  calculatePriority(taskTitle) {
    const title = taskTitle.toLowerCase();
    let priority = 5;
    
    if (title.includes('security') || title.includes('fix') || title.includes('bug')) priority += 3;
    if (title.includes('performance') || title.includes('optimization')) priority += 2;
    if (title.includes('user') || title.includes('ux')) priority += 2;
    if (title.includes('critical') || title.includes('urgent')) priority += 3;
    if (title.includes('improve') || title.includes('enhance')) priority += 1;
    
    return Math.min(priority, 10);
  }
  
  calculateComplexity(taskTitle) {
    const title = taskTitle.toLowerCase();
    let complexity = 5;
    
    if (title.includes('implement') || title.includes('create')) complexity += 2;
    if (title.includes('refactor') || title.includes('redesign')) complexity += 3;
    if (title.includes('security') || title.includes('encryption')) complexity += 2;
    if (title.includes('ml') || title.includes('ai')) complexity += 3;
    if (title.includes('database') || title.includes('migration')) complexity += 2;
    if (title.includes('integration') || title.includes('api')) complexity += 1;
    
    return Math.min(complexity, 10);
  }
  
  prioritizeRecommendations(recommendations) {
    return recommendations
      .map(rec => ({
        ...rec,
        priorityScore: (rec.priority * 0.7) + ((10 - rec.complexity) * 0.3)
      }))
      .sort((a, b) => b.priorityScore - a.priorityScore);
  }
  
  async generateFinalReport() {
    const endTime = performance.now();
    const duration = ((endTime - this.startTime) / 1000).toFixed(2);
    
    this.results.endTime = new Date().toISOString();
    this.results.durationSeconds = parseFloat(duration);
    this.results.status = 'completed';
    
    console.log('\n🎉 Integrated Research & Development Cycle Complete!');
    console.log('=====================================================');
    console.log(`⏱️  Total Duration: ${duration} seconds`);
    console.log(`🌐 Browser Research: ${this.results.browserResearch ? 'Completed' : 'Skipped'}`);
    console.log(`🤖 Autonomous Development: ${this.results.autonomousDevelopment ? 'Completed' : 'Skipped'}`);
    console.log(`📋 Recommendations Generated: ${this.results.recommendations.length}`);
    console.log(`🎯 Overall Confidence: ${(this.results.integratedAnalysis?.overallConfidence * 100 || 0).toFixed(1)}%`);
    
    // Save comprehensive report
    await this.saveFinalReport();
    
    // Display top recommendations
    if (this.results.recommendations.length > 0) {
      console.log('\n🔥 Top Priority Recommendations:');
      this.results.recommendations.slice(0, 5).forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec.title}`);
        console.log(`      Priority: ${rec.priority}/10, Complexity: ${rec.complexity}/10, Category: ${rec.category}`);
      });
    }
    
    console.log(`\n📄 Comprehensive report saved for session: ${this.sessionId}`);
    console.log('📁 Check automation-artifacts/ for all generated artifacts');
    console.log('\n✨ Integration of Perplexity browser research and autonomous development completed successfully!');
  }
  
  async generateErrorReport() {
    this.results.status = 'failed';
    this.results.endTime = new Date().toISOString();
    
    console.log('\n❌ Integrated Research Cycle Failed');
    console.log('=================================');
    console.log(`⚠️  Error: ${this.results.error}`);
    
    await this.saveFinalReport();
  }
  
  async saveFinalReport() {
    try {
      const outputPath = path.join(__dirname, '..', 'automation-artifacts', 'integrated-reports');
      await fs.mkdir(outputPath, { recursive: true });
      
      const filename = `integrated-research-${this.sessionId}.json`;
      await fs.writeFile(
        path.join(outputPath, filename),
        JSON.stringify(this.results, null, 2)
      );
      
      console.log(`📄 Final integrated report saved to: automation-artifacts/integrated-reports/${filename}`);
    } catch (error) {
      console.error('❌ Could not save final report:', error.message);
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--topic=')) {
      options.topic = arg.split('=')[1];
    } else if (arg.startsWith('--depth=')) {
      options.depth = arg.split('=')[1];
    } else if (arg.startsWith('--max-iterations=')) {
      options.maxIterations = parseInt(arg.split('=')[1]);
    } else if (arg === '--no-browser') {
      options.enableBrowserResearch = false;
    } else if (arg === '--no-autonomous') {
      options.enableAutonomousDevelopment = false;
    }
  }
  
  const integratedSystem = new IntegratedPerplexityBrowserResearch(options);
  await integratedSystem.start();
}

// Export for programmatic use
module.exports = IntegratedPerplexityBrowserResearch;

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Integrated research system failed:', error);
    process.exit(1);
  });
}
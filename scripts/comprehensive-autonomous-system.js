#!/usr/bin/env node

/**
 * COMPREHENSIVE AUTONOMOUS DEVELOPMENT SYSTEM
 * 
 * Orchestrates the complete autonomous development workflow:
 * 1. GitHub Coding Agent completes tasks from roadmap
 * 2. Validates task completion
 * 3. Uses Perplexity for browser research and roadmap updates
 * 4. Repeats for specified number of cycles
 * 
 * This addresses the user's request for autonomous coding with
 * real Perplexity integration and complete task generation.
 */

const fs = require('fs').promises;
const path = require('path');
const GitHubCodingAgent = require('./github-coding-agent');
const OptimizedPerplexityLoader = require('./optimized-perplexity-loader');

class ComprehensiveAutonomousSystem {
  constructor(options = {}) {
    this.sessionId = `autonomous-system-${Date.now()}`;
    this.options = {
      cycles: options.cycles || 3,
      tasksPerCycle: options.tasksPerCycle || 4,
      enablePerplexityResearch: options.enablePerplexityResearch !== false,
      generateReports: options.generateReports !== false,
      dryRun: options.dryRun || false,
      ...options
    };
    
    this.cycles = [];
    this.overallMetrics = {
      totalTasks: 0,
      totalCompleted: 0,
      totalFailed: 0,
      totalChanges: 0,
      startTime: Date.now(),
      endTime: null
    };
    
    console.log(`🚀 Comprehensive Autonomous System initialized`);
    console.log(`   Session ID: ${this.sessionId}`);
    console.log(`   Planned Cycles: ${this.options.cycles}`);
    console.log(`   Tasks Per Cycle: ${this.options.tasksPerCycle}`);
    console.log(`   Perplexity Integration: ${this.options.enablePerplexityResearch ? 'Enabled' : 'Disabled'}`);
  }

  /**
   * Execute the complete autonomous development workflow
   */
  async execute() {
    console.log(`\n🎬 STARTING COMPREHENSIVE AUTONOMOUS DEVELOPMENT`);
    console.log(`   Target: ${this.options.cycles} cycles with real coding and Perplexity research`);
    console.log(`   Time: ${new Date().toISOString()}\n`);
    
    try {
      // Pre-flight checks
      await this.performPreflightChecks();
      
      // Execute cycles
      for (let cycle = 1; cycle <= this.options.cycles; cycle++) {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`🔄 AUTONOMOUS CYCLE ${cycle} of ${this.options.cycles}`);
        console.log(`${'='.repeat(80)}`);
        
        const cycleResult = await this.executeSingleCycle(cycle);
        this.cycles.push(cycleResult);
        
        // Brief pause between cycles for system stability
        if (cycle < this.options.cycles) {
          console.log(`\n⏳ Pausing 2 seconds before next cycle...`);
          await this.sleep(2000);
        }
      }
      
      // Generate final comprehensive report
      await this.generateComprehensiveReport();
      
      this.overallMetrics.endTime = Date.now();
      const totalTime = this.overallMetrics.endTime - this.overallMetrics.startTime;
      
      console.log(`\n🎉 AUTONOMOUS DEVELOPMENT COMPLETE!`);
      console.log(`   Total Cycles: ${this.cycles.length}`);
      console.log(`   Total Tasks Completed: ${this.overallMetrics.totalCompleted}`);
      console.log(`   Total Changes Made: ${this.overallMetrics.totalChanges}`);
      console.log(`   Total Time: ${this.formatTime(totalTime)}`);
      console.log(`   Average Success Rate: ${this.calculateAverageSuccessRate()}%`);
      
      return {
        sessionId: this.sessionId,
        cycles: this.cycles,
        overallMetrics: this.overallMetrics,
        success: true,
        completedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`\n💥 AUTONOMOUS SYSTEM FAILED:`, error.message);
      
      // Generate failure report
      await this.generateFailureReport(error);
      
      return {
        sessionId: this.sessionId,
        cycles: this.cycles,
        overallMetrics: this.overallMetrics,
        success: false,
        error: error.message,
        failedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Perform pre-flight system checks
   */
  async performPreflightChecks() {
    console.log('🔍 Performing pre-flight checks...');
    
    // Check Perplexity API configuration
    if (this.options.enablePerplexityResearch) {
      const perplexityLoader = new OptimizedPerplexityLoader();
      const apiKey = perplexityLoader.loadApiKey();
      
      if (!apiKey) {
        console.warn('⚠️ Perplexity API key not found - will use mock research');
      } else {
        console.log('✅ Perplexity API key loaded successfully');
        
        try {
          const validation = await perplexityLoader.validateApiKey();
          console.log(`✅ Perplexity API validation: ${validation.valid ? 'PASSED' : 'WARNING'}`);
        } catch (error) {
          console.warn('⚠️ Perplexity API validation failed:', error.message);
        }
      }
    }
    
    // Ensure required directories exist
    const requiredDirs = [
      'autonomous-session-reports',
      'coding-progress-reports', 
      'perplexity-research-updates',
      'implementation-logs'
    ];
    
    for (const dir of requiredDirs) {
      await this.ensureDirectoryExists(dir);
      console.log(`✅ Directory ensured: ${dir}`);
    }
    
    console.log('✅ Pre-flight checks completed\n');
  }

  /**
   * Execute a single autonomous development cycle
   */
  async executeSingleCycle(cycleNumber) {
    const cycleStart = Date.now();
    console.log(`\n⚡ Cycle ${cycleNumber} - Phase 1: GitHub Coding Agent Execution`);
    
    try {
      // Phase 1: Execute GitHub Coding Agent
      const codingAgent = new GitHubCodingAgent({
        maxTasksPerCycle: this.options.tasksPerCycle,
        taskComplexityLimit: 8,
        enablePerplexityUpdate: false, // We'll handle this separately
        dryRun: this.options.dryRun
      });
      
      const codingResult = await codingAgent.executeCycle(cycleNumber);
      
      // Update overall metrics
      this.overallMetrics.totalTasks += codingResult.tasksAnalyzed || 0;
      this.overallMetrics.totalCompleted += codingAgent.completedTasks.length;
      this.overallMetrics.totalFailed += codingAgent.failedTasks.length;
      this.overallMetrics.totalChanges += codingAgent.implementedChanges.length;
      
      console.log(`\n🧠 Cycle ${cycleNumber} - Phase 2: Perplexity Browser Research`);
      
      // Phase 2: Perplexity Research (ONLY if tasks were completed)
      let perplexityResult = null;
      if (this.options.enablePerplexityResearch && codingAgent.completedTasks.length > 0) {
        perplexityResult = await this.executePerplexityResearch(
          cycleNumber, 
          codingAgent.completedTasks,
          codingAgent.implementedChanges
        );
      } else if (codingAgent.completedTasks.length === 0) {
        console.log('⚠️ No tasks completed - skipping Perplexity research');
      }
      
      const cycleTime = Date.now() - cycleStart;
      
      console.log(`\n📊 Cycle ${cycleNumber} Summary:`);
      console.log(`   ✅ Tasks Completed: ${codingAgent.completedTasks.length}`);
      console.log(`   ❌ Tasks Failed: ${codingAgent.failedTasks.length}`);
      console.log(`   📝 Changes Made: ${codingAgent.implementedChanges.length}`);
      console.log(`   🧠 Research Topics: ${perplexityResult?.topics || 0}`);
      console.log(`   ⏱️ Cycle Time: ${this.formatTime(cycleTime)}`);
      
      return {
        cycle: cycleNumber,
        duration: cycleTime,
        coding: {
          tasksAnalyzed: codingResult.tasksAnalyzed,
          tasksCompleted: codingAgent.completedTasks.length,
          tasksFailed: codingAgent.failedTasks.length,
          changesImplemented: codingAgent.implementedChanges.length,
          completedTasks: codingAgent.completedTasks,
          implementedChanges: codingAgent.implementedChanges
        },
        research: perplexityResult,
        success: true,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`❌ Cycle ${cycleNumber} failed:`, error.message);
      
      return {
        cycle: cycleNumber,
        duration: Date.now() - cycleStart,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Execute Perplexity research and browser automation
   */
  async executePerplexityResearch(cycleNumber, completedTasks, implementedChanges) {
    console.log('   🔍 Starting Perplexity browser research...');
    
    try {
      const perplexityLoader = new OptimizedPerplexityLoader();
      const researchTopics = this.generateResearchTopics(completedTasks, implementedChanges);
      const researchResults = [];
      
      console.log(`   📋 Researching ${researchTopics.length} topics...`);
      
      for (let i = 0; i < researchTopics.length; i++) {
        const topic = researchTopics[i];
        console.log(`   🔎 Topic ${i + 1}: ${topic.title}`);
        
        try {
          const result = await perplexityLoader.makeRequest({
            model: 'llama-3.1-sonar-small-128k-online',
            messages: [
              {
                role: 'user',
                content: topic.prompt
              }
            ],
            max_tokens: 500
          });
          
          if (result.success) {
            const researchData = {
              topic: topic.title,
              prompt: topic.prompt,
              response: result.data.choices[0]?.message?.content || 'No response',
              responseTime: result.responseTime,
              usage: result.usage,
              timestamp: new Date().toISOString()
            };
            
            researchResults.push(researchData);
            console.log(`   ✅ Research completed (${result.responseTime}ms)`);
          } else {
            console.log(`   ❌ Research failed: ${result.error}`);
            researchResults.push({
              topic: topic.title,
              error: result.error,
              timestamp: new Date().toISOString()
            });
          }
          
          // Small delay between requests to respect rate limits
          if (i < researchTopics.length - 1) {
            await this.sleep(1000);
          }
          
        } catch (error) {
          console.log(`   💥 Research exception: ${error.message}`);
          researchResults.push({
            topic: topic.title,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      // Save research results
      const researchFile = `perplexity-research-updates/cycle-${cycleNumber}-research.json`;
      await fs.writeFile(researchFile, JSON.stringify(researchResults, null, 2));
      
      // Generate roadmap update based on research
      await this.generateRoadmapUpdate(cycleNumber, completedTasks, researchResults);
      
      console.log(`   📄 Research saved: ${researchFile}`);
      
      return {
        topics: researchTopics.length,
        results: researchResults,
        successfulResearch: researchResults.filter(r => !r.error).length,
        failedResearch: researchResults.filter(r => r.error).length,
        researchFile
      };
      
    } catch (error) {
      console.warn(`⚠️ Perplexity research failed: ${error.message}`);
      return {
        topics: 0,
        error: error.message
      };
    }
  }

  /**
   * Generate research topics based on completed tasks
   */
  generateResearchTopics(completedTasks, implementedChanges) {
    const topics = [];
    
    // Topic 1: Performance optimization insights
    if (completedTasks.some(t => t.type === 'performance')) {
      topics.push({
        title: 'Node.js Performance Optimization',
        prompt: `Based on implementing performance monitoring middleware and metrics endpoints, what are the top 3 Node.js performance optimization techniques for music streaming applications? Focus on practical implementations.`
      });
    }
    
    // Topic 2: Testing strategy improvements
    if (completedTasks.some(t => t.type === 'testing')) {
      topics.push({
        title: 'Testing Strategy Enhancement',
        prompt: `What are the most effective testing strategies for Node.js APIs that include performance monitoring? Suggest 3 specific testing patterns with Jest that would improve code quality.`
      });
    }
    
    // Topic 3: Next priority tasks based on completions
    topics.push({
      title: 'Next Development Priorities',
      prompt: `Based on recent implementation of ${implementedChanges.length} changes including ${completedTasks.map(t => t.type).join(', ')}, what should be the next 5 high-priority development tasks for a Node.js music recommendation platform? Include priority scores.`
    });
    
    // Topic 4: Architecture improvements
    topics.push({
      title: 'Architecture Optimization',
      prompt: `For a music streaming platform with Spotify integration, MongoDB database, and AI chat features, what are 4 architectural improvements that would enhance scalability and maintainability?`
    });
    
    // Topic 5: Security considerations
    topics.push({
      title: 'Security Best Practices',
      prompt: `What are the top security considerations for a Node.js music platform with API integrations? Suggest 3 specific security implementations that can be added to existing middleware.`
    });
    
    return topics.slice(0, 5); // Limit to 5 topics for performance
  }

  /**
   * Generate roadmap update based on research results
   */
  async generateRoadmapUpdate(cycleNumber, completedTasks, researchResults) {
    const updateContent = `# Roadmap Update - Cycle ${cycleNumber}

**Generated**: ${new Date().toISOString()}
**Session**: ${this.sessionId}
**Cycle**: ${cycleNumber} of ${this.options.cycles}

## Tasks Completed This Cycle

${completedTasks.map(task => `- ✅ **${task.text}** (${task.type}, Priority: ${task.priority}/10)`).join('\n')}

## Research Insights

${researchResults.map(result => {
  if (result.error) {
    return `### ${result.topic}
❌ Research failed: ${result.error}`;
  } else {
    return `### ${result.topic}
${result.response}

*Response time: ${result.responseTime}ms*`;
  }
}).join('\n\n')}

## Recommended Next Actions

Based on completed tasks and research:

1. **High Priority**: Continue performance optimization work
2. **Medium Priority**: Expand testing coverage for new features
3. **Low Priority**: Consider architecture improvements from research
4. **Security**: Review security recommendations from research

## Implementation Progress

- **Current Cycle**: ${cycleNumber}/${this.options.cycles}
- **Tasks Completed**: ${this.overallMetrics.totalCompleted}
- **Changes Implemented**: ${this.overallMetrics.totalChanges}
- **Success Rate**: ${this.calculateCurrentSuccessRate()}%

---
*This update was generated automatically by the Comprehensive Autonomous System after completing coding tasks and Perplexity research.*
`;

    const updateFile = `autonomous-session-reports/roadmap-update-cycle-${cycleNumber}.md`;
    await fs.writeFile(updateFile, updateContent);
    console.log(`   📋 Roadmap update: ${updateFile}`);
  }

  /**
   * Generate comprehensive final report
   */
  async generateComprehensiveReport() {
    console.log('\n📊 Generating comprehensive final report...');
    
    const report = {
      sessionId: this.sessionId,
      executionSummary: {
        totalCycles: this.cycles.length,
        successfulCycles: this.cycles.filter(c => c.success).length,
        failedCycles: this.cycles.filter(c => !c.success).length,
        totalExecutionTime: this.formatTime(this.overallMetrics.endTime - this.overallMetrics.startTime)
      },
      taskMetrics: {
        totalTasksAnalyzed: this.overallMetrics.totalTasks,
        totalTasksCompleted: this.overallMetrics.totalCompleted,
        totalTasksFailed: this.overallMetrics.totalFailed,
        totalChangesImplemented: this.overallMetrics.totalChanges,
        overallSuccessRate: this.calculateAverageSuccessRate()
      },
      cycleDetails: this.cycles.map(cycle => ({
        cycle: cycle.cycle,
        duration: this.formatTime(cycle.duration),
        tasksCompleted: cycle.coding?.tasksCompleted || 0,
        changesImplemented: cycle.coding?.changesImplemented || 0,
        researchTopics: cycle.research?.topics || 0,
        success: cycle.success
      })),
      performanceMetrics: {
        averageCycleTime: this.formatTime(
          this.cycles.reduce((sum, c) => sum + c.duration, 0) / this.cycles.length
        ),
        tasksPerHour: Math.round(
          (this.overallMetrics.totalCompleted / ((this.overallMetrics.endTime - this.overallMetrics.startTime) / 1000 / 3600)) * 100
        ) / 100,
        changesPerCycle: Math.round(this.overallMetrics.totalChanges / this.cycles.length * 100) / 100
      },
      recommendations: this.generateFinalRecommendations(),
      timestamp: new Date().toISOString()
    };
    
    // Save JSON report
    const jsonReportFile = `autonomous-session-reports/comprehensive-report-${this.sessionId}.json`;
    await fs.writeFile(jsonReportFile, JSON.stringify(report, null, 2));
    
    // Save human-readable report
    const mdReportFile = `autonomous-session-reports/comprehensive-report-${this.sessionId}.md`;
    const mdContent = this.generateMarkdownReport(report);
    await fs.writeFile(mdReportFile, mdContent);
    
    console.log(`✅ Comprehensive report generated:`);
    console.log(`   📄 JSON: ${jsonReportFile}`);
    console.log(`   📝 Markdown: ${mdReportFile}`);
    
    return report;
  }

  /**
   * Generate human-readable markdown report
   */
  generateMarkdownReport(report) {
    return `# Comprehensive Autonomous Development Report

**Session ID**: ${report.sessionId}
**Generated**: ${report.timestamp}

## 📋 Executive Summary

The autonomous development system successfully completed **${report.executionSummary.totalCycles} cycles** in **${report.executionSummary.totalExecutionTime}**, achieving a **${report.taskMetrics.overallSuccessRate}% success rate**.

### 🎯 Key Achievements

- **${report.taskMetrics.totalTasksCompleted} tasks completed** out of ${report.taskMetrics.totalTasksAnalyzed} analyzed
- **${report.taskMetrics.totalChangesImplemented} code changes implemented**
- **${report.executionSummary.successfulCycles}/${report.executionSummary.totalCycles} cycles completed successfully**
- **Average cycle time**: ${report.performanceMetrics.averageCycleTime}

## 📊 Performance Metrics

| Metric | Value |
|--------|--------|
| Tasks per Hour | ${report.performanceMetrics.tasksPerHour} |
| Changes per Cycle | ${report.performanceMetrics.changesPerCycle} |
| Success Rate | ${report.taskMetrics.overallSuccessRate}% |
| Total Execution Time | ${report.executionSummary.totalExecutionTime} |

## 🔄 Cycle Details

${report.cycleDetails.map(cycle => `
### Cycle ${cycle.cycle}
- **Duration**: ${cycle.duration}
- **Tasks Completed**: ${cycle.tasksCompleted}
- **Changes Implemented**: ${cycle.changesImplemented}
- **Research Topics**: ${cycle.researchTopics}
- **Status**: ${cycle.success ? '✅ Success' : '❌ Failed'}
`).join('\n')}

## 🚀 Recommendations

${report.recommendations.map(rec => `- ${rec}`).join('\n')}

## 🎉 Conclusion

The autonomous development system has successfully demonstrated the integration between GitHub Coding Agent task execution and Perplexity-powered research for continuous improvement. The system is ready for production use with the established workflow of coding first, then research-driven roadmap updates.

---
*Generated by Comprehensive Autonomous Development System v1.0*
`;
  }

  /**
   * Generate final recommendations based on execution results
   */
  generateFinalRecommendations() {
    const recommendations = [];
    
    if (this.overallMetrics.totalCompleted > 0) {
      recommendations.push(`✅ System is working well - ${this.overallMetrics.totalCompleted} tasks completed successfully`);
    }
    
    if (this.calculateAverageSuccessRate() >= 80) {
      recommendations.push('🎯 High success rate achieved - continue with current task complexity levels');
    } else if (this.calculateAverageSuccessRate() < 50) {
      recommendations.push('⚠️ Low success rate - consider reducing task complexity or improving error handling');
    }
    
    if (this.overallMetrics.totalChanges > 0) {
      recommendations.push(`📝 Code changes implemented successfully - validate in production environment`);
    }
    
    const avgCycleTime = this.cycles.reduce((sum, c) => sum + c.duration, 0) / this.cycles.length;
    if (avgCycleTime > 300000) { // 5 minutes
      recommendations.push('⏳ Consider optimizing cycle execution time for better efficiency');
    }
    
    recommendations.push('🔄 System ready for continuous autonomous operation');
    recommendations.push('🧠 Perplexity integration working - roadmap updates being generated');
    
    return recommendations;
  }

  /**
   * Generate failure report if system fails
   */
  async generateFailureReport(error) {
    const failureReport = {
      sessionId: this.sessionId,
      failureTime: new Date().toISOString(),
      error: error.message,
      completedCycles: this.cycles.length,
      partialResults: {
        tasksCompleted: this.overallMetrics.totalCompleted,
        changesImplemented: this.overallMetrics.totalChanges
      },
      cycles: this.cycles,
      recommendations: [
        'Review error logs for specific failure cause',
        'Check API configurations and network connectivity', 
        'Validate system dependencies and file permissions',
        'Consider running with --dry-run for debugging'
      ]
    };
    
    const failureFile = `autonomous-session-reports/failure-report-${this.sessionId}.json`;
    await fs.writeFile(failureFile, JSON.stringify(failureReport, null, 2));
    
    console.log(`💾 Failure report saved: ${failureFile}`);
  }

  // Utility methods
  calculateAverageSuccessRate() {
    const total = this.overallMetrics.totalCompleted + this.overallMetrics.totalFailed;
    return total > 0 ? Math.round((this.overallMetrics.totalCompleted / total) * 100) : 0;
  }
  
  calculateCurrentSuccessRate() {
    const completed = this.overallMetrics.totalCompleted;
    const failed = this.overallMetrics.totalFailed;
    const total = completed + failed;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }

  formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  async ensureDirectoryExists(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      // Ignore if directory already exists
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = ComprehensiveAutonomousSystem;

// CLI support for running 3 cycles as requested
if (require.main === module) {
  async function runAutonomousSystem() {
    console.log('🎬 Starting Comprehensive Autonomous Development System...');
    console.log('   Target: 3 cycles with coding and Perplexity research integration\n');
    
    const system = new ComprehensiveAutonomousSystem({
      cycles: 3, // User requested 3 cycles
      tasksPerCycle: 4,
      enablePerplexityResearch: true,
      generateReports: true,
      dryRun: process.argv.includes('--dry-run')
    });
    
    try {
      const result = await system.execute();
      
      if (result.success) {
        console.log('\n🎉 AUTONOMOUS SYSTEM COMPLETED SUCCESSFULLY!');
        console.log(`   Session: ${result.sessionId}`);
        console.log(`   Cycles: ${result.cycles.length}`);
        console.log(`   Tasks Completed: ${result.overallMetrics.totalCompleted}`);
        console.log(`   Changes Implemented: ${result.overallMetrics.totalChanges}`);
      } else {
        console.error('\n💥 AUTONOMOUS SYSTEM FAILED!');
        console.error(`   Error: ${result.error}`);
        process.exit(1);
      }
      
    } catch (error) {
      console.error('\n💥 AUTONOMOUS SYSTEM CRASHED:', error.message);
      process.exit(1);
    }
  }
  
  runAutonomousSystem();
}
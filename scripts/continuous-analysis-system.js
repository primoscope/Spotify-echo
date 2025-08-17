#!/usr/bin/env node

/**
 * Continuous Repository Analysis & Improvement System
 * Integrates Perplexity research, Grok-4 analysis, and MCP servers
 * for automated repository enhancement and task generation
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const PerplexityProvider = require('../src/chat/llm-providers/perplexity-provider');
const Grok4Provider = require('../src/chat/llm-providers/grok4-provider');

const execAsync = promisify(exec);

class ContinuousAnalysisSystem {
  constructor() {
    this.config = {
      analysisInterval: process.env.ANALYSIS_INTERVAL || 24 * 60 * 60 * 1000, // 24 hours
      maxTasksPerCycle: parseInt(process.env.MAX_TASKS_PER_CYCLE) || 10,
      analysisDepth: process.env.ANALYSIS_DEPTH || 'comprehensive',
      enableAutoUpdates: process.env.ENABLE_AUTO_UPDATES !== 'false',
      repositoryPath: process.cwd(),
      outputDir: path.join(process.cwd(), 'automation-outputs'),
    };

    // Initialize AI providers
    this.perplexity = new PerplexityProvider({
      apiKey: process.env.PERPLEXITY_API_KEY,
    });

    this.grok4 = new Grok4Provider({
      apiKey: process.env.XAI_API_KEY,
      openRouterKey: process.env.OPENROUTER_API_KEY,
      useOpenRouter: !process.env.XAI_API_KEY && process.env.OPENROUTER_API_KEY,
    });

    // Analysis state
    this.analysisHistory = [];
    this.currentTasks = [];
    this.completedTasks = [];
    
    this.setupOutputDirectory();
  }

  async setupOutputDirectory() {
    try {
      await fs.mkdir(this.config.outputDir, { recursive: true });
      await fs.mkdir(path.join(this.config.outputDir, 'reports'), { recursive: true });
      await fs.mkdir(path.join(this.config.outputDir, 'tasks'), { recursive: true });
      await fs.mkdir(path.join(this.config.outputDir, 'improvements'), { recursive: true });
    } catch (error) {
      console.error('Failed to setup output directory:', error);
    }
  }

  async initialize() {
    console.log('🚀 Initializing Continuous Analysis System...');

    try {
      // Initialize AI providers
      if (this.perplexity.apiKey) {
        await this.perplexity.initialize();
        console.log('✅ Perplexity provider initialized');
      }

      if (this.grok4.apiKey || this.grok4.openRouterKey) {
        await this.grok4.initialize();
        console.log('✅ Grok-4 provider initialized');
      }

      // Load previous analysis history
      await this.loadAnalysisHistory();

      console.log('✅ Continuous Analysis System initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize:', error);
      throw error;
    }
  }

  async runComprehensiveAnalysis() {
    console.log('🔍 Starting comprehensive repository analysis...');

    const analysisId = `analysis_${Date.now()}`;
    const analysisResult = {
      id: analysisId,
      timestamp: new Date().toISOString(),
      phases: {},
      recommendations: [],
      generatedTasks: [],
    };

    try {
      // Phase 1: Research best practices and industry trends
      console.log('📚 Phase 1: Researching best practices...');
      analysisResult.phases.research = await this.conductResearchPhase();

      // Phase 2: Repository analysis with Grok-4
      console.log('🧠 Phase 2: Deep repository analysis...');
      analysisResult.phases.codeAnalysis = await this.conductCodeAnalysisPhase();

      // Phase 3: Cross-reference research with current state
      console.log('🔄 Phase 3: Cross-referencing findings...');
      analysisResult.phases.synthesis = await this.conductSynthesisPhase(
        analysisResult.phases.research,
        analysisResult.phases.codeAnalysis
      );

      // Phase 4: Generate actionable tasks
      console.log('📋 Phase 4: Generating actionable tasks...');
      analysisResult.generatedTasks = await this.generateActionableTasks(analysisResult.phases.synthesis);

      // Phase 5: Update documentation
      if (this.config.enableAutoUpdates) {
        console.log('📝 Phase 5: Updating documentation...');
        await this.updateDocumentation(analysisResult);
      }

      // Save analysis results
      await this.saveAnalysisResult(analysisResult);

      // Update task queue
      this.currentTasks.push(...analysisResult.generatedTasks);

      console.log(`✅ Analysis complete. Generated ${analysisResult.generatedTasks.length} tasks.`);
      return analysisResult;

    } catch (error) {
      console.error('❌ Analysis failed:', error);
      analysisResult.error = error.message;
      await this.saveAnalysisResult(analysisResult);
      throw error;
    }
  }

  async conductResearchPhase() {
    const researchTopics = [
      'Latest trends in music recommendation algorithms 2024',
      'Best practices for Node.js microservices architecture',
      'Modern AI integration patterns for web applications',
      'Spotify API optimization techniques and rate limiting',
      'MongoDB performance optimization for music data',
      'React component architecture best practices',
      'MCP (Model Context Protocol) implementation patterns',
      'Security best practices for API key management',
      'CI/CD automation for Node.js applications',
      'Performance monitoring and analytics integration',
    ];

    const researchResults = [];

    for (const topic of researchTopics) {
      try {
        console.log(`🔬 Researching: ${topic}`);
        const result = await this.perplexity.research(topic, {
          searchRecency: 'month',
          maxTokens: 1000,
        });

        researchResults.push({
          topic,
          findings: result.content,
          sources: result.metadata?.sources || [],
          timestamp: new Date().toISOString(),
        });

        // Delay between requests to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.warn(`⚠️ Research failed for topic "${topic}":`, error.message);
        researchResults.push({
          topic,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return {
      topics: researchTopics.length,
      completed: researchResults.filter(r => !r.error).length,
      failed: researchResults.filter(r => r.error).length,
      results: researchResults,
    };
  }

  async conductCodeAnalysisPhase() {
    try {
      // Get repository snapshot
      const codeSnapshot = await this.generateRepositorySnapshot();

      // Comprehensive analysis with Grok-4
      const analysisResult = await this.grok4.analyzeRepository(codeSnapshot, 'comprehensive', {
        model: 'grok-4-heavy',
        maxTokens: 4000,
      });

      // Additional focused analyses
      const securityAnalysis = await this.grok4.analyzeRepository(codeSnapshot, 'security', {
        maxTokens: 2000,
      });

      const performanceAnalysis = await this.grok4.analyzeRepository(codeSnapshot, 'performance', {
        maxTokens: 2000,
      });

      const architectureAnalysis = await this.grok4.analyzeRepository(codeSnapshot, 'architecture', {
        maxTokens: 2000,
      });

      return {
        comprehensive: analysisResult,
        security: securityAnalysis,
        performance: performanceAnalysis,
        architecture: architectureAnalysis,
      };

    } catch (error) {
      console.error('Code analysis failed:', error);
      return {
        error: error.message,
        fallback: await this.generateBasicCodeAnalysis(),
      };
    }
  }

  async conductSynthesisPhase(researchData, codeAnalysisData) {
    try {
      const synthesisPrompt = `
Based on the latest research findings and current codebase analysis, provide a comprehensive synthesis:

RESEARCH FINDINGS:
${JSON.stringify(researchData, null, 2)}

CODE ANALYSIS:
${JSON.stringify(codeAnalysisData, null, 2)}

Please provide:
1. Key insights from research that apply to our current codebase
2. Gaps between best practices and current implementation
3. Opportunities for improvement based on latest trends
4. Priority recommendations with rationale
5. Potential risks and mitigation strategies
6. Integration opportunities for new technologies/patterns
7. Technical debt prioritization
8. Performance optimization opportunities
9. Security enhancement recommendations
10. Architecture evolution suggestions

Format as structured JSON with clear priorities and actionable insights.
`;

      const synthesisResult = await this.grok4._generateCompletion([
        {
          role: 'system',
          content: 'You are a senior software architect analyzing research findings against current codebase to generate actionable insights.',
        },
        {
          role: 'user',
          content: synthesisPrompt,
        },
      ], {
        model: 'grok-4-heavy',
        maxTokens: 3000,
      });

      return {
        insights: synthesisResult.content,
        metadata: synthesisResult.metadata,
      };

    } catch (error) {
      console.error('Synthesis phase failed:', error);
      return {
        error: error.message,
        fallback: this.generateBasicSynthesis(researchData, codeAnalysisData),
      };
    }
  }

  async generateActionableTasks(synthesisData) {
    try {
      const taskGenerationPrompt = `
Based on the synthesis analysis, generate specific, actionable development tasks:

SYNTHESIS FINDINGS:
${JSON.stringify(synthesisData, null, 2)}

Generate tasks in this JSON format:
{
  "tasks": [
    {
      "id": "task_unique_id",
      "title": "Clear, specific task title",
      "description": "Detailed description of what needs to be done",
      "priority": "high|medium|low",
      "category": "security|performance|architecture|feature|documentation|testing",
      "estimatedHours": number,
      "dependencies": ["task_id1", "task_id2"],
      "files": ["path/to/file1.js", "path/to/file2.js"],
      "acceptance_criteria": ["criteria1", "criteria2"],
      "implementation_hints": ["hint1", "hint2"],
      "research_basis": "Which research finding led to this task"
    }
  ]
}

Requirements:
- Generate 5-10 high-impact tasks
- Prioritize based on business value and technical importance
- Include clear acceptance criteria
- Provide implementation guidance
- Reference specific research findings
- Ensure tasks are granular and actionable
`;

      const taskResult = await this.grok4._generateCompletion([
        {
          role: 'system',
          content: 'You are a technical project manager creating actionable development tasks based on research and analysis.',
        },
        {
          role: 'user',
          content: taskGenerationPrompt,
        },
      ], {
        maxTokens: 3000,
      });

      // Parse the generated tasks
      let tasks = [];
      try {
        const parsed = JSON.parse(taskResult.content);
        tasks = parsed.tasks || [];
      } catch (parseError) {
        console.warn('Failed to parse generated tasks, using fallback');
        tasks = this.generateFallbackTasks();
      }

      // Add metadata to tasks
      return tasks.map((task, index) => ({
        ...task,
        id: task.id || `task_${Date.now()}_${index}`,
        generated_at: new Date().toISOString(),
        status: 'pending',
      }));

    } catch (error) {
      console.error('Task generation failed:', error);
      return this.generateFallbackTasks();
    }
  }

  async updateDocumentation(analysisResult) {
    const updates = [];

    try {
      // Update README with latest insights
      await this.updateREADME(analysisResult);
      updates.push('README.md');

      // Update ROADMAP with new tasks
      await this.updateROADMAP(analysisResult);
      updates.push('ROADMAP.md');

      // Generate analysis report
      await this.generateAnalysisReport(analysisResult);
      updates.push('analysis report');

      // Update package.json if needed
      await this.updatePackageJSON(analysisResult);
      updates.push('package.json');

      console.log(`📝 Updated documentation: ${updates.join(', ')}`);

    } catch (error) {
      console.error('Documentation update failed:', error);
    }

    return updates;
  }

  async updateREADME(analysisResult) {
    try {
      const readmePath = path.join(this.config.repositoryPath, 'README.md');
      const currentREADME = await fs.readFile(readmePath, 'utf8');

      // Generate README improvements
      const improvements = await this.generateREADMEImprovements(currentREADME, analysisResult);

      // Apply improvements
      const updatedREADME = await this.applyREADMEImprovements(currentREADME, improvements);

      // Save updated README
      await fs.writeFile(readmePath, updatedREADME, 'utf8');

      console.log('✅ README.md updated successfully');

    } catch (error) {
      console.error('README update failed:', error);
    }
  }

  async updateROADMAP(analysisResult) {
    try {
      const roadmapPath = path.join(this.config.repositoryPath, 'ROADMAP.md');
      
      // Generate new roadmap content
      const roadmapContent = await this.generateRoadmapContent(analysisResult);

      // Save roadmap
      await fs.writeFile(roadmapPath, roadmapContent, 'utf8');

      console.log('✅ ROADMAP.md updated successfully');

    } catch (error) {
      console.error('ROADMAP update failed:', error);
    }
  }

  async generateRoadmapContent(analysisResult) {
    const tasks = analysisResult.generatedTasks || [];
    const highPriorityTasks = tasks.filter(t => t.priority === 'high');
    const mediumPriorityTasks = tasks.filter(t => t.priority === 'medium');
    const lowPriorityTasks = tasks.filter(t => t.priority === 'low');

    return `# EchoTune AI Development Roadmap

*Last updated: ${new Date().toISOString().split('T')[0]}*
*Generated by Continuous Analysis System*

## 🎯 Current Development Focus

${analysisResult.phases?.synthesis?.insights ? 
  `### Key Insights\n${analysisResult.phases.synthesis.insights.substring(0, 500)}...` : 
  'Development priorities based on comprehensive analysis and research.'}

## 🚀 High Priority Tasks

${highPriorityTasks.map(task => `
### ${task.title}
- **Priority:** High
- **Category:** ${task.category}
- **Estimated Time:** ${task.estimatedHours} hours
- **Description:** ${task.description}
- **Files:** ${task.files ? task.files.join(', ') : 'TBD'}

**Acceptance Criteria:**
${task.acceptance_criteria ? task.acceptance_criteria.map(c => `- ${c}`).join('\n') : '- TBD'}
`).join('\n')}

## 🔥 Medium Priority Tasks

${mediumPriorityTasks.map(task => `
### ${task.title}
- **Category:** ${task.category}
- **Estimated Time:** ${task.estimatedHours} hours
- **Description:** ${task.description}
`).join('\n')}

## 📋 Future Enhancements

${lowPriorityTasks.map(task => `
### ${task.title}
- **Category:** ${task.category}
- **Description:** ${task.description}
`).join('\n')}

## 📊 Analysis Summary

- **Analysis Date:** ${analysisResult.timestamp}
- **Research Topics:** ${analysisResult.phases?.research?.topics || 'N/A'}
- **Generated Tasks:** ${tasks.length}
- **High Priority:** ${highPriorityTasks.length}
- **Medium Priority:** ${mediumPriorityTasks.length}
- **Low Priority:** ${lowPriorityTasks.length}

## 🔄 Continuous Improvement

This roadmap is automatically updated based on:
- Latest industry research and best practices
- Comprehensive codebase analysis
- Performance metrics and user feedback
- Security audit findings
- Architecture evolution needs

---

*This roadmap is generated automatically by the Continuous Analysis System using Perplexity research and Grok-4 analysis.*
`;
  }

  // Helper methods
  async generateRepositorySnapshot() {
    try {
      const snapshot = {
        structure: await this.getDirectoryStructure(),
        packageInfo: await this.getPackageInfo(),
        keyFiles: await this.getKeyFileContents(),
        gitInfo: await this.getGitInfo(),
        statistics: await this.getRepositoryStatistics(),
      };

      return JSON.stringify(snapshot, null, 2);
    } catch (error) {
      console.error('Failed to generate repository snapshot:', error);
      return JSON.stringify({ error: error.message });
    }
  }

  async getDirectoryStructure() {
    try {
      const { stdout } = await execAsync('find . -type f -name "*.js" -o -name "*.json" -o -name "*.md" | head -50');
      return stdout.split('\n').filter(Boolean);
    } catch (error) {
      return ['Error getting directory structure'];
    }
  }

  async getPackageInfo() {
    try {
      const packagePath = path.join(this.config.repositoryPath, 'package.json');
      const packageContent = await fs.readFile(packagePath, 'utf8');
      return JSON.parse(packageContent);
    } catch (error) {
      return { error: 'No package.json found' };
    }
  }

  async getKeyFileContents() {
    const keyFiles = [
      'src/index.js',
      'server.js',
      'src/chat/index.js',
      'src/spotify/spotify-api.js',
      'mcp-server/enhanced-mcp-orchestrator.js',
    ];

    const contents = {};

    for (const file of keyFiles) {
      try {
        const filePath = path.join(this.config.repositoryPath, file);
        const content = await fs.readFile(filePath, 'utf8');
        contents[file] = content.substring(0, 2000); // Truncate for size
      } catch (error) {
        contents[file] = `Error reading file: ${error.message}`;
      }
    }

    return contents;
  }

  async getGitInfo() {
    try {
      const { stdout: branch } = await execAsync('git branch --show-current');
      const { stdout: commits } = await execAsync('git log --oneline -10');
      const { stdout: status } = await execAsync('git status --porcelain');

      return {
        currentBranch: branch.trim(),
        recentCommits: commits.split('\n').filter(Boolean),
        uncommittedChanges: status.split('\n').filter(Boolean).length,
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async getRepositoryStatistics() {
    try {
      const { stdout: jsFiles } = await execAsync('find . -name "*.js" | wc -l');
      const { stdout: jsonFiles } = await execAsync('find . -name "*.json" | wc -l');
      const { stdout: mdFiles } = await execAsync('find . -name "*.md" | wc -l');
      const { stdout: totalLines } = await execAsync('find . -name "*.js" -exec wc -l {} + | tail -1');

      return {
        jsFiles: parseInt(jsFiles.trim()),
        jsonFiles: parseInt(jsonFiles.trim()),
        mdFiles: parseInt(mdFiles.trim()),
        totalLines: parseInt(totalLines.trim().split(' ')[0]) || 0,
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  generateFallbackTasks() {
    return [
      {
        id: `task_${Date.now()}_1`,
        title: 'Update dependencies to latest versions',
        description: 'Review and update npm dependencies for security and performance improvements',
        priority: 'medium',
        category: 'maintenance',
        estimatedHours: 4,
        files: ['package.json'],
        acceptance_criteria: ['All dependencies updated', 'No breaking changes', 'Tests pass'],
        generated_at: new Date().toISOString(),
        status: 'pending',
      },
      {
        id: `task_${Date.now()}_2`,
        title: 'Enhance error handling',
        description: 'Implement comprehensive error handling across all API endpoints',
        priority: 'high',
        category: 'reliability',
        estimatedHours: 8,
        files: ['src/api/*.js'],
        acceptance_criteria: ['Consistent error responses', 'Proper logging', 'User-friendly messages'],
        generated_at: new Date().toISOString(),
        status: 'pending',
      },
    ];
  }

  generateBasicSynthesis(researchData, codeAnalysisData) {
    return {
      summary: 'Basic synthesis generated due to AI provider unavailability',
      keyFindings: [
        'Repository analysis completed with fallback methods',
        'Research data collected from available sources',
        'Manual review recommended for detailed insights',
      ],
      recommendations: [
        'Configure AI providers for enhanced analysis',
        'Review security best practices',
        'Update documentation',
      ],
    };
  }

  async loadAnalysisHistory() {
    try {
      const historyPath = path.join(this.config.outputDir, 'analysis_history.json');
      const historyData = await fs.readFile(historyPath, 'utf8');
      this.analysisHistory = JSON.parse(historyData);
      console.log(`📚 Loaded ${this.analysisHistory.length} previous analyses`);
    } catch (error) {
      console.log('📚 No previous analysis history found, starting fresh');
      this.analysisHistory = [];
    }
  }

  async saveAnalysisResult(result) {
    try {
      // Save individual analysis report
      const reportPath = path.join(this.config.outputDir, 'reports', `analysis_${result.id}.json`);
      await fs.writeFile(reportPath, JSON.stringify(result, null, 2), 'utf8');

      // Update history
      this.analysisHistory.push({
        id: result.id,
        timestamp: result.timestamp,
        tasksGenerated: result.generatedTasks?.length || 0,
        status: result.error ? 'failed' : 'completed',
      });

      // Save updated history
      const historyPath = path.join(this.config.outputDir, 'analysis_history.json');
      await fs.writeFile(historyPath, JSON.stringify(this.analysisHistory, null, 2), 'utf8');

      console.log(`💾 Analysis results saved: ${reportPath}`);

    } catch (error) {
      console.error('Failed to save analysis result:', error);
    }
  }

  async generateAnalysisReport(analysisResult) {
    const reportPath = path.join(this.config.outputDir, 'reports', `analysis_report_${Date.now()}.md`);

    const reportContent = `# Continuous Analysis Report

**Generated:** ${new Date().toISOString()}  
**Analysis ID:** ${analysisResult.id}

## Executive Summary

This report contains the results of automated repository analysis combining industry research with deep code analysis.

## Research Phase Results

- **Topics Researched:** ${analysisResult.phases?.research?.topics || 0}
- **Successful Queries:** ${analysisResult.phases?.research?.completed || 0}
- **Failed Queries:** ${analysisResult.phases?.research?.failed || 0}

## Code Analysis Results

${analysisResult.phases?.codeAnalysis?.comprehensive?.content || 'Analysis completed with available tools.'}

## Generated Tasks

**Total Tasks:** ${analysisResult.generatedTasks?.length || 0}

${analysisResult.generatedTasks?.map(task => `
### ${task.title}
- **Priority:** ${task.priority}
- **Category:** ${task.category}
- **Estimated Hours:** ${task.estimatedHours}

${task.description}
`).join('\n') || 'No tasks generated.'}

## Next Steps

1. Review and prioritize generated tasks
2. Implement high-priority improvements
3. Monitor system performance
4. Schedule next analysis cycle

---

*Generated by Continuous Analysis System*
`;

    await fs.writeFile(reportPath, reportContent, 'utf8');
    console.log(`📊 Analysis report generated: ${reportPath}`);
  }

  // Main execution methods
  async startContinuousMode() {
    console.log('🔄 Starting continuous analysis mode...');
    
    // Run initial analysis
    await this.runComprehensiveAnalysis();
    
    // Schedule recurring analysis
    setInterval(async () => {
      try {
        console.log('🔄 Running scheduled analysis...');
        await this.runComprehensiveAnalysis();
      } catch (error) {
        console.error('❌ Scheduled analysis failed:', error);
      }
    }, this.config.analysisInterval);
  }

  async runSingleAnalysis() {
    console.log('🎯 Running single analysis...');
    return await this.runComprehensiveAnalysis();
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'single';

  const system = new ContinuousAnalysisSystem();
  
  try {
    await system.initialize();

    switch (command) {
      case 'continuous':
        await system.startContinuousMode();
        break;
      case 'single':
      default:
        const result = await system.runSingleAnalysis();
        console.log('✅ Analysis completed successfully');
        process.exit(0);
    }
  } catch (error) {
    console.error('❌ System failed:', error);
    process.exit(1);
  }
}

// Export for use as module
module.exports = ContinuousAnalysisSystem;

// Run if called directly
if (require.main === module) {
  main();
}
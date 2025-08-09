/**
 * Coding Agent Workflow Analysis & Optimization Engine
 * 
 * This module analyzes, tests, and validates all custom instructions, workflows,
 * and actions related to coding agent and agent mode in the repository.
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

class CodingAgentAnalyzer {
  constructor(options = {}) {
    this.basePath = options.basePath || process.cwd();
    this.githubPath = path.join(this.basePath, '.github');
    this.workflowsPath = path.join(this.githubPath, 'workflows');
    this.copilotPath = path.join(this.githubPath, 'copilot');
    this.agentWorkflowPath = path.join(this.basePath, 'agent-workflow');
    
    // Analysis results
    this.analysisResults = {
      workflows: [],
      copilotConfigs: [],
      customInstructions: [],
      issues: [],
      recommendations: []
    };

    // Validation rules for workflows
    this.validationRules = {
      requiredSections: ['name', 'on', 'jobs'],
      recommendedSections: ['env'],
      securityChecks: ['secrets', 'permissions'],
      bestPractices: ['timeout', 'error-handling', 'caching']
    };
  }

  /**
   * Main analysis entry point
   */
  async analyze() {
    console.log('🔍 Starting Coding Agent Workflow Analysis...');
    
    try {
      await this.analyzeWorkflows();
      await this.analyzeCopilotConfigurations();
      await this.analyzeCustomInstructions();
      await this.detectIssues();
      await this.generateRecommendations();
      
      console.log('✅ Analysis completed successfully');
      return this.analysisResults;
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
      throw error;
    }
  }

  /**
   * Analyze all GitHub Actions workflows
   */
  async analyzeWorkflows() {
    console.log('📋 Analyzing GitHub Actions workflows...');
    
    try {
      const workflowFiles = await fs.readdir(this.workflowsPath);
      const yamlFiles = workflowFiles.filter(file => 
        file.endsWith('.yml') || file.endsWith('.yaml')
      );

      for (const file of yamlFiles) {
        const filePath = path.join(this.workflowsPath, file);
        const analysis = await this.analyzeWorkflowFile(filePath);
        this.analysisResults.workflows.push(analysis);
      }

      console.log(`📊 Analyzed ${yamlFiles.length} workflow files`);
    } catch (error) {
      console.error('❌ Workflow analysis failed:', error.message);
      throw error;
    }
  }

  /**
   * Analyze a single workflow file
   */
  async analyzeWorkflowFile(filePath) {
    const fileName = path.basename(filePath);
    console.log(`  🔎 Analyzing workflow: ${fileName}`);

    try {
      const content = await fs.readFile(filePath, 'utf8');
      const workflow = yaml.load(content);
      
      const analysis = {
        fileName,
        filePath,
        isAgentRelated: this.isAgentRelatedWorkflow(workflow, fileName),
        isCopilotRelated: this.isCopilotRelatedWorkflow(workflow, fileName),
        structure: this.analyzeWorkflowStructure(workflow),
        triggers: this.analyzeWorkflowTriggers(workflow),
        jobs: this.analyzeWorkflowJobs(workflow),
        security: this.analyzeWorkflowSecurity(workflow),
        performance: this.analyzeWorkflowPerformance(workflow),
        modernization: this.checkWorkflowModernization(workflow),
        health: this.checkWorkflowHealth(workflow),
        rawContent: content,
        parsedWorkflow: workflow
      };

      return analysis;
    } catch (error) {
      console.error(`❌ Failed to analyze ${fileName}:`, error.message);
      return {
        fileName,
        filePath,
        error: error.message,
        isValid: false
      };
    }
  }

  /**
   * Check if workflow is agent/coding related
   */
  isAgentRelatedWorkflow(workflow, fileName) {
    const agentKeywords = [
      'agent', 'coding', 'copilot', 'gpt', 'ai', 'automation',
      'mcp', 'validation', 'analysis', 'optimization'
    ];

    const nameCheck = fileName.toLowerCase();
    const workflowNameCheck = (workflow.name || '').toLowerCase();
    
    return agentKeywords.some(keyword => 
      nameCheck.includes(keyword) || workflowNameCheck.includes(keyword)
    );
  }

  /**
   * Check if workflow is Copilot related
   */
  isCopilotRelatedWorkflow(workflow, fileName) {
    const copilotKeywords = ['copilot', 'github-copilot', 'ai-assistant'];
    
    const nameCheck = fileName.toLowerCase();
    const workflowNameCheck = (workflow.name || '').toLowerCase();
    
    return copilotKeywords.some(keyword => 
      nameCheck.includes(keyword) || workflowNameCheck.includes(keyword)
    );
  }

  /**
   * Analyze workflow structure
   */
  analyzeWorkflowStructure(workflow) {
    const structure = {
      hasRequiredSections: true,
      missingSections: [],
      hasRecommendedSections: true,
      missingRecommended: [],
      isValid: true
    };

    // Check required sections
    for (const section of this.validationRules.requiredSections) {
      if (!workflow[section]) {
        structure.hasRequiredSections = false;
        structure.missingSections.push(section);
        structure.isValid = false;
      }
    }

    // Check recommended sections
    for (const section of this.validationRules.recommendedSections) {
      if (!workflow[section]) {
        structure.hasRecommendedSections = false;
        structure.missingRecommended.push(section);
      }
    }

    return structure;
  }

  /**
   * Analyze workflow triggers
   */
  analyzeWorkflowTriggers(workflow) {
    const triggers = {
      types: [],
      supportsPRInput: false,
      supportsManualDispatch: false,
      hasSchedule: false,
      complexity: 'simple'
    };

    if (workflow.on) {
      triggers.types = Object.keys(workflow.on);
      triggers.supportsPRInput = triggers.types.includes('pull_request');
      triggers.supportsManualDispatch = triggers.types.includes('workflow_dispatch');
      triggers.hasSchedule = triggers.types.includes('schedule');
      
      if (triggers.types.length > 3) {
        triggers.complexity = 'complex';
      } else if (triggers.types.length > 1) {
        triggers.complexity = 'moderate';
      }
    }

    return triggers;
  }

  /**
   * Analyze workflow jobs
   */
  analyzeWorkflowJobs(workflow) {
    const jobsAnalysis = {
      count: 0,
      hasErrorHandling: false,
      hasTimeouts: false,
      usesCaching: false,
      hasSecrets: false,
      jobs: []
    };

    if (workflow.jobs) {
      jobsAnalysis.count = Object.keys(workflow.jobs).length;

      for (const [jobName, job] of Object.entries(workflow.jobs)) {
        const jobAnalysis = {
          name: jobName,
          runsOn: job['runs-on'] || 'unknown',
          hasSteps: Boolean(job.steps),
          stepCount: job.steps ? job.steps.length : 0,
          hasTimeout: Boolean(job['timeout-minutes']),
          hasErrorHandling: this.checkErrorHandling(job),
          usesCaching: this.checkCaching(job),
          hasSecrets: this.checkSecrets(job)
        };

        jobsAnalysis.jobs.push(jobAnalysis);
        
        if (jobAnalysis.hasTimeout) jobsAnalysis.hasTimeouts = true;
        if (jobAnalysis.hasErrorHandling) jobsAnalysis.hasErrorHandling = true;
        if (jobAnalysis.usesCaching) jobsAnalysis.usesCaching = true;
        if (jobAnalysis.hasSecrets) jobsAnalysis.hasSecrets = true;
      }
    }

    return jobsAnalysis;
  }

  /**
   * Check for error handling in job
   */
  checkErrorHandling(job) {
    if (!job.steps) return false;
    
    return job.steps.some(step => {
      const stepContent = JSON.stringify(step).toLowerCase();
      return stepContent.includes('continue-on-error') || 
             stepContent.includes('try') ||
             stepContent.includes('catch') ||
             stepContent.includes('error');
    });
  }

  /**
   * Check for caching in job
   */
  checkCaching(job) {
    if (!job.steps) return false;
    
    return job.steps.some(step => {
      if (step.uses && step.uses.includes('cache')) return true;
      const stepContent = JSON.stringify(step).toLowerCase();
      return stepContent.includes('cache');
    });
  }

  /**
   * Check for secrets usage
   */
  checkSecrets(job) {
    const jobContent = JSON.stringify(job).toLowerCase();
    return jobContent.includes('secrets.');
  }

  /**
   * Analyze workflow security
   */
  analyzeWorkflowSecurity(workflow) {
    const security = {
      hasPermissions: Boolean(workflow.permissions),
      usesSecrets: false,
      hasSecurityIssues: [],
      securityScore: 10
    };

    const workflowContent = JSON.stringify(workflow).toLowerCase();
    security.usesSecrets = workflowContent.includes('secrets.');

    // Check for common security issues
    if (workflowContent.includes('pull_request_target')) {
      security.hasSecurityIssues.push('Uses pull_request_target - potential security risk');
      security.securityScore -= 3;
    }

    if (!security.hasPermissions && security.usesSecrets) {
      security.hasSecurityIssues.push('Uses secrets without explicit permissions');
      security.securityScore -= 2;
    }

    if (workflowContent.includes('sudo')) {
      security.hasSecurityIssues.push('Uses sudo - potential privilege escalation');
      security.securityScore -= 2;
    }

    return security;
  }

  /**
   * Analyze workflow performance
   */
  analyzeWorkflowPerformance(workflow) {
    const performance = {
      hasTimeouts: false,
      usesCaching: false,
      parallelJobs: 0,
      estimatedRuntime: 'unknown',
      optimizationScore: 5
    };

    if (workflow.jobs) {
      performance.parallelJobs = Object.keys(workflow.jobs).length;
      
      // Check for performance optimizations
      const workflowContent = JSON.stringify(workflow);
      performance.usesCaching = workflowContent.includes('cache');
      performance.hasTimeouts = workflowContent.includes('timeout');

      if (performance.usesCaching) performance.optimizationScore += 2;
      if (performance.hasTimeouts) performance.optimizationScore += 1;
      if (performance.parallelJobs > 1) performance.optimizationScore += 1;
    }

    return performance;
  }

  /**
   * Check workflow modernization status
   */
  checkWorkflowModernization(workflow) {
    const modernization = {
      usesLatestActions: false,
      usesV4Actions: false,
      hasModernSyntax: false,
      legacyFeatures: [],
      modernizationScore: 5
    };

    const workflowContent = JSON.stringify(workflow);
    
    // Check for v4 actions
    modernization.usesV4Actions = workflowContent.includes('@v4');
    if (modernization.usesV4Actions) modernization.modernizationScore += 2;

    // Check for legacy features
    if (workflowContent.includes('@v1') || workflowContent.includes('@v2')) {
      modernization.legacyFeatures.push('Uses legacy action versions');
      modernization.modernizationScore -= 2;
    }

    // Check for modern syntax features
    modernization.hasModernSyntax = workflowContent.includes('matrix') ||
                                   workflowContent.includes('strategy') ||
                                   workflowContent.includes('outputs');
    if (modernization.hasModernSyntax) modernization.modernizationScore += 1;

    return modernization;
  }

  /**
   * Check overall workflow health
   */
  checkWorkflowHealth(workflow) {
    const health = {
      isHealthy: true,
      healthScore: 10,
      issues: [],
      warnings: []
    };

    // Basic validation
    if (!workflow.name) {
      health.issues.push('Missing workflow name');
      health.healthScore -= 2;
      health.isHealthy = false;
    }

    if (!workflow.on) {
      health.issues.push('Missing trigger configuration');
      health.healthScore -= 3;
      health.isHealthy = false;
    }

    if (!workflow.jobs || Object.keys(workflow.jobs).length === 0) {
      health.issues.push('No jobs defined');
      health.healthScore -= 4;
      health.isHealthy = false;
    }

    // Warnings for best practices
    if (!workflow.env) {
      health.warnings.push('Consider adding environment variables section');
      health.healthScore -= 1;
    }

    return health;
  }

  /**
   * Analyze Copilot configurations
   */
  async analyzeCopilotConfigurations() {
    console.log('🤖 Analyzing Copilot configurations...');
    
    try {
      // Check copilot-instructions.md
      const instructionsPath = path.join(this.githubPath, 'copilot-instructions.md');
      if (await this.fileExists(instructionsPath)) {
        const analysis = await this.analyzeCopilotInstructions(instructionsPath);
        this.analysisResults.copilotConfigs.push(analysis);
      }

      // Check copilot directory
      if (await this.fileExists(this.copilotPath)) {
        const copilotFiles = await fs.readdir(this.copilotPath, { withFileTypes: true });
        for (const entry of copilotFiles) {
          if (entry.isFile()) {
            const filePath = path.join(this.copilotPath, entry.name);
            const analysis = await this.analyzeCopilotConfigFile(filePath);
            this.analysisResults.copilotConfigs.push(analysis);
          }
        }
      }

      console.log(`📊 Analyzed ${this.analysisResults.copilotConfigs.length} Copilot configuration files`);
    } catch (error) {
      console.error('❌ Copilot configuration analysis failed:', error.message);
    }
  }

  /**
   * Analyze copilot-instructions.md
   */
  async analyzeCopilotInstructions(filePath) {
    console.log('  🔎 Analyzing Copilot instructions...');

    try {
      const content = await fs.readFile(filePath, 'utf8');
      
      const analysis = {
        fileName: 'copilot-instructions.md',
        filePath,
        type: 'instructions',
        contentLength: content.length,
        sections: this.extractMarkdownSections(content),
        hasProjectOverview: content.includes('## Project Overview'),
        hasCodingGuidelines: content.includes('Coding Guidelines') || content.includes('Guidelines'),
        hasPatterns: content.includes('pattern') || content.includes('Pattern'),
        hasExamples: content.includes('example') || content.includes('Example'),
        hasMCPIntegration: content.includes('MCP') || content.includes('Model Context Protocol'),
        hasSecurityGuidelines: content.includes('Security') || content.includes('security'),
        completenessScore: 0,
        rawContent: content
      };

      // Calculate completeness score
      analysis.completenessScore = this.calculateInstructionsCompleteness(analysis);

      return analysis;
    } catch (error) {
      return {
        fileName: 'copilot-instructions.md',
        filePath,
        error: error.message,
        isValid: false
      };
    }
  }

  /**
   * Extract markdown sections from content
   */
  extractMarkdownSections(content) {
    const sections = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      const match = line.match(/^#+\s+(.+)/);
      if (match) {
        sections.push({
          level: line.indexOf(' '),
          title: match[1]
        });
      }
    }
    
    return sections;
  }

  /**
   * Calculate instructions completeness score
   */
  calculateInstructionsCompleteness(analysis) {
    let score = 0;
    const maxScore = 10;

    if (analysis.hasProjectOverview) score += 2;
    if (analysis.hasCodingGuidelines) score += 2;
    if (analysis.hasPatterns) score += 1;
    if (analysis.hasExamples) score += 2;
    if (analysis.hasMCPIntegration) score += 1;
    if (analysis.hasSecurityGuidelines) score += 1;
    if (analysis.contentLength > 5000) score += 1;

    return Math.min(score, maxScore);
  }

  /**
   * Analyze other Copilot config files
   */
  async analyzeCopilotConfigFile(filePath) {
    const fileName = path.basename(filePath);
    console.log(`  🔎 Analyzing Copilot config: ${fileName}`);

    try {
      const content = await fs.readFile(filePath, 'utf8');
      const extension = path.extname(fileName);
      
      let parsedContent = null;
      if (extension === '.json') {
        parsedContent = JSON.parse(content);
      } else if (extension === '.yml' || extension === '.yaml') {
        parsedContent = yaml.load(content);
      }

      return {
        fileName,
        filePath,
        type: extension.slice(1) || 'text',
        contentLength: content.length,
        isValid: true,
        parsedContent,
        rawContent: content
      };
    } catch (error) {
      return {
        fileName,
        filePath,
        error: error.message,
        isValid: false
      };
    }
  }

  /**
   * Analyze custom instructions and configurations
   */
  async analyzeCustomInstructions() {
    console.log('📝 Analyzing custom instructions...');
    
    try {
      // Check agent-workflow directory
      if (await this.fileExists(this.agentWorkflowPath)) {
        const files = await fs.readdir(this.agentWorkflowPath, { withFileTypes: true });
        
        for (const entry of files) {
          if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.json'))) {
            const filePath = path.join(this.agentWorkflowPath, entry.name);
            const analysis = await this.analyzeCustomInstructionFile(filePath);
            this.analysisResults.customInstructions.push(analysis);
          }
        }
      }

      console.log(`📊 Analyzed ${this.analysisResults.customInstructions.length} custom instruction files`);
    } catch (error) {
      console.error('❌ Custom instructions analysis failed:', error.message);
    }
  }

  /**
   * Analyze custom instruction file
   */
  async analyzeCustomInstructionFile(filePath) {
    const fileName = path.basename(filePath);
    console.log(`  🔎 Analyzing custom instruction: ${fileName}`);

    try {
      const content = await fs.readFile(filePath, 'utf8');
      const extension = path.extname(fileName);
      
      let parsedContent = null;
      if (extension === '.json') {
        parsedContent = JSON.parse(content);
      }

      return {
        fileName,
        filePath,
        type: extension.slice(1),
        contentLength: content.length,
        isAgentConfig: fileName.includes('agent') || fileName.includes('workflow'),
        hasInstructions: content.includes('instruction') || content.includes('prompt'),
        hasConfiguration: content.includes('config') || content.includes('setting'),
        isValid: true,
        parsedContent,
        rawContent: content
      };
    } catch (error) {
      return {
        fileName,
        filePath,
        error: error.message,
        isValid: false
      };
    }
  }

  /**
   * Detect issues across all analyzed components
   */
  async detectIssues() {
    console.log('🔍 Detecting configuration and workflow issues...');
    
    const issues = [];

    // Check workflow issues
    for (const workflow of this.analysisResults.workflows) {
      if (workflow.error) {
        issues.push({
          type: 'error',
          severity: 'high',
          category: 'workflow',
          file: workflow.fileName,
          message: `Workflow parsing failed: ${workflow.error}`,
          fix: 'Check YAML syntax and structure'
        });
      }

      if (workflow.structure && !workflow.structure.isValid) {
        issues.push({
          type: 'structure',
          severity: 'medium',
          category: 'workflow',
          file: workflow.fileName,
          message: `Missing required sections: ${workflow.structure.missingSections.join(', ')}`,
          fix: `Add missing sections: ${workflow.structure.missingSections.join(', ')}`
        });
      }

      if (workflow.security && workflow.security.securityScore < 7) {
        issues.push({
          type: 'security',
          severity: 'high',
          category: 'workflow',
          file: workflow.fileName,
          message: `Security issues detected: ${workflow.security.hasSecurityIssues.join(', ')}`,
          fix: 'Review and fix security issues'
        });
      }

      if (workflow.modernization && workflow.modernization.modernizationScore < 5) {
        issues.push({
          type: 'modernization',
          severity: 'low',
          category: 'workflow',
          file: workflow.fileName,
          message: `Legacy workflow detected: ${workflow.modernization.legacyFeatures.join(', ')}`,
          fix: 'Update to modern workflow syntax and actions'
        });
      }
    }

    // Check Copilot config issues
    for (const config of this.analysisResults.copilotConfigs) {
      if (config.error) {
        issues.push({
          type: 'error',
          severity: 'medium',
          category: 'copilot',
          file: config.fileName,
          message: `Configuration parsing failed: ${config.error}`,
          fix: 'Check file syntax and structure'
        });
      }

      if (config.type === 'instructions' && config.completenessScore < 7) {
        issues.push({
          type: 'completeness',
          severity: 'medium',
          category: 'copilot',
          file: config.fileName,
          message: 'Copilot instructions are incomplete',
          fix: 'Add missing sections: project overview, coding guidelines, examples'
        });
      }
    }

    this.analysisResults.issues = issues;
    console.log(`🚨 Found ${issues.length} issues`);
  }

  /**
   * Generate optimization recommendations
   */
  async generateRecommendations() {
    console.log('💡 Generating optimization recommendations...');
    
    const recommendations = [];

    // Workflow recommendations
    const agentWorkflows = this.analysisResults.workflows.filter(w => w.isAgentRelated);
    
    if (agentWorkflows.length === 0) {
      recommendations.push({
        type: 'enhancement',
        priority: 'medium',
        category: 'workflow',
        title: 'Add dedicated agent workflows',
        description: 'No agent-specific workflows detected',
        implementation: 'Create workflows for agent automation and validation'
      });
    }

    for (const workflow of agentWorkflows) {
      if (!workflow.triggers?.supportsPRInput) {
        recommendations.push({
          type: 'enhancement',
          priority: 'high',
          category: 'workflow',
          file: workflow.fileName,
          title: 'Enable PR-driven execution',
          description: 'Workflow should support PR input for user-driven automation',
          implementation: 'Add pull_request trigger and input parameters'
        });
      }

      if (workflow.performance && workflow.performance.optimizationScore < 7) {
        recommendations.push({
          type: 'optimization',
          priority: 'medium',
          category: 'workflow',
          file: workflow.fileName,
          title: 'Improve workflow performance',
          description: 'Workflow can be optimized for better performance',
          implementation: 'Add caching, timeouts, and parallel job execution'
        });
      }
    }

    // Copilot recommendations
    const instructionsConfig = this.analysisResults.copilotConfigs.find(c => 
      c.fileName === 'copilot-instructions.md'
    );

    if (!instructionsConfig) {
      recommendations.push({
        type: 'missing',
        priority: 'high',
        category: 'copilot',
        title: 'Add Copilot instructions',
        description: 'No copilot-instructions.md file found',
        implementation: 'Create comprehensive Copilot instructions file'
      });
    } else if (instructionsConfig.completenessScore < 8) {
      recommendations.push({
        type: 'enhancement',
        priority: 'medium',
        category: 'copilot',
        file: instructionsConfig.fileName,
        title: 'Improve Copilot instructions',
        description: 'Instructions are incomplete and could be enhanced',
        implementation: 'Add missing sections and improve existing content'
      });
    }

    this.analysisResults.recommendations = recommendations;
    console.log(`💡 Generated ${recommendations.length} recommendations`);
  }

  /**
   * Utility method to check if file exists
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate comprehensive analysis report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalWorkflows: this.analysisResults.workflows.length,
        agentWorkflows: this.analysisResults.workflows.filter(w => w.isAgentRelated).length,
        copilotWorkflows: this.analysisResults.workflows.filter(w => w.isCopilotRelated).length,
        copilotConfigs: this.analysisResults.copilotConfigs.length,
        customInstructions: this.analysisResults.customInstructions.length,
        totalIssues: this.analysisResults.issues.length,
        highSeverityIssues: this.analysisResults.issues.filter(i => i.severity === 'high').length,
        totalRecommendations: this.analysisResults.recommendations.length
      },
      details: this.analysisResults
    };

    return report;
  }
}

module.exports = CodingAgentAnalyzer;
/**
 * Workflow Validator & Testing Framework
 * 
 * This module provides comprehensive testing and validation capabilities
 * for GitHub Actions workflows and agent configurations.
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class WorkflowValidator {
  constructor(options = {}) {
    this.basePath = options.basePath || process.cwd();
    this.workflowsPath = path.join(this.basePath, '.github', 'workflows');
    this.testResults = {
      syntax: [],
      logic: [],
      security: [],
      performance: [],
      integration: []
    };
  }

  /**
   * Run comprehensive workflow validation
   */
  async validateAll() {
    console.log('🧪 Starting comprehensive workflow validation...');
    
    try {
      await this.validateSyntax();
      await this.validateLogic();
      await this.validateSecurity();
      await this.validatePerformance();
      await this.validateIntegration();
      
      const report = this.generateValidationReport();
      console.log('✅ Workflow validation completed');
      return report;
    } catch (error) {
      console.error('❌ Workflow validation failed:', error.message);
      throw error;
    }
  }

  /**
   * Validate YAML syntax of all workflows
   */
  async validateSyntax() {
    console.log('📝 Validating workflow syntax...');
    
    try {
      const files = await fs.readdir(this.workflowsPath);
      const yamlFiles = files.filter(file => 
        file.endsWith('.yml') || file.endsWith('.yaml')
      );

      for (const file of yamlFiles) {
        const filePath = path.join(this.workflowsPath, file);
        const result = await this.validateWorkflowSyntax(filePath);
        this.testResults.syntax.push(result);
      }

      const failedCount = this.testResults.syntax.filter(r => !r.isValid).length;
      console.log(`📊 Syntax validation: ${yamlFiles.length - failedCount}/${yamlFiles.length} passed`);
    } catch (error) {
      console.error('❌ Syntax validation failed:', error.message);
      throw error;
    }
  }

  /**
   * Validate single workflow syntax
   */
  async validateWorkflowSyntax(filePath) {
    const fileName = path.basename(filePath);
    
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const workflow = yaml.load(content);
      
      // Basic structure validation
      const errors = [];
      const warnings = [];

      if (!workflow.name) {
        warnings.push('Missing workflow name');
      }

      if (!workflow.on) {
        errors.push('Missing trigger configuration (on)');
      }

      if (!workflow.jobs || Object.keys(workflow.jobs).length === 0) {
        errors.push('No jobs defined');
      }

      // Validate job structure
      if (workflow.jobs) {
        for (const [jobName, job] of Object.entries(workflow.jobs)) {
          if (!job['runs-on']) {
            errors.push(`Job '${jobName}' missing runs-on`);
          }
          
          if (!job.steps || job.steps.length === 0) {
            warnings.push(`Job '${jobName}' has no steps`);
          }
        }
      }

      return {
        fileName,
        filePath,
        isValid: errors.length === 0,
        errors,
        warnings,
        workflow
      };
    } catch (error) {
      return {
        fileName,
        filePath,
        isValid: false,
        errors: [`YAML parsing error: ${error.message}`],
        warnings: [],
        parseError: true
      };
    }
  }

  /**
   * Validate workflow logic and flow
   */
  async validateLogic() {
    console.log('🔍 Validating workflow logic...');
    
    const validSyntaxWorkflows = this.testResults.syntax.filter(r => r.isValid);
    
    for (const syntaxResult of validSyntaxWorkflows) {
      const result = await this.validateWorkflowLogic(syntaxResult);
      this.testResults.logic.push(result);
    }

    const passedCount = this.testResults.logic.filter(r => r.isValid).length;
    console.log(`🔍 Logic validation: ${passedCount}/${this.testResults.logic.length} passed`);
  }

  /**
   * Validate single workflow logic
   */
  async validateWorkflowLogic(syntaxResult) {
    const { fileName, workflow } = syntaxResult;
    const issues = [];
    const suggestions = [];

    try {
      // Check for job dependencies
      if (workflow.jobs) {
        const jobNames = Object.keys(workflow.jobs);
        
        for (const [jobName, job] of Object.entries(workflow.jobs)) {
          // Check if job dependencies exist
          if (job.needs) {
            const dependencies = Array.isArray(job.needs) ? job.needs : [job.needs];
            for (const dep of dependencies) {
              if (!jobNames.includes(dep)) {
                issues.push(`Job '${jobName}' depends on non-existent job '${dep}'`);
              }
            }
          }

          // Check for circular dependencies
          if (job.needs && job.needs.includes(jobName)) {
            issues.push(`Job '${jobName}' has circular dependency on itself`);
          }

          // Check step logic
          if (job.steps) {
            for (let i = 0; i < job.steps.length; i++) {
              const step = job.steps[i];
              
              // Check for missing action or run
              if (!step.uses && !step.run) {
                issues.push(`Job '${jobName}', step ${i + 1}: Missing 'uses' or 'run'`);
              }

              // Check for potential secret exposure
              if (step.run && typeof step.run === 'string') {
                const runCommand = step.run.toLowerCase();
                if (runCommand.includes('echo') && runCommand.includes('${{')) {
                  suggestions.push(`Job '${jobName}', step ${i + 1}: Potential secret exposure in echo command`);
                }
              }
            }
          }
        }
      }

      // Check trigger logic
      if (workflow.on) {
        if (workflow.on.pull_request && workflow.on.pull_request_target) {
          suggestions.push('Using both pull_request and pull_request_target may be redundant');
        }

        // Check for schedule format
        if (workflow.on.schedule) {
          for (const schedule of workflow.on.schedule) {
            if (schedule.cron && !this.validateCronExpression(schedule.cron)) {
              issues.push(`Invalid cron expression: ${schedule.cron}`);
            }
          }
        }
      }

      return {
        fileName,
        isValid: issues.length === 0,
        issues,
        suggestions
      };
    } catch (error) {
      return {
        fileName,
        isValid: false,
        issues: [`Logic validation error: ${error.message}`],
        suggestions: []
      };
    }
  }

  /**
   * Basic cron expression validation
   */
  validateCronExpression(cronExpr) {
    const parts = cronExpr.trim().split(/\s+/);
    return parts.length === 5;
  }

  /**
   * Validate workflow security
   */
  async validateSecurity() {
    console.log('🔒 Validating workflow security...');
    
    const validWorkflows = this.testResults.syntax.filter(r => r.isValid);
    
    for (const syntaxResult of validWorkflows) {
      const result = await this.validateWorkflowSecurity(syntaxResult);
      this.testResults.security.push(result);
    }

    const passedCount = this.testResults.security.filter(r => r.securityScore >= 7).length;
    console.log(`🔒 Security validation: ${passedCount}/${this.testResults.security.length} passed`);
  }

  /**
   * Validate single workflow security
   */
  async validateWorkflowSecurity(syntaxResult) {
    const { fileName, workflow } = syntaxResult;
    const securityIssues = [];
    const recommendations = [];
    let securityScore = 10;

    try {
      const workflowContent = JSON.stringify(workflow).toLowerCase();

      // Check for pull_request_target usage
      if (workflow.on && workflow.on.pull_request_target) {
        securityIssues.push('Uses pull_request_target - review for security implications');
        securityScore -= 2;
      }

      // Check permissions
      if (!workflow.permissions && workflowContent.includes('secrets.')) {
        securityIssues.push('Uses secrets without explicit permissions');
        recommendations.push('Add explicit permissions block');
        securityScore -= 2;
      }

      // Check for sudo usage
      if (workflowContent.includes('sudo')) {
        securityIssues.push('Uses sudo - potential privilege escalation');
        recommendations.push('Minimize sudo usage or use specific permissions');
        securityScore -= 1;
      }

      // Check for shell injection risks
      if (workflow.jobs) {
        for (const [jobName, job] of Object.entries(workflow.jobs)) {
          if (job.steps) {
            for (let i = 0; i < job.steps.length; i++) {
              const step = job.steps[i];
              
              if (step.run && typeof step.run === 'string') {
                // Check for potential shell injection
                if (step.run.includes('${{') && 
                   (step.run.includes('github.event') || step.run.includes('github.head_ref'))) {
                  securityIssues.push(`Job '${jobName}', step ${i + 1}: Potential shell injection from user input`);
                  securityScore -= 3;
                }
              }
            }
          }
        }
      }

      // Check for third-party actions
      const actions = this.extractActionsFromWorkflow(workflow);
      const thirdPartyActions = actions.filter(action => 
        !action.startsWith('actions/') && !action.startsWith('github/')
      );

      if (thirdPartyActions.length > 0) {
        recommendations.push(`Review third-party actions: ${thirdPartyActions.join(', ')}`);
        securityScore -= Math.min(thirdPartyActions.length * 0.5, 2);
      }

      return {
        fileName,
        securityScore: Math.max(securityScore, 0),
        securityIssues,
        recommendations,
        thirdPartyActions,
        isSecure: securityScore >= 7
      };
    } catch (error) {
      return {
        fileName,
        securityScore: 0,
        securityIssues: [`Security validation error: ${error.message}`],
        recommendations: [],
        thirdPartyActions: [],
        isSecure: false
      };
    }
  }

  /**
   * Extract actions used in workflow
   */
  extractActionsFromWorkflow(workflow) {
    const actions = [];
    
    if (workflow.jobs) {
      for (const job of Object.values(workflow.jobs)) {
        if (job.steps) {
          for (const step of job.steps) {
            if (step.uses) {
              // Extract action name (before @)
              const actionName = step.uses.split('@')[0];
              if (!actions.includes(actionName)) {
                actions.push(actionName);
              }
            }
          }
        }
      }
    }
    
    return actions;
  }

  /**
   * Validate workflow performance
   */
  async validatePerformance() {
    console.log('⚡ Validating workflow performance...');
    
    const validWorkflows = this.testResults.syntax.filter(r => r.isValid);
    
    for (const syntaxResult of validWorkflows) {
      const result = await this.validateWorkflowPerformance(syntaxResult);
      this.testResults.performance.push(result);
    }

    const efficientCount = this.testResults.performance.filter(r => r.performanceScore >= 7).length;
    console.log(`⚡ Performance validation: ${efficientCount}/${this.testResults.performance.length} efficient`);
  }

  /**
   * Validate single workflow performance
   */
  async validateWorkflowPerformance(syntaxResult) {
    const { fileName, workflow } = syntaxResult;
    const performanceIssues = [];
    const optimizations = [];
    let performanceScore = 10;

    try {
      // Check for caching
      const usesCaching = this.checkWorkflowUsesCaching(workflow);
      if (!usesCaching) {
        performanceIssues.push('No caching detected');
        optimizations.push('Add caching for dependencies and build artifacts');
        performanceScore -= 2;
      }

      // Check for timeouts
      const hasTimeouts = this.checkWorkflowHasTimeouts(workflow);
      if (!hasTimeouts) {
        performanceIssues.push('No timeout configuration');
        optimizations.push('Add timeout-minutes to prevent hanging jobs');
        performanceScore -= 1;
      }

      // Check job parallelization
      if (workflow.jobs) {
        const jobCount = Object.keys(workflow.jobs).length;
        const jobsWithDependencies = Object.values(workflow.jobs).filter(job => job.needs).length;
        
        if (jobCount > 1 && jobsWithDependencies === jobCount - 1) {
          performanceIssues.push('Jobs are mostly sequential');
          optimizations.push('Consider parallelizing independent jobs');
          performanceScore -= 1;
        }

        // Check for matrix strategies
        const hasMatrix = Object.values(workflow.jobs).some(job => job.strategy?.matrix);
        if (!hasMatrix && this.shouldUseMatrix(workflow)) {
          optimizations.push('Consider using matrix strategy for multi-environment testing');
          performanceScore -= 0.5;
        }
      }

      // Check for unnecessary triggers
      if (workflow.on) {
        const triggers = Object.keys(workflow.on);
        if (triggers.length > 5) {
          performanceIssues.push('Too many triggers may cause excessive runs');
          optimizations.push('Review and optimize trigger conditions');
          performanceScore -= 1;
        }
      }

      return {
        fileName,
        performanceScore: Math.max(performanceScore, 0),
        performanceIssues,
        optimizations,
        usesCaching,
        hasTimeouts,
        isEfficient: performanceScore >= 7
      };
    } catch (error) {
      return {
        fileName,
        performanceScore: 0,
        performanceIssues: [`Performance validation error: ${error.message}`],
        optimizations: [],
        usesCaching: false,
        hasTimeouts: false,
        isEfficient: false
      };
    }
  }

  /**
   * Check if workflow uses caching
   */
  checkWorkflowUsesCaching(workflow) {
    const workflowContent = JSON.stringify(workflow).toLowerCase();
    return workflowContent.includes('cache') || workflowContent.includes('setup-node');
  }

  /**
   * Check if workflow has timeout configurations
   */
  checkWorkflowHasTimeouts(workflow) {
    const workflowContent = JSON.stringify(workflow);
    return workflowContent.includes('timeout-minutes');
  }

  /**
   * Determine if workflow should use matrix strategy
   */
  shouldUseMatrix(workflow) {
    const workflowContent = JSON.stringify(workflow).toLowerCase();
    return workflowContent.includes('node') || 
           workflowContent.includes('python') || 
           workflowContent.includes('test');
  }

  /**
   * Validate integration with existing systems
   */
  async validateIntegration() {
    console.log('🔗 Validating workflow integrations...');
    
    const validWorkflows = this.testResults.syntax.filter(r => r.isValid);
    
    for (const syntaxResult of validWorkflows) {
      const result = await this.validateWorkflowIntegration(syntaxResult);
      this.testResults.integration.push(result);
    }

    const integratedCount = this.testResults.integration.filter(r => r.isWellIntegrated).length;
    console.log(`🔗 Integration validation: ${integratedCount}/${this.testResults.integration.length} well-integrated`);
  }

  /**
   * Validate single workflow integration
   */
  async validateWorkflowIntegration(syntaxResult) {
    const { fileName, workflow } = syntaxResult;
    const integrationIssues = [];
    const suggestions = [];
    let integrationScore = 10;

    try {
      // Check for MCP integration
      const workflowContent = JSON.stringify(workflow).toLowerCase();
      const hasMCPIntegration = workflowContent.includes('mcp') || 
                               workflowContent.includes('model context protocol');

      // Check for Copilot integration
      const hasCopilotIntegration = workflowContent.includes('copilot') || 
                                   workflowContent.includes('gpt') ||
                                   workflowContent.includes('openai');

      // Check for proper environment configuration
      const hasEnvironmentConfig = Boolean(workflow.env);
      if (!hasEnvironmentConfig) {
        integrationIssues.push('Missing environment configuration');
        suggestions.push('Add env section for better configuration management');
        integrationScore -= 1;
      }

      // Check for secrets usage in agent workflows
      const isAgentWorkflow = fileName.toLowerCase().includes('agent') || 
                             fileName.toLowerCase().includes('copilot');
      
      if (isAgentWorkflow && !workflowContent.includes('secrets.')) {
        integrationIssues.push('Agent workflow missing required secrets');
        suggestions.push('Add necessary API keys and tokens');
        integrationScore -= 2;
      }

      // Check for artifact handling
      const hasArtifacts = workflowContent.includes('upload-artifact') || 
                          workflowContent.includes('download-artifact');

      // Check for status reporting
      const hasStatusReporting = workflowContent.includes('comment') || 
                                workflowContent.includes('status') ||
                                workflowContent.includes('report');

      if (isAgentWorkflow && !hasStatusReporting) {
        suggestions.push('Consider adding status reporting for better user feedback');
        integrationScore -= 0.5;
      }

      return {
        fileName,
        integrationScore: Math.max(integrationScore, 0),
        integrationIssues,
        suggestions,
        hasMCPIntegration,
        hasCopilotIntegration,
        hasEnvironmentConfig,
        hasArtifacts,
        hasStatusReporting,
        isWellIntegrated: integrationScore >= 7
      };
    } catch (error) {
      return {
        fileName,
        integrationScore: 0,
        integrationIssues: [`Integration validation error: ${error.message}`],
        suggestions: [],
        hasMCPIntegration: false,
        hasCopilotIntegration: false,
        hasEnvironmentConfig: false,
        hasArtifacts: false,
        hasStatusReporting: false,
        isWellIntegrated: false
      };
    }
  }

  /**
   * Generate comprehensive validation report
   */
  generateValidationReport() {
    const totalWorkflows = this.testResults.syntax.length;
    const validSyntax = this.testResults.syntax.filter(r => r.isValid).length;
    const validLogic = this.testResults.logic.filter(r => r.isValid).length;
    const secureWorkflows = this.testResults.security.filter(r => r.isSecure).length;
    const efficientWorkflows = this.testResults.performance.filter(r => r.isEfficient).length;
    const integratedWorkflows = this.testResults.integration.filter(r => r.isWellIntegrated).length;

    const overallScore = Math.round(
      ((validSyntax + validLogic + secureWorkflows + efficientWorkflows + integratedWorkflows) / 
       (totalWorkflows * 5)) * 100
    );

    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalWorkflows,
        validSyntax,
        validLogic,
        secureWorkflows,
        efficientWorkflows,
        integratedWorkflows,
        overallScore
      },
      details: this.testResults,
      recommendations: this.generateOverallRecommendations()
    };
  }

  /**
   * Generate overall recommendations based on validation results
   */
  generateOverallRecommendations() {
    const recommendations = [];

    // Syntax issues
    const syntaxErrors = this.testResults.syntax.filter(r => !r.isValid);
    if (syntaxErrors.length > 0) {
      recommendations.push({
        type: 'critical',
        category: 'syntax',
        message: `${syntaxErrors.length} workflows have syntax errors`,
        action: 'Fix YAML syntax and structure issues'
      });
    }

    // Security issues
    const insecureWorkflows = this.testResults.security.filter(r => !r.isSecure);
    if (insecureWorkflows.length > 0) {
      recommendations.push({
        type: 'high',
        category: 'security',
        message: `${insecureWorkflows.length} workflows have security concerns`,
        action: 'Review and fix security vulnerabilities'
      });
    }

    // Performance issues
    const inefficientWorkflows = this.testResults.performance.filter(r => !r.isEfficient);
    if (inefficientWorkflows.length > 0) {
      recommendations.push({
        type: 'medium',
        category: 'performance',
        message: `${inefficientWorkflows.length} workflows can be optimized`,
        action: 'Add caching, timeouts, and parallelize jobs where possible'
      });
    }

    // Integration issues
    const poorlyIntegratedWorkflows = this.testResults.integration.filter(r => !r.isWellIntegrated);
    if (poorlyIntegratedWorkflows.length > 0) {
      recommendations.push({
        type: 'medium',
        category: 'integration',
        message: `${poorlyIntegratedWorkflows.length} workflows have integration issues`,
        action: 'Improve environment configuration and status reporting'
      });
    }

    return recommendations;
  }
}

module.exports = WorkflowValidator;
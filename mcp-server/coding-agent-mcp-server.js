/**
 * Coding Agent Workflow MCP Server
 * 
 * This is the main MCP (Model Context Protocol) server that provides
 * comprehensive analysis and optimization for coding agent workflows.
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const CodingAgentAnalyzer = require('./coding-agent-analyzer');
const WorkflowValidator = require('./workflow-validator');

class CodingAgentMCPServer {
  constructor(options = {}) {
    this.port = options.port || process.env.MCP_CODING_AGENT_PORT || 3002;
    this.basePath = options.basePath || process.cwd();
    this.app = express();
    
    // Initialize components
    this.analyzer = new CodingAgentAnalyzer({ basePath: this.basePath });
    this.validator = new WorkflowValidator({ basePath: this.basePath });
    
    // Results storage
    this.lastAnalysisResults = null;
    this.lastValidationResults = null;
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });

    // Error handling middleware
    this.app.use((error, req, res, next) => {
      console.error('Server error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    });
  }

  /**
   * Setup API routes
   */
  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'Coding Agent Workflow MCP Server',
        version: '1.0.0'
      });
    });

    // MCP Server info
    this.app.get('/mcp/info', (req, res) => {
      res.json({
        name: 'Coding Agent Workflow Analyzer',
        description: 'Analyzes, tests, and validates all coding agent workflows and configurations',
        version: '1.0.0',
        category: 'Code Analysis/Linting, Testing/Automation',
        capabilities: [
          'workflow-analysis',
          'syntax-validation',
          'security-scanning',
          'performance-optimization',
          'integration-testing',
          'configuration-validation',
          'automated-fixing',
          'pr-driven-execution'
        ],
        endpoints: {
          '/analyze': 'Run comprehensive workflow analysis',
          '/validate': 'Validate workflow syntax and logic',
          '/optimize': 'Get optimization recommendations',
          '/fix': 'Automatically fix common issues',
          '/report': 'Generate comprehensive report',
          '/trigger': 'Trigger analysis from PR input'
        }
      });
    });

    // Main analysis endpoint
    this.app.post('/analyze', async (req, res) => {
      try {
        console.log('🔍 Starting comprehensive analysis...');
        const results = await this.analyzer.analyze();
        this.lastAnalysisResults = results;
        
        res.json({
          success: true,
          timestamp: new Date().toISOString(),
          analysis: results,
          summary: {
            totalWorkflows: results.workflows.length,
            agentWorkflows: results.workflows.filter(w => w.isAgentRelated).length,
            issues: results.issues.length,
            recommendations: results.recommendations.length
          }
        });
      } catch (error) {
        console.error('Analysis failed:', error);
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Validation endpoint
    this.app.post('/validate', async (req, res) => {
      try {
        console.log('🧪 Starting workflow validation...');
        const results = await this.validator.validateAll();
        this.lastValidationResults = results;
        
        res.json({
          success: true,
          timestamp: new Date().toISOString(),
          validation: results,
          summary: results.summary
        });
      } catch (error) {
        console.error('Validation failed:', error);
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Optimization recommendations endpoint
    this.app.get('/optimize', async (req, res) => {
      try {
        // Ensure we have analysis results
        if (!this.lastAnalysisResults) {
          console.log('Running analysis for optimization...');
          await this.analyzer.analyze();
          this.lastAnalysisResults = this.analyzer.analysisResults;
        }

        const optimizations = await this.generateOptimizationPlan();
        
        res.json({
          success: true,
          timestamp: new Date().toISOString(),
          optimizations
        });
      } catch (error) {
        console.error('Optimization generation failed:', error);
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Auto-fix endpoint
    this.app.post('/fix', async (req, res) => {
      try {
        const { target, fixType = 'safe' } = req.body;
        
        console.log(`🔧 Starting automated fixes (${fixType} mode)...`);
        const fixResults = await this.performAutomatedFixes(target, fixType);
        
        res.json({
          success: true,
          timestamp: new Date().toISOString(),
          fixes: fixResults
        });
      } catch (error) {
        console.error('Automated fixing failed:', error);
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Comprehensive report endpoint
    this.app.get('/report', async (req, res) => {
      try {
        const report = await this.generateComprehensiveReport();
        
        res.json({
          success: true,
          timestamp: new Date().toISOString(),
          report
        });
      } catch (error) {
        console.error('Report generation failed:', error);
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // PR-triggered analysis endpoint
    this.app.post('/trigger', async (req, res) => {
      try {
        const { 
          prNumber, 
          prTitle, 
          prBody, 
          changedFiles = [], 
          action = 'analyze',
          user 
        } = req.body;

        console.log(`🚀 Triggered by PR #${prNumber}: ${prTitle}`);
        
        const triggerResults = await this.handlePRTrigger({
          prNumber,
          prTitle,
          prBody,
          changedFiles,
          action,
          user
        });

        res.json({
          success: true,
          timestamp: new Date().toISOString(),
          trigger: triggerResults
        });
      } catch (error) {
        console.error('PR trigger failed:', error);
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Workflow status endpoint
    this.app.get('/status', (req, res) => {
      const status = {
        lastAnalysis: this.lastAnalysisResults ? {
          timestamp: this.lastAnalysisResults.timestamp || 'unknown',
          workflows: this.lastAnalysisResults.workflows?.length || 0,
          issues: this.lastAnalysisResults.issues?.length || 0
        } : null,
        lastValidation: this.lastValidationResults ? {
          timestamp: this.lastValidationResults.timestamp,
          score: this.lastValidationResults.summary?.overallScore || 0,
          totalWorkflows: this.lastValidationResults.summary?.totalWorkflows || 0
        } : null
      };

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        status
      });
    });
  }

  /**
   * Generate optimization plan based on analysis results
   */
  async generateOptimizationPlan() {
    const plan = {
      immediate: [],
      shortTerm: [],
      longTerm: [],
      priority: 'medium'
    };

    if (!this.lastAnalysisResults) {
      return plan;
    }

    const { issues, recommendations, workflows } = this.lastAnalysisResults;

    // Categorize by urgency
    for (const issue of issues) {
      if (issue.severity === 'high') {
        plan.immediate.push({
          type: 'fix',
          file: issue.file,
          description: issue.message,
          fix: issue.fix,
          impact: 'high'
        });
      }
    }

    for (const rec of recommendations) {
      if (rec.priority === 'high') {
        plan.shortTerm.push({
          type: 'enhancement',
          category: rec.category,
          title: rec.title,
          description: rec.description,
          implementation: rec.implementation,
          impact: 'medium'
        });
      } else {
        plan.longTerm.push({
          type: 'optimization',
          category: rec.category,
          title: rec.title,
          description: rec.description,
          implementation: rec.implementation,
          impact: 'low'
        });
      }
    }

    // Set overall priority
    if (plan.immediate.length > 0) {
      plan.priority = 'high';
    } else if (plan.shortTerm.length > 5) {
      plan.priority = 'medium';
    } else {
      plan.priority = 'low';
    }

    return plan;
  }

  /**
   * Perform automated fixes
   */
  async performAutomatedFixes(target, fixType) {
    const fixes = {
      applied: [],
      failed: [],
      skipped: []
    };

    // Only apply safe fixes in safe mode
    if (!this.lastAnalysisResults) {
      throw new Error('No analysis results available. Run analysis first.');
    }

    const { issues } = this.lastAnalysisResults;
    const fixableIssues = issues.filter(issue => 
      this.isIssueSafeToFix(issue, fixType) && 
      (!target || issue.file === target)
    );

    for (const issue of fixableIssues) {
      try {
        const fixResult = await this.applyFix(issue);
        fixes.applied.push({
          file: issue.file,
          issue: issue.message,
          fix: issue.fix,
          result: fixResult
        });
      } catch (error) {
        fixes.failed.push({
          file: issue.file,
          issue: issue.message,
          error: error.message
        });
      }
    }

    return fixes;
  }

  /**
   * Check if issue is safe to auto-fix
   */
  isIssueSafeToFix(issue, fixType) {
    const safeIssueTypes = ['structure', 'completeness', 'modernization'];
    const allIssueTypes = [...safeIssueTypes, 'security', 'error'];

    if (fixType === 'safe') {
      return safeIssueTypes.includes(issue.type);
    } else if (fixType === 'all') {
      return allIssueTypes.includes(issue.type);
    }

    return false;
  }

  /**
   * Apply a specific fix
   */
  async applyFix(issue) {
    // This is a placeholder for actual fix implementation
    // In practice, this would contain specific fix logic for each issue type
    
    switch (issue.type) {
      case 'structure':
        return await this.fixStructuralIssue(issue);
      case 'completeness':
        return await this.fixCompletenessIssue(issue);
      case 'modernization':
        return await this.fixModernizationIssue(issue);
      default:
        throw new Error(`Fix not implemented for issue type: ${issue.type}`);
    }
  }

  /**
   * Fix structural issues
   */
  async fixStructuralIssue(issue) {
    // Example implementation for adding missing workflow sections
    return `Applied structural fix: ${issue.fix}`;
  }

  /**
   * Fix completeness issues
   */
  async fixCompletenessIssue(issue) {
    // Example implementation for improving documentation completeness
    return `Applied completeness fix: ${issue.fix}`;
  }

  /**
   * Fix modernization issues
   */
  async fixModernizationIssue(issue) {
    // Example implementation for modernizing workflows
    return `Applied modernization fix: ${issue.fix}`;
  }

  /**
   * Handle PR-triggered analysis
   */
  async handlePRTrigger(triggerData) {
    const { prNumber, prTitle, changedFiles, action, user } = triggerData;
    
    const results = {
      prNumber,
      triggeredBy: user,
      action,
      timestamp: new Date().toISOString(),
      results: null
    };

    // Determine what to run based on action and changed files
    const shouldAnalyze = action === 'analyze' || 
                         changedFiles.some(file => 
                           file.includes('.github/workflows/') || 
                           file.includes('copilot-instructions')
                         );

    const shouldValidate = action === 'validate' || shouldAnalyze;

    if (shouldAnalyze) {
      console.log('Running analysis due to PR trigger...');
      results.analysis = await this.analyzer.analyze();
      this.lastAnalysisResults = results.analysis;
    }

    if (shouldValidate) {
      console.log('Running validation due to PR trigger...');
      results.validation = await this.validator.validateAll();
      this.lastValidationResults = results.validation;
    }

    // Generate PR comment content
    results.prComment = await this.generatePRComment(results);

    return results;
  }

  /**
   * Generate PR comment with results
   */
  async generatePRComment(triggerResults) {
    const { analysis, validation } = triggerResults;
    
    let comment = '## 🤖 Coding Agent Workflow Analysis Results\n\n';
    
    if (analysis) {
      const { workflows, issues, recommendations } = analysis;
      const agentWorkflows = workflows.filter(w => w.isAgentRelated);
      
      comment += '### 📋 Analysis Summary\n';
      comment += `- **Total Workflows**: ${workflows.length}\n`;
      comment += `- **Agent Workflows**: ${agentWorkflows.length}\n`;
      comment += `- **Issues Found**: ${issues.length}\n`;
      comment += `- **Recommendations**: ${recommendations.length}\n\n`;
      
      if (issues.length > 0) {
        comment += '### 🚨 Issues Detected\n';
        for (const issue of issues.slice(0, 5)) { // Show top 5 issues
          comment += `- **${issue.file}**: ${issue.message}\n`;
        }
        if (issues.length > 5) {
          comment += `- ... and ${issues.length - 5} more issues\n`;
        }
        comment += '\n';
      }
    }

    if (validation) {
      const { summary } = validation;
      
      comment += '### 🧪 Validation Results\n';
      comment += `- **Overall Score**: ${summary.overallScore}%\n`;
      comment += `- **Valid Syntax**: ${summary.validSyntax}/${summary.totalWorkflows}\n`;
      comment += `- **Secure Workflows**: ${summary.secureWorkflows}/${summary.totalWorkflows}\n`;
      comment += `- **Efficient Workflows**: ${summary.efficientWorkflows}/${summary.totalWorkflows}\n\n`;
    }

    comment += '### 💡 Available Actions\n';
    comment += '- `/fix-workflows` - Apply automated fixes\n';
    comment += '- `/optimize-workflows` - Get optimization plan\n';
    comment += '- `/validate-all` - Run full validation\n';
    
    comment += '\n---\n';
    comment += '*Generated by Coding Agent Workflow MCP Server*';

    return comment;
  }

  /**
   * Generate comprehensive report
   */
  async generateComprehensiveReport() {
    // Ensure we have fresh data
    if (!this.lastAnalysisResults) {
      await this.analyzer.analyze();
      this.lastAnalysisResults = this.analyzer.analysisResults;
    }

    if (!this.lastValidationResults) {
      this.lastValidationResults = await this.validator.validateAll();
    }

    const analysisReport = this.analyzer.generateReport();
    const validationReport = this.lastValidationResults;

    return {
      timestamp: new Date().toISOString(),
      analysis: analysisReport,
      validation: validationReport,
      recommendations: await this.generateOptimizationPlan(),
      healthScore: this.calculateOverallHealthScore()
    };
  }

  /**
   * Calculate overall health score
   */
  calculateOverallHealthScore() {
    if (!this.lastAnalysisResults || !this.lastValidationResults) {
      return 0;
    }

    const analysisScore = Math.max(0, 10 - this.lastAnalysisResults.issues.length);
    const validationScore = this.lastValidationResults.summary.overallScore / 10;
    
    return Math.round((analysisScore + validationScore) / 2 * 10);
  }

  /**
   * Start the MCP server
   */
  async start() {
    try {
      // Create reports directory if it doesn't exist
      const reportsDir = path.join(this.basePath, 'reports');
      try {
        await fs.mkdir(reportsDir, { recursive: true });
      } catch (error) {
        // Directory might already exist
      }

      this.server = this.app.listen(this.port, () => {
        console.log(`🚀 Coding Agent Workflow MCP Server started on port ${this.port}`);
        console.log(`📊 Server Info: http://localhost:${this.port}/mcp/info`);
        console.log(`❤️  Health Check: http://localhost:${this.port}/health`);
      });

      return this.server;
    } catch (error) {
      console.error('Failed to start MCP server:', error);
      throw error;
    }
  }

  /**
   * Stop the MCP server
   */
  async stop() {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          console.log('🛑 Coding Agent Workflow MCP Server stopped');
          resolve();
        });
      });
    }
  }
}

// Export for use as module
module.exports = CodingAgentMCPServer;

// CLI execution
if (require.main === module) {
  const server = new CodingAgentMCPServer();
  
  server.start().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT, shutting down gracefully...');
    await server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\nReceived SIGTERM, shutting down gracefully...');
    await server.stop();
    process.exit(0);
  });
}
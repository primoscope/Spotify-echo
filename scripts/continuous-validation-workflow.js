#!/usr/bin/env node
/**
 * Continuous Validation Workflow for EchoTune AI
 * 
 * This script implements the comprehensive validation workflow that must be
 * run before and after every code change or task. It leverages the MCP server
 * ecosystem for automated validation, testing, and monitoring.
 * 
 * Usage:
 *   node scripts/continuous-validation-workflow.js --pre-task
 *   node scripts/continuous-validation-workflow.js --post-task
 *   node scripts/continuous-validation-workflow.js --full
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class ContinuousValidationWorkflow {
  constructor() {
    this.results = {
      preTaskValidation: {},
      postTaskValidation: {},
      mcpServerStatus: {},
      errors: [],
      warnings: [],
      timestamp: new Date().toISOString()
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
      'info': '🔍',
      'success': '✅',
      'warning': '⚠️',
      'error': '❌',
      'action': '🚀'
    }[type] || '📋';
    
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async executeCommand(command, description, options = {}) {
    this.log(`${description}...`, 'action');
    try {
      const result = execSync(command, { 
        encoding: 'utf8', 
        cwd: process.cwd(),
        timeout: options.timeout || 30000,
        ...options
      });
      this.log(`${description} - PASSED`, 'success');
      return { success: true, output: result };
    } catch (error) {
      this.log(`${description} - FAILED: ${error.message}`, 'error');
      this.results.errors.push({
        command,
        description,
        error: error.message,
        output: error.stdout || error.output
      });
      return { success: false, error: error.message, output: error.stdout };
    }
  }

  async preTaskValidation() {
    this.log('🚀 Starting Pre-Task Validation', 'action');
    
    const validations = [
      // Code Quality Checks
      ['npm run lint', 'ESLint Code Quality Check'],
      ['npm run format:check', 'Prettier Code Formatting Check'],
      
      // Environment Validation
      ['npm run validate:env', 'Environment Variables Validation'],
      ['npm run validate:scripts', 'Shell Script Syntax Validation'],
      
      // Dependency Security
      ['npm audit --audit-level moderate', 'Dependency Security Audit'],
      
      // Unit Tests
      ['npm run test:unit', 'Unit Test Suite', { timeout: 120000 }],
      
      // MCP Server Health
      ['npm run mcp-health-check', 'MCP Server Health Check'],
    ];

    for (const [command, description, options] of validations) {
      const result = await this.executeCommand(command, description, options);
      this.results.preTaskValidation[description] = result;
    }

    return this.results.preTaskValidation;
  }

  async postTaskValidation() {
    this.log('🎯 Starting Post-Task End-to-End Validation', 'action');
    
    // Start MCP orchestrator if not running
    await this.startMCPOrchestrator();
    
    const validations = [
      // Integration Tests
      ['npm run test:integration', 'Integration Test Suite', { timeout: 180000 }],
      
      // MCP Integration Tests
      ['npm run test:mcp', 'MCP Integration Tests', { timeout: 120000 }],
      
      // API Endpoint Tests
      ['npm run test:e2e', 'End-to-End API Tests', { timeout: 120000 }],
      
      // Performance Tests
      ['npm run test:performance', 'Performance Benchmarks', { timeout: 180000 }],
      
      // Deployment Validation
      ['npm run validate:deployment', 'Deployment Configuration Validation'],
      
      // Comprehensive System Check
      ['npm run validate:comprehensive', 'Comprehensive System Validation'],
    ];

    for (const [command, description, options] of validations) {
      const result = await this.executeCommand(command, description, options);
      this.results.postTaskValidation[description] = result;
    }

    // Browser Automation Tests
    await this.runBrowserAutomationTests();
    
    // API Validation Tests
    await this.runAPIValidationTests();

    return this.results.postTaskValidation;
  }

  async startMCPOrchestrator() {
    try {
      // Check if MCP orchestrator is already running
      const healthCheck = await this.executeCommand(
        'curl -s http://localhost:3001/health', 
        'MCP Orchestrator Health Check',
        { timeout: 5000 }
      );
      
      if (healthCheck.success) {
        this.log('MCP Orchestrator already running', 'success');
        return true;
      }
    } catch (error) {
      // Orchestrator not running, start it
    }

    this.log('Starting MCP Orchestrator...', 'action');
    
    // Start orchestrator in background
    const orchestratorProcess = spawn('npm', ['run', 'mcp-orchestrator'], {
      detached: false,
      stdio: 'pipe'
    });

    // Wait for startup
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Verify it started
    const healthCheck = await this.executeCommand(
      'curl -s http://localhost:3001/health', 
      'MCP Orchestrator Startup Verification',
      { timeout: 10000 }
    );

    if (healthCheck.success) {
      this.log('MCP Orchestrator started successfully', 'success');
      this.results.mcpServerStatus.orchestrator = 'running';
      return true;
    } else {
      this.log('Failed to start MCP Orchestrator', 'error');
      this.results.mcpServerStatus.orchestrator = 'failed';
      return false;
    }
  }

  async runBrowserAutomationTests() {
    this.log('🌐 Running Browser Automation Tests', 'action');
    
    try {
      // Test 1: Application Startup
      const startupResult = await this.executeCommand(
        'timeout 30 npm start & sleep 10 && curl -f http://localhost:3000/health',
        'Application Startup Test',
        { timeout: 45000 }
      );
      
      if (startupResult.success) {
        // Test 2: Settings UI Navigation
        const settingsResult = await this.executeCommand(
          'curl -f http://localhost:3000/settings',
          'Settings UI Accessibility Test'
        );
        
        // Test 3: System Health Categories Check
        const healthResult = await this.executeCommand(
          'curl -s http://localhost:3000/api/health/system | jq ".categories | length"',
          'System Health Categories Validation'
        );
        
        this.results.postTaskValidation['Browser Automation Tests'] = {
          startup: startupResult.success,
          settings: settingsResult.success,
          health: healthResult.success
        };
      }
    } catch (error) {
      this.log(`Browser automation test failed: ${error.message}`, 'error');
      this.results.errors.push({
        test: 'Browser Automation',
        error: error.message
      });
    }
  }

  async runAPIValidationTests() {
    this.log('🔌 Running API Validation Tests', 'action');
    
    const apiTests = [
      ['GET /api/health', 'curl -f http://localhost:3000/api/health'],
      ['GET /api/recommendations', 'curl -f http://localhost:3000/api/recommendations'],
      ['GET /api/user/top-genres', 'curl -f http://localhost:3000/api/user/top-genres'],
    ];

    const apiResults = {};
    
    for (const [endpoint, command] of apiTests) {
      const result = await this.executeCommand(command, `API Test: ${endpoint}`);
      apiResults[endpoint] = result.success;
    }
    
    this.results.postTaskValidation['API Validation Tests'] = apiResults;
  }

  async generateReport() {
    const reportPath = path.join(process.cwd(), 'VALIDATION_WORKFLOW_REPORT.md');
    
    const totalPreTasks = Object.keys(this.results.preTaskValidation).length;
    const successfulPreTasks = Object.values(this.results.preTaskValidation).filter(r => r.success).length;
    const totalPostTasks = Object.keys(this.results.postTaskValidation).length;
    const successfulPostTasks = Object.values(this.results.postTaskValidation).filter(r => r.success).length;
    
    const report = `# 🔍 Continuous Validation Workflow Report

**Generated:** ${this.results.timestamp}  
**Workflow Status:** ${this.results.errors.length === 0 ? '✅ PASSED' : '❌ FAILED'}

## 📊 Summary

- **Pre-Task Validation:** ${successfulPreTasks}/${totalPreTasks} tasks passed
- **Post-Task Validation:** ${successfulPostTasks}/${totalPostTasks} tasks passed
- **Errors:** ${this.results.errors.length}
- **Warnings:** ${this.results.warnings.length}

## 🚀 Pre-Task Validation Results

${Object.entries(this.results.preTaskValidation).map(([task, result]) => 
  `- ${result.success ? '✅' : '❌'} **${task}**${result.success ? '' : ': ' + result.error}`
).join('\n')}

## 🎯 Post-Task Validation Results

${Object.entries(this.results.postTaskValidation).map(([task, result]) => 
  `- ${result.success ? '✅' : '❌'} **${task}**${result.success ? '' : ': ' + result.error}`
).join('\n')}

## 🤖 MCP Server Status

${Object.entries(this.results.mcpServerStatus).map(([server, status]) => 
  `- **${server}:** ${status === 'running' ? '✅ Running' : '❌ ' + status}`
).join('\n')}

## ❌ Errors (${this.results.errors.length})

${this.results.errors.map((error, i) => 
  `### Error ${i + 1}: ${error.description}
- **Command:** \`${error.command}\`
- **Error:** ${error.error}
${error.output ? '- **Output:** ```\n' + error.output + '\n```' : ''}
`).join('\n')}

## 📋 Recommendations

${this.generateRecommendations()}

---
*Report generated by EchoTune AI Continuous Validation Workflow*
`;

    fs.writeFileSync(reportPath, report);
    this.log(`Validation report saved to: ${reportPath}`, 'success');
    
    return reportPath;
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.results.errors.length > 0) {
      recommendations.push('🔧 **Fix Critical Errors:** Address all failed validation checks before proceeding');
    }
    
    const preTaskFailures = Object.values(this.results.preTaskValidation).filter(r => !r.success).length;
    if (preTaskFailures > 0) {
      recommendations.push('⚠️ **Pre-Task Issues:** Resolve code quality, security, or test failures');
    }
    
    const postTaskFailures = Object.values(this.results.postTaskValidation).filter(r => !r.success).length;
    if (postTaskFailures > 0) {
      recommendations.push('🎯 **Post-Task Issues:** Address integration test failures or API issues');
    }
    
    if (this.results.mcpServerStatus.orchestrator !== 'running') {
      recommendations.push('🤖 **MCP Server:** Ensure MCP orchestrator is running for automation features');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('🎉 **All Good:** Validation workflow completed successfully!');
    }
    
    return recommendations.map(r => `- ${r}`).join('\n');
  }

  async run(mode = 'full') {
    this.log(`🚀 Starting Continuous Validation Workflow (${mode} mode)`, 'action');
    
    try {
      if (mode === 'pre-task' || mode === 'full') {
        await this.preTaskValidation();
      }
      
      if (mode === 'post-task' || mode === 'full') {
        await this.postTaskValidation();
      }
      
      const reportPath = await this.generateReport();
      
      if (this.results.errors.length === 0) {
        this.log('🎉 Continuous Validation Workflow PASSED', 'success');
        return { success: true, reportPath };
      } else {
        this.log(`❌ Continuous Validation Workflow FAILED with ${this.results.errors.length} errors`, 'error');
        return { success: false, reportPath, errors: this.results.errors };
      }
      
    } catch (error) {
      this.log(`Fatal error in validation workflow: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }
}

// CLI Interface
if (require.main === module) {
  const workflow = new ContinuousValidationWorkflow();
  const mode = process.argv.includes('--pre-task') ? 'pre-task' :
               process.argv.includes('--post-task') ? 'post-task' : 'full';
  
  workflow.run(mode).then(result => {
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = ContinuousValidationWorkflow;
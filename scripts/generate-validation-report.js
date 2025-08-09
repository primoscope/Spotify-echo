#!/usr/bin/env node
/**
 * Production Validation Report Generator
 * Generates comprehensive VALIDATION_REPORT.md from lint/test/build outputs
 * 
 * Usage: node scripts/generate-validation-report.js [--output=path] [--format=md|json]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ValidationReportGenerator {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      },
      sections: []
    };
    this.artifactsDir = path.join(process.cwd(), '.artifacts');
  }

  /**
   * Ensure artifacts directory exists
   */
  ensureArtifactsDir() {
    if (!fs.existsSync(this.artifactsDir)) {
      fs.mkdirSync(this.artifactsDir, { recursive: true });
    }
    ['reports', 'logs', 'test-results'].forEach(dir => {
      const dirPath = path.join(this.artifactsDir, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });
  }

  /**
   * Run lint and capture output
   */
  async runLintCheck() {
    console.log('🔍 Running lint check...');
    try {
      const lintOutput = execSync('npm run lint 2>&1', { 
        encoding: 'utf8',
        cwd: process.cwd()
      });
      
      this.results.sections.push({
        name: 'Lint Check',
        status: 'PASSED',
        severity: 'Low',
        details: 'No linting issues found',
        output: lintOutput
      });
      this.results.summary.low += 0;
      
    } catch (error) {
      const lintErrors = this.parseLintOutput(error.stdout || error.message);
      this.results.sections.push({
        name: 'Lint Check',
        status: 'FAILED',
        severity: 'Medium',
        details: `Found ${lintErrors.length} linting issues`,
        issues: lintErrors,
        output: error.stdout || error.message
      });
      this.results.summary.medium += lintErrors.length;
    }
  }

  /**
   * Parse lint output to extract file:line references
   */
  parseLintOutput(output) {
    const issues = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
      const match = line.match(/^(.+?):(\d+):(\d+)\s+(\w+)\s+(.+)$/);
      if (match) {
        const [, file, lineNum, col, severity, message] = match;
        issues.push({
          file: file.replace(process.cwd() + '/', ''),
          line: lineNum,
          column: col,
          severity,
          message
        });
      }
    }
    
    return issues;
  }

  /**
   * Run build check
   */
  async runBuildCheck() {
    console.log('🏗️ Running build check...');
    try {
      const buildOutput = execSync('npm run build 2>&1', { 
        encoding: 'utf8',
        cwd: process.cwd()
      });
      
      this.results.sections.push({
        name: 'Build Check',
        status: 'PASSED',
        severity: 'Low',
        details: 'Build completed successfully',
        output: buildOutput
      });
      
    } catch (error) {
      this.results.sections.push({
        name: 'Build Check',
        status: 'FAILED',
        severity: 'Critical',
        details: 'Build failed',
        output: error.stdout || error.message
      });
      this.results.summary.critical += 1;
    }
  }

  /**
   * Run test check (with fallback for missing Jest)
   */
  async runTestCheck() {
    console.log('🧪 Running test check...');
    try {
      // Try to run tests, but handle gracefully if Jest not properly installed
      const testOutput = execSync('npm test 2>&1', { 
        encoding: 'utf8',
        cwd: process.cwd()
      });
      
      this.results.sections.push({
        name: 'Test Suite',
        status: 'PASSED',
        severity: 'Low',
        details: 'All tests passed',
        output: testOutput
      });
      
    } catch (error) {
      // Check if Jest is not found vs actual test failures
      if (error.message.includes('jest: not found') || error.message.includes('command not found')) {
        this.results.sections.push({
          name: 'Test Suite',
          status: 'SKIPPED',
          severity: 'Medium',
          details: 'Jest not properly installed - tests skipped',
          recommendation: 'Ensure Jest is installed via npm install',
          output: error.stdout || error.message
        });
        this.results.summary.medium += 1;
      } else {
        this.results.sections.push({
          name: 'Test Suite', 
          status: 'FAILED',
          severity: 'High',
          details: 'Tests failed',
          output: error.stdout || error.message
        });
        this.results.summary.high += 1;
      }
    }
  }

  /**
   * Check MCP health status
   */
  async runMCPHealthCheck() {
    console.log('🔧 Running MCP health check...');
    try {
      // Use existing MCP health script
      const mcpOutput = execSync('npm run mcp:health 2>&1', { 
        encoding: 'utf8',
        cwd: process.cwd()
      });
      
      this.results.sections.push({
        name: 'MCP Health Check',
        status: 'PASSED',
        severity: 'Low',
        details: 'MCP servers healthy',
        output: mcpOutput
      });
      
    } catch (error) {
      this.results.sections.push({
        name: 'MCP Health Check',
        status: 'WARNING',
        severity: 'Medium',
        details: 'Some MCP servers may not be running',
        recommendation: 'Run npm run mcp:validate for full MCP validation',
        output: error.stdout || error.message
      });
      this.results.summary.medium += 1;
    }
  }

  /**
   * Check security and dependencies
   */
  async runSecurityCheck() {
    console.log('🛡️ Running security check...');
    try {
      const auditOutput = execSync('npm audit --audit-level=high 2>&1', { 
        encoding: 'utf8',
        cwd: process.cwd()
      });
      
      this.results.sections.push({
        name: 'Security Audit',
        status: 'PASSED',
        severity: 'Low',
        details: 'No high-severity vulnerabilities found',
        output: auditOutput
      });
      
    } catch (error) {
      const severity = error.message.includes('critical') ? 'Critical' : 'High';
      this.results.sections.push({
        name: 'Security Audit',
        status: 'FAILED',
        severity,
        details: 'Security vulnerabilities detected',
        recommendation: 'Run npm audit fix to resolve issues',
        output: error.stdout || error.message
      });
      
      if (severity === 'Critical') {
        this.results.summary.critical += 1;
      } else {
        this.results.summary.high += 1;
      }
    }
  }

  /**
   * Generate markdown report
   */
  generateMarkdownReport() {
    const { timestamp, summary, sections } = this.results;
    
    let report = `# Validation Report\n\n`;
    report += `**Generated:** ${timestamp}\n\n`;
    
    // Summary
    report += `## Summary\n\n`;
    report += `| Severity | Count |\n`;
    report += `|----------|-------|\n`;
    report += `| Critical | ${summary.critical} |\n`;
    report += `| High | ${summary.high} |\n`;
    report += `| Medium | ${summary.medium} |\n`;
    report += `| Low | ${summary.low} |\n\n`;
    
    // Overall status
    const overallStatus = summary.critical > 0 ? '❌ CRITICAL' : 
                         summary.high > 0 ? '⚠️ HIGH' :
                         summary.medium > 0 ? '⚠️ MEDIUM' : '✅ PASSED';
    
    report += `**Overall Status:** ${overallStatus}\n\n`;
    
    // Detailed sections
    report += `## Detailed Results\n\n`;
    
    for (const section of sections) {
      report += `### ${section.name}\n\n`;
      report += `- **Status:** ${section.status}\n`;
      report += `- **Severity:** ${section.severity}\n`;
      report += `- **Details:** ${section.details}\n`;
      
      if (section.recommendation) {
        report += `- **Recommendation:** ${section.recommendation}\n`;
      }
      
      if (section.issues && section.issues.length > 0) {
        report += `\n**Issues Found:**\n\n`;
        for (const issue of section.issues.slice(0, 10)) { // Limit to first 10
          report += `- \`${issue.file}:${issue.line}:${issue.column}\` - ${issue.message}\n`;
        }
        if (section.issues.length > 10) {
          report += `- ... and ${section.issues.length - 10} more issues\n`;
        }
      }
      
      report += `\n`;
    }
    
    // Recommendations
    report += `## Next Steps\n\n`;
    if (summary.critical > 0) {
      report += `⛔ **Critical issues must be resolved before deployment**\n`;
    }
    if (summary.high > 0) {
      report += `⚠️ High-priority issues should be addressed\n`;
    }
    if (summary.medium > 0) {
      report += `📝 Medium-priority issues can be scheduled for resolution\n`;
    }
    if (summary.critical === 0 && summary.high === 0 && summary.medium === 0) {
      report += `✅ All checks passed - ready for deployment\n`;
    }
    
    return report;
  }

  /**
   * Save report to files
   */
  saveReport(format = 'md') {
    this.ensureArtifactsDir();
    
    const reportPath = path.join(this.artifactsDir, 'reports', `validation-report.${format}`);
    const rootReportPath = path.join(process.cwd(), `VALIDATION_REPORT.${format}`);
    
    let content;
    if (format === 'json') {
      content = JSON.stringify(this.results, null, 2);
    } else {
      content = this.generateMarkdownReport();
    }
    
    // Save to artifacts directory
    fs.writeFileSync(reportPath, content);
    
    // Also save to root for visibility
    if (format === 'md') {
      fs.writeFileSync(rootReportPath, content);
    }
    
    console.log(`📄 Report saved to: ${reportPath}`);
    if (format === 'md') {
      console.log(`📄 Report also saved to: ${rootReportPath}`);
    }
    
    return reportPath;
  }

  /**
   * Run all validation checks
   */
  async runAllChecks() {
    console.log('🚀 Starting comprehensive validation...\n');
    
    await this.runLintCheck();
    await this.runBuildCheck();
    await this.runTestCheck();
    await this.runMCPHealthCheck();
    await this.runSecurityCheck();
    
    console.log('\n✅ Validation complete!');
    
    return this.results;
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);
  const outputArg = args.find(arg => arg.startsWith('--output='));
  const formatArg = args.find(arg => arg.startsWith('--format='));
  
  const format = formatArg ? formatArg.split('=')[1] : 'md';
  
  const generator = new ValidationReportGenerator();
  
  try {
    await generator.runAllChecks();
    const reportPath = generator.saveReport(format);
    
    // Also save JSON version for CI
    if (format !== 'json') {
      generator.saveReport('json');
    }
    
    // Exit with error code if critical issues found
    if (generator.results.summary.critical > 0) {
      console.error('❌ Critical issues found - exiting with error code 1');
      process.exit(1);
    }
    
    console.log('✅ Validation report generated successfully');
    
  } catch (error) {
    console.error('❌ Error generating validation report:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ValidationReportGenerator;
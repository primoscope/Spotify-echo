#!/usr/bin/env node
/**
 * Repository-wide Validation Report Generator
 * 
 * This script scans the entire EchoTune AI repository and generates a comprehensive
 * validation report identifying:
 * - Incomplete/placeholder code patterns
 * - Security issues (exposed secrets/credentials) 
 * - Dangerous configurations
 * - Broken/missing references
 * - CI hygiene issues
 * 
 * Usage: node scripts/validation/generate-validation-report.js
 * Output: VALIDATION_REPORT.md and reports/validation-report.json
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class RepositoryValidator {
  constructor() {
    this.findings = [];
    this.environmentVars = new Map();
    this.startTime = new Date();
    this.rootDir = process.cwd();
    
    // Initialize security patterns
    this.initializePatterns();
  }

  initializePatterns() {
    // Security patterns for detecting secrets (DO NOT expose actual values)
    this.secretPatterns = [
      {
        name: 'OpenAI API Key',
        pattern: /sk-[a-zA-Z0-9]{10,}/g,
        category: 'api-key'
      },
      {
        name: 'Google API Key', 
        pattern: /AIza[0-9A-Za-z\-_]{35}/g,
        category: 'api-key'
      },
      {
        name: 'DigitalOcean Token',
        pattern: /(dop_v1|do[a-z]?_[0-9A-Za-z]{20,})/g,
        category: 'access-token'
      },
      {
        name: 'JWT Secret',
        pattern: /[a-fA-F0-9]{32,}/g,
        category: 'jwt-secret',
        envOnly: true // Only check in .env files
      },
      {
        name: 'Generic API Key/Secret',
        pattern: /(_API_KEY|_SECRET|_TOKEN)\s*=\s*[^\s#]+/gi,
        category: 'credentials'
      }
    ];

    // Incomplete code patterns  
    this.incompletePatterns = [
      {
        name: 'Placeholder ellipsis',
        pattern: /\[\.\.\.\]/g,
        category: 'placeholder'
      },
      {
        name: 'TODO comment',
        pattern: /(TODO|FIXME|HACK|XXX)(\s|:)/gi,
        category: 'todo'
      },
      {
        name: 'Python pass statement',
        pattern: /^\s*pass\s*$/gm,
        category: 'placeholder'
      },
      {
        name: 'NotImplemented error',
        pattern: /throw new Error\(['"]NotImplemented['"]?\)/gi,
        category: 'not-implemented'
      },
      {
        name: 'Empty function body',
        pattern: /function\s+\w+\s*\([^)]*\)\s*\{\s*\}/g,
        category: 'empty-function'
      }
    ];

    // Files to ignore during scanning
    this.ignorePatterns = [
      'node_modules/',
      '.git/',
      'coverage/',
      'dist/',
      'build/',
      '.next/',
      '.env.example',
      '.env.template',
      'package-lock.json',
      '.log'
    ];
  }

  /**
   * Main validation entry point
   */
  async validate() {
    console.log('🔍 Starting repository validation...');
    
    try {
      // Ensure reports directory exists
      await this.ensureReportsDirectory();
      
      // Scan all files in repository
      await this.scanRepository();
      
      // Generate reports
      await this.generateReports();
      
      console.log('✅ Validation completed successfully');
      console.log(`📄 Reports generated: VALIDATION_REPORT.md, reports/validation-report.json`);
      
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      process.exit(1);
    }
  }

  async ensureReportsDirectory() {
    try {
      await fs.mkdir(path.join(this.rootDir, 'reports'), { recursive: true });
    } catch (error) {
      // Directory may already exist
    }
  }

  /**
   * Recursively scan repository for validation issues
   */
  async scanRepository() {
    await this.scanDirectory(this.rootDir);
  }

  async scanDirectory(dirPath, level = 0) {
    if (level > 10) return; // Prevent deep recursion
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(this.rootDir, fullPath);
        
        // Skip ignored files/directories
        if (this.shouldIgnore(relativePath)) continue;
        
        if (entry.isDirectory()) {
          await this.scanDirectory(fullPath, level + 1);
        } else {
          await this.scanFile(fullPath, relativePath);
        }
      }
    } catch (error) {
      this.addFinding('Low', 'file-access', relativePath || dirPath, null, 
        `Cannot read directory: ${error.message}`, 'Check file permissions');
    }
  }

  shouldIgnore(relativePath) {
    return this.ignorePatterns.some(pattern => relativePath.includes(pattern));
  }

  /**
   * Scan individual file for validation issues
   */
  async scanFile(filePath, relativePath) {
    try {
      const stats = await fs.stat(filePath);
      if (stats.size > 1024 * 1024) return; // Skip files larger than 1MB
      
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split('\n');
      
      // Check for incomplete code patterns
      this.checkIncompleteCode(content, lines, relativePath);
      
      // Check for security issues
      this.checkSecurityIssues(content, lines, relativePath);
      
      // Check for dangerous configurations
      this.checkDangerousConfig(content, lines, relativePath);
      
      // Track environment variables
      this.trackEnvironmentVariables(content, relativePath);
      
    } catch (error) {
      // Skip binary files and files we can't read
    }
  }

  /**
   * Check for incomplete/placeholder code
   */
  checkIncompleteCode(content, lines, filePath) {
    this.incompletePatterns.forEach(pattern => {
      const matches = Array.from(content.matchAll(pattern.pattern));
      
      matches.forEach(match => {
        const lineNumber = this.getLineNumber(content, match.index);
        const severity = pattern.category === 'placeholder' ? 'High' : 'Medium';
        
        this.addFinding(severity, 'incomplete-code', filePath, lineNumber,
          `${pattern.name} detected`, 
          'Complete the implementation or remove placeholder code');
      });
    });
  }

  /**
   * Check for security issues - secrets and credentials
   */
  checkSecurityIssues(content, lines, filePath) {
    // Check if this is an environment file
    const isEnvFile = /\.env/i.test(filePath);
    
    this.secretPatterns.forEach(pattern => {
      // Skip JWT pattern on non-env files
      if (pattern.envOnly && !isEnvFile) return;
      
      const matches = Array.from(content.matchAll(pattern.pattern));
      
      matches.forEach(match => {
        const lineNumber = this.getLineNumber(content, match.index);
        
        // CRITICAL: Never expose actual secret values
        const maskedValue = this.maskSecret(match[0]);
        
        this.addFinding('Critical', 'security-secret', filePath, lineNumber,
          `${pattern.name} detected: ${maskedValue}`,
          'Remove from repository and use environment variables');
      });
    });
  }

  /**
   * Check for dangerous configurations
   */
  checkDangerousConfig(content, lines, filePath) {
    // Committed .env files (except examples)
    if (filePath === '.env' && !filePath.includes('example') && !filePath.includes('template')) {
      this.addFinding('Critical', 'dangerous-config', filePath, 1,
        'Committed .env file with potential secrets',
        'Remove .env file and add to .gitignore');
    }
    
    // Permissive CORS configuration
    if (filePath.includes('middleware') && content.includes('cors')) {
      if (content.includes('origin: "*"') || content.includes('origin:true')) {
        const lineNumber = this.getLineNumber(content, content.indexOf('origin'));
        this.addFinding('High', 'dangerous-config', filePath, lineNumber,
          'Permissive CORS configuration detected',
          'Restrict CORS to specific origins in production');
      }
    }
    
    // Check for hardcoded credentials in documentation
    if (filePath.endsWith('.md') || filePath.endsWith('.txt')) {
      const credentialPatterns = ['password:', 'token:', 'secret:', 'key:'];
      credentialPatterns.forEach(pattern => {
        if (content.toLowerCase().includes(pattern)) {
          const lineNumber = this.getLineNumber(content, content.toLowerCase().indexOf(pattern));
          this.addFinding('Medium', 'dangerous-config', filePath, lineNumber,
            'Potential credential in documentation',
            'Use placeholder values in documentation');
        }
      });
    }
  }

  /**
   * Track environment variables referenced in code
   */
  trackEnvironmentVariables(content, filePath) {
    const envPattern = /process\.env\.(\w+)/g;
    const matches = Array.from(content.matchAll(envPattern));
    
    matches.forEach(match => {
      const varName = match[1];
      if (!this.environmentVars.has(varName)) {
        this.environmentVars.set(varName, []);
      }
      this.environmentVars.get(varName).push(filePath);
    });
  }

  /**
   * Check for broken references (files referenced in scripts that don't exist)
   */
  async checkBrokenReferences() {
    try {
      // Check MCP server references from scripts/mcp/run.sh
      const runScript = path.join(this.rootDir, 'scripts/mcp/run.sh');
      const runContent = await fs.readFile(runScript, 'utf8');
      
      const mcpServerPaths = [
        'mcp-servers/enhanced-file-utilities.js',
        'mcp-servers/comprehensive-validator.js', 
        'mcp-server/enhanced-mcp-orchestrator.js',
        'mcp-server/workflow-manager.js'
      ];
      
      for (const serverPath of mcpServerPaths) {
        const fullPath = path.join(this.rootDir, serverPath);
        try {
          await fs.access(fullPath);
        } catch {
          this.addFinding('Low', 'broken-reference', 'scripts/mcp/run.sh', null,
            `Referenced MCP server not found: ${serverPath}`,
            'Create the missing MCP server or update the reference');
        }
      }
      
    } catch (error) {
      // scripts/mcp/run.sh may not exist yet
    }
  }

  /**
   * Check CI hygiene - test coverage and structure
   */
  async checkCIHygiene() {
    try {
      const testsDir = path.join(this.rootDir, 'tests');
      const stats = await fs.stat(testsDir);
      
      if (!stats.isDirectory()) {
        this.addFinding('Medium', 'ci-hygiene', 'tests/', null,
          'Tests directory not found or not a directory',
          'Create tests directory with unit and integration tests');
        return;
      }
      
      // Check if tests directory is mostly empty
      const testFiles = await fs.readdir(testsDir, { recursive: true });
      const testFileCount = testFiles.filter(file => file.endsWith('.test.js') || file.endsWith('.spec.js')).length;
      
      if (testFileCount < 3) {
        this.addFinding('Medium', 'ci-hygiene', 'tests/', null,
          `Low test coverage: only ${testFileCount} test files found`,
          'Add comprehensive unit and integration tests');
      }
      
    } catch (error) {
      this.addFinding('Medium', 'ci-hygiene', 'tests/', null,
        'Tests directory not found',
        'Create tests directory with unit and integration tests');
    }
  }

  /**
   * Add a validation finding
   */
  addFinding(severity, category, filePath, lineNumber, description, remediation) {
    this.findings.push({
      severity,
      category,
      file: filePath,
      line: lineNumber,
      description,
      remediation,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get line number from content position
   */
  getLineNumber(content, position) {
    if (position === undefined || position === null) return null;
    return content.substring(0, position).split('\n').length;
  }

  /**
   * Mask sensitive values (NEVER expose actual secrets)
   */
  maskSecret(value) {
    if (value.length <= 6) return '****';
    return value.substring(0, 4) + '****' + value.substring(value.length - 2);
  }

  /**
   * Generate both markdown and JSON reports
   */
  async generateReports() {
    // Run additional checks
    await this.checkBrokenReferences();
    await this.checkCIHygiene();
    
    // Sort findings by severity
    const severityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
    this.findings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
    
    // Generate markdown report
    await this.generateMarkdownReport();
    
    // Generate JSON report
    await this.generateJSONReport();
  }

  /**
   * Generate human-readable markdown report
   */
  async generateMarkdownReport() {
    const timestamp = this.startTime.toISOString();
    const duration = Date.now() - this.startTime.getTime();
    
    // Count findings by severity
    const severityCounts = this.findings.reduce((counts, finding) => {
      counts[finding.severity] = (counts[finding.severity] || 0) + 1;
      return counts;
    }, {});
    
    let markdown = `# Repository Validation Report\n\n`;
    markdown += `**Generated:** ${timestamp}  \n`;
    markdown += `**Duration:** ${Math.round(duration / 1000)}s  \n\n`;
    
    // Summary
    markdown += `## Summary\n\n`;
    markdown += `| Severity | Count |\n`;
    markdown += `|----------|-------|\n`;
    Object.entries(severityCounts).forEach(([severity, count]) => {
      markdown += `| ${severity} | ${count} |\n`;
    });
    markdown += `\n**Total Findings:** ${this.findings.length}\n\n`;
    
    // Detailed findings by severity
    const severities = ['Critical', 'High', 'Medium', 'Low'];
    severities.forEach(severity => {
      const findings = this.findings.filter(f => f.severity === severity);
      if (findings.length === 0) return;
      
      markdown += `## ${severity} Findings\n\n`;
      findings.forEach(finding => {
        markdown += `### ${finding.category.replace('-', ' ').toUpperCase()}\n`;
        markdown += `**File:** \`${finding.file}\`  \n`;
        if (finding.line) markdown += `**Line:** ${finding.line}  \n`;
        markdown += `**Issue:** ${finding.description}  \n`;
        markdown += `**Fix:** ${finding.remediation}  \n\n`;
      });
    });
    
    // Environment Variables Summary
    if (this.environmentVars.size > 0) {
      markdown += `## Environment Variables\n\n`;
      markdown += `| Variable | Referenced In | Status |\n`;
      markdown += `|----------|---------------|--------|\n`;
      
      for (const [varName, files] of this.environmentVars) {
        const status = this.getEnvVarStatus(varName);
        markdown += `| \`${varName}\` | ${files.slice(0, 3).join(', ')}${files.length > 3 ? '...' : ''} | ${status} |\n`;
      }
      markdown += `\n`;
    }
    
    // Action Checklist
    markdown += `## Action Checklist\n\n`;
    markdown += `Complete these items in order of priority:\n\n`;
    
    severities.forEach(severity => {
      const findings = this.findings.filter(f => f.severity === severity);
      if (findings.length === 0) return;
      
      markdown += `### ${severity} Priority\n`;
      findings.forEach((finding, index) => {
        markdown += `- [ ] **${finding.file}${finding.line ? `:${finding.line}` : ''}** - ${finding.description}\n`;
      });
      markdown += `\n`;
    });
    
    // Write markdown report
    await fs.writeFile(path.join(this.rootDir, 'VALIDATION_REPORT.md'), markdown);
  }

  /**
   * Generate machine-readable JSON report
   */
  async generateJSONReport() {
    const report = {
      metadata: {
        generated: this.startTime.toISOString(),
        duration: Date.now() - this.startTime.getTime(),
        total_findings: this.findings.length
      },
      summary: this.findings.reduce((counts, finding) => {
        counts[finding.severity] = (counts[finding.severity] || 0) + 1;
        return counts;
      }, {}),
      findings: this.findings,
      environment_variables: Array.from(this.environmentVars.entries()).map(([name, files]) => ({
        name,
        referenced_in: files,
        status: this.getEnvVarStatus(name)
      }))
    };
    
    await fs.writeFile(
      path.join(this.rootDir, 'reports', 'validation-report.json'),
      JSON.stringify(report, null, 2)
    );
  }

  /**
   * Determine environment variable status
   */
  getEnvVarStatus(varName) {
    // Simple heuristic - in production you might check actual .env files
    const commonRequired = ['NODE_ENV', 'PORT', 'SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET'];
    if (commonRequired.includes(varName)) return 'Required';
    if (varName.includes('API_KEY') || varName.includes('SECRET')) return 'Sensitive';
    return 'Optional';
  }
}

// Main execution
if (require.main === module) {
  const validator = new RepositoryValidator();
  validator.validate().catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });
}

module.exports = RepositoryValidator;
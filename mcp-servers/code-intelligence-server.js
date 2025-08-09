#!/usr/bin/env node
/**
 * Advanced Code Intelligence MCP Server
 * AI-powered code analysis, refactoring, and intelligent coding assistance
 * 
 * Features:
 * - Static code analysis with complexity metrics
 * - Code quality assessment and scoring
 * - Intelligent refactoring suggestions
 * - Dependency analysis and optimization
 * - Security vulnerability detection
 * - Code pattern recognition and best practices
 * - Performance impact analysis
 */

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class CodeIntelligenceMCP {
  constructor() {
    this.app = express();
    this.port = process.env.CODE_INTELLIGENCE_PORT || 3011;
    this.analysisCache = new Map();
    this.patterns = this.initializePatterns();
    
    this.setupMiddleware();
    this.setupRoutes();
    
    console.log(`🧠 Code Intelligence MCP Server initialized on port ${this.port}`);
  }

  initializePatterns() {
    return {
      antiPatterns: [
        {
          name: 'callback-hell',
          pattern: /\.then\(.*\.then\(.*\.then\(/,
          severity: 'medium',
          message: 'Nested promises detected - consider async/await',
          suggestion: 'Refactor to async/await pattern for better readability'
        },
        {
          name: 'unused-variables',
          pattern: /(?:const|let|var)\s+(\w+).*(?!\1)/,
          severity: 'low',
          message: 'Potentially unused variable detected',
          suggestion: 'Remove unused variables to improve code clarity'
        },
        {
          name: 'hardcoded-credentials',
          pattern: /(password|secret|key|token)\s*=\s*['"`][^'"`]+['"`]/i,
          severity: 'critical',
          message: 'Hardcoded credentials detected',
          suggestion: 'Move credentials to environment variables'
        },
        {
          name: 'console-logs',
          pattern: /console\.(log|debug|info|warn|error)/,
          severity: 'low',
          message: 'Console statements found',
          suggestion: 'Replace with proper logging framework'
        },
        {
          name: 'sync-file-operations',
          pattern: /fs\.(readFileSync|writeFileSync|appendFileSync)/,
          severity: 'medium',
          message: 'Synchronous file operations detected',
          suggestion: 'Use async file operations for better performance'
        }
      ],
      bestPractices: [
        {
          name: 'error-handling',
          check: (code) => code.includes('try') && code.includes('catch'),
          message: 'Good error handling practices detected',
          impact: 'positive'
        },
        {
          name: 'async-await',
          check: (code) => code.includes('async') && code.includes('await'),
          message: 'Modern async/await pattern used',
          impact: 'positive'
        },
        {
          name: 'type-checking',
          check: (code) => code.includes('typeof') || code.includes('instanceof'),
          message: 'Type checking implemented',
          impact: 'positive'
        }
      ],
      performancePatterns: [
        {
          name: 'inefficient-loops',
          pattern: /for\s*\(.*\.length.*\)/,
          severity: 'low',
          message: 'Potentially inefficient loop detected',
          suggestion: 'Cache array length in variable'
        },
        {
          name: 'repeated-dom-queries',
          pattern: /document\.(getElementById|querySelector|getElementsBy)/g,
          severity: 'medium',
          message: 'Multiple DOM queries detected',
          suggestion: 'Cache DOM references'
        }
      ]
    };
  }

  setupMiddleware() {
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'Code Intelligence MCP',
        port: this.port,
        capabilities: ['analysis', 'refactoring', 'quality', 'security', 'performance'],
        cacheSize: this.analysisCache.size,
        timestamp: new Date().toISOString()
      });
    });

    // Comprehensive code analysis
    this.app.post('/api/analyze/comprehensive', async (req, res) => {
      try {
        const { code, filePath, language = 'javascript' } = req.body;
        
        const cacheKey = `${filePath || 'inline'}_${Date.now()}`;
        
        const analysis = {
          filePath,
          language,
          timestamp: Date.now(),
          metrics: await this.calculateMetrics(code),
          quality: await this.assessQuality(code, language),
          security: await this.scanSecurity(code),
          performance: await this.analyzePerformance(code),
          refactoring: await this.suggestRefactoring(code, language),
          dependencies: await this.analyzeDependencies(code),
          complexity: this.calculateComplexity(code),
          maintainability: this.assessMaintainability(code)
        };

        this.analysisCache.set(cacheKey, analysis);
        
        res.json({ 
          cacheKey,
          analysis,
          summary: this.generateAnalysisSummary(analysis)
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // File/directory analysis
    this.app.post('/api/analyze/project', async (req, res) => {
      try {
        const { projectPath, extensions = ['.js', '.ts', '.jsx', '.tsx'] } = req.body;
        const analysis = await this.analyzeProject(projectPath, extensions);
        res.json(analysis);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Code quality scoring
    this.app.post('/api/quality/score', async (req, res) => {
      try {
        const { code, language = 'javascript' } = req.body;
        const qualityScore = await this.calculateQualityScore(code, language);
        res.json(qualityScore);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Refactoring suggestions
    this.app.post('/api/refactor/suggestions', async (req, res) => {
      try {
        const { code, language = 'javascript', target = 'readability' } = req.body;
        const suggestions = await this.generateRefactoringSuggestions(code, language, target);
        res.json({ suggestions });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Security vulnerability scan
    this.app.post('/api/security/scan', async (req, res) => {
      try {
        const { code, filePath } = req.body;
        const vulnerabilities = await this.performSecurityScan(code, filePath);
        res.json({ vulnerabilities });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Performance analysis
    this.app.post('/api/performance/analyze', async (req, res) => {
      try {
        const { code, context = 'general' } = req.body;
        const performanceAnalysis = await this.performPerformanceAnalysis(code, context);
        res.json(performanceAnalysis);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Code complexity analysis
    this.app.post('/api/complexity/analyze', async (req, res) => {
      try {
        const { code, threshold = 10 } = req.body;
        const complexityAnalysis = await this.analyzeCodeComplexity(code, threshold);
        res.json(complexityAnalysis);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Best practices checker
    this.app.post('/api/practices/check', async (req, res) => {
      try {
        const { code, language = 'javascript', framework } = req.body;
        const practicesCheck = await this.checkBestPractices(code, language, framework);
        res.json(practicesCheck);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get cached analysis
    this.app.get('/api/analysis/:cacheKey', (req, res) => {
      const { cacheKey } = req.params;
      const analysis = this.analysisCache.get(cacheKey);
      
      if (!analysis) {
        return res.status(404).json({ error: 'Analysis not found' });
      }
      
      res.json(analysis);
    });
  }

  async calculateMetrics(code) {
    const lines = code.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);
    const commentLines = lines.filter(line => 
      line.trim().startsWith('//') || 
      line.trim().startsWith('/*') || 
      line.trim().startsWith('*')
    );

    return {
      totalLines: lines.length,
      codeLines: nonEmptyLines.length,
      commentLines: commentLines.length,
      blankLines: lines.length - nonEmptyLines.length,
      commentRatio: commentLines.length / nonEmptyLines.length,
      avgLineLength: nonEmptyLines.reduce((sum, line) => sum + line.length, 0) / nonEmptyLines.length,
      functions: (code.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g) || []).length,
      classes: (code.match(/class\s+\w+/g) || []).length,
      imports: (code.match(/import\s+.*from|require\s*\(/g) || []).length
    };
  }

  async assessQuality(code, language) {
    const issues = [];
    let score = 100;

    // Check for anti-patterns
    this.patterns.antiPatterns.forEach(pattern => {
      const matches = code.match(pattern.pattern);
      if (matches) {
        issues.push({
          type: 'anti-pattern',
          name: pattern.name,
          severity: pattern.severity,
          message: pattern.message,
          suggestion: pattern.suggestion,
          count: matches.length
        });
        
        const penalty = pattern.severity === 'critical' ? 20 : 
                       pattern.severity === 'high' ? 15 :
                       pattern.severity === 'medium' ? 10 : 5;
        score -= penalty * matches.length;
      }
    });

    // Check for best practices
    const practicesFollowed = this.patterns.bestPractices.filter(practice => 
      practice.check(code)
    );

    return {
      score: Math.max(0, Math.min(100, score)),
      issues,
      practicesFollowed,
      recommendations: this.generateQualityRecommendations(issues, practicesFollowed)
    };
  }

  async scanSecurity(code) {
    const vulnerabilities = [];

    // Check for common security issues
    const securityPatterns = [
      {
        name: 'sql-injection',
        pattern: /query.*\+.*req\.(body|params|query)/,
        severity: 'critical',
        message: 'Potential SQL injection vulnerability',
        cwe: 'CWE-89'
      },
      {
        name: 'xss',
        pattern: /innerHTML.*req\.(body|params|query)/,
        severity: 'high',
        message: 'Potential XSS vulnerability',
        cwe: 'CWE-79'
      },
      {
        name: 'path-traversal',
        pattern: /fs\.(readFile|writeFile).*req\.(body|params|query)/,
        severity: 'high',
        message: 'Potential path traversal vulnerability',
        cwe: 'CWE-22'
      },
      {
        name: 'weak-crypto',
        pattern: /crypto\.createHash\(['"`]md5['"`]\)/,
        severity: 'medium',
        message: 'Weak cryptographic algorithm detected',
        cwe: 'CWE-327'
      }
    ];

    securityPatterns.forEach(pattern => {
      const matches = code.match(pattern.pattern);
      if (matches) {
        vulnerabilities.push({
          name: pattern.name,
          severity: pattern.severity,
          message: pattern.message,
          cwe: pattern.cwe,
          count: matches.length,
          recommendation: this.getSecurityRecommendation(pattern.name)
        });
      }
    });

    return {
      vulnerabilities,
      riskLevel: this.calculateRiskLevel(vulnerabilities),
      recommendations: vulnerabilities.map(v => v.recommendation).filter(Boolean)
    };
  }

  async analyzePerformance(code) {
    const performanceIssues = [];

    this.patterns.performancePatterns.forEach(pattern => {
      const matches = code.match(pattern.pattern);
      if (matches) {
        performanceIssues.push({
          type: pattern.name,
          severity: pattern.severity,
          message: pattern.message,
          suggestion: pattern.suggestion,
          count: matches.length
        });
      }
    });

    // Additional performance checks
    const asyncOperations = (code.match(/await\s+/g) || []).length;
    const promiseChains = (code.match(/\.then\(/g) || []).length;
    const loops = (code.match(/for\s*\(|while\s*\(|forEach\(/g) || []).length;

    return {
      issues: performanceIssues,
      metrics: {
        asyncOperations,
        promiseChains,
        loops,
        potentialBottlenecks: performanceIssues.filter(issue => 
          issue.severity === 'high' || issue.severity === 'critical'
        ).length
      },
      recommendations: this.generatePerformanceRecommendations(performanceIssues)
    };
  }

  async suggestRefactoring(code, language) {
    const suggestions = [];

    // Function length analysis
    const functions = code.match(/function\s+\w+[^}]+}/g) || [];
    functions.forEach((func, index) => {
      const lines = func.split('\n').length;
      if (lines > 50) {
        suggestions.push({
          type: 'function-length',
          severity: 'medium',
          message: `Function ${index + 1} is too long (${lines} lines)`,
          suggestion: 'Consider breaking into smaller functions'
        });
      }
    });

    // DRY principle violations
    const patterns = this.findRepeatedPatterns(code);
    patterns.forEach(pattern => {
      if (pattern.count > 2) {
        suggestions.push({
          type: 'dry-violation',
          severity: 'medium',
          message: `Repeated code pattern found (${pattern.count} occurrences)`,
          suggestion: 'Extract common functionality into a reusable function'
        });
      }
    });

    // Variable naming
    const variableNames = code.match(/(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g) || [];
    variableNames.forEach(declaration => {
      const name = declaration.split(/\s+/)[1];
      if (name.length < 3 && !['i', 'j', 'k', 'id'].includes(name)) {
        suggestions.push({
          type: 'naming',
          severity: 'low',
          message: `Variable name '${name}' is too short`,
          suggestion: 'Use descriptive variable names'
        });
      }
    });

    return suggestions;
  }

  async analyzeDependencies(code) {
    const imports = code.match(/import\s+.*?from\s+['"`]([^'"`]+)['"`]|require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g) || [];
    const dependencies = imports.map(imp => {
      const match = imp.match(/['"`]([^'"`]+)['"`]/);
      return match ? match[1] : null;
    }).filter(Boolean);

    const analysis = {
      total: dependencies.length,
      external: dependencies.filter(dep => !dep.startsWith('./') && !dep.startsWith('../')),
      internal: dependencies.filter(dep => dep.startsWith('./') || dep.startsWith('../')),
      nodeModules: dependencies.filter(dep => !dep.startsWith('./')),
      recommendations: []
    };

    // Check for heavy dependencies
    const heavyDeps = ['lodash', 'moment', 'axios'];
    heavyDeps.forEach(dep => {
      if (analysis.external.includes(dep)) {
        analysis.recommendations.push({
          type: 'dependency-optimization',
          message: `Consider lighter alternative to ${dep}`,
          suggestion: dep === 'lodash' ? 'Use native JS methods or specific lodash functions' :
                     dep === 'moment' ? 'Use date-fns or dayjs' :
                     dep === 'axios' ? 'Use native fetch API' : 'Find lighter alternative'
        });
      }
    });

    return analysis;
  }

  calculateComplexity(code) {
    let complexity = 1; // Base complexity

    // Cyclomatic complexity calculation
    const complexityPatterns = [
      /if\s*\(/g,
      /else\s+if\s*\(/g,
      /while\s*\(/g,
      /for\s*\(/g,
      /case\s+/g,
      /catch\s*\(/g,
      /&&/g,
      /\|\|/g,
      /\?/g
    ];

    complexityPatterns.forEach(pattern => {
      const matches = code.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    });

    return {
      cyclomatic: complexity,
      level: complexity <= 5 ? 'low' : 
             complexity <= 10 ? 'medium' : 
             complexity <= 15 ? 'high' : 'very-high',
      recommendation: complexity > 10 ? 
        'Consider refactoring to reduce complexity' : 
        'Complexity is within acceptable range'
    };
  }

  assessMaintainability(code) {
    const metrics = {
      commentRatio: this.calculateCommentRatio(code),
      functionLength: this.calculateAverageFunctionLength(code),
      nestingDepth: this.calculateNestingDepth(code),
      variableNaming: this.assessVariableNaming(code)
    };

    const score = this.calculateMaintainabilityScore(metrics);

    return {
      score,
      level: score >= 80 ? 'excellent' :
             score >= 60 ? 'good' :
             score >= 40 ? 'fair' : 'poor',
      metrics,
      recommendations: this.generateMaintainabilityRecommendations(metrics)
    };
  }

  // Helper methods
  calculateCommentRatio(code) {
    const lines = code.split('\n');
    const commentLines = lines.filter(line => 
      line.trim().startsWith('//') || 
      line.trim().startsWith('/*') || 
      line.trim().startsWith('*')
    ).length;
    const codeLines = lines.filter(line => line.trim().length > 0).length;
    return codeLines > 0 ? commentLines / codeLines : 0;
  }

  calculateAverageFunctionLength(code) {
    const functions = code.match(/function\s+\w+[^}]+}|const\s+\w+\s*=\s*\([^}]*\)\s*=>\s*\{[^}]*\}/g) || [];
    if (functions.length === 0) return 0;
    
    const totalLines = functions.reduce((sum, func) => sum + func.split('\n').length, 0);
    return totalLines / functions.length;
  }

  calculateNestingDepth(code) {
    const lines = code.split('\n');
    let maxDepth = 0;
    let currentDepth = 0;

    lines.forEach(line => {
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      currentDepth += openBraces - closeBraces;
      maxDepth = Math.max(maxDepth, currentDepth);
    });

    return maxDepth;
  }

  assessVariableNaming(code) {
    const variableDeclarations = code.match(/(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g) || [];
    const wellNamed = variableDeclarations.filter(declaration => {
      const name = declaration.split(/\s+/)[1];
      return name.length >= 3 || ['i', 'j', 'k', 'id'].includes(name);
    }).length;

    return variableDeclarations.length > 0 ? wellNamed / variableDeclarations.length : 1;
  }

  calculateMaintainabilityScore(metrics) {
    let score = 100;
    
    // Comment ratio (ideal: 0.1-0.3)
    if (metrics.commentRatio < 0.05) score -= 15;
    else if (metrics.commentRatio > 0.5) score -= 5;
    
    // Function length (ideal: < 20 lines)
    if (metrics.functionLength > 50) score -= 20;
    else if (metrics.functionLength > 30) score -= 10;
    
    // Nesting depth (ideal: < 4)
    if (metrics.nestingDepth > 6) score -= 20;
    else if (metrics.nestingDepth > 4) score -= 10;
    
    // Variable naming (ideal: > 0.8)
    if (metrics.variableNaming < 0.6) score -= 15;
    else if (metrics.variableNaming < 0.8) score -= 8;

    return Math.max(0, score);
  }

  findRepeatedPatterns(code) {
    // Simple implementation - could be enhanced with AST analysis
    const lines = code.split('\n').map(line => line.trim()).filter(line => line.length > 10);
    const patterns = {};
    
    lines.forEach(line => {
      patterns[line] = (patterns[line] || 0) + 1;
    });
    
    return Object.entries(patterns)
      .filter(([pattern, count]) => count > 1)
      .map(([pattern, count]) => ({ pattern, count }))
      .sort((a, b) => b.count - a.count);
  }

  generateQualityRecommendations(issues, practicesFollowed) {
    const recommendations = [];
    
    const criticalIssues = issues.filter(issue => issue.severity === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.push({
        priority: 'high',
        message: `Address ${criticalIssues.length} critical issues immediately`,
        actions: criticalIssues.map(issue => issue.suggestion)
      });
    }
    
    if (practicesFollowed.length < 2) {
      recommendations.push({
        priority: 'medium',
        message: 'Implement more coding best practices',
        actions: ['Add error handling', 'Use modern JavaScript features', 'Implement type checking']
      });
    }
    
    return recommendations;
  }

  getSecurityRecommendation(vulnerabilityType) {
    const recommendations = {
      'sql-injection': 'Use parameterized queries or ORM with built-in protection',
      'xss': 'Sanitize all user inputs and use safe DOM manipulation methods',
      'path-traversal': 'Validate and sanitize file paths, use allowlists',
      'weak-crypto': 'Use strong cryptographic algorithms like SHA-256 or bcrypt'
    };
    
    return recommendations[vulnerabilityType];
  }

  calculateRiskLevel(vulnerabilities) {
    const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length;
    const highCount = vulnerabilities.filter(v => v.severity === 'high').length;
    
    if (criticalCount > 0) return 'critical';
    if (highCount > 2) return 'high';
    if (highCount > 0 || vulnerabilities.length > 5) return 'medium';
    return 'low';
  }

  generatePerformanceRecommendations(issues) {
    const recommendations = [];
    
    const highImpactIssues = issues.filter(issue => 
      issue.severity === 'high' || issue.severity === 'critical'
    );
    
    if (highImpactIssues.length > 0) {
      recommendations.push({
        priority: 'high',
        message: 'Address high-impact performance issues',
        actions: highImpactIssues.map(issue => issue.suggestion)
      });
    }
    
    return recommendations;
  }

  generateMaintainabilityRecommendations(metrics) {
    const recommendations = [];
    
    if (metrics.commentRatio < 0.05) {
      recommendations.push('Add more code comments and documentation');
    }
    
    if (metrics.functionLength > 30) {
      recommendations.push('Break large functions into smaller, focused functions');
    }
    
    if (metrics.nestingDepth > 4) {
      recommendations.push('Reduce nesting depth using early returns and guard clauses');
    }
    
    if (metrics.variableNaming < 0.8) {
      recommendations.push('Use more descriptive variable names');
    }
    
    return recommendations;
  }

  async analyzeProject(projectPath, extensions) {
    try {
      const files = await this.getProjectFiles(projectPath, extensions);
      const analyses = [];
      
      for (const file of files.slice(0, 10)) { // Limit to 10 files for performance
        try {
          const code = await fs.readFile(file, 'utf8');
          const analysis = await this.analyzeFile(code, file);
          analyses.push(analysis);
        } catch (error) {
          console.warn(`Failed to analyze ${file}:`, error.message);
        }
      }
      
      return {
        projectPath,
        totalFiles: files.length,
        analyzedFiles: analyses.length,
        summary: this.generateProjectSummary(analyses),
        files: analyses
      };
    } catch (error) {
      throw new Error(`Project analysis failed: ${error.message}`);
    }
  }

  async getProjectFiles(projectPath, extensions) {
    const { stdout } = await execAsync(`find ${projectPath} -type f \\( ${extensions.map(ext => `-name "*${ext}"`).join(' -o ')} \\)`);
    return stdout.trim().split('\n').filter(Boolean);
  }

  async analyzeFile(code, filePath) {
    return {
      filePath,
      metrics: await this.calculateMetrics(code),
      quality: await this.assessQuality(code, 'javascript'),
      complexity: this.calculateComplexity(code),
      maintainability: this.assessMaintainability(code)
    };
  }

  generateProjectSummary(analyses) {
    if (analyses.length === 0) return { message: 'No files analyzed' };
    
    const avgQuality = analyses.reduce((sum, a) => sum + a.quality.score, 0) / analyses.length;
    const avgComplexity = analyses.reduce((sum, a) => sum + a.complexity.cyclomatic, 0) / analyses.length;
    const avgMaintainability = analyses.reduce((sum, a) => sum + a.maintainability.score, 0) / analyses.length;
    
    return {
      averageQuality: Math.round(avgQuality),
      averageComplexity: Math.round(avgComplexity * 100) / 100,
      averageMaintainability: Math.round(avgMaintainability),
      totalIssues: analyses.reduce((sum, a) => sum + a.quality.issues.length, 0),
      highComplexityFiles: analyses.filter(a => a.complexity.level === 'high' || a.complexity.level === 'very-high').length
    };
  }

  async calculateQualityScore(code, language) {
    const quality = await this.assessQuality(code, language);
    const complexity = this.calculateComplexity(code);
    const maintainability = this.assessMaintainability(code);
    
    // Weighted average
    const overallScore = (quality.score * 0.5 + maintainability.score * 0.3 + (100 - complexity.cyclomatic * 5) * 0.2);
    
    return {
      overall: Math.round(Math.max(0, Math.min(100, overallScore))),
      breakdown: {
        quality: quality.score,
        maintainability: maintainability.score,
        complexity: complexity.level
      },
      recommendations: [
        ...quality.recommendations,
        ...maintainability.recommendations,
        complexity.recommendation ? [{ message: complexity.recommendation }] : []
      ].flat()
    };
  }

  generateAnalysisSummary(analysis) {
    const criticalIssues = [
      ...(analysis.quality.issues || []).filter(i => i.severity === 'critical'),
      ...(analysis.security.vulnerabilities || []).filter(v => v.severity === 'critical')
    ];
    
    return {
      overallHealth: criticalIssues.length === 0 ? 'good' : 'needs-attention',
      criticalIssues: criticalIssues.length,
      qualityScore: analysis.quality.score,
      complexityLevel: analysis.complexity.level,
      maintainabilityScore: analysis.maintainability.score,
      topRecommendations: [
        ...analysis.quality.recommendations,
        ...analysis.refactoring.slice(0, 3)
      ].slice(0, 5)
    };
  }

  async performSecurityScan(code, filePath) {
    return this.scanSecurity(code);
  }

  async performPerformanceAnalysis(code, context) {
    return this.analyzePerformance(code);
  }

  async analyzeCodeComplexity(code, threshold) {
    const complexity = this.calculateComplexity(code);
    return {
      ...complexity,
      exceedsThreshold: complexity.cyclomatic > threshold,
      threshold,
      recommendation: complexity.cyclomatic > threshold ?
        `Complexity (${complexity.cyclomatic}) exceeds threshold (${threshold}). Consider refactoring.` :
        'Complexity is within acceptable limits.'
    };
  }

  async generateRefactoringSuggestions(code, language, target) {
    const suggestions = await this.suggestRefactoring(code, language);
    
    // Filter by target
    if (target === 'performance') {
      return suggestions.filter(s => s.type.includes('performance') || s.type.includes('loop'));
    } else if (target === 'readability') {
      return suggestions.filter(s => s.type.includes('naming') || s.type.includes('function-length'));
    }
    
    return suggestions;
  }

  async checkBestPractices(code, language, framework) {
    const practices = {
      general: this.patterns.bestPractices.filter(p => p.check(code)),
      violations: this.patterns.antiPatterns.filter(p => code.match(p.pattern))
    };
    
    return {
      followedPractices: practices.general,
      violations: practices.violations,
      score: Math.max(0, 100 - practices.violations.length * 10),
      recommendations: practices.violations.map(v => v.suggestion)
    };
  }

  start() {
    this.server = this.app.listen(this.port, () => {
      console.log(`🧠 Code Intelligence MCP Server running on port ${this.port}`);
      console.log(`🔍 Comprehensive analysis: http://localhost:${this.port}/api/analyze/comprehensive`);
      console.log(`🏆 Quality scoring: http://localhost:${this.port}/api/quality/score`);
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
    }
  }
}

// Start server if run directly
if (require.main === module) {
  const server = new CodeIntelligenceMCP();
  server.start();
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Code Intelligence MCP Server...');
    server.stop();
    process.exit(0);
  });
}

module.exports = CodeIntelligenceMCP;
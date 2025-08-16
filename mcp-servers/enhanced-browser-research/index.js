#!/usr/bin/env node
/**
 * Enhanced Browser Research MCP Server
 * Implements comprehensive Perplexity + Browser automation as specified in integration guides
 * 
 * Features:
 * - Perplexity API integration with Grok-4 optimization
 * - Browser automation with citation verification
 * - Evidence collection and artifact management
 * - Performance monitoring and cost controls
 * - Comprehensive testing framework
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const puppeteer = require('puppeteer');
const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

class EnhancedBrowserResearchMCP {
  constructor() {
    this.server = new Server(
      {
        name: 'enhanced-browser-research',
        version: '2.0.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    // Perplexity configuration
    this.perplexityConfig = {
      apiKey: process.env.PERPLEXITY_API_KEY,
      baseURL: 'https://api.perplexity.ai',
      models: {
        'grok-4': { cost: 0.005, contextLength: 128000, recommended: 'advanced reasoning and coding' },
        'sonar-pro': { cost: 0.003, contextLength: 128000, recommended: 'general research and analysis' },
        'sonar-reasoning-pro': { cost: 0.004, contextLength: 128000, recommended: 'complex reasoning' },
        'gpt-5': { cost: 0.008, contextLength: 200000, recommended: 'advanced coding and complex analysis' }
      },
      timeout: 30000,
      retries: 3
    };

    // Browser configuration
    this.browserConfig = {
      headless: true,
      timeout: 30000,
      userAgent: 'EchoTune-ResearchBot/2.0',
      viewport: { width: 1920, height: 1080 }
    };

    // Performance budgets
    this.performanceBudgets = {
      maxLatencyMs: 2000,
      maxMemoryMB: 512,
      costBudgetUSD: 1.00,
      maxConcurrentRequests: 3
    };

    // State management
    this.browser = null;
    this.activeTasks = new Set();
    this.performanceMetrics = {
      requests: 0,
      errors: 0,
      totalLatency: 0,
      totalCost: 0,
      cacheHits: 0,
      cacheMisses: 0
    };

    this.cache = new Map();
    this.evidenceStore = new Map();

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler('tools/list', async () => {
      return {
        tools: [
          {
            name: 'comprehensive_research',
            description: 'Conduct comprehensive research with Perplexity + browser verification and evidence collection',
            inputSchema: {
              type: 'object',
              properties: {
                topic: {
                  type: 'string',
                  description: 'Research topic or question'
                },
                options: {
                  type: 'object',
                  properties: {
                    model: {
                      type: 'string',
                      enum: ['grok-4', 'sonar-pro', 'sonar-reasoning-pro', 'gpt-5'],
                      description: 'Perplexity model to use',
                      default: 'sonar-pro'
                    },
                    verifyWithBrowser: {
                      type: 'boolean',
                      description: 'Enable browser verification of sources',
                      default: true
                    },
                    captureArtifacts: {
                      type: 'boolean',
                      description: 'Capture screenshots and evidence',
                      default: true
                    },
                    depth: {
                      type: 'string',
                      enum: ['quick', 'standard', 'comprehensive'],
                      description: 'Research depth level',
                      default: 'standard'
                    },
                    domainFilter: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Limit search to specific domains'
                    },
                    recencyFilter: {
                      type: 'string',
                      enum: ['hour', 'day', 'week', 'month', 'year'],
                      description: 'Filter by content recency'
                    }
                  }
                }
              },
              required: ['topic']
            }
          },
          {
            name: 'analyze_repository',
            description: 'Analyze repository structure and generate improvement recommendations',
            inputSchema: {
              type: 'object',
              properties: {
                repoPath: {
                  type: 'string',
                  description: 'Path to repository directory'
                },
                analysisType: {
                  type: 'string',
                  enum: ['structure', 'code_quality', 'security', 'performance', 'comprehensive'],
                  description: 'Type of analysis to perform',
                  default: 'comprehensive'
                }
              },
              required: ['repoPath']
            }
          },
          {
            name: 'generate_tasks',
            description: 'Generate actionable development tasks based on analysis results',
            inputSchema: {
              type: 'object',
              properties: {
                analysisResults: {
                  type: 'object',
                  description: 'Previous analysis results'
                },
                priority: {
                  type: 'string',
                  enum: ['low', 'medium', 'high', 'critical'],
                  description: 'Task priority filter',
                  default: 'medium'
                }
              }
            }
          },
          {
            name: 'browser_automation',
            description: 'Execute browser automation tasks with evidence collection',
            inputSchema: {
              type: 'object',
              properties: {
                actions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: ['navigate', 'click', 'type', 'screenshot', 'extract'] },
                      target: { type: 'string' },
                      value: { type: 'string' }
                    }
                  },
                  description: 'Browser actions to execute'
                },
                captureEvidence: {
                  type: 'boolean',
                  description: 'Capture screenshots and artifacts',
                  default: true
                }
              },
              required: ['actions']
            }
          },
          {
            name: 'validate_implementation',
            description: 'Validate and test implemented features with comprehensive reporting',
            inputSchema: {
              type: 'object',
              properties: {
                testSuite: {
                  type: 'string',
                  enum: ['perplexity', 'browser', 'integration', 'performance', 'comprehensive'],
                  description: 'Test suite to run',
                  default: 'comprehensive'
                },
                generateReport: {
                  type: 'boolean',
                  description: 'Generate detailed validation report',
                  default: true
                }
              }
            }
          },
          {
            name: 'health_check',
            description: 'Check system health and performance metrics',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'comprehensive_research':
            return await this.handleComprehensiveResearch(args);
          case 'analyze_repository':
            return await this.handleRepositoryAnalysis(args);
          case 'generate_tasks':
            return await this.handleTaskGeneration(args);
          case 'browser_automation':
            return await this.handleBrowserAutomation(args);
          case 'validate_implementation':
            return await this.handleValidation(args);
          case 'health_check':
            return await this.handleHealthCheck();
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        this.performanceMetrics.errors++;
        return {
          content: [{
            type: 'text',
            text: `❌ Error executing ${name}: ${error.message}`
          }],
          isError: true
        };
      }
    });
  }

  async handleComprehensiveResearch(args) {
    const { topic, options = {} } = args;
    const startTime = Date.now();

    try {
      // Validate inputs
      if (!topic || topic.trim().length === 0) {
        throw new Error('Research topic cannot be empty');
      }

      if (!this.perplexityConfig.apiKey) {
        throw new Error('PERPLEXITY_API_KEY environment variable is required');
      }

      // Check cost budget
      if (this.performanceMetrics.totalCost >= this.performanceBudgets.costBudgetUSD) {
        throw new Error(`Cost budget exceeded: $${this.performanceMetrics.totalCost.toFixed(4)}`);
      }

      // Create research plan
      const researchPlan = await this.createResearchPlan(topic, options);
      
      // Execute Perplexity research
      const perplexityResults = await this.executePerplexityResearch(researchPlan);

      // Browser verification if enabled
      let browserResults = null;
      if (options.verifyWithBrowser && perplexityResults.citations) {
        browserResults = await this.verifyWithBrowser(perplexityResults.citations, options);
      }

      // Compile comprehensive results
      const results = {
        topic,
        plan: researchPlan,
        perplexityData: perplexityResults,
        browserVerification: browserResults,
        evidence: this.getEvidenceForTopic(topic),
        confidenceScore: this.calculateConfidenceScore(perplexityResults, browserResults),
        generatedAt: new Date().toISOString(),
        duration: Date.now() - startTime
      };

      // Store evidence
      this.evidenceStore.set(topic, results);

      return {
        content: [{
          type: 'text',
          text: this.formatComprehensiveResults(results)
        }],
        meta: results
      };

    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `❌ Comprehensive research failed: ${error.message}`
        }],
        isError: true,
        meta: { error: error.message, duration: Date.now() - startTime }
      };
    }
  }

  async createResearchPlan(topic, options) {
    const depth = options.depth || 'standard';
    
    const plans = {
      quick: {
        questions: [
          { id: 'primary', query: `What is ${topic}? Provide overview with key details.`, needsVerification: false }
        ],
        verificationLevel: 'minimal'
      },
      standard: {
        questions: [
          { id: 'overview', query: `Comprehensive overview of ${topic} with current status`, needsVerification: true },
          { id: 'details', query: `Key features, capabilities, and technical details of ${topic}`, needsVerification: true },
          { id: 'trends', query: `Latest trends, developments, and future outlook for ${topic}`, needsVerification: false }
        ],
        verificationLevel: 'standard'
      },
      comprehensive: {
        questions: [
          { id: 'overview', query: `Comprehensive analysis of ${topic} including history and current state`, needsVerification: true },
          { id: 'technical', query: `Technical implementation, architecture, and best practices for ${topic}`, needsVerification: true },
          { id: 'comparative', query: `Comparison with alternatives, pros/cons, and use cases for ${topic}`, needsVerification: true },
          { id: 'future', query: `Future roadmap, emerging trends, and strategic implications of ${topic}`, needsVerification: false }
        ],
        verificationLevel: 'comprehensive'
      }
    };

    return plans[depth] || plans.standard;
  }

  async executePerplexityResearch(plan) {
    const results = {};
    
    for (const question of plan.questions) {
      try {
        const response = await this.makePerplexityRequest(question.query);
        results[question.id] = {
          query: question.query,
          response: response.content,
          citations: response.citations || [],
          metadata: response.metadata || {}
        };
      } catch (error) {
        results[question.id] = {
          query: question.query,
          error: error.message
        };
      }
    }

    return results;
  }

  async makePerplexityRequest(query, options = {}) {
    const model = options.model || 'sonar-pro';
    const modelConfig = this.perplexityConfig.models[model];
    
    if (!modelConfig) {
      throw new Error(`Unsupported model: ${model}`);
    }

    const requestBody = {
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful research assistant. Provide accurate, well-researched answers with proper citations and sources. Focus on recent, authoritative information.'
        },
        {
          role: 'user',
          content: query
        }
      ],
      max_tokens: options.max_tokens || 2000,
      temperature: options.temperature || 0.3,
      return_citations: true,
      search_domain_filter: options.domainFilter,
      search_recency_filter: options.recencyFilter || 'month'
    };

    const response = await fetch(`${this.perplexityConfig.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.perplexityConfig.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'EchoTune-ResearchBot/2.0'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Update metrics
    this.performanceMetrics.requests++;
    const estimatedCost = (data.usage?.total_tokens || 2000) / 1000 * modelConfig.cost;
    this.performanceMetrics.totalCost += estimatedCost;

    return {
      content: data.choices[0].message.content,
      citations: data.citations || [],
      metadata: { usage: data.usage, cost: estimatedCost }
    };
  }

  async verifyWithBrowser(citations, options) {
    if (!this.browser) {
      await this.initializeBrowser();
    }

    const verificationResults = [];
    const maxSourcesToVerify = Math.min(citations.length, 3); // Limit for performance

    for (let i = 0; i < maxSourcesToVerify; i++) {
      const citation = citations[i];
      
      try {
        const page = await this.browser.newPage();
        await page.setUserAgent(this.browserConfig.userAgent);
        
        // Navigate to source
        await page.goto(citation.url, { waitUntil: 'networkidle0', timeout: this.browserConfig.timeout });
        
        // Capture screenshot if requested
        let screenshot = null;
        if (options.captureArtifacts) {
          const screenshotPath = path.join('./automation-artifacts/screenshots', `verification_${Date.now()}_${i}.png`);
          await page.screenshot({ path: screenshotPath, fullPage: true });
          screenshot = screenshotPath;
        }

        // Extract relevant content
        const extractedContent = await page.evaluate(() => {
          const content = document.body.innerText;
          return content.substring(0, 1000); // Limit content for analysis
        });

        // Calculate verification score
        const verificationScore = this.calculateVerificationScore(citation.snippet, extractedContent);

        verificationResults.push({
          url: citation.url,
          title: citation.title || 'Unknown',
          verified: verificationScore > 0.7,
          confidence: verificationScore,
          screenshot: screenshot,
          extractedContent: extractedContent.substring(0, 200),
          timestamp: new Date().toISOString()
        });

        await page.close();
        
      } catch (error) {
        verificationResults.push({
          url: citation.url,
          verified: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    return {
      totalSources: citations.length,
      verifiedSources: verificationResults.filter(r => r.verified).length,
      results: verificationResults
    };
  }

  calculateVerificationScore(citationSnippet, extractedContent) {
    // Simple similarity scoring - could be enhanced with NLP
    const citationWords = citationSnippet.toLowerCase().split(/\s+/);
    const contentWords = extractedContent.toLowerCase();
    
    let matches = 0;
    for (const word of citationWords) {
      if (word.length > 3 && contentWords.includes(word)) {
        matches++;
      }
    }
    
    return Math.min(matches / Math.max(citationWords.length, 1), 1.0);
  }

  async handleRepositoryAnalysis(args) {
    const { repoPath, analysisType = 'comprehensive' } = args;
    
    try {
      const analysisResults = await this.analyzeRepository(repoPath, analysisType);
      
      return {
        content: [{
          type: 'text',
          text: this.formatAnalysisResults(analysisResults)
        }],
        meta: analysisResults
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `❌ Repository analysis failed: ${error.message}`
        }],
        isError: true
      };
    }
  }

  async analyzeRepository(repoPath, analysisType) {
    // Repository structure analysis
    const structure = await this.analyzeRepositoryStructure(repoPath);
    
    // Code quality metrics
    const codeQuality = await this.analyzeCodeQuality(repoPath);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(structure, codeQuality);
    
    return {
      structure,
      codeQuality,
      recommendations,
      analysisType,
      timestamp: new Date().toISOString()
    };
  }

  async analyzeRepositoryStructure(repoPath) {
    const stats = await fs.stat(repoPath);
    if (!stats.isDirectory()) {
      throw new Error('Repository path must be a directory');
    }

    const files = await this.walkDirectory(repoPath);
    const fileTypes = this.categorizeFiles(files);
    
    return {
      totalFiles: files.length,
      fileTypes,
      structure: this.buildStructureTree(files, repoPath)
    };
  }

  async walkDirectory(dir, files = []) {
    const dirFiles = await fs.readdir(dir);
    
    for (const file of dirFiles) {
      const filePath = path.join(dir, file);
      const stat = await fs.stat(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        await this.walkDirectory(filePath, files);
      } else if (stat.isFile()) {
        files.push(filePath);
      }
    }
    
    return files;
  }

  categorizeFiles(files) {
    const categories = {};
    
    files.forEach(file => {
      const ext = path.extname(file).toLowerCase();
      const category = this.getFileCategory(ext);
      
      if (!categories[category]) {
        categories[category] = 0;
      }
      categories[category]++;
    });
    
    return categories;
  }

  getFileCategory(extension) {
    const categories = {
      '.js': 'JavaScript',
      '.ts': 'TypeScript',
      '.py': 'Python',
      '.json': 'Configuration',
      '.md': 'Documentation',
      '.css': 'Styles',
      '.html': 'Templates',
      '.yml': 'Configuration',
      '.yaml': 'Configuration'
    };
    
    return categories[extension] || 'Other';
  }

  buildStructureTree(files, basePath) {
    // Simple structure analysis - could be enhanced
    const tree = {};
    
    files.forEach(file => {
      const relativePath = path.relative(basePath, file);
      const parts = relativePath.split(path.sep);
      
      let current = tree;
      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          current[part] = 'file';
        } else {
          if (!current[part]) {
            current[part] = {};
          }
          current = current[part];
        }
      });
    });
    
    return tree;
  }

  async analyzeCodeQuality(repoPath) {
    // Basic code quality analysis
    const files = await this.walkDirectory(repoPath);
    const codeFiles = files.filter(file => {
      const ext = path.extname(file);
      return ['.js', '.ts', '.py'].includes(ext);
    });

    let totalLines = 0;
    let totalFunctions = 0;
    const issues = [];

    for (const file of codeFiles.slice(0, 10)) { // Limit analysis for performance
      try {
        const content = await fs.readFile(file, 'utf8');
        const lines = content.split('\n');
        totalLines += lines.length;
        
        // Basic function counting
        const functionMatches = content.match(/function\s+\w+|const\s+\w+\s*=.*=>/g) || [];
        totalFunctions += functionMatches.length;
        
        // Basic issue detection
        if (content.includes('TODO') || content.includes('FIXME')) {
          issues.push({ file: path.basename(file), type: 'TODO/FIXME found' });
        }
        
        if (lines.some(line => line.length > 120)) {
          issues.push({ file: path.basename(file), type: 'Long lines detected' });
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }

    return {
      totalCodeFiles: codeFiles.length,
      totalLines,
      totalFunctions,
      averageLinesPerFile: Math.round(totalLines / codeFiles.length) || 0,
      issues,
      complexity: totalFunctions > 100 ? 'High' : totalFunctions > 50 ? 'Medium' : 'Low'
    };
  }

  generateRecommendations(structure, codeQuality) {
    const recommendations = [];
    
    // Structure recommendations
    if (structure.totalFiles > 1000) {
      recommendations.push({
        type: 'structure',
        priority: 'medium',
        title: 'Consider modularization',
        description: 'Large number of files detected. Consider breaking into modules or packages.'
      });
    }

    // Code quality recommendations
    if (codeQuality.issues.length > 0) {
      recommendations.push({
        type: 'code_quality',
        priority: 'low',
        title: 'Address code issues',
        description: `${codeQuality.issues.length} code issues found including TODOs and long lines.`
      });
    }

    if (codeQuality.averageLinesPerFile > 300) {
      recommendations.push({
        type: 'code_quality',
        priority: 'medium',
        title: 'Large file sizes',
        description: 'Average file size is large. Consider breaking down large files.'
      });
    }

    return recommendations;
  }

  async handleTaskGeneration(args) {
    const { analysisResults, priority = 'medium' } = args;
    
    try {
      const tasks = this.generateTasksFromAnalysis(analysisResults, priority);
      
      return {
        content: [{
          type: 'text',
          text: this.formatGeneratedTasks(tasks)
        }],
        meta: { tasks, priority, generatedAt: new Date().toISOString() }
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `❌ Task generation failed: ${error.message}`
        }],
        isError: true
      };
    }
  }

  generateTasksFromAnalysis(analysisResults, priority) {
    const tasks = [];
    
    if (analysisResults && analysisResults.recommendations) {
      analysisResults.recommendations
        .filter(rec => rec.priority === priority || priority === 'all')
        .forEach((rec, index) => {
          tasks.push({
            id: `task_${Date.now()}_${index}`,
            title: rec.title,
            description: rec.description,
            priority: rec.priority,
            category: rec.type,
            estimatedEffort: this.estimateEffort(rec),
            acceptanceCriteria: this.generateAcceptanceCriteria(rec),
            createdAt: new Date().toISOString()
          });
        });
    }

    // Add default improvement tasks if none generated
    if (tasks.length === 0) {
      tasks.push({
        id: `default_task_${Date.now()}`,
        title: 'Code review and optimization',
        description: 'Review codebase for optimization opportunities and best practices',
        priority: 'medium',
        category: 'code_quality',
        estimatedEffort: '2-4 hours',
        acceptanceCriteria: ['Code reviewed', 'Issues documented', 'Improvements implemented'],
        createdAt: new Date().toISOString()
      });
    }

    return tasks;
  }

  estimateEffort(recommendation) {
    const effortMap = {
      low: '1-2 hours',
      medium: '2-4 hours',
      high: '4-8 hours',
      critical: '1-2 days'
    };
    
    return effortMap[recommendation.priority] || '2-4 hours';
  }

  generateAcceptanceCriteria(recommendation) {
    const criteriaMap = {
      structure: ['Files reorganized', 'Structure documented', 'Build still works'],
      code_quality: ['Code issues fixed', 'Quality metrics improved', 'Tests still pass'],
      security: ['Security issues addressed', 'Security scan passed', 'Documentation updated'],
      performance: ['Performance benchmarked', 'Optimizations implemented', 'Metrics improved']
    };
    
    return criteriaMap[recommendation.type] || ['Task completed', 'Documentation updated', 'Tests pass'];
  }

  formatGeneratedTasks(tasks) {
    let output = `# 📋 Generated Development Tasks\n\n`;
    output += `**Total Tasks:** ${tasks.length}\n`;
    output += `**Generated:** ${new Date().toLocaleString()}\n\n`;

    tasks.forEach((task, index) => {
      output += `## ${index + 1}. ${task.title}\n\n`;
      output += `**Priority:** ${task.priority.toUpperCase()}\n`;
      output += `**Category:** ${task.category}\n`;
      output += `**Estimated Effort:** ${task.estimatedEffort}\n\n`;
      output += `**Description:** ${task.description}\n\n`;
      output += `**Acceptance Criteria:**\n`;
      task.acceptanceCriteria.forEach(criteria => {
        output += `- [ ] ${criteria}\n`;
      });
      output += `\n---\n\n`;
    });

    return output;
  }

  async handleBrowserAutomation(args) {
    const { actions, captureEvidence = true } = args;
    
    try {
      if (!this.browser) {
        await this.initializeBrowser();
      }

      const page = await this.browser.newPage();
      const results = [];
      const evidence = [];

      for (const action of actions) {
        const result = await this.executeBrowserAction(page, action, captureEvidence);
        results.push(result);
        
        if (result.evidence) {
          evidence.push(result.evidence);
        }
      }

      await page.close();

      return {
        content: [{
          type: 'text',
          text: this.formatBrowserResults(results, evidence)
        }],
        meta: { results, evidence, timestamp: new Date().toISOString() }
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `❌ Browser automation failed: ${error.message}`
        }],
        isError: true
      };
    }
  }

  async executeBrowserAction(page, action, captureEvidence) {
    const startTime = Date.now();
    let result = { action: action.type, target: action.target, success: false };
    
    try {
      switch (action.type) {
        case 'navigate':
          await page.goto(action.target, { waitUntil: 'networkidle0' });
          result.success = true;
          break;
          
        case 'click':
          await page.click(action.target);
          result.success = true;
          break;
          
        case 'type':
          await page.type(action.target, action.value);
          result.success = true;
          break;
          
        case 'screenshot':
          const screenshotPath = path.join('./automation-artifacts/screenshots', `action_${Date.now()}.png`);
          await page.screenshot({ path: screenshotPath, fullPage: true });
          result.screenshot = screenshotPath;
          result.success = true;
          break;
          
        case 'extract':
          const extractedText = await page.$eval(action.target, el => el.textContent);
          result.extractedText = extractedText;
          result.success = true;
          break;
          
        default:
          throw new Error(`Unsupported action type: ${action.type}`);
      }
      
      // Capture evidence if requested
      if (captureEvidence && action.type !== 'screenshot') {
        const evidencePath = path.join('./automation-artifacts/screenshots', `evidence_${Date.now()}.png`);
        await page.screenshot({ path: evidencePath });
        result.evidence = evidencePath;
      }
      
    } catch (error) {
      result.error = error.message;
    }
    
    result.duration = Date.now() - startTime;
    return result;
  }

  formatBrowserResults(results, evidence) {
    let output = `# 🤖 Browser Automation Results\n\n`;
    
    const successfulActions = results.filter(r => r.success).length;
    output += `**Success Rate:** ${successfulActions}/${results.length} (${Math.round(successfulActions / results.length * 100)}%)\n`;
    output += `**Evidence Captured:** ${evidence.length} artifacts\n\n`;

    results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      output += `${index + 1}. ${status} **${result.action}** on \`${result.target}\`\n`;
      output += `   Duration: ${result.duration}ms\n`;
      
      if (result.error) {
        output += `   Error: ${result.error}\n`;
      }
      
      if (result.screenshot) {
        output += `   Screenshot: ${result.screenshot}\n`;
      }
      
      if (result.extractedText) {
        output += `   Extracted: ${result.extractedText.substring(0, 100)}...\n`;
      }
      
      output += `\n`;
    });

    return output;
  }

  async handleValidation(args) {
    const { testSuite = 'comprehensive', generateReport = true } = args;
    
    try {
      const validationResults = await this.runValidationSuite(testSuite);
      
      if (generateReport) {
        await this.generateValidationReport(validationResults);
      }
      
      return {
        content: [{
          type: 'text',
          text: this.formatValidationResults(validationResults)
        }],
        meta: validationResults
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `❌ Validation failed: ${error.message}`
        }],
        isError: true
      };
    }
  }

  async runValidationSuite(testSuite) {
    const results = {
      testSuite,
      timestamp: new Date().toISOString(),
      tests: {}
    };

    switch (testSuite) {
      case 'perplexity':
        results.tests.perplexity = await this.validatePerplexityIntegration();
        break;
      case 'browser':
        results.tests.browser = await this.validateBrowserAutomation();
        break;
      case 'integration':
        results.tests.integration = await this.validateIntegration();
        break;
      case 'performance':
        results.tests.performance = await this.validatePerformance();
        break;
      case 'comprehensive':
        results.tests.perplexity = await this.validatePerplexityIntegration();
        results.tests.browser = await this.validateBrowserAutomation();
        results.tests.integration = await this.validateIntegration();
        results.tests.performance = await this.validatePerformance();
        break;
    }

    return results;
  }

  async validatePerplexityIntegration() {
    const tests = [
      { name: 'API Key Configuration', test: () => !!this.perplexityConfig.apiKey },
      { name: 'Model Configuration', test: () => Object.keys(this.perplexityConfig.models).length > 0 },
      { name: 'Basic Request', test: async () => {
        if (!this.perplexityConfig.apiKey) return false;
        try {
          const result = await this.makePerplexityRequest('Test query for validation');
          return !!result.content;
        } catch (error) {
          return false;
        }
      }}
    ];

    const results = [];
    for (const test of tests) {
      try {
        const result = typeof test.test === 'function' ? await test.test() : test.test;
        results.push({ name: test.name, passed: result, error: null });
      } catch (error) {
        results.push({ name: test.name, passed: false, error: error.message });
      }
    }

    return results;
  }

  async validateBrowserAutomation() {
    const tests = [
      { name: 'Browser Initialization', test: async () => {
        await this.initializeBrowser();
        return !!this.browser;
      }},
      { name: 'Page Navigation', test: async () => {
        if (!this.browser) await this.initializeBrowser();
        const page = await this.browser.newPage();
        await page.goto('https://www.google.com', { timeout: 10000 });
        const title = await page.title();
        await page.close();
        return title.includes('Google');
      }},
      { name: 'Screenshot Capture', test: async () => {
        if (!this.browser) await this.initializeBrowser();
        const page = await this.browser.newPage();
        await page.goto('https://www.google.com', { timeout: 10000 });
        const screenshotPath = './automation-artifacts/test_screenshot.png';
        await page.screenshot({ path: screenshotPath });
        await page.close();
        
        try {
          await fs.access(screenshotPath);
          await fs.unlink(screenshotPath); // Cleanup
          return true;
        } catch {
          return false;
        }
      }}
    ];

    const results = [];
    for (const test of tests) {
      try {
        const result = await test.test();
        results.push({ name: test.name, passed: result, error: null });
      } catch (error) {
        results.push({ name: test.name, passed: false, error: error.message });
      }
    }

    return results;
  }

  async validateIntegration() {
    const tests = [
      { name: 'Comprehensive Research Flow', test: async () => {
        if (!this.perplexityConfig.apiKey) return false;
        try {
          const result = await this.handleComprehensiveResearch({
            topic: 'JavaScript testing frameworks',
            options: { depth: 'quick', verifyWithBrowser: false }
          });
          return !result.isError && result.meta && result.meta.confidenceScore > 0;
        } catch {
          return false;
        }
      }},
      { name: 'Task Generation', test: async () => {
        const mockAnalysis = {
          recommendations: [{
            type: 'code_quality',
            priority: 'medium',
            title: 'Test recommendation',
            description: 'Test description'
          }]
        };
        const result = await this.handleTaskGeneration({ analysisResults: mockAnalysis });
        return !result.isError && result.meta && result.meta.tasks.length > 0;
      }}
    ];

    const results = [];
    for (const test of tests) {
      try {
        const result = await test.test();
        results.push({ name: test.name, passed: result, error: null });
      } catch (error) {
        results.push({ name: test.name, passed: false, error: error.message });
      }
    }

    return results;
  }

  async validatePerformance() {
    const tests = [
      { name: 'Memory Usage', test: () => {
        const memoryUsage = process.memoryUsage();
        const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
        return heapUsedMB < this.performanceBudgets.maxMemoryMB;
      }},
      { name: 'Response Time', test: async () => {
        const startTime = Date.now();
        await this.handleHealthCheck();
        const duration = Date.now() - startTime;
        return duration < this.performanceBudgets.maxLatencyMs;
      }},
      { name: 'Cost Budget', test: () => {
        return this.performanceMetrics.totalCost < this.performanceBudgets.costBudgetUSD;
      }}
    ];

    const results = [];
    for (const test of tests) {
      try {
        const result = await test.test();
        results.push({ name: test.name, passed: result, error: null });
      } catch (error) {
        results.push({ name: test.name, passed: false, error: error.message });
      }
    }

    return results;
  }

  async generateValidationReport(results) {
    const reportPath = path.join('./automation-artifacts/reports', `validation_report_${Date.now()}.json`);
    
    try {
      await fs.writeFile(reportPath, JSON.stringify(results, null, 2));
      console.error(`[Enhanced Browser Research MCP] Validation report saved: ${reportPath}`);
    } catch (error) {
      console.error(`[Enhanced Browser Research MCP] Failed to save validation report: ${error.message}`);
    }
  }

  async initializeBrowser() {
    if (this.browser) return;

    this.browser = await puppeteer.launch({
      headless: this.browserConfig.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: this.browserConfig.viewport
    });
  }

  async handleHealthCheck() {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          status: 'healthy',
          uptime: `${Math.round(uptime)}s`,
          memory: {
            heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`
          },
          performance: this.performanceMetrics,
          browser: {
            initialized: !!this.browser,
            activeTasks: this.activeTasks.size
          },
          perplexity: {
            configured: !!this.perplexityConfig.apiKey,
            modelsAvailable: Object.keys(this.perplexityConfig.models).length
          }
        }, null, 2)
      }]
    };
  }

  formatComprehensiveResults(results) {
    let output = `# 🔍 Comprehensive Research Results: ${results.topic}\n\n`;
    
    output += `**Research Duration:** ${results.duration}ms\n`;
    output += `**Confidence Score:** ${(results.confidenceScore * 100).toFixed(1)}%\n\n`;

    // Perplexity results
    output += `## 📚 Research Findings\n\n`;
    Object.entries(results.perplexityData).forEach(([questionId, data]) => {
      output += `### ${questionId.charAt(0).toUpperCase() + questionId.slice(1)}\n`;
      if (data.error) {
        output += `❌ Error: ${data.error}\n\n`;
      } else {
        output += `${data.response}\n\n`;
        if (data.citations && data.citations.length > 0) {
          output += `**Sources:**\n`;
          data.citations.forEach((citation, index) => {
            output += `${index + 1}. ${citation.title || 'Unknown'} - ${citation.url}\n`;
          });
          output += `\n`;
        }
      }
    });

    // Browser verification results
    if (results.browserVerification) {
      output += `## 🌐 Source Verification\n\n`;
      output += `**Verified Sources:** ${results.browserVerification.verifiedSources}/${results.browserVerification.totalSources}\n\n`;
      
      results.browserVerification.results.forEach((result, index) => {
        output += `${index + 1}. **${result.title}**\n`;
        output += `   ${result.verified ? '✅ Verified' : '❌ Unverified'} (${(result.confidence * 100).toFixed(1)}% confidence)\n`;
        output += `   URL: ${result.url}\n`;
        if (result.error) output += `   Error: ${result.error}\n`;
        output += `\n`;
      });
    }

    return output;
  }

  formatAnalysisResults(results) {
    let output = `# 📊 Repository Analysis Results\n\n`;
    output += `**Analysis Type:** ${results.analysisType}\n`;
    output += `**Timestamp:** ${results.timestamp}\n\n`;

    // Structure analysis
    output += `## 🏗️ Structure Analysis\n\n`;
    output += `**Total Files:** ${results.structure.totalFiles}\n\n`;
    output += `**File Types:**\n`;
    Object.entries(results.structure.fileTypes).forEach(([type, count]) => {
      output += `- ${type}: ${count}\n`;
    });

    // Code quality
    output += `\n## 💻 Code Quality\n\n`;
    output += `**Code Files:** ${results.codeQuality.totalCodeFiles}\n`;
    output += `**Total Lines:** ${results.codeQuality.totalLines}\n`;
    output += `**Total Functions:** ${results.codeQuality.totalFunctions}\n`;
    output += `**Average Lines/File:** ${results.codeQuality.averageLinesPerFile}\n`;
    output += `**Complexity:** ${results.codeQuality.complexity}\n`;

    if (results.codeQuality.issues.length > 0) {
      output += `\n**Issues Found:**\n`;
      results.codeQuality.issues.forEach(issue => {
        output += `- ${issue.file}: ${issue.type}\n`;
      });
    }

    // Recommendations
    output += `\n## 💡 Recommendations\n\n`;
    results.recommendations.forEach((rec, index) => {
      output += `${index + 1}. **${rec.title}** (${rec.priority})\n`;
      output += `   ${rec.description}\n\n`;
    });

    return output;
  }

  formatValidationResults(results) {
    let output = `# 🧪 Validation Results\n\n`;
    output += `**Test Suite:** ${results.testSuite}\n`;
    output += `**Timestamp:** ${results.timestamp}\n\n`;

    Object.entries(results.tests).forEach(([category, tests]) => {
      output += `## ${category.charAt(0).toUpperCase() + category.slice(1)} Tests\n\n`;
      
      const passed = tests.filter(t => t.passed).length;
      const total = tests.length;
      output += `**Success Rate:** ${passed}/${total} (${Math.round(passed / total * 100)}%)\n\n`;
      
      tests.forEach(test => {
        const status = test.passed ? '✅' : '❌';
        output += `${status} **${test.name}**`;
        if (test.error) output += ` - Error: ${test.error}`;
        output += `\n`;
      });
      output += `\n`;
    });

    return output;
  }

  calculateConfidenceScore(perplexityResults, browserResults) {
    let score = 0.5; // Base score
    
    // Boost score for successful Perplexity results
    const successfulQueries = Object.values(perplexityResults).filter(r => !r.error).length;
    const totalQueries = Object.keys(perplexityResults).length;
    score += (successfulQueries / totalQueries) * 0.3;
    
    // Boost score for browser verification
    if (browserResults) {
      const verificationRate = browserResults.verifiedSources / browserResults.totalSources;
      score += verificationRate * 0.2;
    }
    
    return Math.min(score, 1.0);
  }

  getEvidenceForTopic(topic) {
    return Array.from(this.evidenceStore.entries())
      .filter(([key]) => key.includes(topic))
      .map(([key, data]) => ({ key, timestamp: data.generatedAt }));
  }

  async shutdown() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.error('[Enhanced Browser Research MCP] Shutting down gracefully...');
      await this.shutdown();
      process.exit(0);
    });

    await this.server.connect(transport);
    console.error('[Enhanced Browser Research MCP] Server running with comprehensive research capabilities');
  }
}

// Run server if called directly
if (require.main === module) {
  const server = new EnhancedBrowserResearchMCP();
  server.run().catch((error) => {
    console.error('Failed to run server:', error);
    process.exit(1);
  });
}

module.exports = EnhancedBrowserResearchMCP;
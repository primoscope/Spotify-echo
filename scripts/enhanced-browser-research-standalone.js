#!/usr/bin/env node
/**
 * Enhanced Browser Research System (Standalone)
 * 
 * Simplified implementation that works with existing EchoTune infrastructure
 * for comprehensive Perplexity + Browser automation and analysis
 */

const puppeteer = require('puppeteer');
const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

class EnhancedBrowserResearchStandalone {
  constructor() {
    // Configuration
    this.config = {
      perplexityApiKey: process.env.PERPLEXITY_API_KEY,
      perplexityBaseURL: 'https://api.perplexity.ai',
      browserTimeout: 30000,
      maxConcurrentRequests: 3,
      enableBrowserVerification: true,
      captureArtifacts: true
    };

    // Performance tracking
    this.metrics = {
      requests: 0,
      errors: 0,
      totalLatency: 0,
      totalCost: 0,
      cacheHits: 0,
      cacheMisses: 0
    };

    // Models configuration
    this.models = {
      'grok-4': { cost: 0.005, recommended: 'advanced reasoning and coding' },
      'sonar-pro': { cost: 0.003, recommended: 'general research and analysis' },
      'sonar-reasoning-pro': { cost: 0.004, recommended: 'complex reasoning' },
      'gpt-5': { cost: 0.008, recommended: 'advanced coding and analysis' }
    };

    this.browser = null;
    this.cache = new Map();
    this.evidenceStore = new Map();
  }

  /**
   * Initialize browser for automation
   */
  async initializeBrowser() {
    if (this.browser) return;

    console.log('🌐 Initializing browser...');
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1920, height: 1080 }
    });
    console.log('✅ Browser initialized');
  }

  /**
   * Conduct comprehensive research with Perplexity + browser verification
   */
  async conductComprehensiveResearch(topic, options = {}) {
    const startTime = Date.now();
    console.log(`🔍 Researching: ${topic}`);

    try {
      // Step 1: Perplexity research
      const perplexityResults = await this.performPerplexityResearch(topic, options);
      
      // Step 2: Browser verification (if enabled)
      let browserResults = null;
      if (options.verifyWithBrowser !== false && perplexityResults.citations) {
        browserResults = await this.verifyWithBrowser(perplexityResults.citations, options);
      }

      // Step 3: Compile results
      const results = {
        topic,
        perplexityData: perplexityResults,
        browserVerification: browserResults,
        confidenceScore: this.calculateConfidenceScore(perplexityResults, browserResults),
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };

      // Store evidence
      this.evidenceStore.set(topic, results);

      console.log(`✅ Research complete: ${topic} (${results.duration}ms)`);
      return results;

    } catch (error) {
      console.error(`❌ Research failed for "${topic}": ${error.message}`);
      return {
        topic,
        error: error.message,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Perform Perplexity API research
   */
  async performPerplexityResearch(topic, options = {}) {
    if (!this.config.perplexityApiKey) {
      console.warn('⚠️  PERPLEXITY_API_KEY not configured, using mock data');
      return this.getMockPerplexityData(topic);
    }

    const model = options.model || 'sonar-pro';
    const modelConfig = this.models[model];

    const requestBody = {
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful research assistant. Provide accurate, well-researched answers with proper citations and sources.'
        },
        {
          role: 'user',
          content: topic
        }
      ],
      max_tokens: options.maxTokens || 2000,
      temperature: options.temperature || 0.3,
      return_citations: true,
      search_recency_filter: options.recencyFilter || 'month'
    };

    try {
      const response = await fetch(`${this.config.perplexityBaseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.perplexityApiKey}`,
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
      this.metrics.requests++;
      const estimatedCost = (data.usage?.total_tokens || 2000) / 1000 * (modelConfig?.cost || 0.003);
      this.metrics.totalCost += estimatedCost;

      return {
        content: data.choices[0].message.content,
        citations: data.citations || [],
        usage: data.usage,
        cost: estimatedCost,
        model: model
      };

    } catch (error) {
      this.metrics.errors++;
      throw new Error(`Perplexity request failed: ${error.message}`);
    }
  }

  /**
   * Get mock Perplexity data for testing
   */
  getMockPerplexityData(topic) {
    return {
      content: `Mock research results for "${topic}". This is a simulated response that would normally come from Perplexity AI with comprehensive analysis, industry insights, and best practices. The content would include detailed explanations, examples, and actionable recommendations.`,
      citations: [
        { title: 'Example Source 1', url: 'https://example.com/source1' },
        { title: 'Example Source 2', url: 'https://example.com/source2' }
      ],
      usage: { total_tokens: 500 },
      cost: 0.0015,
      model: 'mock'
    };
  }

  /**
   * Verify sources using browser automation
   */
  async verifyWithBrowser(citations, options = {}) {
    if (!this.browser) {
      await this.initializeBrowser();
    }

    const verificationResults = [];
    const maxSourcesToVerify = Math.min(citations.length, 3); // Limit for performance

    console.log(`🌐 Verifying ${maxSourcesToVerify} sources with browser...`);

    for (let i = 0; i < maxSourcesToVerify; i++) {
      const citation = citations[i];
      
      try {
        const page = await this.browser.newPage();
        await page.setUserAgent('EchoTune-ResearchBot/2.0');
        
        // Navigate to source with timeout
        await page.goto(citation.url, { 
          waitUntil: 'networkidle0', 
          timeout: this.config.browserTimeout 
        });
        
        // Capture screenshot if enabled
        let screenshot = null;
        if (options.captureArtifacts !== false) {
          const screenshotDir = './automation-artifacts/screenshots';
          await fs.mkdir(screenshotDir, { recursive: true });
          screenshot = path.join(screenshotDir, `verification_${Date.now()}_${i}.png`);
          await page.screenshot({ path: screenshot, fullPage: true });
        }

        // Extract content
        const extractedContent = await page.evaluate(() => {
          return document.body.innerText.substring(0, 1000);
        });

        // Calculate verification score
        const verificationScore = this.calculateVerificationScore(citation.snippet || '', extractedContent);

        verificationResults.push({
          url: citation.url,
          title: citation.title || 'Unknown',
          verified: verificationScore > 0.6,
          confidence: verificationScore,
          screenshot: screenshot,
          extractedContent: extractedContent.substring(0, 200),
          timestamp: new Date().toISOString()
        });

        await page.close();
        console.log(`  ✅ Verified: ${citation.url} (${(verificationScore * 100).toFixed(1)}% confidence)`);
        
      } catch (error) {
        verificationResults.push({
          url: citation.url,
          verified: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        console.log(`  ❌ Failed to verify: ${citation.url} - ${error.message}`);
      }
    }

    return {
      totalSources: citations.length,
      verifiedSources: verificationResults.filter(r => r.verified).length,
      results: verificationResults
    };
  }

  /**
   * Calculate verification score based on content similarity
   */
  calculateVerificationScore(citationSnippet, extractedContent) {
    if (!citationSnippet || !extractedContent) return 0.5;

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

  /**
   * Calculate overall confidence score
   */
  calculateConfidenceScore(perplexityResults, browserResults) {
    let score = 0.5; // Base score
    
    // Boost for successful Perplexity results
    if (perplexityResults && perplexityResults.content) {
      score += 0.3;
    }
    
    // Boost for browser verification
    if (browserResults) {
      const verificationRate = browserResults.verifiedSources / browserResults.totalSources;
      score += verificationRate * 0.2;
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Analyze repository structure and generate recommendations
   */
  async analyzeRepository(repoPath = '.') {
    console.log(`📊 Analyzing repository: ${repoPath}`);

    try {
      const analysis = {
        structure: await this.analyzeRepositoryStructure(repoPath),
        codeQuality: await this.analyzeCodeQuality(repoPath),
        timestamp: new Date().toISOString()
      };

      analysis.recommendations = this.generateRecommendations(analysis);
      
      console.log(`✅ Repository analysis complete`);
      return analysis;

    } catch (error) {
      console.error(`❌ Repository analysis failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analyze repository structure
   */
  async analyzeRepositoryStructure(repoPath) {
    const files = await this.walkDirectory(repoPath);
    const fileTypes = this.categorizeFiles(files);
    
    return {
      totalFiles: files.length,
      fileTypes,
      directories: await this.getDirectoryStructure(repoPath)
    };
  }

  /**
   * Walk directory recursively
   */
  async walkDirectory(dir, files = []) {
    try {
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
    } catch (error) {
      // Skip inaccessible directories
    }
    
    return files;
  }

  /**
   * Categorize files by type
   */
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

  /**
   * Get file category based on extension
   */
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

  /**
   * Get directory structure
   */
  async getDirectoryStructure(repoPath) {
    const structure = {};
    
    try {
      const items = await fs.readdir(repoPath);
      
      for (const item of items) {
        if (!item.startsWith('.') && item !== 'node_modules') {
          const itemPath = path.join(repoPath, item);
          const stat = await fs.stat(itemPath);
          
          if (stat.isDirectory()) {
            structure[item] = 'directory';
          }
        }
      }
    } catch (error) {
      // Handle errors silently
    }
    
    return structure;
  }

  /**
   * Basic code quality analysis
   */
  async analyzeCodeQuality(repoPath) {
    const files = await this.walkDirectory(repoPath);
    const codeFiles = files.filter(file => {
      const ext = path.extname(file);
      return ['.js', '.ts', '.py'].includes(ext);
    });

    let totalLines = 0;
    let totalFunctions = 0;
    const issues = [];

    // Analyze a sample of code files
    for (const file of codeFiles.slice(0, 10)) {
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

  /**
   * Generate recommendations based on analysis
   */
  generateRecommendations(analysis) {
    const recommendations = [];
    
    // Structure recommendations
    if (analysis.structure.totalFiles > 1000) {
      recommendations.push({
        type: 'structure',
        priority: 'medium',
        title: 'Consider modularization',
        description: 'Large number of files detected. Consider breaking into modules or packages.'
      });
    }

    // Code quality recommendations
    if (analysis.codeQuality.issues.length > 0) {
      recommendations.push({
        type: 'code_quality',
        priority: 'low',
        title: 'Address code issues',
        description: `${analysis.codeQuality.issues.length} code issues found including TODOs and long lines.`
      });
    }

    if (analysis.codeQuality.averageLinesPerFile > 300) {
      recommendations.push({
        type: 'code_quality',
        priority: 'medium',
        title: 'Large file sizes',
        description: 'Average file size is large. Consider breaking down large files.'
      });
    }

    return recommendations;
  }

  /**
   * Generate actionable development tasks
   */
  async generateTasks(analysisResults, priority = 'medium') {
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

    // Add default improvement task if none generated
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

    return {
      tasks: tasks.slice(0, 10), // Limit to top 10 tasks
      totalGenerated: tasks.length,
      categories: [...new Set(tasks.map(t => t.category))],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Estimate effort for a recommendation
   */
  estimateEffort(recommendation) {
    const effortMap = {
      low: '1-2 hours',
      medium: '2-4 hours',
      high: '4-8 hours',
      critical: '1-2 days'
    };
    
    return effortMap[recommendation.priority] || '2-4 hours';
  }

  /**
   * Generate acceptance criteria for a recommendation
   */
  generateAcceptanceCriteria(recommendation) {
    const criteriaMap = {
      structure: ['Files reorganized', 'Structure documented', 'Build still works'],
      code_quality: ['Code issues fixed', 'Quality metrics improved', 'Tests still pass'],
      security: ['Security issues addressed', 'Security scan passed', 'Documentation updated'],
      performance: ['Performance benchmarked', 'Optimizations implemented', 'Metrics improved']
    };
    
    return criteriaMap[recommendation.type] || ['Task completed', 'Documentation updated', 'Tests pass'];
  }

  /**
   * Run comprehensive validation tests
   */
  async runValidationTests() {
    console.log('🧪 Running Validation Tests...\n');

    const tests = [
      { name: 'Configuration Check', test: () => this.validateConfiguration() },
      { name: 'Browser Initialization', test: () => this.validateBrowserInit() },
      { name: 'Research Capability', test: () => this.validateResearch() },
      { name: 'Repository Analysis', test: () => this.validateRepoAnalysis() },
      { name: 'Task Generation', test: () => this.validateTaskGeneration() }
    ];

    const results = { passed: 0, failed: 0, details: [] };

    for (const test of tests) {
      try {
        console.log(`  🔄 ${test.name}...`);
        const result = await test.test();
        
        if (result.success) {
          results.passed++;
          console.log(`  ✅ ${test.name}`);
          results.details.push({ name: test.name, status: 'passed', result: result.data });
        } else {
          results.failed++;
          console.log(`  ❌ ${test.name}: ${result.error}`);
          results.details.push({ name: test.name, status: 'failed', error: result.error });
        }
      } catch (error) {
        results.failed++;
        console.log(`  ❌ ${test.name}: ${error.message}`);
        results.details.push({ name: test.name, status: 'failed', error: error.message });
      }
    }

    console.log(`\n📊 Validation Results:`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);

    return results;
  }

  /**
   * Validation test methods
   */
  async validateConfiguration() {
    const hasPerplexityKey = !!this.config.perplexityApiKey;
    const hasModels = Object.keys(this.models).length > 0;
    
    return {
      success: hasModels,
      data: { hasPerplexityKey, modelCount: Object.keys(this.models).length }
    };
  }

  async validateBrowserInit() {
    try {
      await this.initializeBrowser();
      return { success: !!this.browser, data: { browserInitialized: true } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async validateResearch() {
    try {
      const result = await this.conductComprehensiveResearch('JavaScript testing frameworks', {
        verifyWithBrowser: false,
        captureArtifacts: false
      });
      
      return {
        success: !result.error && result.perplexityData,
        data: { hasContent: !!result.perplexityData?.content, confidence: result.confidenceScore }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async validateRepoAnalysis() {
    try {
      const result = await this.analyzeRepository('.');
      return {
        success: result.structure && result.codeQuality,
        data: { totalFiles: result.structure?.totalFiles, recommendations: result.recommendations?.length }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async validateTaskGeneration() {
    try {
      const mockAnalysis = {
        recommendations: [{
          type: 'code_quality',
          priority: 'medium',
          title: 'Test recommendation',
          description: 'Test description'
        }]
      };
      
      const result = await this.generateTasks(mockAnalysis);
      return {
        success: result.tasks && result.tasks.length > 0,
        data: { taskCount: result.tasks?.length, categories: result.categories }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get system health and metrics
   */
  getHealthStatus() {
    const memoryUsage = process.memoryUsage();
    
    return {
      status: 'healthy',
      uptime: `${Math.round(process.uptime())}s`,
      memory: {
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`
      },
      metrics: this.metrics,
      browser: {
        initialized: !!this.browser
      },
      perplexity: {
        configured: !!this.config.perplexityApiKey,
        modelsAvailable: Object.keys(this.models).length
      },
      evidenceStored: this.evidenceStore.size
    };
  }

  /**
   * Cleanup resources
   */
  async shutdown() {
    console.log('🧹 Shutting down...');
    
    if (this.browser) {
      await this.browser.close();
      console.log('✅ Browser closed');
    }
    
    console.log('✅ Shutdown complete');
  }
}

// CLI interface
if (require.main === module) {
  const system = new EnhancedBrowserResearchStandalone();
  
  const command = process.argv[2] || 'help';
  const topic = process.argv[3];

  async function runCommand() {
    try {
      switch (command) {
        case 'research':
          if (!topic) {
            console.log('Usage: node enhanced-browser-research-standalone.js research "topic"');
            return;
          }
          const results = await system.conductComprehensiveResearch(topic);
          console.log('\n📊 Results:');
          console.log(`Topic: ${results.topic}`);
          console.log(`Duration: ${results.duration}ms`);
          console.log(`Confidence: ${(results.confidenceScore * 100).toFixed(1)}%`);
          if (results.browserVerification) {
            console.log(`Sources verified: ${results.browserVerification.verifiedSources}/${results.browserVerification.totalSources}`);
          }
          break;

        case 'analyze':
          const repoPath = topic || '.';
          const analysis = await system.analyzeRepository(repoPath);
          console.log('\n📊 Repository Analysis:');
          console.log(`Total files: ${analysis.structure.totalFiles}`);
          console.log(`Code files: ${analysis.codeQuality.totalCodeFiles}`);
          console.log(`Recommendations: ${analysis.recommendations.length}`);
          break;

        case 'tasks':
          const taskAnalysis = await system.analyzeRepository('.');
          const tasks = await system.generateTasks(taskAnalysis, 'all');
          console.log('\n📋 Generated Tasks:');
          console.log(`Total: ${tasks.totalGenerated}`);
          tasks.tasks.forEach((task, i) => {
            console.log(`${i + 1}. ${task.title} (${task.priority})`);
            console.log(`   ${task.description}`);
          });
          break;

        case 'validate':
          const validationResults = await system.runValidationTests();
          process.exit(validationResults.failed > 0 ? 1 : 0);
          break;

        case 'health':
          console.log('🏥 System Health:');
          console.log(JSON.stringify(system.getHealthStatus(), null, 2));
          break;

        default:
          console.log(`
📖 Enhanced Browser Research System (Standalone)

Usage: node enhanced-browser-research-standalone.js [command] [options]

Commands:
  research "topic"   - Conduct comprehensive research on a topic
  analyze [path]     - Analyze repository structure and quality
  tasks              - Generate development tasks from analysis
  validate           - Run comprehensive validation tests
  health             - Show system health and metrics

Environment Variables:
  PERPLEXITY_API_KEY - Perplexity API key for research capabilities

Examples:
  node enhanced-browser-research-standalone.js research "Node.js best practices"
  node enhanced-browser-research-standalone.js analyze ./src
  node enhanced-browser-research-standalone.js validate
`);
      }
    } catch (error) {
      console.error('❌ Command failed:', error.message);
      process.exit(1);
    } finally {
      await system.shutdown();
    }
  }

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n⏹️  Shutting down gracefully...');
    await system.shutdown();
    process.exit(0);
  });

  runCommand();
}

module.exports = EnhancedBrowserResearchStandalone;
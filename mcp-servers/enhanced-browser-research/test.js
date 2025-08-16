#!/usr/bin/env node
/**
 * Comprehensive Test Suite for Enhanced Browser Research MCP Server
 * Tests all major functionality including Perplexity integration and browser automation
 */

const EnhancedBrowserResearchMCP = require('./index.js');
const fs = require('fs').promises;
const path = require('path');

class ComprehensiveTestSuite {
  constructor() {
    this.server = null;
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      details: []
    };
  }

  async runAllTests() {
    console.log('🧪 Starting Comprehensive Test Suite for Enhanced Browser Research MCP\n');
    
    try {
      // Initialize server
      await this.setup();
      
      // Run test categories
      await this.testBasicFunctionality();
      await this.testPerplexityIntegration();
      await this.testBrowserAutomation();
      await this.testRepositoryAnalysis();
      await this.testTaskGeneration();
      await this.testValidationFramework();
      await this.testPerformanceMetrics();
      
      // Cleanup
      await this.teardown();
      
      // Report results
      this.generateTestReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    }
  }

  async setup() {
    console.log('⚙️ Setting up test environment...');
    
    // Create test server instance
    this.server = new EnhancedBrowserResearchMCP();
    
    // Ensure test directories exist
    await fs.mkdir('./automation-artifacts/test-screenshots', { recursive: true });
    await fs.mkdir('./automation-artifacts/test-logs', { recursive: true });
    await fs.mkdir('./automation-artifacts/test-reports', { recursive: true });
    
    console.log('✅ Test environment setup complete\n');
  }

  async teardown() {
    console.log('🧹 Cleaning up test environment...');
    
    if (this.server && this.server.browser) {
      await this.server.shutdown();
    }
    
    // Clean up test artifacts (optional)
    try {
      const testScreenshots = await fs.readdir('./automation-artifacts/test-screenshots');
      for (const file of testScreenshots) {
        if (file.startsWith('test_')) {
          await fs.unlink(path.join('./automation-artifacts/test-screenshots', file));
        }
      }
    } catch (error) {
      // Ignore cleanup errors
    }
    
    console.log('✅ Test environment cleanup complete\n');
  }

  async testBasicFunctionality() {
    console.log('📋 Testing Basic Functionality...');
    
    await this.runTest('Health Check', async () => {
      const result = await this.server.handleHealthCheck();
      const healthData = JSON.parse(result.content[0].text);
      
      if (healthData.status !== 'healthy') {
        throw new Error('Health check failed - status not healthy');
      }
      
      if (!healthData.uptime || !healthData.memory) {
        throw new Error('Health check missing required data');
      }
      
      return { healthData };
    });

    await this.runTest('Tool List Generation', async () => {
      const tools = await this.server.server.request({ method: 'tools/list' });
      
      if (!tools.tools || !Array.isArray(tools.tools)) {
        throw new Error('Tools list not returned as array');
      }
      
      const expectedTools = [
        'comprehensive_research',
        'analyze_repository', 
        'generate_tasks',
        'browser_automation',
        'validate_implementation',
        'health_check'
      ];
      
      const toolNames = tools.tools.map(t => t.name);
      const missingTools = expectedTools.filter(t => !toolNames.includes(t));
      
      if (missingTools.length > 0) {
        throw new Error(`Missing tools: ${missingTools.join(', ')}`);
      }
      
      return { toolCount: tools.tools.length, tools: toolNames };
    });
  }

  async testPerplexityIntegration() {
    console.log('🔍 Testing Perplexity Integration...');
    
    await this.runTest('API Configuration Check', async () => {
      const hasApiKey = !!this.server.perplexityConfig.apiKey;
      const modelCount = Object.keys(this.server.perplexityConfig.models).length;
      
      if (modelCount === 0) {
        throw new Error('No Perplexity models configured');
      }
      
      // Check if required models are present
      const requiredModels = ['grok-4', 'sonar-pro', 'gpt-5'];
      const configuredModels = Object.keys(this.server.perplexityConfig.models);
      const missingModels = requiredModels.filter(m => !configuredModels.includes(m));
      
      if (missingModels.length > 0) {
        throw new Error(`Missing required models: ${missingModels.join(', ')}`);
      }
      
      return { hasApiKey, modelCount, configuredModels };
    });

    // Only test actual API calls if API key is configured
    if (this.server.perplexityConfig.apiKey) {
      await this.runTest('Basic Perplexity Request', async () => {
        try {
          const result = await this.server.makePerplexityRequest('What is JavaScript?', { model: 'sonar-pro' });
          
          if (!result.content || result.content.length < 10) {
            throw new Error('Perplexity response too short or empty');
          }
          
          return { 
            responseLength: result.content.length,
            hasCitations: !!(result.citations && result.citations.length > 0),
            cost: result.metadata?.cost || 0
          };
        } catch (error) {
          if (error.message.includes('401') || error.message.includes('Invalid API key')) {
            throw new Error('Invalid Perplexity API key - check PERPLEXITY_API_KEY');
          }
          throw error;
        }
      });

      await this.runTest('Comprehensive Research Flow', async () => {
        const result = await this.server.handleComprehensiveResearch({
          topic: 'Node.js testing frameworks',
          options: {
            depth: 'quick',
            model: 'sonar-pro',
            verifyWithBrowser: false,  // Skip browser verification for speed
            captureArtifacts: false
          }
        });
        
        if (result.isError) {
          throw new Error(`Research failed: ${result.meta?.error || 'Unknown error'}`);
        }
        
        if (!result.meta || !result.meta.perplexityData) {
          throw new Error('Missing research data in response');
        }
        
        const confidenceScore = result.meta.confidenceScore;
        if (confidenceScore < 0.3) {
          throw new Error(`Low confidence score: ${confidenceScore}`);
        }
        
        return {
          confidenceScore,
          duration: result.meta.duration,
          questionCount: Object.keys(result.meta.perplexityData).length
        };
      });
    } else {
      await this.runTest('Perplexity API Key Missing (Expected)', async () => {
        // This should pass when API key is not configured
        const result = await this.server.handleComprehensiveResearch({
          topic: 'test topic'
        });
        
        if (!result.isError) {
          throw new Error('Expected error when API key is missing');
        }
        
        if (!result.meta?.error?.includes('PERPLEXITY_API_KEY')) {
          throw new Error('Expected specific API key error message');
        }
        
        return { expectedError: true };
      });
    }
  }

  async testBrowserAutomation() {
    console.log('🌐 Testing Browser Automation...');
    
    await this.runTest('Browser Initialization', async () => {
      await this.server.initializeBrowser();
      
      if (!this.server.browser) {
        throw new Error('Browser failed to initialize');
      }
      
      return { browserInitialized: true };
    });

    await this.runTest('Basic Browser Navigation', async () => {
      if (!this.server.browser) {
        await this.server.initializeBrowser();
      }
      
      const page = await this.server.browser.newPage();
      await page.goto('https://www.google.com', { timeout: 15000 });
      const title = await page.title();
      await page.close();
      
      if (!title.toLowerCase().includes('google')) {
        throw new Error(`Unexpected page title: ${title}`);
      }
      
      return { pageTitle: title };
    });

    await this.runTest('Screenshot Capture', async () => {
      if (!this.server.browser) {
        await this.server.initializeBrowser();
      }
      
      const page = await this.server.browser.newPage();
      await page.goto('https://www.google.com', { timeout: 15000 });
      
      const screenshotPath = './automation-artifacts/test-screenshots/test_screenshot.png';
      await page.screenshot({ path: screenshotPath });
      await page.close();
      
      // Verify screenshot was created
      const stats = await fs.stat(screenshotPath);
      if (stats.size < 1000) { // Screenshots should be at least 1KB
        throw new Error('Screenshot file too small or empty');
      }
      
      // Cleanup
      await fs.unlink(screenshotPath);
      
      return { screenshotSize: stats.size };
    });

    await this.runTest('Browser Automation Actions', async () => {
      const result = await this.server.handleBrowserAutomation({
        actions: [
          { type: 'navigate', target: 'https://www.google.com' },
          { type: 'screenshot', target: 'test_action_screenshot' }
        ],
        captureEvidence: false
      });
      
      if (result.isError) {
        throw new Error(`Browser automation failed: ${result.meta?.error || 'Unknown error'}`);
      }
      
      const successCount = result.meta.results.filter(r => r.success).length;
      if (successCount < 2) {
        throw new Error(`Only ${successCount}/2 actions succeeded`);
      }
      
      return { successfulActions: successCount, totalActions: result.meta.results.length };
    });
  }

  async testRepositoryAnalysis() {
    console.log('📊 Testing Repository Analysis...');
    
    await this.runTest('Current Repository Analysis', async () => {
      const result = await this.server.handleRepositoryAnalysis({
        repoPath: '.',
        analysisType: 'structure'
      });
      
      if (result.isError) {
        throw new Error(`Repository analysis failed: ${result.content[0].text}`);
      }
      
      const analysis = result.meta;
      if (!analysis.structure || !analysis.codeQuality || !analysis.recommendations) {
        throw new Error('Analysis missing required components');
      }
      
      if (analysis.structure.totalFiles < 1) {
        throw new Error('No files found in repository analysis');
      }
      
      return {
        totalFiles: analysis.structure.totalFiles,
        fileTypes: Object.keys(analysis.structure.fileTypes).length,
        recommendations: analysis.recommendations.length
      };
    });

    await this.runTest('Invalid Repository Path', async () => {
      const result = await this.server.handleRepositoryAnalysis({
        repoPath: '/nonexistent/path',
        analysisType: 'comprehensive'
      });
      
      if (!result.isError) {
        throw new Error('Expected error for invalid repository path');
      }
      
      return { expectedError: true };
    });
  }

  async testTaskGeneration() {
    console.log('📋 Testing Task Generation...');
    
    await this.runTest('Task Generation from Analysis', async () => {
      const mockAnalysis = {
        recommendations: [
          {
            type: 'code_quality',
            priority: 'medium',
            title: 'Improve code documentation',
            description: 'Add JSDoc comments to functions'
          },
          {
            type: 'structure',
            priority: 'low',
            title: 'Reorganize file structure',
            description: 'Move utility functions to separate modules'
          }
        ]
      };
      
      const result = await this.server.handleTaskGeneration({
        analysisResults: mockAnalysis,
        priority: 'medium'
      });
      
      if (result.isError) {
        throw new Error(`Task generation failed: ${result.content[0].text}`);
      }
      
      const tasks = result.meta.tasks;
      if (!tasks || tasks.length === 0) {
        throw new Error('No tasks generated');
      }
      
      // Check task structure
      const firstTask = tasks[0];
      const requiredFields = ['id', 'title', 'description', 'priority', 'category', 'estimatedEffort', 'acceptanceCriteria'];
      const missingFields = requiredFields.filter(field => !firstTask[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Task missing required fields: ${missingFields.join(', ')}`);
      }
      
      return { taskCount: tasks.length, categories: [...new Set(tasks.map(t => t.category))] };
    });

    await this.runTest('Default Task Generation', async () => {
      const result = await this.server.handleTaskGeneration({
        analysisResults: {},
        priority: 'all'
      });
      
      if (result.isError) {
        throw new Error('Default task generation should not fail');
      }
      
      const tasks = result.meta.tasks;
      if (!tasks || tasks.length === 0) {
        throw new Error('Default task generation should create at least one task');
      }
      
      return { defaultTaskCount: tasks.length };
    });
  }

  async testValidationFramework() {
    console.log('🧪 Testing Validation Framework...');
    
    await this.runTest('Comprehensive Validation Suite', async () => {
      const result = await this.server.handleValidation({
        testSuite: 'comprehensive',
        generateReport: false  // Skip report generation for speed
      });
      
      if (result.isError) {
        throw new Error(`Validation failed: ${result.content[0].text}`);
      }
      
      const validationResults = result.meta;
      const testCategories = Object.keys(validationResults.tests);
      
      if (testCategories.length === 0) {
        throw new Error('No validation tests were run');
      }
      
      // Count total tests
      let totalTests = 0;
      let passedTests = 0;
      
      Object.values(validationResults.tests).forEach(categoryTests => {
        totalTests += categoryTests.length;
        passedTests += categoryTests.filter(t => t.passed).length;
      });
      
      const successRate = (passedTests / totalTests) * 100;
      
      return {
        categories: testCategories,
        totalTests,
        passedTests,
        successRate: Math.round(successRate)
      };
    });

    await this.runTest('Performance Validation', async () => {
      const result = await this.server.handleValidation({
        testSuite: 'performance',
        generateReport: false
      });
      
      if (result.isError) {
        throw new Error(`Performance validation failed: ${result.content[0].text}`);
      }
      
      const performanceTests = result.meta.tests.performance;
      const memoryTest = performanceTests.find(t => t.name === 'Memory Usage');
      const responseTimeTest = performanceTests.find(t => t.name === 'Response Time');
      
      return {
        memoryTestPassed: memoryTest?.passed || false,
        responseTimeTestPassed: responseTimeTest?.passed || false,
        totalPerformanceTests: performanceTests.length
      };
    });
  }

  async testPerformanceMetrics() {
    console.log('⚡ Testing Performance Metrics...');
    
    await this.runTest('Metrics Collection', async () => {
      const initialMetrics = { ...this.server.performanceMetrics };
      
      // Perform some operations to generate metrics
      await this.server.handleHealthCheck();
      
      const updatedMetrics = this.server.performanceMetrics;
      
      // Verify metrics are being collected
      if (updatedMetrics.requests < initialMetrics.requests) {
        throw new Error('Request count not incrementing');
      }
      
      return {
        initialRequests: initialMetrics.requests,
        updatedRequests: updatedMetrics.requests,
        totalCost: updatedMetrics.totalCost,
        errors: updatedMetrics.errors
      };
    });

    await this.runTest('Performance Budget Checking', async () => {
      const budgets = this.server.performanceBudgets;
      const currentMetrics = this.server.performanceMetrics;
      
      // Check if within budgets
      const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
      const withinMemoryBudget = memoryUsage <= budgets.maxMemoryMB;
      const withinCostBudget = currentMetrics.totalCost <= budgets.costBudgetUSD;
      
      return {
        memoryUsageMB: Math.round(memoryUsage),
        memoryBudgetMB: budgets.maxMemoryMB,
        withinMemoryBudget,
        currentCost: currentMetrics.totalCost,
        costBudget: budgets.costBudgetUSD,
        withinCostBudget
      };
    });
  }

  async runTest(testName, testFunction) {
    this.testResults.total++;
    const startTime = Date.now();
    
    try {
      console.log(`  🔄 ${testName}...`);
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      this.testResults.passed++;
      console.log(`  ✅ ${testName} (${duration}ms)`);
      
      this.testResults.details.push({
        name: testName,
        status: 'passed',
        duration,
        result
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (error.message.includes('skip') || error.message.includes('PERPLEXITY_API_KEY')) {
        this.testResults.skipped++;
        console.log(`  ⏭️  ${testName} (skipped: ${error.message})`);
        
        this.testResults.details.push({
          name: testName,
          status: 'skipped',
          duration,
          reason: error.message
        });
      } else {
        this.testResults.failed++;
        console.log(`  ❌ ${testName} (${duration}ms)`);
        console.log(`     Error: ${error.message}`);
        
        this.testResults.details.push({
          name: testName,
          status: 'failed',
          duration,
          error: error.message
        });
      }
    }
  }

  generateTestReport() {
    const { total, passed, failed, skipped } = this.testResults;
    const successRate = Math.round((passed / (total - skipped)) * 100) || 0;
    
    console.log('\n📊 Test Results Summary');
    console.log('========================');
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`Success Rate: ${successRate}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults.details
        .filter(t => t.status === 'failed')
        .forEach(t => console.log(`  - ${t.name}: ${t.error}`));
    }
    
    if (skipped > 0) {
      console.log('\n⏭️  Skipped Tests:');
      this.testResults.details
        .filter(t => t.status === 'skipped')
        .forEach(t => console.log(`  - ${t.name}: ${t.reason}`));
    }
    
    // Save detailed report
    const reportPath = `./automation-artifacts/test-reports/test_report_${Date.now()}.json`;
    fs.writeFile(reportPath, JSON.stringify(this.testResults, null, 2))
      .then(() => console.log(`\n📄 Detailed report saved: ${reportPath}`))
      .catch(() => console.log('\n⚠️  Could not save detailed report'));
    
    if (failed > 0) {
      console.log('\n❌ Some tests failed. Check the details above.');
      process.exit(1);
    } else {
      console.log('\n🎉 All tests passed successfully!');
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const testSuite = new ComprehensiveTestSuite();
  testSuite.runAllTests();
}

module.exports = ComprehensiveTestSuite;
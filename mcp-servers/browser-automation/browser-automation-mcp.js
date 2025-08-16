#!/usr/bin/env node

/**
 * Advanced Browser Automation MCP Server
 * 
 * Features:
 * - Comprehensive browser automation with error handling
 * - Performance monitoring and optimization
 * - Screenshot and artifact capture
 * - Integration with GitHub and file system MCP servers
 * - Automated testing and validation
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class BrowserAutomationMCP {
  constructor() {
    this.server = new Server(
      {
        name: 'browser-automation',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.browser = null;
    this.page = null;
    this.retryLimit = 3;
    this.timeout = 30000;
    this.screenshotPath = './automation-artifacts/screenshots';
    this.logPath = './automation-artifacts/logs';
    this.performanceMetrics = {
      totalTasks: 0,
      successfulTasks: 0,
      failedTasks: 0,
      avgExecutionTime: 0,
      totalExecutionTime: 0
    };

    this.setupHandlers();
  }

  setupHandlers() {
    // Initialize browser and setup
    this.server.setRequestHandler('tools/list', async () => ({
      tools: [
        {
          name: 'navigate_to_url',
          description: 'Navigate to a specific URL with error handling and performance monitoring',
          inputSchema: {
            type: 'object',
            properties: {
              url: { type: 'string', description: 'URL to navigate to' },
              waitFor: { type: 'string', description: 'CSS selector to wait for' },
              timeout: { type: 'number', description: 'Timeout in milliseconds' }
            },
            required: ['url']
          }
        },
        {
          name: 'extract_data',
          description: 'Extract data from page using CSS selectors',
          inputSchema: {
            type: 'object',
            properties: {
              selectors: { type: 'object', description: 'Object with key-value pairs of data names and CSS selectors' },
              screenshot: { type: 'boolean', description: 'Take screenshot after extraction' }
            },
            required: ['selectors']
          }
        },
        {
          name: 'interact_with_elements',
          description: 'Interact with page elements (click, type, scroll)',
          inputSchema: {
            type: 'object',
            properties: {
              actions: { 
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', enum: ['click', 'type', 'scroll', 'wait'] },
                    selector: { type: 'string' },
                    value: { type: 'string' },
                    timeout: { type: 'number' }
                  }
                }
              },
              captureScreenshots: { type: 'boolean', description: 'Capture screenshots for each action' }
            },
            required: ['actions']
          }
        },
        {
          name: 'run_performance_audit',
          description: 'Run comprehensive performance audit on current page',
          inputSchema: {
            type: 'object',
            properties: {
              metrics: { type: 'array', items: { type: 'string' }, description: 'Specific metrics to collect' }
            }
          }
        },
        {
          name: 'automated_testing',
          description: 'Run automated testing scenarios',
          inputSchema: {
            type: 'object',
            properties: {
              testSuite: { type: 'string', description: 'Name of test suite to run' },
              scenarios: { type: 'array', items: { type: 'object' } }
            },
            required: ['testSuite']
          }
        },
        {
          name: 'capture_artifacts',
          description: 'Capture debugging artifacts (screenshots, logs, network data)',
          inputSchema: {
            type: 'object',
            properties: {
              artifactTypes: { type: 'array', items: { type: 'string' } },
              taskId: { type: 'string' }
            }
          }
        },
        {
          name: 'generate_automation_report',
          description: 'Generate comprehensive automation performance report',
          inputSchema: {
            type: 'object',
            properties: {
              timeRange: { type: 'string', description: 'Time range for report (24h, 7d, 30d)' },
              includeArtifacts: { type: 'boolean' }
            }
          }
        }
      ]
    }));

    // Navigate to URL with comprehensive error handling
    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'navigate_to_url':
            return await this.navigateToUrl(args);
          case 'extract_data':
            return await this.extractData(args);
          case 'interact_with_elements':
            return await this.interactWithElements(args);
          case 'run_performance_audit':
            return await this.runPerformanceAudit(args);
          case 'automated_testing':
            return await this.runAutomatedTesting(args);
          case 'capture_artifacts':
            return await this.captureArtifacts(args);
          case 'generate_automation_report':
            return await this.generateAutomationReport(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        console.error(`Error executing ${name}:`, error);
        await this.captureErrorArtifacts(error, name, args);
        throw error;
      }
    });
  }

  async initializeBrowser() {
    if (!this.browser) {
      console.log('Initializing browser...');
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });
      
      this.page = await this.browser.newPage();
      await this.page.setViewport({ width: 1920, height: 1080 });
      
      // Enable request interception for performance monitoring
      await this.page.setRequestInterception(true);
      this.page.on('request', (request) => {
        request.continue();
      });

      // Setup console and error logging
      this.page.on('console', (msg) => this.logConsoleMessage(msg));
      this.page.on('pageerror', (error) => this.logPageError(error));
      
      await this.ensureArtifactDirectories();
    }
  }

  async navigateToUrl(args) {
    const { url, waitFor, timeout = this.timeout } = args;
    const taskId = this.generateTaskId();
    const startTime = Date.now();

    await this.initializeBrowser();

    try {
      console.log(`Navigating to: ${url}`);
      
      const response = await this.executeWithRetry(async () => {
        return await this.page.goto(url, { 
          waitUntil: 'networkidle2',
          timeout: timeout
        });
      }, taskId);

      if (waitFor) {
        await this.page.waitForSelector(waitFor, { timeout: timeout });
      }

      const executionTime = Date.now() - startTime;
      this.updatePerformanceMetrics(executionTime, true);

      const result = {
        success: true,
        url: url,
        statusCode: response.status(),
        loadTime: executionTime,
        taskId: taskId,
        timestamp: new Date().toISOString()
      };

      await this.logTask(taskId, 'navigate_to_url', result);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.updatePerformanceMetrics(executionTime, false);
      throw error;
    }
  }

  async extractData(args) {
    const { selectors, screenshot = false } = args;
    const taskId = this.generateTaskId();
    
    await this.initializeBrowser();

    try {
      const extractedData = {};
      
      for (const [key, selector] of Object.entries(selectors)) {
        try {
          const elements = await this.page.$$(selector);
          
          if (elements.length === 1) {
            extractedData[key] = await this.page.$eval(selector, el => el.textContent?.trim());
          } else if (elements.length > 1) {
            extractedData[key] = await this.page.$$eval(selector, els => 
              els.map(el => el.textContent?.trim())
            );
          } else {
            extractedData[key] = null;
          }
        } catch (error) {
          extractedData[key] = { error: error.message };
        }
      }

      if (screenshot) {
        const screenshotPath = await this.captureScreenshot(taskId);
        extractedData._screenshot = screenshotPath;
      }

      const result = {
        success: true,
        data: extractedData,
        taskId: taskId,
        timestamp: new Date().toISOString()
      };

      await this.logTask(taskId, 'extract_data', result);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };

    } catch (error) {
      await this.captureErrorArtifacts(error, 'extract_data', { selectors, taskId });
      throw error;
    }
  }

  async interactWithElements(args) {
    const { actions, captureScreenshots = false } = args;
    const taskId = this.generateTaskId();
    
    await this.initializeBrowser();

    try {
      const results = [];
      
      for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        const actionStartTime = Date.now();
        
        try {
          await this.executeAction(action);
          
          const actionResult = {
            action: action,
            success: true,
            executionTime: Date.now() - actionStartTime
          };

          if (captureScreenshots) {
            const screenshotPath = await this.captureScreenshot(`${taskId}_action_${i}`);
            actionResult.screenshot = screenshotPath;
          }

          results.push(actionResult);
          
        } catch (error) {
          const actionResult = {
            action: action,
            success: false,
            error: error.message,
            executionTime: Date.now() - actionStartTime
          };

          if (captureScreenshots) {
            const screenshotPath = await this.captureScreenshot(`${taskId}_error_${i}`);
            actionResult.screenshot = screenshotPath;
          }

          results.push(actionResult);
          
          // Continue with remaining actions even if one fails
        }
      }

      const result = {
        success: true,
        actions: results,
        taskId: taskId,
        timestamp: new Date().toISOString()
      };

      await this.logTask(taskId, 'interact_with_elements', result);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };

    } catch (error) {
      await this.captureErrorArtifacts(error, 'interact_with_elements', { actions, taskId });
      throw error;
    }
  }

  async executeAction(action) {
    const { type, selector, value, timeout = 5000 } = action;

    switch (type) {
      case 'click':
        await this.page.waitForSelector(selector, { timeout });
        await this.page.click(selector);
        break;
        
      case 'type':
        await this.page.waitForSelector(selector, { timeout });
        await this.page.type(selector, value);
        break;
        
      case 'scroll':
        if (selector) {
          await this.page.waitForSelector(selector, { timeout });
          await this.page.$eval(selector, el => el.scrollIntoView());
        } else {
          await this.page.evaluate((scrollValue) => {
            window.scrollBy(0, scrollValue || 500);
          }, value ? parseInt(value) : undefined);
        }
        break;
        
      case 'wait':
        const waitTime = value ? parseInt(value) : timeout;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        break;
        
      default:
        throw new Error(`Unknown action type: ${type}`);
    }
  }

  async runPerformanceAudit(args) {
    const { metrics = ['performance', 'accessibility', 'bestPractices'] } = args;
    const taskId = this.generateTaskId();
    
    await this.initializeBrowser();

    try {
      // Capture performance metrics
      const performanceMetrics = await this.page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
          largestContentfulPaint: performance.getEntriesByName('largest-contentful-paint')[0]?.startTime || 0
        };
      });

      // Capture resource timing
      const resourceTiming = await this.page.evaluate(() => {
        return performance.getEntriesByType('resource').map(resource => ({
          name: resource.name,
          duration: resource.duration,
          transferSize: resource.transferSize,
          type: resource.initiatorType
        }));
      });

      const result = {
        success: true,
        performanceMetrics,
        resourceTiming,
        taskId: taskId,
        timestamp: new Date().toISOString()
      };

      await this.logTask(taskId, 'performance_audit', result);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };

    } catch (error) {
      await this.captureErrorArtifacts(error, 'performance_audit', { metrics, taskId });
      throw error;
    }
  }

  async runAutomatedTesting(args) {
    const { testSuite, scenarios } = args;
    const taskId = this.generateTaskId();
    
    try {
      const testResults = [];
      
      for (const scenario of scenarios || []) {
        const scenarioResult = await this.executeTestScenario(scenario);
        testResults.push(scenarioResult);
      }

      const result = {
        success: true,
        testSuite: testSuite,
        results: testResults,
        summary: this.generateTestSummary(testResults),
        taskId: taskId,
        timestamp: new Date().toISOString()
      };

      await this.logTask(taskId, 'automated_testing', result);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };

    } catch (error) {
      await this.captureErrorArtifacts(error, 'automated_testing', { testSuite, scenarios, taskId });
      throw error;
    }
  }

  async executeTestScenario(scenario) {
    const { name, steps, assertions } = scenario;
    const scenarioStartTime = Date.now();
    
    try {
      // Execute test steps
      for (const step of steps || []) {
        await this.executeAction(step);
      }

      // Validate assertions
      const assertionResults = [];
      for (const assertion of assertions || []) {
        const assertionResult = await this.validateAssertion(assertion);
        assertionResults.push(assertionResult);
      }

      return {
        name: name,
        success: assertionResults.every(r => r.passed),
        executionTime: Date.now() - scenarioStartTime,
        assertions: assertionResults
      };

    } catch (error) {
      return {
        name: name,
        success: false,
        error: error.message,
        executionTime: Date.now() - scenarioStartTime
      };
    }
  }

  async validateAssertion(assertion) {
    const { type, selector, expected, operator = 'equals' } = assertion;
    
    try {
      let actual;
      
      switch (type) {
        case 'text':
          actual = await this.page.$eval(selector, el => el.textContent?.trim());
          break;
        case 'attribute':
          actual = await this.page.$eval(selector, (el, attr) => el.getAttribute(attr), assertion.attribute);
          break;
        case 'exists':
          actual = (await this.page.$(selector)) !== null;
          break;
        default:
          throw new Error(`Unknown assertion type: ${type}`);
      }

      const passed = this.evaluateAssertion(actual, expected, operator);
      
      return {
        type: type,
        selector: selector,
        expected: expected,
        actual: actual,
        operator: operator,
        passed: passed
      };

    } catch (error) {
      return {
        type: type,
        selector: selector,
        expected: expected,
        passed: false,
        error: error.message
      };
    }
  }

  evaluateAssertion(actual, expected, operator) {
    switch (operator) {
      case 'equals':
        return actual === expected;
      case 'contains':
        return actual?.includes(expected);
      case 'exists':
        return actual !== null && actual !== undefined;
      case 'greater_than':
        return actual > expected;
      case 'less_than':
        return actual < expected;
      default:
        return false;
    }
  }

  async captureArtifacts(args) {
    const { artifactTypes = ['screenshot', 'logs', 'performance'], taskId } = args;
    const artifacts = {};

    try {
      if (artifactTypes.includes('screenshot')) {
        artifacts.screenshot = await this.captureScreenshot(taskId || 'manual');
      }

      if (artifactTypes.includes('logs')) {
        artifacts.logs = await this.captureLogs(taskId || 'manual');
      }

      if (artifactTypes.includes('performance')) {
        artifacts.performance = await this.capturePerformanceData();
      }

      if (artifactTypes.includes('network')) {
        artifacts.network = await this.captureNetworkData();
      }

      const result = {
        success: true,
        artifacts: artifacts,
        timestamp: new Date().toISOString()
      };

      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };

    } catch (error) {
      throw new Error(`Failed to capture artifacts: ${error.message}`);
    }
  }

  async captureScreenshot(taskId) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `screenshot_${taskId}_${timestamp}.png`;
    const filepath = path.join(this.screenshotPath, filename);
    
    await this.page.screenshot({
      path: filepath,
      fullPage: true
    });
    
    return filepath;
  }

  async captureLogs(taskId) {
    // Implementation for capturing various logs
    return {
      console: this.consoleLogs || [],
      errors: this.pageErrors || [],
      timestamp: new Date().toISOString()
    };
  }

  async capturePerformanceData() {
    return await this.page.evaluate(() => {
      return {
        navigation: performance.getEntriesByType('navigation')[0],
        resources: performance.getEntriesByType('resource'),
        marks: performance.getEntriesByType('mark'),
        measures: performance.getEntriesByType('measure')
      };
    });
  }

  async generateAutomationReport(args) {
    const { timeRange = '24h', includeArtifacts = false } = args;
    
    try {
      const report = {
        timeRange: timeRange,
        generatedAt: new Date().toISOString(),
        summary: {
          totalTasks: this.performanceMetrics.totalTasks,
          successfulTasks: this.performanceMetrics.successfulTasks,
          failedTasks: this.performanceMetrics.failedTasks,
          successRate: this.performanceMetrics.totalTasks > 0 ? 
            (this.performanceMetrics.successfulTasks / this.performanceMetrics.totalTasks) * 100 : 0,
          avgExecutionTime: this.performanceMetrics.avgExecutionTime
        },
        recommendations: this.generateOptimizationRecommendations()
      };

      if (includeArtifacts) {
        report.artifacts = await this.getRecentArtifacts(timeRange);
      }

      return { content: [{ type: 'text', text: JSON.stringify(report, null, 2) }] };

    } catch (error) {
      throw new Error(`Failed to generate automation report: ${error.message}`);
    }
  }

  generateOptimizationRecommendations() {
    const recommendations = [];
    
    if (this.performanceMetrics.avgExecutionTime > 5000) {
      recommendations.push({
        type: 'performance',
        issue: 'High average execution time',
        suggestion: 'Consider optimizing selectors and reducing wait times',
        priority: 'high'
      });
    }

    if (this.performanceMetrics.totalTasks > 0) {
      const errorRate = this.performanceMetrics.failedTasks / this.performanceMetrics.totalTasks;
      if (errorRate > 0.1) {
        recommendations.push({
          type: 'reliability',
          issue: 'High error rate',
          suggestion: 'Review error patterns and improve error handling',
          priority: 'high'
        });
      }
    }

    return recommendations;
  }

  async executeWithRetry(operation, taskId) {
    for (let attempt = 1; attempt <= this.retryLimit; attempt++) {
      try {
        return await operation();
      } catch (error) {
        console.log(`Attempt ${attempt} failed for task ${taskId}: ${error.message}`);
        
        if (attempt === this.retryLimit) {
          throw error;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  updatePerformanceMetrics(executionTime, success) {
    this.performanceMetrics.totalTasks++;
    this.performanceMetrics.totalExecutionTime += executionTime;
    
    if (success) {
      this.performanceMetrics.successfulTasks++;
    } else {
      this.performanceMetrics.failedTasks++;
    }
    
    this.performanceMetrics.avgExecutionTime = 
      this.performanceMetrics.totalExecutionTime / this.performanceMetrics.totalTasks;
  }

  async ensureArtifactDirectories() {
    await fs.mkdir(this.screenshotPath, { recursive: true });
    await fs.mkdir(this.logPath, { recursive: true });
  }

  async logTask(taskId, operation, result) {
    const logEntry = {
      taskId: taskId,
      operation: operation,
      result: result,
      timestamp: new Date().toISOString()
    };
    
    const logFile = path.join(this.logPath, `${taskId}.json`);
    await fs.writeFile(logFile, JSON.stringify(logEntry, null, 2));
  }

  async captureErrorArtifacts(error, operation, args) {
    const errorId = this.generateTaskId();
    
    try {
      const errorArtifacts = {
        error: error.message,
        stack: error.stack,
        operation: operation,
        args: args,
        timestamp: new Date().toISOString()
      };

      if (this.page) {
        errorArtifacts.screenshot = await this.captureScreenshot(`error_${errorId}`);
        errorArtifacts.url = await this.page.url();
      }

      const errorFile = path.join(this.logPath, `error_${errorId}.json`);
      await fs.writeFile(errorFile, JSON.stringify(errorArtifacts, null, 2));
      
    } catch (captureError) {
      console.error('Failed to capture error artifacts:', captureError);
    }
  }

  logConsoleMessage(msg) {
    if (!this.consoleLogs) this.consoleLogs = [];
    this.consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    });
  }

  logPageError(error) {
    if (!this.pageErrors) this.pageErrors = [];
    this.pageErrors.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }

  generateTaskId() {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateTestSummary(testResults) {
    const total = testResults.length;
    const passed = testResults.filter(r => r.success).length;
    const failed = total - passed;
    
    return {
      total: total,
      passed: passed,
      failed: failed,
      successRate: total > 0 ? (passed / total) * 100 : 0
    };
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Browser Automation MCP Server started');
  }
}

// Start the server
if (require.main === module) {
  const server = new BrowserAutomationMCP();
  
  process.on('SIGINT', async () => {
    await server.cleanup();
    process.exit(0);
  });
  
  server.start().catch(console.error);
}

module.exports = BrowserAutomationMCP;
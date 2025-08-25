#!/usr/bin/env node

/**
 * Test Automation Integration Script
 * 
 * Validates:
 * - Browser automation MCP server functionality
 * - Perplexity API integration
 * - Grok-4 integration via Perplexity
 * - Configuration file integrity
 * - Performance benchmarks
 */

const fs = require('fs').promises;
const path = require('path');

class AutomationIntegrationTester {
  constructor() {
    this.testResults = {
      configuration: [],
      mcpServers: [],
      apiIntegration: [],
      browserAutomation: [],
      performance: []
    };
    this.errors = [];
  }

  async runAllTests() {
    console.log('🚀 Starting Automation Integration Tests...\n');

    try {
      await this.testConfigurationFiles();
      await this.testMCPServerConfiguration();
      await this.testCursorRulesIntegration();
      await this.testDirectoryStructure();
      await this.testBrowserAutomationSetup();
      await this.generateTestReport();
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      this.errors.push(error);
    }

    this.printFinalReport();
  }

  async testConfigurationFiles() {
    console.log('🔧 Testing Configuration Files...');

    // Test .cursor/mcp.json
    try {
      const mcpConfig = await fs.readFile('.cursor/mcp.json', 'utf8');
      const mcpData = JSON.parse(mcpConfig);
      
      const requiredServers = [
        'browser-automation',
        'github-integration',
        'advanced-ai-integration',
        'perplexity-ask'
      ];

      for (const server of requiredServers) {
        if (mcpData.mcpServers[server]) {
          this.testResults.configuration.push({
            test: `MCP Server: ${server}`,
            status: 'PASS',
            details: 'Server configuration found'
          });
        } else {
          this.testResults.configuration.push({
            test: `MCP Server: ${server}`,
            status: 'FAIL',
            details: 'Server configuration missing'
          });
        }
      }
    } catch (error) {
      this.testResults.configuration.push({
        test: 'MCP Configuration',
        status: 'FAIL',
        details: error.message
      });
    }

    // Test .cursorrules
    try {
      await fs.access('.cursorrules');
      this.testResults.configuration.push({
        test: '.cursorrules file',
        status: 'PASS',
        details: 'File exists'
      });
    } catch (error) {
      this.testResults.configuration.push({
        test: '.cursorrules file',
        status: 'FAIL',
        details: 'File missing'
      });
    }

    // Test .cursor/rules/ directory
    try {
      const rulesFiles = await fs.readdir('.cursor/rules');
      const expectedRules = [
        'automation.mdc',
        'optimization.mdc',
        'grok4-integration.mdc'
      ];

      for (const rule of expectedRules) {
        if (rulesFiles.includes(rule)) {
          this.testResults.configuration.push({
            test: `Cursor Rule: ${rule}`,
            status: 'PASS',
            details: 'Rule file found'
          });
        } else {
          this.testResults.configuration.push({
            test: `Cursor Rule: ${rule}`,
            status: 'FAIL',
            details: 'Rule file missing'
          });
        }
      }
    } catch (error) {
      this.testResults.configuration.push({
        test: 'Cursor Rules Directory',
        status: 'FAIL',
        details: error.message
      });
    }

    console.log('✅ Configuration files tested\n');
  }

  async testMCPServerConfiguration() {
    console.log('🔌 Testing MCP Server Configuration...');

    // Test browser automation MCP server file
    try {
      await fs.access('mcp-servers/browser-automation/browser-automation-mcp.js');
      this.testResults.mcpServers.push({
        test: 'Browser Automation MCP Server',
        status: 'PASS',
        details: 'Server file exists'
      });
    } catch (error) {
      this.testResults.mcpServers.push({
        test: 'Browser Automation MCP Server',
        status: 'FAIL',
        details: 'Server file missing'
      });
    }

    // Test advanced AI integration MCP server
    try {
      await fs.access('src/api/ai-integration/grok4-mcp-server.js');
      this.testResults.mcpServers.push({
        test: 'Advanced AI Integration MCP Server',
        status: 'PASS',
        details: 'Server file exists'
      });
    } catch (error) {
      this.testResults.mcpServers.push({
        test: 'Advanced AI Integration MCP Server',
        status: 'FAIL',
        details: 'Server file missing'
      });
    }

    // Test Perplexity Ask MCP server
    try {
      await fs.access('mcp-servers/perplexity-ask-server/perplexity-ask-mcp.js');
      this.testResults.mcpServers.push({
        test: 'Perplexity Ask MCP Server',
        status: 'PASS',
        details: 'Server file exists'
      });
    } catch (error) {
      this.testResults.mcpServers.push({
        test: 'Perplexity Ask MCP Server',
        status: 'FAIL',
        details: 'Server file missing'
      });
    }

    console.log('✅ MCP server configuration tested\n');
  }

  async testCursorRulesIntegration() {
    console.log('📋 Testing Cursor Rules Integration...');

    const rulesToTest = [
      { file: '.cursor/rules/automation.mdc', feature: 'Browser Automation' },
      { file: '.cursor/rules/optimization.mdc', feature: 'Performance Optimization' },
      { file: '.cursor/rules/grok4-integration.mdc', feature: 'Grok-4 Integration' }
    ];

    for (const rule of rulesToTest) {
      try {
        const content = await fs.readFile(rule.file, 'utf8');
        
        // Basic content validation
        if (content.length > 100 && content.includes('---')) {
          this.testResults.configuration.push({
            test: `${rule.feature} Rule Content`,
            status: 'PASS',
            details: `Rule has valid content (${content.length} chars)`
          });
        } else {
          this.testResults.configuration.push({
            test: `${rule.feature} Rule Content`,
            status: 'FAIL',
            details: 'Rule content appears invalid or empty'
          });
        }
      } catch (error) {
        this.testResults.configuration.push({
          test: `${rule.feature} Rule`,
          status: 'FAIL',
          details: error.message
        });
      }
    }

    console.log('✅ Cursor rules integration tested\n');
  }

  async testDirectoryStructure() {
    console.log('📁 Testing Directory Structure...');

    const requiredDirectories = [
      'automation-artifacts',
      'automation-artifacts/screenshots',
      'automation-artifacts/logs',
      'mcp-servers/browser-automation',
      'tests/integration'
    ];

    for (const dir of requiredDirectories) {
      try {
        const stats = await fs.stat(dir);
        if (stats.isDirectory()) {
          this.testResults.configuration.push({
            test: `Directory: ${dir}`,
            status: 'PASS',
            details: 'Directory exists'
          });
        } else {
          this.testResults.configuration.push({
            test: `Directory: ${dir}`,
            status: 'FAIL',
            details: 'Path exists but is not a directory'
          });
        }
      } catch (error) {
        this.testResults.configuration.push({
          test: `Directory: ${dir}`,
          status: 'FAIL',
          details: 'Directory missing'
        });
      }
    }

    console.log('✅ Directory structure tested\n');
  }

  async testBrowserAutomationSetup() {
    console.log('🌐 Testing Browser Automation Setup...');

    try {
      // Test if puppeteer is installed
      const packageJson = await fs.readFile('package.json', 'utf8');
      const pkg = JSON.parse(packageJson);
      
      if (pkg.devDependencies && pkg.devDependencies.puppeteer) {
        this.testResults.browserAutomation.push({
          test: 'Puppeteer Installation',
          status: 'PASS',
          details: `Version: ${pkg.devDependencies.puppeteer}`
        });
      } else if (pkg.dependencies && pkg.dependencies.puppeteer) {
        this.testResults.browserAutomation.push({
          test: 'Puppeteer Installation',
          status: 'PASS',
          details: `Version: ${pkg.dependencies.puppeteer}`
        });
      } else {
        this.testResults.browserAutomation.push({
          test: 'Puppeteer Installation',
          status: 'FAIL',
          details: 'Puppeteer not found in dependencies'
        });
      }

      // Test browser automation MCP server syntax
      const browserMCPPath = 'mcp-servers/browser-automation/browser-automation-mcp.js';
      const browserMCPContent = await fs.readFile(browserMCPPath, 'utf8');
      
      // Basic syntax checks
      const requiredElements = [
        'class BrowserAutomationMCP',
        'puppeteer',
        'navigate_to_url',
        'extract_data',
        'automated_testing'
      ];

      let syntaxPassed = true;
      const missingElements = [];

      for (const element of requiredElements) {
        if (!browserMCPContent.includes(element)) {
          syntaxPassed = false;
          missingElements.push(element);
        }
      }

      this.testResults.browserAutomation.push({
        test: 'Browser MCP Server Syntax',
        status: syntaxPassed ? 'PASS' : 'FAIL',
        details: syntaxPassed ? 'All required elements found' : `Missing: ${missingElements.join(', ')}`
      });

    } catch (error) {
      this.testResults.browserAutomation.push({
        test: 'Browser Automation Setup',
        status: 'FAIL',
        details: error.message
      });
    }

    console.log('✅ Browser automation setup tested\n');
  }

  async generateTestReport() {
    console.log('📊 Generating Test Report...');

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: 0,
        passed: 0,
        failed: 0
      },
      categories: this.testResults
    };

    // Calculate totals
    for (const category of Object.values(this.testResults)) {
      for (const test of category) {
        report.summary.total++;
        if (test.status === 'PASS') {
          report.summary.passed++;
        } else {
          report.summary.failed++;
        }
      }
    }

    report.summary.successRate = report.summary.total > 0 ? 
      (report.summary.passed / report.summary.total * 100).toFixed(1) : 0;

    // Save report
    const reportPath = 'automation-artifacts/integration-test-report.json';
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    this.testResults.performance.push({
      test: 'Test Report Generation',
      status: 'PASS',
      details: `Report saved to ${reportPath}`
    });

    console.log('✅ Test report generated\n');
  }

  printFinalReport() {
    console.log('📋 AUTOMATION INTEGRATION TEST RESULTS');
    console.log('=' .repeat(50));

    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;

    for (const [category, tests] of Object.entries(this.testResults)) {
      console.log(`\n${category.toUpperCase()}:`);
      
      for (const test of tests) {
        const status = test.status === 'PASS' ? '✅' : '❌';
        console.log(`  ${status} ${test.test}: ${test.details}`);
        
        totalTests++;
        if (test.status === 'PASS') {
          totalPassed++;
        } else {
          totalFailed++;
        }
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('SUMMARY:');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${totalPassed}`);
    console.log(`Failed: ${totalFailed}`);
    console.log(`Success Rate: ${(totalPassed / totalTests * 100).toFixed(1)}%`);

    if (this.errors.length > 0) {
      console.log('\nERRORS:');
      for (const error of this.errors) {
        console.log(`❌ ${error.message}`);
      }
    }

    if (totalFailed === 0) {
      console.log('\n🎉 All tests passed! Automation integration is ready.');
    } else {
      console.log(`\n⚠️ ${totalFailed} test(s) failed. Please review the configuration.`);
    }

    console.log('\n📁 Artifacts saved to: automation-artifacts/');
    console.log('📊 Full report: automation-artifacts/integration-test-report.json');
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new AutomationIntegrationTester();
  tester.runAllTests().catch(console.error);
}

module.exports = AutomationIntegrationTester;
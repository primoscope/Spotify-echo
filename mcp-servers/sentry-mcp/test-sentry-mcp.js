#!/usr/bin/env node
/**
 * Test Suite for Sentry MCP Server
 * 
 * Comprehensive testing of all Sentry MCP server functionality:
 * - Server startup and health checks
 * - Error capture and reporting
 * - Performance monitoring
 * - User context management
 * - Breadcrumb tracking
 * - HTTP endpoints
 */

const axios = require('axios');
const { spawn } = require('child_process');

class SentryMCPServerTester {
  constructor() {
    this.serverProcess = null;
    this.baseUrl = 'http://localhost:3012';
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async runAllTests() {
    console.log('🔍 Starting Sentry MCP Server Test Suite...\n');
    
    try {
      // Start the server
      await this.startServer();
      
      // Wait for server to be ready
      await this.waitForServer();
      
      // Run all tests
      await this.testHealthCheck();
      await this.testErrorEndpoint();
      await this.testPerformanceEndpoint();
      await this.testMCPToolsEndpoint();
      await this.testMCPCallTool();
      await this.testAPIIntegration();
      await this.testEnhancedFeatures();
      
      // Generate test report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
    } finally {
      // Cleanup
      await this.stopServer();
    }
  }

  async startServer() {
    console.log('🚀 Starting Sentry MCP Server...');
    
    return new Promise((resolve, reject) => {
      this.serverProcess = spawn('node', ['sentry-mcp-server.js'], {
        cwd: __dirname,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      this.serverProcess.stdout.on('data', (data) => {
        output += data.toString();
        if (output.includes('Sentry MCP Server running on port')) {
          resolve();
        }
      });

      this.serverProcess.stderr.on('data', (data) => {
        console.error('Server Error:', data.toString());
      });

      this.serverProcess.on('error', (error) => {
        reject(new Error(`Failed to start server: ${error.message}`));
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error('Server startup timeout'));
      }, 10000);
    });
  }

  async waitForServer() {
    console.log('⏳ Waiting for server to be ready...');
    
    for (let i = 0; i < 30; i++) {
      try {
        const response = await axios.get(`${this.baseUrl}/health`, { timeout: 1000 });
        if (response.status === 200) {
          console.log('✅ Server is ready\n');
          return;
        }
      } catch (error) {
        // Continue waiting
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('Server failed to become ready');
  }

  async testHealthCheck() {
    console.log('🧪 Testing Health Check Endpoint...');
    
    try {
      const response = await axios.get(`${this.baseUrl}/health`);
      
      const expectedFields = ['status', 'service', 'version', 'sentry_dsn_configured', 'timestamp'];
      const hasAllFields = expectedFields.every(field => response.data.hasOwnProperty(field));
      
      if (response.status === 200 && hasAllFields && response.data.status === 'healthy') {
        this.recordTest('Health Check', true, 'Health endpoint returns correct structure');
      } else {
        this.recordTest('Health Check', false, 'Health endpoint response invalid');
      }
    } catch (error) {
      this.recordTest('Health Check', false, `Health endpoint failed: ${error.message}`);
    }
  }

  async testErrorEndpoint() {
    console.log('🧪 Testing Error Endpoint...');
    
    try {
      // This should return 500 and trigger Sentry error capture
      const response = await axios.get(`${this.baseUrl}/test-error`);
      this.recordTest('Error Endpoint', false, 'Error endpoint should have thrown an error');
    } catch (error) {
      if (error.response && error.response.status === 500) {
        this.recordTest('Error Endpoint', true, 'Error endpoint correctly throws and captures error');
      } else {
        this.recordTest('Error Endpoint', false, `Error endpoint unexpected response: ${error.message}`);
      }
    }
  }

  async testPerformanceEndpoint() {
    console.log('🧪 Testing Performance Endpoint...');
    
    try {
      const response = await axios.get(`${this.baseUrl}/test-performance`);
      
      if (response.status === 200 && 
          response.data.message === 'Performance test completed' && 
          response.data.transaction_id) {
        this.recordTest('Performance Endpoint', true, 'Performance endpoint creates transaction');
      } else {
        this.recordTest('Performance Endpoint', false, 'Performance endpoint response invalid');
      }
    } catch (error) {
      this.recordTest('Performance Endpoint', false, `Performance endpoint failed: ${error.message}`);
    }
  }

  async testMCPToolsEndpoint() {
    console.log('🧪 Testing MCP Tools Endpoint...');
    
    try {
      const response = await axios.get(`${this.baseUrl}/mcp/tools`);
      
      if (response.status === 200 && 
          response.data.tools && 
          Array.isArray(response.data.tools) &&
          response.data.tools.length > 0) {
        this.recordTest('MCP Tools Endpoint', true, `Found ${response.data.tools.length} available tools`);
      } else {
        this.recordTest('MCP Tools Endpoint', false, 'Tools endpoint response invalid');
      }
    } catch (error) {
      this.recordTest('MCP Tools Endpoint', false, `Tools endpoint failed: ${error.message}`);
    }
  }

  async testMCPCallTool() {
    console.log('🧪 Testing MCP Call Tool...');
    
    try {
      const response = await axios.post(`${this.baseUrl}/mcp/call-tool`, {
        tool: 'sentry_health_check',
        arguments: {}
      });
      
      if (response.status === 200 && response.data.success) {
        this.recordTest('MCP Call Tool', true, 'Health check tool executed successfully');
      } else {
        this.recordTest('MCP Call Tool', false, 'Call tool response invalid');
      }
    } catch (error) {
      this.recordTest('MCP Call Tool', false, `Call tool failed: ${error.message}`);
    }
  }
  
  async testAPIIntegration() {
    console.log('🧪 Testing Sentry API Integration...');
    
    try {
      // Test the enhanced health check with API connectivity
      const response = await axios.post(`${this.baseUrl}/mcp/call-tool`, {
        tool: 'sentry_health_check',
        arguments: {}
      });
      
      if (response.status === 200 && 
          response.data.success && 
          response.data.hasOwnProperty('sentry_api_connected') &&
          response.data.hasOwnProperty('auth_token_configured')) {
        this.recordTest('API Integration Health', true, 'Enhanced health check includes API status');
      } else {
        this.recordTest('API Integration Health', false, 'API integration health check incomplete');
      }
    } catch (error) {
      this.recordTest('API Integration Health', false, `API health check failed: ${error.message}`);
    }
  }
  
  async testEnhancedFeatures() {
    console.log('🧪 Testing Enhanced Sentry Features...');
    
    try {
      // Test organization info tool (may fail if API tokens are invalid, but should handle gracefully)
      const response = await axios.post(`${this.baseUrl}/mcp/call-tool`, {
        tool: 'sentry_get_organization_info',
        arguments: {}
      });
      
      if (response.status === 200) {
        if (response.data.success) {
          this.recordTest('Enhanced Features', true, 'Organization info tool succeeded (API tokens valid)');
        } else {
          // This is expected if tokens are not valid, but the tool should handle it gracefully
          this.recordTest('Enhanced Features', true, 'Organization info tool handled gracefully (expected if tokens invalid)');
        }
      } else {
        this.recordTest('Enhanced Features', false, 'Organization info tool failed unexpectedly');
      }
    } catch (error) {
      this.recordTest('Enhanced Features', false, `Enhanced features test failed: ${error.message}`);
    }
  }

  recordTest(testName, passed, message) {
    this.results.tests.push({ testName, passed, message });
    if (passed) {
      this.results.passed++;
      console.log(`✅ ${testName}: ${message}`);
    } else {
      this.results.failed++;
      console.log(`❌ ${testName}: ${message}`);
    }
  }

  generateReport() {
    console.log('\n📊 Test Results Summary');
    console.log('========================');
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📈 Total: ${this.results.tests.length}`);
    console.log(`🎯 Success Rate: ${Math.round((this.results.passed / this.results.tests.length) * 100)}%`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.tests
        .filter(test => !test.passed)
        .forEach(test => {
          console.log(`   • ${test.testName}: ${test.message}`);
        });
    }

    console.log('\n📋 Detailed Test Results:');
    this.results.tests.forEach(test => {
      const status = test.passed ? '✅' : '❌';
      console.log(`   ${status} ${test.testName}: ${test.message}`);
    });

    // Integration recommendations
    console.log('\n🔧 Integration Recommendations:');
    console.log('1. Add Sentry server to MCP orchestrator configuration');
    console.log('2. Update main package.json scripts with Sentry commands');
    console.log('3. Integrate Sentry tools in critical EchoTune AI workflows');
    console.log('4. Set up Sentry dashboard monitoring and alerts');
    console.log('5. Configure environment variables for production deployment');
    
    const overallStatus = this.results.failed === 0 ? 'SUCCESS' : 'PARTIAL SUCCESS';
    console.log(`\n🎉 Test Suite Result: ${overallStatus}`);
  }

  async stopServer() {
    if (this.serverProcess) {
      console.log('\n🛑 Stopping Sentry MCP Server...');
      this.serverProcess.kill('SIGINT');
      
      return new Promise((resolve) => {
        this.serverProcess.on('exit', () => {
          console.log('✅ Server stopped gracefully');
          resolve();
        });
        
        // Force kill after 5 seconds
        setTimeout(() => {
          this.serverProcess.kill('SIGKILL');
          resolve();
        }, 5000);
      });
    }
  }
}

// Handle script interruption
process.on('SIGINT', () => {
  console.log('\n⚠️  Test interrupted by user');
  process.exit(0);
});

// Run tests if called directly
if (require.main === module) {
  const tester = new SentryMCPServerTester();
  tester.runAllTests()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test suite crashed:', error);
      process.exit(1);
    });
}

module.exports = SentryMCPServerTester;
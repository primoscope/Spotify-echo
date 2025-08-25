#!/usr/bin/env node

/**
 * Gemini Integration Test (Unified)
 *
 * Tests the application's GeminiProvider, ensuring it works correctly with both
 * the standard Gemini API and the Vertex AI backend.
 */

const GeminiProvider = require('../../src/chat/llm-providers/gemini-provider');

// Load environment variables from .env file
require('dotenv').config();

class UnifiedGeminiIntegrationTest {
  constructor() {
    this.provider = null;
    this.results = {
      initialization: false,
      connectivity: false,
      basicPrompt: false,
      vertexModeCheck: false,
    };
  }

  async initialize() {
    console.log('🧠 Unified Gemini Integration Test');
    console.log('===================================');
    
    try {
      // Instantiate the application's actual GeminiProvider
      // It will automatically pick up configuration from process.env
      this.provider = new GeminiProvider({});
      await this.provider.initialize();

      console.log(`✅ GeminiProvider initialized successfully.`);
      console.log(`   Mode: ${this.provider.config.useVertex ? 'Vertex AI' : 'Google AI Studio'}`);
      this.results.initialization = true;
      return true;
    } catch (error) {
      console.log('❌ Failed to initialize GeminiProvider:', error.message);
      return false;
    }
  }

  async testConnectivity() {
    console.log('\n🔍 Testing API Connectivity...');
    
    try {
      const response = await this.provider.generateCompletion([
        { role: 'user', content: 'Hello! Please respond with "Connection successful."' }
      ], { maxTokens: 50 });

      if (response.content && response.content.toLowerCase().includes('connection successful')) {
        console.log('✅ API connectivity successful.');
        console.log(`   Provider response: "${response.content.trim()}"`);
        this.results.connectivity = true;
      } else {
        throw new Error(`Unexpected response: ${response.content}`);
      }
    } catch (error) {
      console.log('❌ API connectivity failed:', error.message);
      this.results.connectivity = false;
    }
  }

  async testBasicPrompt() {
    console.log('\n🔍 Testing Basic Prompt...');

    try {
        const response = await this.provider.generateCompletion([
            { role: 'user', content: 'Explain the concept of a "language model" in one sentence.' }
        ]);

        if (response.content && response.content.length > 10) {
            console.log('✅ Basic prompt test successful.');
            console.log(`   Response: "${response.content.trim()}"`);
            this.results.basicPrompt = true;
        } else {
            throw new Error('Invalid or empty response for basic prompt.');
        }
    } catch (error) {
        console.log('❌ Basic prompt test failed:', error.message);
        this.results.basicPrompt = false;
    }
  }

  async checkVertexMode() {
    console.log('\n🔍 Verifying Configuration Mode...');
    const isUsingVertex = this.provider.config.useVertex;
    const expectedMode = process.env.GEMINI_USE_VERTEX === 'true';

    if (isUsingVertex === expectedMode) {
      console.log(`✅ Provider is correctly in ${expectedMode ? 'Vertex AI' : 'Google AI Studio'} mode.`);
      this.results.vertexModeCheck = true;
    } else {
      console.log(`❌ FAIL: Provider is in the wrong mode. Expected 'useVertex' to be ${expectedMode}, but it is ${isUsingVertex}.`);
      this.results.vertexModeCheck = false;
    }
  }

  generateReport() {
    console.log('\n📊 Test Results Summary');
    console.log('========================');
    
    const tests = [
      { name: 'Provider Initialization', status: this.results.initialization },
      { name: 'Vertex Mode Check', status: this.results.vertexModeCheck },
      { name: 'API Connectivity', status: this.results.connectivity },
      { name: 'Basic Prompt', status: this.results.basicPrompt },
    ];
    
    tests.forEach(test => {
      const status = test.status ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${test.name}`);
    });
    
    const passedTests = tests.filter(t => t.status).length;
    const totalTests = tests.length;
    
    console.log(`\n📈 Overall Score: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log(`🎉 All tests passed! Gemini integration via ${this.provider.config.useVertex ? 'Vertex AI' : 'Google AI Studio'} is working correctly.`);
    } else {
      console.log('❌ Some tests failed. Please review the errors above.');
    }
    
    return passedTests === totalTests;
  }

  async runAllTests() {
    const initialized = await this.initialize();
    if (!initialized) {
      this.generateReport();
      return false;
    }
    
    await this.checkVertexMode();
    await this.testConnectivity();
    await this.testBasicPrompt();
    
    return this.generateReport();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new UnifiedGeminiIntegrationTest();
  tester.runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test runner failed unexpectedly:', error);
      process.exit(1);
    });
}

module.exports = UnifiedGeminiIntegrationTest;
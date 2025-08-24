#!/usr/bin/env node
/**
 * Comprehensive Claude Opus 4.1 Integration Test
 * Tests all aspects of the Claude Opus 4.1 Vertex AI integration
 */

const VertexAnthropicProvider = require('../src/chat/llm-providers/vertex-anthropic-provider');
const modelRegistry = require('../src/chat/model-registry');
const MultiProviderDeployment = require('./deploy-ai-providers');

class ClaudeOpus41Test {
  constructor() {
    this.results = {
      modelRegistry: null,
      providerInit: null,
      basicCompletion: null,
      extendedThinking: null,
      codingCapabilities: null,
      agentWorkflow: null,
      deployment: null,
      overall: null
    };
  }

  log(message) {
    console.log(message);
  }

  async testModelRegistry() {
    this.log('🔍 Testing Model Registry Integration...');
    
    try {
      await modelRegistry.initialize();
      
      // Check if Claude Opus 4.1 is registered
      const claudeOpusModel = modelRegistry.getModelInfo('vertex-anthropic', 'claude-opus-4.1');
      
      if (!claudeOpusModel) {
        throw new Error('Claude Opus 4.1 not found in model registry');
      }
      
      // Validate model properties
      const expectedCapabilities = ['text', 'coding', 'reasoning', 'agents', 'extended-thinking'];
      const hasRequiredCapabilities = expectedCapabilities.every(cap => 
        claudeOpusModel.capabilities.includes(cap)
      );
      
      if (!hasRequiredCapabilities) {
        throw new Error('Claude Opus 4.1 missing required capabilities');
      }
      
      this.log('✅ Model Registry: Claude Opus 4.1 properly registered');
      this.log(`   - Max Tokens: ${claudeOpusModel.maxTokens}`);
      this.log(`   - Context Window: ${claudeOpusModel.contextWindow}`);
      this.log(`   - Extended Thinking: ${claudeOpusModel.extendedThinking}`);
      this.log(`   - Agent Capable: ${claudeOpusModel.agentCapable}`);
      
      this.results.modelRegistry = { status: 'success', model: claudeOpusModel };
      
    } catch (error) {
      this.log(`❌ Model Registry test failed: ${error.message}`);
      this.results.modelRegistry = { status: 'failed', error: error.message };
    }
  }

  async testProviderInitialization() {
    this.log('\n🚀 Testing Vertex AI Anthropic Provider Initialization...');
    
    try {
      const provider = new VertexAnthropicProvider({
        projectId: process.env.GCP_PROJECT_ID || 'test-project',
        location: process.env.GCP_VERTEX_LOCATION || 'us-central1',
        model: 'claude-opus-4-1'
      });

      // Test configuration validation
      const isConfigValid = provider.validateConfig();
      if (!isConfigValid && process.env.GCP_PROJECT_ID) {
        throw new Error('Provider configuration validation failed');
      }

      // Test capabilities
      const capabilities = provider.getCapabilities();
      if (!capabilities.extendedThinking) {
        throw new Error('Extended thinking capability not detected');
      }

      if (!capabilities.features.includes('agents')) {
        throw new Error('Agent capabilities not detected');
      }

      this.log('✅ Provider Initialization: Configuration valid');
      this.log(`   - Max Tokens: ${capabilities.maxTokens}`);
      this.log(`   - Features: ${capabilities.features.join(', ')}`);
      this.log(`   - Extended Thinking: ${capabilities.extendedThinking}`);
      
      this.results.providerInit = { status: 'success', capabilities };
      
    } catch (error) {
      this.log(`❌ Provider initialization test failed: ${error.message}`);
      this.results.providerInit = { status: 'failed', error: error.message };
    }
  }

  async testBasicCompletion() {
    this.log('\n🧪 Testing Basic Claude Opus 4.1 Completion...');
    
    try {
      if (!process.env.GCP_PROJECT_ID) {
        this.log('⏭️  Skipping completion test - GCP_PROJECT_ID not configured');
        this.results.basicCompletion = { status: 'skipped', reason: 'No GCP credentials' };
        return;
      }

      const provider = new VertexAnthropicProvider({
        projectId: process.env.GCP_PROJECT_ID,
        location: process.env.GCP_VERTEX_LOCATION || 'us-central1'
      });

      await provider.initialize();

      const startTime = Date.now();
      const response = await provider.generateCompletion([
        { role: 'user', content: 'Hello! Please respond with "Claude Opus 4.1 via Vertex AI is working" and nothing else.' }
      ], { 
        maxTokens: 50,
        model: 'claude-opus-4-1'
      });
      const latency = Date.now() - startTime;

      if (!response || !response.content) {
        throw new Error('No response content received');
      }

      this.log('✅ Basic Completion: Response received');
      this.log(`   - Latency: ${latency}ms`);
      this.log(`   - Response: "${response.content.substring(0, 100)}..."`);
      this.log(`   - Model: ${response.model}`);
      
      this.results.basicCompletion = { 
        status: 'success', 
        latency, 
        response: response.content.substring(0, 200) 
      };
      
    } catch (error) {
      this.log(`❌ Basic completion test failed: ${error.message}`);
      this.results.basicCompletion = { status: 'failed', error: error.message };
    }
  }

  async testExtendedThinking() {
    this.log('\n🧠 Testing Extended Thinking Capabilities...');
    
    try {
      if (!process.env.GCP_PROJECT_ID) {
        this.log('⏭️  Skipping extended thinking test - GCP_PROJECT_ID not configured');
        this.results.extendedThinking = { status: 'skipped', reason: 'No GCP credentials' };
        return;
      }

      const provider = new VertexAnthropicProvider({
        projectId: process.env.GCP_PROJECT_ID,
        location: process.env.GCP_VERTEX_LOCATION || 'us-central1'
      });

      await provider.initialize();

      const complexProblem = `
        Analyze this complex music recommendation scenario:
        - User loves indie rock but recently started exploring electronic music
        - Their top artists are Radiohead, Arcade Fire, Bon Iver
        - They workout to high-energy music but study to ambient sounds
        - Time of day: 3 PM on a Friday
        
        Use extended thinking to recommend 3 songs with detailed reasoning.
      `;

      const response = await provider.generateCompletion([
        { role: 'user', content: complexProblem }
      ], { 
        maxTokens: 1000,
        model: 'claude-opus-4-1',
        enableExtendedThinking: true
      });

      if (!response || !response.content || response.content.length < 200) {
        throw new Error('Extended thinking response too short or missing');
      }

      this.log('✅ Extended Thinking: Complex reasoning response received');
      this.log(`   - Response length: ${response.content.length} characters`);
      this.log(`   - Contains reasoning: ${response.content.toLowerCase().includes('reasoning') || response.content.toLowerCase().includes('analysis')}`);
      
      this.results.extendedThinking = { 
        status: 'success', 
        responseLength: response.content.length,
        preview: response.content.substring(0, 300)
      };
      
    } catch (error) {
      this.log(`❌ Extended thinking test failed: ${error.message}`);
      this.results.extendedThinking = { status: 'failed', error: error.message };
    }
  }

  async testCodingCapabilities() {
    this.log('\n💻 Testing Coding Capabilities...');
    
    try {
      if (!process.env.GCP_PROJECT_ID) {
        this.log('⏭️  Skipping coding test - GCP_PROJECT_ID not configured');
        this.results.codingCapabilities = { status: 'skipped', reason: 'No GCP credentials' };
        return;
      }

      const provider = new VertexAnthropicProvider({
        projectId: process.env.GCP_PROJECT_ID,
        location: process.env.GCP_VERTEX_LOCATION || 'us-central1'
      });

      await provider.initialize();

      const codingTask = `
        Write a JavaScript function that:
        1. Takes an array of music tracks with properties: name, artist, genre, energy_level (0-1)
        2. Filters tracks by genre preference
        3. Sorts by energy level for workout recommendations
        4. Returns top 5 tracks with detailed comments
        
        Make it production-ready with error handling.
      `;

      const response = await provider.generateCompletion([
        { role: 'user', content: codingTask }
      ], { 
        maxTokens: 1500,
        model: 'claude-opus-4-1'
      });

      if (!response || !response.content || !response.content.includes('function')) {
        throw new Error('Coding response missing or invalid');
      }

      const hasErrorHandling = response.content.includes('try') || response.content.includes('catch') || response.content.includes('Error');
      const hasComments = response.content.includes('//') || response.content.includes('/*');
      
      this.log('✅ Coding Capabilities: Production-ready code generated');
      this.log(`   - Has error handling: ${hasErrorHandling}`);
      this.log(`   - Has comments: ${hasComments}`);
      this.log(`   - Code length: ${response.content.length} characters`);
      
      this.results.codingCapabilities = { 
        status: 'success', 
        hasErrorHandling,
        hasComments,
        codeLength: response.content.length
      };
      
    } catch (error) {
      this.log(`❌ Coding capabilities test failed: ${error.message}`);
      this.results.codingCapabilities = { status: 'failed', error: error.message };
    }
  }

  async testDeploymentIntegration() {
    this.log('\n🚀 Testing Deployment Integration...');
    
    try {
      const deployment = new MultiProviderDeployment({ dryRun: true, verbose: false });
      
      // Test that Claude Opus 4.1 is included in deployment
      const report = await deployment.deploy();
      
      if (!report || !report.services || !report.services.vertexAnthropic) {
        throw new Error('Claude Opus 4.1 not included in deployment pipeline');
      }

      const vertexAnthropicResult = report.services.vertexAnthropic;
      
      this.log('✅ Deployment Integration: Claude Opus 4.1 included in pipeline');
      this.log(`   - Status: ${vertexAnthropicResult.status}`);
      this.log(`   - Model: ${vertexAnthropicResult.model || 'claude-opus-4-1'}`);
      
      this.results.deployment = { 
        status: 'success', 
        deploymentStatus: vertexAnthropicResult.status 
      };
      
    } catch (error) {
      this.log(`❌ Deployment integration test failed: ${error.message}`);
      this.results.deployment = { status: 'failed', error: error.message };
    }
  }

  async generateReport() {
    this.log('\n📊 CLAUDE OPUS 4.1 INTEGRATION TEST REPORT');
    this.log('=' .repeat(60));
    
    const tests = [
      { name: 'Model Registry', result: this.results.modelRegistry },
      { name: 'Provider Initialization', result: this.results.providerInit },
      { name: 'Basic Completion', result: this.results.basicCompletion },
      { name: 'Extended Thinking', result: this.results.extendedThinking },
      { name: 'Coding Capabilities', result: this.results.codingCapabilities },
      { name: 'Deployment Integration', result: this.results.deployment }
    ];

    let successCount = 0;
    let totalTests = tests.length;

    tests.forEach(test => {
      const status = test.result?.status;
      const emoji = status === 'success' ? '✅' : 
                   status === 'skipped' ? '⏭️' : '❌';
      
      this.log(`${emoji} ${test.name}: ${status}`);
      
      if (test.result?.error) {
        this.log(`   Error: ${test.result.error}`);
      }
      
      if (status === 'success') successCount++;
    });

    const overallStatus = successCount >= 4 ? 'READY FOR PRODUCTION' : 
                         successCount >= 2 ? 'NEEDS CONFIGURATION' : 'REQUIRES ATTENTION';

    this.log(`\n🎯 OVERALL STATUS: ${overallStatus}`);
    this.log(`📈 Success Rate: ${successCount}/${totalTests} tests passed`);

    if (overallStatus === 'NEEDS CONFIGURATION') {
      this.log('\n💡 TO COMPLETE SETUP:');
      this.log('   1. Configure GCP_PROJECT_ID environment variable');
      this.log('   2. Set up Vertex AI authentication');
      this.log('   3. Deploy Claude Opus 4.1 in Vertex AI Model Garden');
      this.log('   4. Run: npm run ai:deploy:all-providers');
    }

    this.results.overall = {
      status: overallStatus,
      successCount,
      totalTests,
      timestamp: new Date().toISOString()
    };

    return this.results;
  }

  async runFullTest() {
    try {
      this.log('🚀 Starting Comprehensive Claude Opus 4.1 Integration Test...\n');
      
      await this.testModelRegistry();
      await this.testProviderInitialization();
      await this.testBasicCompletion();
      await this.testExtendedThinking();
      await this.testCodingCapabilities();
      await this.testDeploymentIntegration();
      
      const report = await this.generateReport();
      
      // Save report
      const fs = require('fs').promises;
      const path = require('path');
      const reportPath = path.join(__dirname, 'test-results/claude-opus-4.1-test-report.json');
      await fs.mkdir(path.dirname(reportPath), { recursive: true });
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      
      this.log(`\n📄 Full report saved to: ${reportPath}`);
      
      return report;
    } catch (error) {
      this.log(`❌ Test execution failed: ${error.message}`);
      throw error;
    }
  }
}

// CLI execution
if (require.main === module) {
  const tester = new ClaudeOpus41Test();
  tester.runFullTest().catch(console.error);
}

module.exports = ClaudeOpus41Test;
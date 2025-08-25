#!/usr/bin/env node

/**
 * Mock Provider Production Safeguard Test
 * Validates that mock provider is properly blocked in production
 */

require('dotenv').config();

async function testMockProviderSafeguards() {
  console.log('🔒 Testing Mock Provider Production Safeguards\n');

  const originalNodeEnv = process.env.NODE_ENV;
  const originalAllowMock = process.env.AI_ALLOW_MOCK_IN_PROD;
  const originalDisableMock = process.env.AI_DISABLE_MOCK_IN_PROD;

  const tests = [
    {
      name: 'Development Environment',
      setup: () => {
        process.env.NODE_ENV = 'development';
        delete process.env.AI_ALLOW_MOCK_IN_PROD;
        delete process.env.AI_DISABLE_MOCK_IN_PROD;
      },
      expectBlocked: false,
      description: 'Mock should be available in development'
    },
    {
      name: 'Production Default',
      setup: () => {
        process.env.NODE_ENV = 'production';
        delete process.env.AI_ALLOW_MOCK_IN_PROD;
        delete process.env.AI_DISABLE_MOCK_IN_PROD;
      },
      expectBlocked: true,
      description: 'Mock should be blocked in production by default'
    },
    {
      name: 'Production with Override',
      setup: () => {
        process.env.NODE_ENV = 'production';
        process.env.AI_ALLOW_MOCK_IN_PROD = 'true';
        delete process.env.AI_DISABLE_MOCK_IN_PROD;
      },
      expectBlocked: false,
      description: 'Mock should be allowed with explicit override'
    },
    {
      name: 'Production with Explicit Disable',
      setup: () => {
        process.env.NODE_ENV = 'production';
        delete process.env.AI_ALLOW_MOCK_IN_PROD;
        process.env.AI_DISABLE_MOCK_IN_PROD = 'true';
      },
      expectBlocked: true,
      description: 'Mock should be blocked with explicit disable'
    }
  ];

  let passed = 0;
  let total = tests.length;

  for (const test of tests) {
    console.log(`🧪 Test: ${test.name}`);
    console.log(`   ${test.description}`);
    
    // Clear module cache to force re-initialization
    delete require.cache[require.resolve('../src/api/providers/ProviderManager.js')];
    
    test.setup();
    
    try {
      const ProviderManager = require('../src/api/providers/ProviderManager.js');
      
      // Force re-initialization
      await ProviderManager.loadProviderConfigurations();
      await ProviderManager.initializeMockProvider();
      
      const mockConfig = ProviderManager.providerConfigs.get('mock');
      
      if (test.expectBlocked) {
        if (mockConfig.status === 'disabled_production' || !mockConfig.available) {
          console.log('   ✅ PASS - Mock provider correctly blocked');
          passed++;
        } else {
          console.log('   ❌ FAIL - Mock provider should be blocked but is available');
        }
      } else {
        if (mockConfig.status === 'connected' && mockConfig.available) {
          console.log('   ✅ PASS - Mock provider correctly available');
          passed++;
        } else {
          console.log('   ❌ FAIL - Mock provider should be available but is blocked');
        }
      }
    } catch (error) {
      if (test.expectBlocked && error.message.includes('No LLM providers available')) {
        console.log('   ✅ PASS - Correctly threw error when no providers available');
        passed++;
      } else {
        console.log(`   ❌ FAIL - Unexpected error: ${error.message}`);
      }
    }
    
    console.log('');
  }

  // Restore original environment
  process.env.NODE_ENV = originalNodeEnv;
  if (originalAllowMock) process.env.AI_ALLOW_MOCK_IN_PROD = originalAllowMock;
  if (originalDisableMock) process.env.AI_DISABLE_MOCK_IN_PROD = originalDisableMock;

  console.log(`📊 Results: ${passed}/${total} tests passed`);
  return passed === total;
}

async function testGeminiEnhancements() {
  console.log('🚀 Testing Gemini Enhancements\n');

  const tests = [
    {
      name: 'Enhanced Provider Initialization',
      test: async () => {
        const GeminiProvider = require('../src/chat/llm-providers/gemini-provider');
        const provider = new GeminiProvider({
          apiKey: 'test-key',
          model: 'gemini-2.5-pro'
        });
        
        const capabilities = provider.getCapabilities();
        return capabilities.supportsMultimodal && 
               capabilities.features.includes('multimodal') &&
               capabilities.costProfile === 'medium';
      }
    },
    {
      name: 'Gemini Client Module',
      test: async () => {
        const GeminiClient = require('../src/ai/providers/gemini/client');
        const client = new GeminiClient({
          apiKey: 'test-key',
          useVertex: false
        });
        
        const info = client.getClientInfo();
        return info.type === 'studio' && info.model && !info.initialized;
      }
    },
    {
      name: 'Safety Configuration',
      test: async () => {
        const GeminiSafety = require('../src/ai/providers/gemini/safety');
        const safety = new GeminiSafety();
        
        const settings = safety.getSafetySettings('BLOCK_MEDIUM_AND_ABOVE');
        return settings.length === 4 && 
               settings[0].category === 'HARM_CATEGORY_HARASSMENT';
      }
    },
    {
      name: 'Cost Model',
      test: async () => {
        const GeminiCostModel = require('../src/ai/providers/gemini/cost-model');
        const costModel = new GeminiCostModel();
        
        const cost = costModel.calculateCost('gemini-2.5-pro', 1000, 500, 0);
        return cost > 0 && typeof cost === 'number';
      }
    },
    {
      name: 'Message Transformer',
      test: async () => {
        const GeminiTransformer = require('../src/ai/providers/gemini/transformer');
        const transformer = new GeminiTransformer();
        
        const messages = [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' }
        ];
        
        const geminiMessages = transformer.transformMessages(messages);
        return geminiMessages.length === 2 && 
               geminiMessages[0].role === 'user' &&
               geminiMessages[1].role === 'model';
      }
    }
  ];

  let passed = 0;
  for (const { name, test } of tests) {
    try {
      const result = await test();
      if (result) {
        console.log(`✅ ${name}`);
        passed++;
      } else {
        console.log(`❌ ${name} - test returned false`);
      }
    } catch (error) {
      console.log(`❌ ${name} - error: ${error.message}`);
    }
  }

  console.log(`\n📊 Gemini Tests: ${passed}/${tests.length} passed`);
  return passed === tests.length;
}

async function testClaudeOpusEnhancements() {
  console.log('🧠 Testing Claude Opus 4.1 Enhancements\n');

  const tests = [
    {
      name: 'Extended Thinking Capabilities',
      test: async () => {
        const VertexAnthropicProvider = require('../src/chat/llm-providers/vertex-anthropic-provider');
        const provider = new VertexAnthropicProvider({
          projectId: 'test-project',
          model: 'claude-opus-4-1'
        });
        
        const capabilities = provider.getCapabilities();
        return capabilities.supportsExtendedThinking && 
               capabilities.costProfile === 'high';
      }
    },
    {
      name: 'Thinking Budget Configuration',
      test: async () => {
        const VertexAnthropicProvider = require('../src/chat/llm-providers/vertex-anthropic-provider');
        const provider = new VertexAnthropicProvider({
          projectId: 'test-project',
          model: 'claude-opus-4-1'
        });
        
        const budget = provider.getExtendedThinkingBudget({ extendedThinkingBudget: 5000 });
        return budget === 5000;
      }
    },
    {
      name: 'Extended Thinking Prompt Building',
      test: async () => {
        const VertexAnthropicProvider = require('../src/chat/llm-providers/vertex-anthropic-provider');
        const provider = new VertexAnthropicProvider({
          projectId: 'test-project',
          model: 'claude-opus-4-1'
        });
        
        const prompt = provider.buildExtendedThinkingPrompt({ taskType: 'deep-reasoning' });
        return prompt.includes('<thinking>') && 
               prompt.includes('extended thinking') &&
               prompt.includes('thinking budget');
      }
    },
    {
      name: 'Thinking Token Extraction',
      test: async () => {
        const VertexAnthropicProvider = require('../src/chat/llm-providers/vertex-anthropic-provider');
        const provider = new VertexAnthropicProvider({
          projectId: 'test-project',
          model: 'claude-opus-4-1'
        });
        
        const content = `<thinking>This is internal reasoning.</thinking>Here is the final answer.`;
        const result = provider.extractThinkingTokens(content, 'claude-opus-4-1');
        
        return result.count > 0 && 
               result.cleanedContent === 'Here is the final answer.' &&
               result.trace.blockCount === 1;
      }
    }
  ];

  let passed = 0;
  for (const { name, test } of tests) {
    try {
      const result = await test();
      if (result) {
        console.log(`✅ ${name}`);
        passed++;
      } else {
        console.log(`❌ ${name} - test returned false`);
      }
    } catch (error) {
      console.log(`❌ ${name} - error: ${error.message}`);
    }
  }

  console.log(`\n📊 Claude Opus Tests: ${passed}/${tests.length} passed`);
  return passed === tests.length;
}

async function testMetricsCollection() {
  console.log('📊 Testing Metrics Collection\n');

  try {
    const aiMetrics = require('../src/metrics/ai-metrics');
    
    // Test recording metrics
    aiMetrics.recordGeminiRequest('gemini-2.5-pro', 'success', true);
    aiMetrics.recordGeminiMultimodal('gemini-2.5-pro', 2);
    aiMetrics.recordOpusReasoningTokens('deep-reasoning', 1500);
    
    const metrics = await aiMetrics.getMetrics();
    const hasGeminiMetrics = metrics.includes('echotune_ai_gemini_requests_total');
    const hasOpusMetrics = metrics.includes('echotune_ai_opus_reasoning_tokens_total');
    
    console.log(`✅ Metrics collection working`);
    console.log(`   Gemini metrics: ${hasGeminiMetrics ? 'found' : 'missing'}`);
    console.log(`   Opus metrics: ${hasOpusMetrics ? 'found' : 'missing'}`);
    
    return hasGeminiMetrics && hasOpusMetrics;
  } catch (error) {
    console.log(`❌ Metrics test failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🧪 Comprehensive Integration Test Suite\n');
  console.log('Testing Gemini and Claude Opus 4.1 enhancements...\n');

  const results = [];

  console.log('=' .repeat(60));
  results.push(await testMockProviderSafeguards());
  
  console.log('=' .repeat(60));
  results.push(await testGeminiEnhancements());
  
  console.log('=' .repeat(60));
  results.push(await testClaudeOpusEnhancements());
  
  console.log('=' .repeat(60));
  results.push(await testMetricsCollection());

  console.log('=' .repeat(60));
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`\n🎯 Overall Results: ${passed}/${total} test suites passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Implementation is ready.');
    process.exit(0);
  } else {
    console.log('⚠️ Some tests failed. Please review the implementation.');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = {
  testMockProviderSafeguards,
  testGeminiEnhancements,
  testClaudeOpusEnhancements,
  testMetricsCollection
};
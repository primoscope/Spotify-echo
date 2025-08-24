#!/usr/bin/env node
/**
 * AI Provider Testing and Deployment Script
 * Tests all configured AI providers and validates functionality
 */

const path = require('path');
const AgentRouter = require('../src/ai/agent/router');

class AIProviderTester {
  constructor() {
    this.router = new AgentRouter();
    this.testPrompt = "Recommend 3 upbeat rock songs for a workout playlist. Keep the response brief.";
  }

  async initialize() {
    console.log('🚀 Initializing AI Provider Testing System...\n');
    await this.router.initializeProviders();
  }

  async testAllProviders() {
    console.log('🧪 Testing All AI Providers...\n');
    
    const providers = Array.from(this.router.providers.keys());
    const results = [];

    for (const providerName of providers) {
      try {
        console.log(`📡 Testing ${providerName.toUpperCase()} provider...`);
        const result = await this.testProvider(providerName);
        results.push({
          provider: providerName,
          status: 'success',
          ...result
        });
        console.log(`✅ ${providerName} test passed`);
      } catch (error) {
        console.log(`❌ ${providerName} test failed: ${error.message}`);
        results.push({
          provider: providerName,
          status: 'failed',
          error: error.message
        });
      }
      console.log(''); // Add spacing
    }

    return results;
  }

  async testProvider(providerName) {
    const provider = this.router.providers.get(providerName);
    
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }

    // Test basic functionality
    const startTime = Date.now();
    
    let response;
    if (providerName === 'vertex') {
      // For Vertex AI, we need to use the VertexInvoker format
      const { AIRequest } = require('../src/ai/providers/vertexInvoker');
      const request = new AIRequest(
        'text-generation',
        'text-bison@latest',
        { prompt: this.testPrompt },
        { temperature: 0.7, maxTokens: 200 }
      );
      response = await provider.invoke(request);
    } else {
      // For other providers, use the standard format
      const messages = [{ role: 'user', content: this.testPrompt }];
      response = await provider.generateCompletion(messages, { 
        maxTokens: 200,
        temperature: 0.7
      });
    }
    
    const latency = Date.now() - startTime;
    
    // Validate response
    if (!response || !response.content && !response.text) {
      throw new Error('No response content received');
    }

    const content = response.content || response.text || '';
    if (content.length < 10) {
      throw new Error('Response too short, might indicate an error');
    }

    return {
      latency: `${latency}ms`,
      responseLength: content.length,
      preview: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
      model: response.model || provider.defaultModel || 'unknown'
    };
  }

  async testHealthChecks() {
    console.log('🏥 Running Health Checks...\n');
    
    const healthResults = await this.router.healthCheck();
    
    console.log('Provider Health Status:');
    for (const [provider, health] of Object.entries(healthResults)) {
      const status = health.status === 'healthy' ? '✅' : '❌';
      console.log(`  ${status} ${provider}: ${health.status}`);
      if (health.reason) {
        console.log(`     Reason: ${health.reason}`);
      }
    }
    
    return healthResults;
  }

  async testRouting() {
    console.log('\n🧭 Testing Multi-Provider Routing...\n');
    
    const strategies = ['low-cost', 'low-latency', 'high-quality'];
    const routingResults = [];

    for (const strategy of strategies) {
      try {
        console.log(`Testing ${strategy} strategy...`);
        
        // Create a simple test request
        const testRequest = {
          messages: [{ role: 'user', content: this.testPrompt }],
          options: { maxTokens: 150, temperature: 0.7 }
        };

        const response = await this.router.route(testRequest, {
          strategy: strategy,
          maxCost: 0.01,
          maxLatency: 10000
        });

        routingResults.push({
          strategy,
          success: true,
          selectedProvider: response.metadata?.provider || 'unknown',
          latency: response.metadata?.latency || 'unknown',
          cost: response.metadata?.cost || 'unknown'
        });

        console.log(`✅ ${strategy} routing successful - selected: ${response.metadata?.provider || 'unknown'}`);
      } catch (error) {
        console.log(`❌ ${strategy} routing failed: ${error.message}`);
        routingResults.push({
          strategy,
          success: false,
          error: error.message
        });
      }
    }

    return routingResults;
  }

  async generateReport(testResults, healthResults, routingResults) {
    console.log('\n📊 TEST REPORT\n');
    console.log('=' .repeat(50));
    
    // Provider Test Results
    console.log('\n🧪 PROVIDER TESTS:');
    const successful = testResults.filter(r => r.status === 'success');
    const failed = testResults.filter(r => r.status === 'failed');
    
    console.log(`✅ Successful: ${successful.length}/${testResults.length} providers`);
    console.log(`❌ Failed: ${failed.length}/${testResults.length} providers`);
    
    if (successful.length > 0) {
      console.log('\nSuccessful Providers:');
      successful.forEach(result => {
        console.log(`  • ${result.provider}: ${result.latency} latency, ${result.model}`);
        console.log(`    Preview: "${result.preview}"`);
      });
    }
    
    if (failed.length > 0) {
      console.log('\nFailed Providers:');
      failed.forEach(result => {
        console.log(`  • ${result.provider}: ${result.error}`);
      });
    }

    // Health Check Results
    console.log('\n🏥 HEALTH STATUS:');
    const healthyCount = Object.values(healthResults).filter(h => h.status === 'healthy').length;
    console.log(`${healthyCount}/${Object.keys(healthResults).length} providers healthy`);

    // Routing Results
    console.log('\n🧭 ROUTING TESTS:');
    const successfulRouting = routingResults.filter(r => r.success);
    console.log(`${successfulRouting.length}/${routingResults.length} routing strategies working`);
    
    if (successfulRouting.length > 0) {
      console.log('\nWorking Routing Strategies:');
      successfulRouting.forEach(result => {
        console.log(`  • ${result.strategy}: routes to ${result.selectedProvider}`);
      });
    }

    // Overall Status
    const overallHealthy = successful.length >= 2; // At least 2 providers working
    console.log('\n🎯 OVERALL STATUS:');
    console.log(overallHealthy ? '✅ System Ready for Production' : '⚠️  System Needs Attention');
    
    if (!overallHealthy) {
      console.log('\nRecommendations:');
      console.log('  - Ensure API keys are configured correctly');
      console.log('  - Check network connectivity');
      console.log('  - Verify provider configurations');
    }
    
    return {
      overall: overallHealthy ? 'healthy' : 'degraded',
      providers: testResults,
      health: healthResults,
      routing: routingResults,
      summary: {
        workingProviders: successful.length,
        totalProviders: testResults.length,
        healthyProviders: healthyCount,
        workingStrategies: successfulRouting.length
      }
    };
  }

  async runFullTest() {
    try {
      await this.initialize();
      
      const testResults = await this.testAllProviders();
      const healthResults = await this.testHealthChecks();
      const routingResults = await this.testRouting();
      
      const report = await this.generateReport(testResults, healthResults, routingResults);
      
      // Save report to file
      const fs = require('fs').promises;
      const reportPath = path.join(__dirname, '../test-results/ai-provider-test-report.json');
      await fs.mkdir(path.dirname(reportPath), { recursive: true });
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      
      console.log(`\n📄 Full report saved to: ${reportPath}`);
      
      return report;
    } catch (error) {
      console.error('❌ Test execution failed:', error);
      throw error;
    }
  }
}

// CLI execution
if (require.main === module) {
  const tester = new AIProviderTester();
  
  const command = process.argv[2] || 'all';
  
  switch (command) {
    case 'all':
      tester.runFullTest().catch(console.error);
      break;
    case 'health':
      tester.initialize().then(() => tester.testHealthChecks()).catch(console.error);
      break;
    case 'routing':
      tester.initialize().then(() => tester.testRouting()).catch(console.error);
      break;
    case 'providers':
      tester.initialize().then(() => tester.testAllProviders()).catch(console.error);
      break;
    default:
      console.log('Usage: node test-ai-providers.js [all|health|routing|providers]');
  }
}

module.exports = AIProviderTester;
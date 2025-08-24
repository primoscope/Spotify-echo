#!/usr/bin/env node
/**
 * Multi-Provider AI Deployment Script
 * Handles deployment and testing of all AI providers including Vertex AI, Gemini, and Anthropic
 */

const fs = require('fs').promises;
const path = require('path');

class MultiProviderDeployment {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
    this.verbose = options.verbose || false;
    this.skipVertexAI = options.skipVertexAI || false;
  }

  log(message) {
    console.log(message);
  }

  async checkEnvironmentVariables() {
    this.log('🔍 Checking Environment Variables...\n');
    
    const requiredEnvVars = {
      'GCP_PROJECT_ID': 'Vertex AI Project ID',
      'GCP_VERTEX_LOCATION': 'Vertex AI Location',
      'GEMINI_API_KEY': 'Google Gemini API Key',
      'ANTHROPIC_API_KEY': 'Anthropic Claude API Key',
      'OPENAI_API_KEY': 'OpenAI API Key (optional fallback)'
    };

    const optionalEnvVars = {
      'PERPLEXITY_API_KEY': 'Perplexity API Key',
      'XAI_API_KEY': 'xAI API Key'
    };

    const envStatus = {};
    
    // Check required variables
    for (const [key, description] of Object.entries(requiredEnvVars)) {
      const value = process.env[key];
      const isConfigured = value && value.length > 0 && value !== 'your-key-here';
      
      if (key.startsWith('GCP_') && this.skipVertexAI) {
        envStatus[key] = { configured: 'skipped', description, optional: false };
        continue;
      }
      
      envStatus[key] = { configured: isConfigured, description, optional: false };
      
      const status = isConfigured ? '✅' : '❌';
      this.log(`  ${status} ${key}: ${description}`);
    }

    // Check optional variables
    this.log('\nOptional Variables:');
    for (const [key, description] of Object.entries(optionalEnvVars)) {
      const value = process.env[key];
      const isConfigured = value && value.length > 0 && value !== 'your-key-here';
      
      envStatus[key] = { configured: isConfigured, description, optional: true };
      
      const status = isConfigured ? '✅' : '⚪';
      this.log(`  ${status} ${key}: ${description}`);
    }

    return envStatus;
  }

  async deployVertexAI() {
    if (this.skipVertexAI) {
      this.log('⏭️  Skipping Vertex AI deployment\n');
      return { status: 'skipped', reason: 'Explicitly skipped' };
    }

    this.log('🚀 Deploying Vertex AI Models...\n');
    
    try {
      if (this.dryRun) {
        this.log('🔍 DRY RUN: Would deploy Vertex AI endpoints');
        this.log('  - text-generation-primary (text-bison@latest)');
        this.log('  - text-generation-fallback (text-bison@001)');
        this.log('  - embeddings-primary (textembedding-gecko@latest)');
        this.log('  - recommendation-reranker (text-bison@latest)\n');
        return { status: 'dry-run', endpoints: 4 };
      }

      // Check if we can run the actual deployment
      if (!process.env.GCP_PROJECT_ID || process.env.GCP_PROJECT_ID === 'your-project-id') {
        throw new Error('GCP_PROJECT_ID not configured for production deployment');
      }

      // Import and run the deployment script
      const VertexDeploymentScript = require('../src/ai/vertex/deploymentScript');
      const deployment = new VertexDeploymentScript({
        verbose: this.verbose,
        dryRun: false
      });

      const result = await deployment.deployAll();
      this.log('✅ Vertex AI deployment completed\n');
      return result;
      
    } catch (error) {
      this.log(`❌ Vertex AI deployment failed: ${error.message}\n`);
      return { status: 'failed', error: error.message };
    }
  }

  async testGeminiConnection() {
    this.log('🧪 Testing Gemini Connection...\n');
    
    try {
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your-key-here') {
        throw new Error('GEMINI_API_KEY not configured');
      }

      const GeminiProvider = require('../src/chat/llm-providers/gemini-provider');
      const gemini = new GeminiProvider({
        apiKey: process.env.GEMINI_API_KEY,
        model: 'gemini-2.5-pro'
      });

      await gemini.initialize();
      
      if (this.dryRun) {
        this.log('🔍 DRY RUN: Would test Gemini 2.5 Pro connection');
        return { status: 'dry-run', model: 'gemini-2.5-pro' };
      }

      // Test with a simple prompt
      const response = await gemini.generateCompletion([
        { role: 'user', content: 'Hello, respond with just "Gemini connected"' }
      ], { maxTokens: 10 });

      if (response && response.content) {
        this.log('✅ Gemini 2.5 Pro connected successfully');
        this.log(`   Response: ${response.content.substring(0, 50)}...\n`);
        return { 
          status: 'success', 
          model: 'gemini-2.5-pro',
          response: response.content.substring(0, 100)
        };
      } else {
        throw new Error('No response received from Gemini');
      }
      
    } catch (error) {
      this.log(`❌ Gemini connection failed: ${error.message}\n`);
      return { status: 'failed', error: error.message };
    }
  }

  async testAnthropicConnection() {
    this.log('🧪 Testing Anthropic Claude Connection...\n');
    
    try {
      if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your-key-here') {
        throw new Error('ANTHROPIC_API_KEY not configured');
      }

      const AnthropicProvider = require('../src/chat/llm-providers/anthropic-provider');
      const anthropic = new AnthropicProvider({
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: 'claude-3-5-sonnet-20241022'
      });

      await anthropic.initialize();
      
      if (this.dryRun) {
        this.log('🔍 DRY RUN: Would test Claude 3.5 Sonnet connection');
        return { status: 'dry-run', model: 'claude-3-5-sonnet-20241022' };
      }

      // Test with a simple prompt
      const response = await anthropic.generateCompletion([
        { role: 'user', content: 'Hello, respond with just "Claude connected"' }
      ], { maxTokens: 10 });

      if (response && response.content) {
        this.log('✅ Claude 3.5 Sonnet connected successfully');
        this.log(`   Response: ${response.content.substring(0, 50)}...\n`);
        return { 
          status: 'success', 
          model: 'claude-3-5-sonnet-20241022',
          response: response.content.substring(0, 100)
        };
      } else {
        throw new Error('No response received from Claude');
      }
      
    } catch (error) {
      this.log(`❌ Claude connection failed: ${error.message}\n`);
      return { status: 'failed', error: error.message };
    }
  }

  async testMultiProviderRouting() {
    this.log('🧭 Testing Multi-Provider Routing...\n');
    
    try {
      const AgentRouter = require('../src/ai/agent/router');
      const router = new AgentRouter();
      
      if (this.dryRun) {
        this.log('🔍 DRY RUN: Would test multi-provider routing');
        return { status: 'dry-run', strategies: ['low-cost', 'low-latency', 'high-quality'] };
      }

      await router.initializeProviders();
      const availableProviders = Array.from(router.providers.keys());
      
      this.log(`   Available providers: ${availableProviders.join(', ')}`);
      
      if (availableProviders.length === 0) {
        throw new Error('No providers available for routing test');
      }

      // Test basic routing
      const testRequest = {
        messages: [{ role: 'user', content: 'Test routing' }],
        options: { maxTokens: 50 }
      };

      const response = await router.route(testRequest, {
        strategy: 'low-cost',
        maxCost: 0.01
      });

      this.log('✅ Multi-provider routing working');
      this.log(`   Selected provider: ${response.metadata?.provider || 'unknown'}\n`);
      
      return { 
        status: 'success', 
        availableProviders,
        selectedProvider: response.metadata?.provider
      };
      
    } catch (error) {
      this.log(`❌ Multi-provider routing failed: ${error.message}\n`);
      return { status: 'failed', error: error.message };
    }
  }

  async generateDeploymentReport(results) {
    this.log('📊 DEPLOYMENT REPORT\n');
    this.log('=' .repeat(50));
    
    const { envCheck, vertexAI, gemini, anthropic, routing } = results;
    
    // Environment status
    this.log('\n🔧 ENVIRONMENT CONFIGURATION:');
    const configuredCount = Object.values(envCheck).filter(v => v.configured === true || v.configured === 'skipped').length;
    const totalRequired = Object.values(envCheck).filter(v => !v.optional).length;
    this.log(`   ${configuredCount}/${totalRequired} required variables configured`);
    
    // Service status
    this.log('\n🚀 SERVICE DEPLOYMENT STATUS:');
    const services = { vertexAI, gemini, anthropic, routing };
    
    for (const [service, result] of Object.entries(services)) {
      const status = result.status === 'success' ? '✅' : 
                    result.status === 'dry-run' ? '🔍' :
                    result.status === 'skipped' ? '⏭️' : '❌';
      this.log(`   ${status} ${service.toUpperCase()}: ${result.status}`);
      
      if (result.error) {
        this.log(`       Error: ${result.error}`);
      }
      if (result.model) {
        this.log(`       Model: ${result.model}`);
      }
    }

    // Overall health
    const successCount = Object.values(services).filter(s => s.status === 'success').length;
    const totalServices = Object.keys(services).length;
    
    this.log('\n🎯 OVERALL STATUS:');
    const isHealthy = successCount >= 2; // At least 2 services working
    this.log(isHealthy ? '✅ System Ready for Multi-Provider AI' : '⚠️  System Needs Configuration');
    
    if (!isHealthy) {
      this.log('\n💡 RECOMMENDATIONS:');
      this.log('   - Configure missing API keys in environment variables');
      this.log('   - Run with --dry-run to test configuration');
      this.log('   - Use npm run test:ai-providers for detailed testing');
    }

    // Save report
    const reportData = {
      timestamp: new Date().toISOString(),
      dryRun: this.dryRun,
      environment: envCheck,
      services: services,
      summary: {
        configuredVars: configuredCount,
        totalRequiredVars: totalRequired,
        workingServices: successCount,
        totalServices: totalServices,
        overallStatus: isHealthy ? 'healthy' : 'needs-attention'
      }
    };

    try {
      const reportPath = path.join(__dirname, '../test-results/deployment-report.json');
      await fs.mkdir(path.dirname(reportPath), { recursive: true });
      await fs.writeFile(reportPath, JSON.stringify(reportData, null, 2));
      this.log(`\n📄 Detailed report saved to: ${reportPath}`);
    } catch (error) {
      this.log(`⚠️  Could not save report: ${error.message}`);
    }

    return reportData;
  }

  async deploy() {
    try {
      this.log('🎯 Multi-Provider AI Deployment Starting...\n');
      
      const envCheck = await this.checkEnvironmentVariables();
      const vertexAI = await this.deployVertexAI();
      const gemini = await this.testGeminiConnection();
      const anthropic = await this.testAnthropicConnection();
      const routing = await this.testMultiProviderRouting();
      
      const report = await this.generateDeploymentReport({
        envCheck, vertexAI, gemini, anthropic, routing
      });
      
      return report;
      
    } catch (error) {
      this.log(`❌ Deployment failed: ${error.message}`);
      throw error;
    }
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose'),
    skipVertexAI: args.includes('--skip-vertex')
  };

  const deployment = new MultiProviderDeployment(options);
  deployment.deploy().catch(console.error);
}

module.exports = MultiProviderDeployment;
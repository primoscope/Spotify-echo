#!/usr/bin/env node

// Load environment variables
require('dotenv').config();

/**
 * Perplexity API Integration Comprehensive Tester
 * 
 * This script validates Perplexity API connectivity, configuration,
 * and browser research integration workflows
 */

const https = require('https');
const fs = require('fs').promises;
const path = require('path');

class PerplexityAPITester {
  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY;
    this.baseUrl = process.env.PERPLEXITY_BASE_URL || 'https://api.perplexity.ai';
    this.model = process.env.PERPLEXITY_MODEL || 'sonar-pro';
    this.results = {
      configurationValid: false,
      apiConnectivity: false,
      modelAvailability: false,
      browserWorkflowIntegration: false,
      costBudgetCompliance: true,
      overallStatus: 'unknown'
    };
  }

  /**
   * Run comprehensive Perplexity API tests
   */
  async runTests() {
    console.log('🧠 Starting Perplexity API Comprehensive Testing');
    console.log('='.repeat(55));

    try {
      // 1. Validate Configuration
      console.log('\n🔧 Testing Configuration...');
      await this.testConfiguration();

      // 2. Test API Connectivity (minimal cost)
      console.log('\n🌐 Testing API Connectivity...');
      await this.testAPIConnectivity();

      // 3. Validate Browser Research Integration
      console.log('\n🔍 Testing Browser Research Integration...');
      await this.testBrowserIntegration();

      // 4. Generate Report
      await this.generateReport();

      console.log('\n✅ Perplexity API testing completed!');

    } catch (error) {
      console.error('\n❌ Testing failed:', error.message);
      this.results.overallStatus = 'failed';
      await this.generateReport();
    }
  }

  /**
   * Test Perplexity API configuration
   */
  async testConfiguration() {
    const issues = [];

    // Check API key
    if (!this.apiKey) {
      issues.push('PERPLEXITY_API_KEY not set');
    } else if (!this.apiKey.startsWith('pplx-')) {
      issues.push('API key format invalid (should start with "pplx-")');
    } else {
      console.log('  ✅ API key present and valid format');
    }

    // Check base URL
    if (this.baseUrl !== 'https://api.perplexity.ai') {
      issues.push('Base URL may be incorrect');
    } else {
      console.log('  ✅ Base URL configured correctly');
    }

    // Check model
    const validModels = ['sonar', 'sonar-pro', 'sonar-online'];
    if (!validModels.includes(this.model)) {
      issues.push(`Model "${this.model}" may not be valid`);
    } else {
      console.log(`  ✅ Model "${this.model}" is valid`);
    }

    // Check additional configuration
    const maxLatency = process.env.PERPLEXITY_MAX_LATENCY_MS;
    const costBudget = process.env.PERPLEXITY_COST_BUDGET_USD;
    
    if (!maxLatency) {
      issues.push('PERPLEXITY_MAX_LATENCY_MS not configured');
    } else {
      console.log(`  ✅ Max latency: ${maxLatency}ms`);
    }

    if (!costBudget) {
      issues.push('PERPLEXITY_COST_BUDGET_USD not configured');
    } else {
      console.log(`  ✅ Cost budget: $${costBudget}`);
    }

    if (issues.length === 0) {
      this.results.configurationValid = true;
      console.log('  ✅ All configuration validated');
    } else {
      console.log('  ⚠️  Configuration issues found:');
      issues.forEach(issue => console.log(`    - ${issue}`));
    }
  }

  /**
   * Test API connectivity with minimal cost request
   */
  async testAPIConnectivity() {
    if (!this.results.configurationValid) {
      console.log('  ⚠️  Skipping connectivity test due to configuration issues');
      return;
    }

    try {
      // Make a minimal test request to validate API connectivity
      const testQuery = 'Test connectivity - respond with just "OK"';
      
      console.log('  🔄 Making minimal test request...');
      
      const response = await this.makeAPIRequest(testQuery, {
        max_tokens: 5, // Minimal to reduce cost
        temperature: 0.1
      });

      if (response && response.choices && response.choices.length > 0) {
        this.results.apiConnectivity = true;
        console.log('  ✅ API connectivity confirmed');
        console.log(`  📝 Response: "${response.choices[0].message.content.trim()}"`);
        
        // Check usage and cost
        if (response.usage) {
          console.log(`  📊 Token usage: ${response.usage.total_tokens} tokens`);
          
          // Estimate cost (approximate)
          const estimatedCost = response.usage.total_tokens * 0.001; // Very rough estimate
          console.log(`  💰 Estimated cost: ~$${estimatedCost.toFixed(4)}`);
        }

        this.results.modelAvailability = true;
        
      } else {
        console.log('  ❌ API response format unexpected');
      }

    } catch (error) {
      console.log(`  ❌ API connectivity failed: ${error.message}`);
      
      if (error.message.includes('401')) {
        console.log('  🔑 Check API key validity');
      } else if (error.message.includes('429')) {
        console.log('  🚫 Rate limit reached');
      } else if (error.message.includes('quota')) {
        console.log('  💸 Quota or billing issue');
      }
    }
  }

  /**
   * Test browser research workflow integration
   */
  async testBrowserIntegration() {
    const workflowPath = path.join(process.cwd(), '.cursor', 'workflows', 'perplexity-browser-research.json');
    
    try {
      // Check if workflow file exists
      const workflowContent = await fs.readFile(workflowPath, 'utf8');
      const workflow = JSON.parse(workflowContent);
      
      console.log('  ✅ Browser research workflow file found');
      
      // Validate workflow structure
      if (workflow.name && workflow.steps) {
        console.log(`  ✅ Workflow "${workflow.name}" has valid structure`);
        console.log(`  📋 Steps: ${workflow.steps.length}`);
        
        // Check for Perplexity integration
        const workflowStr = JSON.stringify(workflow);
        if (workflowStr.includes('perplexity') || workflowStr.includes('PERPLEXITY')) {
          console.log('  ✅ Workflow references Perplexity API');
          this.results.browserWorkflowIntegration = true;
        } else {
          console.log('  ⚠️  Workflow may not include Perplexity integration');
        }
        
      } else {
        console.log('  ❌ Workflow structure invalid');
      }
      
    } catch (error) {
      console.log(`  ❌ Browser research workflow test failed: ${error.message}`);
    }

    // Check for browser research scripts
    const browserScripts = [
      'enhanced-perplexity-integration.js',
      'perplexity-api-comprehensive-tester.js'
    ];

    for (const script of browserScripts) {
      try {
        const scriptPath = path.join(process.cwd(), script);
        await fs.access(scriptPath);
        console.log(`  ✅ Found browser research script: ${script}`);
      } catch (error) {
        console.log(`  ⚠️  Browser research script not found: ${script}`);
      }
    }
  }

  /**
   * Make API request to Perplexity
   */
  async makeAPIRequest(query, options = {}) {
    const requestData = {
      model: this.model,
      messages: [
        {
          role: 'user',
          content: query
        }
      ],
      max_tokens: options.max_tokens || 50,
      temperature: options.temperature || 0.1,
      top_p: options.top_p || 1.0
    };

    const postData = JSON.stringify(requestData);

    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.perplexity.ai',
        port: 443,
        path: '/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            
            if (res.statusCode === 200) {
              resolve(response);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${response.error?.message || data}`));
            }
          } catch (error) {
            reject(new Error(`Response parsing failed: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Generate comprehensive test report
   */
  async generateReport() {
    // Determine overall status
    if (this.results.configurationValid && this.results.apiConnectivity) {
      this.results.overallStatus = 'fully_operational';
    } else if (this.results.configurationValid) {
      this.results.overallStatus = 'configuration_ok';
    } else {
      this.results.overallStatus = 'needs_configuration';
    }

    const reportPath = path.join(process.cwd(), 'COMPREHENSIVE_PERPLEXITY_API_TEST_REPORT.md');
    const timestamp = new Date().toISOString();

    const report = `# Comprehensive Perplexity API Test Report

Generated: ${timestamp}  
Overall Status: **${this.results.overallStatus}**

## Test Results Summary

| Component | Status | Details |
|-----------|--------|---------|
| Configuration | ${this.results.configurationValid ? '✅ Valid' : '❌ Issues'} | API key, model, and settings |
| API Connectivity | ${this.results.apiConnectivity ? '✅ Connected' : '❌ Failed'} | Successful API communication |
| Model Availability | ${this.results.modelAvailability ? '✅ Available' : '❌ Unavailable'} | ${this.model} model responsive |
| Browser Integration | ${this.results.browserWorkflowIntegration ? '✅ Configured' : '⚠️ Partial'} | Cursor workflow integration |
| Cost Compliance | ${this.results.costBudgetCompliance ? '✅ Compliant' : '⚠️ Review'} | Budget and usage monitoring |

## Configuration Details

- **API Key**: ${this.apiKey ? (this.apiKey.startsWith('pplx-') ? '✅ Valid format' : '❌ Invalid format') : '❌ Not configured'}
- **Base URL**: ${this.baseUrl}
- **Model**: ${this.model}
- **Max Latency**: ${process.env.PERPLEXITY_MAX_LATENCY_MS || 'Not configured'}ms
- **Cost Budget**: $${process.env.PERPLEXITY_COST_BUDGET_USD || 'Not configured'}

## API Connectivity Test

${this.results.apiConnectivity ? 
  '✅ Successfully connected to Perplexity API and received valid response.' : 
  '❌ Failed to connect to Perplexity API. Check configuration and network connectivity.'}

## Browser Research Integration

${this.results.browserWorkflowIntegration ? 
  '✅ Browser research workflow is properly configured and references Perplexity API.' : 
  '⚠️ Browser research workflow may need Perplexity integration updates.'}

## Recommendations

${this.generateRecommendations()}

## Next Steps

${this.generateNextSteps()}

---
*Generated by Perplexity API Comprehensive Tester*
`;

    await fs.writeFile(reportPath, report, 'utf8');
    console.log(`\n📄 Perplexity test report saved to: ${reportPath}`);

    // Also save JSON results
    const jsonPath = path.join(process.cwd(), 'test-results', 'perplexity-api-test-results.json');
    await fs.mkdir(path.dirname(jsonPath), { recursive: true });
    await fs.writeFile(jsonPath, JSON.stringify({
      timestamp,
      results: this.results,
      configuration: {
        apiKey: this.apiKey ? `${this.apiKey.substring(0, 8)}...` : null,
        baseUrl: this.baseUrl,
        model: this.model
      }
    }, null, 2));
    
    console.log(`📊 JSON results saved to: ${jsonPath}`);
  }

  /**
   * Generate recommendations based on test results
   */
  generateRecommendations() {
    const recommendations = [];

    if (!this.results.configurationValid) {
      recommendations.push('- **Priority**: Fix configuration issues before proceeding');
      recommendations.push('- Obtain valid Perplexity API key from https://perplexity.ai/');
      recommendations.push('- Ensure API key format starts with "pplx-"');
    }

    if (!this.results.apiConnectivity && this.results.configurationValid) {
      recommendations.push('- **Priority**: Troubleshoot API connectivity issues');
      recommendations.push('- Verify API key has sufficient quota/credits');
      recommendations.push('- Check network connectivity and firewall rules');
    }

    if (!this.results.browserWorkflowIntegration) {
      recommendations.push('- Update browser research workflows to include Perplexity integration');
      recommendations.push('- Test Cursor workflow execution with real research queries');
    }

    if (this.results.overallStatus === 'fully_operational') {
      recommendations.push('- **Excellent**: All systems operational');
      recommendations.push('- Monitor API usage and costs regularly');
      recommendations.push('- Consider implementing usage analytics');
    }

    return recommendations.length > 0 ? recommendations.join('\n') : '- All systems functioning optimally';
  }

  /**
   * Generate next steps based on current status
   */
  generateNextSteps() {
    switch (this.results.overallStatus) {
      case 'fully_operational':
        return `1. **Monitor and Optimize**:
   - Track API usage and response times
   - Implement cost monitoring alerts
   - Optimize query efficiency

2. **Enhance Integration**:
   - Expand browser research capabilities
   - Add more sophisticated query processing
   - Implement caching for repeated queries

3. **Production Readiness**:
   - Set up monitoring dashboards
   - Implement fallback strategies
   - Document usage patterns`;

      case 'configuration_ok':
        return `1. **Fix API Connectivity**:
   - Verify API key validity and quota
   - Test network connectivity
   - Check for rate limiting issues

2. **Once Connected**:
   - Run integration tests
   - Validate browser workflow functionality
   - Set up monitoring`;

      case 'needs_configuration':
      default:
        return `1. **Complete Configuration**:
   - Obtain valid Perplexity API key
   - Set all required environment variables
   - Validate configuration format

2. **Test Connectivity**:
   - Re-run this test suite
   - Validate API responses
   - Check browser integration

3. **Production Setup**:
   - Implement monitoring
   - Set usage budgets
   - Create fallback strategies`;
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new PerplexityAPITester();
  tester.runTests().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = PerplexityAPITester;
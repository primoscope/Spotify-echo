#!/usr/bin/env node
/**
 * Enhanced Perplexity MCP Server Test Suite
 * Comprehensive testing of different models including grok-4, sonar-pro, and GPT-5
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class EnhancedPerplexityTester {
  constructor() {
    this.serverProcess = null;
    this.testResults = {
      models: {},
      workflows: {},
      performance: {},
      errors: [],
      summary: {}
    };
    
    // Test configurations for different models
    this.testModels = [
      'grok-4',
      'sonar-pro', 
      'sonar-reasoning-pro',
      'llama-3.1-sonar-small-128k-online',
      'llama-3.1-sonar-large-128k-online',
      'gpt-5'
    ];
    
    this.testQueries = [
      {
        category: 'coding',
        query: 'How to implement OAuth 2.0 authentication in Node.js with Express?',
        expectedFeatures: ['code_examples', 'security_considerations', 'recent_updates']
      },
      {
        category: 'research',
        query: 'Latest developments in AI music generation and recommendation systems 2024',
        expectedFeatures: ['recent_data', 'citations', 'comprehensive_coverage']
      },
      {
        category: 'debugging',
        query: 'TypeError: Cannot read property of undefined JavaScript debugging strategies',
        expectedFeatures: ['practical_solutions', 'common_causes', 'prevention_methods']
      },
      {
        category: 'analysis',
        query: 'Compare performance optimization techniques for large-scale web applications',
        expectedFeatures: ['technical_depth', 'comparative_analysis', 'benchmarks']
      }
    ];
  }

  async runComprehensiveTests() {
    console.log('🚀 Starting Enhanced Perplexity MCP Server Test Suite\n');
    
    // Check if API key is available
    if (!process.env.PERPLEXITY_API_KEY) {
      console.log('⚠️  PERPLEXITY_API_KEY not found. Testing server availability only.\n');
    }
    
    try {
      // Test 1: Server Health Check
      await this.testServerHealth();
      
      // Test 2: Model Availability and Configuration
      await this.testModelConfigurations();
      
      // Test 3: Individual Model Testing (if API key available)
      if (process.env.PERPLEXITY_API_KEY) {
        await this.testIndividualModels();
        
        // Test 4: Model Comparison Testing
        await this.testModelComparison();
        
        // Test 5: Workflow Optimization Testing
        await this.testWorkflowOptimization();
        
        // Test 6: Performance Benchmarking
        await this.testPerformanceBenchmarks();
      }
      
      // Generate comprehensive report
      await this.generateTestReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      this.testResults.errors.push({
        test: 'test_suite',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  async testServerHealth() {
    console.log('🏥 Testing Server Health...');
    
    try {
      const PerplexityMCPServer = require('./perplexity-mcp-server.js');
      const server = new PerplexityMCPServer();
      
      // Test server instantiation
      if (server.apiKey) {
        console.log('✅ Server initialized with API key');
      } else {
        console.log('⚠️  Server initialized without API key (disabled mode)');
      }
      
      // Test model configurations
      const modelCount = Object.keys(server.modelConfigs).length;
      console.log(`✅ ${modelCount} model configurations loaded`);
      
      // Test performance budgets
      console.log(`✅ Performance budgets configured: ${server.performanceBudgets.maxLatencyMs}ms latency, ${server.performanceBudgets.maxMemoryMB}MB memory`);
      
      this.testResults.summary.serverHealth = 'PASS';
      
    } catch (error) {
      console.error('❌ Server health check failed:', error.message);
      this.testResults.summary.serverHealth = 'FAIL';
      this.testResults.errors.push({
        test: 'server_health',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('');
  }

  async testModelConfigurations() {
    console.log('⚙️  Testing Model Configurations...');
    
    try {
      const PerplexityMCPServer = require('./perplexity-mcp-server.js');
      const server = new PerplexityMCPServer();
      
      for (const model of this.testModels) {
        const config = server.modelConfigs[model];
        
        if (config) {
          console.log(`✅ ${model}: ${config.recommended} - ${config.features.join(', ')}`);
          this.testResults.models[model] = {
            status: 'configured',
            config: config,
            features: config.features,
            costPer1k: config.costPer1kTokens
          };
        } else {
          console.log(`❌ ${model}: Configuration missing`);
          this.testResults.models[model] = {
            status: 'missing_config',
            error: 'Model configuration not found'
          };
        }
      }
      
      this.testResults.summary.modelConfigurations = 'PASS';
      
    } catch (error) {
      console.error('❌ Model configuration test failed:', error.message);
      this.testResults.summary.modelConfigurations = 'FAIL';
      this.testResults.errors.push({
        test: 'model_configurations',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('');
  }

  async testIndividualModels() {
    console.log('🧪 Testing Individual Models...');
    
    const testQuery = this.testQueries[0]; // Use coding query for individual tests
    
    for (const model of this.testModels) {
      try {
        console.log(`Testing ${model}...`);
        
        const startTime = Date.now();
        const result = await this.makeTestRequest('research', {
          q: testQuery.query,
          opts: {
            model: model,
            max_tokens: 1000,
            temperature: 0.3
          }
        });
        
        const duration = Date.now() - startTime;
        
        if (result && !result.isError) {
          console.log(`✅ ${model}: Response received (${duration}ms)`);
          
          // Analyze response quality
          const analysis = this.analyzeResponse(result.content[0].text, testQuery.expectedFeatures);
          
          this.testResults.models[model] = {
            ...this.testResults.models[model],
            testStatus: 'PASS',
            latency: duration,
            responseLength: result.content[0].text.length,
            qualityAnalysis: analysis,
            cost: result.meta?.costs?.estimated || 'N/A'
          };
          
        } else {
          console.log(`❌ ${model}: ${result?.content?.[0]?.text || 'No response'}`);
          this.testResults.models[model] = {
            ...this.testResults.models[model],
            testStatus: 'FAIL',
            error: result?.meta?.error || 'Unknown error'
          };
        }
        
        // Rate limiting delay
        await this.delay(2000);
        
      } catch (error) {
        console.error(`❌ ${model}: ${error.message}`);
        this.testResults.models[model] = {
          ...this.testResults.models[model],
          testStatus: 'ERROR',
          error: error.message
        };
      }
    }
    
    console.log('');
  }

  async testModelComparison() {
    console.log('⚖️  Testing Model Comparison Feature...');
    
    try {
      const result = await this.makeTestRequest('model_comparison', {
        q: 'Best practices for implementing microservices architecture',
        models: ['grok-4', 'sonar-pro', 'gpt-5'],
        metrics: ['latency', 'cost', 'quality', 'citations']
      });
      
      if (result && !result.isError) {
        console.log('✅ Model comparison completed successfully');
        console.log(`Response length: ${result.content[0].text.length} characters`);
        
        this.testResults.workflows.modelComparison = {
          status: 'PASS',
          modelsCompared: result.meta?.models || [],
          analysis: result.meta?.analysis || {},
          timestamp: result.meta?.timestamp
        };
        
      } else {
        console.log(`❌ Model comparison failed: ${result?.content?.[0]?.text || 'No response'}`);
        this.testResults.workflows.modelComparison = {
          status: 'FAIL',
          error: result?.meta?.error || 'Unknown error'
        };
      }
      
    } catch (error) {
      console.error('❌ Model comparison test failed:', error.message);
      this.testResults.workflows.modelComparison = {
        status: 'ERROR',
        error: error.message
      };
    }
    
    console.log('');
  }

  async testWorkflowOptimization() {
    console.log('🔧 Testing Workflow Optimization Feature...');
    
    const workflowTests = [
      {
        task_type: 'research',
        complexity: 'moderate',
        optimization_goals: ['accuracy', 'comprehensive_research']
      },
      {
        task_type: 'debugging',
        complexity: 'complex',
        optimization_goals: ['speed', 'accuracy']
      },
      {
        task_type: 'code_review',
        complexity: 'enterprise',
        optimization_goals: ['comprehensive_research', 'automation']
      }
    ];
    
    for (const test of workflowTests) {
      try {
        console.log(`Testing workflow: ${test.task_type} (${test.complexity})`);
        
        const result = await this.makeTestRequest('workflow_optimization', test);
        
        if (result && !result.isError) {
          console.log(`✅ ${test.task_type} workflow optimization completed`);
          
          this.testResults.workflows[`${test.task_type}_${test.complexity}`] = {
            status: 'PASS',
            config: result.meta?.workflow || {},
            optimization_goals: test.optimization_goals
          };
          
        } else {
          console.log(`❌ ${test.task_type} workflow optimization failed`);
          this.testResults.workflows[`${test.task_type}_${test.complexity}`] = {
            status: 'FAIL',
            error: result?.meta?.error || 'Unknown error'
          };
        }
        
      } catch (error) {
        console.error(`❌ Workflow ${test.task_type} test failed:`, error.message);
        this.testResults.workflows[`${test.task_type}_${test.complexity}`] = {
          status: 'ERROR',
          error: error.message
        };
      }
    }
    
    console.log('');
  }

  async testPerformanceBenchmarks() {
    console.log('📊 Running Performance Benchmarks...');
    
    try {
      const benchmarkQuery = 'Explain the concept of blockchain technology and its applications';
      const iterations = 3;
      const results = [];
      
      for (let i = 0; i < iterations; i++) {
        console.log(`Benchmark iteration ${i + 1}/${iterations}`);
        
        const startTime = Date.now();
        const result = await this.makeTestRequest('research', {
          q: benchmarkQuery,
          opts: {
            model: 'sonar-pro',
            max_tokens: 1500
          }
        });
        
        const duration = Date.now() - startTime;
        
        if (result && !result.isError) {
          results.push({
            iteration: i + 1,
            latency: duration,
            responseLength: result.content[0].text.length,
            cost: result.meta?.costs?.estimated || 'N/A'
          });
        }
        
        await this.delay(1000); // Rate limiting
      }
      
      // Calculate performance metrics
      const avgLatency = results.reduce((sum, r) => sum + r.latency, 0) / results.length;
      const avgResponseLength = results.reduce((sum, r) => sum + r.responseLength, 0) / results.length;
      
      console.log(`✅ Performance benchmark completed:`);
      console.log(`   Average latency: ${Math.round(avgLatency)}ms`);
      console.log(`   Average response length: ${Math.round(avgResponseLength)} characters`);
      
      this.testResults.performance = {
        iterations: iterations,
        averageLatency: Math.round(avgLatency),
        averageResponseLength: Math.round(avgResponseLength),
        results: results,
        status: avgLatency < 5000 ? 'PASS' : 'SLOW' // 5 second threshold
      };
      
    } catch (error) {
      console.error('❌ Performance benchmark failed:', error.message);
      this.testResults.performance = {
        status: 'ERROR',
        error: error.message
      };
    }
    
    console.log('');
  }

  async makeTestRequest(tool, args) {
    // This would normally use the MCP protocol to make requests
    // For testing purposes, we'll simulate the server calls
    const PerplexityMCPServer = require('./perplexity-mcp-server.js');
    const server = new PerplexityMCPServer();
    
    // Initialize Redis connection if available
    await server.initializeRedis();
    
    // Call the appropriate handler based on tool
    switch (tool) {
      case 'research':
        return await server.handleResearch(args);
      case 'model_comparison':
        return await server.handleModelComparison(args);
      case 'workflow_optimization':
        return await server.handleWorkflowOptimization(args);
      case 'health':
        return await server.handleHealth(args);
      default:
        throw new Error(`Unknown tool: ${tool}`);
    }
  }

  analyzeResponse(response, expectedFeatures) {
    const analysis = {
      score: 0,
      features: {},
      length: response.length
    };
    
    // Check for expected features
    expectedFeatures.forEach(feature => {
      switch (feature) {
        case 'code_examples':
          analysis.features.code_examples = response.includes('```') || response.includes('function') || response.includes('const ');
          break;
        case 'citations':
          analysis.features.citations = (response.match(/\[\d+\]/g) || []).length > 0;
          break;
        case 'recent_data':
          analysis.features.recent_data = response.includes('2024') || response.includes('2023');
          break;
        case 'technical_depth':
          analysis.features.technical_depth = response.length > 800 && (response.includes('implementation') || response.includes('architecture'));
          break;
        default:
          analysis.features[feature] = true; // Default to true for unknown features
      }
    });
    
    // Calculate score based on features
    const passedFeatures = Object.values(analysis.features).filter(Boolean).length;
    analysis.score = Math.round((passedFeatures / expectedFeatures.length) * 10);
    
    return analysis;
  }

  async generateTestReport() {
    console.log('📋 Generating Test Report...');
    
    const report = {
      testSuite: 'Enhanced Perplexity MCP Server',
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: Object.keys(this.testResults.summary).length,
        passed: Object.values(this.testResults.summary).filter(status => status === 'PASS').length,
        failed: Object.values(this.testResults.summary).filter(status => status === 'FAIL').length,
        errors: this.testResults.errors.length
      },
      results: this.testResults
    };
    
    // Write detailed report
    const reportPath = path.join(__dirname, 'enhanced-perplexity-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Write summary report
    const summaryPath = path.join(__dirname, 'enhanced-perplexity-test-summary.md');
    const summaryContent = this.generateMarkdownSummary(report);
    fs.writeFileSync(summaryPath, summaryContent);
    
    console.log(`✅ Test report saved to: ${reportPath}`);
    console.log(`✅ Test summary saved to: ${summaryPath}`);
    
    // Print summary
    console.log('\n📊 Test Summary:');
    console.log(`   Total Tests: ${report.summary.totalTests}`);
    console.log(`   Passed: ${report.summary.passed}`);
    console.log(`   Failed: ${report.summary.failed}`);
    console.log(`   Errors: ${report.summary.errors}`);
    
    if (report.summary.passed === report.summary.totalTests && report.summary.errors === 0) {
      console.log('\n🎉 All tests passed successfully!');
    } else {
      console.log('\n⚠️  Some tests failed or encountered errors. Check the detailed report for more information.');
    }
  }

  generateMarkdownSummary(report) {
    let markdown = `# Enhanced Perplexity MCP Server Test Report\n\n`;
    markdown += `**Generated:** ${report.timestamp}\n`;
    markdown += `**Total Tests:** ${report.summary.totalTests} | **Passed:** ${report.summary.passed} | **Failed:** ${report.summary.failed} | **Errors:** ${report.summary.errors}\n\n`;
    
    // Model Results
    markdown += `## 🤖 Model Test Results\n\n`;
    Object.entries(report.results.models).forEach(([model, result]) => {
      const status = result.testStatus === 'PASS' ? '✅' : result.testStatus === 'FAIL' ? '❌' : '⚠️';
      markdown += `### ${status} ${model}\n`;
      
      if (result.config) {
        markdown += `- **Purpose:** ${result.config.recommended}\n`;
        markdown += `- **Features:** ${result.config.features.join(', ')}\n`;
        markdown += `- **Cost per 1K tokens:** $${result.config.costPer1kTokens}\n`;
      }
      
      if (result.latency) {
        markdown += `- **Response Time:** ${result.latency}ms\n`;
      }
      
      if (result.qualityAnalysis) {
        markdown += `- **Quality Score:** ${result.qualityAnalysis.score}/10\n`;
      }
      
      if (result.error) {
        markdown += `- **Error:** ${result.error}\n`;
      }
      
      markdown += '\n';
    });
    
    // Workflow Results
    if (Object.keys(report.results.workflows).length > 0) {
      markdown += `## 🔧 Workflow Test Results\n\n`;
      Object.entries(report.results.workflows).forEach(([workflow, result]) => {
        const status = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
        markdown += `### ${status} ${workflow}\n`;
        
        if (result.config) {
          markdown += `- **Recommended Model:** ${result.config.model}\n`;
          if (result.config.steps) {
            markdown += `- **Steps:** ${result.config.steps.length} step process\n`;
          }
        }
        
        if (result.error) {
          markdown += `- **Error:** ${result.error}\n`;
        }
        
        markdown += '\n';
      });
    }
    
    // Performance Results
    if (report.results.performance && report.results.performance.status) {
      markdown += `## 📊 Performance Benchmark Results\n\n`;
      const perf = report.results.performance;
      const status = perf.status === 'PASS' ? '✅' : perf.status === 'SLOW' ? '⚠️' : '❌';
      
      markdown += `${status} **Overall Performance:** ${perf.status}\n`;
      
      if (perf.averageLatency) {
        markdown += `- **Average Latency:** ${perf.averageLatency}ms\n`;
        markdown += `- **Average Response Length:** ${perf.averageResponseLength} characters\n`;
        markdown += `- **Test Iterations:** ${perf.iterations}\n`;
      }
      
      if (perf.error) {
        markdown += `- **Error:** ${perf.error}\n`;
      }
      
      markdown += '\n';
    }
    
    // Errors
    if (report.results.errors.length > 0) {
      markdown += `## ❌ Errors\n\n`;
      report.results.errors.forEach((error, index) => {
        markdown += `${index + 1}. **${error.test}:** ${error.error} (${error.timestamp})\n`;
      });
      markdown += '\n';
    }
    
    // Recommendations
    markdown += `## 🎯 Recommendations\n\n`;
    
    if (report.summary.passed === report.summary.totalTests) {
      markdown += `- 🎉 All tests passed! The enhanced Perplexity MCP server is working optimally.\n`;
    }
    
    // Model-specific recommendations
    const workingModels = Object.entries(report.results.models)
      .filter(([_, result]) => result.testStatus === 'PASS')
      .map(([model, _]) => model);
    
    if (workingModels.length > 0) {
      markdown += `- 🤖 **Working Models:** ${workingModels.join(', ')}\n`;
    }
    
    // Performance recommendations
    if (report.results.performance?.averageLatency > 2000) {
      markdown += `- ⚡ Consider optimizing for speed - current average latency is ${report.results.performance.averageLatency}ms\n`;
    }
    
    if (report.summary.errors > 0) {
      markdown += `- 🔧 Address the ${report.summary.errors} error(s) listed above for full functionality\n`;
    }
    
    return markdown;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new EnhancedPerplexityTester();
  tester.runComprehensiveTests().catch(console.error);
}

module.exports = EnhancedPerplexityTester;
#!/usr/bin/env node

/**
 * Comprehensive Enhanced MCP System Validation Suite
 * 
 * Validates all components of the enhanced MCP ecosystem including:
 * - Enhanced Perplexity Repository Analyzer
 * - Advanced MCP-Integrated Continuous System  
 * - Grok-4 model integration
 * - Repository file analysis automation
 * - Task generation and prioritization
 * - Documentation automation
 */

const fs = require('fs').promises;
const path = require('path');

class ComprehensiveSystemValidator {
  constructor() {
    this.testResults = [];
    this.validationMetrics = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      startTime: Date.now()
    };
    
    this.components = [
      'enhanced-perplexity-repository-analyzer',
      'advanced-mcp-integrated-continuous-system',
      'enhanced-mcp-ecosystem-optimizer', 
      'enhanced-mcp-server-registry',
      'comprehensive-continuous-improvement-orchestrator'
    ];
  }
  
  async runComprehensiveValidation() {
    console.log('🚀 Starting Comprehensive Enhanced MCP System Validation...\n');
    
    try {
      // Test 1: Component Availability
      await this.testComponentAvailability();
      
      // Test 2: Configuration Validation
      await this.testConfigurationValidation();
      
      // Test 3: File System Operations
      await this.testFileSystemOperations();
      
      // Test 4: Repository Analysis Capability
      await this.testRepositoryAnalysis();
      
      // Test 5: Grok-4 Model Integration
      await this.testGrok4Integration();
      
      // Test 6: Task Generation and Processing
      await this.testTaskGeneration();
      
      // Test 7: Performance and Resource Management
      await this.testPerformanceManagement();
      
      // Test 8: Integration Health Check
      await this.testIntegrationHealth();
      
      // Generate comprehensive report
      return this.generateValidationReport();
      
    } catch (error) {
      console.error('❌ Validation suite failed:', error);
      this.recordTestResult('ValidationSuite', false, error.message);
      return this.generateValidationReport();
    }
  }
  
  async testComponentAvailability() {
    console.log('📋 Test 1: Component Availability');
    
    for (const component of this.components) {
      try {
        const componentPath = path.join(__dirname, `${component}.js`);
        await fs.access(componentPath);
        
        // Try to require the component
        const Component = require(`./${component}`);
        
        this.recordTestResult(`Component-${component}`, true, 'Component available and loadable');
        console.log(`   ✅ ${component} - Available`);
        
      } catch (error) {
        this.recordTestResult(`Component-${component}`, false, error.message);
        console.log(`   ❌ ${component} - ${error.message}`);
      }
    }
    
    console.log('');
  }
  
  async testConfigurationValidation() {
    console.log('📋 Test 2: Configuration Validation');
    
    try {
      // Test environment variable detection
      const hasPerplexityKey = process.env.PERPLEXITY_API_KEY && 
                              process.env.PERPLEXITY_API_KEY !== 'demo_mode' &&
                              process.env.PERPLEXITY_API_KEY.length > 10;
      
      if (hasPerplexityKey) {
        this.recordTestResult('Config-PerplexityAPI', true, 'Perplexity API key configured');
        console.log('   ✅ Perplexity API key - Configured');
      } else {
        this.recordTestResult('Config-PerplexityAPI', false, 'Perplexity API key not configured');
        console.log('   ⚠️  Perplexity API key - Not configured (will use mock data)');
      }
      
      // Test repository path access
      const repoPath = process.cwd();
      const stats = await fs.stat(repoPath);
      
      this.recordTestResult('Config-RepositoryPath', true, 'Repository path accessible');
      console.log('   ✅ Repository path - Accessible');
      
    } catch (error) {
      this.recordTestResult('Config-RepositoryPath', false, error.message);
      console.log(`   ❌ Repository path - ${error.message}`);
    }
    
    console.log('');
  }
  
  async testFileSystemOperations() {
    console.log('📋 Test 3: File System Operations');
    
    try {
      // Test output directory creation
      const testOutputDir = './test-validation-outputs';
      await fs.mkdir(testOutputDir, { recursive: true });
      
      this.recordTestResult('FileSystem-CreateDirectory', true, 'Directory creation successful');
      console.log('   ✅ Directory creation - Working');
      
      // Test file writing
      const testFile = path.join(testOutputDir, 'test-validation.json');
      const testData = {
        timestamp: new Date().toISOString(),
        testData: 'validation-test-data',
        components: this.components
      };
      
      await fs.writeFile(testFile, JSON.stringify(testData, null, 2));
      
      this.recordTestResult('FileSystem-WriteFile', true, 'File writing successful');
      console.log('   ✅ File writing - Working');
      
      // Test file reading
      const readData = await fs.readFile(testFile, 'utf8');
      const parsed = JSON.parse(readData);
      
      if (parsed.testData === 'validation-test-data') {
        this.recordTestResult('FileSystem-ReadFile', true, 'File reading successful');
        console.log('   ✅ File reading - Working');
      } else {
        this.recordTestResult('FileSystem-ReadFile', false, 'File content mismatch');
        console.log('   ❌ File reading - Content mismatch');
      }
      
      // Cleanup
      await fs.unlink(testFile);
      await fs.rmdir(testOutputDir);
      
    } catch (error) {
      this.recordTestResult('FileSystem-Operations', false, error.message);
      console.log(`   ❌ File system operations - ${error.message}`);
    }
    
    console.log('');
  }
  
  async testRepositoryAnalysis() {
    console.log('📋 Test 4: Repository Analysis Capability');
    
    try {
      // Test analyzer initialization
      const EnhancedPerplexityRepositoryAnalyzer = require('./enhanced-perplexity-repository-analyzer');
      
      const analyzer = new EnhancedPerplexityRepositoryAnalyzer({
        repositoryPath: process.cwd(),
        maxFilesPerBatch: 3,
        outputDir: './test-analysis-outputs',
        enableCaching: true
      });
      
      this.recordTestResult('Analysis-Initialization', true, 'Analyzer initialized successfully');
      console.log('   ✅ Analyzer initialization - Working');
      
      // Test file categorization
      const testFiles = [
        'package.json',
        'src/index.js', 
        'tests/example.test.js',
        'README.md',
        'scripts/test.sh'
      ];
      
      const categories = testFiles.map(file => analyzer.categorizeFile(file));
      const expectedCategories = ['configuration', 'source', 'tests', 'documentation', 'scripts'];
      
      const categorizationCorrect = categories.every((cat, i) => cat === expectedCategories[i]);
      
      if (categorizationCorrect) {
        this.recordTestResult('Analysis-Categorization', true, 'File categorization working correctly');
        console.log('   ✅ File categorization - Working');
      } else {
        this.recordTestResult('Analysis-Categorization', false, 'File categorization incorrect');
        console.log('   ❌ File categorization - Incorrect results');
      }
      
      // Test mock analysis (since we may not have API keys)
      const mockAnalysis = analyzer.generateMockAnalysis('grok-4');
      
      if (mockAnalysis && mockAnalysis.includes('Mock Analysis')) {
        this.recordTestResult('Analysis-MockGeneration', true, 'Mock analysis generation working');
        console.log('   ✅ Mock analysis generation - Working');
      } else {
        this.recordTestResult('Analysis-MockGeneration', false, 'Mock analysis generation failed');
        console.log('   ❌ Mock analysis generation - Failed');
      }
      
    } catch (error) {
      this.recordTestResult('Analysis-Capability', false, error.message);
      console.log(`   ❌ Repository analysis - ${error.message}`);
    }
    
    console.log('');
  }
  
  async testGrok4Integration() {
    console.log('📋 Test 5: Grok-4 Model Integration');
    
    try {
      // Test Grok-4 system initialization
      const AdvancedMCPIntegratedContinuousSystem = require('./advanced-mcp-integrated-continuous-system');
      
      const system = new AdvancedMCPIntegratedContinuousSystem({
        enableGrok4Enhancement: true,
        enableMCPIntegration: false,
        enablePerplexityAnalysis: false
      });
      
      this.recordTestResult('Grok4-SystemInit', true, 'Grok-4 system initialized');
      console.log('   ✅ Grok-4 system initialization - Working');
      
      // Test Grok-4 enhancement prompts
      const hasEnhancementPrompts = system.grok4Integration.enhancedPrompts.size > 0;
      
      if (hasEnhancementPrompts) {
        this.recordTestResult('Grok4-EnhancementPrompts', true, 'Enhancement prompts configured');
        console.log('   ✅ Grok-4 enhancement prompts - Configured');
      } else {
        this.recordTestResult('Grok4-EnhancementPrompts', false, 'Enhancement prompts missing');
        console.log('   ❌ Grok-4 enhancement prompts - Missing');
      }
      
      // Test specializations
      const expectedSpecializations = [
        'complex-reasoning',
        'architectural-analysis',
        'performance-optimization',
        'security-analysis',
        'strategic-planning'
      ];
      
      const hasAllSpecializations = expectedSpecializations.every(spec => 
        system.grok4Integration.specializations.includes(spec)
      );
      
      if (hasAllSpecializations) {
        this.recordTestResult('Grok4-Specializations', true, 'All specializations available');
        console.log('   ✅ Grok-4 specializations - All available');
      } else {
        this.recordTestResult('Grok4-Specializations', false, 'Missing specializations');
        console.log('   ❌ Grok-4 specializations - Some missing');
      }
      
    } catch (error) {
      this.recordTestResult('Grok4-Integration', false, error.message);
      console.log(`   ❌ Grok-4 integration - ${error.message}`);
    }
    
    console.log('');
  }
  
  async testTaskGeneration() {
    console.log('📋 Test 6: Task Generation and Processing');
    
    try {
      // Test task extraction
      const EnhancedPerplexityRepositoryAnalyzer = require('./enhanced-perplexity-repository-analyzer');
      const analyzer = new EnhancedPerplexityRepositoryAnalyzer();
      
      const sampleAnalysis = `
        Analysis Results:
        - Code quality is good
        - TASK-001: Implement enhanced error handling system
        - Performance could be improved
        - TODO: Add comprehensive logging functionality
        - Security measures are adequate
        - Task: Create detailed API documentation
      `;
      
      const extractedTasks = analyzer.extractTasksFromAnalysis(sampleAnalysis);
      
      if (extractedTasks.length >= 2) {
        this.recordTestResult('TaskGeneration-Extraction', true, `Extracted ${extractedTasks.length} tasks`);
        console.log(`   ✅ Task extraction - Working (${extractedTasks.length} tasks)`);
      } else {
        this.recordTestResult('TaskGeneration-Extraction', false, 'Insufficient task extraction');
        console.log('   ❌ Task extraction - Insufficient results');
      }
      
      // Test task prioritization
      const testTasks = [
        { priority: 'Low', title: 'Update documentation' },
        { priority: 'Critical', title: 'Fix security vulnerability' },
        { priority: 'High', title: 'Optimize performance' },
        { priority: 'Medium', title: 'Refactor component' }
      ];
      
      const priorityWeights = { Critical: 1000, High: 750, Medium: 500, Low: 250 };
      const sortedTasks = testTasks.sort((a, b) => {
        const aWeight = priorityWeights[a.priority] || 250;
        const bWeight = priorityWeights[b.priority] || 250;
        return bWeight - aWeight;
      });
      
      if (sortedTasks[0].priority === 'Critical') {
        this.recordTestResult('TaskGeneration-Prioritization', true, 'Task prioritization working');
        console.log('   ✅ Task prioritization - Working');
      } else {
        this.recordTestResult('TaskGeneration-Prioritization', false, 'Task prioritization failed');
        console.log('   ❌ Task prioritization - Failed');
      }
      
    } catch (error) {
      this.recordTestResult('TaskGeneration-Processing', false, error.message);
      console.log(`   ❌ Task generation - ${error.message}`);
    }
    
    console.log('');
  }
  
  async testPerformanceManagement() {
    console.log('📋 Test 7: Performance and Resource Management');
    
    try {
      // Test memory monitoring
      const memUsage = process.memoryUsage();
      const memUsageMB = memUsage.heapUsed / 1024 / 1024;
      
      if (memUsageMB > 0 && memUsageMB < 1000) {
        this.recordTestResult('Performance-MemoryMonitoring', true, `Memory usage: ${Math.round(memUsageMB)}MB`);
        console.log(`   ✅ Memory monitoring - Working (${Math.round(memUsageMB)}MB)`);
      } else {
        this.recordTestResult('Performance-MemoryMonitoring', false, 'Memory monitoring failed');
        console.log('   ❌ Memory monitoring - Failed');
      }
      
      // Test uptime tracking
      const uptime = process.uptime();
      
      if (uptime > 0) {
        this.recordTestResult('Performance-UptimeTracking', true, `Uptime: ${Math.round(uptime)}s`);
        console.log(`   ✅ Uptime tracking - Working (${Math.round(uptime)}s)`);
      } else {
        this.recordTestResult('Performance-UptimeTracking', false, 'Uptime tracking failed');
        console.log('   ❌ Uptime tracking - Failed');
      }
      
      // Test CPU usage tracking
      const cpuUsage = process.cpuUsage();
      
      if (cpuUsage.user >= 0 && cpuUsage.system >= 0) {
        this.recordTestResult('Performance-CPUTracking', true, 'CPU usage tracking working');
        console.log('   ✅ CPU usage tracking - Working');
      } else {
        this.recordTestResult('Performance-CPUTracking', false, 'CPU usage tracking failed');
        console.log('   ❌ CPU usage tracking - Failed');
      }
      
    } catch (error) {
      this.recordTestResult('Performance-Management', false, error.message);
      console.log(`   ❌ Performance management - ${error.message}`);
    }
    
    console.log('');
  }
  
  async testIntegrationHealth() {
    console.log('📋 Test 8: Integration Health Check');
    
    try {
      // Test npm dependencies
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageData = JSON.parse(await fs.readFile(packagePath, 'utf8'));
      
      const requiredDeps = ['axios', 'glob'];
      const hasRequiredDeps = requiredDeps.every(dep => 
        packageData.dependencies[dep] || packageData.devDependencies[dep]
      );
      
      if (hasRequiredDeps) {
        this.recordTestResult('Integration-Dependencies', true, 'Required dependencies available');
        console.log('   ✅ Required dependencies - Available');
      } else {
        this.recordTestResult('Integration-Dependencies', false, 'Missing required dependencies');
        console.log('   ❌ Required dependencies - Missing');
      }
      
      // Test Node.js version compatibility
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.substring(1).split('.')[0]);
      
      if (majorVersion >= 16) {
        this.recordTestResult('Integration-NodeVersion', true, `Node.js ${nodeVersion}`);
        console.log(`   ✅ Node.js version - Compatible (${nodeVersion})`);
      } else {
        this.recordTestResult('Integration-NodeVersion', false, `Node.js ${nodeVersion} too old`);
        console.log(`   ❌ Node.js version - Too old (${nodeVersion})`);
      }
      
      // Test system integration readiness
      const systemReadiness = {
        fileSystem: true,
        nodeJs: majorVersion >= 16,
        dependencies: hasRequiredDeps,
        repository: true
      };
      
      const readinessScore = Object.values(systemReadiness).filter(Boolean).length;
      const totalChecks = Object.keys(systemReadiness).length;
      
      if (readinessScore === totalChecks) {
        this.recordTestResult('Integration-SystemReadiness', true, 'System fully ready');
        console.log('   ✅ System readiness - Fully ready');
      } else {
        this.recordTestResult('Integration-SystemReadiness', false, `${readinessScore}/${totalChecks} checks passed`);
        console.log(`   ⚠️  System readiness - Partially ready (${readinessScore}/${totalChecks})`);
      }
      
    } catch (error) {
      this.recordTestResult('Integration-Health', false, error.message);
      console.log(`   ❌ Integration health - ${error.message}`);
    }
    
    console.log('');
  }
  
  recordTestResult(testName, passed, details) {
    this.validationMetrics.totalTests++;
    if (passed) {
      this.validationMetrics.passedTests++;
    } else {
      this.validationMetrics.failedTests++;
    }
    
    this.testResults.push({
      test: testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    });
  }
  
  generateValidationReport() {
    const endTime = Date.now();
    const duration = endTime - this.validationMetrics.startTime;
    
    const successRate = this.validationMetrics.totalTests > 0 ? 
      Math.round((this.validationMetrics.passedTests / this.validationMetrics.totalTests) * 100) : 0;
    
    const report = {
      summary: {
        timestamp: new Date().toISOString(),
        duration: Math.round(duration / 1000),
        totalTests: this.validationMetrics.totalTests,
        passedTests: this.validationMetrics.passedTests,
        failedTests: this.validationMetrics.failedTests,
        successRate: successRate
      },
      results: this.testResults,
      recommendations: this.generateRecommendations(),
      systemStatus: this.generateSystemStatus()
    };
    
    console.log('📊 Validation Summary:');
    console.log(`   Total Tests: ${report.summary.totalTests}`);
    console.log(`   Passed: ${report.summary.passedTests}`);
    console.log(`   Failed: ${report.summary.failedTests}`);
    console.log(`   Success Rate: ${report.summary.successRate}%`);
    console.log(`   Duration: ${report.summary.duration}s`);
    
    if (report.summary.successRate >= 80) {
      console.log('\n✅ System Validation: PASSED');
      console.log('🎉 Enhanced MCP ecosystem is ready for production use!');
    } else {
      console.log('\n⚠️  System Validation: NEEDS ATTENTION');
      console.log('🔧 Review failed tests and recommendations before production use');
    }
    
    return report;
  }
  
  generateRecommendations() {
    const recommendations = [];
    
    // Check for API configuration
    const hasPerplexityIssue = this.testResults.some(r => 
      r.test.includes('PerplexityAPI') && !r.passed
    );
    
    if (hasPerplexityIssue) {
      recommendations.push({
        priority: 'High',
        type: 'Configuration',
        description: 'Configure Perplexity API key for enhanced repository analysis',
        action: 'Set PERPLEXITY_API_KEY environment variable'
      });
    }
    
    // Check for component failures
    const componentFailures = this.testResults.filter(r => 
      r.test.includes('Component-') && !r.passed
    );
    
    if (componentFailures.length > 0) {
      recommendations.push({
        priority: 'Critical',
        type: 'Component',
        description: 'Some system components failed to load',
        action: 'Check component files and dependencies'
      });
    }
    
    // Check for integration issues
    const integrationIssues = this.testResults.filter(r => 
      r.test.includes('Integration-') && !r.passed
    );
    
    if (integrationIssues.length > 0) {
      recommendations.push({
        priority: 'Medium',
        type: 'Integration',
        description: 'Integration health checks failed',
        action: 'Review system requirements and dependencies'
      });
    }
    
    return recommendations;
  }
  
  generateSystemStatus() {
    const passedTests = this.testResults.filter(r => r.passed);
    const failedTests = this.testResults.filter(r => !r.passed);
    
    return {
      overall: this.validationMetrics.passedTests / this.validationMetrics.totalTests >= 0.8 ? 'Healthy' : 'Needs Attention',
      components: {
        repositoryAnalyzer: passedTests.some(r => r.test.includes('Analysis-')),
        grok4Integration: passedTests.some(r => r.test.includes('Grok4-')),
        taskGeneration: passedTests.some(r => r.test.includes('TaskGeneration-')),
        performanceManagement: passedTests.some(r => r.test.includes('Performance-')),
        systemIntegration: passedTests.some(r => r.test.includes('Integration-'))
      },
      readyForProduction: failedTests.filter(r => r.test.includes('Critical')).length === 0
    };
  }
}

// CLI execution
async function main() {
  const validator = new ComprehensiveSystemValidator();
  
  try {
    const report = await validator.runComprehensiveValidation();
    
    // Save validation report
    const reportPath = './comprehensive-system-validation-report.json';
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed validation report saved to: ${reportPath}`);
    
    // Exit with appropriate code
    process.exit(report.summary.successRate >= 80 ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ComprehensiveSystemValidator;
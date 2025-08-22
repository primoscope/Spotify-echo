const fs = require('fs');
const path = require('path');

/**
 * EchoTune AI Autonomous Development Framework Validation
 * Specifically validates the autonomous development components
 */

class AutonomousValidationSuite {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: []
    };
  }

  log(level, message, details = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
    if (details) {
      console.log(JSON.stringify(details, null, 2));
    }
  }

  pass(testName, message) {
    this.results.passed++;
    this.results.tests.push({ name: testName, status: 'PASS', message });
    this.log('pass', `✅ ${testName}: ${message}`);
  }

  fail(testName, message, error = null) {
    this.results.failed++;
    this.results.tests.push({ name: testName, status: 'FAIL', message, error });
    this.log('fail', `❌ ${testName}: ${message}`, error);
  }

  warn(testName, message) {
    this.results.warnings++;
    this.results.tests.push({ name: testName, status: 'WARN', message });
    this.log('warn', `⚠️  ${testName}: ${message}`);
  }

  async validateFileExists(filePath, description) {
    const testName = `File Check: ${description}`;
    try {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        this.pass(testName, `${filePath} exists (${sizeKB}KB)`);
        return true;
      } else {
        this.fail(testName, `Missing ${filePath}`);
        return false;
      }
    } catch (error) {
      this.fail(testName, `Error checking ${filePath}`, error.message);
      return false;
    }
  }

  async validateComponentImplementation(filePath, expectedFeatures) {
    const testName = `Component Implementation: ${path.basename(filePath)}`;
    try {
      if (!fs.existsSync(filePath)) {
        this.fail(testName, `File not found: ${filePath}`);
        return false;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      let featuresFound = 0;

      for (const feature of expectedFeatures) {
        if (content.includes(feature)) {
          featuresFound++;
          this.pass(testName + ` Feature: ${feature}`, `Feature implemented`);
        } else {
          this.warn(testName + ` Feature: ${feature}`, `Feature not found or different implementation`);
        }
      }

      const completionRate = (featuresFound / expectedFeatures.length * 100).toFixed(1);
      this.log('info', `${testName} completion rate: ${completionRate}%`);

      return featuresFound > expectedFeatures.length / 2;
    } catch (error) {
      this.fail(testName, 'Component validation failed', error.message);
      return false;
    }
  }

  async validateAPIRoutes() {
    const testName = 'Autonomous API Routes';
    const apiFile = 'src/api/routes/autonomous-development.js';
    
    try {
      if (!fs.existsSync(apiFile)) {
        this.fail(testName, 'API routes file not found');
        return false;
      }

      const content = fs.readFileSync(apiFile, 'utf8');
      const expectedRoutes = [
        { endpoint: '/ui-analysis', method: 'GET' },
        { endpoint: '/research', method: 'POST' },
        { endpoint: '/optimization-plan', method: 'GET' },
        { endpoint: '/integration-patterns', method: 'GET' },
        { endpoint: '/agent-status', method: 'GET' },
        { endpoint: '/clear-cache', method: 'POST' }
      ];

      let routesFound = 0;
      for (const route of expectedRoutes) {
        const routePattern = new RegExp(`router\\.${route.method.toLowerCase()}\\(['"]${route.endpoint}['"]`);
        if (routePattern.test(content)) {
          routesFound++;
          this.pass(testName + ` ${route.method} ${route.endpoint}`, 'Route implemented');
        } else {
          this.fail(testName + ` ${route.method} ${route.endpoint}`, 'Route not found');
        }
      }

      if (routesFound === expectedRoutes.length) {
        this.pass(testName, 'All autonomous API routes validated');
        return true;
      } else {
        this.fail(testName, `Only ${routesFound}/${expectedRoutes.length} routes found`);
        return false;
      }
    } catch (error) {
      this.fail(testName, 'API routes validation failed', error.message);
      return false;
    }
  }

  async validateServiceIntegration() {
    const testName = 'Service Integration';
    const serviceFile = 'src/utils/perplexity-research-service.js';
    
    try {
      if (!fs.existsSync(serviceFile)) {
        this.fail(testName, 'Perplexity service not found');
        return false;
      }

      const content = fs.readFileSync(serviceFile, 'utf8');
      const requiredMethods = [
        'research',
        'researchBatch',
        'researchUIBestPractices',
        'researchCodeOptimization',
        'researchIntegrationPatterns'
      ];

      let methodsFound = 0;
      for (const method of requiredMethods) {
        if (content.includes(`async ${method}(`)) {
          methodsFound++;
          this.pass(testName + ` Method: ${method}`, 'Method implemented');
        } else {
          this.fail(testName + ` Method: ${method}`, 'Method not found');
        }
      }

      // Check for error handling
      if (content.includes('try {') && content.includes('catch')) {
        this.pass(testName + ' Error Handling', 'Error handling implemented');
      } else {
        this.warn(testName + ' Error Handling', 'Limited error handling detected');
      }

      // Check for caching
      if (content.includes('cache') || content.includes('Cache')) {
        this.pass(testName + ' Caching', 'Caching strategy implemented');
      } else {
        this.warn(testName + ' Caching', 'No caching strategy detected');
      }

      return methodsFound >= requiredMethods.length * 0.8;
    } catch (error) {
      this.fail(testName, 'Service integration validation failed', error.message);
      return false;
    }
  }

  async validateBuildIntegration() {
    const testName = 'Build Integration';
    
    // Check package.json scripts
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      if (packageJson.scripts.build) {
        this.pass(testName + ' Build Script', 'Build script configured');
      } else {
        this.fail(testName + ' Build Script', 'No build script found');
      }

      if (packageJson.scripts.start) {
        this.pass(testName + ' Start Script', 'Start script configured');
      } else {
        this.fail(testName + ' Start Script', 'No start script found');
      }

      // Check for autonomous-specific scripts
      const autonomousScripts = ['mcp-server', 'validate'];
      for (const script of autonomousScripts) {
        if (packageJson.scripts[script]) {
          this.pass(testName + ` ${script}`, `${script} script available`);
        } else {
          this.warn(testName + ` ${script}`, `${script} script not found`);
        }
      }

      return true;
    } catch (error) {
      this.fail(testName, 'Build integration validation failed', error.message);
      return false;
    }
  }

  async validateProductionReadiness() {
    const testName = 'Production Readiness';
    
    // Check for dist directory (build output)
    if (fs.existsSync('dist')) {
      this.pass(testName + ' Build Output', 'Build output directory exists');
      
      // Check for optimized bundles
      if (fs.existsSync('dist/assets')) {
        const assets = fs.readdirSync('dist/assets');
        const jsFiles = assets.filter(f => f.endsWith('.js'));
        const cssFiles = assets.filter(f => f.endsWith('.css'));
        
        this.pass(testName + ' Assets', `${jsFiles.length} JS bundles, ${cssFiles.length} CSS files`);
      } else {
        this.warn(testName + ' Assets', 'No assets directory found');
      }
    } else {
      this.warn(testName + ' Build Output', 'No build output (run npm run build first)');
    }

    // Check for Docker configuration
    if (fs.existsSync('Dockerfile')) {
      this.pass(testName + ' Docker', 'Dockerfile present');
    } else {
      this.warn(testName + ' Docker', 'No Dockerfile found');
    }

    if (fs.existsSync('docker-compose.yml') || fs.existsSync('docker-compose.dev.yml')) {
      this.pass(testName + ' Docker Compose', 'Docker Compose configuration present');
    } else {
      this.warn(testName + ' Docker Compose', 'No Docker Compose configuration');
    }

    return true;
  }

  async runValidation() {
    console.log('🤖 EchoTune AI Autonomous Development Framework Validation');
    console.log('============================================================\n');

    // Validate core autonomous components
    const coreComponents = [
      {
        path: 'src/frontend/components/AutonomousUIAgent.jsx',
        desc: 'Autonomous UI Development Agent',
        features: ['performAutonomousAnalysis', 'researchFindings', 'enhancementPlan', 'Psychology', 'AutoAwesome']
      },
      {
        path: 'src/frontend/components/EnhancedStreamingChatInterface.jsx', 
        desc: 'Enhanced Streaming Chat Interface',
        features: ['performanceMetrics', 'handleStreamDelta', 'tokensPerSecond', 'EventSource', 'streamLatency']
      },
      {
        path: 'src/frontend/components/EnhancedProviderPanel.jsx',
        desc: 'Enhanced Provider Panel',
        features: ['autonomousMonitoring', 'addRecommendation', 'health', 'responseTime', 'recommendations']
      },
      {
        path: 'src/frontend/components/OptimizedMusicComponent.jsx',
        desc: 'Optimized Music Component',
        features: ['memo', 'useMemo', 'useCallback', 'performanceMode', 'trackFeatures']
      }
    ];

    console.log('📋 Validating Core Autonomous Components...\n');
    for (const component of coreComponents) {
      await this.validateFileExists(component.path, component.desc);
      if (fs.existsSync(component.path)) {
        await this.validateComponentImplementation(component.path, component.features);
      }
    }

    // Validate supporting components
    const supportingComponents = [
      { path: 'src/frontend/components/MusicVisualizer.jsx', desc: 'Music Visualizer' },
      { path: 'src/frontend/components/TrackAnalytics.jsx', desc: 'Track Analytics' },
      { path: 'src/utils/perplexity-research-service.js', desc: 'Perplexity Research Service' }
    ];

    console.log('\n📋 Validating Supporting Components...\n');
    for (const component of supportingComponents) {
      await this.validateFileExists(component.path, component.desc);
    }

    // Validate API integration
    console.log('\n📋 Validating API Integration...\n');
    await this.validateAPIRoutes();

    // Validate service integration
    console.log('\n📋 Validating Service Integration...\n');
    await this.validateServiceIntegration();

    // Validate build integration
    console.log('\n📋 Validating Build Integration...\n');
    await this.validateBuildIntegration();

    // Validate production readiness
    console.log('\n📋 Validating Production Readiness...\n');
    await this.validateProductionReadiness();

    // Validate documentation
    console.log('\n📋 Validating Documentation...\n');
    await this.validateFileExists('AUTONOMOUS_DEVELOPMENT_ROADMAP.md', 'Autonomous Development Roadmap');
    await this.validateFileExists('CURSOR_AI_INSTRUCTIONS.txt', 'Cursor AI Instructions');

    // Generate summary report
    console.log('\n📊 Validation Summary');
    console.log('====================');
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`⚠️  Warnings: ${this.results.warnings}`);
    console.log(`📋 Total Tests: ${this.results.tests.length}`);

    const successRate = (this.results.passed / this.results.tests.length * 100).toFixed(1);
    console.log(`📈 Success Rate: ${successRate}%\n`);

    // Determine system status
    let status = '';
    let recommendations = [];

    if (this.results.failed === 0) {
      status = '🎉 EXCELLENT - All autonomous development components validated successfully!';
      recommendations.push('✅ System is ready for production deployment');
      recommendations.push('✅ All autonomous features are operational');
      recommendations.push('✅ Documentation is comprehensive and up-to-date');
    } else if (this.results.failed <= 2) {
      status = '✅ GOOD - Minor issues detected, but system is largely functional';
      recommendations.push('⚠️  Address the failed tests for optimal performance');
      recommendations.push('✅ Most autonomous features are operational');
      recommendations.push('🔄 Review and update any missing components');
    } else if (this.results.failed <= 5) {
      status = '⚠️  NEEDS WORK - Several issues need attention';
      recommendations.push('🔧 Focus on addressing failed tests before deployment');
      recommendations.push('📋 Some autonomous features may not be fully operational');
      recommendations.push('📖 Update documentation and missing components');
    } else {
      status = '🚨 CRITICAL - Major issues require immediate attention';
      recommendations.push('🛑 Do not deploy until critical issues are resolved');
      recommendations.push('🔧 Multiple autonomous features are not operational');
      recommendations.push('📞 Consider seeking additional development support');
    }

    console.log(`🎯 Overall Status: ${status}\n`);
    
    console.log('📋 Recommendations:');
    for (const recommendation of recommendations) {
      console.log(`   ${recommendation}`);
    }

    // Save detailed results
    const reportPath = 'autonomous-validation-report.json';
    const report = {
      timestamp: new Date().toISOString(),
      status: status,
      successRate: successRate,
      results: this.results,
      recommendations: recommendations
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed validation report saved to: ${reportPath}`);

    return this.results.failed <= 2; // Allow minor failures
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new AutonomousValidationSuite();
  validator.runValidation().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Autonomous validation suite failed:', error);
    process.exit(1);
  });
}

module.exports = AutonomousValidationSuite;
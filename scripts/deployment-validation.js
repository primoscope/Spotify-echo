#!/usr/bin/env node

/**
 * EchoTune AI Deployment and Authentication Validation Script
 * Comprehensive testing of all deployment components, authentication, and tools
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DeploymentValidator {
  constructor() {
    this.results = {
      environment: [],
      authentication: [],
      tools: [],
      deployment: [],
      tests: [],
      overall: 'UNKNOWN'
    };
  }

  /**
   * Log result with color coding
   */
  logResult(category, test, status, message = '') {
    const symbols = {
      PASS: '✅',
      FAIL: '❌',
      WARN: '⚠️',
      INFO: 'ℹ️'
    };
    
    const result = {
      test,
      status,
      message,
      timestamp: new Date().toISOString()
    };
    
    this.results[category].push(result);
    console.log(`${symbols[status]} ${test}: ${message}`);
  }

  /**
   * Run command and capture output
   */
  runCommand(command, options = {}) {
    try {
      const output = execSync(command, { 
        encoding: 'utf8', 
        stdio: options.silent ? ['pipe', 'pipe', 'pipe'] : ['pipe', 'pipe', 'inherit'],
        ...options 
      });
      return { success: true, output: output.trim() };
    } catch (error) {
      return { 
        success: false, 
        output: error.stdout ? error.stdout.trim() : '',
        error: error.message 
      };
    }
  }

  /**
   * Check environment configuration
   */
  checkEnvironment() {
    console.log('\n🔧 Checking Environment Configuration...\n');

    // Check Node.js version
    const nodeResult = this.runCommand('node --version');
    if (nodeResult.success) {
      const version = nodeResult.output.replace('v', '');
      const majorVersion = parseInt(version.split('.')[0]);
      if (majorVersion >= 18) {
        this.logResult('environment', 'Node.js Version', 'PASS', `${nodeResult.output} (>= 18 required)`);
      } else {
        this.logResult('environment', 'Node.js Version', 'FAIL', `${nodeResult.output} (>= 18 required)`);
      }
    } else {
      this.logResult('environment', 'Node.js Version', 'FAIL', 'Node.js not found');
    }

    // Check npm version
    const npmResult = this.runCommand('npm --version');
    if (npmResult.success) {
      this.logResult('environment', 'npm Version', 'PASS', `v${npmResult.output}`);
    } else {
      this.logResult('environment', 'npm Version', 'FAIL', 'npm not found');
    }

    // Check package.json
    const packagePath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packagePath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        this.logResult('environment', 'package.json', 'PASS', `Found EchoTune AI v${pkg.version}`);
      } catch (error) {
        this.logResult('environment', 'package.json', 'FAIL', 'Invalid package.json');
      }
    } else {
      this.logResult('environment', 'package.json', 'FAIL', 'package.json not found');
    }

    // Check .env file
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const hasDoToken = envContent.includes('DO_PAT=');
      const hasSpotifyId = envContent.includes('SPOTIFY_CLIENT_ID=');
      
      this.logResult('environment', '.env File', 'PASS', 'Environment file exists');
      
      if (hasDoToken) {
        this.logResult('environment', 'DO_PAT Configuration', 'PASS', 'DigitalOcean token configured');
      } else {
        this.logResult('environment', 'DO_PAT Configuration', 'WARN', 'DigitalOcean token not set');
      }
      
      if (hasSpotifyId) {
        this.logResult('environment', 'Spotify Configuration', 'PASS', 'Spotify credentials configured');
      } else {
        this.logResult('environment', 'Spotify Configuration', 'WARN', 'Spotify credentials not set');
      }
    } else {
      this.logResult('environment', '.env File', 'WARN', 'Environment file not found - using defaults');
    }

    // Check dependencies
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    if (fs.existsSync(nodeModulesPath)) {
      this.logResult('environment', 'Dependencies', 'PASS', 'node_modules directory exists');
    } else {
      this.logResult('environment', 'Dependencies', 'FAIL', 'Dependencies not installed - run npm install');
    }
  }

  /**
   * Check authentication systems
   */
  checkAuthentication() {
    console.log('\n🔑 Checking Authentication Systems...\n');

    // Check DigitalOcean CLI tool
    const doctlResult = this.runCommand('doctl version', { silent: true });
    if (doctlResult.success) {
      this.logResult('authentication', 'DigitalOcean CLI', 'PASS', 'doctl installed');
    } else {
      this.logResult('authentication', 'DigitalOcean CLI', 'WARN', 'doctl not installed');
    }

    // Test DigitalOcean API authentication
    const doAuthScript = path.join(process.cwd(), 'scripts', 'digitalocean-automation.js');
    if (fs.existsSync(doAuthScript)) {
      this.logResult('authentication', 'DO Automation Script', 'PASS', 'DigitalOcean automation script exists');
      
      const authResult = this.runCommand(`node ${doAuthScript} auth`, { silent: true });
      if (authResult.success && authResult.output.includes('Authenticated as:')) {
        this.logResult('authentication', 'DigitalOcean API', 'PASS', 'API authentication successful');
      } else {
        this.logResult('authentication', 'DigitalOcean API', 'WARN', 'API authentication failed - check DO_PAT token');
      }
    } else {
      this.logResult('authentication', 'DO Automation Script', 'FAIL', 'DigitalOcean automation script missing');
    }

    // Check Spotify API configuration (without actual API call)
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const spotifyIdMatch = envContent.match(/SPOTIFY_CLIENT_ID=([^\s\n]+)/);
      const spotifySecretMatch = envContent.match(/SPOTIFY_CLIENT_SECRET=([^\s\n]+)/);
      
      if (spotifyIdMatch && spotifyIdMatch[1] && spotifyIdMatch[1] !== 'your_client_id') {
        this.logResult('authentication', 'Spotify Client ID', 'PASS', 'Client ID configured');
      } else {
        this.logResult('authentication', 'Spotify Client ID', 'WARN', 'Client ID not configured');
      }
      
      if (spotifySecretMatch && spotifySecretMatch[1] && spotifySecretMatch[1] !== 'your_client_secret') {
        this.logResult('authentication', 'Spotify Client Secret', 'PASS', 'Client secret configured');
      } else {
        this.logResult('authentication', 'Spotify Client Secret', 'WARN', 'Client secret not configured');
      }
    }

    // Check security secrets
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const sessionSecretMatch = envContent.match(/SESSION_SECRET=([^\s\n]+)/);
      const jwtSecretMatch = envContent.match(/JWT_SECRET=([^\s\n]+)/);
      
      if (sessionSecretMatch && sessionSecretMatch[1] && sessionSecretMatch[1].length >= 32) {
        this.logResult('authentication', 'Session Secret', 'PASS', 'Session secret properly configured');
      } else {
        this.logResult('authentication', 'Session Secret', 'WARN', 'Session secret should be 32+ characters');
      }
      
      if (jwtSecretMatch && jwtSecretMatch[1] && jwtSecretMatch[1].length >= 32) {
        this.logResult('authentication', 'JWT Secret', 'PASS', 'JWT secret properly configured');
      } else {
        this.logResult('authentication', 'JWT Secret', 'WARN', 'JWT secret should be 32+ characters');
      }
    }
  }

  /**
   * Check development and deployment tools
   */
  checkTools() {
    console.log('\n🛠️ Checking Development and Deployment Tools...\n');

    // Check Docker
    const dockerResult = this.runCommand('docker --version', { silent: true });
    if (dockerResult.success) {
      this.logResult('tools', 'Docker', 'PASS', dockerResult.output);
    } else {
      this.logResult('tools', 'Docker', 'WARN', 'Docker not installed');
    }

    // Check Docker Compose
    const composeResult = this.runCommand('docker-compose --version', { silent: true });
    if (composeResult.success) {
      this.logResult('tools', 'Docker Compose', 'PASS', composeResult.output);
    } else {
      this.logResult('tools', 'Docker Compose', 'WARN', 'Docker Compose not installed');
    }

    // Check Git
    const gitResult = this.runCommand('git --version', { silent: true });
    if (gitResult.success) {
      this.logResult('tools', 'Git', 'PASS', gitResult.output);
    } else {
      this.logResult('tools', 'Git', 'FAIL', 'Git not installed');
    }

    // Check Python (for ML features)
    const pythonResult = this.runCommand('python3 --version', { silent: true });
    if (pythonResult.success) {
      this.logResult('tools', 'Python', 'PASS', pythonResult.output);
    } else {
      this.logResult('tools', 'Python', 'WARN', 'Python3 not installed - ML features limited');
    }

    // Check curl (for API testing)
    const curlResult = this.runCommand('curl --version', { silent: true });
    if (curlResult.success) {
      this.logResult('tools', 'curl', 'PASS', 'Available for API testing');
    } else {
      this.logResult('tools', 'curl', 'WARN', 'curl not available');
    }

    // Check Jest (testing framework)
    const jestResult = this.runCommand('npx jest --version', { silent: true });
    if (jestResult.success) {
      this.logResult('tools', 'Jest Testing', 'PASS', `v${jestResult.output}`);
    } else {
      this.logResult('tools', 'Jest Testing', 'WARN', 'Jest not available');
    }

    // Check key project files
    const keyFiles = [
      'server.js',
      'src/index.js', 
      'docker-compose.yml',
      '.dockerignore',
      '.gitignore'
    ];

    keyFiles.forEach(file => {
      if (fs.existsSync(path.join(process.cwd(), file))) {
        this.logResult('tools', `Project File: ${file}`, 'PASS', 'File exists');
      } else {
        this.logResult('tools', `Project File: ${file}`, 'WARN', 'File missing');
      }
    });
  }

  /**
   * Check deployment readiness
   */
  checkDeployment() {
    console.log('\n🚀 Checking Deployment Readiness...\n');

    // Check if we can build the project
    const buildResult = this.runCommand('npm run build', { silent: true });
    if (buildResult.success) {
      this.logResult('deployment', 'Build Process', 'PASS', 'Project builds successfully');
    } else {
      this.logResult('deployment', 'Build Process', 'WARN', 'Build process has issues');
    }

    // Check GitHub Actions workflows
    const workflowsPath = path.join(process.cwd(), '.github', 'workflows');
    if (fs.existsSync(workflowsPath)) {
      const workflows = fs.readdirSync(workflowsPath).filter(f => f.endsWith('.yml'));
      this.logResult('deployment', 'GitHub Actions', 'PASS', `${workflows.length} workflows configured`);
      
      // Check for key workflows
      const hasDoDeployment = workflows.some(w => w.includes('digitalocean'));
      const hasDockerBuild = workflows.some(w => w.includes('docker'));
      
      if (hasDoDeployment) {
        this.logResult('deployment', 'DigitalOcean Workflow', 'PASS', 'DigitalOcean deployment workflow exists');
      } else {
        this.logResult('deployment', 'DigitalOcean Workflow', 'WARN', 'DigitalOcean deployment workflow missing');
      }
      
      if (hasDockerBuild) {
        this.logResult('deployment', 'Docker Workflow', 'PASS', 'Docker build workflow exists');
      } else {
        this.logResult('deployment', 'Docker Workflow', 'WARN', 'Docker build workflow missing');
      }
    } else {
      this.logResult('deployment', 'GitHub Actions', 'WARN', 'No GitHub Actions workflows found');
    }

    // Check deployment scripts
    const scriptsPath = path.join(process.cwd(), 'scripts');
    if (fs.existsSync(scriptsPath)) {
      const scripts = fs.readdirSync(scriptsPath).filter(f => f.includes('deploy'));
      this.logResult('deployment', 'Deployment Scripts', 'PASS', `${scripts.length} deployment scripts found`);
    } else {
      this.logResult('deployment', 'Deployment Scripts', 'WARN', 'Scripts directory not found');
    }

    // Check Docker configuration
    const dockerComposePath = path.join(process.cwd(), 'docker-compose.yml');
    if (fs.existsSync(dockerComposePath)) {
      this.logResult('deployment', 'Docker Compose', 'PASS', 'Docker Compose configuration exists');
    } else {
      this.logResult('deployment', 'Docker Compose', 'WARN', 'Docker Compose configuration missing');
    }

    const dockerfilePath = path.join(process.cwd(), 'Dockerfile');
    if (fs.existsSync(dockerfilePath)) {
      this.logResult('deployment', 'Dockerfile', 'PASS', 'Dockerfile exists');
    } else {
      this.logResult('deployment', 'Dockerfile', 'WARN', 'Dockerfile missing');
    }
  }

  /**
   * Run basic functionality tests
   */
  checkTests() {
    console.log('\n🧪 Running Basic Functionality Tests...\n');

    // Test RecommendationEngine (which we fixed)
    try {
      const enginePath = path.join(process.cwd(), 'src', 'ml', 'recommendation-engine.js');
      const { RecommendationEngine } = require(enginePath);
      const engine = new RecommendationEngine();
      this.logResult('tests', 'RecommendationEngine', 'PASS', 'Constructor and import working');
    } catch (error) {
      this.logResult('tests', 'RecommendationEngine', 'FAIL', `Import error: ${error.message}`);
    }

    // Test basic server startup (without actually starting)
    const serverPath = path.join(process.cwd(), 'server.js');
    if (fs.existsSync(serverPath)) {
      try {
        const serverContent = fs.readFileSync(serverPath, 'utf8');
        if (serverContent.includes('express') && serverContent.includes('listen')) {
          this.logResult('tests', 'Server Configuration', 'PASS', 'Server file appears valid');
        } else {
          this.logResult('tests', 'Server Configuration', 'WARN', 'Server file may be incomplete');
        }
      } catch (error) {
        this.logResult('tests', 'Server Configuration', 'FAIL', 'Cannot read server file');
      }
    } else {
      this.logResult('tests', 'Server Configuration', 'FAIL', 'Server file not found');
    }

    // Test package.json scripts
    const packagePath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packagePath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        const requiredScripts = ['start', 'test', 'build'];
        
        requiredScripts.forEach(script => {
          if (pkg.scripts && pkg.scripts[script]) {
            this.logResult('tests', `npm script: ${script}`, 'PASS', `"${pkg.scripts[script]}"`);
          } else {
            this.logResult('tests', `npm script: ${script}`, 'WARN', 'Script not defined');
          }
        });
      } catch (error) {
        this.logResult('tests', 'Package Scripts', 'FAIL', 'Cannot parse package.json');
      }
    }

    // Test environment loading
    try {
      require('dotenv').config();
      this.logResult('tests', 'Environment Loading', 'PASS', 'dotenv configuration successful');
    } catch (error) {
      this.logResult('tests', 'Environment Loading', 'FAIL', `dotenv error: ${error.message}`);
    }
  }

  /**
   * Generate final report
   */
  generateReport() {
    console.log('\n📊 Deployment Validation Report\n');
    console.log('='.repeat(50));

    // Count results by status
    const allResults = [
      ...this.results.environment,
      ...this.results.authentication,
      ...this.results.tools,
      ...this.results.deployment,
      ...this.results.tests
    ];

    const statusCounts = allResults.reduce((acc, result) => {
      acc[result.status] = (acc[result.status] || 0) + 1;
      return acc;
    }, {});

    console.log(`\n📈 Summary:`);
    console.log(`✅ Passed: ${statusCounts.PASS || 0}`);
    console.log(`⚠️  Warnings: ${statusCounts.WARN || 0}`);
    console.log(`❌ Failed: ${statusCounts.FAIL || 0}`);
    console.log(`ℹ️  Info: ${statusCounts.INFO || 0}`);

    // Determine overall status
    if (statusCounts.FAIL > 0) {
      this.results.overall = 'NEEDS_ATTENTION';
      console.log(`\n🚨 Overall Status: NEEDS ATTENTION`);
      console.log(`There are ${statusCounts.FAIL} critical issues that need to be resolved.`);
    } else if (statusCounts.WARN > 0) {
      this.results.overall = 'READY_WITH_WARNINGS';
      console.log(`\n⚠️  Overall Status: READY WITH WARNINGS`);
      console.log(`The system is mostly ready but has ${statusCounts.WARN} warnings.`);
    } else {
      this.results.overall = 'READY';
      console.log(`\n✅ Overall Status: READY FOR DEPLOYMENT`);
      console.log(`All systems are properly configured!`);
    }

    // Next steps recommendations
    console.log(`\n🎯 Next Steps:`);
    
    if (statusCounts.FAIL > 0) {
      console.log(`1. Fix critical issues marked with ❌`);
      console.log(`2. Re-run this validation script`);
      console.log(`3. Address warnings for optimal performance`);
    } else if (statusCounts.WARN > 0) {
      console.log(`1. Review warnings for optimal setup`);
      console.log(`2. Configure missing API keys if needed`);
      console.log(`3. Test deployment in development environment`);
    } else {
      console.log(`1. Run: node scripts/digitalocean-automation.js deploy`);
      console.log(`2. Or run: docker-compose up -d`);
      console.log(`3. Or run: npm start`);
    }

    console.log(`\n📖 For detailed setup instructions, see README.md`);
    console.log('='.repeat(50));

    // Save detailed report
    const reportPath = path.join(process.cwd(), 'deployment-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);

    return this.results.overall;
  }

  /**
   * Run all validation checks
   */
  async runValidation() {
    console.log('🎵 EchoTune AI - Deployment and Authentication Validation');
    console.log('='.repeat(60));
    
    this.checkEnvironment();
    this.checkAuthentication();
    this.checkTools();
    this.checkDeployment();
    this.checkTests();
    
    return this.generateReport();
  }
}

// CLI interface
async function main() {
  const validator = new DeploymentValidator();
  
  try {
    const status = await validator.runValidation();
    
    // Exit with appropriate code
    if (status === 'READY') {
      process.exit(0);
    } else if (status === 'READY_WITH_WARNINGS') {
      process.exit(1); // Warnings
    } else {
      process.exit(2); // Critical issues
    }
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(3);
  }
}

if (require.main === module) {
  main();
}

module.exports = DeploymentValidator;
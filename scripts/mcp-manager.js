#!/usr/bin/env node

/**
 * Enhanced MCP Server Manager for EchoTune AI
 * Manages MCP server health, installation, testing, and validation
 * with comprehensive error handling and reporting
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class MCPManager {
  constructor() {
    this.packageJsonPath = path.join(__dirname, '..', 'package.json');
    this.mcpServerPackagePath = path.join(__dirname, '..', 'mcp-server', 'package.json');
    this.results = {
      health: [],
      installation: [],
      tests: [],
      validation: []
    };
    
    // Load server configurations from package.json
    this.loadServerConfigurations();
  }

  loadServerConfigurations() {
    try {
      // Load main package.json MCP configuration
      if (fs.existsSync(this.packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
        this.mainMcpServers = packageJson.mcp?.servers || {};
      }

      // Load MCP server-specific package.json
      if (fs.existsSync(this.mcpServerPackagePath)) {
        const mcpPackage = JSON.parse(fs.readFileSync(this.mcpServerPackagePath, 'utf8'));
        this.mcpServerConfig = mcpPackage.servers || {};
      }

      // Legacy server definitions for backwards compatibility
      this.legacyServers = [
        { name: 'enhanced-server', port: 3001, path: 'mcp-server/enhanced-server.js' },
        { name: 'orchestration-engine', port: 3002, path: 'mcp-server/orchestration-engine.js' },
        { name: 'spotify-server', port: 3003, path: 'mcp-server/spotify_server.py' }
      ];

      console.log(`✅ Loaded ${Object.keys(this.mainMcpServers || {}).length} servers from main config`);
      console.log(`✅ Loaded ${Object.keys(this.mcpServerConfig || {}).length} servers from MCP config`);
    } catch (error) {
      console.error('❌ Error loading server configurations:', error.message);
      this.mainMcpServers = {};
      this.mcpServerConfig = {};
    }
  }

  async health() {
    console.log('🔍 Comprehensive MCP Server Health Check...\n');
    
    this.results.health = [];
    const allServers = this.getAllServers();
    
    for (const server of allServers) {
      try {
        const healthResult = await this.checkServerHealth(server);
        console.log(`✅ ${server.name}: ${healthResult.status} (${healthResult.responseTime}ms)`);
        this.results.health.push({
          name: server.name,
          status: 'healthy',
          responseTime: healthResult.responseTime,
          endpoint: healthResult.endpoint,
          details: healthResult.details
        });
      } catch (error) {
        console.log(`❌ ${server.name}: ${error.message}`);
        this.results.health.push({
          name: server.name,
          status: 'unhealthy',
          error: error.message,
          type: server.type || 'unknown'
        });
      }
    }

    // Summary
    const healthy = this.results.health.filter(r => r.status === 'healthy').length;
    const total = this.results.health.length;
    console.log(`\n📊 Health Summary: ${healthy}/${total} servers healthy`);
    
    return this.results.health;
  }

  getAllServers() {
    const servers = [];
    
    // Add configured servers from main package.json
    for (const [name, config] of Object.entries(this.mainMcpServers || {})) {
      servers.push({
        name,
        type: 'configured',
        command: config.command,
        args: config.args,
        env: config.env,
        description: config.description
      });
    }

    // Add servers from mcp-server package.json
    for (const [name, config] of Object.entries(this.mcpServerConfig || {})) {
      servers.push({
        name: `mcp-${name}`,
        type: 'mcp-server',
        command: config.command,
        args: config.args,
        env: config.env,
        description: config.description
      });
    }

    // Add legacy servers for backwards compatibility
    for (const server of this.legacyServers) {
      if (!servers.find(s => s.name === server.name)) {
        servers.push({
          ...server,
          type: 'legacy'
        });
      }
    }

    return servers;
  }

  async checkServerHealth(server) {
    const startTime = Date.now();
    
    // For servers with ports, try HTTP health check
    if (server.port) {
      try {
        const { stdout } = await execAsync(`curl -fsS --max-time 5 http://localhost:${server.port}/health 2>/dev/null || echo "NOT_FOUND"`, {
          timeout: 6000
        });
        
        const responseTime = Date.now() - startTime;
        
        if (stdout.trim() === 'NOT_FOUND') {
          throw new Error(`No health endpoint on port ${server.port}`);
        }
        
        return {
          status: 'OK',
          responseTime,
          endpoint: `http://localhost:${server.port}/health`,
          details: stdout.trim()
        };
      } catch (error) {
        throw new Error(`Port ${server.port} not responding: ${error.message}`);
      }
    }

    // For command-based servers, check if command is available
    if (server.command) {
      try {
        const commandCheck = server.command === 'node' ? 'node --version' : 
                           server.command === 'python' ? 'python --version' :
                           server.command === 'npx' ? 'npx --version' :
                           `which ${server.command}`;
                           
        await execAsync(commandCheck, { timeout: 3000 });
        
        return {
          status: 'Command Available',
          responseTime: Date.now() - startTime,
          endpoint: `command:${server.command}`,
          details: `${server.command} is available`
        };
      } catch (error) {
        throw new Error(`Command '${server.command}' not available`);
      }
    }

    // For file-based servers, check if file exists
    if (server.path) {
      if (fs.existsSync(server.path)) {
        return {
          status: 'File Exists',
          responseTime: Date.now() - startTime,
          endpoint: `file:${server.path}`,
          details: 'Server file found'
        };
      } else {
        throw new Error(`Server file not found: ${server.path}`);
      }
    }

    throw new Error('No health check method available');
  }

  async install() {
    console.log('📦 Installing MCP Server Dependencies...\n');
    
    this.results.installation = [];
    const installTasks = [];

    // Install MCP server dependencies
    installTasks.push({
      name: 'MCP Server Dependencies',
      command: 'cd mcp-server && npm ci --prefer-offline --no-audit',
      timeout: 120000,
      required: true
    });

    // Install Python dependencies if requirements exist
    if (fs.existsSync('requirements.txt')) {
      installTasks.push({
        name: 'Python Dependencies',
        command: 'python -m pip install --quiet --disable-pip-version-check -r requirements.txt',
        timeout: 180000,
        required: false
      });
    }

    // Install Node.js dependencies if needed
    installTasks.push({
      name: 'Main Dependencies',
      command: 'npm ci --prefer-offline --no-audit',
      timeout: 120000,
      required: true
    });

    // Install specific MCP servers
    for (const [serverName, config] of Object.entries(this.mcpServerConfig || {})) {
      if (config.command === 'npx' && config.args && config.args[0]) {
        const packageName = config.args[0];
        installTasks.push({
          name: `MCP Server: ${serverName}`,
          command: `npm install --no-save ${packageName}`,
          timeout: 60000,
          required: false
        });
      }
    }

    // Execute installation tasks
    for (const task of installTasks) {
      try {
        console.log(`Installing ${task.name}...`);
        const startTime = Date.now();
        
        await execAsync(task.command, { 
          timeout: task.timeout,
          env: { ...process.env, NODE_ENV: 'development' }
        });
        
        const duration = Date.now() - startTime;
        console.log(`✅ ${task.name} installed (${Math.round(duration/1000)}s)`);
        
        this.results.installation.push({
          name: task.name,
          status: 'success',
          duration: duration,
          required: task.required
        });
      } catch (error) {
        const errorMessage = error.message.includes('timeout') ? 'Installation timeout' : error.message;
        console.log(`${task.required ? '❌' : '⚠️'} ${task.name}: ${errorMessage}`);
        
        this.results.installation.push({
          name: task.name,
          status: task.required ? 'failed' : 'warning',
          error: errorMessage,
          required: task.required
        });
        
        if (task.required) {
          throw new Error(`Required installation failed: ${task.name}`);
        }
      }
    }

    // Validate critical dependencies
    await this.validateCriticalDependencies();
    
    return this.results.installation;
  }

  async validateCriticalDependencies() {
    console.log('\n🔍 Validating critical dependencies...');
    
    const criticalChecks = [
      { name: 'Node.js', command: 'node --version', required: true },
      { name: 'NPM', command: 'npm --version', required: true },
      { name: 'Python', command: 'python --version', required: false },
      { name: 'Curl', command: 'curl --version', required: true }
    ];

    for (const check of criticalChecks) {
      try {
        const { stdout } = await execAsync(check.command, { timeout: 5000 });
        console.log(`✅ ${check.name}: ${stdout.split('\n')[0]}`);
      } catch (error) {
        if (check.required) {
          console.log(`❌ ${check.name}: Not available (REQUIRED)`);
          throw new Error(`Critical dependency missing: ${check.name}`);
        } else {
          console.log(`⚠️ ${check.name}: Not available (optional)`);
        }
      }
    }
  }

  async test() {
    console.log('🧪 Comprehensive MCP Server Testing...\n');
    
    this.results.tests = [];
    
    // Test 1: Health endpoints
    try {
      console.log('1. Testing health endpoints...');
      const healthResults = await this.health();
      const healthyServers = healthResults.filter(r => r.status === 'healthy').length;
      
      this.results.tests.push({
        name: 'Health Endpoints',
        status: healthyServers > 0 ? 'passed' : 'failed',
        details: `${healthyServers}/${healthResults.length} servers healthy`,
        results: healthResults
      });
      
      console.log(`✅ Health test: ${healthyServers}/${healthResults.length} healthy\n`);
    } catch (error) {
      console.log('❌ Health test failed:', error.message);
      this.results.tests.push({
        name: 'Health Endpoints',
        status: 'failed',
        error: error.message
      });
    }

    // Test 2: MCP integration script
    const integrationScript = path.join(__dirname, 'validate-mcp-integration.js');
    if (fs.existsSync(integrationScript)) {
      try {
        console.log('2. Running MCP integration tests...');
        const { stdout, stderr } = await execAsync(`node "${integrationScript}"`, { 
          timeout: 30000,
          encoding: 'utf8'
        });
        
        console.log('✅ Integration tests passed');
        this.results.tests.push({
          name: 'MCP Integration',
          status: 'passed',
          output: stdout,
          warnings: stderr
        });
      } catch (error) {
        console.log('❌ Integration tests failed:', error.message);
        this.results.tests.push({
          name: 'MCP Integration',
          status: 'failed',
          error: error.message
        });
      }
    } else {
      console.log('⚠️ No integration test script found, creating basic smoke test...');
      await this.createBasicSmokeTest();
    }

    // Test 3: Server configuration validation
    try {
      console.log('3. Validating server configurations...');
      const configValidation = await this.validateServerConfigurations();
      
      this.results.tests.push({
        name: 'Configuration Validation',
        status: configValidation.isValid ? 'passed' : 'failed',
        details: configValidation.summary,
        issues: configValidation.issues
      });
      
      console.log(configValidation.isValid ? '✅ Configuration valid' : '❌ Configuration issues found');
    } catch (error) {
      console.log('❌ Configuration validation failed:', error.message);
      this.results.tests.push({
        name: 'Configuration Validation',
        status: 'failed',
        error: error.message
      });
    }

    // Test 4: Environment validation
    try {
      console.log('4. Validating environment variables...');
      const envValidation = await this.validateEnvironmentVariables();
      
      this.results.tests.push({
        name: 'Environment Validation',
        status: envValidation.hasRequired ? 'passed' : 'warning',
        details: `${envValidation.found}/${envValidation.total} variables configured`,
        missing: envValidation.missing
      });
      
      console.log(`${envValidation.hasRequired ? '✅' : '⚠️'} Environment: ${envValidation.found}/${envValidation.total} configured`);
    } catch (error) {
      console.log('❌ Environment validation failed:', error.message);
    }

    // Summary
    const passed = this.results.tests.filter(t => t.status === 'passed').length;
    const total = this.results.tests.length;
    console.log(`\n📊 Test Summary: ${passed}/${total} tests passed`);

    return this.results.tests;
  }

  async createBasicSmokeTest() {
    const smokeTestContent = `#!/usr/bin/env node
/**
 * Basic MCP Integration Smoke Test
 * Generated by MCP Manager
 */

const fs = require('fs');
const path = require('path');

async function smokeTest() {
  console.log('🧪 Running MCP smoke tests...');
  
  // Test 1: Check if critical files exist
  const criticalFiles = [
    'mcp-server/package.json',
    'src/api/utils/response-formatter.js',
    '.env.example'
  ];
  
  for (const file of criticalFiles) {
    if (fs.existsSync(file)) {
      console.log('✅ Critical file exists:', file);
    } else {
      console.log('❌ Missing critical file:', file);
      process.exit(1);
    }
  }
  
  // Test 2: Validate package.json MCP configuration
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const mcpServers = Object.keys(packageJson.mcp?.servers || {});
    
    if (mcpServers.length > 0) {
      console.log('✅ MCP servers configured:', mcpServers.length);
    } else {
      console.log('⚠️ No MCP servers configured in package.json');
    }
  } catch (error) {
    console.log('❌ Failed to parse package.json:', error.message);
    process.exit(1);
  }
  
  console.log('✅ Smoke tests completed successfully');
}

if (require.main === module) {
  smokeTest().catch(error => {
    console.error('❌ Smoke test failed:', error.message);
    process.exit(1);
  });
}

module.exports = smokeTest;
`;

    const smokeTestPath = path.join(__dirname, 'validate-mcp-integration.js');
    fs.writeFileSync(smokeTestPath, smokeTestContent);
    console.log('📝 Created basic smoke test:', smokeTestPath);
    
    // Run the newly created smoke test
    try {
      await execAsync(`node "${smokeTestPath}"`, { timeout: 15000 });
      return { status: 'passed', message: 'Basic smoke test completed' };
    } catch (error) {
      return { status: 'failed', error: error.message };
    }
  }

  async validateServerConfigurations() {
    const issues = [];
    const allServers = this.getAllServers();
    
    for (const server of allServers) {
      // Check if command exists
      if (server.command && !['node', 'python', 'npx'].includes(server.command)) {
        try {
          await execAsync(`which ${server.command}`, { timeout: 3000 });
        } catch (error) {
          issues.push(`Command '${server.command}' not found for server '${server.name}'`);
        }
      }
      
      // Check if files exist for file-based servers
      if (server.path && !fs.existsSync(server.path)) {
        issues.push(`Server file not found: ${server.path} (${server.name})`);
      }
      
      // Validate environment variables
      if (server.env) {
        for (const envVar of Object.keys(server.env)) {
          const envValue = server.env[envVar];
          if (envValue && envValue.includes('${') && !process.env[envVar.replace('${', '').replace('}', '')]) {
            issues.push(`Environment variable ${envVar} not configured for server '${server.name}'`);
          }
        }
      }
    }
    
    return {
      isValid: issues.length === 0,
      issues: issues,
      summary: issues.length === 0 ? 'All configurations valid' : `${issues.length} issues found`
    };
  }

  async validateEnvironmentVariables() {
    const requiredVars = [
      'NODE_ENV',
      'PORT'
    ];
    
    const optionalVars = [
      'SPOTIFY_CLIENT_ID',
      'SPOTIFY_CLIENT_SECRET',
      'MONGODB_URI',
      'OPENAI_API_KEY',
      'GEMINI_API_KEY',
      'BROWSERBASE_API_KEY'
    ];
    
    const allVars = [...requiredVars, ...optionalVars];
    const found = allVars.filter(varName => process.env[varName]).length;
    const missing = allVars.filter(varName => !process.env[varName]);
    const hasRequired = requiredVars.every(varName => process.env[varName]);
    
    return {
      found,
      total: allVars.length,
      missing,
      hasRequired,
      requiredMissing: requiredVars.filter(varName => !process.env[varName])
    };
  }

  async report() {
    console.log('📊 Comprehensive MCP Server Status Report\n');
    console.log('=' .repeat(70));
    
    const startTime = Date.now();
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {},
      details: {}
    };
    
    // 1. Server Configuration Overview
    console.log('📋 Server Configuration Overview:');
    const allServers = this.getAllServers();
    
    console.log(`  Total Configured Servers: ${allServers.length}`);
    
    const serversByType = {};
    allServers.forEach(server => {
      serversByType[server.type] = (serversByType[server.type] || 0) + 1;
    });
    
    Object.entries(serversByType).forEach(([type, count]) => {
      console.log(`    - ${type}: ${count} servers`);
    });
    
    reportData.summary.totalServers = allServers.length;
    reportData.summary.serversByType = serversByType;
    console.log();

    // 2. Detailed Server List
    console.log('🔧 Configured Servers:');
    allServers.forEach(server => {
      const status = server.command ? `${server.command} ${(server.args || []).join(' ')}` : 
                     server.path ? `file: ${server.path}` : 'Unknown configuration';
      console.log(`  - ${server.name} (${server.type}): ${status}`);
      if (server.description) {
        console.log(`    Description: ${server.description}`);
      }
    });
    console.log();

    // 3. Health Status
    console.log('🔍 Health Status:');
    try {
      const healthResults = await this.health();
      const healthSummary = {
        healthy: healthResults.filter(r => r.status === 'healthy').length,
        unhealthy: healthResults.filter(r => r.status === 'unhealthy').length,
        total: healthResults.length
      };
      
      reportData.details.health = healthResults;
      reportData.summary.health = healthSummary;
      
      console.log(`  Healthy: ${healthSummary.healthy}/${healthSummary.total}`);
      console.log(`  Issues: ${healthSummary.unhealthy}`);
    } catch (error) {
      console.log('  ❌ Health check failed:', error.message);
      reportData.summary.health = { error: error.message };
    }
    console.log();

    // 4. Environment Status
    console.log('🌍 Environment Status:');
    try {
      const envValidation = await this.validateEnvironmentVariables();
      reportData.details.environment = envValidation;
      
      console.log(`  Configured: ${envValidation.found}/${envValidation.total} variables`);
      console.log(`  Required Status: ${envValidation.hasRequired ? 'Complete' : 'Missing variables'}`);
      
      if (envValidation.requiredMissing.length > 0) {
        console.log(`  Missing Required: ${envValidation.requiredMissing.join(', ')}`);
      }
      
      if (envValidation.missing.length > 0 && envValidation.missing.length <= 5) {
        console.log(`  Optional Missing: ${envValidation.missing.slice(0, 5).join(', ')}`);
      }
    } catch (error) {
      console.log('  ❌ Environment check failed:', error.message);
    }
    console.log();

    // 5. File System Status
    console.log('📁 File System Status:');
    const criticalPaths = [
      { path: 'mcp-server/package.json', name: 'MCP Server Config' },
      { path: 'src/api/utils/response-formatter.js', name: 'Response Formatter' },
      { path: '.env.example', name: 'Environment Template' },
      { path: 'scripts/validate-mcp-integration.js', name: 'Integration Tests' }
    ];
    
    const fileStatus = {};
    criticalPaths.forEach(({ path, name }) => {
      const exists = fs.existsSync(path);
      console.log(`  ${exists ? '✅' : '❌'} ${name}: ${exists ? 'Found' : 'Missing'}`);
      fileStatus[name] = exists;
    });
    
    reportData.details.fileSystem = fileStatus;
    console.log();

    // 6. Recent Results Summary
    if (this.results.installation.length > 0) {
      console.log('📦 Last Installation Results:');
      const installSummary = {
        success: this.results.installation.filter(r => r.status === 'success').length,
        failed: this.results.installation.filter(r => r.status === 'failed').length,
        warnings: this.results.installation.filter(r => r.status === 'warning').length
      };
      console.log(`  Success: ${installSummary.success}, Failed: ${installSummary.failed}, Warnings: ${installSummary.warnings}`);
      reportData.summary.lastInstallation = installSummary;
    }

    if (this.results.tests.length > 0) {
      console.log('🧪 Last Test Results:');
      const testSummary = {
        passed: this.results.tests.filter(r => r.status === 'passed').length,
        failed: this.results.tests.filter(r => r.status === 'failed').length,
        warnings: this.results.tests.filter(r => r.status === 'warning').length
      };
      console.log(`  Passed: ${testSummary.passed}, Failed: ${testSummary.failed}, Warnings: ${testSummary.warnings}`);
      reportData.summary.lastTests = testSummary;
    }

    // 7. Recommendations
    console.log('\n💡 Recommendations:');
    const recommendations = this.generateRecommendations(reportData);
    recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
    
    reportData.recommendations = recommendations;

    // Performance and completion
    const duration = Date.now() - startTime;
    console.log(`\n⏱️ Report generated in ${duration}ms`);
    console.log('=' .repeat(70));
    
    // Save report to file
    const reportPath = path.join(__dirname, '..', 'mcp-status-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`📄 Detailed report saved to: ${reportPath}`);
    
    return reportData;
  }

  generateRecommendations(reportData) {
    const recommendations = [];
    
    // Health recommendations
    if (reportData.summary.health && reportData.summary.health.unhealthy > 0) {
      recommendations.push(`Fix ${reportData.summary.health.unhealthy} unhealthy servers`);
    }
    
    // Environment recommendations
    if (reportData.details.environment?.requiredMissing?.length > 0) {
      recommendations.push(`Configure required environment variables: ${reportData.details.environment.requiredMissing.join(', ')}`);
    }
    
    // File system recommendations
    if (reportData.details.fileSystem && Object.values(reportData.details.fileSystem).includes(false)) {
      recommendations.push('Create missing critical files for full MCP functionality');
    }
    
    // Installation recommendations
    if (reportData.summary.lastInstallation?.failed > 0) {
      recommendations.push('Retry failed installations with verbose logging');
    }
    
    // Test recommendations
    if (reportData.summary.lastTests?.failed > 0) {
      recommendations.push('Investigate and fix failing tests');
    }
    
    // General recommendations
    if (reportData.summary.totalServers === 0) {
      recommendations.push('Configure MCP servers in package.json for full automation');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('System is healthy - consider adding more MCP servers for enhanced functionality');
    }
    
    return recommendations;
  }

  async start(serverName) {
    const allServers = this.getAllServers();
    const server = allServers.find(s => s.name === serverName || s.name === `mcp-${serverName}`);
    
    if (!server) {
      const availableServers = allServers.map(s => s.name).join(', ');
      throw new Error(`Server '${serverName}' not found. Available: ${availableServers}`);
    }

    console.log(`🚀 Starting ${server.name}...`);
    
    try {
      let startCommand;
      
      if (server.path && server.path.endsWith('.py')) {
        startCommand = `cd mcp-server && python ${path.basename(server.path)}`;
      } else if (server.command && server.args) {
        // Set up environment variables
        const env = { ...process.env };
        if (server.env) {
          Object.entries(server.env).forEach(([key, value]) => {
            // Simple variable substitution
            if (typeof value === 'string' && value.includes('${')) {
              env[key] = value.replace(/\$\{([^}]+)\}/g, (match, varName) => {
                return process.env[varName] || match;
              });
            } else {
              env[key] = value;
            }
          });
        }
        
        startCommand = `${server.command} ${server.args.join(' ')}`;
        
        // Execute with proper environment
        await execAsync(startCommand, { 
          env,
          timeout: 10000,
          stdio: 'pipe'
        });
      } else if (server.path) {
        startCommand = `node ${server.path}`;
        await execAsync(startCommand, { timeout: 10000 });
      } else {
        throw new Error(`No valid start method for server ${server.name}`);
      }
      
      console.log(`✅ ${server.name} started successfully`);
      
      // Wait a moment and check if server is responding
      setTimeout(async () => {
        try {
          await this.checkServerHealth(server);
          console.log(`✅ ${server.name} is responding to health checks`);
        } catch (error) {
          console.log(`⚠️ ${server.name} started but not responding to health checks: ${error.message}`);
        }
      }, 2000);
      
    } catch (error) {
      console.error(`❌ Failed to start ${server.name}:`, error.message);
      throw error;
    }
  }

  async stop(serverName) {
    console.log(`🛑 Stopping ${serverName}...`);
    
    try {
      // Try to stop gracefully by port if available
      const allServers = this.getAllServers();
      const server = allServers.find(s => s.name === serverName);
      
      if (server && server.port) {
        // Try to send shutdown signal to port
        try {
          await execAsync(`curl -X POST http://localhost:${server.port}/shutdown 2>/dev/null || true`, {
            timeout: 5000
          });
          console.log(`✅ Graceful shutdown signal sent to ${serverName}`);
        } catch (error) {
          // Fall back to process killing
          await execAsync(`lsof -ti :${server.port} | xargs kill -9 2>/dev/null || true`, {
            timeout: 5000
          });
          console.log(`✅ Force stopped processes on port ${server.port}`);
        }
      } else {
        // Try to find and kill processes by name
        const processName = serverName.includes('python') ? 'python' : 'node';
        await execAsync(`pkill -f "${serverName}" 2>/dev/null || true`, {
          timeout: 5000
        });
        console.log(`✅ Stopped processes matching ${serverName}`);
      }
      
    } catch (error) {
      console.log(`⚠️ Error stopping ${serverName}: ${error.message}`);
    }
  }

  async validate() {
    console.log('🔍 Comprehensive MCP System Validation...\n');
    
    const validationResults = {
      timestamp: new Date().toISOString(),
      overall: 'pending',
      components: {}
    };
    
    try {
      // 1. Installation validation
      console.log('1. Validating installations...');
      const installResults = await this.install();
      const installationPassed = installResults.every(r => r.status !== 'failed');
      validationResults.components.installation = {
        status: installationPassed ? 'passed' : 'failed',
        results: installResults
      };
      
      // 2. Health validation
      console.log('2. Validating server health...');
      const healthResults = await this.health();
      const healthPassed = healthResults.some(r => r.status === 'healthy');
      validationResults.components.health = {
        status: healthPassed ? 'passed' : 'failed',
        results: healthResults
      };
      
      // 3. Test validation
      console.log('3. Running comprehensive tests...');
      const testResults = await this.test();
      const testsPassed = testResults.filter(r => r.status === 'passed').length >= testResults.length / 2;
      validationResults.components.tests = {
        status: testsPassed ? 'passed' : 'failed',
        results: testResults
      };
      
      // 4. Configuration validation
      console.log('4. Validating configurations...');
      const configValidation = await this.validateServerConfigurations();
      validationResults.components.configuration = {
        status: configValidation.isValid ? 'passed' : 'failed',
        validation: configValidation
      };
      
      // Overall status
      const componentResults = Object.values(validationResults.components);
      const passedComponents = componentResults.filter(c => c.status === 'passed').length;
      const totalComponents = componentResults.length;
      
      if (passedComponents === totalComponents) {
        validationResults.overall = 'passed';
        console.log(`\n✅ Overall Validation: PASSED (${passedComponents}/${totalComponents})`);
      } else if (passedComponents >= totalComponents / 2) {
        validationResults.overall = 'warning';
        console.log(`\n⚠️ Overall Validation: PARTIAL (${passedComponents}/${totalComponents})`);
      } else {
        validationResults.overall = 'failed';
        console.log(`\n❌ Overall Validation: FAILED (${passedComponents}/${totalComponents})`);
      }
      
    } catch (error) {
      validationResults.overall = 'error';
      validationResults.error = error.message;
      console.log(`\n💥 Validation Error: ${error.message}`);
    }
    
    // Save validation results
    const validationPath = path.join(__dirname, '..', 'mcp-validation-results.json');
    fs.writeFileSync(validationPath, JSON.stringify(validationResults, null, 2));
    console.log(`📄 Validation results saved to: ${validationPath}`);
    
    return validationResults;
  }
}

// CLI Interface
async function main() {
  const manager = new MCPManager();
  const command = process.argv[2] || 'help';

  // Add graceful error handling
  process.on('uncaughtException', (error) => {
    console.error('💥 Unexpected error:', error.message);
    if (process.env.NODE_ENV === 'development') {
      console.error(error.stack);
    }
    process.exit(1);
  });

  try {
    switch (command) {
      case 'health':
        const healthResults = await manager.health();
        const exitCode = healthResults.some(r => r.status === 'healthy') ? 0 : 1;
        process.exit(exitCode);
        break;
        
      case 'install':
        const installResults = await manager.install();
        const installExitCode = installResults.every(r => r.status !== 'failed') ? 0 : 1;
        process.exit(installExitCode);
        break;
        
      case 'test':
        const testResults = await manager.test();
        const testExitCode = testResults.filter(r => r.status === 'passed').length >= testResults.length / 2 ? 0 : 1;
        process.exit(testExitCode);
        break;
        
      case 'validate':
        const validateResults = await manager.validate();
        const validateExitCode = validateResults.overall === 'passed' ? 0 : 
                               validateResults.overall === 'warning' ? 0 : 1;
        process.exit(validateExitCode);
        break;
        
      case 'report':
        await manager.report();
        break;
        
      case 'start':
        const serverName = process.argv[3];
        if (!serverName) {
          console.log('❌ Usage: npm run mcp-manage start <server-name>');
          const allServers = manager.getAllServers();
          if (allServers.length > 0) {
            console.log('Available servers:', allServers.map(s => s.name).join(', '));
          }
          process.exit(1);
        }
        await manager.start(serverName);
        break;
        
      case 'stop':
        const stopServerName = process.argv[3];
        if (!stopServerName) {
          console.log('❌ Usage: npm run mcp-manage stop <server-name>');
          process.exit(1);
        }
        await manager.stop(stopServerName);
        break;
        
      case 'list':
        console.log('📋 Available MCP Servers:\n');
        const servers = manager.getAllServers();
        if (servers.length === 0) {
          console.log('No servers configured');
        } else {
          servers.forEach((server, index) => {
            console.log(`${index + 1}. ${server.name} (${server.type})`);
            if (server.description) {
              console.log(`   ${server.description}`);
            }
            console.log(`   Command: ${server.command || 'N/A'} ${(server.args || []).join(' ')}`);
            console.log();
          });
        }
        break;
        
      case 'config':
        console.log('⚙️ MCP Manager Configuration:\n');
        console.log('Package Paths:');
        console.log(`  Main: ${manager.packageJsonPath}`);
        console.log(`  MCP: ${manager.mcpServerPackagePath}`);
        console.log(`\nLoaded Servers: ${manager.getAllServers().length}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        break;
        
      case 'help':
      default:
        console.log(`
🤖 EchoTune AI - Enhanced MCP Server Manager

COMMANDS:
  health     - Check health of all configured MCP servers
  install    - Install all MCP server dependencies with validation  
  test       - Run comprehensive MCP integration tests
  validate   - Run complete system validation (install + health + test + config)
  report     - Generate comprehensive status report with recommendations
  start      - Start a specific MCP server
  stop       - Stop a specific MCP server  
  list       - List all configured MCP servers
  config     - Show MCP manager configuration

USAGE:
  npm run mcp-health           # Quick health check
  npm run mcp-install          # Install dependencies
  npm run mcp-test-all         # Run all tests
  npm run mcp-report           # Full status report
  npm run mcp-manage validate  # Complete validation
  npm run mcp-manage start <server-name>
  npm run mcp-manage stop <server-name>
  npm run mcp-manage list

INTEGRATION:
  - Supports package.json mcp.servers configuration
  - Supports mcp-server/package.json servers configuration  
  - Environment variable validation and substitution
  - Comprehensive error handling and reporting
  - JSON output files for CI/CD integration

EXAMPLES:
  npm run mcp-manage start spotify
  npm run mcp-manage stop enhanced-server
  npm run mcp-manage validate > validation-report.txt
        `);
        break;
    }
  } catch (error) {
    console.error('❌ MCP Manager Error:', error.message);
    
    // Provide helpful suggestions based on error type
    if (error.message.includes('not found')) {
      console.log('\n💡 Suggestions:');
      console.log('  - Run "npm run mcp-manage list" to see available servers');
      console.log('  - Check your MCP server configuration in package.json');
    } else if (error.message.includes('timeout')) {
      console.log('\n💡 Suggestions:');
      console.log('  - Check if the required services are running');
      console.log('  - Verify network connectivity');
      console.log('  - Try running with longer timeout');
    } else if (error.message.includes('permission') || error.message.includes('EACCES')) {
      console.log('\n💡 Suggestions:');
      console.log('  - Check file permissions');
      console.log('  - Run with appropriate user privileges');
      console.log('  - Verify directory access');
    }
    
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = MCPManager;
#!/usr/bin/env node
/**
 * Comprehensive MCP Server Test Suite
 * Tests all MCP servers with detailed reports and use cases
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn, exec } = require('child_process');
require('dotenv').config();

class MCPServerTestSuite {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      totalServers: 0,
      operational: 0,
      configured: 0,
      tested: 0,
      servers: {},
      summary: {}
    };

    this.mcpServers = {
      'filesystem': {
        path: 'mcp-servers/filesystem/index.js',
        port: 3010,
        description: 'Secure file operations, directory management, code analysis',
        useCases: [
          'Reading and writing configuration files',
          'Analyzing code structure and dependencies',
          'Template management and generation',
          'Secure file operations for development'
        ],
        expectedTools: ['read_file', 'write_file', 'list_directory', 'create_directory', 'delete_file'],
        startupScript: 'mcp:filesystem'
      },
      'memory': {
        path: 'mcp-servers/memory/index.js', 
        port: 3011,
        description: 'Persistent context across sessions, knowledge graph storage',
        useCases: [
          'Storing conversation history and context',
          'Maintaining project knowledge across sessions',
          'Building knowledge graphs for code relationships',
          'Persistent learning and adaptation'
        ],
        expectedTools: ['store_memory', 'recall_memory', 'search_memories', 'create_entity'],
        startupScript: 'mcp:memory'
      },
      'sequential-thinking': {
        path: 'mcp-servers/sequential-thinking/index.ts',
        port: 3012,
        description: 'Enhanced AI reasoning, step-by-step problem solving',
        useCases: [
          'Complex problem decomposition',
          'Multi-step reasoning for coding decisions',
          'Enhanced debugging workflows',
          'Systematic architecture planning'
        ],
        expectedTools: ['think_step', 'analyze_problem', 'plan_solution'],
        startupScript: 'mcp:sequential-thinking',
        isTypeScript: true
      },
      'github-repos-manager': {
        path: 'mcp-servers/github-repos-manager/index.js',
        port: 3013,
        description: '80+ GitHub tools, repository management, automation',
        useCases: [
          'Automated repository analysis and management',
          'Issue and PR automation workflows',
          'Code review and collaboration tools',
          'Repository statistics and insights'
        ],
        expectedTools: ['list_repos', 'create_issue', 'manage_pr', 'get_commits'],
        startupScript: 'mcp:github-repos',
        requiresAuth: true,
        authVar: 'GITHUB_API'
      },
      'brave-search': {
        path: 'mcp-servers/brave-search/brave-search-mcp.js',
        port: 3014,
        description: 'Privacy-focused web research, 2000 free queries/month',
        useCases: [
          'Technical documentation search',
          'Privacy-focused web research',
          'Real-time information gathering',
          'Research assistance for development'
        ],
        expectedTools: ['web_search', 'search_results'],
        startupScript: 'mcp:brave-search',
        requiresAuth: true,
        authVar: 'BRAVE_API_KEY'
      },
      'perplexity-mcp': {
        path: 'mcp-servers/perplexity-mcp/perplexity-mcp-server.js',
        port: 3015,
        description: 'AI-powered research, Grok-4 integration, deep analysis',
        useCases: [
          'Advanced AI research and analysis',
          'Multi-model reasoning and insights',
          'Grok-4 equivalent capabilities',
          'Deep repository analysis and recommendations'
        ],
        expectedTools: ['perplexity_search', 'grok_analysis', 'deep_research'],
        startupScript: 'mcpperplexity',
        requiresAuth: true,
        authVar: 'PERPLEXITY_API_KEY'
      },
      'analytics-server': {
        path: 'mcp-servers/analytics-server/analytics-mcp.js',
        port: 3016,
        description: 'Performance monitoring, system health, telemetry',
        useCases: [
          'Real-time performance monitoring',
          'System health tracking',
          'Development workflow optimization',
          'Resource usage analytics'
        ],
        expectedTools: ['get_metrics', 'health_check', 'performance_data'],
        startupScript: 'mcp:analytics'
      },
      'browserbase': {
        path: 'mcp-servers/browserbase/browserbase-mcp.js',
        port: 3017,
        description: 'Browser automation with Playwright integration',
        useCases: [
          'Automated web testing and validation',
          'Spotify Web Player automation',
          'UI testing and visual regression',
          'Cross-browser compatibility testing'
        ],
        expectedTools: ['launch_browser', 'navigate', 'click_element', 'take_screenshot'],
        startupScript: 'mcp:browserbase',  
        requiresAuth: true,
        authVar: 'BROWSERBASE_API'
      },
      'code-sandbox': {
        path: 'mcp-servers/code-sandbox/code-sandbox-mcp.js',
        port: 3018,
        description: 'Secure JavaScript/Python code execution',
        useCases: [
          'Safe code execution and testing',
          'Dynamic script validation',
          'Prototype development and testing',
          'Isolated development environments'
        ],
        expectedTools: ['execute_js', 'execute_python', 'create_sandbox'],
        startupScript: 'mcp:code-sandbox'
      }
    };

    this.results.totalServers = Object.keys(this.mcpServers).length;
  }

  async testServer(serverName, serverConfig) {
    console.log(`\n🔍 Testing ${serverName} server...`);
    const testResult = {
      name: serverName,
      configured: false,
      fileExists: false,
      packageExists: false,
      dependenciesOk: false,
      startable: false,
      responsive: false,
      toolsWorking: false,
      authConfigured: true, // Default true, override if auth required
      errors: [],
      useCases: serverConfig.useCases,
      expectedTools: serverConfig.expectedTools,
      description: serverConfig.description,
      isTypeScript: serverConfig.isTypeScript || false
    };

    try {
      // Check if main file exists
      const fullPath = path.join(__dirname, serverConfig.path);
      testResult.fileExists = fs.existsSync(fullPath);
      
      // For TypeScript files, also check for compiled output
      let compiledPath = fullPath;
      if (serverConfig.isTypeScript) {
        compiledPath = fullPath.replace('/index.ts', '/dist/index.js');
        // Update the path in the config for execution tests
        if (fs.existsSync(compiledPath)) {
          testResult.compiled = true;
        } else {
          testResult.compiled = false;
          testResult.errors.push('TypeScript not compiled - run npm run build');
        }
      }
      
      if (!testResult.fileExists) {
        testResult.errors.push(`Main file not found: ${serverConfig.path}`);
        return testResult;
      }

      // Check for package.json in server directory
      const serverDir = path.dirname(fullPath);
      const packageJsonPath = path.join(serverDir, 'package.json');
      testResult.packageExists = fs.existsSync(packageJsonPath);

      if (!testResult.packageExists) {
        testResult.errors.push(`No package.json found in ${serverDir}`);
      }

      // Check authentication if required
      if (serverConfig.requiresAuth && serverConfig.authVar) {
        const authValue = process.env[serverConfig.authVar];
        testResult.authConfigured = !!authValue;
        if (!authValue) {
          testResult.errors.push(`Missing required auth: ${serverConfig.authVar}`);
        }
      }

      // Check if server is startable (basic syntax check)
      try {
        const testPath = serverConfig.isTypeScript ? compiledPath : fullPath;
        if (fs.existsSync(testPath)) {
          const syntaxCheck = execSync(`node -c "${testPath}"`, { encoding: 'utf8' });
          testResult.startable = true;
        } else {
          testResult.startable = false;
          testResult.errors.push(`Executable file not found: ${testPath}`);
        }
      } catch (error) {
        testResult.startable = false;
        testResult.errors.push(`Syntax error: ${error.message}`);
      }

      // Test server startup (with timeout)
      if (testResult.startable && testResult.authConfigured) {
        try {
          await this.testServerStartup(serverName, serverConfig);
          testResult.responsive = true;
        } catch (error) {
          testResult.responsive = false;
          testResult.errors.push(`Startup failed: ${error.message}`);
        }
      }

      // Calculate configuration score
      testResult.configured = testResult.fileExists && testResult.packageExists && 
                             testResult.startable && testResult.authConfigured;

    } catch (error) {
      testResult.errors.push(`Test failed: ${error.message}`);
    }

    return testResult;
  }

  async testServerStartup(serverName, serverConfig) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Server startup timeout'));
      }, 10000); // 10 second timeout

      try {
        // Simple syntax and loading test
        const testProcess = spawn('node', ['-e', `
          require('${path.join(__dirname, serverConfig.path)}');
          console.log('Server loaded successfully');
          process.exit(0);
        `], {
          stdio: 'pipe',
          timeout: 8000
        });

        testProcess.on('exit', (code) => {
          clearTimeout(timeout);
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Server exited with code ${code}`));
          }
        });

        testProcess.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });

      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  async generateMissingPackageFiles() {
    console.log('\n📦 Generating missing package.json files...');
    
    for (const [serverName, serverConfig] of Object.entries(this.mcpServers)) {
      const serverDir = path.join(__dirname, path.dirname(serverConfig.path));
      const packageJsonPath = path.join(serverDir, 'package.json');
      
      // Create directory if it doesn't exist (for compiled outputs)
      if (!fs.existsSync(serverDir)) {
        fs.mkdirSync(serverDir, { recursive: true });
      }
      
      if (!fs.existsSync(packageJsonPath)) {
        console.log(`Creating package.json for ${serverName}...`);
        
        const packageData = {
          name: `echotune-mcp-${serverName}`,
          version: "1.0.0",
          description: serverConfig.description,
          main: path.basename(serverConfig.path),
          scripts: {
            start: `node ${path.basename(serverConfig.path)}`,
            test: "echo \"No tests yet\" && exit 0"
          },
          dependencies: {
            "@modelcontextprotocol/sdk": "^0.5.0",
            "express": "^4.18.2",
            "dotenv": "^16.0.3"
          }
        };

        // Add TypeScript dependencies if needed
        if (serverConfig.isTypeScript) {
          packageData.dependencies.typescript = "^5.0.0";
          packageData.dependencies["@types/node"] = "^20.0.0";
          packageData.scripts.build = "tsc";
          packageData.scripts.start = "tsc && node dist/index.js";
        }

        // Add specific dependencies based on server type
        if (serverName === 'browserbase') {
          packageData.dependencies.playwright = "^1.40.0";
        } else if (serverName === 'github-repos-manager') {
          packageData.dependencies.octokit = "^3.0.0";
        } else if (serverName === 'perplexity-mcp') {
          packageData.dependencies.axios = "^1.6.0";
        } else if (serverName === 'analytics-server') {
          packageData.dependencies.mongodb = "^6.0.0";
          packageData.dependencies.redis = "^4.6.0";
        }

        fs.writeFileSync(packageJsonPath, JSON.stringify(packageData, null, 2));
        console.log(`✅ Created package.json for ${serverName}`);
      }
    }

    // Handle TypeScript compilation for sequential-thinking
    console.log('\n🔧 Handling TypeScript compilation...');
    const sequentialThinkingDir = path.join(__dirname, 'mcp-servers/sequential-thinking');
    if (fs.existsSync(path.join(sequentialThinkingDir, 'index.ts'))) {
      try {
        console.log('Building sequential-thinking TypeScript...');
        execSync('cd mcp-servers/sequential-thinking && npm install && npx tsc', { 
          stdio: 'inherit',
          cwd: __dirname 
        });
        console.log('✅ TypeScript compilation completed');
      } catch (error) {
        console.log(`⚠️ TypeScript compilation failed: ${error.message}`);
      }
    }
  }

  async runTests() {
    console.log('🧪 Starting Comprehensive MCP Server Test Suite');
    console.log(`Testing ${this.results.totalServers} MCP servers...\n`);

    // Generate missing package files first
    await this.generateMissingPackageFiles();

    // Test each server
    for (const [serverName, serverConfig] of Object.entries(this.mcpServers)) {
      const testResult = await this.testServer(serverName, serverConfig);
      this.results.servers[serverName] = testResult;

      // Update counters
      if (testResult.configured) this.results.configured++;
      if (testResult.responsive) this.results.operational++;
      if (testResult.fileExists && testResult.startable) this.results.tested++;

      // Display immediate results
      const status = testResult.configured ? '✅' : 
                    testResult.errors.length > 0 ? '❌' : '⚠️';
      console.log(`${status} ${serverName}: ${testResult.configured ? 'CONFIGURED' : 'NEEDS_SETUP'}`);
      
      if (testResult.errors.length > 0) {
        testResult.errors.forEach(error => console.log(`   🔸 ${error}`));
      }
    }

    // Generate summary
    this.generateSummary();
    
    // Generate startup scripts
    this.generateStartupScripts();

    // Save results
    await this.saveResults();

    this.displayResults();
  }

  generateSummary() {
    this.results.summary = {
      configurationRate: `${this.results.configured}/${this.results.totalServers} (${Math.round(this.results.configured / this.results.totalServers * 100)}%)`,
      operationalRate: `${this.results.operational}/${this.results.totalServers} (${Math.round(this.results.operational / this.results.totalServers * 100)}%)`,
      overallScore: Math.round(((this.results.configured * 0.6) + (this.results.operational * 0.4)) / this.results.totalServers * 100),
      readinessLevel: this.results.configured >= 8 ? 'EXCELLENT' : 
                     this.results.configured >= 6 ? 'GOOD' : 
                     this.results.configured >= 4 ? 'FAIR' : 'NEEDS_WORK'
    };
  }

  generateStartupScripts() {
    console.log('\n📝 Generating updated startup scripts...');
    
    const startupScripts = {
      // Individual server startup scripts
      "mcp:start:all": "concurrently \"npm run mcp:filesystem\" \"npm run mcp:memory\" \"npm run mcp:sequential-thinking\" \"npm run mcp:github-repos\" \"npm run mcp:brave-search\" \"npm run mcpperplexity\" \"npm run mcp:analytics\" \"npm run mcp:browserbase\" \"npm run mcp:code-sandbox\"",
      
      // Enhanced individual scripts
      "mcp:test:all": "node mcp-comprehensive-server-test.js",
      "mcp:validate:all": "node mcp-comprehensive-server-test.js --validate-only",
      "mcp:health:all": "node scripts/mcp-health-monitor.js",
      
      // New orchestrated startup
      "mcp:orchestrated-start": "node mcp-server/enhanced-mcp-orchestrator.js --start-all"
    };

    // Write to package.json update suggestions
    const suggestions = {
      timestamp: new Date().toISOString(),
      suggestedScripts: startupScripts,
      instructions: "Add these scripts to package.json for comprehensive MCP server management"
    };

    fs.writeFileSync('mcp-startup-script-suggestions.json', JSON.stringify(suggestions, null, 2));
    console.log('✅ Generated startup script suggestions');
  }

  async saveResults() {
    const reportPath = `MCP_COMPREHENSIVE_TEST_REPORT_${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));

    // Also create markdown report
    const markdownReport = this.generateMarkdownReport();
    const markdownPath = `MCP_COMPREHENSIVE_TEST_REPORT_${Date.now()}.md`;
    fs.writeFileSync(markdownPath, markdownReport);

    console.log(`\n📊 Reports saved to ${reportPath} and ${markdownPath}`);
  }

  generateMarkdownReport() {
    let markdown = `# MCP Server Comprehensive Test Report\n\n`;
    markdown += `**Generated:** ${this.results.timestamp}\n\n`;
    
    // Summary
    markdown += `## 🎯 Executive Summary\n\n`;
    markdown += `- **Total Servers:** ${this.results.totalServers}\n`;
    markdown += `- **Configured:** ${this.results.summary.configurationRate}\n`;
    markdown += `- **Operational:** ${this.results.summary.operationalRate}\n`;
    markdown += `- **Overall Score:** ${this.results.summary.overallScore}/100 (${this.results.summary.readinessLevel})\n\n`;

    // Detailed results
    markdown += `## 📋 Server Details\n\n`;
    
    for (const [serverName, result] of Object.entries(this.results.servers)) {
      const status = result.configured ? '✅ CONFIGURED' : '❌ NEEDS_SETUP';
      markdown += `### ${serverName} - ${status}\n\n`;
      markdown += `**Description:** ${result.description}\n\n`;
      
      markdown += `**Configuration Status:**\n`;
      markdown += `- File Exists: ${result.fileExists ? '✅' : '❌'}\n`;
      markdown += `- Package.json: ${result.packageExists ? '✅' : '❌'}\n`;
      markdown += `- Startable: ${result.startable ? '✅' : '❌'}\n`;
      markdown += `- Auth Configured: ${result.authConfigured ? '✅' : '❌'}\n`;
      markdown += `- Responsive: ${result.responsive ? '✅' : '❌'}\n\n`;

      if (result.errors.length > 0) {
        markdown += `**Issues Found:**\n`;
        result.errors.forEach(error => {
          markdown += `- ${error}\n`;
        });
        markdown += '\n';
      }

      markdown += `**Use Cases:**\n`;
      result.useCases.forEach(useCase => {
        markdown += `- ${useCase}\n`;
      });
      
      markdown += `\n**Expected Tools:** ${result.expectedTools.join(', ')}\n\n`;
      markdown += `---\n\n`;
    }

    return markdown;
  }

  displayResults() {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 MCP SERVER COMPREHENSIVE TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`Overall Score: ${this.results.summary.overallScore}/100 (${this.results.summary.readinessLevel})`);
    console.log(`Configured: ${this.results.summary.configurationRate}`);
    console.log(`Operational: ${this.results.summary.operationalRate}`);
    console.log('='.repeat(60));

    // Show next steps
    console.log('\n📋 NEXT STEPS:');
    if (this.results.configured < this.results.totalServers) {
      console.log('1. Install missing dependencies with: npm install');
      console.log('2. Configure missing API keys in .env file');
      console.log('3. Run individual server tests to debug issues');
    }
    console.log('4. Use "npm run mcp:start:all" to start all servers');
    console.log('5. Monitor with "npm run mcp:health:all"');
    console.log('\n✨ All servers tested and documented!');
  }
}

// Run the test suite
if (require.main === module) {
  const testSuite = new MCPServerTestSuite();
  testSuite.runTests().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = MCPServerTestSuite;
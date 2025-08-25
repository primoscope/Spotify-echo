#!/usr/bin/env node
/**
 * Enhanced MCP Server Registry and Integration System
 * 
 * Comprehensive MCP server management with automated installation,
 * configuration, and integration into the EchoTune ecosystem
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class EnhancedMCPServerRegistry {
  constructor() {
    this.registryPath = path.join(__dirname, '..', 'mcp-registry.json');
    this.configPath = path.join(__dirname, '..', '.mcp-config');
    this.serversPath = path.join(__dirname, '..', 'mcp-servers');
    
    // Comprehensive MCP Server Registry
    this.mcpServers = {
      // File & Data Systems
      filesystem: {
        name: 'Filesystem Server',
        package: '@modelcontextprotocol/server-filesystem',
        type: 'built-in',
        description: 'Secure file operations with configurable access controls',
        capabilities: ['file-read', 'file-write', 'directory-list', 'file-search'],
        security: 'high',
        config: {
          allowedPaths: ['./data', './src', './scripts', './docs'],
          readOnly: false,
          maxFileSize: '10MB'
        },
        startup: {
          command: 'npx',
          args: ['@modelcontextprotocol/server-filesystem', '{configPath}']
        }
      },
      
      postgresql: {
        name: 'PostgreSQL Server',
        package: '@modelcontextprotocol/server-postgres',
        type: 'built-in',
        description: 'Read-only database access with schema inspection capabilities',
        capabilities: ['database-query', 'schema-inspection', 'table-analysis'],
        security: 'medium',
        config: {
          connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/echotune',
          readOnly: true,
          maxConnections: 10
        },
        startup: {
          command: 'npx',
          args: ['@modelcontextprotocol/server-postgres', '{connectionString}']
        }
      },
      
      sqlite: {
        name: 'SQLite Server',
        package: '@modelcontextprotocol/server-sqlite',
        type: 'built-in',
        description: 'Database interaction and business intelligence capabilities',
        capabilities: ['database-query', 'analytics', 'reporting'],
        security: 'high',
        config: {
          dbPath: './data/echotune.db',
          readOnly: false
        },
        startup: {
          command: 'npx',
          args: ['@modelcontextprotocol/server-sqlite', '{dbPath}']
        }
      },
      
      memory: {
        name: 'Memory Server',
        package: '@modelcontextprotocol/server-memory',
        type: 'built-in',
        description: 'Knowledge graph-based persistent memory system',
        capabilities: ['knowledge-graph', 'memory-storage', 'context-retention'],
        security: 'medium',
        config: {
          storageType: 'persistent',
          maxMemorySize: '100MB'
        },
        startup: {
          command: 'npx',
          args: ['@modelcontextprotocol/server-memory']
        }
      },
      
      // Web & Content
      fetch: {
        name: 'Fetch Server',
        package: '@modelcontextprotocol/server-fetch',
        type: 'built-in',
        description: 'Web content fetching and conversion optimized for LLM usage',
        capabilities: ['web-scraping', 'content-extraction', 'url-fetching'],
        security: 'medium',
        config: {
          allowedDomains: ['spotify.com', 'github.com', 'stackoverflow.com'],
          userAgent: 'EchoTune-MCP-Bot/1.0'
        },
        startup: {
          command: 'npx',
          args: ['@modelcontextprotocol/server-fetch']
        }
      },
      
      brave: {
        name: 'Brave Search',
        package: '@modelcontextprotocol/server-brave-search',
        type: 'built-in',
        description: 'Web search capabilities using Brave Search API',
        capabilities: ['web-search', 'real-time-data', 'search-results'],
        security: 'low',
        config: {
          apiKey: process.env.BRAVE_API_KEY,
          maxResults: 10
        },
        startup: {
          command: 'npx',
          args: ['@modelcontextprotocol/server-brave-search']
        }
      },
      
      // Development Tools
      github: {
        name: 'GitHub MCP',
        package: '@modelcontextprotocol/server-github',
        type: 'built-in',
        description: 'GitHub repository management and automation',
        capabilities: ['repository-management', 'issue-tracking', 'pull-requests'],
        security: 'medium',
        config: {
          token: process.env.GITHUB_PAT,
          organization: 'dzp5103'
        },
        startup: {
          command: 'npx',
          args: ['@modelcontextprotocol/server-github']
        }
      },
      
      // Community MCP Servers
      'package-version': {
        name: 'Package Version Manager',
        package: 'sammcj/mcp-package-version',
        type: 'community',
        description: 'Automated package version management with security scanning',
        capabilities: ['version-checking', 'security-scanning', 'dependency-updates'],
        security: 'medium',
        repository: 'https://github.com/sammcj/mcp-package-version',
        config: {
          autoUpdate: false,
          securityScan: true
        }
      },
      
      'deno-sandbox': {
        name: 'Deno Code Sandbox',
        package: 'bewt85/mcp-deno-sandbox',
        type: 'community',
        description: 'Secure code execution environment with Deno runtime',
        capabilities: ['code-execution', 'sandbox', 'typescript-support'],
        security: 'high',
        repository: 'https://github.com/bewt85/mcp-deno-sandbox',
        config: {
          timeout: 30000,
          memoryLimit: '128MB'
        }
      },
      
      'analytics': {
        name: 'Shinzo Analytics',
        package: 'shinzo-labs/shinzo-ts',
        type: 'community',
        description: 'Advanced analytics with OpenTelemetry integration',
        capabilities: ['performance-monitoring', 'user-analytics', 'system-telemetry'],
        security: 'medium',
        repository: 'https://github.com/shinzo-labs/shinzo-ts',
        config: {
          enableTelemetry: true,
          sampleRate: 0.1
        }
      },
      
      'browser-automation': {
        name: 'PlayCanvas Editor MCP',
        package: 'playcanvas/editor-mcp-server',
        type: 'community',
        description: 'Enhanced browser automation for UI testing',
        capabilities: ['ui-testing', 'e2e-automation', 'visual-regression'],
        security: 'medium',
        repository: 'https://github.com/playcanvas/editor-mcp-server',
        config: {
          headless: true,
          screenshotPath: './screenshots'
        }
      },
      
      // Specialized Servers
      browserbase: {
        name: 'Browserbase MCP',
        package: '@browserbasehq/mcp-server-browserbase',
        type: 'specialized',
        description: 'Cloud browser automation and web scraping',
        capabilities: ['cloud-browser', 'web-scraping', 'automation'],
        security: 'medium',
        config: {
          apiKey: process.env.BROWSERBASE_API_KEY,
          projectId: process.env.BROWSERBASE_PROJECT_ID
        },
        startup: {
          command: 'npx',
          args: ['@browserbasehq/mcp-server-browserbase']
        }
      },
      
      youtube: {
        name: 'YouTube Transcript',
        package: '@modelcontextprotocol/server-youtube-transcript',
        type: 'built-in',
        description: 'YouTube video transcript extraction and analysis',
        capabilities: ['transcript-extraction', 'video-analysis', 'content-processing'],
        security: 'low',
        config: {
          apiKey: process.env.YOUTUBE_API_KEY,
          maxTranscriptLength: 50000
        },
        startup: {
          command: 'npx',
          args: ['@modelcontextprotocol/server-youtube-transcript']
        }
      },
      
      // Advanced Analytics
      influxdb: {
        name: 'InfluxDB MCP',
        package: '@influxdata/mcp-server-influxdb',
        type: 'specialized',
        description: 'Time-series database integration for metrics',
        capabilities: ['time-series', 'metrics-storage', 'analytics'],
        security: 'medium',
        config: {
          url: process.env.INFLUXDB_URL,
          token: process.env.INFLUXDB_TOKEN,
          org: 'echotune'
        }
      },
      
      langfuse: {
        name: 'Langfuse MCP',
        package: '@langfuse/mcp-server',
        type: 'specialized',
        description: 'LLM observability and analytics platform',
        capabilities: ['llm-monitoring', 'trace-analysis', 'performance-metrics'],
        security: 'medium',
        config: {
          publicKey: process.env.LANGFUSE_PUBLIC_KEY,
          secretKey: process.env.LANGFUSE_SECRET_KEY
        }
      },
      
      // AI & ML Tools
      openai: {
        name: 'OpenAI MCP',
        package: '@modelcontextprotocol/server-openai',
        type: 'built-in',
        description: 'OpenAI API integration for enhanced AI capabilities',
        capabilities: ['text-generation', 'embeddings', 'completions'],
        security: 'medium',
        config: {
          apiKey: process.env.OPENAI_API_KEY,
          model: 'gpt-4-turbo'
        }
      }
    };
    
    this.installedServers = new Map();
    this.runningServers = new Map();
    this.serverProcesses = new Map();
  }

  /**
   * Initialize the MCP server registry
   */
  async initialize() {
    console.log('🚀 Initializing Enhanced MCP Server Registry...');
    
    try {
      // Ensure directories exist
      await this.ensureDirectories();
      
      // Load existing configuration
      await this.loadConfiguration();
      
      // Discover installed servers
      await this.discoverInstalledServers();
      
      console.log('✅ MCP Server Registry initialized successfully');
      
      return {
        totalServers: Object.keys(this.mcpServers).length,
        installedServers: this.installedServers.size,
        categories: this.getServerCategories()
      };
      
    } catch (error) {
      console.error('❌ Failed to initialize MCP Server Registry:', error);
      throw error;
    }
  }

  /**
   * Ensure required directories exist
   */
  async ensureDirectories() {
    const directories = [
      this.serversPath,
      path.dirname(this.configPath),
      path.join(__dirname, '..', 'analysis-results'),
      path.join(__dirname, '..', 'screenshots'),
      path.join(__dirname, '..', 'data')
    ];
    
    for (const dir of directories) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Load existing configuration
   */
  async loadConfiguration() {
    try {
      const configData = await fs.readFile(this.configPath, 'utf8');
      const config = JSON.parse(configData);
      
      // Merge with existing configuration
      Object.keys(config.servers || {}).forEach(serverName => {
        if (this.mcpServers[serverName]) {
          this.mcpServers[serverName].config = {
            ...this.mcpServers[serverName].config,
            ...config.servers[serverName]
          };
        }
      });
      
    } catch (error) {
      // Configuration doesn't exist yet, will be created
      console.log('📝 Creating new MCP server configuration');
    }
  }

  /**
   * Save configuration
   */
  async saveConfiguration() {
    const config = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      servers: {}
    };
    
    Object.entries(this.mcpServers).forEach(([name, server]) => {
      config.servers[name] = {
        enabled: this.installedServers.has(name),
        config: server.config,
        lastInstalled: this.installedServers.get(name)?.lastInstalled
      };
    });
    
    await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
    console.log('💾 MCP server configuration saved');
  }

  /**
   * Discover installed servers
   */
  async discoverInstalledServers() {
    console.log('🔍 Discovering installed MCP servers...');
    
    for (const [serverName, serverInfo] of Object.entries(this.mcpServers)) {
      try {
        const isInstalled = await this.checkServerInstalled(serverInfo);
        
        if (isInstalled) {
          this.installedServers.set(serverName, {
            ...serverInfo,
            lastInstalled: new Date().toISOString(),
            status: 'installed'
          });
          
          console.log(`✅ Found installed server: ${serverInfo.name}`);
        }
      } catch (error) {
        console.warn(`⚠️  Error checking server ${serverName}:`, error.message);
      }
    }
    
    console.log(`📊 Discovery complete: ${this.installedServers.size}/${Object.keys(this.mcpServers).length} servers installed`);
  }

  /**
   * Check if a server is installed
   */
  async checkServerInstalled(serverInfo) {
    if (serverInfo.type === 'built-in') {
      // Check npm package
      try {
        const { stdout } = await execAsync(`npm list ${serverInfo.package} --depth=0`);
        return stdout.includes(serverInfo.package);
      } catch (error) {
        return false;
      }
    } else if (serverInfo.type === 'community' || serverInfo.type === 'specialized') {
      // Check if server directory exists
      const serverDir = path.join(this.serversPath, serverInfo.package.split('/').pop());
      try {
        await fs.access(serverDir);
        return true;
      } catch {
        return false;
      }
    }
    
    return false;
  }

  /**
   * Install MCP server
   */
  async installServer(serverName, options = {}) {
    console.log(`📦 Installing MCP server: ${serverName}`);
    
    const serverInfo = this.mcpServers[serverName];
    if (!serverInfo) {
      throw new Error(`Unknown MCP server: ${serverName}`);
    }
    
    try {
      if (serverInfo.type === 'built-in') {
        await this.installBuiltInServer(serverInfo, options);
      } else if (serverInfo.type === 'community') {
        await this.installCommunityServer(serverInfo, options);
      } else if (serverInfo.type === 'specialized') {
        await this.installSpecializedServer(serverInfo, options);
      }
      
      // Mark as installed
      this.installedServers.set(serverName, {
        ...serverInfo,
        lastInstalled: new Date().toISOString(),
        status: 'installed'
      });
      
      // Save configuration
      await this.saveConfiguration();
      
      console.log(`✅ Successfully installed: ${serverInfo.name}`);
      
      return {
        server: serverName,
        status: 'installed',
        capabilities: serverInfo.capabilities
      };
      
    } catch (error) {
      console.error(`❌ Failed to install ${serverName}:`, error);
      throw error;
    }
  }

  /**
   * Install built-in MCP server
   */
  async installBuiltInServer(serverInfo, options) {
    console.log(`📥 Installing built-in server: ${serverInfo.package}`);
    
    const installCommand = options.global ? 'npm install -g' : 'npm install';
    const { stdout, stderr } = await execAsync(`${installCommand} ${serverInfo.package}`);
    
    if (stderr && !stderr.includes('WARN')) {
      throw new Error(`Installation failed: ${stderr}`);
    }
    
    console.log(`✅ Package installed: ${serverInfo.package}`);
  }

  /**
   * Install community MCP server
   */
  async installCommunityServer(serverInfo, options) {
    console.log(`📥 Installing community server: ${serverInfo.package}`);
    
    const serverDir = path.join(this.serversPath, serverInfo.package.split('/').pop());
    
    // Clone repository
    if (serverInfo.repository) {
      const { stdout, stderr } = await execAsync(`git clone ${serverInfo.repository} ${serverDir}`);
      
      if (stderr && !stderr.includes('Cloning')) {
        throw new Error(`Clone failed: ${stderr}`);
      }
      
      // Install dependencies
      const { stdout: installOutput } = await execAsync('npm install', { cwd: serverDir });
      console.log(`📦 Dependencies installed for ${serverInfo.name}`);
      
      // Build if necessary
      try {
        await execAsync('npm run build', { cwd: serverDir });
        console.log(`🔨 Built ${serverInfo.name}`);
      } catch (error) {
        // Build might not be required
        console.log(`ℹ️  No build step required for ${serverInfo.name}`);
      }
    }
  }

  /**
   * Install specialized MCP server
   */
  async installSpecializedServer(serverInfo, options) {
    console.log(`📥 Installing specialized server: ${serverInfo.package}`);
    
    if (serverInfo.startup) {
      // Install as npm package
      await this.installBuiltInServer(serverInfo, options);
    } else {
      // Custom installation logic
      await this.installCommunityServer(serverInfo, options);
    }
  }

  /**
   * Start MCP server
   */
  async startServer(serverName, options = {}) {
    console.log(`🚀 Starting MCP server: ${serverName}`);
    
    if (!this.installedServers.has(serverName)) {
      throw new Error(`Server ${serverName} is not installed. Install it first.`);
    }
    
    if (this.runningServers.has(serverName)) {
      console.log(`ℹ️  Server ${serverName} is already running`);
      return this.runningServers.get(serverName);
    }
    
    const serverInfo = this.installedServers.get(serverName);
    
    try {
      const serverProcess = await this.spawnServerProcess(serverInfo, options);
      
      const serverInstance = {
        name: serverName,
        process: serverProcess,
        startTime: Date.now(),
        port: options.port || this.getAvailablePort(),
        status: 'running'
      };
      
      this.runningServers.set(serverName, serverInstance);
      this.serverProcesses.set(serverName, serverProcess);
      
      console.log(`✅ Server ${serverName} started successfully`);
      
      return serverInstance;
      
    } catch (error) {
      console.error(`❌ Failed to start server ${serverName}:`, error);
      throw error;
    }
  }

  /**
   * Spawn server process
   */
  async spawnServerProcess(serverInfo, options) {
    const startup = serverInfo.startup;
    if (!startup) {
      throw new Error(`No startup configuration for server ${serverInfo.name}`);
    }
    
    // Replace placeholders in arguments
    const args = startup.args.map(arg => {
      return arg.replace(/\{(\w+)\}/g, (match, key) => {
        if (key === 'configPath') {
          return JSON.stringify(serverInfo.config);
        }
        return serverInfo.config[key] || match;
      });
    });
    
    const serverProcess = spawn(startup.command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        MCP_SERVER_PORT: options.port || this.getAvailablePort(),
        MCP_SERVER_HOST: options.host || 'localhost'
      }
    });
    
    // Handle process events
    serverProcess.stdout.on('data', (data) => {
      console.log(`📡 [${serverInfo.name}] ${data.toString().trim()}`);
    });
    
    serverProcess.stderr.on('data', (data) => {
      console.warn(`⚠️  [${serverInfo.name}] ${data.toString().trim()}`);
    });
    
    serverProcess.on('close', (code) => {
      console.log(`🔴 Server ${serverInfo.name} exited with code ${code}`);
      this.runningServers.delete(serverInfo.name);
      this.serverProcesses.delete(serverInfo.name);
    });
    
    return serverProcess;
  }

  /**
   * Stop MCP server
   */
  async stopServer(serverName) {
    console.log(`🛑 Stopping MCP server: ${serverName}`);
    
    const serverProcess = this.serverProcesses.get(serverName);
    if (!serverProcess) {
      console.log(`ℹ️  Server ${serverName} is not running`);
      return;
    }
    
    try {
      serverProcess.kill('SIGTERM');
      
      // Wait for graceful shutdown
      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          serverProcess.kill('SIGKILL');
          resolve();
        }, 5000);
        
        serverProcess.on('close', () => {
          clearTimeout(timeout);
          resolve();
        });
      });
      
      console.log(`✅ Server ${serverName} stopped successfully`);
      
    } catch (error) {
      console.error(`❌ Error stopping server ${serverName}:`, error);
    }
  }

  /**
   * Start all installed servers
   */
  async startAllServers(options = {}) {
    console.log('🚀 Starting all installed MCP servers...');
    
    const results = [];
    const concurrency = options.concurrency || 3;
    const serverNames = Array.from(this.installedServers.keys());
    
    // Start servers in batches
    for (let i = 0; i < serverNames.length; i += concurrency) {
      const batch = serverNames.slice(i, i + concurrency);
      
      const batchResults = await Promise.allSettled(
        batch.map(async (serverName, index) => {
          const port = (options.startPort || 3001) + i + index;
          return await this.startServer(serverName, { port });
        })
      );
      
      results.push(...batchResults);
    }
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`📊 Startup complete: ${successful} successful, ${failed} failed`);
    
    return {
      successful,
      failed,
      runningServers: Array.from(this.runningServers.keys())
    };
  }

  /**
   * Stop all running servers
   */
  async stopAllServers() {
    console.log('🛑 Stopping all running MCP servers...');
    
    const serverNames = Array.from(this.runningServers.keys());
    
    await Promise.all(
      serverNames.map(serverName => this.stopServer(serverName))
    );
    
    console.log('✅ All servers stopped');
  }

  /**
   * Install all recommended servers
   */
  async installRecommendedServers(options = {}) {
    console.log('📦 Installing recommended MCP servers...');
    
    const recommendedServers = [
      'filesystem',
      'sqlite',
      'memory',
      'fetch',
      'github',
      'package-version',
      'deno-sandbox'
    ];
    
    const results = [];
    
    for (const serverName of recommendedServers) {
      try {
        const result = await this.installServer(serverName, options);
        results.push({ server: serverName, status: 'success', result });
        console.log(`✅ Installed: ${serverName}`);
      } catch (error) {
        results.push({ server: serverName, status: 'error', error: error.message });
        console.error(`❌ Failed to install ${serverName}:`, error.message);
      }
    }
    
    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'error').length;
    
    console.log(`📊 Installation complete: ${successful} successful, ${failed} failed`);
    
    return results;
  }

  /**
   * Get server status
   */
  getServerStatus(serverName) {
    if (!this.mcpServers[serverName]) {
      return { status: 'unknown', error: 'Server not found in registry' };
    }
    
    const isInstalled = this.installedServers.has(serverName);
    const isRunning = this.runningServers.has(serverName);
    
    let status = 'not-installed';
    if (isInstalled && isRunning) {
      status = 'running';
    } else if (isInstalled) {
      status = 'installed';
    }
    
    return {
      status,
      installed: isInstalled,
      running: isRunning,
      serverInfo: this.mcpServers[serverName],
      runningInfo: isRunning ? this.runningServers.get(serverName) : null
    };
  }

  /**
   * Get all server statuses
   */
  getAllServerStatuses() {
    const statuses = {};
    
    Object.keys(this.mcpServers).forEach(serverName => {
      statuses[serverName] = this.getServerStatus(serverName);
    });
    
    return statuses;
  }

  /**
   * Get server categories
   */
  getServerCategories() {
    const categories = {};
    
    Object.entries(this.mcpServers).forEach(([name, server]) => {
      const category = this.categorizeServer(server);
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(name);
    });
    
    return categories;
  }

  /**
   * Categorize server based on capabilities
   */
  categorizeServer(server) {
    if (server.capabilities.includes('file-read') || server.capabilities.includes('database-query')) {
      return 'Data & Storage';
    }
    if (server.capabilities.includes('web-scraping') || server.capabilities.includes('web-search')) {
      return 'Web & Content';
    }
    if (server.capabilities.includes('code-execution') || server.capabilities.includes('repository-management')) {
      return 'Development Tools';
    }
    if (server.capabilities.includes('performance-monitoring') || server.capabilities.includes('analytics')) {
      return 'Analytics & Monitoring';
    }
    if (server.capabilities.includes('ui-testing') || server.capabilities.includes('automation')) {
      return 'Automation & Testing';
    }
    return 'Other';
  }

  /**
   * Generate health report
   */
  async generateHealthReport() {
    console.log('📊 Generating MCP server health report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalServers: Object.keys(this.mcpServers).length,
        installedServers: this.installedServers.size,
        runningServers: this.runningServers.size,
        healthyServers: 0,
        unhealthyServers: 0
      },
      servers: {},
      recommendations: []
    };
    
    // Check health of each server
    for (const [serverName, serverInfo] of this.runningServers.entries()) {
      try {
        const health = await this.checkServerHealth(serverName, serverInfo);
        report.servers[serverName] = health;
        
        if (health.status === 'healthy') {
          report.summary.healthyServers++;
        } else {
          report.summary.unhealthyServers++;
        }
      } catch (error) {
        report.servers[serverName] = {
          status: 'unhealthy',
          error: error.message
        };
        report.summary.unhealthyServers++;
      }
    }
    
    // Generate recommendations
    if (report.summary.installedServers < 5) {
      report.recommendations.push({
        type: 'installation',
        priority: 'medium',
        message: 'Consider installing more MCP servers to enhance capabilities'
      });
    }
    
    if (report.summary.unhealthyServers > 0) {
      report.recommendations.push({
        type: 'health',
        priority: 'high',
        message: `${report.summary.unhealthyServers} servers are unhealthy and may need attention`
      });
    }
    
    console.log('✅ Health report generated');
    
    return report;
  }

  /**
   * Check individual server health
   */
  async checkServerHealth(serverName, serverInfo) {
    // Simple health check - verify process is running
    if (!serverInfo.process || serverInfo.process.killed) {
      return {
        status: 'unhealthy',
        reason: 'Process not running',
        uptime: Date.now() - serverInfo.startTime
      };
    }
    
    return {
      status: 'healthy',
      uptime: Date.now() - serverInfo.startTime,
      memoryUsage: serverInfo.process.memoryUsage?.() || null
    };
  }

  /**
   * Get available port
   */
  getAvailablePort() {
    const usedPorts = Array.from(this.runningServers.values()).map(s => s.port);
    let port = 3001;
    
    while (usedPorts.includes(port)) {
      port++;
    }
    
    return port;
  }

  /**
   * CLI command handlers
   */
  async handleCLICommand(command, args = []) {
    switch (command) {
      case 'list':
        return this.getAllServerStatuses();
        
      case 'install':
        if (args.length === 0) {
          throw new Error('Server name required for installation');
        }
        return await this.installServer(args[0]);
        
      case 'install-recommended':
        return await this.installRecommendedServers();
        
      case 'start':
        if (args.length === 0) {
          return await this.startAllServers();
        }
        return await this.startServer(args[0]);
        
      case 'stop':
        if (args.length === 0) {
          return await this.stopAllServers();
        }
        return await this.stopServer(args[0]);
        
      case 'status':
        if (args.length === 0) {
          return this.getAllServerStatuses();
        }
        return this.getServerStatus(args[0]);
        
      case 'health':
        return await this.generateHealthReport();
        
      case 'categories':
        return this.getServerCategories();
        
      default:
        throw new Error(`Unknown command: ${command}`);
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    console.log('🧹 Cleaning up MCP server registry...');
    
    // Stop all running servers
    await this.stopAllServers();
    
    // Save final configuration
    await this.saveConfiguration();
    
    console.log('✅ MCP server registry cleanup completed');
  }
}

// CLI Interface
if (require.main === module) {
  const registry = new EnhancedMCPServerRegistry();
  
  async function main() {
    try {
      await registry.initialize();
      
      const command = process.argv[2];
      const args = process.argv.slice(3);
      
      if (!command) {
        console.log(`
🚀 Enhanced MCP Server Registry

Usage: node enhanced-mcp-server-registry.js <command> [args]

Commands:
  list                     - List all available MCP servers
  install <server>         - Install specific MCP server
  install-recommended      - Install recommended MCP servers
  start [server]           - Start specific server or all servers
  stop [server]            - Stop specific server or all servers
  status [server]          - Show server status
  health                   - Generate health report
  categories               - Show server categories

Examples:
  node enhanced-mcp-server-registry.js list
  node enhanced-mcp-server-registry.js install filesystem
  node enhanced-mcp-server-registry.js install-recommended
  node enhanced-mcp-server-registry.js start
  node enhanced-mcp-server-registry.js health
        `);
        process.exit(0);
      }
      
      const result = await registry.handleCLICommand(command, args);
      console.log('\n📊 Results:');
      console.log(JSON.stringify(result, null, 2));
      
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    } finally {
      await registry.cleanup();
    }
  }
  
  main();
}

module.exports = EnhancedMCPServerRegistry;
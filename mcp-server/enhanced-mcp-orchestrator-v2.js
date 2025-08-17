#!/usr/bin/env node

/**
 * Enhanced MCP Orchestrator with Continuous Analysis Integration
 * Manages all MCP servers and integrates with Perplexity research and Grok-4 analysis
 */

const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const ContinuousAnalysisSystem = require('../scripts/continuous-analysis-system');

class EnhancedMCPOrchestrator {
  constructor() {
    this.app = express();
    this.port = process.env.MCP_SERVER_PORT || 3001;
    this.servers = new Map();
    this.healthChecks = new Map();
    this.analysisSystem = new ContinuousAnalysisSystem();
    
    this.serverConfigs = {
      filesystem: {
        command: 'node',
        args: ['mcp-servers/filesystem/index.js'],
        port: 3010,
        description: 'Secure file operations and directory management',
      },
      memory: {
        command: 'node',
        args: ['mcp-servers/memory/index.js'],
        port: 3011,
        description: 'Persistent knowledge graph and context management',
      },
      postgresql: {
        command: 'node',
        args: ['mcp-servers/postgresql/index.js'],
        port: 3012,
        description: 'PostgreSQL database access with business intelligence',
      },
      sqlite: {
        command: 'node',
        args: ['mcp-servers/sqlite/index.js'],
        port: 3013,
        description: 'SQLite database operations and analytics',
      },
      fetch: {
        command: 'node',
        args: ['mcp-servers/fetch/index.js'],
        port: 3014,
        description: 'Web content fetching optimized for LLM usage',
      },
      'github-repos': {
        command: 'node',
        args: ['mcp-servers/github-repos-manager/index.js'],
        port: 3015,
        description: 'GitHub repository management and automation',
      },
      'brave-search': {
        command: 'node',
        args: ['mcp-servers/brave-search/brave-search-mcp.js'],
        port: 3016,
        description: 'Privacy-focused web search capabilities',
      },
      'sequential-thinking': {
        command: 'node',
        args: ['mcp-servers/sequential-thinking/dist/index.js'],
        port: 3017,
        description: 'Enhanced AI reasoning and problem solving',
      },
    };

    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // CORS middleware
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      next();
    });

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      next();
    });
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      const status = {
        orchestrator: 'healthy',
        timestamp: new Date().toISOString(),
        servers: this.getServerStatus(),
        analysisSystem: this.analysisSystem ? 'initialized' : 'not_initialized',
      };
      res.json(status);
    });

    // List all servers
    this.app.get('/servers', (req, res) => {
      const serverList = Object.entries(this.serverConfigs).map(([name, config]) => ({
        name,
        ...config,
        status: this.servers.has(name) ? 'running' : 'stopped',
        pid: this.servers.get(name)?.pid || null,
        lastHealthCheck: this.healthChecks.get(name) || null,
      }));
      res.json(serverList);
    });

    // Start specific server
    this.app.post('/servers/:name/start', async (req, res) => {
      const { name } = req.params;
      try {
        await this.startServer(name);
        res.json({ success: true, message: `Server ${name} started successfully` });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Stop specific server
    this.app.post('/servers/:name/stop', async (req, res) => {
      const { name } = req.params;
      try {
        await this.stopServer(name);
        res.json({ success: true, message: `Server ${name} stopped successfully` });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Restart specific server
    this.app.post('/servers/:name/restart', async (req, res) => {
      const { name } = req.params;
      try {
        await this.restartServer(name);
        res.json({ success: true, message: `Server ${name} restarted successfully` });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Start all servers
    this.app.post('/servers/start-all', async (req, res) => {
      try {
        const results = await this.startAllServers();
        res.json({
          success: true,
          message: 'All servers startup initiated',
          results: results,
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Stop all servers
    this.app.post('/servers/stop-all', async (req, res) => {
      try {
        await this.stopAllServers();
        res.json({ success: true, message: 'All servers stopped' });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Run continuous analysis
    this.app.post('/analysis/run', async (req, res) => {
      try {
        console.log('🧠 Starting analysis via API request...');
        const result = await this.analysisSystem.runSingleAnalysis();
        res.json({
          success: true,
          message: 'Analysis completed successfully',
          analysisId: result.id,
          tasksGenerated: result.generatedTasks?.length || 0,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
          message: 'Analysis failed',
        });
      }
    });

    // Get analysis status
    this.app.get('/analysis/status', (req, res) => {
      res.json({
        system: 'operational',
        providers: {
          perplexity: !!this.analysisSystem.perplexity?.apiKey,
          grok4: !!(this.analysisSystem.grok4?.apiKey || this.analysisSystem.grok4?.openRouterKey),
        },
        lastAnalysis: this.analysisSystem.analysisHistory?.[this.analysisSystem.analysisHistory.length - 1] || null,
        currentTasks: this.analysisSystem.currentTasks?.length || 0,
      });
    });

    // Perplexity research endpoint
    this.app.post('/research', async (req, res) => {
      const { query, options = {} } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }

      try {
        const result = await this.analysisSystem.perplexity.research(query, options);
        res.json({
          success: true,
          query: query,
          result: result.content,
          sources: result.metadata?.sources || [],
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
          message: 'Research query failed',
        });
      }
    });

    // Grok-4 analysis endpoint
    this.app.post('/analyze', async (req, res) => {
      const { code, analysisType = 'comprehensive', options = {} } = req.body;
      
      if (!code) {
        return res.status(400).json({ error: 'Code content is required' });
      }

      try {
        const result = await this.analysisSystem.grok4.analyzeRepository(code, analysisType, options);
        res.json({
          success: true,
          analysisType: analysisType,
          result: result.content,
          usage: result.usage || {},
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
          message: 'Code analysis failed',
        });
      }
    });

    // MCP server metrics
    this.app.get('/metrics', (req, res) => {
      res.json({
        totalServers: Object.keys(this.serverConfigs).length,
        runningServers: this.servers.size,
        healthyServers: Array.from(this.healthChecks.values()).filter(h => h.status === 'healthy').length,
        lastHealthCheckRun: Math.max(...Array.from(this.healthChecks.values()).map(h => new Date(h.timestamp).getTime())),
        systemUptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      });
    });

    // Server logs endpoint
    this.app.get('/servers/:name/logs', (req, res) => {
      const { name } = req.params;
      const server = this.servers.get(name);
      
      if (!server) {
        return res.status(404).json({ error: 'Server not found' });
      }

      res.json({
        server: name,
        logs: server.logs || [],
        pid: server.pid,
        status: server.status,
      });
    });
  }

  async startServer(name) {
    if (this.servers.has(name)) {
      throw new Error(`Server ${name} is already running`);
    }

    const config = this.serverConfigs[name];
    if (!config) {
      throw new Error(`Server configuration for ${name} not found`);
    }

    console.log(`🚀 Starting ${name} server...`);

    try {
      const serverProcess = spawn(config.command, config.args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, MCP_SERVER_NAME: name },
        detached: false,
      });

      const serverInfo = {
        process: serverProcess,
        pid: serverProcess.pid,
        name: name,
        status: 'starting',
        startTime: new Date().toISOString(),
        logs: [],
        config: config,
      };

      // Handle process events
      serverProcess.stdout.on('data', (data) => {
        const message = data.toString().trim();
        if (message) {
          serverInfo.logs.push({
            type: 'stdout',
            message: message,
            timestamp: new Date().toISOString(),
          });
          console.log(`[${name}] ${message}`);
        }
      });

      serverProcess.stderr.on('data', (data) => {
        const message = data.toString().trim();
        if (message) {
          serverInfo.logs.push({
            type: 'stderr',
            message: message,
            timestamp: new Date().toISOString(),
          });
          console.error(`[${name}] ERROR: ${message}`);
        }
      });

      serverProcess.on('close', (code) => {
        console.log(`[${name}] Process exited with code ${code}`);
        serverInfo.status = 'stopped';
        this.servers.delete(name);
      });

      serverProcess.on('error', (error) => {
        console.error(`[${name}] Process error:`, error);
        serverInfo.status = 'error';
        serverInfo.error = error.message;
      });

      this.servers.set(name, serverInfo);

      // Give the server a moment to start
      await new Promise(resolve => setTimeout(resolve, 2000));

      serverInfo.status = 'running';
      console.log(`✅ ${name} server started successfully (PID: ${serverProcess.pid})`);

    } catch (error) {
      console.error(`❌ Failed to start ${name} server:`, error);
      throw error;
    }
  }

  async stopServer(name) {
    const serverInfo = this.servers.get(name);
    if (!serverInfo) {
      throw new Error(`Server ${name} is not running`);
    }

    console.log(`🛑 Stopping ${name} server (PID: ${serverInfo.pid})...`);

    try {
      serverInfo.process.kill('SIGTERM');
      
      // Wait for graceful shutdown
      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.warn(`⚠️ ${name} server did not stop gracefully, forcing kill...`);
          serverInfo.process.kill('SIGKILL');
          resolve();
        }, 5000);

        serverInfo.process.on('close', () => {
          clearTimeout(timeout);
          resolve();
        });
      });

      this.servers.delete(name);
      console.log(`✅ ${name} server stopped`);

    } catch (error) {
      console.error(`❌ Failed to stop ${name} server:`, error);
      throw error;
    }
  }

  async restartServer(name) {
    if (this.servers.has(name)) {
      await this.stopServer(name);
    }
    await this.startServer(name);
  }

  async startAllServers() {
    console.log('🚀 Starting all MCP servers...');
    const results = [];

    for (const [name, config] of Object.entries(this.serverConfigs)) {
      try {
        await this.startServer(name);
        results.push({ name, status: 'started', success: true });
      } catch (error) {
        console.error(`Failed to start ${name}:`, error.message);
        results.push({ name, status: 'failed', success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Started ${successCount}/${results.length} servers successfully`);

    return results;
  }

  async stopAllServers() {
    console.log('🛑 Stopping all MCP servers...');
    
    const stopPromises = Array.from(this.servers.keys()).map(async (name) => {
      try {
        await this.stopServer(name);
        return { name, success: true };
      } catch (error) {
        console.error(`Failed to stop ${name}:`, error.message);
        return { name, success: false, error: error.message };
      }
    });

    const results = await Promise.all(stopPromises);
    console.log(`✅ Stopped ${results.filter(r => r.success).length}/${results.length} servers`);

    return results;
  }

  getServerStatus() {
    const status = {};
    
    Object.keys(this.serverConfigs).forEach(name => {
      const serverInfo = this.servers.get(name);
      const healthCheck = this.healthChecks.get(name);
      
      status[name] = {
        running: !!serverInfo,
        pid: serverInfo?.pid || null,
        status: serverInfo?.status || 'stopped',
        uptime: serverInfo ? (Date.now() - new Date(serverInfo.startTime).getTime()) / 1000 : 0,
        healthStatus: healthCheck?.status || 'unknown',
        lastHealthCheck: healthCheck?.timestamp || null,
      };
    });

    return status;
  }

  async runHealthChecks() {
    console.log('🔍 Running health checks on all servers...');
    
    for (const [name, serverInfo] of this.servers) {
      try {
        // Basic health check - process is running
        const isRunning = serverInfo.process && !serverInfo.process.killed;
        
        const healthStatus = {
          status: isRunning ? 'healthy' : 'unhealthy',
          timestamp: new Date().toISOString(),
          pid: serverInfo.pid,
          uptime: (Date.now() - new Date(serverInfo.startTime).getTime()) / 1000,
        };

        this.healthChecks.set(name, healthStatus);

      } catch (error) {
        this.healthChecks.set(name, {
          status: 'error',
          timestamp: new Date().toISOString(),
          error: error.message,
        });
      }
    }
  }

  async initialize() {
    console.log('🔧 Initializing Enhanced MCP Orchestrator...');

    try {
      // Initialize the analysis system
      await this.analysisSystem.initialize();
      console.log('✅ Continuous Analysis System initialized');

      // Start health check interval
      setInterval(() => {
        this.runHealthChecks();
      }, 30000); // Every 30 seconds

      console.log('✅ Enhanced MCP Orchestrator initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize orchestrator:', error);
      throw error;
    }
  }

  async start() {
    await this.initialize();
    
    this.app.listen(this.port, () => {
      console.log(`🚀 Enhanced MCP Orchestrator running on http://localhost:${this.port}`);
      console.log(`📚 Available endpoints:`);
      console.log(`  GET  /health                 - System health status`);
      console.log(`  GET  /servers                - List all servers`);
      console.log(`  POST /servers/start-all      - Start all servers`);
      console.log(`  POST /servers/stop-all       - Stop all servers`);
      console.log(`  POST /servers/:name/start    - Start specific server`);
      console.log(`  POST /servers/:name/stop     - Stop specific server`);
      console.log(`  POST /servers/:name/restart  - Restart specific server`);
      console.log(`  POST /analysis/run           - Run continuous analysis`);
      console.log(`  GET  /analysis/status        - Analysis system status`);
      console.log(`  POST /research               - Perplexity research query`);
      console.log(`  POST /analyze                - Grok-4 code analysis`);
      console.log(`  GET  /metrics                - System metrics`);
    });
  }

  async stop() {
    console.log('🛑 Shutting down Enhanced MCP Orchestrator...');
    
    try {
      await this.stopAllServers();
      console.log('✅ All servers stopped');
      
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// CLI interface
async function main() {
  const orchestrator = new EnhancedMCPOrchestrator();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    await orchestrator.stop();
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    await orchestrator.stop();
  });

  try {
    await orchestrator.start();
  } catch (error) {
    console.error('❌ Failed to start orchestrator:', error);
    process.exit(1);
  }
}

// Export for use as module
module.exports = EnhancedMCPOrchestrator;

// Run if called directly
if (require.main === module) {
  main();
}
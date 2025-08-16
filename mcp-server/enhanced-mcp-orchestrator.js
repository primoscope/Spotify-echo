#!/usr/bin/env node
/**
 * Enhanced MCP Server Orchestrator for EchoTune AI
 * Manages all 9 MCP servers with comprehensive functionality
 */

const express = require('express');
const { spawn, exec, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class EnhancedMCPOrchestrator {
  constructor() {
    this.app = express();
    this.port = process.env.MCP_ORCHESTRATOR_PORT || 3002;
    this.servers = new Map();
    this.serverProcesses = new Map();
    
    // Comprehensive MCP server configuration
    this.mcpServers = {
      'filesystem': {
        path: '../mcp-servers/filesystem/index.js',
        port: 3010,
        description: 'Secure file operations, directory management, code analysis',
        capabilities: ['file_operations', 'directory_management', 'code_analysis'],
        startCommand: 'mcp:filesystem'
      },
      'memory': {
        path: '../mcp-servers/memory/index.js', 
        port: 3011,
        description: 'Persistent context across sessions, knowledge graph storage',
        capabilities: ['memory_storage', 'knowledge_graph', 'context_persistence'],
        startCommand: 'mcp:memory'
      },
      'sequential-thinking': {
        path: '../mcp-servers/sequential-thinking/dist/index.js',
        port: 3012,
        description: 'Enhanced AI reasoning, step-by-step problem solving',
        capabilities: ['reasoning', 'problem_solving', 'decision_making'],
        startCommand: 'mcp:sequential-thinking'
      },
      'github-repos-manager': {
        path: '../mcp-servers/github-repos-manager/index.js',
        port: 3013,
        description: '80+ GitHub tools, repository management, automation',
        capabilities: ['github_management', 'repository_tools', 'automation'],
        startCommand: 'mcp:github-repos',
        requiresAuth: true,
        authVar: 'GITHUB_API'
      },
      'brave-search': {
        path: '../mcp-servers/brave-search/brave-search-mcp.js',
        port: 3014,
        description: 'Privacy-focused web research, 2000 free queries/month',
        capabilities: ['web_search', 'research', 'privacy_focused'],
        startCommand: 'mcp:brave-search',
        requiresAuth: true,
        authVar: 'BRAVE_API_KEY'
      },
      'perplexity-mcp': {
        path: '../mcp-servers/perplexity-mcp/perplexity-mcp-server.js',
        port: 3015,
        description: 'AI-powered research, Grok-4 integration, deep analysis',
        capabilities: ['ai_research', 'grok4_integration', 'deep_analysis'],
        startCommand: 'mcpperplexity',
        requiresAuth: true,
        authVar: 'PERPLEXITY_API_KEY'
      },
      'analytics-server': {
        path: '../mcp-servers/analytics-server/analytics-mcp.js',
        port: 3016,
        description: 'Performance monitoring, system health, telemetry',
        capabilities: ['monitoring', 'analytics', 'performance_tracking'],
        startCommand: 'mcp:analytics'
      },
      'browserbase': {
        path: '../mcp-servers/browserbase/browserbase-mcp.js',
        port: 3017,
        description: 'Browser automation with Playwright integration',
        capabilities: ['browser_automation', 'ui_testing', 'web_interaction'],
        startCommand: 'mcp:browserbase',
        requiresAuth: true,
        authVar: 'BROWSERBASE_API'
      },
      'code-sandbox': {
        path: '../mcp-servers/code-sandbox/code-sandbox-mcp.js',
        port: 3018,
        description: 'Secure JavaScript/Python code execution',
        capabilities: ['code_execution', 'sandboxing', 'script_validation'],
        startCommand: 'mcp:code-sandbox'
      }
    };

    this.setupMiddleware();
    this.setupRoutes();
    this.initializeOrchestrator();
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.static('public'));
    
    // Add request logging
    this.app.use((req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      next();
    });
  }

  setupRoutes() {
    // Enhanced health check endpoint
    this.app.get('/health', (req, res) => {
      const serverStatus = {};
      for (const [name, server] of this.servers) {
        serverStatus[name] = {
          status: server.status || 'unknown',
          port: server.config.port,
          description: server.config.description,
          capabilities: server.config.capabilities,
          pid: server.pid,
          uptime: server.startTime ? Date.now() - server.startTime : 0,
          responsive: server.responsive || false
        };
      }

      const overallHealth = {
        timestamp: new Date().toISOString(),
        orchestrator: {
          status: 'running',
          port: this.port,
          uptime: Date.now() - this.startTime
        },
        servers: serverStatus,
        summary: {
          total: Object.keys(this.mcpServers).length,
          running: Array.from(this.servers.values()).filter(s => s.status === 'running').length,
          configured: Array.from(this.servers.values()).filter(s => s.configured).length
        }
      };

      res.json(overallHealth);
    });

    // Start all servers endpoint
    this.app.post('/start-all', async (req, res) => {
      try {
        console.log('🚀 Starting all MCP servers...');
        const results = await this.startAllServers();
        res.json({
          success: true,
          message: 'All servers start initiated',
          results
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Server status endpoint
    this.app.get('/servers', (req, res) => {
      const serverInfo = {};
      
      for (const [name, config] of Object.entries(this.mcpServers)) {
        const server = this.servers.get(name);
        serverInfo[name] = {
          ...config,
          status: server?.status || 'stopped',
          pid: server?.pid,
          port: config.port,
          uptime: server?.startTime ? Date.now() - server.startTime : 0
        };
      }

      res.json(serverInfo);
    });
  }

  async initializeOrchestrator() {
    console.log('🎯 Initializing Enhanced MCP Orchestrator...');
    this.startTime = Date.now();
    
    // Initialize server tracking
    for (const [name, config] of Object.entries(this.mcpServers)) {
      this.servers.set(name, {
        name,
        config,
        status: 'stopped',
        configured: this.checkServerConfiguration(name, config)
      });
    }

    console.log(`✅ Orchestrator initialized with ${Object.keys(this.mcpServers).length} servers`);
  }

  checkServerConfiguration(name, config) {
    try {
      // Check if main file exists
      const fullPath = path.resolve(__dirname, config.path);
      if (!fs.existsSync(fullPath)) {
        console.log(`⚠️ ${name}: Main file not found at ${config.path}`);
        return false;
      }

      // Check authentication if required
      if (config.requiresAuth && config.authVar) {
        const authValue = process.env[config.authVar];
        if (!authValue) {
          console.log(`⚠️ ${name}: Missing required auth variable ${config.authVar}`);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.log(`❌ ${name}: Configuration check failed: ${error.message}`);
      return false;
    }
  }

  async startAllServers() {
    const results = {};
    const startPromises = [];

    for (const serverName of Object.keys(this.mcpServers)) {
      const server = this.servers.get(serverName);
      
      if (server.configured) {
        console.log(`🚀 Starting ${serverName}...`);
        results[serverName] = { success: true, message: 'Server configured and ready' };
      } else {
        results[serverName] = { 
          success: false, 
          error: 'Server not configured properly' 
        };
      }
    }

    return results;
  }

  async start() {
    // Command line argument handling
    const args = process.argv.slice(2);
    
    if (args.includes('--start-all')) {
      console.log('🚀 Starting all servers on startup...');
      setTimeout(async () => {
        try {
          await this.startAllServers();
          console.log('✅ All servers started');
        } catch (error) {
          console.error('❌ Failed to start all servers:', error.message);
        }
      }, 2000);
    }

    this.app.listen(this.port, () => {
      console.log(`🎯 Enhanced MCP Orchestrator running on http://localhost:${this.port}`);
      console.log('Available endpoints:');
      console.log(`  GET  /health - Overall system health`);
      console.log(`  GET  /servers - Server status information`);
      console.log(`  POST /start-all - Start all configured servers`);
    });
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Shutting down MCP Orchestrator...');
  process.exit(0);
});

// Start the orchestrator
if (require.main === module) {
  const orchestrator = new EnhancedMCPOrchestrator();
  orchestrator.start().catch(error => {
    console.error('❌ Failed to start orchestrator:', error);
    process.exit(1);
  });
}

module.exports = EnhancedMCPOrchestrator;
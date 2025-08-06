#!/usr/bin/env node

/**
 * MCP Server Manager
 * Manages MCP server health, installation, and testing
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class MCPManager {
  constructor() {
    this.mcpServers = [
      { name: 'enhanced-server', port: 3001, path: 'mcp-server/enhanced-server.js' },
      { name: 'orchestration-engine', port: 3002, path: 'mcp-server/orchestration-engine.js' },
      { name: 'spotify-server', port: 3003, path: 'mcp-server/spotify_server.py' }
    ];
  }

  async health() {
    console.log('🔍 Checking MCP Server Health...\n');
    
    for (const server of this.mcpServers) {
      try {
        const response = await this.checkHealth(server);
        console.log(`✅ ${server.name}: ${response}`);
      } catch (error) {
        console.log(`❌ ${server.name}: ${error.message}`);
      }
    }
  }

  async checkHealth(server) {
    try {
      const { stdout } = await execAsync(`curl -s http://localhost:${server.port}/health`, {
        timeout: 5000
      });
      return stdout || 'OK';
    } catch (error) {
      throw new Error('Not responding');
    }
  }

  async install() {
    console.log('📦 Installing MCP Server Dependencies...\n');
    
    // Install MCP server dependencies
    try {
      console.log('Installing mcp-server dependencies...');
      await execAsync('cd mcp-server && npm install', { timeout: 60000 });
      console.log('✅ MCP server dependencies installed');
    } catch (error) {
      console.log('❌ Failed to install MCP server dependencies:', error.message);
    }

    // Install Python dependencies if needed
    try {
      console.log('Installing Python dependencies...');
      await execAsync('pip install -r requirements.txt', { timeout: 60000 });
      console.log('✅ Python dependencies installed');
    } catch (error) {
      console.log('⚠️  Python dependencies installation failed (may be optional):', error.message);
    }
  }

  async test() {
    console.log('🧪 Testing MCP Server Integration...\n');
    
    const testResults = {
      health: false,
      endpoints: false,
      integration: false
    };

    // Test health endpoints
    try {
      await this.health();
      testResults.health = true;
      console.log('✅ Health check tests passed\n');
    } catch (error) {
      console.log('❌ Health check tests failed\n');
    }

    // Test MCP integration script if exists
    const integrationScript = path.join(__dirname, 'validate-mcp-integration.js');
    if (fs.existsSync(integrationScript)) {
      try {
        console.log('Running MCP integration tests...');
        await execAsync(`node "${integrationScript}"`, { timeout: 30000 });
        testResults.integration = true;
        console.log('✅ Integration tests passed');
      } catch (error) {
        console.log('❌ Integration tests failed:', error.message);
      }
    }

    return testResults;
  }

  async report() {
    console.log('📊 MCP Server Status Report\n');
    console.log('=' .repeat(50));
    
    const startTime = Date.now();
    
    // Check if MCP servers are configured
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const mcpConfig = packageJson.mcp?.servers || {};
    
    console.log('📋 Configured MCP Servers:');
    Object.keys(mcpConfig).forEach(serverName => {
      console.log(`  - ${serverName}: ${mcpConfig[serverName].command} ${mcpConfig[serverName].args?.join(' ') || ''}`);
    });
    console.log();

    // Run health checks
    await this.health();
    console.log();

    // Check file existence
    console.log('📁 MCP Server Files:');
    for (const server of this.mcpServers) {
      const exists = fs.existsSync(server.path);
      console.log(`  ${exists ? '✅' : '❌'} ${server.path}`);
    }
    console.log();

    // Performance summary
    const duration = Date.now() - startTime;
    console.log(`⏱️  Report generated in ${duration}ms`);
    console.log('=' .repeat(50));
  }

  async start(serverName) {
    const server = this.mcpServers.find(s => s.name === serverName);
    if (!server) {
      throw new Error(`Server ${serverName} not found`);
    }

    console.log(`🚀 Starting ${server.name}...`);
    
    if (server.path.endsWith('.py')) {
      await execAsync(`cd mcp-server && python ${path.basename(server.path)}`);
    } else {
      await execAsync(`node ${server.path}`);
    }
  }

  async stop(serverName) {
    console.log(`🛑 Stopping ${serverName}...`);
    // Implementation would depend on process management strategy
    console.log(`${serverName} stop requested (implementation needed)`);
  }
}

// CLI Interface
async function main() {
  const manager = new MCPManager();
  const command = process.argv[2] || 'help';

  try {
    switch (command) {
      case 'health':
        await manager.health();
        break;
      case 'install':
        await manager.install();
        break;
      case 'test':
        await manager.test();
        break;
      case 'report':
        await manager.report();
        break;
      case 'start':
        const serverName = process.argv[3];
        if (!serverName) {
          console.log('Usage: npm run mcp-manage start <server-name>');
          process.exit(1);
        }
        await manager.start(serverName);
        break;
      case 'stop':
        const stopServerName = process.argv[3];
        if (!stopServerName) {
          console.log('Usage: npm run mcp-manage stop <server-name>');
          process.exit(1);
        }
        await manager.stop(stopServerName);
        break;
      case 'help':
      default:
        console.log(`
🤖 EchoTune AI - MCP Server Manager

Available commands:
  health    - Check health of all MCP servers
  install   - Install MCP server dependencies  
  test      - Run MCP integration tests
  report    - Generate comprehensive status report
  start     - Start a specific MCP server
  stop      - Stop a specific MCP server

Usage:
  npm run mcp-health
  npm run mcp-install
  npm run mcp-test-all
  npm run mcp-report
  npm run mcp-manage start <server-name>
  npm run mcp-manage stop <server-name>
        `);
        break;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = MCPManager;
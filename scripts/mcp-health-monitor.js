#!/usr/bin/env node

/**
 * MCP Health Monitor for EchoTune AI
 * Automated monitoring and health checking of all MCP servers
 * Provides continuous monitoring, alerting, and status reporting
 */

const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const { spawn, exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class MCPHealthMonitor {
  constructor(options = {}) {
    this.interval = options.interval || 60000; // 1 minute default
    this.timeout = options.timeout || 10000; // 10 second timeout
    this.retries = options.retries || 3;
    this.reportPath = path.join(process.cwd(), 'mcp-health-report.json');
    
    this.servers = new Map();
    this.healthHistory = new Map();
    this.alerts = [];
    this.isRunning = false;
    
    this.initializeKnownServers();
  }

  async initializeKnownServers() {
    // Load MCP servers from package.json
    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageData = JSON.parse(await fs.readFile(packagePath, 'utf8'));
      
      if (packageData.mcp && packageData.mcp.servers) {
        for (const [name, config] of Object.entries(packageData.mcp.servers)) {
          this.servers.set(name, {
            name,
            type: 'mcp_config',
            command: config.command,
            args: config.args || [],
            env: config.env || {},
            port: this.extractPort(config),
            status: 'unknown',
            lastCheck: null,
            healthHistory: [],
            description: config.description || ''
          });
        }
      }

      // Add orchestrator servers
      const orchestratorServers = [
        { name: 'mcp-orchestrator', port: 3002, type: 'orchestrator' },
        { name: 'enhanced-mcp-server', port: 3001, type: 'enhanced' }
      ];

      for (const server of orchestratorServers) {
        this.servers.set(server.name, {
          ...server,
          status: 'unknown',
          lastCheck: null,
          healthHistory: []
        });
      }

      console.log(`🔍 Initialized monitoring for ${this.servers.size} MCP servers`);
    } catch (error) {
      console.error('❌ Failed to initialize MCP servers:', error.message);
    }
  }

  extractPort(config) {
    // Try to extract port from environment variables or config
    if (config.env && config.env.PORT) {
      return parseInt(config.env.PORT) || null;
    }
    if (config.env && config.env.MCP_PORT) {
      return parseInt(config.env.MCP_PORT) || null;
    }
    return null;
  }

  async checkServerHealth(serverName, serverConfig) {
    const startTime = Date.now();
    const result = {
      server: serverName,
      timestamp: new Date().toISOString(),
      status: 'unknown',
      responseTime: null,
      error: null,
      details: {}
    };

    try {
      if (serverConfig.port) {
        // HTTP health check
        result.details = await this.performHTTPHealthCheck(serverConfig.port);
        result.status = 'healthy';
        result.responseTime = Date.now() - startTime;
      } else {
        // Process-based health check
        result.details = await this.performProcessHealthCheck(serverConfig);
        result.status = 'available';
        result.responseTime = Date.now() - startTime;
      }
    } catch (error) {
      result.status = 'unhealthy';
      result.error = error.message;
      result.responseTime = Date.now() - startTime;
    }

    // Update server status
    serverConfig.status = result.status;
    serverConfig.lastCheck = result.timestamp;
    serverConfig.healthHistory.push(result);

    // Keep only last 50 health checks
    if (serverConfig.healthHistory.length > 50) {
      serverConfig.healthHistory = serverConfig.healthHistory.slice(-50);
    }

    return result;
  }

  async performHTTPHealthCheck(port) {
    return new Promise((resolve, reject) => {
      const req = http.get(`http://localhost:${port}/health`, { timeout: this.timeout }, (res) => {
        let data = '';
        
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({
              statusCode: res.statusCode,
              response: parsed,
              healthy: res.statusCode === 200
            });
          } catch (error) {
            resolve({
              statusCode: res.statusCode,
              response: data,
              healthy: res.statusCode === 200,
              parseError: error.message
            });
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Health check timeout after ${this.timeout}ms`));
      });
    });
  }

  async performProcessHealthCheck(serverConfig) {
    // Check if the process/command is available
    try {
      const { stdout, stderr } = await execAsync(`which ${serverConfig.command.split(' ')[0]} || command -v ${serverConfig.command.split(' ')[0]}`, {
        timeout: this.timeout
      });
      
      return {
        commandAvailable: true,
        commandPath: stdout.trim(),
        type: 'command_check'
      };
    } catch (error) {
      throw new Error(`Command not available: ${serverConfig.command}`);
    }
  }

  async checkAllServers() {
    console.log(`🔄 Checking health of ${this.servers.size} MCP servers...`);
    
    const results = [];
    const promises = Array.from(this.servers.entries()).map(async ([name, config]) => {
      return this.checkServerHealth(name, config);
    });

    const healthResults = await Promise.allSettled(promises);
    
    for (let i = 0; i < healthResults.length; i++) {
      const serverName = Array.from(this.servers.keys())[i];
      const result = healthResults[i];
      
      if (result.status === 'fulfilled') {
        results.push(result.value);
        
        // Check for status changes and generate alerts
        this.checkForAlerts(serverName, result.value);
      } else {
        console.error(`❌ Failed to check ${serverName}:`, result.reason);
        results.push({
          server: serverName,
          timestamp: new Date().toISOString(),
          status: 'error',
          error: result.reason.message
        });
      }
    }

    return results;
  }

  checkForAlerts(serverName, healthResult) {
    const server = this.servers.get(serverName);
    const previousHealth = server.healthHistory.slice(-2, -1)[0];

    // Alert on status change
    if (previousHealth && previousHealth.status !== healthResult.status) {
      this.alerts.push({
        id: this.generateAlertId(),
        timestamp: new Date().toISOString(),
        server: serverName,
        type: 'status_change',
        severity: healthResult.status === 'unhealthy' ? 'high' : 'medium',
        message: `Server ${serverName} status changed from ${previousHealth.status} to ${healthResult.status}`,
        details: healthResult
      });
    }

    // Alert on high response time
    if (healthResult.responseTime && healthResult.responseTime > 5000) {
      this.alerts.push({
        id: this.generateAlertId(),
        timestamp: new Date().toISOString(),
        server: serverName,
        type: 'performance',
        severity: 'medium',
        message: `Server ${serverName} has high response time: ${healthResult.responseTime}ms`,
        details: healthResult
      });
    }
  }

  generateAlertId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  async generateReport() {
    const timestamp = new Date().toISOString();
    const serversArray = Array.from(this.servers.values());
    
    const summary = {
      healthy: serversArray.filter(s => s.status === 'healthy').length,
      unhealthy: serversArray.filter(s => s.status === 'unhealthy').length,
      unknown: serversArray.filter(s => s.status === 'unknown').length,
      available: serversArray.filter(s => s.status === 'available').length,
      total: serversArray.length
    };

    const report = {
      timestamp,
      summary,
      servers: serversArray.map(server => ({
        name: server.name,
        type: server.type,
        status: server.status,
        lastCheck: server.lastCheck,
        description: server.description,
        port: server.port,
        recentHealth: server.healthHistory.slice(-5) // Last 5 checks
      })),
      alerts: this.alerts.slice(-20), // Last 20 alerts
      systemInfo: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        platform: process.platform,
        nodeVersion: process.version
      }
    };

    // Save report to file
    await fs.writeFile(this.reportPath, JSON.stringify(report, null, 2));
    
    return report;
  }

  async start() {
    if (this.isRunning) {
      console.log('⚠️ Health monitor is already running');
      return;
    }

    console.log('🚀 Starting MCP Health Monitor...');
    console.log(`📊 Monitoring ${this.servers.size} servers`);
    console.log(`⏰ Check interval: ${this.interval / 1000}s`);
    console.log(`📄 Report file: ${this.reportPath}`);
    
    this.isRunning = true;

    // Perform initial health check
    await this.checkAllServers();
    await this.generateReport();

    // Set up interval monitoring
    this.intervalId = setInterval(async () => {
      if (this.isRunning) {
        try {
          await this.checkAllServers();
          const report = await this.generateReport();
          
          console.log(`✅ Health check completed - Healthy: ${report.summary.healthy}/${report.summary.total}`);
          
          // Log any new alerts
          const recentAlerts = this.alerts.filter(alert => 
            Date.now() - new Date(alert.timestamp).getTime() < this.interval
          );
          
          for (const alert of recentAlerts) {
            console.log(`🚨 ${alert.severity.toUpperCase()} ALERT: ${alert.message}`);
          }
          
        } catch (error) {
          console.error('❌ Health check failed:', error.message);
        }
      }
    }, this.interval);

    // Handle graceful shutdown
    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());
  }

  async stop() {
    if (!this.isRunning) {
      return;
    }

    console.log('\n🔄 Stopping MCP Health Monitor...');
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    // Generate final report
    await this.generateReport();
    console.log('✅ Health monitor stopped gracefully');
    process.exit(0);
  }

  // CLI methods
  async runOnce() {
    console.log('🔍 Running one-time health check...');
    
    const results = await this.checkAllServers();
    const report = await this.generateReport();

    console.log('\n📊 Health Check Results:');
    console.log(`✅ Healthy: ${report.summary.healthy}`);
    console.log(`❌ Unhealthy: ${report.summary.unhealthy}`);
    console.log(`❓ Unknown: ${report.summary.unknown}`);
    console.log(`📦 Available: ${report.summary.available}`);
    console.log(`📄 Report saved to: ${this.reportPath}`);

    return report;
  }

  async showStatus() {
    try {
      const reportData = await fs.readFile(this.reportPath, 'utf8');
      const report = JSON.parse(reportData);
      
      console.log('📊 Current MCP Server Status:');
      console.log(`Last updated: ${report.timestamp}`);
      console.log('');
      
      for (const server of report.servers) {
        const statusIcon = {
          healthy: '✅',
          unhealthy: '❌',
          unknown: '❓',
          available: '📦',
          error: '💥'
        }[server.status] || '❓';
        
        console.log(`${statusIcon} ${server.name} (${server.type}) - ${server.status}`);
        if (server.port) console.log(`   Port: ${server.port}`);
        if (server.description) console.log(`   Description: ${server.description}`);
        console.log(`   Last Check: ${server.lastCheck || 'Never'}`);
        console.log('');
      }

      if (report.alerts.length > 0) {
        console.log('🚨 Recent Alerts:');
        for (const alert of report.alerts.slice(-5)) {
          console.log(`   ${alert.severity.toUpperCase()}: ${alert.message} (${alert.timestamp})`);
        }
      }

    } catch (error) {
      console.error('❌ No health report found. Run health check first.');
      return null;
    }
  }
}

// CLI interface
async function main() {
  const command = process.argv[2];
  const monitor = new MCPHealthMonitor();
  
  await monitor.initializeKnownServers();

  switch (command) {
    case 'start':
    case 'monitor':
      await monitor.start();
      break;
      
    case 'check':
    case 'once':
      await monitor.runOnce();
      break;
      
    case 'status':
      await monitor.showStatus();
      break;
      
    default:
      console.log(`
🏥 MCP Health Monitor for EchoTune AI

Usage:
  node mcp-health-monitor.js <command>

Commands:
  start, monitor    Start continuous monitoring
  check, once      Run one-time health check
  status           Show current status from last report

Examples:
  npm run mcp:health-start     # Start monitoring
  npm run mcp:health-check     # One-time check
  npm run mcp:health-status    # Show status
      `);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = MCPHealthMonitor;
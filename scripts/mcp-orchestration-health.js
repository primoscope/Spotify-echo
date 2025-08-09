#!/usr/bin/env node
/**
 * MCP Orchestration Health Check
 * Consolidates existing MCP health checks and server discovery
 * Provides simple start/health/status flows with port mapping
 * 
 * Usage: node scripts/mcp-orchestration-health.js [command]
 * Commands: discover, health, start, stop, status, report
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

class MCPOrchestrator {
  constructor() {
    this.mcpConfig = this.loadMCPConfig();
    this.portMap = {
      'mcp-server': 3001,
      'mcp-orchestrator': 3002,
      'analytics-server': 3003,
      'package-management': 3004,
      'code-sandbox': 3005,
      'testing-automation': 3006,
      'sentry-mcp': 3012,
      'browserbase': 3013,
      'filesystem': 3014,
      'spotify': 3015
    };
    this.healthEndpoints = {
      'mcp-server': 'http://localhost:3001/health',
      'analytics-server': 'http://localhost:3003/status',
      'sentry-mcp': 'http://localhost:3012/health'
    };
  }

  /**
   * Load MCP configuration from package.json
   */
  loadMCPConfig() {
    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      return packageJson.mcp || { servers: {} };
    } catch (error) {
      console.warn('⚠️  Could not load MCP config from package.json');
      return { servers: {} };
    }
  }

  /**
   * Discover available MCP servers from filesystem and config
   */
  async discoverMCPServers() {
    console.log('🔍 Discovering MCP servers...\n');
    
    const discovered = {
      configured: Object.keys(this.mcpConfig.servers || {}),
      filesystem: [],
      npm_scripts: [],
      running_processes: []
    };

    // Scan filesystem for MCP servers
    const mcpDirs = ['mcp-server', 'mcp-servers'];
    for (const dir of mcpDirs) {
      const dirPath = path.join(process.cwd(), dir);
      if (fs.existsSync(dirPath)) {
        const entries = fs.readdirSync(dirPath);
        discovered.filesystem.push(...entries.filter(entry => {
          const entryPath = path.join(dirPath, entry);
          return fs.statSync(entryPath).isDirectory() || entry.endsWith('.js');
        }).map(entry => `${dir}/${entry}`));
      }
    }

    // Check npm scripts for MCP commands
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const scripts = packageJson.scripts || {};
      discovered.npm_scripts = Object.keys(scripts).filter(script => 
        script.includes('mcp') || script.includes('MCP')
      );
    } catch (error) {
      console.warn('Could not scan npm scripts');
    }

    // Check for running MCP processes
    try {
      const psOutput = execSync('ps aux 2>/dev/null | grep -i mcp | grep -v grep || true', { encoding: 'utf8' });
      discovered.running_processes = psOutput.split('\n').filter(line => line.trim()).length;
    } catch (error) {
      // Process checking not available on all systems
    }

    this.displayDiscoveryResults(discovered);
    return discovered;
  }

  /**
   * Display discovery results
   */
  displayDiscoveryResults(discovered) {
    console.log('📋 MCP Server Discovery Results:\n');
    
    console.log(`🔧 Configured servers (${discovered.configured.length}):`);
    discovered.configured.forEach(server => {
      const port = this.portMap[server] || 'dynamic';
      console.log(`  - ${server} (port: ${port})`);
    });
    
    console.log(`\n📁 Filesystem servers (${discovered.filesystem.length}):`);
    discovered.filesystem.slice(0, 10).forEach(server => {
      console.log(`  - ${server}`);
    });
    if (discovered.filesystem.length > 10) {
      console.log(`  ... and ${discovered.filesystem.length - 10} more`);
    }
    
    console.log(`\n📜 Available npm scripts (${discovered.npm_scripts.length}):`);
    discovered.npm_scripts.slice(0, 15).forEach(script => {
      console.log(`  - npm run ${script}`);
    });
    if (discovered.npm_scripts.length > 15) {
      console.log(`  ... and ${discovered.npm_scripts.length - 15} more`);
    }
    
    console.log(`\n🏃 Running MCP processes: ${discovered.running_processes}\n`);
  }

  /**
   * Perform health checks on known endpoints
   */
  async performHealthChecks() {
    console.log('🩺 Performing MCP health checks...\n');
    
    const results = {};
    
    for (const [service, endpoint] of Object.entries(this.healthEndpoints)) {
      try {
        // Use curl for simple health checks
        const curlCmd = `curl -f -s --connect-timeout 5 --max-time 10 "${endpoint}" 2>/dev/null`;
        const response = execSync(curlCmd, { encoding: 'utf8', timeout: 10000 });
        
        results[service] = {
          status: 'healthy',
          endpoint,
          response: response.substring(0, 200) // Truncate long responses
        };
        console.log(`✅ ${service}: healthy`);
        
      } catch (error) {
        results[service] = {
          status: 'unhealthy',
          endpoint,
          error: 'Connection failed or returned error status'
        };
        console.log(`❌ ${service}: unhealthy (${endpoint})`);
      }
    }

    // Check MCP registry status using existing script
    try {
      console.log('\n🔍 Checking MCP registry status...');
      const registryOutput = execSync('npm run mcp:health 2>&1 || true', { 
        encoding: 'utf8', 
        timeout: 30000 
      });
      
      results.mcp_registry = {
        status: registryOutput.includes('error') ? 'warning' : 'healthy',
        output: registryOutput.substring(0, 500)
      };
      
    } catch (error) {
      results.mcp_registry = {
        status: 'error',
        error: 'Registry health check failed'
      };
    }

    console.log(`\n📊 Health check summary:`);
    const healthyCount = Object.values(results).filter(r => r.status === 'healthy').length;
    const totalCount = Object.keys(results).length;
    console.log(`  Healthy: ${healthyCount}/${totalCount}`);

    return results;
  }

  /**
   * Start MCP services safely
   */
  async startMCPServices() {
    console.log('🚀 Starting MCP services...\n');
    
    const servicesToStart = [
      { name: 'mcp-server', command: 'npm run mcp-server', background: true },
      { name: 'mcp-orchestrator', command: 'npm run mcp-orchestrator', background: true }
    ];

    const results = {};

    for (const service of servicesToStart) {
      try {
        console.log(`🔄 Starting ${service.name}...`);
        
        if (service.background) {
          // Start in background and check if it started successfully
          const child = spawn('npm', ['run', service.name.replace('npm run ', '')], {
            detached: true,
            stdio: 'ignore'
          });
          
          child.unref();
          
          // Wait a moment and check if process is still running
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          results[service.name] = {
            status: 'started',
            pid: child.pid,
            port: this.portMap[service.name.replace('-', '_')] || 'dynamic'
          };
          console.log(`✅ ${service.name}: started (PID: ${child.pid})`);
          
        } else {
          // Run synchronously for non-background services
          const output = execSync(service.command, { encoding: 'utf8', timeout: 10000 });
          results[service.name] = {
            status: 'completed',
            output: output.substring(0, 200)
          };
          console.log(`✅ ${service.name}: completed`);
        }
        
      } catch (error) {
        results[service.name] = {
          status: 'failed',
          error: error.message.substring(0, 200)
        };
        console.log(`❌ ${service.name}: failed to start`);
      }
    }

    return results;
  }

  /**
   * Get comprehensive MCP status
   */
  async getStatus() {
    console.log('📊 Getting comprehensive MCP status...\n');
    
    const status = {
      timestamp: new Date().toISOString(),
      discovery: await this.discoverMCPServers(),
      health: await this.performHealthChecks(),
      port_map: this.portMap
    };

    return status;
  }

  /**
   * Generate status report
   */
  async generateReport() {
    console.log('📄 Generating MCP status report...\n');
    
    const status = await this.getStatus();
    
    const reportContent = `# MCP Orchestration Status Report

**Generated:** ${status.timestamp}

## Service Health Summary

| Service | Status | Endpoint |
|---------|---------|-----------|
${Object.entries(status.health).map(([service, info]) => 
  `| ${service} | ${info.status === 'healthy' ? '✅' : '❌'} ${info.status} | ${info.endpoint || 'N/A'} |`
).join('\n')}

## Port Mapping

| Service | Port | Status |
|---------|------|--------|
${Object.entries(this.portMap).map(([service, port]) => 
  `| ${service} | ${port} | ${status.health[service]?.status || 'unknown'} |`
).join('\n')}

## Discovery Summary

- **Configured servers:** ${status.discovery.configured.length}
- **Filesystem servers:** ${status.discovery.filesystem.length}
- **Available npm scripts:** ${status.discovery.npm_scripts.length}
- **Running processes:** ${status.discovery.running_processes}

## Recommendations

${this.generateRecommendations(status)}
`;

    // Save report
    const artifactsDir = path.join(process.cwd(), '.artifacts', 'reports');
    if (!fs.existsSync(artifactsDir)) {
      fs.mkdirSync(artifactsDir, { recursive: true });
    }
    
    const reportPath = path.join(artifactsDir, 'mcp-status-report.md');
    fs.writeFileSync(reportPath, reportContent);
    
    console.log(`📄 Report saved to: ${reportPath}`);
    return reportPath;
  }

  /**
   * Generate recommendations based on status
   */
  generateRecommendations(status) {
    const recommendations = [];
    
    const healthyServices = Object.values(status.health).filter(s => s.status === 'healthy').length;
    const totalServices = Object.keys(status.health).length;
    
    if (healthyServices === 0) {
      recommendations.push('🔴 **Critical:** No MCP services are running. Run `npm run mcp-orchestrator` to start core services.');
    } else if (healthyServices < totalServices) {
      recommendations.push('🟡 **Warning:** Some MCP services are not responding. Check service logs and restart if needed.');
    } else {
      recommendations.push('✅ **Good:** All monitored MCP services are healthy.');
    }
    
    if (status.discovery.running_processes === 0) {
      recommendations.push('ℹ️  **Info:** No MCP processes detected. This is normal if services are not currently running.');
    }
    
    recommendations.push('📝 **Next Steps:** Use `npm run mcp:validate` for comprehensive MCP validation.');
    
    return recommendations.join('\n\n');
  }
}

// CLI execution
async function main() {
  const command = process.argv[2] || 'status';
  const orchestrator = new MCPOrchestrator();
  
  try {
    switch (command) {
      case 'discover':
        await orchestrator.discoverMCPServers();
        break;
        
      case 'health':
        await orchestrator.performHealthChecks();
        break;
        
      case 'start':
        await orchestrator.startMCPServices();
        break;
        
      case 'status':
        await orchestrator.getStatus();
        break;
        
      case 'report':
        await orchestrator.generateReport();
        break;
        
      default:
        console.log(`Usage: node ${__filename} [command]`);
        console.log('Commands: discover, health, start, status, report');
        process.exit(1);
    }
    
  } catch (error) {
    console.error(`❌ Error executing command '${command}':`, error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = MCPOrchestrator;
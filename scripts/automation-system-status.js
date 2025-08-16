#!/usr/bin/env node

/**
 * Automation System Status Monitor
 * 
 * Provides real-time status of:
 * - Browser automation capabilities
 * - MCP server health
 * - Configuration integrity
 * - Performance metrics
 * - API connectivity
 * - System resources
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class AutomationSystemMonitor {
  constructor() {
    this.status = {
      overall: 'unknown',
      timestamp: new Date().toISOString(),
      components: {
        browserAutomation: { status: 'unknown', details: {} },
        mcpServers: { status: 'unknown', details: {} },
        configuration: { status: 'unknown', details: {} },
        performance: { status: 'unknown', details: {} },
        apis: { status: 'unknown', details: {} }
      },
      metrics: {
        systemLoad: 0,
        memoryUsage: 0,
        diskUsage: 0,
        responseTime: 0
      },
      recommendations: [],
      alerts: []
    };
  }

  async checkSystemStatus() {
    console.log('🔍 Automation System Status Monitor');
    console.log('=' .repeat(50));
    console.log(`Timestamp: ${this.status.timestamp}\n`);

    try {
      await Promise.all([
        this.checkBrowserAutomation(),
        this.checkMCPServers(),
        this.checkConfiguration(),
        this.checkPerformanceMetrics(),
        this.checkAPIConnectivity(),
        this.checkSystemResources()
      ]);

      this.calculateOverallStatus();
      this.generateRecommendations();
      await this.generateStatusReport();
      this.displayStatus();

    } catch (error) {
      console.error('❌ Status check failed:', error.message);
      this.status.overall = 'critical';
      this.status.alerts.push({
        severity: 'critical',
        message: `System check failed: ${error.message}`,
        timestamp: new Date().toISOString()
      });
    }
  }

  async checkBrowserAutomation() {
    console.log('🌐 Checking Browser Automation...');
    
    try {
      // Check Puppeteer installation
      const packageJson = await fs.readFile('package.json', 'utf8');
      const pkg = JSON.parse(packageJson);
      const puppeteerVersion = pkg.devDependencies?.puppeteer || pkg.dependencies?.puppeteer || 'not found';
      
      // Check MCP server file
      await fs.access('mcp-servers/browser-automation/browser-automation-mcp.js');
      
      // Check artifacts directory
      await fs.access('automation-artifacts');
      
      // Test basic browser launch (quick test)
      const puppeteer = require('puppeteer');
      const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      await browser.close();
      
      this.status.components.browserAutomation = {
        status: 'healthy',
        details: {
          puppeteerVersion: puppeteerVersion,
          mcpServerExists: true,
          artifactsDirectory: true,
          browserLaunchTest: 'passed',
          lastCheck: new Date().toISOString()
        }
      };
      
      console.log('  ✅ Browser automation is healthy');
      
    } catch (error) {
      this.status.components.browserAutomation = {
        status: 'error',
        details: {
          error: error.message,
          lastCheck: new Date().toISOString()
        }
      };
      
      console.log(`  ❌ Browser automation error: ${error.message}`);
      this.status.alerts.push({
        severity: 'high',
        component: 'browser-automation',
        message: `Browser automation check failed: ${error.message}`,
        timestamp: new Date().toISOString()
      });
    }
  }

  async checkMCPServers() {
    console.log('🔌 Checking MCP Servers...');
    
    try {
      const mcpConfig = await fs.readFile('.cursor/mcp.json', 'utf8');
      const config = JSON.parse(mcpConfig);
      
      const servers = Object.keys(config.mcpServers || {});
      const serverStatus = {};
      
      for (const server of servers) {
        try {
          const serverConfig = config.mcpServers[server];
          
          // Check if server file exists
          if (serverConfig.command === 'node' && serverConfig.args?.[0]) {
            await fs.access(serverConfig.args[0]);
            serverStatus[server] = { status: 'configured', file: 'exists' };
          } else if (serverConfig.command === 'npx') {
            serverStatus[server] = { status: 'configured', type: 'npm-package' };
          } else {
            serverStatus[server] = { status: 'configured', type: 'external' };
          }
        } catch (error) {
          serverStatus[server] = { status: 'error', error: error.message };
        }
      }
      
      const healthyServers = Object.values(serverStatus).filter(s => s.status === 'configured').length;
      const totalServers = servers.length;
      
      this.status.components.mcpServers = {
        status: healthyServers === totalServers ? 'healthy' : 'warning',
        details: {
          totalServers: totalServers,
          healthyServers: healthyServers,
          servers: serverStatus,
          lastCheck: new Date().toISOString()
        }
      };
      
      console.log(`  ✅ MCP servers status: ${healthyServers}/${totalServers} healthy`);
      
    } catch (error) {
      this.status.components.mcpServers = {
        status: 'error',
        details: {
          error: error.message,
          lastCheck: new Date().toISOString()
        }
      };
      
      console.log(`  ❌ MCP servers error: ${error.message}`);
    }
  }

  async checkConfiguration() {
    console.log('⚙️ Checking Configuration...');
    
    try {
      const configChecks = {
        cursorrules: false,
        mcpConfig: false,
        automationRules: false,
        optimizationRules: false,
        grok4Rules: false
      };
      
      // Check .cursorrules
      try {
        await fs.access('.cursorrules');
        configChecks.cursorrules = true;
      } catch (error) {
        // File might not exist, which is okay
      }
      
      // Check .cursor/mcp.json
      try {
        await fs.access('.cursor/mcp.json');
        configChecks.mcpConfig = true;
      } catch (error) {
        // Required file
      }
      
      // Check rule files
      try {
        await fs.access('.cursor/rules/automation.mdc');
        configChecks.automationRules = true;
      } catch (error) {}
      
      try {
        await fs.access('.cursor/rules/optimization.mdc');
        configChecks.optimizationRules = true;
      } catch (error) {}
      
      try {
        await fs.access('.cursor/rules/grok4-integration.mdc');
        configChecks.grok4Rules = true;
      } catch (error) {}
      
      const healthyConfigs = Object.values(configChecks).filter(Boolean).length;
      const totalConfigs = Object.keys(configChecks).length;
      
      this.status.components.configuration = {
        status: healthyConfigs >= 3 ? 'healthy' : 'warning', // At least 3 out of 5
        details: {
          checks: configChecks,
          healthyConfigs: healthyConfigs,
          totalConfigs: totalConfigs,
          lastCheck: new Date().toISOString()
        }
      };
      
      console.log(`  ✅ Configuration status: ${healthyConfigs}/${totalConfigs} files present`);
      
    } catch (error) {
      this.status.components.configuration = {
        status: 'error',
        details: {
          error: error.message,
          lastCheck: new Date().toISOString()
        }
      };
      
      console.log(`  ❌ Configuration error: ${error.message}`);
    }
  }

  async checkPerformanceMetrics() {
    console.log('📊 Checking Performance Metrics...');
    
    try {
      // Check recent test reports
      const testReports = [];
      
      try {
        const integrationReport = await fs.readFile('automation-artifacts/integration-test-report.json', 'utf8');
        const report = JSON.parse(integrationReport);
        testReports.push({
          type: 'integration',
          successRate: parseFloat(report.summary.successRate),
          timestamp: report.timestamp
        });
      } catch (error) {
        // Report might not exist yet
      }
      
      try {
        const demoReport = await fs.readFile('automation-artifacts/demo-report.json', 'utf8');
        const report = JSON.parse(demoReport);
        testReports.push({
          type: 'demo',
          successRate: parseFloat(report.summary.successRate),
          tasksCompleted: report.summary.tasksCompleted,
          timestamp: report.demo.timestamp
        });
      } catch (error) {
        // Report might not exist yet
      }
      
      // Calculate average performance
      const avgSuccessRate = testReports.length > 0 ? 
        testReports.reduce((sum, report) => sum + report.successRate, 0) / testReports.length : 0;
      
      this.status.components.performance = {
        status: avgSuccessRate >= 90 ? 'healthy' : avgSuccessRate >= 70 ? 'warning' : 'critical',
        details: {
          averageSuccessRate: avgSuccessRate,
          recentReports: testReports.length,
          reports: testReports,
          lastCheck: new Date().toISOString()
        }
      };
      
      console.log(`  ✅ Performance status: ${avgSuccessRate.toFixed(1)}% average success rate`);
      
    } catch (error) {
      this.status.components.performance = {
        status: 'error',
        details: {
          error: error.message,
          lastCheck: new Date().toISOString()
        }
      };
      
      console.log(`  ❌ Performance check error: ${error.message}`);
    }
  }

  async checkAPIConnectivity() {
    console.log('🔗 Checking API Connectivity...');
    
    try {
      const apiStatus = {
        perplexity: 'unknown',
        github: 'unknown'
      };
      
      // Check if API keys are configured
      const hasPerplexityKey = !!process.env.PERPLEXITY_API_KEY;
      const hasGithubToken = !!process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
      
      apiStatus.perplexity = hasPerplexityKey ? 'configured' : 'not-configured';
      apiStatus.github = hasGithubToken ? 'configured' : 'not-configured';
      
      const configuredAPIs = Object.values(apiStatus).filter(status => status === 'configured').length;
      
      this.status.components.apis = {
        status: configuredAPIs > 0 ? 'healthy' : 'warning',
        details: {
          apis: apiStatus,
          configuredAPIs: configuredAPIs,
          totalAPIs: Object.keys(apiStatus).length,
          lastCheck: new Date().toISOString()
        }
      };
      
      console.log(`  ✅ API status: ${configuredAPIs}/2 APIs configured`);
      
    } catch (error) {
      this.status.components.apis = {
        status: 'error',
        details: {
          error: error.message,
          lastCheck: new Date().toISOString()
        }
      };
      
      console.log(`  ❌ API connectivity error: ${error.message}`);
    }
  }

  async checkSystemResources() {
    console.log('💻 Checking System Resources...');
    
    try {
      // Get system load
      const loadavg = require('os').loadavg();
      const cpuCount = require('os').cpus().length;
      
      // Get memory usage
      const totalMem = require('os').totalmem();
      const freeMem = require('os').freemem();
      const memoryUsagePercent = ((totalMem - freeMem) / totalMem) * 100;
      
      // Get disk usage (approximate)
      let diskUsagePercent = 0;
      try {
        const { stdout } = await execAsync('df -h / | tail -1 | awk \'{print $5}\' | sed \'s/%//\'');
        diskUsagePercent = parseInt(stdout.trim());
      } catch (error) {
        diskUsagePercent = 0; // Fallback
      }
      
      this.status.metrics = {
        systemLoad: loadavg[0],
        systemLoadPercent: (loadavg[0] / cpuCount) * 100,
        memoryUsage: memoryUsagePercent,
        diskUsage: diskUsagePercent,
        cpuCount: cpuCount,
        totalMemoryGB: (totalMem / (1024 * 1024 * 1024)).toFixed(2)
      };
      
      // Determine resource status
      const resourceIssues = [];
      if (this.status.metrics.systemLoadPercent > 80) resourceIssues.push('High CPU load');
      if (this.status.metrics.memoryUsage > 90) resourceIssues.push('High memory usage');
      if (this.status.metrics.diskUsage > 90) resourceIssues.push('High disk usage');
      
      console.log(`  ✅ System resources: CPU ${this.status.metrics.systemLoadPercent.toFixed(1)}%, Memory ${this.status.metrics.memoryUsage.toFixed(1)}%, Disk ${this.status.metrics.diskUsage}%`);
      
      if (resourceIssues.length > 0) {
        this.status.alerts.push({
          severity: 'medium',
          component: 'system-resources',
          message: `Resource issues detected: ${resourceIssues.join(', ')}`,
          timestamp: new Date().toISOString()
        });
      }
      
    } catch (error) {
      console.log(`  ❌ System resource check error: ${error.message}`);
    }
  }

  calculateOverallStatus() {
    const componentStatuses = Object.values(this.status.components).map(c => c.status);
    
    if (componentStatuses.includes('error') || componentStatuses.includes('critical')) {
      this.status.overall = 'critical';
    } else if (componentStatuses.includes('warning')) {
      this.status.overall = 'warning';
    } else if (componentStatuses.every(s => s === 'healthy')) {
      this.status.overall = 'healthy';
    } else {
      this.status.overall = 'unknown';
    }
  }

  generateRecommendations() {
    // Generate recommendations based on status
    if (this.status.components.browserAutomation.status === 'error') {
      this.status.recommendations.push({
        priority: 'high',
        category: 'browser-automation',
        action: 'Fix browser automation setup',
        description: 'Install Puppeteer and verify MCP server configuration'
      });
    }
    
    if (this.status.components.apis.details.configuredAPIs < 2) {
      this.status.recommendations.push({
        priority: 'medium',
        category: 'api-configuration',
        action: 'Configure missing API keys',
        description: 'Set PERPLEXITY_API_KEY and GITHUB_PERSONAL_ACCESS_TOKEN environment variables'
      });
    }
    
    if (this.status.metrics.memoryUsage > 80) {
      this.status.recommendations.push({
        priority: 'medium',
        category: 'performance',
        action: 'Monitor memory usage',
        description: 'Consider optimizing memory usage or increasing available RAM'
      });
    }
    
    if (this.status.components.performance.details.averageSuccessRate < 90) {
      this.status.recommendations.push({
        priority: 'high',
        category: 'reliability',
        action: 'Investigate test failures',
        description: 'Review failed tests and improve error handling'
      });
    }
  }

  async generateStatusReport() {
    const reportPath = path.join('automation-artifacts', 'system-status-report.json');
    await fs.writeFile(reportPath, JSON.stringify(this.status, null, 2));
  }

  displayStatus() {
    console.log('\n📋 SYSTEM STATUS SUMMARY');
    console.log('=' .repeat(50));
    
    // Overall status
    const statusEmoji = {
      healthy: '✅',
      warning: '⚠️',
      critical: '❌',
      unknown: '❓'
    };
    
    console.log(`Overall Status: ${statusEmoji[this.status.overall]} ${this.status.overall.toUpperCase()}`);
    console.log('');
    
    // Component status
    console.log('Component Status:');
    for (const [component, status] of Object.entries(this.status.components)) {
      console.log(`  ${statusEmoji[status.status]} ${component}: ${status.status}`);
    }
    console.log('');
    
    // System metrics
    console.log('System Metrics:');
    console.log(`  CPU Load: ${this.status.metrics.systemLoadPercent?.toFixed(1) || 'N/A'}%`);
    console.log(`  Memory Usage: ${this.status.metrics.memoryUsage?.toFixed(1) || 'N/A'}%`);
    console.log(`  Disk Usage: ${this.status.metrics.diskUsage || 'N/A'}%`);
    console.log('');
    
    // Alerts
    if (this.status.alerts.length > 0) {
      console.log('🚨 Active Alerts:');
      for (const alert of this.status.alerts) {
        console.log(`  ${alert.severity.toUpperCase()}: ${alert.message}`);
      }
      console.log('');
    }
    
    // Recommendations
    if (this.status.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      for (const rec of this.status.recommendations) {
        console.log(`  ${rec.priority.toUpperCase()}: ${rec.action} - ${rec.description}`);
      }
      console.log('');
    }
    
    console.log('📄 Full report saved to: automation-artifacts/system-status-report.json');
    console.log(`🕒 Last updated: ${this.status.timestamp}`);
  }
}

// CLI interface
if (require.main === module) {
  const monitor = new AutomationSystemMonitor();
  monitor.checkSystemStatus().catch(console.error);
}

module.exports = AutomationSystemMonitor;
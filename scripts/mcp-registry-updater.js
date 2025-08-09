#!/usr/bin/env node

/**
 * MCP Registry Updater for EchoTune AI
 * Automates registry updates, server discovery integration, and status synchronization
 * Maintains comprehensive registry of all MCP servers and their capabilities
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class MCPRegistryUpdater {
  constructor(options = {}) {
    this.registryPath = options.registryPath || path.join(process.cwd(), 'mcp-registry.json');
    this.packagePath = options.packagePath || path.join(process.cwd(), 'package.json');
    this.discoveryPath = options.discoveryPath || path.join(process.cwd(), 'mcp-discovery-report.json');
    this.validationPath = options.validationPath || path.join(process.cwd(), 'mcp-integration-validation.json');
    
    this.registry = {
      version: '1.0.0',
      lastUpdated: null,
      totalServers: 0,
      activeServers: 0,
      categories: {},
      servers: {}
    };
  }

  async loadExistingRegistry() {
    try {
      const data = await fs.readFile(this.registryPath, 'utf8');
      this.registry = { ...this.registry, ...JSON.parse(data) };
      console.log(`📄 Loaded existing registry with ${this.registry.totalServers} servers`);
    } catch (error) {
      console.log('📝 Creating new MCP registry');
    }
  }

  async loadPackageJson() {
    try {
      const data = await fs.readFile(this.packagePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      throw new Error(`Failed to load package.json: ${error.message}`);
    }
  }

  async loadDiscoveryReport() {
    try {
      const data = await fs.readFile(this.discoveryPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.log('⚠️ No discovery report found, skipping discovery integration');
      return null;
    }
  }

  async loadValidationReport() {
    try {
      const data = await fs.readFile(this.validationPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.log('⚠️ No validation report found, skipping validation data');
      return null;
    }
  }

  categorizeServer(serverName, serverConfig) {
    const categories = [];
    
    // Analyze server type from name and configuration
    const name = serverName.toLowerCase();
    const command = (serverConfig.command || '').toLowerCase();
    const description = (serverConfig.description || '').toLowerCase();
    const capabilities = serverConfig.capabilities || [];
    
    // Music/Audio category
    if (name.includes('spotify') || name.includes('music') || name.includes('audio')) {
      categories.push('music/audio');
    }
    
    // Browser automation
    if (name.includes('browser') || name.includes('puppeteer') || command.includes('puppeteer')) {
      categories.push('browser-automation');
    }
    
    // File operations
    if (name.includes('file') || name.includes('filesystem') || command.includes('filesystem')) {
      categories.push('file-operations');
    }
    
    // Code analysis
    if (name.includes('code') || name.includes('analysis') || description.includes('code')) {
      categories.push('code-analysis');
    }
    
    // Testing
    if (name.includes('test') || description.includes('test') || capabilities.includes('testing')) {
      categories.push('testing');
    }
    
    // Database
    if (name.includes('db') || name.includes('mongo') || name.includes('database')) {
      categories.push('database');
    }
    
    // Analytics
    if (name.includes('analytics') || name.includes('monitoring') || name.includes('sentry')) {
      categories.push('analytics');
    }
    
    // Automation
    if (name.includes('automation') || description.includes('automation')) {
      categories.push('automation');
    }
    
    // Development tools
    if (name.includes('dev') || name.includes('tool') || categories.length === 0) {
      categories.push('development-tools');
    }
    
    return categories;
  }

  extractServerCapabilities(serverName, serverConfig) {
    const capabilities = [];
    
    if (serverConfig.capabilities) {
      return serverConfig.capabilities;
    }
    
    // Infer capabilities from server name and configuration
    const name = serverName.toLowerCase();
    const command = (serverConfig.command || '').toLowerCase();
    const description = (serverConfig.description || '').toLowerCase();
    
    // Browser capabilities
    if (name.includes('browser') || command.includes('puppeteer')) {
      capabilities.push('screenshot', 'web-automation', 'scraping');
    }
    
    // File capabilities
    if (name.includes('file') || command.includes('filesystem')) {
      capabilities.push('file-read', 'file-write', 'directory-scan');
    }
    
    // Spotify capabilities
    if (name.includes('spotify')) {
      capabilities.push('music-api', 'playlist-management', 'audio-analysis');
    }
    
    // Code analysis capabilities
    if (name.includes('code') || name.includes('analysis')) {
      capabilities.push('static-analysis', 'code-review', 'linting');
    }
    
    return capabilities;
  }

  getServerStatus(serverName, validationData) {
    if (!validationData) return 'unknown';
    
    // Check validation results
    if (validationData.integrationTests && validationData.integrationTests[serverName]) {
      const test = validationData.integrationTests[serverName];
      return test.status === 'passed' ? 'active' : 'inactive';
    }
    
    // Check if server requires credentials
    if (validationData.credentialChecks && validationData.credentialChecks[serverName]) {
      const check = validationData.credentialChecks[serverName];
      return check.available ? 'active' : 'needs-credentials';
    }
    
    return 'unknown';
  }

  async updateFromPackageJson() {
    console.log('📦 Updating registry from package.json...');
    
    const packageData = await this.loadPackageJson();
    let updatedCount = 0;
    
    // Process MCP servers from package.json
    if (packageData.mcp && packageData.mcp.servers) {
      for (const [name, config] of Object.entries(packageData.mcp.servers)) {
        const categories = this.categorizeServer(name, config);
        const capabilities = this.extractServerCapabilities(name, config);
        
        this.registry.servers[name] = {
          name,
          type: 'mcp-config',
          source: 'package.json',
          command: config.command,
          args: config.args || [],
          env: Object.keys(config.env || {}),
          description: config.description || '',
          categories,
          capabilities,
          status: 'configured',
          addedDate: this.registry.servers[name]?.addedDate || new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        };
        
        // Update categories count
        for (const category of categories) {
          this.registry.categories[category] = (this.registry.categories[category] || 0) + 1;
        }
        
        updatedCount++;
      }
    }
    
    // Process npm scripts for MCP-related commands
    if (packageData.scripts) {
      for (const [scriptName, scriptCommand] of Object.entries(packageData.scripts)) {
        if (scriptName.startsWith('mcp:') && !this.registry.servers[scriptName]) {
          const categories = this.categorizeServer(scriptName, { command: scriptCommand });
          const capabilities = this.extractServerCapabilities(scriptName, { command: scriptCommand });
          
          this.registry.servers[scriptName] = {
            name: scriptName,
            type: 'npm-script',
            source: 'package.json',
            command: scriptCommand.split(' ')[0],
            args: scriptCommand.split(' ').slice(1),
            env: [],
            description: `npm script: ${scriptName}`,
            categories,
            capabilities,
            status: 'script',
            addedDate: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
          };
          
          updatedCount++;
        }
      }
    }
    
    console.log(`✅ Updated ${updatedCount} servers from package.json`);
    return updatedCount;
  }

  async updateFromDiscovery() {
    console.log('🔍 Updating registry from discovery report...');
    
    const discoveryData = await this.loadDiscoveryReport();
    if (!discoveryData) return 0;
    
    let addedCount = 0;
    
    if (discoveryData.candidates) {
      for (const candidate of discoveryData.candidates) {
        const serverName = candidate.name || candidate.repository;
        
        if (!this.registry.servers[serverName]) {
          const categories = this.categorizeServer(serverName, candidate);
          
          this.registry.servers[serverName] = {
            name: serverName,
            type: 'discovered',
            source: 'discovery',
            repository: candidate.repository,
            description: candidate.description || '',
            categories,
            capabilities: candidate.capabilities || [],
            status: 'discovered',
            relevanceScore: candidate.relevanceScore || 0,
            stars: candidate.stars || 0,
            lastCommit: candidate.lastCommit || null,
            addedDate: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
          };
          
          // Update categories count
          for (const category of categories) {
            this.registry.categories[category] = (this.registry.categories[category] || 0) + 1;
          }
          
          addedCount++;
        }
      }
    }
    
    console.log(`✅ Added ${addedCount} servers from discovery`);
    return addedCount;
  }

  async updateFromValidation() {
    console.log('🧪 Updating registry from validation report...');
    
    const validationData = await this.loadValidationReport();
    if (!validationData) return 0;
    
    let updatedCount = 0;
    
    // Update server statuses based on validation results
    for (const serverName of Object.keys(this.registry.servers)) {
      const server = this.registry.servers[serverName];
      const newStatus = this.getServerStatus(serverName, validationData);
      
      if (newStatus !== 'unknown' && server.status !== newStatus) {
        server.status = newStatus;
        server.lastValidated = new Date().toISOString();
        server.lastUpdated = new Date().toISOString();
        updatedCount++;
      }
    }
    
    // Add validation metrics to servers
    if (validationData.performanceMetrics) {
      for (const [serverName, metrics] of Object.entries(validationData.performanceMetrics)) {
        if (this.registry.servers[serverName]) {
          this.registry.servers[serverName].performance = metrics;
          this.registry.servers[serverName].lastUpdated = new Date().toISOString();
          updatedCount++;
        }
      }
    }
    
    console.log(`✅ Updated ${updatedCount} server statuses from validation`);
    return updatedCount;
  }

  generateStats() {
    const servers = Object.values(this.registry.servers);
    
    this.registry.totalServers = servers.length;
    this.registry.activeServers = servers.filter(s => 
      s.status === 'active' || s.status === 'configured'
    ).length;
    
    // Generate category statistics
    this.registry.categories = {};
    for (const server of servers) {
      for (const category of server.categories || []) {
        this.registry.categories[category] = (this.registry.categories[category] || 0) + 1;
      }
    }
    
    // Generate status statistics
    this.registry.statusCounts = {};
    for (const server of servers) {
      const status = server.status || 'unknown';
      this.registry.statusCounts[status] = (this.registry.statusCounts[status] || 0) + 1;
    }
    
    // Generate source statistics
    this.registry.sourceCounts = {};
    for (const server of servers) {
      const source = server.source || 'unknown';
      this.registry.sourceCounts[source] = (this.registry.sourceCounts[source] || 0) + 1;
    }
  }

  async saveRegistry() {
    this.registry.lastUpdated = new Date().toISOString();
    this.generateStats();
    
    await fs.writeFile(this.registryPath, JSON.stringify(this.registry, null, 2));
    console.log(`💾 Saved registry to ${this.registryPath}`);
    
    // Create a summary report
    const summaryPath = this.registryPath.replace('.json', '-summary.md');
    const summary = this.generateSummaryReport();
    await fs.writeFile(summaryPath, summary);
    console.log(`📋 Generated summary report: ${summaryPath}`);
  }

  generateSummaryReport() {
    const servers = Object.values(this.registry.servers);
    
    let report = `# MCP Registry Summary\n\n`;
    report += `**Last Updated:** ${this.registry.lastUpdated}\n\n`;
    report += `## Overview\n\n`;
    report += `- **Total Servers:** ${this.registry.totalServers}\n`;
    report += `- **Active Servers:** ${this.registry.activeServers}\n\n`;
    
    report += `## Status Distribution\n\n`;
    for (const [status, count] of Object.entries(this.registry.statusCounts || {})) {
      const emoji = {
        active: '✅',
        configured: '⚙️',
        discovered: '🔍',
        inactive: '❌',
        'needs-credentials': '🔑',
        script: '📜',
        unknown: '❓'
      }[status] || '❓';
      
      report += `- ${emoji} **${status}**: ${count}\n`;
    }
    
    report += `\n## Categories\n\n`;
    for (const [category, count] of Object.entries(this.registry.categories || {})) {
      report += `- **${category}**: ${count} servers\n`;
    }
    
    report += `\n## Server Details\n\n`;
    
    // Group servers by category
    const serversByCategory = {};
    for (const server of servers) {
      for (const category of server.categories || ['uncategorized']) {
        if (!serversByCategory[category]) {
          serversByCategory[category] = [];
        }
        serversByCategory[category].push(server);
      }
    }
    
    for (const [category, categoryServers] of Object.entries(serversByCategory)) {
      report += `### ${category}\n\n`;
      
      for (const server of categoryServers) {
        const statusEmoji = {
          active: '✅',
          configured: '⚙️',
          discovered: '🔍',
          inactive: '❌',
          'needs-credentials': '🔑',
          script: '📜',
          unknown: '❓'
        }[server.status] || '❓';
        
        report += `- ${statusEmoji} **${server.name}** (${server.type})\n`;
        if (server.description) report += `  - ${server.description}\n`;
        if (server.capabilities?.length > 0) {
          report += `  - Capabilities: ${server.capabilities.join(', ')}\n`;
        }
        if (server.repository) report += `  - Repository: ${server.repository}\n`;
        report += '\n';
      }
    }
    
    return report;
  }

  async fullUpdate() {
    console.log('🚀 Starting full MCP registry update...\n');
    
    await this.loadExistingRegistry();
    
    const packageUpdates = await this.updateFromPackageJson();
    const discoveryUpdates = await this.updateFromDiscovery();
    const validationUpdates = await this.updateFromValidation();
    
    await this.saveRegistry();
    
    const summary = {
      totalUpdates: packageUpdates + discoveryUpdates + validationUpdates,
      packageUpdates,
      discoveryUpdates,
      validationUpdates,
      totalServers: this.registry.totalServers,
      activeServers: this.registry.activeServers,
      categories: Object.keys(this.registry.categories).length
    };
    
    console.log('\n📊 Update Summary:');
    console.log(`   Total Updates: ${summary.totalUpdates}`);
    console.log(`   Package.json: ${summary.packageUpdates}`);
    console.log(`   Discovery: ${summary.discoveryUpdates}`);
    console.log(`   Validation: ${summary.validationUpdates}`);
    console.log(`   Total Servers: ${summary.totalServers}`);
    console.log(`   Active Servers: ${summary.activeServers}`);
    console.log(`   Categories: ${summary.categories}`);
    
    return summary;
  }

  async showRegistry() {
    await this.loadExistingRegistry();
    
    console.log('📊 MCP Registry Status:');
    console.log(`Last Updated: ${this.registry.lastUpdated || 'Never'}`);
    console.log(`Total Servers: ${this.registry.totalServers}`);
    console.log(`Active Servers: ${this.registry.activeServers}`);
    console.log('');
    
    if (Object.keys(this.registry.categories).length > 0) {
      console.log('📋 Categories:');
      for (const [category, count] of Object.entries(this.registry.categories)) {
        console.log(`   ${category}: ${count} servers`);
      }
      console.log('');
    }
    
    if (Object.keys(this.registry.statusCounts || {}).length > 0) {
      console.log('📈 Status Distribution:');
      for (const [status, count] of Object.entries(this.registry.statusCounts)) {
        const emoji = {
          active: '✅',
          configured: '⚙️',
          discovered: '🔍',
          inactive: '❌',
          'needs-credentials': '🔑',
          script: '📜',
          unknown: '❓'
        }[status] || '❓';
        
        console.log(`   ${emoji} ${status}: ${count}`);
      }
    }
  }
}

// CLI interface
async function main() {
  const command = process.argv[2];
  const updater = new MCPRegistryUpdater();
  
  switch (command) {
    case 'update':
    case 'sync':
      await updater.fullUpdate();
      break;
      
    case 'show':
    case 'status':
      await updater.showRegistry();
      break;
      
    case 'package':
      await updater.loadExistingRegistry();
      await updater.updateFromPackageJson();
      await updater.saveRegistry();
      break;
      
    case 'discovery':
      await updater.loadExistingRegistry();
      await updater.updateFromDiscovery();
      await updater.saveRegistry();
      break;
      
    case 'validation':
      await updater.loadExistingRegistry();
      await updater.updateFromValidation();
      await updater.saveRegistry();
      break;
      
    default:
      console.log(`
📋 MCP Registry Updater for EchoTune AI

Usage:
  node mcp-registry-updater.js <command>

Commands:
  update, sync      Full registry update from all sources
  show, status      Show current registry status
  package          Update from package.json only
  discovery        Update from discovery report only
  validation       Update from validation report only

Examples:
  npm run mcp:registry-update    # Full update
  npm run mcp:registry-status    # Show status
      `);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = MCPRegistryUpdater;
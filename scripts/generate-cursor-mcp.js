#!/usr/bin/env node
/**
 * Cursor MCP Config Generator
 * Generates .vscode/mcp.json configuration for Cursor IDE
 * with Perplexity MCP and local orchestrator endpoints
 */

const fs = require('fs').promises;
const path = require('path');

class CursorMCPConfigGenerator {
    constructor() {
        this.configPath = path.join(process.cwd(), '.vscode', 'mcp.json');
        this.packagePath = path.join(process.cwd(), 'package.json');
    }

    async generate() {
        console.log('🎯 Generating Cursor MCP Configuration...');
        
        try {
            // Ensure .vscode directory exists
            await fs.mkdir(path.dirname(this.configPath), { recursive: true });
            
            // Load existing package.json MCP configuration
            const packageData = JSON.parse(await fs.readFile(this.packagePath, 'utf8'));
            const existingServers = packageData.mcp?.servers || {};
            
            // Generate Cursor-compatible configuration
            const cursorConfig = {
                mcpServers: this.generateServerConfigs(existingServers)
            };
            
            // Write configuration file
            await fs.writeFile(this.configPath, JSON.stringify(cursorConfig, null, 2));
            
            console.log(`✅ Cursor MCP config generated: ${this.configPath}`);
            console.log(`📊 Configured ${Object.keys(cursorConfig.mcpServers).length} MCP servers`);
            
            // Display configuration summary
            this.displaySummary(cursorConfig);
            
            return cursorConfig;
            
        } catch (error) {
            console.error('❌ Failed to generate Cursor MCP config:', error.message);
            throw error;
        }
    }
    
    generateServerConfigs(existingServers) {
        const servers = {};
        
        // Add Perplexity MCP with environment-driven configuration
        if (process.env.PERPLEXITY_API_KEY || this.shouldIncludePerplexity()) {
            servers.perplexity = {
                command: "node",
                args: ["mcp-servers/perplexity-mcp/perplexity-mcp-server.js"],
                env: {
                    "PERPLEXITY_API_KEY": "${PERPLEXITY_API_KEY}",
                    "PERPLEXITY_BASE_URL": "${PERPLEXITY_BASE_URL}",
                    "PERPLEXITY_MODEL": "${PERPLEXITY_MODEL}"
                },
                description: "Perplexity AI research and web search capabilities",
                capabilities: ["research", "web_search", "citations"],
                settings: {
                    enableCache: true,
                    maxCostPerRun: 0.50, // USD
                    cacheExpiry: 300000, // 5 minutes
                    timeout: 30000 // 30 seconds
                },
                costLimits: {
                    maxTokensPerQuery: 4096,
                    maxQueriesPerHour: 100,
                    alertThreshold: 0.25
                }
            };
        }
        
        // Convert existing package.json servers to Cursor format
        for (const [name, config] of Object.entries(existingServers)) {
            if (name === 'perplexity') continue; // Skip, we handle this specially
            
            servers[name] = this.convertToCursorFormat(name, config);
        }
        
        // Add local orchestrator endpoints if they exist
        servers["mcp-orchestrator"] = {
            command: "node",
            args: ["mcp-server/enhanced-mcp-orchestrator.js"],
            description: "Local MCP server orchestration and management",
            capabilities: ["orchestration", "health_monitoring", "server_management"],
            settings: {
                enableCache: false,
                httpEndpoint: "http://localhost:3002"
            }
        };
        
        // Add health monitor
        servers["health-monitor"] = {
            command: "node", 
            args: ["mcp-server/enhanced-health-monitor.js"],
            description: "System health monitoring and diagnostics",
            capabilities: ["health_checks", "metrics", "diagnostics"],
            settings: {
                enableCache: false,
                httpEndpoint: "http://localhost:3010",
                refreshInterval: 30000
            }
        };
        
        return servers;
    }
    
    convertToCursorFormat(name, config) {
        const cursorServer = {
            command: config.command || "node",
            args: config.args || [],
            description: config.description || `${name} MCP server`,
            capabilities: config.capabilities || [],
            settings: {
                enableCache: true,
                timeout: 15000
            }
        };
        
        // Add environment variables if present
        if (config.env && Object.keys(config.env).length > 0) {
            cursorServer.env = config.env;
        }
        
        // Add special settings for different server types
        if (name.includes('browser') || name.includes('puppeteer')) {
            cursorServer.settings.timeout = 30000; // Longer timeout for browser operations
            cursorServer.capabilities = [...(cursorServer.capabilities || []), "browser_automation", "screenshots"];
        }
        
        if (name.includes('spotify')) {
            cursorServer.capabilities = [...(cursorServer.capabilities || []), "music_data", "api_integration"];
            cursorServer.costLimits = {
                maxRequestsPerHour: 1000, // Spotify API limits
                alertThreshold: 800
            };
        }
        
        if (name.includes('filesystem')) {
            cursorServer.capabilities = [...(cursorServer.capabilities || []), "file_operations", "repository_analysis"];
            cursorServer.settings.enableCache = false; // Don't cache file operations
        }
        
        return cursorServer;
    }
    
    shouldIncludePerplexity() {
        // Include Perplexity config even without API key for setup purposes
        return true;
    }
    
    displaySummary(config) {
        console.log('\n📋 Configuration Summary:');
        console.log('─'.repeat(50));
        
        for (const [name, server] of Object.entries(config.mcpServers)) {
            const hasEnv = server.env && Object.keys(server.env).length > 0;
            const status = this.getServerStatus(name, server);
            
            console.log(`🔧 ${name}:`);
            console.log(`   Command: ${server.command} ${server.args?.join(' ') || ''}`);
            console.log(`   Status: ${status}`);
            console.log(`   Capabilities: ${server.capabilities?.join(', ') || 'None'}`);
            
            if (hasEnv) {
                console.log(`   Environment Variables: ${Object.keys(server.env).join(', ')}`);
            }
            
            if (server.settings?.httpEndpoint) {
                console.log(`   HTTP Endpoint: ${server.settings.httpEndpoint}`);
            }
            
            console.log('');
        }
        
        console.log('💡 Usage Instructions:');
        console.log('1. Set required environment variables (see .env.example)');
        console.log('2. Install Cursor IDE if not already installed');
        console.log('3. Open this project in Cursor');
        console.log('4. MCP tools will be automatically available in chat');
        console.log('5. Use "@perplexity" to invoke Perplexity research capabilities');
        console.log('\n📖 For detailed setup: docs/guides/AGENTS.md');
    }
    
    getServerStatus(name, server) {
        // Check if server dependencies are available
        if (name === 'perplexity') {
            return process.env.PERPLEXITY_API_KEY ? '✅ Ready' : '⚠️  API key needed';
        }
        
        if (server.env) {
            const missingVars = Object.keys(server.env).filter(key => 
                key.startsWith('${') ? false : !process.env[key]
            );
            
            if (missingVars.length > 0) {
                return `⚠️  Missing: ${missingVars.join(', ')}`;
            }
        }
        
        return '✅ Ready';
    }
}

// CLI interface
if (require.main === module) {
    const generator = new CursorMCPConfigGenerator();
    
    generator.generate()
        .then(() => {
            console.log('\n🎉 Cursor MCP configuration generated successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Configuration generation failed:', error.message);
            process.exit(1);
        });
}

module.exports = CursorMCPConfigGenerator;
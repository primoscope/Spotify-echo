#!/usr/bin/env node
/**
 * Cursor MCP Config Generator
 * Generates .vscode/mcp.json configuration for Cursor IDE
 * with comprehensive MCP server mapping, cost controls, and performance budgets
 * 
 * Features:
 * - Perplexity MCP with cost limits and performance budgets
 * - Auto-discovery of all configured MCP servers
 * - Environment variable mapping with validation
 * - Cost controls and usage monitoring
 * - Performance optimization settings
 */

const fs = require('fs').promises;
const path = require('path');

class CursorMCPConfigGenerator {
    constructor() {
        this.configPath = path.join(process.cwd(), '.vscode', 'mcp.json');
        this.packagePath = path.join(process.cwd(), 'package.json');
        this.contextPath = path.join(process.cwd(), '.cursor');
    }

    async generate() {
        console.log('🎯 Generating Comprehensive Cursor MCP Configuration...');
        
        try {
            // Ensure .vscode and .cursor directories exist
            await fs.mkdir(path.dirname(this.configPath), { recursive: true });
            await fs.mkdir(this.contextPath, { recursive: true });
            
            // Load existing package.json MCP configuration
            const packageData = JSON.parse(await fs.readFile(this.packagePath, 'utf8'));
            const existingServers = packageData.mcp?.servers || {};
            
            // Generate comprehensive Cursor configuration
            const cursorConfig = {
                inputs: this.generateInputs(),
                mcpServers: this.generateServerConfigs(existingServers),
                settings: this.generateGlobalSettings(),
                costLimits: this.generateCostLimits(),
                performanceBudgets: this.generatePerformanceBudgets()
            };
            
            // Write main configuration file
            await fs.writeFile(this.configPath, JSON.stringify(cursorConfig, null, 2));
            
            // Generate additional context files
            await this.generateContextFiles();
            
            console.log(`✅ Cursor MCP config generated: ${this.configPath}`);
            console.log(`📊 Configured ${Object.keys(cursorConfig.mcpServers).length} MCP servers`);
            console.log(`🔧 Generated ${cursorConfig.inputs.length} environment inputs`);
            
            // Display configuration summary
            this.displaySummary(cursorConfig);
            
            return cursorConfig;
            
        } catch (error) {
            console.error('❌ Failed to generate Cursor MCP config:', error.message);
            throw error;
        }
    }
    
    generateInputs() {
        return [
            {
                id: "perplexity-key",
                type: "promptString",
                description: "Perplexity API Key",
                password: true,
                placeholder: "pplx-..."
            },
            {
                id: "openai-key", 
                type: "promptString",
                description: "OpenAI API Key",
                password: true,
                placeholder: "sk-..."
            },
            {
                id: "anthropic-key",
                type: "promptString", 
                description: "Anthropic Claude API Key",
                password: true,
                placeholder: "sk-ant-..."
            },
            {
                id: "google-gemini-key",
                type: "promptString",
                description: "Google Gemini API Key", 
                password: true,
                placeholder: "AI..."
            },
            {
                id: "spotify-client-id",
                type: "promptString",
                description: "Spotify Client ID",
                password: false
            },
            {
                id: "spotify-client-secret",
                type: "promptString",
                description: "Spotify Client Secret",
                password: true
            },
            {
                id: "browserbase-key",
                type: "promptString",
                description: "Browserbase API Key (optional)",
                password: true,
                placeholder: "bb_..."
            },
            {
                id: "browserbase-project-id",
                type: "promptString",
                description: "Browserbase Project ID (optional)",
                password: false
            },
            {
                id: "max-cost-per-session",
                type: "promptString",
                description: "Maximum cost per research session (USD)",
                password: false,
                placeholder: "0.50"
            }
        ];
    }
    
    generateServerConfigs(existingServers) {
        const servers = {};
        
        // Add Perplexity MCP with comprehensive configuration
        servers.perplexity = {
            command: "node",
            args: ["mcp-servers/perplexity-mcp/perplexity-mcp-server.js"],
            env: {
                "PERPLEXITY_API_KEY": "${input:perplexity-key}",
                "PERPLEXITY_BASE_URL": "https://api.perplexity.ai",
                "PERPLEXITY_MODEL": "llama-3.1-sonar-large-128k-online",
                "PERPLEXITY_MAX_LATENCY_MS": "1500",
                "PERPLEXITY_MAX_MEMORY_MB": "256", 
                "PERPLEXITY_MAX_CPU_CORES": "0.5",
                "PERPLEXITY_COST_BUDGET_USD": "${input:max-cost-per-session}",
                "PERPLEXITY_CACHE_SIZE": "100",
                "PERPLEXITY_CACHE_EXPIRY_MS": "300000",
                "REDIS_URL": "${REDIS_URL}"
            },
            description: "AI-powered research with web search, citations, and performance budgets",
            capabilities: [
                "research",
                "web_search", 
                "citations",
                "real_time_data",
                "cost_controlled"
            ],
            settings: {
                enableCache: true,
                maxCostPerRun: 0.50,
                cacheExpiry: 300000,
                timeout: 32000,
                performanceBudgets: {
                    maxLatencyMs: 1500,
                    maxMemoryMB: 256,
                    maxCPUCores: 0.5
                }
            },
            costLimits: {
                maxTokensPerQuery: 4096,
                maxQueriesPerSession: 100,
                alertThreshold: 0.25,
                sessionBudgetUSD: 0.50
            }
        };
        
        // Add GitHub MCP for repository operations
        servers.github = {
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-github"],
            env: {
                "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
            },
            description: "GitHub repository operations, issues, and pull requests",
            capabilities: ["repository_analysis", "issue_management", "pr_operations"],
            settings: {
                enableCache: true,
                timeout: 15000
            }
        };
        
        // Add filesystem operations
        servers.filesystem = {
            command: "node",
            args: ["node_modules/FileScopeMCP/dist/mcp-server.js"],
            env: {
                "ALLOWED_DIRECTORIES": `${process.cwd()},${process.cwd()}/src,${process.cwd()}/scripts,${process.cwd()}/mcp-server`
            },
            description: "Secure filesystem operations with directory restrictions",
            capabilities: ["file_operations", "code_analysis", "repository_scanning"],
            settings: {
                enableCache: false,
                timeout: 10000
            }
        };
        
        // Add SQLite operations
        servers.sqlite = {
            command: "npx", 
            args: ["-y", "@modelcontextprotocol/server-sqlite"],
            env: {
                "SQLITE_DB_PATH": "${PWD}/data/echotune.db"
            },
            description: "SQLite database operations and queries",
            capabilities: ["database_queries", "data_analysis", "schema_inspection"],
            settings: {
                enableCache: true,
                timeout: 15000
            }
        };
        
        // Add browser automation
        servers.browser = {
            command: "npx",
            args: ["@modelcontextprotocol/server-puppeteer"],
            env: {
                "PUPPETEER_HEADLESS": "true",
                "PUPPETEER_TIMEOUT": "30000"
            },
            description: "Browser automation and web scraping capabilities",
            capabilities: ["web_automation", "screenshots", "form_filling", "page_interaction"],
            settings: {
                enableCache: false,
                timeout: 35000
            },
            costLimits: {
                maxOperationsPerHour: 100,
                alertThreshold: 80
            }
        };
        
        // Add Browserbase (if configured)
        if (process.env.BROWSERBASE_API_KEY || this.shouldIncludeBrowserbase()) {
            servers.browserbase = {
                command: "npx",
                args: ["@browserbasehq/mcp-server-browserbase"],
                env: {
                    "BROWSERBASE_API_KEY": "${input:browserbase-key}",
                    "BROWSERBASE_PROJECT_ID": "${input:browserbase-project-id}"
                },
                description: "Cloud browser automation with enhanced reliability",
                capabilities: ["cloud_browser", "screenshots", "session_recording", "debugging"],
                settings: {
                    enableCache: false,
                    timeout: 45000
                },
                costLimits: {
                    maxSessionsPerHour: 20,
                    alertThreshold: 15
                }
            };
        }
        
        // Add Sequential Thinking for complex reasoning
        servers["sequential-thinking"] = {
            command: "node",
            args: ["mcp-servers/sequential-thinking/dist/index.js"],
            description: "Structured thinking and reasoning capabilities for complex tasks",
            capabilities: ["structured_reasoning", "problem_solving", "step_by_step_analysis"],
            settings: {
                enableCache: true,
                timeout: 20000
            }
        };
        
        // Add Spotify integration
        servers.spotify = {
            command: "python",
            args: ["mcp-server/spotify_server.py"],
            env: {
                "SPOTIFY_CLIENT_ID": "${input:spotify-client-id}",
                "SPOTIFY_CLIENT_SECRET": "${input:spotify-client-secret}"
            },
            description: "Spotify API integration for music data and operations",
            capabilities: ["music_data", "playlist_management", "audio_analysis", "user_profiles"],
            settings: {
                enableCache: true,
                timeout: 15000
            },
            costLimits: {
                maxRequestsPerHour: 1000,
                alertThreshold: 800
            }
        };
        
        // Convert and merge existing package.json servers
        for (const [name, config] of Object.entries(existingServers)) {
            // Skip servers we've already configured
            if (servers[name]) continue;
            
            servers[name] = this.convertToCursorFormat(name, config);
        }
        
        // Add local orchestrator and monitoring
        servers["mcp-orchestrator"] = {
            command: "node",
            args: ["mcp-server/enhanced-mcp-orchestrator.js"],
            description: "Local MCP server orchestration, health monitoring, and load balancing",
            capabilities: ["orchestration", "health_monitoring", "server_management", "load_balancing"],
            settings: {
                enableCache: false,
                httpEndpoint: "http://localhost:3002",
                refreshInterval: 30000
            }
        };
        
        servers["health-monitor"] = {
            command: "node", 
            args: ["mcp-server/enhanced-health-monitor.js"],
            description: "System health monitoring, diagnostics, and performance tracking",
            capabilities: ["health_checks", "metrics", "diagnostics", "performance_tracking"],
            settings: {
                enableCache: false,
                httpEndpoint: "http://localhost:3010",
                refreshInterval: 15000
            }
        };
        
        return servers;
    }
    
    generateGlobalSettings() {
        return {
            defaultTimeout: 15000,
            enableGlobalCache: true,
            globalCacheExpiry: 300000,
            maxConcurrentOperations: 10,
            enableCostTracking: true,
            enablePerformanceMonitoring: true,
            autoRetry: {
                enabled: true,
                maxRetries: 2,
                backoffMs: 1000
            },
            logging: {
                level: "info",
                enableRequestLogging: false,
                enableErrorLogging: true
            }
        };
    }
    
    generateCostLimits() {
        return {
            global: {
                maxCostPerHour: 2.00,
                maxCostPerDay: 10.00,
                alertThresholds: [0.50, 1.00, 5.00],
                currency: "USD"
            },
            perProvider: {
                perplexity: {
                    maxCostPerSession: 0.50,
                    maxSessionsPerHour: 20
                },
                openai: {
                    maxCostPerSession: 1.00,
                    maxTokensPerHour: 100000
                },
                anthropic: {
                    maxCostPerSession: 1.00,
                    maxTokensPerHour: 100000
                }
            }
        };
    }
    
    generatePerformanceBudgets() {
        return {
            global: {
                maxLatencyP95Ms: 2000,
                maxMemoryUsageMB: 512,
                maxCPUUsagePercent: 70
            },
            perServer: {
                perplexity: {
                    maxLatencyP95Ms: 1500,
                    maxMemoryUsageMB: 256,
                    maxCPUCores: 0.5
                },
                browser: {
                    maxLatencyP95Ms: 10000,
                    maxMemoryUsageMB: 512,
                    maxCPUCores: 1.0
                },
                filesystem: {
                    maxLatencyP95Ms: 500,
                    maxMemoryUsageMB: 128,
                    maxCPUCores: 0.25
                }
            }
        };
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
            cursorServer.settings.timeout = 35000;
            cursorServer.capabilities = [...(cursorServer.capabilities || []), "browser_automation", "screenshots", "web_scraping"];
        }
        
        if (name.includes('spotify')) {
            cursorServer.capabilities = [...(cursorServer.capabilities || []), "music_data", "api_integration", "playlist_management"];
            cursorServer.costLimits = {
                maxRequestsPerHour: 1000,
                alertThreshold: 800
            };
        }
        
        if (name.includes('filesystem') || name.includes('file')) {
            cursorServer.capabilities = [...(cursorServer.capabilities || []), "file_operations", "repository_analysis", "code_scanning"];
            cursorServer.settings.enableCache = false;
        }
        
        return cursorServer;
    }
    
    shouldIncludeBrowserbase() {
        return true; // Include for setup purposes
    }
    
    async generateContextFiles() {
        // Generate AI workflows configuration
        const aiWorkflows = {
            workflows: [
                {
                    name: "research-to-pr",
                    description: "Research a topic and create a comprehensive PR with implementation",
                    steps: [
                        "Use @perplexity to research the topic comprehensively",
                        "Use @github to analyze current repository structure",
                        "Use @filesystem to implement changes",
                        "Use @sequential-thinking to plan the implementation strategy",
                        "Create tests and documentation"
                    ],
                    estimatedCost: 0.25,
                    estimatedTime: "15-30 minutes"
                },
                {
                    name: "code-review-analysis",
                    description: "Perform comprehensive code review with research-backed suggestions",
                    steps: [
                        "Use @filesystem to analyze code changes",
                        "Use @perplexity to research best practices for identified patterns",
                        "Use @sequential-thinking to structure review feedback",
                        "Generate actionable improvement suggestions"
                    ],
                    estimatedCost: 0.15,
                    estimatedTime: "10-20 minutes"
                },
                {
                    name: "performance-optimization",
                    description: "Analyze and optimize system performance",
                    steps: [
                        "Use @health-monitor to get current performance metrics",
                        "Use @perplexity to research optimization strategies",
                        "Use @filesystem to implement optimizations", 
                        "Use @sqlite to analyze data performance",
                        "Validate improvements with benchmarks"
                    ],
                    estimatedCost: 0.30,
                    estimatedTime: "20-45 minutes"
                },
                {
                    name: "music-data-analysis",
                    description: "Analyze music data and generate insights",
                    steps: [
                        "Use @spotify to fetch user music data",
                        "Use @sqlite to query historical patterns",
                        "Use @perplexity to research music trend analysis",
                        "Use @sequential-thinking to structure insights",
                        "Generate comprehensive analysis report"
                    ],
                    estimatedCost: 0.20,
                    estimatedTime: "15-30 minutes"
                }
            ]
        };
        
        await fs.writeFile(
            path.join(this.contextPath, 'ai-workflows.json'),
            JSON.stringify(aiWorkflows, null, 2)
        );
        
        // Generate context documentation
        const contextDoc = `# EchoTune AI MCP Orchestrator Context

## Project Architecture
EchoTune AI is a production-grade music recommendation system with comprehensive MCP integration for automated development workflows.

## Key Components
- **Perplexity Research**: AI-powered research with web search and citations
- **Music Intelligence**: Spotify integration with ML-powered recommendations  
- **Development Automation**: Complete MCP ecosystem for testing, validation, and deployment
- **Performance Monitoring**: Real-time health monitoring and budget enforcement

## MCP Server Capabilities
- **Research & Analysis**: Perplexity, Sequential-thinking, GitHub
- **Data Operations**: SQLite, Filesystem, Spotify
- **Browser Automation**: Puppeteer, Browserbase
- **System Management**: Health monitoring, Orchestration

## Performance Budgets
- Perplexity: p95≤1500ms, ≤256MB memory, ≤$0.50/session
- Browser: p95≤10000ms, ≤512MB memory
- Filesystem: p95≤500ms, ≤128MB memory
- Global: ≤$2.00/hour, ≤$10.00/day

## Cost Controls
- Session-based budgeting with real-time tracking
- Provider-specific limits and alerting
- Automatic cost estimation for operations

## Usage Patterns
1. **Research Tasks**: Use @perplexity for comprehensive research with citations
2. **Code Analysis**: Use @filesystem + @github for repository operations
3. **Music Operations**: Use @spotify + @sqlite for music data analysis
4. **Complex Reasoning**: Use @sequential-thinking for structured problem solving
5. **Web Automation**: Use @browser or @browserbase for web operations

## Environment Variables
All MCP servers support environment-based configuration with fallbacks and validation.
`;
        
        await fs.writeFile(
            path.join(this.contextPath, 'project-context.md'),
            contextDoc
        );
        
        console.log(`📄 Generated Cursor context files in ${this.contextPath}/`);
    }
    
    displaySummary(config) {
        console.log('\n📋 Comprehensive Configuration Summary:');
        console.log('═'.repeat(60));
        
        console.log('\n🔧 MCP Servers:');
        for (const [name, server] of Object.entries(config.mcpServers)) {
            const hasEnv = server.env && Object.keys(server.env).length > 0;
            const status = this.getServerStatus(name, server);
            const hasCostLimits = server.costLimits !== undefined;
            
            console.log(`\n📦 ${name}:`);
            console.log(`   Command: ${server.command} ${server.args?.join(' ') || ''}`);
            console.log(`   Status: ${status}`);
            console.log(`   Capabilities: ${server.capabilities?.join(', ') || 'None'}`);
            
            if (hasEnv) {
                const envKeys = Object.keys(server.env).map(key => 
                    key.startsWith('${') ? key : key
                );
                console.log(`   Environment: ${envKeys.join(', ')}`);
            }
            
            if (server.settings?.httpEndpoint) {
                console.log(`   Endpoint: ${server.settings.httpEndpoint}`);
            }
            
            if (server.settings?.timeout) {
                console.log(`   Timeout: ${server.settings.timeout}ms`);
            }
            
            if (hasCostLimits) {
                console.log(`   Cost Limits: ${JSON.stringify(server.costLimits)}`);
            }
        }
        
        console.log('\n💰 Cost Management:');
        console.log(`   Global Budget: $${config.costLimits.global.maxCostPerDay}/day`);
        console.log(`   Perplexity Budget: $${config.costLimits.perProvider.perplexity.maxCostPerSession}/session`);
        console.log(`   Alert Thresholds: $${config.costLimits.global.alertThresholds.join(', $')}`);
        
        console.log('\n⚡ Performance Budgets:');
        console.log(`   Global Latency: p95≤${config.performanceBudgets.global.maxLatencyP95Ms}ms`);
        console.log(`   Global Memory: ≤${config.performanceBudgets.global.maxMemoryUsageMB}MB`);
        console.log(`   Perplexity: p95≤${config.performanceBudgets.perServer.perplexity.maxLatencyP95Ms}ms, ≤${config.performanceBudgets.perServer.perplexity.maxMemoryUsageMB}MB`);
        
        console.log('\n🔧 Global Settings:');
        console.log(`   Default Timeout: ${config.settings.defaultTimeout}ms`);
        console.log(`   Cache Enabled: ${config.settings.enableGlobalCache}`);
        console.log(`   Max Concurrent Ops: ${config.settings.maxConcurrentOperations}`);
        console.log(`   Auto Retry: ${config.settings.autoRetry.enabled ? 'Yes' : 'No'} (${config.settings.autoRetry.maxRetries} max)`);
        
        console.log('\n💡 Quick Start Guide:');
        console.log('─'.repeat(40));
        console.log('1. Set environment variables (see .env.example)');
        console.log('2. Install Cursor IDE: https://cursor.sh/');
        console.log('3. Open this project in Cursor');
        console.log('4. MCP tools will be automatically available');
        console.log('5. Try these commands:');
        console.log('   • "@perplexity research latest AI trends"');
        console.log('   • "@github analyze this repository"');
        console.log('   • "@spotify get my top tracks"');
        console.log('   • "@health-monitor show system status"');
        
        console.log('\n📚 Documentation:');
        console.log('   • Setup Guide: docs/guides/AGENTS.md');
        console.log('   • MCP Integration: docs/mcp-servers.md');
        console.log('   • Context Files: .cursor/project-context.md');
        console.log('   • Workflows: .cursor/ai-workflows.json');
    }
    
    getServerStatus(name, server) {
        // Check Perplexity specifically
        if (name === 'perplexity') {
            return process.env.PERPLEXITY_API_KEY ? '✅ Ready' : '⚠️  API key needed';
        }
        
        // Check Browserbase
        if (name === 'browserbase') {
            const hasKey = process.env.BROWSERBASE_API_KEY;
            const hasProject = process.env.BROWSERBASE_PROJECT_ID;
            if (!hasKey || !hasProject) {
                return '⚠️  API key & project ID needed';
            }
            return '✅ Ready';
        }
        
        // Check environment variables
        if (server.env) {
            const missingVars = Object.keys(server.env).filter(key => {
                // Skip input variables (${input:...})
                if (server.env[key].startsWith('${input:')) return false;
                // Skip template variables (${VAR_NAME})  
                if (key.startsWith('${') && key.endsWith('}')) return false;
                // Check actual environment variables
                return !process.env[key];
            });
            
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
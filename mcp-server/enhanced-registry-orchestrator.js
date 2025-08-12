#!/usr/bin/env node
/**
 * Enhanced MCP Registry Orchestration System
 * Automated registry management, server coordination, and intelligent orchestration
 * for all MCP servers in the EchoTune AI ecosystem
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const { spawn } = require('child_process');

class EnhancedMCPRegistryOrchestrator extends EventEmitter {
    constructor() {
        super();
        this.registry = new Map();
        this.serverProcesses = new Map();
        this.orchestrationRules = new Map();
        this.metrics = {
            totalServers: 0,
            activeServers: 0,
            failedStarts: 0,
            restarts: 0,
            averageStartTime: 0
        };
        this.config = {
            maxRetries: 3,
            startTimeout: 10000,
            healthCheckInterval: 30000,
            registryUpdateInterval: 300000, // 5 minutes
            autoRestart: true,
            loadBalancing: true
        };
        this.loadBalancer = new MCPLoadBalancer();
        this.dependencyGraph = new Map();
    }

    async initialize() {
        console.log('🎼 Initializing Enhanced MCP Registry Orchestrator...');
        
        // Load MCP server configurations
        await this.discoverAndRegisterServers();
        
        // Build dependency graph
        await this.buildDependencyGraph();
        
        // Setup orchestration rules
        this.setupOrchestrationRules();
        
        // Start registry monitoring
        this.startRegistryMonitoring();
        
        console.log('✅ Enhanced MCP Registry Orchestrator initialized');
        
        return this;
    }

    async discoverAndRegisterServers() {
        console.log('🔍 Discovering MCP servers...');
        
        try {
            // Load from package.json MCP configuration
            await this.loadMCPConfiguration();
            
            // Discover additional servers from mcp-servers directory
            await this.discoverServerDirectory();
            
            // Load server metadata and capabilities
            await this.loadServerMetadata();
            
            console.log(`📊 Registered ${this.registry.size} MCP servers`);
            
        } catch (error) {
            console.error('❌ Server discovery failed:', error.message);
        }
    }

    async loadMCPConfiguration() {
        const packagePath = path.join(__dirname, '..', 'package.json');
        const packageData = JSON.parse(await fs.readFile(packagePath, 'utf8'));
        const mcpServers = packageData.mcp?.servers || {};

        // Add Perplexity MCP server if API key is present
        if (process.env.PERPLEXITY_API_KEY) {
            mcpServers['perplexity'] = {
                command: 'node',
                args: ['mcp-servers/perplexity-mcp/perplexity-mcp-server.js'],
                env: {
                    'PERPLEXITY_API_KEY': process.env.PERPLEXITY_API_KEY,
                    'PERPLEXITY_BASE_URL': process.env.PERPLEXITY_BASE_URL || 'https://api.perplexity.ai',
                    'PERPLEXITY_MODEL': process.env.PERPLEXITY_MODEL || 'llama-3.1-sonar-small-128k-online'
                },
                description: 'Perplexity AI research and query capabilities',
                capabilities: ['research', 'web_search', 'knowledge_queries'],
                resources: {
                    maxMemory: '256MB',
                    maxCpu: '0.5'
                },
                healthCheck: {
                    path: '/health',
                    timeout: 5000,
                    interval: 30000
                }
            };
        }

        for (const [serverName, config] of Object.entries(mcpServers)) {
            await this.registerServer(serverName, {
                ...config,
                type: 'package-mcp',
                status: 'registered',
                source: serverName === 'perplexity' ? 'env-gated' : 'package.json'
            });
        }
    }

    async discoverServerDirectory() {
        const mcpServersDir = path.join(__dirname, '..', 'mcp-servers');
        
        try {
            const items = await fs.readdir(mcpServersDir);
            
            for (const item of items) {
                const itemPath = path.join(mcpServersDir, item);
                const stats = await fs.stat(itemPath);
                
                if (stats.isDirectory()) {
                    await this.analyzeServerDirectory(item, itemPath);
                }
            }
        } catch (error) {
            console.log('⚠️  MCP servers directory not found, skipping directory discovery');
        }
    }

    async analyzeServerDirectory(serverName, serverPath) {
        try {
            // Look for package.json or main entry point
            const packageJsonPath = path.join(serverPath, 'package.json');
            const indexJsPath = path.join(serverPath, 'index.js');
            
            let config = {
                type: 'directory-mcp',
                status: 'discovered',
                source: 'directory',
                path: serverPath
            };

            try {
                const packageData = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
                config = {
                    ...config,
                    name: packageData.name || serverName,
                    version: packageData.version,
                    description: packageData.description,
                    command: 'node',
                    args: [path.join(serverPath, packageData.main || 'index.js')],
                    capabilities: packageData.mcp?.capabilities || []
                };
            } catch {
                // No package.json, check for index.js
                try {
                    await fs.access(indexJsPath);
                    config = {
                        ...config,
                        command: 'node',
                        args: [indexJsPath],
                        capabilities: []
                    };
                } catch {
                    console.log(`⚠️  Server ${serverName} has no recognized entry point`);
                    return;
                }
            }

            await this.registerServer(serverName, config);
            
        } catch (error) {
            console.error(`❌ Failed to analyze server ${serverName}:`, error.message);
        }
    }

    async registerServer(serverName, config) {
        console.log(`📝 Registering server: ${serverName}`);
        
        const serverInfo = {
            name: serverName,
            ...config,
            registeredAt: new Date().toISOString(),
            lastHealthCheck: null,
            consecutiveFailures: 0,
            totalStarts: 0,
            totalFailures: 0,
            averageStartTime: 0,
            pid: null,
            port: this.assignPort(serverName),
            dependencies: [],
            dependents: []
        };

        this.registry.set(serverName, serverInfo);
        this.metrics.totalServers++;
        
        // Emit registration event
        this.emit('serverRegistered', { serverName, config: serverInfo });
        
        return serverInfo;
    }

    assignPort(serverName) {
        const portMap = {
            'mcp-orchestrator': 3002,
            'mcp-workflow': 3003,
            'mcp-health': 3001,
            'enhanced-health-monitor': 3010
        };
        
        return portMap[serverName] || (3100 + this.registry.size);
    }

    async loadServerMetadata() {
        console.log('📚 Loading server metadata and capabilities...');
        
        for (const [serverName, serverInfo] of this.registry) {
            try {
                // Enhanced capability detection
                const capabilities = await this.detectServerCapabilities(serverInfo);
                serverInfo.capabilities = capabilities;
                
                // Load server-specific configuration
                await this.loadServerSpecificConfig(serverName, serverInfo);
                
            } catch (error) {
                console.error(`⚠️  Failed to load metadata for ${serverName}:`, error.message);
            }
        }
    }

    async detectServerCapabilities(serverInfo) {
        const capabilities = serverInfo.capabilities || [];
        
        // Analyze server based on name and configuration
        const capabilityMap = {
            'filesystem': ['file_operations', 'repository_analysis'],
            'browserbase': ['browser_automation', 'cloud_testing'],
            'puppeteer': ['browser_automation', 'local_testing'],
            'spotify': ['music_data', 'api_integration'],
            'sequential-thinking': ['reasoning', 'analysis'],
            'screenshot-website': ['screenshots', 'web_capture'],
            'enhanced-browser-tools': ['enhanced_automation', 'error_handling'],
            'sentry': ['error_tracking', 'monitoring']
        };
        
        for (const [pattern, caps] of Object.entries(capabilityMap)) {
            if (serverInfo.name.includes(pattern)) {
                capabilities.push(...caps);
            }
        }
        
        // Deduplicate capabilities
        return [...new Set(capabilities)];
    }

    async loadServerSpecificConfig(serverName, serverInfo) {
        // Load server-specific orchestration rules
        const configPath = path.join(__dirname, '..', 'mcp-servers', serverName, 'orchestration.json');
        
        try {
            const configData = JSON.parse(await fs.readFile(configPath, 'utf8'));
            serverInfo.orchestrationConfig = configData;
            
            // Set up dependencies
            if (configData.dependencies) {
                serverInfo.dependencies = configData.dependencies;
            }
            
        } catch {
            // No specific config, use defaults
            serverInfo.orchestrationConfig = this.getDefaultOrchestrationConfig(serverName);
        }
    }

    getDefaultOrchestrationConfig(serverName) {
        return {
            startOrder: 10,
            restartPolicy: 'on-failure',
            healthCheckPath: '/health',
            gracefulShutdownTimeout: 5000,
            resources: {
                maxMemory: '256M',
                maxCpu: '0.5'
            }
        };
    }

    buildDependencyGraph() {
        console.log('🕸️  Building dependency graph...');
        
        // Define server dependencies based on functionality
        const dependencies = {
            'mcp-workflow': ['mcp-orchestrator'],
            'enhanced-health-monitor': ['mcp-orchestrator'],
            'spotify': ['filesystem'],  // Spotify server might need file system access
            'browserbase': ['enhanced-browser-tools'],
            'puppeteer': ['enhanced-browser-tools']
        };
        
        // Build bidirectional dependency graph
        for (const [serverName, deps] of Object.entries(dependencies)) {
            if (this.registry.has(serverName)) {
                const serverInfo = this.registry.get(serverName);
                serverInfo.dependencies = deps.filter(dep => this.registry.has(dep));
                
                // Update dependents
                for (const dep of serverInfo.dependencies) {
                    const depInfo = this.registry.get(dep);
                    if (!depInfo.dependents.includes(serverName)) {
                        depInfo.dependents.push(serverName);
                    }
                }
            }
        }
        
        this.dependencyGraph = new Map(
            Array.from(this.registry.entries()).map(([name, info]) => [
                name, 
                { dependencies: info.dependencies, dependents: info.dependents }
            ])
        );
    }

    setupOrchestrationRules() {
        console.log('📋 Setting up orchestration rules...');
        
        // Rule: Start servers in dependency order
        this.orchestrationRules.set('startup_order', {
            type: 'startup',
            priority: 10,
            condition: () => true,
            action: async (servers) => {
                return this.getStartupOrder(servers);
            }
        });
        
        // Rule: Restart failed dependencies first
        this.orchestrationRules.set('dependency_restart', {
            type: 'restart',
            priority: 20,
            condition: (server) => server.dependencies.length > 0,
            action: async (server) => {
                await this.restartDependencies(server);
            }
        });
        
        // Rule: Load balancing for high-traffic servers
        this.orchestrationRules.set('load_balancing', {
            type: 'scaling',
            priority: 15,
            condition: (server) => server.capabilities.includes('browser_automation'),
            action: async (server) => {
                return this.considerLoadBalancing(server);
            }
        });
        
        // Rule: Resource monitoring and limits
        this.orchestrationRules.set('resource_limits', {
            type: 'monitoring',
            priority: 30,
            condition: () => true,
            action: async (server) => {
                return this.enforceResourceLimits(server);
            }
        });
    }

    getStartupOrder(servers) {
        const visited = new Set();
        const visiting = new Set();
        const order = [];
        
        const visit = (serverName) => {
            if (visited.has(serverName)) return;
            if (visiting.has(serverName)) {
                throw new Error(`Circular dependency detected involving ${serverName}`);
            }
            
            visiting.add(serverName);
            const server = this.registry.get(serverName);
            
            if (server && server.dependencies) {
                for (const dep of server.dependencies) {
                    visit(dep);
                }
            }
            
            visiting.delete(serverName);
            visited.add(serverName);
            order.push(serverName);
        };
        
        for (const serverName of servers) {
            visit(serverName);
        }
        
        return order;
    }

    async startAllServers() {
        console.log('🚀 Starting all MCP servers...');
        
        const serversToStart = Array.from(this.registry.keys());
        const startupOrder = this.getStartupOrder(serversToStart);
        
        console.log('📊 Startup order:', startupOrder);
        
        const results = [];
        
        for (const serverName of startupOrder) {
            try {
                const result = await this.startServer(serverName);
                results.push(result);
                
                // Wait between starts to avoid resource contention
                await this.delay(1000);
                
            } catch (error) {
                console.error(`❌ Failed to start ${serverName}:`, error.message);
                results.push({
                    serverName,
                    success: false,
                    error: error.message
                });
            }
        }
        
        return results;
    }

    async startServer(serverName) {
        const serverInfo = this.registry.get(serverName);
        if (!serverInfo) {
            throw new Error(`Server ${serverName} not found in registry`);
        }
        
        console.log(`🎯 Starting server: ${serverName}`);
        const startTime = Date.now();
        
        try {
            // Check if dependencies are running
            await this.ensureDependenciesRunning(serverInfo);
            
            // Start the server process
            const process = await this.spawnServerProcess(serverInfo);
            
            // Register the process
            this.serverProcesses.set(serverName, process);
            serverInfo.pid = process.pid;
            serverInfo.status = 'starting';
            serverInfo.totalStarts++;
            
            // Wait for server to be ready
            await this.waitForServerReady(serverName);
            
            const duration = Date.now() - startTime;
            serverInfo.status = 'running';
            serverInfo.lastStartTime = duration;
            serverInfo.averageStartTime = Math.round(
                (serverInfo.averageStartTime * (serverInfo.totalStarts - 1) + duration) / serverInfo.totalStarts
            );
            
            this.metrics.activeServers++;
            
            console.log(`✅ Server ${serverName} started successfully (${duration}ms)`);
            
            this.emit('serverStarted', { serverName, duration });
            
            return {
                serverName,
                success: true,
                duration,
                pid: process.pid
            };
            
        } catch (error) {
            serverInfo.status = 'failed';
            serverInfo.totalFailures++;
            serverInfo.consecutiveFailures++;
            this.metrics.failedStarts++;
            
            console.error(`❌ Failed to start ${serverName}:`, error.message);
            
            this.emit('serverStartFailed', { serverName, error });
            
            throw error;
        }
    }

    async spawnServerProcess(serverInfo) {
        return new Promise((resolve, reject) => {
            const { command, args = [], env = {} } = serverInfo;
            
            if (!command) {
                reject(new Error('No command specified for server'));
                return;
            }
            
            const processEnv = { ...process.env, ...env };
            const childProcess = spawn(command, args, {
                env: processEnv,
                stdio: 'pipe',
                detached: false
            });
            
            let resolved = false;
            
            childProcess.stdout.on('data', (data) => {
                console.log(`[${serverInfo.name}] ${data.toString().trim()}`);
            });
            
            childProcess.stderr.on('data', (data) => {
                console.error(`[${serverInfo.name}] ${data.toString().trim()}`);
            });
            
            childProcess.on('spawn', () => {
                if (!resolved) {
                    resolved = true;
                    resolve(childProcess);
                }
            });
            
            childProcess.on('error', (error) => {
                if (!resolved) {
                    resolved = true;
                    reject(error);
                }
            });
            
            // Timeout for process spawn
            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    childProcess.kill();
                    reject(new Error('Server process spawn timeout'));
                }
            }, this.config.startTimeout);
        });
    }

    async ensureDependenciesRunning(serverInfo) {
        for (const depName of serverInfo.dependencies) {
            const depInfo = this.registry.get(depName);
            
            if (!depInfo || depInfo.status !== 'running') {
                console.log(`🔗 Starting dependency ${depName} for ${serverInfo.name}`);
                await this.startServer(depName);
            }
        }
    }

    async waitForServerReady(serverName, maxWaitTime = 10000) {
        const serverInfo = this.registry.get(serverName);
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWaitTime) {
            try {
                // Try to check if server is responding
                const healthUrl = `http://localhost:${serverInfo.port}/health`;
                await this.makeHealthRequest(healthUrl, 2000);
                return true;
            } catch {
                // Server not ready yet, wait and retry
                await this.delay(500);
            }
        }
        
        throw new Error(`Server ${serverName} failed to become ready within timeout`);
    }

    async makeHealthRequest(url, timeout = 5000) {
        const http = require('http');
        
        return new Promise((resolve, reject) => {
            const req = http.get(url, { timeout }, (res) => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve();
                } else {
                    reject(new Error(`HTTP ${res.statusCode}`));
                }
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.on('error', reject);
        });
    }

    async stopServer(serverName) {
        const serverInfo = this.registry.get(serverName);
        const process = this.serverProcesses.get(serverName);
        
        if (!process) {
            console.log(`⚠️  Server ${serverName} is not running`);
            return;
        }
        
        console.log(`🛑 Stopping server: ${serverName}`);
        
        try {
            // Graceful shutdown
            process.kill('SIGTERM');
            
            // Wait for graceful shutdown
            await this.waitForProcessExit(process, serverInfo.orchestrationConfig?.gracefulShutdownTimeout || 5000);
            
        } catch {
            // Force kill if graceful shutdown fails
            console.log(`⚡ Force killing server: ${serverName}`);
            process.kill('SIGKILL');
        }
        
        this.serverProcesses.delete(serverName);
        serverInfo.status = 'stopped';
        serverInfo.pid = null;
        
        if (this.metrics.activeServers > 0) {
            this.metrics.activeServers--;
        }
        
        this.emit('serverStopped', { serverName });
    }

    async waitForProcessExit(process, timeout) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error('Process exit timeout'));
            }, timeout);
            
            process.on('exit', () => {
                clearTimeout(timer);
                resolve();
            });
        });
    }

    startRegistryMonitoring() {
        console.log('👁️  Starting registry monitoring...');
        
        // Health check monitoring
        setInterval(async () => {
            await this.performHealthChecks();
        }, this.config.healthCheckInterval);
        
        // Registry update monitoring
        setInterval(async () => {
            await this.updateRegistry();
        }, this.config.registryUpdateInterval);
        
        // Resource monitoring
        setInterval(async () => {
            await this.monitorResources();
        }, 60000); // Every minute
    }

    async performHealthChecks() {
        for (const [serverName, serverInfo] of this.registry) {
            if (serverInfo.status === 'running') {
                try {
                    const healthUrl = `http://localhost:${serverInfo.port}/health`;
                    await this.makeHealthRequest(healthUrl);
                    
                    serverInfo.lastHealthCheck = Date.now();
                    serverInfo.consecutiveFailures = 0;
                    
                } catch (error) {
                    serverInfo.consecutiveFailures++;
                    
                    console.log(`⚠️  Health check failed for ${serverName}: ${error.message}`);
                    
                    // Auto-restart if configured
                    if (this.config.autoRestart && serverInfo.consecutiveFailures >= 3) {
                        console.log(`🔄 Auto-restarting ${serverName}...`);
                        await this.restartServer(serverName);
                    }
                }
            }
        }
    }

    async restartServer(serverName) {
        console.log(`🔄 Restarting server: ${serverName}`);
        
        try {
            await this.stopServer(serverName);
            await this.delay(2000);
            await this.startServer(serverName);
            
            this.metrics.restarts++;
            
        } catch (error) {
            console.error(`❌ Failed to restart ${serverName}:`, error.message);
        }
    }

    async updateRegistry() {
        // Rediscover servers and update registry
        await this.discoverAndRegisterServers();
    }

    async monitorResources() {
        // Monitor system resources and apply orchestration rules
        for (const [serverName, serverInfo] of this.registry) {
            if (serverInfo.status === 'running') {
                await this.applyOrchestrationRules(serverInfo);
            }
        }
    }

    async applyOrchestrationRules(serverInfo) {
        for (const [ruleName, rule] of this.orchestrationRules) {
            try {
                if (rule.condition(serverInfo)) {
                    await rule.action(serverInfo);
                }
            } catch (error) {
                console.error(`❌ Orchestration rule ${ruleName} failed:`, error.message);
            }
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getRegistryStatus() {
        const status = {
            timestamp: new Date().toISOString(),
            metrics: this.metrics,
            servers: Array.from(this.registry.entries()).map(([name, info]) => ({
                name,
                status: info.status,
                port: info.port,
                capabilities: info.capabilities,
                dependencies: info.dependencies,
                uptime: info.status === 'running' ? Date.now() - info.lastStartTime : 0
            })),
            orchestrationRules: Array.from(this.orchestrationRules.keys())
        };
        
        return status;
    }

    async shutdown() {
        console.log('🔄 Shutting down MCP Registry Orchestrator...');
        
        // Stop all servers in reverse dependency order
        const shutdownOrder = this.getStartupOrder(Array.from(this.registry.keys())).reverse();
        
        for (const serverName of shutdownOrder) {
            try {
                await this.stopServer(serverName);
            } catch (error) {
                console.error(`❌ Error stopping ${serverName}:`, error.message);
            }
        }
        
        console.log('✅ MCP Registry Orchestrator shut down successfully');
    }
}

class MCPLoadBalancer {
    constructor() {
        this.pools = new Map();
        this.roundRobinCounters = new Map();
    }

    addServerPool(poolName, servers) {
        this.pools.set(poolName, servers);
        this.roundRobinCounters.set(poolName, 0);
    }

    getNextServer(poolName) {
        const servers = this.pools.get(poolName);
        if (!servers || servers.length === 0) return null;
        
        const counter = this.roundRobinCounters.get(poolName) || 0;
        const nextServer = servers[counter % servers.length];
        
        this.roundRobinCounters.set(poolName, counter + 1);
        
        return nextServer;
    }
}

// CLI interface
if (require.main === module) {
    const orchestrator = new EnhancedMCPRegistryOrchestrator();
    
    orchestrator.initialize()
        .then(async (orch) => {
            const command = process.argv[2] || 'status';
            
            switch (command) {
                case 'start':
                    await orch.startAllServers();
                    break;
                case 'stop':
                    await orch.shutdown();
                    break;
                case 'restart':
                    await orch.shutdown();
                    await orch.startAllServers();
                    break;
                case 'status':
                default:
                    const status = orch.getRegistryStatus();
                    console.log(JSON.stringify(status, null, 2));
                    break;
            }
        })
        .catch(error => {
            console.error('❌ Orchestrator failed:', error);
            process.exit(1);
        });
}

module.exports = EnhancedMCPRegistryOrchestrator;
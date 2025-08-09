#!/usr/bin/env node
/**
 * Enhanced MCP Orchestrator v2
 * Advanced orchestration system for all MCP servers with performance optimization
 * 
 * Features:
 * - Dynamic server management and load balancing
 * - Real-time performance monitoring
 * - Intelligent routing and fallback systems
 * - Advanced caching and optimization
 * - Comprehensive health monitoring
 * - Auto-scaling capabilities
 */

const express = require('express');
const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class EnhancedMCPOrchestratorV2 extends EventEmitter {
  constructor() {
    super();
    this.app = express();
    this.port = process.env.ENHANCED_MCP_PORT || 3012;
    this.servers = new Map();
    this.performanceMetrics = new Map();
    this.routingTable = new Map();
    this.loadBalancer = new Map();
    this.cache = new Map();
    this.healthCheckInterval = null;
    
    this.serverConfigs = {
      'performance-analyzer': {
        script: 'mcp-servers/performance-analyzer-server.js',
        port: 3010,
        capabilities: ['performance', 'monitoring', 'optimization'],
        priority: 1,
        maxInstances: 2
      },
      'code-intelligence': {
        script: 'mcp-servers/code-intelligence-server.js',
        port: 3011,
        capabilities: ['analysis', 'refactoring', 'quality', 'security'],
        priority: 1,
        maxInstances: 3
      },
      'original-orchestrator': {
        script: 'mcp-server/enhanced-mcp-orchestrator.js',
        port: 3002,
        capabilities: ['diagrams', 'fileOperations', 'browserAutomation'],
        priority: 2,
        maxInstances: 1
      },
      'workflow-manager': {
        script: 'mcp-server/workflow-manager.js',
        port: 3003,
        capabilities: ['workflow', 'automation', 'validation'],
        priority: 2,
        maxInstances: 1
      },
      'health-monitor': {
        script: 'mcp-server/enhanced-health-monitor.js',
        port: 3004,
        capabilities: ['health', 'monitoring', 'diagnostics'],
        priority: 3,
        maxInstances: 1
      }
    };
    
    this.setupMiddleware();
    this.setupRoutes();
    this.initializeOrchestrator();
    
    console.log(`🚀 Enhanced MCP Orchestrator V2 initialized on port ${this.port}`);
  }

  setupMiddleware() {
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // Request timing middleware
    this.app.use((req, res, next) => {
      req.startTime = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - req.startTime;
        this.recordRequestMetrics(req.path, req.method, duration, res.statusCode);
      });
      next();
    });
  }

  setupRoutes() {
    // Enhanced health check with comprehensive status
    this.app.get('/health', async (req, res) => {
      const systemHealth = await this.getSystemHealth();
      res.json(systemHealth);
    });

    // Master control panel
    this.app.get('/api/orchestrator/status', (req, res) => {
      const status = this.getOrchestratorStatus();
      res.json(status);
    });

    // Server management
    this.app.post('/api/servers/:serverId/start', async (req, res) => {
      try {
        const { serverId } = req.params;
        const result = await this.startServer(serverId);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/servers/:serverId/stop', async (req, res) => {
      try {
        const { serverId } = req.params;
        const result = await this.stopServer(serverId);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/servers/:serverId/restart', async (req, res) => {
      try {
        const { serverId } = req.params;
        await this.stopServer(serverId);
        await this.sleep(2000); // Wait 2 seconds
        const result = await this.startServer(serverId);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Performance monitoring
    this.app.get('/api/performance/metrics', (req, res) => {
      const metrics = this.getPerformanceMetrics();
      res.json(metrics);
    });

    this.app.get('/api/performance/recommendations', async (req, res) => {
      const recommendations = await this.generatePerformanceRecommendations();
      res.json({ recommendations });
    });

    // Load balancing and routing
    this.app.post('/api/route/:capability', async (req, res) => {
      try {
        const { capability } = req.params;
        const { payload } = req.body;
        const result = await this.routeRequest(capability, payload, req);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Batch operations
    this.app.post('/api/batch/analyze', async (req, res) => {
      try {
        const { operations } = req.body;
        const results = await this.processBatchOperations(operations);
        res.json({ results });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Advanced caching
    this.app.get('/api/cache/status', (req, res) => {
      const cacheStats = this.getCacheStatistics();
      res.json(cacheStats);
    });

    this.app.delete('/api/cache/clear', (req, res) => {
      const { pattern } = req.query;
      const clearedCount = this.clearCache(pattern);
      res.json({ 
        message: `Cleared ${clearedCount} cache entries`,
        pattern: pattern || 'all'
      });
    });

    // Auto-scaling
    this.app.post('/api/scaling/auto', (req, res) => {
      const { enable = true } = req.body;
      this.autoScaling = enable;
      res.json({ 
        message: `Auto-scaling ${enable ? 'enabled' : 'disabled'}`,
        autoScaling: this.autoScaling
      });
    });

    this.app.post('/api/scaling/scale/:serverId', async (req, res) => {
      try {
        const { serverId } = req.params;
        const { instances = 1 } = req.body;
        const result = await this.scaleServer(serverId, instances);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Comprehensive system analysis
    this.app.post('/api/system/analyze', async (req, res) => {
      try {
        const analysis = await this.performSystemAnalysis();
        res.json(analysis);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Advanced debugging and diagnostics
    this.app.get('/api/debug/servers', (req, res) => {
      const debugInfo = this.getServerDebugInfo();
      res.json(debugInfo);
    });

    this.app.post('/api/debug/test-connectivity', async (req, res) => {
      const connectivityTests = await this.testServerConnectivity();
      res.json(connectivityTests);
    });
  }

  async initializeOrchestrator() {
    console.log('🔧 Initializing Enhanced MCP Orchestrator V2...');
    
    // Initialize routing table
    this.buildRoutingTable();
    
    // Start priority servers first
    await this.startPriorityServers();
    
    // Initialize health monitoring
    this.startHealthMonitoring();
    
    // Initialize auto-scaling
    this.autoScaling = true;
    this.startAutoScaling();
    
    console.log('✅ Enhanced MCP Orchestrator V2 fully initialized');
  }

  buildRoutingTable() {
    for (const [serverId, config] of Object.entries(this.serverConfigs)) {
      config.capabilities.forEach(capability => {
        if (!this.routingTable.has(capability)) {
          this.routingTable.set(capability, []);
        }
        this.routingTable.get(capability).push({
          serverId,
          port: config.port,
          priority: config.priority
        });
      });
    }
    
    // Sort by priority
    for (const [capability, servers] of this.routingTable) {
      servers.sort((a, b) => a.priority - b.priority);
      this.routingTable.set(capability, servers);
    }
    
    console.log('📋 Routing table built for', this.routingTable.size, 'capabilities');
  }

  async startPriorityServers() {
    const priorityServers = Object.entries(this.serverConfigs)
      .filter(([_, config]) => config.priority === 1)
      .sort(([_, a], [__, b]) => a.priority - b.priority);
    
    for (const [serverId] of priorityServers) {
      await this.startServer(serverId);
      await this.sleep(1000); // Stagger startup
    }
  }

  async startServer(serverId) {
    const config = this.serverConfigs[serverId];
    if (!config) {
      throw new Error(`Server configuration not found: ${serverId}`);
    }

    if (this.servers.has(serverId)) {
      const existing = this.servers.get(serverId);
      if (existing.status === 'running') {
        return { message: `Server ${serverId} is already running`, status: 'running' };
      }
    }

    try {
      console.log(`🚀 Starting server: ${serverId}`);
      
      const serverProcess = spawn('node', [config.script], {
        detached: false,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, [`${serverId.toUpperCase()}_PORT`]: config.port }
      });

      const serverInfo = {
        serverId,
        process: serverProcess,
        config,
        status: 'starting',
        startTime: Date.now(),
        restarts: (this.servers.get(serverId)?.restarts || 0),
        lastHealthCheck: null,
        performanceHistory: []
      };

      this.servers.set(serverId, serverInfo);

      // Handle process events
      serverProcess.stdout.on('data', (data) => {
        console.log(`[${serverId}] ${data.toString().trim()}`);
      });

      serverProcess.stderr.on('data', (data) => {
        console.error(`[${serverId}] ERROR: ${data.toString().trim()}`);
      });

      serverProcess.on('close', (code) => {
        console.log(`[${serverId}] Process exited with code ${code}`);
        if (this.servers.has(serverId)) {
          this.servers.get(serverId).status = 'stopped';
        }
        
        // Auto-restart if enabled and not intentionally stopped
        if (this.autoScaling && code !== 0) {
          setTimeout(() => this.startServer(serverId), 5000);
        }
      });

      // Wait for server to be ready
      await this.waitForServerReady(serverId, config.port);
      
      serverInfo.status = 'running';
      console.log(`✅ Server ${serverId} started successfully on port ${config.port}`);
      
      this.emit('serverStarted', { serverId, config });
      
      return { 
        message: `Server ${serverId} started successfully`,
        status: 'running',
        port: config.port,
        capabilities: config.capabilities
      };

    } catch (error) {
      console.error(`❌ Failed to start server ${serverId}:`, error.message);
      throw error;
    }
  }

  async stopServer(serverId) {
    const serverInfo = this.servers.get(serverId);
    if (!serverInfo) {
      return { message: `Server ${serverId} not found`, status: 'not_found' };
    }

    if (serverInfo.status !== 'running') {
      return { message: `Server ${serverId} is not running`, status: serverInfo.status };
    }

    try {
      console.log(`🛑 Stopping server: ${serverId}`);
      
      serverInfo.process.kill('SIGTERM');
      serverInfo.status = 'stopping';
      
      // Wait for graceful shutdown
      await this.sleep(3000);
      
      if (!serverInfo.process.killed) {
        serverInfo.process.kill('SIGKILL');
      }
      
      serverInfo.status = 'stopped';
      console.log(`✅ Server ${serverId} stopped successfully`);
      
      this.emit('serverStopped', { serverId });
      
      return { 
        message: `Server ${serverId} stopped successfully`,
        status: 'stopped'
      };

    } catch (error) {
      console.error(`❌ Failed to stop server ${serverId}:`, error.message);
      throw error;
    }
  }

  async waitForServerReady(serverId, port, timeout = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const response = await this.makeHealthCheckRequest(port);
        if (response.status === 'healthy') {
          return true;
        }
      } catch (error) {
        // Server not ready yet, continue waiting
      }
      
      await this.sleep(1000);
    }
    
    throw new Error(`Server ${serverId} did not become ready within ${timeout}ms`);
  }

  async makeHealthCheckRequest(port) {
    return new Promise((resolve, reject) => {
      const http = require('http');
      const req = http.request({
        hostname: 'localhost',
        port: port,
        path: '/health',
        method: 'GET',
        timeout: 5000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(error);
          }
        });
      });
      
      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Health check timeout')));
      req.end();
    });
  }

  startHealthMonitoring() {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, 30000); // Every 30 seconds
    
    console.log('❤️ Health monitoring started');
  }

  async performHealthChecks() {
    for (const [serverId, serverInfo] of this.servers) {
      if (serverInfo.status !== 'running') continue;
      
      try {
        const healthResponse = await this.makeHealthCheckRequest(serverInfo.config.port);
        serverInfo.lastHealthCheck = {
          timestamp: Date.now(),
          status: 'healthy',
          response: healthResponse
        };
        
        // Record performance metrics
        this.recordServerPerformance(serverId, healthResponse);
        
      } catch (error) {
        serverInfo.lastHealthCheck = {
          timestamp: Date.now(),
          status: 'unhealthy',
          error: error.message
        };
        
        console.warn(`⚠️ Health check failed for ${serverId}: ${error.message}`);
        
        // Auto-restart if unhealthy
        if (this.autoScaling) {
          console.log(`🔄 Auto-restarting unhealthy server: ${serverId}`);
          this.startServer(serverId);
        }
      }
    }
  }

  recordServerPerformance(serverId, healthResponse) {
    const serverInfo = this.servers.get(serverId);
    if (!serverInfo) return;
    
    const performance = {
      timestamp: Date.now(),
      memory: healthResponse.memory,
      uptime: healthResponse.uptime,
      responseTime: Date.now() - serverInfo.lastHealthCheck?.timestamp || 0
    };
    
    serverInfo.performanceHistory.push(performance);
    
    // Keep only last 100 entries
    if (serverInfo.performanceHistory.length > 100) {
      serverInfo.performanceHistory = serverInfo.performanceHistory.slice(-100);
    }
  }

  startAutoScaling() {
    setInterval(async () => {
      if (!this.autoScaling) return;
      
      await this.checkAndScale();
    }, 60000); // Check every minute
    
    console.log('📈 Auto-scaling enabled');
  }

  async checkAndScale() {
    for (const [serverId, serverInfo] of this.servers) {
      if (serverInfo.status !== 'running') continue;
      
      const load = this.calculateServerLoad(serverId);
      const config = serverInfo.config;
      
      // Scale up if high load
      if (load > 80 && this.getServerInstanceCount(serverId) < config.maxInstances) {
        console.log(`📈 Scaling up ${serverId} due to high load (${load}%)`);
        await this.scaleServer(serverId, this.getServerInstanceCount(serverId) + 1);
      }
      
      // Scale down if low load
      if (load < 20 && this.getServerInstanceCount(serverId) > 1) {
        console.log(`📉 Scaling down ${serverId} due to low load (${load}%)`);
        await this.scaleServer(serverId, this.getServerInstanceCount(serverId) - 1);
      }
    }
  }

  calculateServerLoad(serverId) {
    const serverInfo = this.servers.get(serverId);
    if (!serverInfo || serverInfo.performanceHistory.length === 0) return 0;
    
    const recent = serverInfo.performanceHistory.slice(-10);
    const avgMemoryUsage = recent.reduce((sum, p) => sum + (p.memory?.heapUsed || 0), 0) / recent.length;
    const avgResponseTime = recent.reduce((sum, p) => sum + p.responseTime, 0) / recent.length;
    
    // Simple load calculation based on memory and response time
    const memoryLoad = (avgMemoryUsage / (100 * 1024 * 1024)) * 100; // Assume 100MB baseline
    const responseLoad = Math.min((avgResponseTime / 1000) * 100, 100); // Normalize response time
    
    return Math.max(memoryLoad, responseLoad);
  }

  getServerInstanceCount(serverId) {
    return Array.from(this.servers.values())
      .filter(server => server.serverId.startsWith(serverId))
      .filter(server => server.status === 'running').length;
  }

  async scaleServer(serverId, targetInstances) {
    const currentInstances = this.getServerInstanceCount(serverId);
    
    if (targetInstances > currentInstances) {
      // Scale up
      for (let i = currentInstances; i < targetInstances; i++) {
        const instanceId = `${serverId}-${i + 1}`;
        await this.startServerInstance(serverId, instanceId);
      }
    } else if (targetInstances < currentInstances) {
      // Scale down
      const instances = Array.from(this.servers.entries())
        .filter(([id, server]) => id.startsWith(serverId) && server.status === 'running')
        .slice(targetInstances);
      
      for (const [instanceId] of instances) {
        await this.stopServer(instanceId);
      }
    }
    
    return {
      serverId,
      previousInstances: currentInstances,
      targetInstances,
      message: `Scaled ${serverId} from ${currentInstances} to ${targetInstances} instances`
    };
  }

  async startServerInstance(serverId, instanceId) {
    const config = this.serverConfigs[serverId];
    const instancePort = config.port + Math.floor(Math.random() * 1000) + 1000;
    
    const instanceConfig = {
      ...config,
      port: instancePort
    };
    
    this.serverConfigs[instanceId] = instanceConfig;
    return await this.startServer(instanceId);
  }

  async routeRequest(capability, payload, req) {
    const servers = this.routingTable.get(capability);
    if (!servers || servers.length === 0) {
      throw new Error(`No servers available for capability: ${capability}`);
    }
    
    // Load balancing - find the least loaded server
    const availableServers = servers.filter(server => {
      const serverInfo = this.servers.get(server.serverId);
      return serverInfo && serverInfo.status === 'running';
    });
    
    if (availableServers.length === 0) {
      throw new Error(`No healthy servers available for capability: ${capability}`);
    }
    
    const selectedServer = this.selectOptimalServer(availableServers);
    const cacheKey = this.generateCacheKey(capability, payload);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < 300000) { // 5 minutes cache
        return {
          ...cached.data,
          source: 'cache',
          serverId: selectedServer.serverId
        };
      }
    }
    
    try {
      const result = await this.forwardRequest(selectedServer, capability, payload);
      
      // Cache successful results
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
      
      return {
        ...result,
        source: 'server',
        serverId: selectedServer.serverId
      };
      
    } catch (error) {
      // Try fallback servers
      for (const fallbackServer of availableServers) {
        if (fallbackServer.serverId === selectedServer.serverId) continue;
        
        try {
          const result = await this.forwardRequest(fallbackServer, capability, payload);
          return {
            ...result,
            source: 'fallback',
            serverId: fallbackServer.serverId
          };
        } catch (fallbackError) {
          console.warn(`Fallback failed for ${fallbackServer.serverId}:`, fallbackError.message);
        }
      }
      
      throw error;
    }
  }

  selectOptimalServer(servers) {
    // Select server with lowest load
    return servers.reduce((best, current) => {
      const bestLoad = this.calculateServerLoad(best.serverId);
      const currentLoad = this.calculateServerLoad(current.serverId);
      return currentLoad < bestLoad ? current : best;
    });
  }

  async forwardRequest(server, capability, payload) {
    return new Promise((resolve, reject) => {
      const http = require('http');
      const data = JSON.stringify(payload);
      
      const req = http.request({
        hostname: 'localhost',
        port: server.port,
        path: `/api/${capability}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        },
        timeout: 30000
      }, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(responseData));
          } catch (error) {
            reject(error);
          }
        });
      });
      
      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Request timeout')));
      req.write(data);
      req.end();
    });
  }

  generateCacheKey(capability, payload) {
    const crypto = require('crypto');
    const hash = crypto.createHash('md5').update(JSON.stringify({ capability, payload })).digest('hex');
    return `${capability}_${hash}`;
  }

  async processBatchOperations(operations) {
    const results = [];
    const concurrencyLimit = 5;
    
    for (let i = 0; i < operations.length; i += concurrencyLimit) {
      const batch = operations.slice(i, i + concurrencyLimit);
      const batchPromises = batch.map(async (operation) => {
        try {
          const result = await this.routeRequest(operation.capability, operation.payload);
          return { success: true, result };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }

  recordRequestMetrics(path, method, duration, statusCode) {
    const key = `${method}_${path}`;
    if (!this.performanceMetrics.has(key)) {
      this.performanceMetrics.set(key, []);
    }
    
    const metrics = this.performanceMetrics.get(key);
    metrics.push({
      duration,
      statusCode,
      timestamp: Date.now()
    });
    
    // Keep only last 1000 entries
    if (metrics.length > 1000) {
      this.performanceMetrics.set(key, metrics.slice(-1000));
    }
  }

  getPerformanceMetrics() {
    const summary = {};
    
    for (const [key, metrics] of this.performanceMetrics) {
      if (metrics.length === 0) continue;
      
      const durations = metrics.map(m => m.duration);
      const successCount = metrics.filter(m => m.statusCode < 400).length;
      
      summary[key] = {
        requestCount: metrics.length,
        averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
        minDuration: Math.min(...durations),
        maxDuration: Math.max(...durations),
        successRate: (successCount / metrics.length) * 100,
        recentRequests: metrics.slice(-10)
      };
    }
    
    return summary;
  }

  getCacheStatistics() {
    let totalSize = 0;
    let hitCount = 0;
    const cacheEntries = [];
    
    for (const [key, value] of this.cache) {
      const size = JSON.stringify(value).length;
      totalSize += size;
      cacheEntries.push({
        key,
        size,
        timestamp: value.timestamp,
        age: Date.now() - value.timestamp
      });
    }
    
    return {
      totalEntries: this.cache.size,
      totalSize,
      averageSize: this.cache.size > 0 ? totalSize / this.cache.size : 0,
      entries: cacheEntries.sort((a, b) => b.timestamp - a.timestamp).slice(0, 20)
    };
  }

  clearCache(pattern) {
    let clearedCount = 0;
    
    if (!pattern) {
      clearedCount = this.cache.size;
      this.cache.clear();
    } else {
      const regex = new RegExp(pattern);
      for (const [key] of this.cache) {
        if (regex.test(key)) {
          this.cache.delete(key);
          clearedCount++;
        }
      }
    }
    
    return clearedCount;
  }

  async getSystemHealth() {
    const servers = Array.from(this.servers.entries()).map(([id, info]) => ({
      id,
      status: info.status,
      port: info.config.port,
      capabilities: info.config.capabilities,
      uptime: info.startTime ? Date.now() - info.startTime : 0,
      lastHealthCheck: info.lastHealthCheck,
      restarts: info.restarts
    }));
    
    const runningServers = servers.filter(s => s.status === 'running');
    const healthyServers = runningServers.filter(s => 
      s.lastHealthCheck?.status === 'healthy'
    );
    
    return {
      status: healthyServers.length === runningServers.length ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      orchestrator: {
        version: '2.0.0',
        port: this.port,
        uptime: process.uptime() * 1000,
        autoScaling: this.autoScaling
      },
      servers: {
        total: servers.length,
        running: runningServers.length,
        healthy: healthyServers.length,
        details: servers
      },
      capabilities: Array.from(this.routingTable.keys()),
      cache: {
        entries: this.cache.size,
        totalSize: this.getCacheStatistics().totalSize
      },
      performance: {
        totalRequests: Array.from(this.performanceMetrics.values())
          .reduce((sum, metrics) => sum + metrics.length, 0),
        averageResponseTime: this.calculateAverageResponseTime()
      }
    };
  }

  getOrchestratorStatus() {
    return {
      version: '2.0.0',
      status: 'operational',
      servers: Object.fromEntries(
        Array.from(this.servers.entries()).map(([id, info]) => [
          id,
          {
            status: info.status,
            port: info.config.port,
            uptime: info.startTime ? Date.now() - info.startTime : 0,
            capabilities: info.config.capabilities,
            load: this.calculateServerLoad(id)
          }
        ])
      ),
      routingTable: Object.fromEntries(this.routingTable),
      performance: this.getPerformanceMetrics(),
      cache: this.getCacheStatistics(),
      autoScaling: this.autoScaling
    };
  }

  calculateAverageResponseTime() {
    const allMetrics = Array.from(this.performanceMetrics.values()).flat();
    if (allMetrics.length === 0) return 0;
    
    const totalDuration = allMetrics.reduce((sum, m) => sum + m.duration, 0);
    return totalDuration / allMetrics.length;
  }

  async generatePerformanceRecommendations() {
    const recommendations = [];
    const systemHealth = await this.getSystemHealth();
    
    // Server health recommendations
    const unhealthyServers = systemHealth.servers.details.filter(s => 
      s.status === 'running' && s.lastHealthCheck?.status !== 'healthy'
    );
    
    if (unhealthyServers.length > 0) {
      recommendations.push({
        category: 'health',
        severity: 'high',
        title: 'Unhealthy servers detected',
        description: `${unhealthyServers.length} servers are unhealthy`,
        actions: ['Investigate server logs', 'Restart unhealthy servers', 'Check resource usage']
      });
    }
    
    // Performance recommendations
    const avgResponseTime = this.calculateAverageResponseTime();
    if (avgResponseTime > 5000) {
      recommendations.push({
        category: 'performance',
        severity: 'medium',
        title: 'High average response time',
        description: `Average response time is ${Math.round(avgResponseTime)}ms`,
        actions: ['Enable caching', 'Scale up servers', 'Optimize database queries']
      });
    }
    
    // Cache recommendations
    const cacheStats = this.getCacheStatistics();
    if (cacheStats.totalEntries === 0) {
      recommendations.push({
        category: 'caching',
        severity: 'low',
        title: 'Cache not being utilized',
        description: 'No cache entries found',
        actions: ['Implement caching for frequent requests', 'Configure cache TTL']
      });
    }
    
    // Scaling recommendations
    for (const [serverId, serverInfo] of this.servers) {
      const load = this.calculateServerLoad(serverId);
      if (load > 90) {
        recommendations.push({
          category: 'scaling',
          severity: 'high',
          title: `High load on ${serverId}`,
          description: `Server load is ${Math.round(load)}%`,
          actions: ['Scale up server instances', 'Optimize server performance', 'Distribute load']
        });
      }
    }
    
    return recommendations;
  }

  getServerDebugInfo() {
    return Array.from(this.servers.entries()).map(([id, info]) => ({
      id,
      config: info.config,
      status: info.status,
      pid: info.process?.pid,
      startTime: info.startTime,
      restarts: info.restarts,
      lastHealthCheck: info.lastHealthCheck,
      performanceHistory: info.performanceHistory.slice(-10),
      load: this.calculateServerLoad(id)
    }));
  }

  async testServerConnectivity() {
    const tests = [];
    
    for (const [serverId, serverInfo] of this.servers) {
      if (serverInfo.status !== 'running') continue;
      
      try {
        const startTime = Date.now();
        const response = await this.makeHealthCheckRequest(serverInfo.config.port);
        const responseTime = Date.now() - startTime;
        
        tests.push({
          serverId,
          port: serverInfo.config.port,
          status: 'success',
          responseTime,
          response
        });
      } catch (error) {
        tests.push({
          serverId,
          port: serverInfo.config.port,
          status: 'failed',
          error: error.message
        });
      }
    }
    
    return tests;
  }

  async performSystemAnalysis() {
    const analysis = {
      timestamp: Date.now(),
      systemHealth: await this.getSystemHealth(),
      performance: this.getPerformanceMetrics(),
      cache: this.getCacheStatistics(),
      recommendations: await this.generatePerformanceRecommendations(),
      serverAnalysis: this.getServerDebugInfo(),
      connectivityTests: await this.testServerConnectivity()
    };
    
    // Generate summary
    analysis.summary = {
      overallHealth: analysis.systemHealth.status,
      totalServers: analysis.systemHealth.servers.total,
      healthyServers: analysis.systemHealth.servers.healthy,
      averageResponseTime: this.calculateAverageResponseTime(),
      cacheUtilization: analysis.cache.totalEntries > 0 ? 'active' : 'unused',
      criticalRecommendations: analysis.recommendations.filter(r => r.severity === 'high').length,
      autoScalingEnabled: this.autoScaling
    };
    
    return analysis;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  start() {
    this.server = this.app.listen(this.port, () => {
      console.log(`🚀 Enhanced MCP Orchestrator V2 running on port ${this.port}`);
      console.log(`📊 System status: http://localhost:${this.port}/api/orchestrator/status`);
      console.log(`❤️ Health check: http://localhost:${this.port}/health`);
      console.log(`📈 Performance metrics: http://localhost:${this.port}/api/performance/metrics`);
    });
  }

  stop() {
    console.log('🛑 Shutting down Enhanced MCP Orchestrator V2...');
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    // Stop all managed servers
    for (const [serverId] of this.servers) {
      this.stopServer(serverId);
    }
    
    if (this.server) {
      this.server.close();
    }
  }
}

// Start orchestrator if run directly
if (require.main === module) {
  const orchestrator = new EnhancedMCPOrchestratorV2();
  orchestrator.start();
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    orchestrator.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    orchestrator.stop();
    process.exit(0);
  });
}

module.exports = EnhancedMCPOrchestratorV2;
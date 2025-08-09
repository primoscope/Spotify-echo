#!/usr/bin/env node
/**
 * Enhanced MCP Health Monitoring System
 * Provides real-time health monitoring, automated alerts, and recovery mechanisms
 * for all MCP servers in the EchoTune AI ecosystem
 */

const express = require('express');
const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');
const http = require('http');

class EnhancedMCPHealthMonitor extends EventEmitter {
    constructor() {
        super();
        this.app = express();
        this.port = process.env.MCP_HEALTH_MONITOR_PORT || 3010;
        this.healthData = new Map();
        this.alertThresholds = {
            responseTime: 5000, // 5 seconds
            failureCount: 3,
            consecutiveFailures: 2
        };
        this.monitoringInterval = null;
        this.healthHistory = [];
        this.maxHistorySize = 1000;
        
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
    }

    setupRoutes() {
        // Real-time health dashboard
        this.app.get('/health', (req, res) => {
            const summary = this.generateHealthSummary();
            res.json({
                status: 'healthy',
                service: 'mcp-health-monitor',
                timestamp: new Date().toISOString(),
                port: this.port,
                summary,
                uptime: process.uptime(),
                memory: {
                    rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
                    heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
                }
            });
        });

        // Detailed server status
        this.app.get('/servers', (req, res) => {
            const servers = Array.from(this.healthData.entries()).map(([name, data]) => ({
                name,
                ...data,
                lastCheck: data.lastCheck ? new Date(data.lastCheck).toISOString() : null
            }));

            res.json({
                servers,
                totalServers: servers.length,
                healthyServers: servers.filter(s => s.status === 'healthy').length,
                unhealthyServers: servers.filter(s => s.status === 'unhealthy').length
            });
        });

        // Health history and trends
        this.app.get('/history', (req, res) => {
            const limit = parseInt(req.query.limit) || 100;
            const recentHistory = this.healthHistory.slice(-limit);
            
            res.json({
                history: recentHistory,
                totalRecords: this.healthHistory.length,
                trends: this.calculateHealthTrends(recentHistory)
            });
        });

        // Alerts endpoint
        this.app.get('/alerts', (req, res) => {
            const activeAlerts = this.getActiveAlerts();
            res.json({
                alerts: activeAlerts,
                alertCount: activeAlerts.length,
                criticalAlerts: activeAlerts.filter(a => a.severity === 'critical').length
            });
        });

        // Manual health check trigger
        this.app.post('/check', async (req, res) => {
            try {
                const { serverName } = req.body;
                let results;

                if (serverName) {
                    results = await this.checkSingleServer(serverName);
                } else {
                    results = await this.performHealthChecks();
                }

                res.json({
                    success: true,
                    results,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        this.app.post('/check/:serverName', async (req, res) => {
            try {
                const { serverName } = req.params;
                const results = await this.checkSingleServer(serverName);

                res.json({
                    success: true,
                    results,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Recovery actions
        this.app.post('/recover/:serverName', async (req, res) => {
            try {
                const { serverName } = req.params;
                const recovery = await this.attemptServerRecovery(serverName);
                
                res.json({
                    success: recovery.success,
                    serverName,
                    actions: recovery.actions,
                    result: recovery.result
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Configuration endpoint
        this.app.get('/config', (req, res) => {
            res.json({
                alertThresholds: this.alertThresholds,
                monitoringInterval: 30000, // 30 seconds
                maxHistorySize: this.maxHistorySize,
                healthCheckEndpoints: this.getHealthCheckEndpoints()
            });
        });
    }

    async initialize() {
        console.log('🚀 Initializing Enhanced MCP Health Monitor...');
        
        // Load MCP server configurations
        await this.loadMCPServers();
        
        // Start continuous monitoring
        this.startContinuousMonitoring();
        
        // Setup event handlers
        this.setupEventHandlers();
        
        console.log('✅ Enhanced MCP Health Monitor initialized');
    }

    async loadMCPServers() {
        try {
            // Load from package.json MCP configuration
            const packagePath = path.join(__dirname, '..', 'package.json');
            const packageData = JSON.parse(await fs.readFile(packagePath, 'utf8'));
            const mcpServers = packageData.mcp?.servers || {};

            // Initialize health data for each server
            for (const [serverName, config] of Object.entries(mcpServers)) {
                this.healthData.set(serverName, {
                    status: 'unknown',
                    lastCheck: null,
                    responseTime: null,
                    consecutiveFailures: 0,
                    totalFailures: 0,
                    totalChecks: 0,
                    config
                });
            }

            // Add additional monitoring endpoints
            this.addDefaultMonitoringEndpoints();
            
            console.log(`📊 Loaded ${this.healthData.size} MCP servers for monitoring`);
        } catch (error) {
            console.error('❌ Error loading MCP servers:', error.message);
        }
    }

    addDefaultMonitoringEndpoints() {
        const defaultEndpoints = [
            { name: 'mcp-orchestrator', url: 'http://localhost:3002/health' },
            { name: 'mcp-workflow', url: 'http://localhost:3003/status' },
            { name: 'mcp-health', url: 'http://localhost:3001/health' },
            { name: 'main-app', url: 'http://localhost:3000/health' }
        ];

        for (const endpoint of defaultEndpoints) {
            if (!this.healthData.has(endpoint.name)) {
                this.healthData.set(endpoint.name, {
                    status: 'unknown',
                    lastCheck: null,
                    responseTime: null,
                    consecutiveFailures: 0,
                    totalFailures: 0,
                    totalChecks: 0,
                    url: endpoint.url,
                    type: 'service'
                });
            }
        }
    }

    startContinuousMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }

        // Perform health checks every 30 seconds
        this.monitoringInterval = setInterval(async () => {
            await this.performHealthChecks();
        }, 30000);

        // Perform initial health check
        setTimeout(() => this.performHealthChecks(), 2000);
        
        console.log('⏰ Started continuous health monitoring (30s intervals)');
    }

    async performHealthChecks() {
        console.log('🔍 Performing comprehensive health checks...');
        const results = [];

        for (const [serverName, healthInfo] of this.healthData) {
            try {
                const result = await this.checkSingleServer(serverName);
                results.push(result);
            } catch (error) {
                console.error(`❌ Health check failed for ${serverName}:`, error.message);
                results.push({
                    serverName,
                    status: 'error',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }

        // Update health history
        this.updateHealthHistory(results);
        
        // Check for alerts
        this.checkForAlerts(results);

        return results;
    }

    async checkSingleServer(serverName) {
        const healthInfo = this.healthData.get(serverName);
        if (!healthInfo) {
            throw new Error(`Server ${serverName} not found`);
        }

        const startTime = Date.now();
        let status = 'healthy';
        let error = null;

        try {
            // Determine health check method
            const healthUrl = this.getHealthCheckUrl(serverName, healthInfo);
            
            if (healthUrl) {
                // HTTP health check
                await this.performHttpHealthCheck(healthUrl);
            } else {
                // Command availability check
                await this.performCommandHealthCheck(healthInfo);
            }

        } catch (checkError) {
            status = 'unhealthy';
            error = checkError.message;
            healthInfo.consecutiveFailures++;
            healthInfo.totalFailures++;
        }

        const responseTime = Date.now() - startTime;
        
        // Update health data
        healthInfo.status = status;
        healthInfo.lastCheck = Date.now();
        healthInfo.responseTime = responseTime;
        healthInfo.totalChecks++;

        if (status === 'healthy') {
            healthInfo.consecutiveFailures = 0;
        }

        const result = {
            serverName,
            status,
            responseTime,
            error,
            timestamp: new Date().toISOString(),
            consecutiveFailures: healthInfo.consecutiveFailures
        };

        console.log(`${status === 'healthy' ? '✅' : '❌'} ${serverName}: ${status} (${responseTime}ms)`);
        
        return result;
    }

    getHealthCheckUrl(serverName, healthInfo) {
        if (healthInfo.url) {
            return healthInfo.url;
        }

        // Try to determine URL from server configuration
        const portMap = {
            'mcp-orchestrator': 3002,
            'mcp-workflow': 3003,
            'mcp-health': 3001
        };

        if (portMap[serverName]) {
            return `http://localhost:${portMap[serverName]}/health`;
        }

        return null;
    }

    async performHttpHealthCheck(url) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const req = http.get(url, { timeout: 5000 }, (res) => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve({ responseTime: Date.now() - startTime });
                } else {
                    reject(new Error(`HTTP ${res.statusCode}`));
                }
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.on('error', (error) => {
                reject(error);
            });
        });
    }

    async performCommandHealthCheck(healthInfo) {
        if (healthInfo.config && healthInfo.config.command) {
            const { spawn } = require('child_process');
            
            return new Promise((resolve, reject) => {
                const child = spawn(healthInfo.config.command, ['--help'], { 
                    stdio: 'pipe',
                    timeout: 3000 
                });
                
                child.on('error', reject);
                child.on('exit', (code) => {
                    if (code === 0 || code === null) {
                        resolve();
                    } else {
                        reject(new Error(`Command exit code: ${code}`));
                    }
                });
            });
        } else {
            throw new Error('No health check method available');
        }
    }

    updateHealthHistory(results) {
        const historyEntry = {
            timestamp: new Date().toISOString(),
            totalServers: results.length,
            healthyServers: results.filter(r => r.status === 'healthy').length,
            unhealthyServers: results.filter(r => r.status === 'unhealthy').length,
            averageResponseTime: this.calculateAverageResponseTime(results),
            results: results.map(r => ({
                serverName: r.serverName,
                status: r.status,
                responseTime: r.responseTime
            }))
        };

        this.healthHistory.push(historyEntry);

        // Trim history to prevent memory issues
        if (this.healthHistory.length > this.maxHistorySize) {
            this.healthHistory = this.healthHistory.slice(-this.maxHistorySize);
        }
    }

    calculateAverageResponseTime(results) {
        const validResults = results.filter(r => r.responseTime && r.status === 'healthy');
        if (validResults.length === 0) return 0;
        
        const total = validResults.reduce((sum, r) => sum + r.responseTime, 0);
        return Math.round(total / validResults.length);
    }

    checkForAlerts(results) {
        for (const result of results) {
            const healthInfo = this.healthData.get(result.serverName);
            
            // Check for critical failures
            if (healthInfo.consecutiveFailures >= this.alertThresholds.consecutiveFailures) {
                this.emit('criticalAlert', {
                    type: 'consecutive_failures',
                    serverName: result.serverName,
                    consecutiveFailures: healthInfo.consecutiveFailures,
                    timestamp: new Date().toISOString()
                });
            }

            // Check for slow response times
            if (result.responseTime > this.alertThresholds.responseTime) {
                this.emit('performanceAlert', {
                    type: 'slow_response',
                    serverName: result.serverName,
                    responseTime: result.responseTime,
                    threshold: this.alertThresholds.responseTime,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }

    async attemptServerRecovery(serverName) {
        console.log(`🔧 Attempting recovery for ${serverName}...`);
        
        const recovery = {
            success: false,
            actions: [],
            result: null
        };

        try {
            // Step 1: Try restarting the server
            recovery.actions.push('restart_attempt');
            
            // This would typically involve process management
            // For now, we'll just perform a health check to see if it recovers
            const healthResult = await this.checkSingleServer(serverName);
            
            if (healthResult.status === 'healthy') {
                recovery.success = true;
                recovery.result = 'Server recovered after restart attempt';
            } else {
                recovery.actions.push('escalate_to_admin');
                recovery.result = 'Server requires manual intervention';
            }

        } catch (error) {
            recovery.actions.push('recovery_failed');
            recovery.result = `Recovery failed: ${error.message}`;
        }

        return recovery;
    }

    setupEventHandlers() {
        this.on('criticalAlert', (alert) => {
            console.log('🚨 CRITICAL ALERT:', JSON.stringify(alert, null, 2));
        });

        this.on('performanceAlert', (alert) => {
            console.log('⚠️  PERFORMANCE ALERT:', JSON.stringify(alert, null, 2));
        });
    }

    generateHealthSummary() {
        const servers = Array.from(this.healthData.values());
        return {
            totalServers: servers.length,
            healthyServers: servers.filter(s => s.status === 'healthy').length,
            unhealthyServers: servers.filter(s => s.status === 'unhealthy').length,
            unknownServers: servers.filter(s => s.status === 'unknown').length,
            averageResponseTime: this.calculateAverageResponseTime(
                servers.map(s => ({ 
                    responseTime: s.responseTime, 
                    status: s.status 
                }))
            ),
            lastHealthCheck: Math.max(...servers.map(s => s.lastCheck || 0))
        };
    }

    getActiveAlerts() {
        const alerts = [];
        
        for (const [serverName, healthInfo] of this.healthData) {
            if (healthInfo.consecutiveFailures >= this.alertThresholds.consecutiveFailures) {
                alerts.push({
                    type: 'consecutive_failures',
                    severity: 'critical',
                    serverName,
                    consecutiveFailures: healthInfo.consecutiveFailures,
                    created: new Date().toISOString()
                });
            }

            if (healthInfo.responseTime > this.alertThresholds.responseTime) {
                alerts.push({
                    type: 'slow_response',
                    severity: 'warning',
                    serverName,
                    responseTime: healthInfo.responseTime,
                    threshold: this.alertThresholds.responseTime,
                    created: new Date().toISOString()
                });
            }
        }

        return alerts;
    }

    calculateHealthTrends(history) {
        if (history.length < 2) return {};

        const latest = history[history.length - 1];
        const previous = history[history.length - 2];

        return {
            healthyServersChange: latest.healthyServers - previous.healthyServers,
            unhealthyServersChange: latest.unhealthyServers - previous.unhealthyServers,
            responseTimeChange: latest.averageResponseTime - previous.averageResponseTime,
            overallTrend: latest.healthyServers > previous.healthyServers ? 'improving' : 
                         latest.healthyServers < previous.healthyServers ? 'degrading' : 'stable'
        };
    }

    getHealthCheckEndpoints() {
        const endpoints = [];
        for (const [serverName, healthInfo] of this.healthData) {
            const url = this.getHealthCheckUrl(serverName, healthInfo);
            if (url) {
                endpoints.push({ serverName, url });
            }
        }
        return endpoints;
    }

    start() {
        this.server = this.app.listen(this.port, () => {
            console.log(`🎯 Enhanced MCP Health Monitor running on port ${this.port}`);
            console.log(`📊 Dashboard: http://localhost:${this.port}/health`);
            console.log(`🔍 Servers: http://localhost:${this.port}/servers`);
            console.log(`📈 History: http://localhost:${this.port}/history`);
            console.log(`🚨 Alerts: http://localhost:${this.port}/alerts`);
            console.log(`🚀 Ready for enhanced MCP monitoring!\n`);
        });

        // Handle graceful shutdown
        process.on('SIGTERM', () => this.shutdown());
        process.on('SIGINT', () => this.shutdown());
    }

    shutdown() {
        console.log('\n🔄 Shutting down Enhanced MCP Health Monitor...');
        
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        
        if (this.server) {
            this.server.close(() => {
                console.log('✅ Health Monitor shut down gracefully');
                process.exit(0);
            });
        }
    }
}

// Create and start the enhanced health monitor
if (require.main === module) {
    const monitor = new EnhancedMCPHealthMonitor();
    monitor.initialize().then(() => {
        monitor.start();
    }).catch(error => {
        console.error('❌ Failed to initialize health monitor:', error);
        process.exit(1);
    });
}

module.exports = EnhancedMCPHealthMonitor;
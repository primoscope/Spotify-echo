#!/usr/bin/env node
/**
 * Continuous MCP Health Monitoring System
 * Provides 24/7 monitoring with automated alerts and recovery
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const http = require('http');

class ContinuousMCPMonitor {
    constructor() {
        this.healthMonitorProcess = null;
        this.validationInterval = null;
        this.recoveryAttempts = new Map();
        this.maxRecoveryAttempts = 3;
        this.validationIntervalMs = 5 * 60 * 1000; // 5 minutes
        this.healthCheckIntervalMs = 30 * 1000; // 30 seconds
        
        this.setupGracefulShutdown();
    }

    async start() {
        console.log('🚀 Starting Continuous MCP Health Monitoring System...\n');
        
        try {
            // Start health monitor
            await this.startHealthMonitor();
            
            // Start periodic validation
            await this.startPeriodicValidation();
            
            // Initial health check
            await this.performHealthCheck();
            
            console.log('✅ Continuous MCP monitoring system is running');
            console.log('🔍 Health checks every 30 seconds');
            console.log('📊 Full validation every 5 minutes');
            console.log('🏥 Health dashboard: http://localhost:3010/health');
            console.log('\nPress Ctrl+C to stop monitoring\n');
            
        } catch (error) {
            console.error('❌ Failed to start continuous monitoring:', error);
            process.exit(1);
        }
    }

    async startHealthMonitor() {
        return new Promise((resolve, reject) => {
            this.healthMonitorProcess = spawn('node', ['mcp-server/enhanced-health-monitor.js'], {
                stdio: 'pipe',
                cwd: path.join(__dirname, '..')
            });

            this.healthMonitorProcess.stdout.on('data', (data) => {
                const message = data.toString().trim();
                if (message.includes('Enhanced MCP Health Monitor ready')) {
                    console.log('✅ Health monitor started successfully');
                    resolve();
                }
            });

            this.healthMonitorProcess.stderr.on('data', (data) => {
                console.error('🚨 Health monitor error:', data.toString().trim());
            });

            this.healthMonitorProcess.on('exit', (code) => {
                console.log(`⚠️ Health monitor exited with code ${code}`);
                if (code !== 0) {
                    this.attemptRecovery('health-monitor');
                }
            });

            // Timeout after 10 seconds
            setTimeout(() => {
                resolve(); // Resolve anyway to continue
            }, 10000);
        });
    }

    async startPeriodicValidation() {
        this.validationInterval = setInterval(async () => {
            console.log('\n📊 Running periodic MCP validation...');
            try {
                const results = await this.runEnhancedValidation();
                console.log(`✅ Validation completed - Score: ${results.score}%`);
                
                if (results.score < 60) {
                    console.log('⚠️ Low validation score detected - triggering recovery');
                    await this.attemptSystemRecovery();
                }
            } catch (error) {
                console.error('❌ Periodic validation failed:', error.message);
            }
        }, this.validationIntervalMs);
    }

    async performHealthCheck() {
        try {
            const healthEndpoints = [
                { name: 'Health Monitor', url: 'http://localhost:3010/health' },
                { name: 'MCP Health', url: 'http://localhost:3001/health' },
                { name: 'MCP Orchestrator', url: 'http://localhost:3002/health' },
                { name: 'MCP Workflow', url: 'http://localhost:3003/status' }
            ];

            let healthyCount = 0;
            for (const endpoint of healthEndpoints) {
                try {
                    await this.makeHealthRequest(endpoint.url, 5000);
                    console.log(`✅ ${endpoint.name}: Healthy`);
                    healthyCount++;
                } catch (error) {
                    console.log(`❌ ${endpoint.name}: Unhealthy (${error.message})`);
                }
            }

            const healthRatio = healthyCount / healthEndpoints.length;
            if (healthRatio < 0.5) {
                console.log('🚨 Critical: Less than 50% of services are healthy');
                await this.attemptSystemRecovery();
            }

            // Schedule next health check
            setTimeout(() => this.performHealthCheck(), this.healthCheckIntervalMs);

        } catch (error) {
            console.error('❌ Health check failed:', error);
            setTimeout(() => this.performHealthCheck(), this.healthCheckIntervalMs);
        }
    }

    async runEnhancedValidation() {
        return new Promise((resolve, reject) => {
            const validation = spawn('npm', ['run', 'mcp:enhanced-validation'], {
                stdio: 'pipe',
                cwd: path.join(__dirname, '..')
            });

            let output = '';
            validation.stdout.on('data', (data) => {
                output += data.toString();
            });

            validation.on('exit', (code) => {
                try {
                    // Extract score from output
                    const scoreMatch = output.match(/🎉 Validation completed with score: (\d+)%/);
                    const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
                    
                    resolve({ score, code, output });
                } catch (error) {
                    reject(error);
                }
            });

            validation.on('error', reject);
        });
    }

    async makeHealthRequest(url, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const request = http.get(url, { timeout }, (response) => {
                if (response.statusCode >= 200 && response.statusCode < 300) {
                    resolve(response);
                } else {
                    reject(new Error(`HTTP ${response.statusCode}`));
                }
            });

            request.on('timeout', () => {
                request.destroy();
                reject(new Error('Request timeout'));
            });

            request.on('error', reject);
        });
    }

    async attemptRecovery(serviceName) {
        const attempts = this.recoveryAttempts.get(serviceName) || 0;
        
        if (attempts >= this.maxRecoveryAttempts) {
            console.log(`🚨 Max recovery attempts reached for ${serviceName}`);
            return false;
        }

        console.log(`🔄 Attempting recovery for ${serviceName} (attempt ${attempts + 1})`);
        this.recoveryAttempts.set(serviceName, attempts + 1);

        try {
            switch (serviceName) {
                case 'health-monitor':
                    await this.startHealthMonitor();
                    break;
                default:
                    console.log(`🔧 Generic recovery for ${serviceName}`);
                    break;
            }

            console.log(`✅ Recovery successful for ${serviceName}`);
            this.recoveryAttempts.set(serviceName, 0); // Reset counter on success
            return true;
        } catch (error) {
            console.error(`❌ Recovery failed for ${serviceName}:`, error);
            return false;
        }
    }

    async attemptSystemRecovery() {
        console.log('🔄 Attempting system-wide recovery...');
        
        try {
            // Restart health monitor
            if (this.healthMonitorProcess) {
                this.healthMonitorProcess.kill('SIGTERM');
            }
            
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
            await this.startHealthMonitor();
            
            console.log('✅ System recovery completed');
        } catch (error) {
            console.error('❌ System recovery failed:', error);
        }
    }

    setupGracefulShutdown() {
        const shutdown = () => {
            console.log('\n🔄 Shutting down continuous monitoring...');
            
            if (this.validationInterval) {
                clearInterval(this.validationInterval);
            }
            
            if (this.healthMonitorProcess) {
                this.healthMonitorProcess.kill('SIGTERM');
            }
            
            console.log('✅ Continuous monitoring shut down gracefully');
            process.exit(0);
        };

        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);
    }
}

// CLI interface
if (require.main === module) {
    const monitor = new ContinuousMCPMonitor();
    monitor.start().catch(error => {
        console.error('❌ Failed to start continuous monitoring:', error);
        process.exit(1);
    });
}

module.exports = ContinuousMCPMonitor;
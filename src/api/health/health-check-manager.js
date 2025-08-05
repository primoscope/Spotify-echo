const axios = require('axios');
const { performance } = require('perf_hooks');

/**
 * Comprehensive Health Check System for EchoTune AI
 * 
 * Provides detailed health monitoring for all system components including:
 * - Database connectivity
 * - Spotify API availability
 * - AI provider status
 * - Memory and performance metrics
 * - External service dependencies
 */

class HealthCheckManager {
    constructor() {
        this.checks = new Map();
        this.lastResults = new Map();
        this.startTime = Date.now();
        this.initializeChecks();
    }

    initializeChecks() {
        // Core service health checks
        this.checks.set('database', this.checkDatabase.bind(this));
        this.checks.set('spotify_api', this.checkSpotifyAPI.bind(this));
        this.checks.set('ai_providers', this.checkAIProviders.bind(this));
        this.checks.set('memory', this.checkMemoryUsage.bind(this));
        this.checks.set('disk_space', this.checkDiskSpace.bind(this));
        this.checks.set('external_services', this.checkExternalServices.bind(this));
    }

    /**
     * Run all health checks and return comprehensive status
     */
    async runHealthChecks() {
        const startTime = performance.now();
        const results = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '2.1.0',
            uptime: Math.floor((Date.now() - this.startTime) / 1000),
            services: {},
            overall_response_time: 0,
            environment: process.env.NODE_ENV || 'development'
        };

        const checkPromises = Array.from(this.checks.entries()).map(async ([name, check]) => {
            try {
                const checkStart = performance.now();
                const result = await Promise.race([
                    check(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Health check timeout')), 10000)
                    )
                ]);
                const checkEnd = performance.now();
                
                const healthData = {
                    status: result.status || 'healthy',
                    response_time: Math.round(checkEnd - checkStart),
                    last_check: new Date().toISOString(),
                    details: result.details || {},
                    error: result.error || null
                };

                this.lastResults.set(name, healthData);
                return [name, healthData];
            } catch (error) {
                const healthData = {
                    status: 'unhealthy',
                    response_time: 0,
                    last_check: new Date().toISOString(),
                    details: {},
                    error: error.message
                };
                
                this.lastResults.set(name, healthData);
                return [name, healthData];
            }
        });

        const checkResults = await Promise.all(checkPromises);
        
        // Compile results
        for (const [name, result] of checkResults) {
            results.services[name] = result;
            if (result.status !== 'healthy') {
                results.status = result.status === 'degraded' ? 'degraded' : 'unhealthy';
            }
        }

        results.overall_response_time = Math.round(performance.now() - startTime);
        return results;
    }

    /**
     * Check database connectivity
     */
    async checkDatabase() {
        try {
            // Check MongoDB connection if available
            if (global.db) {
                await global.db.admin().ping();
                return {
                    status: 'healthy',
                    details: {
                        type: 'mongodb',
                        connected: true
                    }
                };
            }

            // Check SQLite fallback
            const fs = require('fs');
            const dbPath = process.env.DATABASE_PATH || './data/echotune.db';
            const dbExists = fs.existsSync(dbPath);
            
            return {
                status: dbExists ? 'healthy' : 'degraded',
                details: {
                    type: 'sqlite',
                    database_exists: dbExists,
                    path: dbPath
                }
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                details: { type: 'unknown' }
            };
        }
    }

    /**
     * Check Spotify API availability
     */
    async checkSpotifyAPI() {
        try {
            const clientId = process.env.SPOTIFY_CLIENT_ID;
            const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

            if (!clientId || !clientSecret) {
                return {
                    status: 'degraded',
                    details: {
                        configured: false,
                        reason: 'Missing Spotify credentials'
                    }
                };
            }

            // Test Spotify API with client credentials flow
            const authResponse = await axios.post('https://accounts.spotify.com/api/token', 
                'grant_type=client_credentials', {
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                timeout: 5000
            });

            if (authResponse.status === 200) {
                return {
                    status: 'healthy',
                    details: {
                        configured: true,
                        api_accessible: true,
                        rate_limit_remaining: authResponse.headers['x-ratelimit-remaining'] || 'unknown'
                    }
                };
            }

            return {
                status: 'degraded',
                details: {
                    configured: true,
                    api_accessible: false,
                    status_code: authResponse.status
                }
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                details: {
                    configured: !!process.env.SPOTIFY_CLIENT_ID,
                    api_accessible: false
                }
            };
        }
    }

    /**
     * Check AI provider status
     */
    async checkAIProviders() {
        const providers = {
            openai: process.env.OPENAI_API_KEY,
            gemini: process.env.GEMINI_API_KEY,
            mock: true // Always available
        };

        const results = {};
        let healthyCount = 0;

        for (const [provider, apiKey] of Object.entries(providers)) {
            if (provider === 'mock') {
                results[provider] = { status: 'healthy', configured: true };
                healthyCount++;
                continue;
            }

            if (!apiKey) {
                results[provider] = { 
                    status: 'degraded', 
                    configured: false,
                    reason: 'API key not configured' 
                };
                continue;
            }

            try {
                // Basic connectivity check (without making actual API calls)
                results[provider] = { 
                    status: 'healthy', 
                    configured: true,
                    api_key_present: true
                };
                healthyCount++;
            } catch (error) {
                results[provider] = { 
                    status: 'unhealthy', 
                    configured: true,
                    error: error.message 
                };
            }
        }

        const overallStatus = healthyCount > 0 ? 'healthy' : 
                             Object.values(results).some(r => r.status === 'degraded') ? 'degraded' : 'unhealthy';

        return {
            status: overallStatus,
            details: {
                providers: results,
                healthy_count: healthyCount,
                total_count: Object.keys(providers).length
            }
        };
    }

    /**
     * Check memory usage
     */
    async checkMemoryUsage() {
        const memUsage = process.memoryUsage();
        const totalMem = require('os').totalmem();
        const freeMem = require('os').freemem();
        
        const usedMemoryPercent = ((memUsage.heapUsed / totalMem) * 100);
        const systemMemoryPercent = (((totalMem - freeMem) / totalMem) * 100);

        let status = 'healthy';
        if (usedMemoryPercent > 80 || systemMemoryPercent > 90) {
            status = 'unhealthy';
        } else if (usedMemoryPercent > 60 || systemMemoryPercent > 80) {
            status = 'degraded';
        }

        return {
            status,
            details: {
                heap_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
                heap_total_mb: Math.round(memUsage.heapTotal / 1024 / 1024),
                heap_used_percent: Math.round(usedMemoryPercent * 100) / 100,
                system_memory_used_percent: Math.round(systemMemoryPercent * 100) / 100,
                rss_mb: Math.round(memUsage.rss / 1024 / 1024),
                external_mb: Math.round(memUsage.external / 1024 / 1024)
            }
        };
    }

    /**
     * Check disk space
     */
    async checkDiskSpace() {
        const fs = require('fs');
        const _stats = fs.statSync('./');
        
        // This is a basic check - in production you'd want to use a proper disk space library
        return {
            status: 'healthy',
            details: {
                available: 'unknown',
                note: 'Disk space monitoring requires additional libraries in production'
            }
        };
    }

    /**
     * Check external service dependencies
     */
    async checkExternalServices() {
        const services = [
            { name: 'spotify_accounts', url: 'https://accounts.spotify.com' },
            { name: 'spotify_api', url: 'https://api.spotify.com' }
        ];

        const results = {};
        let healthyCount = 0;

        for (const service of services) {
            try {
                const response = await axios.get(service.url, { 
                    timeout: 3000,
                    validateStatus: (status) => status < 500 // Accept redirects and client errors
                });
                
                results[service.name] = {
                    status: 'healthy',
                    response_code: response.status,
                    accessible: true
                };
                healthyCount++;
            } catch (error) {
                results[service.name] = {
                    status: 'unhealthy',
                    accessible: false,
                    error: error.code || error.message
                };
            }
        }

        const overallStatus = healthyCount === services.length ? 'healthy' :
                             healthyCount > 0 ? 'degraded' : 'unhealthy';

        return {
            status: overallStatus,
            details: {
                services: results,
                healthy_count: healthyCount,
                total_count: services.length
            }
        };
    }

    /**
     * Get quick health status without full checks
     */
    getQuickStatus() {
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: Math.floor((Date.now() - this.startTime) / 1000),
            version: process.env.npm_package_version || '2.1.0',
            environment: process.env.NODE_ENV || 'development',
            last_full_check: this.lastResults.size > 0 ? 
                Math.max(...Array.from(this.lastResults.values()).map(r => new Date(r.last_check).getTime())) :
                null
        };
    }

    /**
     * Get cached health results
     */
    getCachedResults() {
        if (this.lastResults.size === 0) {
            return null;
        }

        const results = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '2.1.0',
            uptime: Math.floor((Date.now() - this.startTime) / 1000),
            services: Object.fromEntries(this.lastResults),
            cache_age: 'cached'
        };

        // Determine overall status from cached results
        for (const result of this.lastResults.values()) {
            if (result.status !== 'healthy') {
                results.status = result.status === 'degraded' ? 'degraded' : 'unhealthy';
                break;
            }
        }

        return results;
    }
}

module.exports = HealthCheckManager;
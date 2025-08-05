const express = require('express');
const HealthCheckManager = require('./health-check-manager');

const router = express.Router();
const healthManager = new HealthCheckManager();

/**
 * Enhanced Health Check Routes for EchoTune AI
 * 
 * Provides multiple health check endpoints:
 * - Quick status for load balancers
 * - Detailed health checks for monitoring
 * - Cached results for performance
 * - Component-specific health checks
 */

/**
 * Quick health check endpoint
 * Returns immediately with basic status - ideal for load balancers
 */
router.get('/health', (req, res) => {
    const quickStatus = healthManager.getQuickStatus();
    res.status(200).json(quickStatus);
});

/**
 * Detailed health check endpoint
 * Runs comprehensive health checks on all system components
 * Use ?cached=true for cached results
 */
router.get('/health/detailed', async (req, res) => {
    try {
        const useCached = req.query.cached === 'true';
        
        let healthData;
        if (useCached) {
            healthData = healthManager.getCachedResults();
            if (!healthData) {
                healthData = await healthManager.runHealthChecks();
            }
        } else {
            healthData = await healthManager.runHealthChecks();
        }

        const statusCode = healthData.status === 'healthy' ? 200 :
                          healthData.status === 'degraded' ? 200 : 503;

        res.status(statusCode).json(healthData);
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: 'Health check system error',
            timestamp: new Date().toISOString(),
            details: error.message
        });
    }
});

/**
 * Ready endpoint for Kubernetes readiness probes
 */
router.get('/health/ready', async (req, res) => {
    try {
        const healthData = await healthManager.runHealthChecks();
        
        // System is ready if core services are healthy
        const coreServices = ['database', 'spotify_api'];
        const isReady = coreServices.every(service => 
            healthData.services[service]?.status === 'healthy'
        );

        if (isReady) {
            res.status(200).json({
                status: 'ready',
                timestamp: new Date().toISOString(),
                core_services: coreServices.map(service => ({
                    name: service,
                    status: healthData.services[service]?.status
                }))
            });
        } else {
            res.status(503).json({
                status: 'not_ready',
                timestamp: new Date().toISOString(),
                core_services: coreServices.map(service => ({
                    name: service,
                    status: healthData.services[service]?.status || 'unknown'
                }))
            });
        }
    } catch (error) {
        res.status(503).json({
            status: 'not_ready',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * Live endpoint for Kubernetes liveness probes
 */
router.get('/health/live', (req, res) => {
    // Simple liveness check - if we can respond, we're alive
    res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        pid: process.pid
    });
});

/**
 * Database-specific health check
 */
router.get('/health/database', async (req, res) => {
    try {
        const dbHealth = await healthManager.checks.get('database')();
        const statusCode = dbHealth.status === 'healthy' ? 200 : 503;
        
        res.status(statusCode).json({
            component: 'database',
            ...dbHealth,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({
            component: 'database',
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * Spotify API-specific health check
 */
router.get('/health/spotify', async (req, res) => {
    try {
        const spotifyHealth = await healthManager.checks.get('spotify_api')();
        const statusCode = spotifyHealth.status === 'healthy' ? 200 : 503;
        
        res.status(statusCode).json({
            component: 'spotify_api',
            ...spotifyHealth,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({
            component: 'spotify_api',
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * AI providers health check
 */
router.get('/health/ai', async (req, res) => {
    try {
        const aiHealth = await healthManager.checks.get('ai_providers')();
        const statusCode = aiHealth.status === 'healthy' ? 200 : 503;
        
        res.status(statusCode).json({
            component: 'ai_providers',
            ...aiHealth,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({
            component: 'ai_providers',
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * System metrics endpoint
 */
router.get('/health/metrics', async (req, res) => {
    try {
        const memoryHealth = await healthManager.checks.get('memory')();
        const diskHealth = await healthManager.checks.get('disk_space')();
        
        res.status(200).json({
            timestamp: new Date().toISOString(),
            metrics: {
                memory: memoryHealth.details,
                disk: diskHealth.details,
                process: {
                    uptime: process.uptime(),
                    pid: process.pid,
                    version: process.version,
                    platform: process.platform,
                    arch: process.arch
                },
                system: {
                    load_average: require('os').loadavg(),
                    cpu_count: require('os').cpus().length,
                    hostname: require('os').hostname()
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to collect metrics',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * Health check configuration endpoint
 */
router.get('/health/config', (req, res) => {
    res.status(200).json({
        version: process.env.npm_package_version || '2.1.0',
        environment: process.env.NODE_ENV || 'development',
        endpoints: [
            { path: '/health', description: 'Quick health status' },
            { path: '/health/detailed', description: 'Comprehensive health check' },
            { path: '/health/ready', description: 'Kubernetes readiness probe' },
            { path: '/health/live', description: 'Kubernetes liveness probe' },
            { path: '/health/database', description: 'Database connectivity' },
            { path: '/health/spotify', description: 'Spotify API status' },
            { path: '/health/ai', description: 'AI providers status' },
            { path: '/health/metrics', description: 'System metrics' }
        ],
        configuration: {
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            node_version: process.version,
            startup_time: new Date(Date.now() - process.uptime() * 1000).toISOString()
        }
    });
});

module.exports = router;
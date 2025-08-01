#!/usr/bin/env node

/**
 * EchoTune AI - Main Entry Point
 * Production-ready music recommendation chatbot with Spotify integration
 */

require('./server');
// Enhanced Health Check Integration
const { performHealthCheck, isReady, isAlive, runCheck } = require('./utils/health-check');

// Comprehensive health check endpoint
app.get('/health', async (req, res) => {
    try {
        const healthResult = await performHealthCheck();
        const statusCode = healthResult.status === 'healthy' ? 200 : 503;
        res.status(statusCode).json(healthResult);
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Health check failed',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Individual component health checks
app.get('/health/:component', async (req, res) => {
    try {
        const component = req.params.component;
        const result = await runCheck(component);
        const statusCode = result.status === 'healthy' ? 200 : 503;
        res.status(statusCode).json(result);
    } catch (error) {
        res.status(404).json({
            status: 'error',
            message: `Unknown health check component: ${req.params.component}`,
            timestamp: new Date().toISOString()
        });
    }
});

// Readiness probe for load balancers
app.get('/ready', async (req, res) => {
    try {
        const ready = await isReady();
        res.status(ready ? 200 : 503).json({
            status: ready ? 'ready' : 'not ready',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({
            status: 'not ready',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Liveness probe
app.get('/alive', async (req, res) => {
    try {
        const alive = await isAlive();
        res.status(alive ? 200 : 503).json({
            status: alive ? 'alive' : 'dead',
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({
            status: 'dead',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

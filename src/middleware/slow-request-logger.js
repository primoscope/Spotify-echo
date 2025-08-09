/**
 * Slow Request Logger and Performance Monitoring Middleware
 * Tracks request durations and logs slow requests with configurable thresholds
 */

const fs = require('fs');
const path = require('path');

class SlowRequestLogger {
    constructor(options = {}) {
        this.thresholds = {
            slow: options.slowThreshold || 1000,      // 1 second
            verySlow: options.verySlowThreshold || 5000, // 5 seconds
            critical: options.criticalThreshold || 10000  // 10 seconds
        };
        
        this.enableLogging = options.enableLogging !== false;
        this.logToFile = options.logToFile || false;
        this.logFilePath = options.logFilePath || path.join(process.cwd(), 'logs', 'slow-requests.log');
        this.aggregateMetrics = options.aggregateMetrics !== false;
        
        // Metrics aggregation
        this.metrics = {
            totalRequests: 0,
            slowRequests: 0,
            verySlowRequests: 0,
            criticalRequests: 0,
            totalResponseTime: 0,
            averageResponseTime: 0,
            p95ResponseTime: 0,
            p99ResponseTime: 0,
            responseTimes: [],
            slowestRequests: [],
            routeMetrics: new Map(),
            hourlyMetrics: new Map(),
            startTime: Date.now()
        };
        
        // Ensure log directory exists if file logging is enabled
        if (this.logToFile) {
            this.ensureLogDirectory();
        }
        
        // Clean up old response times periodically (keep last 1000 for percentile calculation)
        this.cleanupInterval = setInterval(() => {
            if (this.metrics.responseTimes.length > 1000) {
                this.metrics.responseTimes = this.metrics.responseTimes.slice(-1000);
            }
            
            // Keep only top 10 slowest requests
            if (this.metrics.slowestRequests.length > 10) {
                this.metrics.slowestRequests = this.metrics.slowestRequests
                    .sort((a, b) => b.duration - a.duration)
                    .slice(0, 10);
            }
        }, 60000); // Every minute
    }

    /**
     * Ensure log directory exists
     */
    ensureLogDirectory() {
        const logDir = path.dirname(this.logFilePath);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }

    /**
     * Log slow request to file
     */
    logToFileSystem(logEntry) {
        if (!this.logToFile) return;
        
        try {
            const logLine = JSON.stringify(logEntry) + '\n';
            fs.appendFileSync(this.logFilePath, logLine);
        } catch (error) {
            console.error('Failed to write to slow request log:', error);
        }
    }

    /**
     * Update route-specific metrics
     */
    updateRouteMetrics(route, method, duration, statusCode) {
        const routeKey = `${method} ${route}`;
        
        if (!this.metrics.routeMetrics.has(routeKey)) {
            this.metrics.routeMetrics.set(routeKey, {
                count: 0,
                totalTime: 0,
                averageTime: 0,
                slowCount: 0,
                maxTime: 0,
                minTime: Infinity,
                errorCount: 0,
                lastAccessed: Date.now()
            });
        }
        
        const routeMetric = this.metrics.routeMetrics.get(routeKey);
        routeMetric.count++;
        routeMetric.totalTime += duration;
        routeMetric.averageTime = routeMetric.totalTime / routeMetric.count;
        routeMetric.maxTime = Math.max(routeMetric.maxTime, duration);
        routeMetric.minTime = Math.min(routeMetric.minTime, duration);
        routeMetric.lastAccessed = Date.now();
        
        if (duration >= this.thresholds.slow) {
            routeMetric.slowCount++;
        }
        
        if (statusCode >= 400) {
            routeMetric.errorCount++;
        }
    }

    /**
     * Update hourly metrics
     */
    updateHourlyMetrics(duration) {
        const hour = new Date().getHours();
        const hourKey = `hour_${hour}`;
        
        if (!this.metrics.hourlyMetrics.has(hourKey)) {
            this.metrics.hourlyMetrics.set(hourKey, {
                requests: 0,
                totalTime: 0,
                averageTime: 0,
                slowRequests: 0
            });
        }
        
        const hourMetric = this.metrics.hourlyMetrics.get(hourKey);
        hourMetric.requests++;
        hourMetric.totalTime += duration;
        hourMetric.averageTime = hourMetric.totalTime / hourMetric.requests;
        
        if (duration >= this.thresholds.slow) {
            hourMetric.slowRequests++;
        }
    }

    /**
     * Calculate percentiles from response times
     */
    calculatePercentiles() {
        if (this.metrics.responseTimes.length === 0) {
            return { p95: 0, p99: 0 };
        }
        
        const sorted = [...this.metrics.responseTimes].sort((a, b) => a - b);
        const p95Index = Math.floor(sorted.length * 0.95);
        const p99Index = Math.floor(sorted.length * 0.99);
        
        return {
            p95: sorted[p95Index] || 0,
            p99: sorted[p99Index] || 0
        };
    }

    /**
     * Create Express middleware
     */
    createMiddleware() {
        return (req, res, next) => {
            const startTime = Date.now();
            const startHrTime = process.hrtime.bigint();
            
            // Store start time on request for potential use by other middleware
            req.startTime = startTime;
            
            // Override res.end to capture response time
            const originalEnd = res.end;
            res.end = (...args) => {
                const endTime = Date.now();
                const endHrTime = process.hrtime.bigint();
                const duration = endTime - startTime;
                const preciseMs = Number(endHrTime - startHrTime) / 1000000; // Convert nanoseconds to milliseconds
                
                // Update metrics
                this.updateMetrics(req, res, duration, preciseMs);
                
                // Call original end
                originalEnd.apply(res, args);
            };
            
            next();
        };
    }

    /**
     * Update all metrics for a request
     */
    updateMetrics(req, res, duration, preciseMs) {
        const { method, originalUrl, route, ip, get } = req;
        const { statusCode } = res;
        const userAgent = get('user-agent') || 'Unknown';
        const routePath = route?.path || originalUrl || 'unknown';
        
        // Update global metrics
        this.metrics.totalRequests++;
        this.metrics.totalResponseTime += duration;
        this.metrics.averageResponseTime = this.metrics.totalResponseTime / this.metrics.totalRequests;
        this.metrics.responseTimes.push(duration);
        
        // Calculate percentiles
        const percentiles = this.calculatePercentiles();
        this.metrics.p95ResponseTime = percentiles.p95;
        this.metrics.p99ResponseTime = percentiles.p99;
        
        // Update route and hourly metrics
        this.updateRouteMetrics(routePath, method, duration, statusCode);
        this.updateHourlyMetrics(duration);
        
        // Determine if request is slow
        const isSlowRequest = duration >= this.thresholds.slow;
        const isVerySlowRequest = duration >= this.thresholds.verySlow;
        const isCriticalRequest = duration >= this.thresholds.critical;
        
        if (isSlowRequest) {
            this.metrics.slowRequests++;
            
            if (isVerySlowRequest) {
                this.metrics.verySlowRequests++;
            }
            
            if (isCriticalRequest) {
                this.metrics.criticalRequests++;
            }
            
            // Create detailed log entry for slow requests
            const logEntry = {
                timestamp: new Date().toISOString(),
                level: isCriticalRequest ? 'critical' : isVerySlowRequest ? 'very-slow' : 'slow',
                duration: Math.round(preciseMs * 100) / 100, // Round to 2 decimal places
                method,
                url: originalUrl,
                route: routePath,
                statusCode,
                ip,
                userAgent,
                threshold: isCriticalRequest ? 'critical' : isVerySlowRequest ? 'very-slow' : 'slow',
                requestId: req.id || req.requestId || 'unknown'
            };
            
            // Log to console
            if (this.enableLogging) {
                const emoji = isCriticalRequest ? '🚨' : isVerySlowRequest ? '⚠️' : '🐌';
                console.warn(
                    `${emoji} Slow Request [${logEntry.level.toUpperCase()}]: ` +
                    `${method} ${originalUrl} - ${duration}ms - Status: ${statusCode} - IP: ${ip}`
                );
            }
            
            // Log to file
            this.logToFileSystem(logEntry);
            
            // Add to slowest requests tracking
            this.metrics.slowestRequests.push({
                ...logEntry,
                duration: Math.round(preciseMs * 100) / 100
            });
        }
    }

    /**
     * Get current performance metrics
     */
    getMetrics() {
        const percentiles = this.calculatePercentiles();
        const uptime = Date.now() - this.metrics.startTime;
        
        return {
            summary: {
                totalRequests: this.metrics.totalRequests,
                slowRequests: this.metrics.slowRequests,
                verySlowRequests: this.metrics.verySlowRequests,
                criticalRequests: this.metrics.criticalRequests,
                slowRequestPercentage: (this.metrics.slowRequests / this.metrics.totalRequests * 100) || 0,
                averageResponseTime: Math.round(this.metrics.averageResponseTime * 100) / 100,
                p95ResponseTime: Math.round(percentiles.p95 * 100) / 100,
                p99ResponseTime: Math.round(percentiles.p99 * 100) / 100,
                uptime: uptime,
                requestsPerSecond: (this.metrics.totalRequests / (uptime / 1000)) || 0
            },
            thresholds: this.thresholds,
            routeMetrics: Object.fromEntries(this.metrics.routeMetrics),
            hourlyMetrics: Object.fromEntries(this.metrics.hourlyMetrics),
            slowestRequests: this.metrics.slowestRequests.slice(0, 10),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Generate performance report
     */
    generateReport() {
        const metrics = this.getMetrics();
        const report = {
            ...metrics,
            report: {
                title: 'EchoTune AI Performance Report',
                generatedAt: new Date().toISOString(),
                period: `${Math.round((Date.now() - this.metrics.startTime) / 1000 / 60)} minutes`,
                status: this.getPerformanceStatus(metrics.summary)
            }
        };
        
        return report;
    }

    /**
     * Determine performance status based on metrics
     */
    getPerformanceStatus(summary) {
        if (summary.criticalRequests > 0) {
            return 'critical';
        } else if (summary.verySlowRequests > summary.totalRequests * 0.05) { // More than 5% very slow
            return 'warning';
        } else if (summary.slowRequestPercentage > 20) { // More than 20% slow
            return 'degraded';
        } else if (summary.averageResponseTime > 500) { // Average > 500ms
            return 'warning';
        } else {
            return 'good';
        }
    }

    /**
     * Reset metrics (useful for testing)
     */
    resetMetrics() {
        this.metrics = {
            totalRequests: 0,
            slowRequests: 0,
            verySlowRequests: 0,
            criticalRequests: 0,
            totalResponseTime: 0,
            averageResponseTime: 0,
            p95ResponseTime: 0,
            p99ResponseTime: 0,
            responseTimes: [],
            slowestRequests: [],
            routeMetrics: new Map(),
            hourlyMetrics: new Map(),
            startTime: Date.now()
        };
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
    }
}

// Create singleton instance
const slowRequestLogger = new SlowRequestLogger({
    slowThreshold: parseInt(process.env.SLOW_REQUEST_THRESHOLD) || 1000,
    verySlowThreshold: parseInt(process.env.VERY_SLOW_REQUEST_THRESHOLD) || 5000,
    criticalThreshold: parseInt(process.env.CRITICAL_REQUEST_THRESHOLD) || 10000,
    enableLogging: process.env.ENABLE_SLOW_REQUEST_LOGGING !== 'false',
    logToFile: process.env.LOG_SLOW_REQUESTS_TO_FILE === 'true',
    logFilePath: process.env.SLOW_REQUEST_LOG_PATH || path.join(process.cwd(), 'logs', 'slow-requests.log')
});

module.exports = {
    SlowRequestLogger,
    slowRequestLogger,
    middleware: slowRequestLogger.createMiddleware(),
    getMetrics: () => slowRequestLogger.getMetrics(),
    generateReport: () => slowRequestLogger.generateReport(),
    resetMetrics: () => slowRequestLogger.resetMetrics()
};
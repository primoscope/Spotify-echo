const { performance } = require('perf_hooks');
const os = require('os');

/**
 * Performance Monitoring System for EchoTune AI
 * 
 * Provides comprehensive performance tracking:
 * - Request response times
 * - API endpoint performance
 * - System resource usage
 * - Database query performance
 * - Error rate monitoring
 * - Custom metrics collection
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            requests: {
                total: 0,
                by_endpoint: new Map(),
                by_method: new Map(),
                response_times: [],
                errors: 0,
                status_codes: new Map()
            },
            system: {
                startup_time: Date.now(),
                cpu_usage: [],
                memory_usage: [],
                load_average: []
            },
            custom: new Map()
        };

        this.activeRequests = new Map();
        this.intervals = [];
        
        this.startSystemMonitoring();
    }

    /**
     * Start system resource monitoring
     */
    startSystemMonitoring() {
        // Collect system metrics every 30 seconds
        const systemInterval = setInterval(() => {
            this.collectSystemMetrics();
        }, 30000);
        
        this.intervals.push(systemInterval);

        // Clean up old metrics every 5 minutes
        const cleanupInterval = setInterval(() => {
            this.cleanupOldMetrics();
        }, 300000);
        
        this.intervals.push(cleanupInterval);
    }

    /**
     * Middleware to track request performance
     */
    requestTracker() {
        return (req, res, next) => {
            const requestId = `${Date.now()}_${Math.random()}`;
            const startTime = performance.now();
            
            // Store request start time
            this.activeRequests.set(requestId, {
                start_time: startTime,
                endpoint: req.path,
                method: req.method,
                ip: req.ip || req.connection.remoteAddress
            });

            // Attach request ID to request object
            req.performanceId = requestId;

            // Override res.end to capture completion metrics
            const originalEnd = res.end;
            res.end = (...args) => {
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                this.recordRequestMetrics(req, res, duration);
                this.activeRequests.delete(requestId);
                
                originalEnd.apply(res, args);
            };

            next();
        };
    }

    /**
     * Record metrics for completed request
     */
    recordRequestMetrics(req, res, duration) {
        const endpoint = req.path;
        const method = req.method;
        const statusCode = res.statusCode;

        // Update total request count
        this.metrics.requests.total++;

        // Track by endpoint
        const endpointKey = `${method} ${endpoint}`;
        if (!this.metrics.requests.by_endpoint.has(endpointKey)) {
            this.metrics.requests.by_endpoint.set(endpointKey, {
                count: 0,
                total_time: 0,
                avg_time: 0,
                min_time: Infinity,
                max_time: 0,
                errors: 0
            });
        }

        const endpointStats = this.metrics.requests.by_endpoint.get(endpointKey);
        endpointStats.count++;
        endpointStats.total_time += duration;
        endpointStats.avg_time = endpointStats.total_time / endpointStats.count;
        endpointStats.min_time = Math.min(endpointStats.min_time, duration);
        endpointStats.max_time = Math.max(endpointStats.max_time, duration);

        if (statusCode >= 400) {
            endpointStats.errors++;
            this.metrics.requests.errors++;
        }

        // Track by method
        if (!this.metrics.requests.by_method.has(method)) {
            this.metrics.requests.by_method.set(method, 0);
        }
        this.metrics.requests.by_method.set(method, 
            this.metrics.requests.by_method.get(method) + 1
        );

        // Track status codes
        if (!this.metrics.requests.status_codes.has(statusCode)) {
            this.metrics.requests.status_codes.set(statusCode, 0);
        }
        this.metrics.requests.status_codes.set(statusCode,
            this.metrics.requests.status_codes.get(statusCode) + 1
        );

        // Keep response time history (last 1000 requests)
        this.metrics.requests.response_times.push({
            timestamp: Date.now(),
            duration: duration,
            endpoint: endpoint,
            status_code: statusCode
        });

        if (this.metrics.requests.response_times.length > 1000) {
            this.metrics.requests.response_times.shift();
        }
    }

    /**
     * Collect system performance metrics
     */
    collectSystemMetrics() {
        const now = Date.now();
        
        // CPU usage (simplified - in production use proper CPU monitoring)
        const loadAvg = os.loadavg();
        this.metrics.system.load_average.push({
            timestamp: now,
            load_1m: loadAvg[0],
            load_5m: loadAvg[1],
            load_15m: loadAvg[2]
        });

        // Memory usage
        const memUsage = process.memoryUsage();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        
        this.metrics.system.memory_usage.push({
            timestamp: now,
            heap_used: memUsage.heapUsed,
            heap_total: memUsage.heapTotal,
            rss: memUsage.rss,
            external: memUsage.external,
            system_total: totalMem,
            system_free: freeMem,
            system_used_percent: ((totalMem - freeMem) / totalMem) * 100
        });

        // Keep only last 100 measurements (about 50 minutes)
        if (this.metrics.system.load_average.length > 100) {
            this.metrics.system.load_average.shift();
        }
        if (this.metrics.system.memory_usage.length > 100) {
            this.metrics.system.memory_usage.shift();
        }
    }

    /**
     * Clean up old metrics to prevent memory leaks
     */
    cleanupOldMetrics() {
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        
        // Clean up response times older than 5 minutes
        this.metrics.requests.response_times = this.metrics.requests.response_times
            .filter(metric => metric.timestamp > fiveMinutesAgo);
    }

    /**
     * Record custom metric
     */
    recordCustomMetric(name, value, tags = {}) {
        if (!this.metrics.custom.has(name)) {
            this.metrics.custom.set(name, {
                count: 0,
                total: 0,
                avg: 0,
                min: Infinity,
                max: 0,
                history: []
            });
        }

        const metric = this.metrics.custom.get(name);
        metric.count++;
        metric.total += value;
        metric.avg = metric.total / metric.count;
        metric.min = Math.min(metric.min, value);
        metric.max = Math.max(metric.max, value);
        
        metric.history.push({
            timestamp: Date.now(),
            value: value,
            tags: tags
        });

        // Keep only last 100 measurements
        if (metric.history.length > 100) {
            metric.history.shift();
        }
    }

    /**
     * Track database query performance
     */
    trackDatabaseQuery(queryName, duration, success = true) {
        this.recordCustomMetric(`db_${queryName}`, duration, {
            type: 'database',
            success: success
        });
    }

    /**
     * Track Spotify API call performance
     */
    trackSpotifyAPI(endpoint, duration, success = true) {
        this.recordCustomMetric(`spotify_${endpoint}`, duration, {
            type: 'spotify_api',
            success: success
        });
    }

    /**
     * Track AI provider performance
     */
    trackAIProvider(provider, duration, success = true) {
        this.recordCustomMetric(`ai_${provider}`, duration, {
            type: 'ai_provider',
            success: success
        });
    }

    /**
     * Get comprehensive performance report
     */
    getPerformanceReport() {
        const now = Date.now();
        const uptime = now - this.metrics.system.startup_time;
        
        // Calculate request statistics
        const recentRequests = this.metrics.requests.response_times
            .filter(req => req.timestamp > now - (60 * 1000)); // Last minute
        
        const avgResponseTime = recentRequests.length > 0 
            ? recentRequests.reduce((sum, req) => sum + req.duration, 0) / recentRequests.length
            : 0;

        const errorRate = this.metrics.requests.total > 0
            ? (this.metrics.requests.errors / this.metrics.requests.total) * 100
            : 0;

        // Get latest system metrics
        const latestMemory = this.metrics.system.memory_usage.length > 0
            ? this.metrics.system.memory_usage[this.metrics.system.memory_usage.length - 1]
            : null;

        const latestLoad = this.metrics.system.load_average.length > 0
            ? this.metrics.system.load_average[this.metrics.system.load_average.length - 1]
            : null;

        return {
            timestamp: new Date().toISOString(),
            uptime_seconds: Math.floor(uptime / 1000),
            uptime_human: this.formatUptime(uptime),
            
            requests: {
                total: this.metrics.requests.total,
                errors: this.metrics.requests.errors,
                error_rate_percent: Math.round(errorRate * 100) / 100,
                avg_response_time_ms: Math.round(avgResponseTime * 100) / 100,
                requests_per_minute: recentRequests.length,
                active_requests: this.activeRequests.size
            },
            
            endpoints: this.getTopEndpoints(),
            
            system: {
                memory: latestMemory ? {
                    heap_used_mb: Math.round(latestMemory.heap_used / 1024 / 1024),
                    heap_total_mb: Math.round(latestMemory.heap_total / 1024 / 1024),
                    rss_mb: Math.round(latestMemory.rss / 1024 / 1024),
                    system_used_percent: Math.round(latestMemory.system_used_percent * 100) / 100
                } : null,
                
                load: latestLoad ? {
                    load_1m: Math.round(latestLoad.load_1m * 100) / 100,
                    load_5m: Math.round(latestLoad.load_5m * 100) / 100,
                    load_15m: Math.round(latestLoad.load_15m * 100) / 100
                } : null,
                
                process: {
                    pid: process.pid,
                    version: process.version,
                    platform: process.platform,
                    arch: process.arch
                }
            },
            
            custom_metrics: this.getCustomMetricsSummary()
        };
    }

    /**
     * Get top performing/problematic endpoints
     */
    getTopEndpoints() {
        const endpoints = Array.from(this.metrics.requests.by_endpoint.entries())
            .map(([endpoint, stats]) => ({
                endpoint,
                ...stats,
                error_rate: stats.count > 0 ? (stats.errors / stats.count) * 100 : 0
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        return endpoints;
    }

    /**
     * Compute p50/p95 per endpoint for the last windowMs (default 5 minutes)
     */
    getEndpointPercentiles(windowMs = 5 * 60 * 1000) {
        const now = Date.now();
        const recent = this.metrics.requests.response_times.filter(r => r.timestamp > now - windowMs);
        const byEndpoint = new Map();
        for (const r of recent) {
            if (!byEndpoint.has(r.endpoint)) byEndpoint.set(r.endpoint, []);
            byEndpoint.get(r.endpoint).push(r.duration);
        }
        const pct = (arr, p) => {
            if (!arr.length) return 0;
            const sorted = [...arr].sort((a, b) => a - b);
            const idx = Math.ceil((p / 100) * sorted.length) - 1;
            return sorted[Math.max(0, Math.min(sorted.length - 1, idx))];
        };
        const result = [];
        for (const [endpoint, durations] of byEndpoint.entries()) {
            result.push({
                endpoint,
                count: durations.length,
                p50: Math.round(pct(durations, 50)),
                p95: Math.round(pct(durations, 95)),
                min: Math.round(Math.min(...durations)),
                max: Math.round(Math.max(...durations)),
            });
        }
        return result.sort((a, b) => b.count - a.count);
    }

    /**
     * Get custom metrics summary
     */
    getCustomMetricsSummary() {
        const summary = {};
        
        for (const [name, metric] of this.metrics.custom.entries()) {
            summary[name] = {
                count: metric.count,
                avg: Math.round(metric.avg * 100) / 100,
                min: Math.round(metric.min * 100) / 100,
                max: Math.round(metric.max * 100) / 100
            };
        }
        
        return summary;
    }

    /**
     * Format uptime in human readable format
     */
    formatUptime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days}d ${hours % 24}h ${minutes % 60}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    /**
     * Get real-time metrics for dashboards
     */
    getRealTimeMetrics() {
        const now = Date.now();
        const lastMinute = now - (60 * 1000);
        
        const recentRequests = this.metrics.requests.response_times
            .filter(req => req.timestamp > lastMinute);

        return {
            timestamp: now,
            active_requests: this.activeRequests.size,
            requests_last_minute: recentRequests.length,
            avg_response_time: recentRequests.length > 0
                ? recentRequests.reduce((sum, req) => sum + req.duration, 0) / recentRequests.length
                : 0,
            error_count_last_minute: recentRequests.filter(req => req.status_code >= 400).length,
            
            memory_usage: process.memoryUsage(),
            cpu_load: os.loadavg()
        };
    }

    /**
     * Stop monitoring and cleanup
     */
    stop() {
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals = [];
    }
}

// Export singleton instance
const performanceMonitor = new PerformanceMonitor();

module.exports = performanceMonitor;
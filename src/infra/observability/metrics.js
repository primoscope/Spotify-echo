'use strict';
const client = require('prom-client');
const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: 'echotune_process_', gcDurationBuckets: [0.001,0.01,0.1,1,2] });
const httpRequestsTotal = new client.Counter({ name: 'http_server_requests_total', help: 'Total number of HTTP requests', labelNames: ['method','route','status'] });
const httpRequestDurationMs = new client.Histogram({ name: 'http_server_request_duration_ms', help: 'Duration of HTTP requests in ms', labelNames: ['method','route','status'], buckets: [10,25,50,100,200,400,800,1600,5000] });
const httpRequestsErrors = new client.Counter({ name: 'http_server_errors_total', help: 'Errored HTTP requests', labelNames: ['method','route','status'] });
const externalApiLatency = new client.Histogram({ name: 'external_api_latency_ms', help: 'External API latency', labelNames: ['service','operation','status'], buckets: [20,50,100,200,400,800,1600,5000] });
const cacheHitCounter = new client.Counter({ name: 'cache_hits_total', help: 'Cache hits', labelNames: ['cache'] });
const cacheMissCounter = new client.Counter({ name: 'cache_misses_total', help: 'Cache misses', labelNames: ['cache'] });
const cacheHitRatio = new client.Gauge({ name: 'cache_hit_ratio', help: 'Cache hit ratio', labelNames: ['cache'] });
register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestDurationMs);
register.registerMetric(httpRequestsErrors);
register.registerMetric(externalApiLatency);
register.registerMetric(cacheHitCounter);
register.registerMetric(cacheMissCounter);
register.registerMetric(cacheHitRatio);
function updateCacheRatio(cache='default') { const hits = cacheHitCounter.hashMap[`cache:${cache}`]?.value||0; const misses = cacheMissCounter.hashMap[`cache:${cache}`]?.value||0; const total = hits+misses; if (total===0) return; cacheHitRatio.set({cache}, hits/total); }
async function timeExternal(service, operation, fn) { const end = externalApiLatency.startTimer({ service, operation }); try { const r = await fn(); end({ status: 'success' }); return r; } catch (e) { end({ status: 'error' }); throw e; } }
module.exports = { register, httpRequestsTotal, httpRequestDurationMs, httpRequestsErrors, cacheHitCounter, cacheMissCounter, cacheHitRatio, updateCacheRatio, timeExternal };
# Observability Instrumentation Plan

Phases:
1. Minimal (current): logger, metrics, request IDs, health & metrics endpoints.
2. Performance: cache metrics after cache layer integration.
3. Advanced: tracing (OpenTelemetry), external API latency segmentation (histogram in place, usage pending).
4. Optimization: sampling strategies, SLO dashboards, alerting.

## Implemented
- Structured logging (pino JSON)
- Request correlation (UUID + CLS)
- HTTP metrics: requests total, duration histogram, error counter
- External API latency histogram
- Cache metrics: hits, misses, ratio (now active)
- Circuit breaker metrics: state, retry counters
- OpenTelemetry tracing skeleton with console/OTLP exporters
- Domain metrics: playlist generation requests, duration, errors
- Auth metrics: token validation counters
- Endpoints: /internal/health, /internal/metrics, /internal/ready (Prometheus)

## Readiness Management
- Separate readiness state from health checks
- Graceful shutdown with connection draining
- SIGTERM/SIGINT signal handling
- Configurable shutdown timeout

## Tracing (Partial)
- OpenTelemetry SDK initialization
- Auto-instrumentation for HTTP, Express, MongoDB, Redis
- Manual span creation for external API calls
- Request ID correlation in spans
- Console exporter (dev) and OTLP exporter (production)

## Domain Metrics (Partial) 
- Playlist generation business metrics
- Request counters by source
- Duration histograms with appropriate buckets
- Error categorization and counting

## Pending
- Sampling strategies for high-traffic scenarios
- Alerting / SLO reports
- Metrics auth / exposure control
- Advanced span attributes and baggage

## Validation Checklist
- [x] curl /internal/health returns ok:true
- [x] curl /internal/ready returns ready status (503 → 200)
- [x] curl /internal/metrics exposes http_server_requests_total
- [x] Metrics include cache_hits_total, cache_misses_total, cache_hit_ratio
- [x] Metrics include external_circuit_state, external_call_retries_total
- [x] Metrics include playlist_generation_* domain metrics
- [x] Metrics include auth_token_validation_total
- [x] Logs contain requestId for sample requests
- [x] OpenTelemetry spans appear in console output (dev mode)
- [x] Graceful shutdown works with SIGTERM signal
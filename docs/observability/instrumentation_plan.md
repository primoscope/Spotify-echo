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
- Cache metrics placeholders (hits, misses, ratio)
- Endpoints: /internal/health, /internal/metrics (Prometheus)

## Pending
- Cache integration hooking counters
- Tracing spans
- Alerting / SLO reports
- Metrics auth / exposure control

## Validation Checklist
- curl /internal/health returns ok:true
- curl /internal/metrics exposes http_server_requests_total
- Logs contain requestId for sample requests
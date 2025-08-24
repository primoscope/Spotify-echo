# Observability Instrumentation Plan
Phases:
1. Minimal (current PR set): logger, metrics, request IDs.
2. Performance: latency histograms, cache metrics.
3. Advanced: tracing (OpenTelemetry), external API latency segmentation.
Metrics Roadmap (Initial):
- http_server_requests_total
- http_server_request_duration_ms (histogram)
- cache_hit_ratio
- external_api_latency_ms
Next Steps: Implement in Observability PR.
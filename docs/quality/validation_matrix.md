# Validation Matrix (Phase 1)
| Area | Metric | Baseline (TBD) | Target | Validation Method |
|------|--------|----------------|--------|-------------------|
| Performance | median_http_latency_ms | TBA | -40% | perf_smoke.js |
| Performance | p95_http_latency_ms | TBA | -30–40% | perf_smoke.js |
| Reliability | uptime | TBA | 99.9% | future synthetic checks |
| Security | high_vulns | TBA | 0 | security_scan.sh |
| Testing | coverage_lines | TBA | +10% absolute | coverage_report.sh |
| Caching | cache_hit_ratio | 0 | >=0.60 | metrics endpoint |
Notes: Baselines populated after instrumentation.
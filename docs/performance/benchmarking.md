# Performance Benchmarking

## Overview

The application includes automated performance benchmarking using [autocannon](https://github.com/mcollina/autocannon), a fast HTTP benchmarking tool.

## Quick Start

```bash
# Run benchmark with defaults (10s duration, 25 connections)
./scripts/performance/bench.sh

# Run with custom parameters
DURATION=30s CONNECTIONS=50 ./scripts/performance/bench.sh

# Benchmark specific endpoint
URL=http://localhost:3000/api/health ./scripts/performance/bench.sh
```

## Configuration

The benchmark script accepts environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `DURATION` | `10s` | How long to run the benchmark |
| `CONNECTIONS` | `25` | Number of concurrent connections |
| `URL` | `http://localhost:3000/internal/health` | Target endpoint |

## npm Script Integration

Add to package.json scripts (if not already present):

```json
{
  "scripts": {
    "perf:bench": "./scripts/performance/bench.sh",
    "perf:bench:long": "DURATION=60s CONNECTIONS=50 ./scripts/performance/bench.sh",
    "perf:bench:health": "URL=http://localhost:3000/internal/health ./scripts/performance/bench.sh",
    "perf:bench:api": "URL=http://localhost:3000/api/health ./scripts/performance/bench.sh"
  }
}
```

Usage:
```bash
npm run perf:bench
npm run perf:bench:long
npm run perf:bench:health
```

## Output and Reports

### Report Location

Benchmark results are saved as JSON files in:
```
perf_reports/
├── 20250824_143022.json
├── 20250824_143155.json
└── .gitkeep
```

### Report Format

Each report contains detailed metrics:

```json
{
  "title": "localhost:3000/internal/health",
  "url": "http://localhost:3000/internal/health",
  "requests": {
    "average": 1250.5,
    "mean": 1250.5,
    "stddev": 125.2,
    "min": 980,
    "max": 1450,
    "total": 12505,
    "p0_001": 980,
    "p0_01": 1020,
    "p0_1": 1080,
    "p1": 1120,
    "p2_5": 1140,
    "p10": 1160,
    "p25": 1180,
    "p50": 1250,
    "p75": 1320,
    "p90": 1380,
    "p97_5": 1410,
    "p99": 1430,
    "p99_9": 1445,
    "p99_99": 1450,
    "p99_999": 1450
  },
  "latency": {
    "average": 19.2,
    "mean": 19.2,
    "stddev": 8.1,
    "min": 1,
    "max": 145,
    "p0_001": 1,
    "p0_01": 2,
    "p0_1": 4,
    "p1": 6,
    "p2_5": 8,
    "p10": 10,
    "p25": 13,
    "p50": 18,
    "p75": 24,
    "p90": 30,
    "p97_5": 38,
    "p99": 45,
    "p99_9": 89,
    "p99_99": 145,
    "p99_999": 145
  },
  "throughput": {
    "average": 2043596,
    "mean": 2043596,
    "stddev": 203852,
    "min": 1603584,
    "max": 2374656
  },
  "errors": 0,
  "timeouts": 0,
  "duration": 10.01,
  "start": "2025-08-24T14:30:22.123Z",
  "finish": "2025-08-24T14:30:32.133Z"
}
```

### Key Metrics

The script displays key metrics after completion:

```bash
📈 Key Metrics:
   Requests/sec: 1250.5
   Latency p95:  38ms
   Latency p99:  45ms
   Total requests: 12505
   Total errors: 0
```

## Updating Baseline Metrics

After running benchmarks, update the baseline metrics file:

1. Review the benchmark results in `perf_reports/`
2. Update `docs/baseline_metrics.md`:

```markdown
## Performance (measured)
- median_http_latency_ms: 18
- p95_http_latency_ms: 38
```

### Automated Baseline Updates

You can extract metrics programmatically:

```bash
# Get the latest benchmark file
LATEST_REPORT=$(ls -t perf_reports/*.json | head -1)

# Extract p95 latency
P95_LATENCY=$(jq -r '.latency.p95' "$LATEST_REPORT")

echo "Update baseline_metrics.md with p95_http_latency_ms: $P95_LATENCY"
```

## Common Benchmark Scenarios

### Health Endpoint (Default)

```bash
# Quick health check benchmark
./scripts/performance/bench.sh
```

Expected performance: >1000 req/sec, <50ms p95 latency

### API Endpoints

```bash
# Test API performance
URL=http://localhost:3000/api/health ./scripts/performance/bench.sh
```

### Load Testing

```bash
# Sustained load test
DURATION=60s CONNECTIONS=100 ./scripts/performance/bench.sh
```

### Stress Testing

```bash
# High connection stress test
CONNECTIONS=200 DURATION=30s ./scripts/performance/bench.sh
```

## Interpreting Results

### Good Performance Indicators

- **High throughput**: >1000 requests/sec for simple endpoints
- **Low latency p95**: <100ms for most endpoints
- **Low latency p99**: <200ms for most endpoints  
- **Zero errors**: No failed requests
- **Consistent performance**: Low standard deviation

### Performance Issues

- **High p99 latency**: Indicates occasional slow requests
- **High error count**: Server overload or bugs
- **Low throughput**: Potential bottlenecks
- **High standard deviation**: Inconsistent performance

### Latency Percentiles Guide

- **p50 (median)**: Half of requests complete faster
- **p95**: 95% of requests complete faster (good SLA target)
- **p99**: 99% of requests complete faster (catches outliers)
- **p99.9**: Important for user experience

## Performance Optimization

### Common Improvements

1. **Enable compression**: Reduces response size
2. **Optimize database queries**: Index frequently queried fields
3. **Add caching**: Reduce repeated computations
4. **Connection pooling**: Reuse database connections
5. **Async processing**: Don't block the event loop

### Monitoring Trends

Keep historical benchmark data:

```bash
# Archive old reports
mkdir -p perf_reports/archive/$(date +%Y-%m)
mv perf_reports/*.json perf_reports/archive/$(date +%Y-%m)/
```

### Before/After Testing

```bash
# Benchmark before changes
./scripts/performance/bench.sh
mv perf_reports/$(ls -t perf_reports/*.json | head -1) perf_reports/before_optimization.json

# Make optimizations...

# Benchmark after changes  
./scripts/performance/bench.sh
mv perf_reports/$(ls -t perf_reports/*.json | head -1) perf_reports/after_optimization.json

# Compare results
echo "Before optimization:"
jq -r '.requests.average' perf_reports/before_optimization.json

echo "After optimization:"  
jq -r '.requests.average' perf_reports/after_optimization.json
```

## CI/CD Integration

Add performance testing to CI/CD pipelines:

```yaml
# .github/workflows/performance.yml
- name: Performance Benchmark
  run: |
    npm start &
    sleep 5  # Wait for server to start
    DURATION=30s ./scripts/performance/bench.sh
    pkill -f "npm start"  # Clean shutdown
```

## Troubleshooting

### Server Not Responding

```bash
# Check if server is running
curl -I http://localhost:3000/internal/health

# Start server if needed
npm start
```

### Low Performance

1. Check system resources: `htop`, `free -h`
2. Check for competing processes
3. Ensure database connections are available
4. Review application logs for errors

### High Memory Usage

Monitor memory during benchmarks:

```bash
# Monitor while running benchmark
watch -n 1 'ps aux | grep node'
```
#!/bin/bash

# Performance Benchmark Script
# Uses autocannon to benchmark application endpoints

set -e

# Configuration (can be overridden by environment variables)
DURATION=${DURATION:-10s}
CONNECTIONS=${CONNECTIONS:-25}
URL=${URL:-http://localhost:3000/internal/health}
OUTPUT_DIR="perf_reports"

# Ensure output directory exists
mkdir -p "$OUTPUT_DIR"

# Generate timestamp for unique filenames
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_FILE="$OUTPUT_DIR/${TIMESTAMP}.json"

echo "🚀 Starting performance benchmark..."
echo "📊 Target URL: $URL"
echo "⏱️  Duration: $DURATION"
echo "🔗 Connections: $CONNECTIONS"
echo "📁 Output: $OUTPUT_FILE"

# Check if server is responding
echo "🔍 Checking server availability..."
if ! curl -s -f "$URL" > /dev/null; then
  echo "❌ Error: Server not responding at $URL"
  echo "💡 Make sure the server is running: npm start"
  exit 1
fi
echo "✅ Server is responding"

# Run autocannon benchmark
echo "🏃 Running benchmark..."
npx autocannon \
  --duration "$DURATION" \
  --connections "$CONNECTIONS" \
  --json \
  --output "$OUTPUT_FILE" \
  "$URL"

# Check if benchmark completed successfully
if [ $? -eq 0 ]; then
  echo "✅ Benchmark completed successfully"
  echo "📊 Results saved to: $OUTPUT_FILE"
  
  # Display key metrics if jq is available
  if command -v jq > /dev/null; then
    echo ""
    echo "📈 Key Metrics:"
    echo "   Requests/sec: $(jq -r '.requests.average' "$OUTPUT_FILE")"
    echo "   Latency p95:  $(jq -r '.latency.p95' "$OUTPUT_FILE")ms"
    echo "   Latency p99:  $(jq -r '.latency.p99' "$OUTPUT_FILE")ms"
    echo "   Total requests: $(jq -r '.requests.total' "$OUTPUT_FILE")"
    echo "   Total errors: $(jq -r '.errors' "$OUTPUT_FILE")"
  else
    echo "💡 Install 'jq' to see formatted metrics: sudo apt-get install jq"
  fi
  
  echo ""
  echo "📋 To update baseline metrics manually:"
  echo "   - Update docs/baseline_metrics.md with p95 latency"
  echo "   - Use median_http_latency_ms and p95_http_latency_ms fields"
  
else
  echo "❌ Benchmark failed"
  exit 1
fi
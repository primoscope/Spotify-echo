# Manual Verification Commands for PR

## Environment Validation
```bash
# Test enhanced validation in strict mode
npm run validate:env

# Test validation in warn-only mode (for deployment)
npm run validate:env -- --warn-only

# Test vercel-build script
npm run vercel-build

# Analyze environment variable usage
npm run analyze:env
```

## Server Functionality Tests

### 1. Basic Health Check
```bash
# Start server (in background)
node server.js &
SERVER_PID=$!

# Wait for startup
sleep 5

# Test health endpoint
curl -s http://localhost:3000/health | jq '.'

# Test with real-time disabled
DISABLE_REALTIME=true node server.js &
REALTIME_DISABLED_PID=$!
sleep 5
curl -s http://localhost:3000/health | jq '.features'

# Cleanup
kill $SERVER_PID $REALTIME_DISABLED_PID 2>/dev/null
```

### 2. Feature Flag Testing
```bash
# Test with all features disabled
DISABLE_REALTIME=true ENABLE_TRACING=false ENABLE_AGENTOPS=false node server.js | head -10

# Test with all features enabled (default)
node server.js | head -10
```

### 3. Dependency Analysis
```bash
# Check current dependency count
echo "Current production deps: $(cat package.json | jq '.dependencies | keys | length')"
echo "Current dev deps: $(cat package.json | jq '.devDependencies | keys | length')"

# Analyze MCP dependencies
node scripts/optimize-dependencies.js
```

## Vercel Deployment Simulation

### 1. Serverless Environment Test
```bash
# Simulate Vercel environment
VERCEL=1 DISABLE_REALTIME=true NODE_ENV=production node server.js | head -20
```

### 2. Validate Vercel Configuration
```bash
# Check vercel.json syntax
cat vercel.json | jq '.'

# Check .vercelignore patterns
echo "Files excluded from deployment:"
git ls-files | grep -E "^(mcp-server|mcp-servers|scripts|docs)" | wc -l
echo "Total project files:"
git ls-files | wc -l
```

## API Endpoint Testing

### 1. Health Endpoints
```bash
node server.js &
SERVER_PID=$!
sleep 5

echo "=== Health Check ==="
curl -s http://localhost:3000/health

echo -e "\n=== Readiness Check ==="
curl -s http://localhost:3000/ready

echo -e "\n=== Liveness Check ==="
curl -s http://localhost:3000/alive

kill $SERVER_PID 2>/dev/null
```

### 2. Basic API Test
```bash
node server.js &
SERVER_PID=$!
sleep 5

echo "=== API Test ==="
curl -s -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'

kill $SERVER_PID 2>/dev/null
```

## Performance and Monitoring

### 1. Cold Start Simulation
```bash
echo "=== Cold Start Test ==="
time node -e "
require('./server.js');
setTimeout(() => {
  console.log('Cold start completed');
  process.exit(0);
}, 2000);
"
```

### 2. Memory Usage Check
```bash
echo "=== Memory Usage ==="
node -e "
const used = process.memoryUsage();
for (let key in used) {
  console.log(\`\${key}: \${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB\`);
}
"
```

## Validation Summary

Run all validation commands:
```bash
echo "🔍 Running comprehensive validation..."

echo "1. Environment validation..."
npm run validate:env -- --warn-only

echo "2. Dependency analysis..."
node scripts/optimize-dependencies.js

echo "3. Server startup test..."
timeout 5 node server.js >/dev/null 2>&1 && echo "✅ Server starts successfully" || echo "❌ Server startup failed"

echo "4. Realtime disabled test..."
DISABLE_REALTIME=true timeout 5 node server.js >/dev/null 2>&1 && echo "✅ Realtime disabled mode works" || echo "❌ Realtime disabled mode failed"

echo "5. Vercel simulation..."
VERCEL=1 DISABLE_REALTIME=true timeout 3 node server.js >/dev/null 2>&1 && echo "✅ Vercel simulation works" || echo "❌ Vercel simulation failed"

echo "✅ All validation checks completed"
```
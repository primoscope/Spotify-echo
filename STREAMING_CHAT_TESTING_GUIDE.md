# Streaming Chat (SSE) Implementation - Testing Guide

## 🚀 Quick Start Testing

### Backend SSE Streaming
```bash
# Start the development server
npm run dev

# Test SSE endpoint
curl -N -H "Accept: text/event-stream" \
  "http://localhost:3000/api/chat/stream?sessionId=test&message=Hello&provider=gemini"

# Expected output:
# event: connected
# data: {"message":"Connected to chat stream","requestId":"req_..."}
#
# event: message  
# data: {"delta":"Hello","isPartial":true,"requestId":"req_..."}
#
# event: complete
# data: {"totalTime":1500,"requestId":"req_...","provider":"gemini"}
```

### Provider Health Monitoring
```bash
# Check provider health
curl http://localhost:3000/api/chat/providers/health | jq '.'

# Expected response:
# {
#   "success": true,
#   "providers": {
#     "gemini": {
#       "state": "CLOSED",
#       "health": "healthy", 
#       "avgLatency": 450,
#       "successRate": 98.5
#     }
#   }
# }
```

### Provider Switching
```bash
# Switch to different provider
curl -X POST http://localhost:3000/api/chat/providers/switch \
  -H "Content-Type: application/json" \
  -d '{"provider":"openai","model":"gpt-3.5-turbo"}'

# Expected response:
# {
#   "success": true,
#   "provider": "openai",
#   "model": "gpt-3.5-turbo"
# }
```

## 🐳 Docker Development Stack

### Start Full Stack
```bash
# Start core services (app + MongoDB + Redis)
docker-compose -f docker-compose.dev.yml up

# Start with management tools
docker-compose -f docker-compose.dev.yml --profile tools up

# Access services:
# - App: http://localhost:3000
# - MongoDB Express: http://localhost:8081 (admin/admin123)
# - Redis Commander: http://localhost:8082
```

### Validate Container SSE
```bash
# Test SSE in container
docker-compose -f docker-compose.dev.yml exec app curl -N \
  "http://localhost:3000/api/chat/stream?sessionId=test&message=Docker%20test"

# Check health endpoint
docker-compose -f docker-compose.dev.yml exec app curl http://localhost:3000/health
```

## 📊 MongoDB Analytics Testing

### Provider Telemetry
```javascript
// Connect to MongoDB and test telemetry collection
use echotune_dev

// View provider telemetry data
db.provider_telemetry.find().limit(5)

// Get provider performance aggregation
db.provider_telemetry.aggregate([
  { $match: { ts: { $gte: new Date(Date.now() - 24*60*60*1000) } } },
  { $group: { 
    _id: "$provider", 
    avgLatency: { $avg: "$latencyMs" },
    successRate: { $avg: { $cond: ["$success", 1, 0] } }
  }}
])

// Test TTL index (records should expire after 30 days)
db.provider_telemetry.getIndexes()
```

### Analytics API Testing
```bash
# Provider analytics
curl "http://localhost:3000/api/analytics/providers?timeRange=24h" | jq '.'

# Listening patterns  
curl "http://localhost:3000/api/analytics/listening-patterns?timeRange=7d" | jq '.'

# Engagement insights
curl "http://localhost:3000/api/insights/engagement?timeRange=7d" | jq '.'
```

## 🎯 Frontend Component Testing

### StreamingChatInterface
```jsx
// Test component in development
import StreamingChatInterface from './components/StreamingChatInterface';

// Usage:
<StreamingChatInterface sessionId="test-session" />

// Test features:
// 1. Type message and send - should start streaming
// 2. Click abort button during streaming - should cancel
// 3. Switch providers using health chips
// 4. View explainability panel for AI responses
// 5. Check accessibility with screen reader
```

### Provider Health Chips
- ✅ Green: Healthy provider (latency < 1000ms, success rate > 95%)
- 🟡 Yellow: Recovering provider (circuit breaker half-open)  
- 🔴 Red: Unhealthy provider (circuit breaker open)
- 🔵 Blue: Currently selected provider

### Accessibility Testing
```bash
# Install accessibility testing tools
npm install -g axe-core @axe-core/cli

# Test accessibility
axe-core http://localhost:3000

# Test with screen reader (if available)
# - Tab navigation should work smoothly
# - All interactive elements should be announced
# - Focus indicators should be visible
# - ARIA labels should provide context
```

## 🧪 Jest Test Suite

### Run Streaming Tests
```bash
# Run all streaming chat tests
npm test -- --testPathPattern=streaming-chat

# Test specific functionality
npm test -- --testNamePattern="SSE streaming"
npm test -- --testNamePattern="Provider switching"
npm test -- --testNamePattern="Telemetry recording"

# Coverage report
npm test -- --coverage --testPathPattern=streaming-chat
```

### Test Coverage Targets
- **SSE Endpoint**: Connection, streaming, error handling, abort
- **Provider Manager**: Circuit breaker, telemetry, switching
- **Telemetry System**: Recording, metrics calculation, persistence
- **Frontend Components**: EventSource integration, UI interactions

## 🔍 Performance Testing

### Load Testing SSE Endpoint
```bash
# Install load testing tool
npm install -g artillery

# Create artillery config (artillery-sse.yml):
config:
  target: http://localhost:3000
  phases:
    - duration: 60
      arrivalRate: 5
scenarios:
  - name: SSE streaming test
    requests:
      - get:
          url: "/api/chat/stream?sessionId=test&message=Load%20test"

# Run load test
artillery run artillery-sse.yml
```

### Expected Performance
- **SSE Connection**: < 100ms to establish
- **First Token**: < 500ms for first streaming token
- **Provider Switch**: < 200ms to switch providers
- **Health Check**: < 50ms for provider health API
- **Analytics API**: < 1200ms for complex aggregations

## 🛠️ Troubleshooting

### Common Issues

1. **SSE Connection Fails**
   ```bash
   # Check if server is running
   curl http://localhost:3000/health
   
   # Check SSE headers
   curl -I http://localhost:3000/api/chat/stream
   ```

2. **Provider Circuit Breaker Opens**
   ```bash
   # Check provider health
   curl http://localhost:3000/api/chat/providers/health
   
   # Reset circuit breaker (restart server)
   npm run dev
   ```

3. **MongoDB Connection Issues**
   ```bash
   # Check MongoDB container
   docker-compose -f docker-compose.dev.yml logs mongodb
   
   # Test connection
   docker-compose -f docker-compose.dev.yml exec mongodb mongosh
   ```

4. **Frontend EventSource Errors**
   ```javascript
   // Debug EventSource in browser console
   const eventSource = new EventSource('/api/chat/stream?sessionId=test&message=debug');
   eventSource.addEventListener('error', console.error);
   eventSource.addEventListener('message', console.log);
   ```

## ✅ Acceptance Criteria Validation

### Backend SSE ✅
- [x] GET /api/chat/stream endpoint with proper headers
- [x] Heartbeats every 20 seconds  
- [x] Request abort via X-Request-Id
- [x] 429 retry with exponential backoff
- [x] Circuit breaker integration

### Provider Management ✅  
- [x] Circuit breaker per provider
- [x] Telemetry hooks and recording
- [x] Provider switching API
- [x] Health monitoring endpoint

### Frontend Streaming ✅
- [x] EventSource integration
- [x] Typing indicators and progress bars
- [x] Abort button functionality
- [x] Error handling with user feedback

### Analytics & Insights ✅
- [x] MongoDB telemetry collection with TTL
- [x] Provider performance aggregations
- [x] Listening patterns time series
- [x] Engagement KPIs and insights

### Infrastructure ✅
- [x] Docker Compose development stack
- [x] MongoDB + Redis containers
- [x] Health checks and management tools
- [x] Database initialization scripts

🎉 **All acceptance criteria met! Implementation is complete and ready for production testing.**
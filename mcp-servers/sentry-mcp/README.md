# 🔍 Sentry MCP Server for EchoTune AI

A comprehensive **Sentry integration MCP server** that provides error monitoring, performance tracking, and observability capabilities for the EchoTune AI music recommendation system.

## 🎯 Features

- **Error Tracking**: Capture and report errors with rich context
- **Performance Monitoring**: Track transactions and performance metrics
- **Custom Events**: Log custom events for monitoring workflows
- **User Context**: Associate errors and events with user information
- **Breadcrumbs**: Track user actions and system events for debugging
- **Health Monitoring**: Built-in health checks and connectivity testing

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- Sentry account (using provided DSN)
- @sentry/node package
- @modelcontextprotocol/sdk package

### Installation
```bash
cd mcp-servers/sentry-mcp
npm install
npm start
```

### Configuration
The server uses a pre-configured Sentry DSN for EchoTune AI:
```
DSN: https://81f42a0da8d0d7467f0c231d29f34051@o4509810176294912.ingest.us.sentry.io/4509810186387456
```

### Environment Variables (Optional)
```bash
SENTRY_MCP_PORT=3012          # Server port (default: 3012)
NODE_ENV=development          # Environment (development/production)
SENTRY_DSN=your_custom_dsn    # Override default DSN if needed
```

## 🛠️ Available MCP Tools

### 1. **sentry_capture_error**
Capture and report errors to Sentry with context and user information.

```json
{
  "tool": "sentry_capture_error",
  "arguments": {
    "error": "Failed to generate recommendations",
    "level": "error",
    "context": {
      "user_id": "user123",
      "operation": "ml_inference",
      "model": "recommendation_engine"
    },
    "user": {
      "id": "user123",
      "username": "john_doe",
      "spotify_id": "spotify_user_123"
    },
    "tags": {
      "service": "recommendations",
      "error_type": "ml_model_failure"
    }
  }
}
```

### 2. **sentry_capture_event**
Capture custom events for monitoring EchoTune AI workflows.

```json
{
  "tool": "sentry_capture_event",
  "arguments": {
    "message": "User generated 20 recommendations",
    "level": "info",
    "extra": {
      "recommendations_count": 20,
      "processing_time_ms": 150,
      "user_preferences": ["rock", "pop"]
    },
    "tags": {
      "event_type": "recommendation_success",
      "user_tier": "premium"
    }
  }
}
```

### 3. **sentry_start_transaction**
Start performance tracking transaction for music operations.

```json
{
  "tool": "sentry_start_transaction",
  "arguments": {
    "name": "generate_recommendations",
    "operation": "ml_inference",
    "description": "Generate personalized music recommendations using ML model"
  }
}
```

### 4. **sentry_finish_transaction**
Finish and submit performance transaction.

```json
{
  "tool": "sentry_finish_transaction",
  "arguments": {
    "transaction_id": "generate_recommendations_1704727200000",
    "status": "ok",
    "tags": {
      "recommendations_generated": "20",
      "model_version": "v2.1"
    }
  }
}
```

### 5. **sentry_set_user_context**
Set user context for subsequent Sentry events.

```json
{
  "tool": "sentry_set_user_context",
  "arguments": {
    "user": {
      "id": "user123",
      "email": "user@example.com",
      "username": "john_doe",
      "spotify_id": "spotify_user_123",
      "subscription_tier": "premium"
    }
  }
}
```

### 6. **sentry_add_breadcrumb**
Add breadcrumb for tracking user actions and system events.

```json
{
  "tool": "sentry_add_breadcrumb",
  "arguments": {
    "message": "User clicked 'Generate Recommendations' button",
    "category": "user_action",
    "level": "info",
    "data": {
      "button_id": "generate_recommendations",
      "page": "dashboard",
      "timestamp": "2025-01-08T19:30:00Z"
    }
  }
}
```

### 7. **sentry_health_check**
Check Sentry integration health and connectivity.

```json
{
  "tool": "sentry_health_check",
  "arguments": {}
}
```

## 🌐 HTTP Endpoints

### Health Check
```bash
GET http://localhost:3012/health
```
Response:
```json
{
  "status": "healthy",
  "service": "sentry-mcp-server",
  "version": "1.0.0",
  "sentry_dsn_configured": true,
  "timestamp": "2025-01-08T19:30:00.000Z"
}
```

### Test Error (for validation)
```bash
GET http://localhost:3012/test-error
```
This endpoint intentionally throws an error to test Sentry integration.

### Test Performance
```bash
GET http://localhost:3012/test-performance
```
This endpoint creates a sample performance transaction for testing.

## 🔧 Integration with EchoTune AI

### Add to MCP Orchestrator
Update `mcp-server/package.json` to include the Sentry server:

```json
{
  "servers": {
    "sentry": {
      "command": "node",
      "args": ["../mcp-servers/sentry-mcp/sentry-mcp-server.js"],
      "description": "Sentry monitoring and error tracking",
      "env": {
        "SENTRY_MCP_PORT": "3012"
      }
    }
  }
}
```

### Update Main Package.json Scripts
Add to main `package.json`:

```json
{
  "scripts": {
    "mcp:sentry": "node mcp-servers/sentry-mcp/sentry-mcp-server.js",
    "mcp:sentry-health": "curl -f http://localhost:3012/health"
  }
}
```

## 📊 Usage Examples

### Error Monitoring in Spotify API Calls
```javascript
// When Spotify API call fails
await mcpClient.callTool('sentry_capture_error', {
  error: `Spotify API error: ${response.status} ${response.statusText}`,
  level: 'error',
  context: {
    api_endpoint: '/v1/recommendations',
    status_code: response.status,
    response_time_ms: responseTime
  },
  user: { id: userId },
  tags: { service: 'spotify_api', error_type: 'api_failure' }
});
```

### Performance Tracking for ML Models
```javascript
// Start transaction
const transaction = await mcpClient.callTool('sentry_start_transaction', {
  name: 'ml_recommendation_inference',
  operation: 'ml_inference',
  description: 'Generate recommendations using collaborative filtering'
});

// ... ML model processing ...

// Finish transaction
await mcpClient.callTool('sentry_finish_transaction', {
  transaction_id: transaction.transaction_id,
  status: 'ok',
  tags: { model_type: 'collaborative_filtering', user_count: userCount }
});
```

### User Action Tracking
```javascript
// Track user interactions
await mcpClient.callTool('sentry_add_breadcrumb', {
  message: 'User played recommended track',
  category: 'user_action',
  level: 'info',
  data: {
    track_id: trackId,
    track_name: trackName,
    recommendation_score: score,
    playlist_position: position
  }
});
```

## 🧪 Testing

### Run Health Check
```bash
npm run health
```

### Test Error Capture
```bash
npm run test-error
```

### Test Performance Monitoring
```bash
npm run test-performance
```

### Run Full Test Suite
```bash
npm test
```

## 🔍 Monitoring Dashboard

Once running, you can monitor:
- **Errors**: All captured errors with full context
- **Performance**: Transaction timing and throughput
- **User Activity**: Breadcrumb trails and user sessions
- **System Health**: Server status and connectivity

## 📝 Best Practices

1. **Set User Context Early**: Call `sentry_set_user_context` at the start of user sessions
2. **Use Breadcrumbs**: Track important user actions and system events
3. **Structured Tags**: Use consistent tag naming for better filtering
4. **Performance Transactions**: Wrap expensive operations in transactions
5. **Error Context**: Include relevant context data with error captures

## 🚀 Next Steps

1. **Start the server**: `npm start`
2. **Add to MCP orchestrator**: Update configuration files
3. **Integrate with workflows**: Add Sentry calls to critical paths
4. **Monitor dashboard**: Check Sentry dashboard for events
5. **Set up alerts**: Configure Sentry alerts for critical errors

## 📖 Related Documentation

- [MCP Server Orchestrator](../mcp-server/README.md)
- [EchoTune AI Architecture](../../ARCHITECTURE.md)
- [Sentry Documentation](https://docs.sentry.io/platforms/node/)
- [Model Context Protocol](https://modelcontextprotocol.io/)

---

**🎵 EchoTune AI - Enhanced with comprehensive monitoring and observability** 🔍
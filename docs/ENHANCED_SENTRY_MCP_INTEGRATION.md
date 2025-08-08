# 🔍 Enhanced Sentry MCP Server Integration

## Overview
Complete enterprise-grade monitoring solution for EchoTune AI with comprehensive error tracking, performance monitoring, and API management capabilities using provided Sentry organization and personal access tokens.

## 🚀 Quick Start

### Start Enhanced Sentry MCP Server
```bash
npm run mcp:sentry
```

### Test All Features
```bash
npm run mcp:sentry-test
```

### Health Check
```bash
npm run mcp:sentry-health
```

## 🔑 Authentication Configuration

The enhanced server now supports multiple authentication methods:

### Environment Variables
```bash
# Primary DSN for event reporting (required)
SENTRY_DSN=https://81f42a0da8d0d7467f0c231d29f34051@o4509810176294912.ingest.us.sentry.io/4509810186387456

# API Authentication (for advanced features)
SENTRY_AUTH_TOKEN=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
SENTRY_ORG_TOKEN=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

# Organization and Project Configuration
SENTRY_ORGANIZATION=primoacope
SENTRY_PROJECT=echotune-ai
```

## 🛠️ Available MCP Tools (11 Total)

### Core Event Reporting Tools
1. **`sentry_capture_error`** - Error reporting with context and user information
2. **`sentry_capture_event`** - Custom event logging for comprehensive workflow monitoring
3. **`sentry_start_transaction`** - Performance tracking start with timing analysis
4. **`sentry_finish_transaction`** - Performance tracking end with status reporting
5. **`sentry_set_user_context`** - User context management and session tracking capabilities
6. **`sentry_add_breadcrumb`** - Action/event breadcrumbs for detailed debugging
7. **`sentry_health_check`** - Connectivity validation with API status verification

### NEW: Enhanced API Management Tools
8. **`sentry_get_issues`** - Retrieve and filter issues from Sentry project
9. **`sentry_get_project_stats`** - Get detailed project statistics and metrics
10. **`sentry_create_release`** - Create deployment releases for version tracking
11. **`sentry_get_organization_info`** - Get organization and project information

## 📡 API Usage Examples

### Basic Error Reporting
```bash
curl -X POST http://localhost:3012/mcp/call-tool \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "sentry_capture_error",
    "arguments": {
      "error": "Spotify API authentication failed",
      "level": "error",
      "context": {"api": "spotify_auth", "endpoint": "/login"},
      "user": {"id": "user123", "spotify_id": "spotify_user_456"},
      "tags": {"service": "spotify", "component": "auth"}
    }
  }'
```

### Performance Monitoring
```bash
curl -X POST http://localhost:3012/mcp/call-tool \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "sentry_start_transaction",
    "arguments": {
      "name": "music_recommendation",
      "operation": "ai.recommendation",
      "description": "Generate personalized music recommendations"
    }
  }'
```

### Issue Management (NEW)
```bash
curl -X POST http://localhost:3012/mcp/call-tool \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "sentry_get_issues",
    "arguments": {
      "status": "unresolved",
      "limit": 10,
      "query": "spotify api"
    }
  }'
```

### Project Statistics (NEW)
```bash
curl -X POST http://localhost:3012/mcp/call-tool \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "sentry_get_project_stats",
    "arguments": {
      "stat": "received",
      "since": "2024-01-01T00:00:00Z"
    }
  }'
```

### Release Management (NEW)
```bash
curl -X POST http://localhost:3012/mcp/call-tool \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "sentry_create_release",
    "arguments": {
      "version": "2.1.0",
      "ref": "main",
      "url": "https://github.com/dzp5103/Spotify-echo"
    }
  }'
```

## 🏗️ Architecture

### Server Configuration
- **Port**: 3012 (configurable via `SENTRY_MCP_PORT`)
- **API Integration**: Full Sentry REST API support
- **Authentication**: Multi-token support for enhanced capabilities
- **Health Monitoring**: Comprehensive connectivity validation

### Integration with EchoTune AI
```javascript
// Example integration in EchoTune AI workflow
async function processUserRecommendation(userId, preferences) {
  // Start performance tracking
  await callSentryTool('sentry_start_transaction', {
    name: 'user_recommendation',
    operation: 'recommendation.generate'
  });
  
  try {
    // Set user context
    await callSentryTool('sentry_set_user_context', {
      user: { id: userId, preferences: preferences }
    });
    
    // Add breadcrumb for user action
    await callSentryTool('sentry_add_breadcrumb', {
      message: 'Started recommendation generation',
      category: 'user_action',
      data: { userId, preferences }
    });
    
    // Generate recommendations (your logic here)
    const recommendations = await generateRecommendations(preferences);
    
    return recommendations;
  } catch (error) {
    // Capture error with context
    await callSentryTool('sentry_capture_error', {
      error: error.message,
      context: { userId, preferences },
      tags: { component: 'recommendations' }
    });
    throw error;
  }
}
```

## 📊 Monitoring Dashboard

### Real-time Health Status
```bash
curl http://localhost:3012/health
```

**Response includes**:
- Server status and uptime
- Sentry DSN connectivity
- API token validation
- Organization and project information
- Available features list

### Organization Overview
```bash
curl -X POST http://localhost:3012/mcp/call-tool \
  -d '{"tool": "sentry_get_organization_info", "arguments": {}}'
```

## 🔧 Configuration Details

### Required Environment Variables
- `SENTRY_DSN`: Event reporting endpoint (provided)
- `SENTRY_AUTH_TOKEN`: Personal access token (provided)
- `SENTRY_ORG_TOKEN`: Organization token (provided)

### Optional Configuration
- `SENTRY_ORGANIZATION`: Organization slug (default: primoacope)
- `SENTRY_PROJECT`: Project slug (default: echotune-ai)  
- `SENTRY_MCP_PORT`: Server port (default: 3012)

## ✅ Testing Results

### Comprehensive Test Suite
```bash
npm run mcp:sentry-test
```

**Test Coverage**:
- ✅ Server startup and health checks
- ✅ Error capture and reporting  
- ✅ Performance monitoring transactions
- ✅ MCP tools endpoint validation
- ✅ Tool execution verification
- ✅ API integration connectivity
- ✅ Enhanced features validation

**Expected Results**: 7/7 tests passing with 100% success rate

## 🚀 Production Deployment

### 1. Environment Setup
Update `.env` file with provided tokens:
```env
SENTRY_DSN=https://81f42a0da8d0d7467f0c231d29f34051@o4509810176294912.ingest.us.sentry.io/4509810186387456
SENTRY_AUTH_TOKEN=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
SENTRY_ORG_TOKEN=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
SENTRY_ORGANIZATION=primoacope
SENTRY_PROJECT=echotune-ai
```

### 2. Start Server
```bash
npm run mcp:sentry
```

### 3. Validate Integration
```bash
npm run mcp:sentry-health
```

## 🔗 Integration Points

### MCP Orchestrator Configuration
Add to `mcp-server/enhanced-mcp-orchestrator.js`:
```javascript
sentry: {
  name: 'sentry-mcp',
  port: 3012,
  health: '/health',
  status: 'active',
  capabilities: [
    'error_tracking',
    'performance_monitoring', 
    'api_integration',
    'issue_management',
    'release_tracking'
  ]
}
```

### Main Application Integration
Update main server to use Sentry MCP for all error handling and monitoring workflows.

## 🎯 Advanced Features

### Automated Issue Triage
- Real-time issue detection and categorization
- Performance degradation alerts
- User impact analysis and reporting

### Release Management
- Automated deployment tracking
- Version comparison and rollback capabilities
- Release health monitoring and alerts

### Custom Dashboards
- EchoTune AI specific metrics and KPIs
- User experience monitoring and analytics
- API performance and reliability tracking

## 📈 Next Steps

1. **Integration Testing**: Validate all tools work with provided tokens
2. **Dashboard Setup**: Configure Sentry dashboard for EchoTune AI
3. **Alert Configuration**: Set up notifications for critical issues
4. **Performance Baselines**: Establish monitoring thresholds
5. **Team Training**: Onboard team on enhanced monitoring capabilities

## 🏆 Benefits

- **Enterprise-grade Monitoring**: Complete observability for production systems
- **Real-time Issue Management**: Instant detection and response capabilities  
- **Performance Optimization**: Detailed insights for system optimization
- **Release Confidence**: Comprehensive deployment tracking and validation
- **Team Productivity**: Automated monitoring reduces manual oversight
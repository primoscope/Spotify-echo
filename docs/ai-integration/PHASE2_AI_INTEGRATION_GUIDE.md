# Phase 2: Advanced AI Integration Setup - Implementation Guide

## 🚀 Overview

This document provides a comprehensive guide to the Phase 2 AI integration setup, featuring advanced Perplexity Sonar Pro and Advanced AI reasoning integrations for Cursor AI workflows.

> **Note**: The "Advanced AI Integration" uses Perplexity's API with Llama 3.1 Sonar models to provide sophisticated reasoning capabilities. While originally designed for Grok-4 access, this implementation leverages Perplexity's powerful models for all advanced AI reasoning tasks.

## 📋 Features Implemented

### ✅ Perplexity Sonar Pro Integration
- **Secure API Configuration**: Rate limiting, caching, and error handling
- **JSON Mode Support**: Structured responses with domain filtering
- **Citation Tracking**: Source verification and credibility scoring
- **MCP Server Integration**: Seamless Cursor integration with 8 specialized tools
- **Automated Workflows**: Fact-checking, competitive analysis, and documentation updates

### ✅ Advanced AI Integration (Perplexity-based)
- **Advanced Reasoning**: Using Perplexity's most capable Llama 3.1 Sonar models
- **Native Tool Use**: Code interpretation and web browsing capabilities
- **Multi-Agent Reasoning**: Expert analysis from multiple perspectives
- **Performance Optimization**: Automated debugging and optimization recommendations
- **Security Analysis**: Current threat research and vulnerability assessment

### ✅ Advanced Search Workflows
- **8 Automated Workflows**: Covering all development scenarios
- **Context-Aware Research**: Integration with current Cursor state
- **Real-Time Documentation**: Live updates based on web research
- **Competitive Analysis**: Automated during development
- **Security Vulnerability Research**: Proactive threat detection

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Cursor IDE                                │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐  │
│  │  Perplexity     │  │   Advanced AI   │  │   Research   │  │
│  │  Ask MCP        │  │  Integration    │  │  Workflows   │  │
│  │  Server         │  │   MCP Server    │  │              │  │
│  └─────────────────┘  └─────────────────┘  └──────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐  │
│  │ Sonar Pro API   │  │ Perplexity API  │  │    Redis     │  │
│  │   Client        │  │ (Llama 3.1)     │  │   Cache      │  │
│  └─────────────────┘  └─────────────────┘  └──────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    Integration Layer                         │
│  • Rate Limiting    • Error Handling    • Performance       │
│  • Caching         • Security          • Monitoring         │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Installation & Configuration

### 1. Environment Variables

Add to your `.env` file:

```bash
# Perplexity Sonar Pro
PERPLEXITY_API_KEY=your_perplexity_api_key

# Advanced AI via Perplexity (uses same key as Perplexity research)
# OPENROUTER_API_KEY not needed - uses Perplexity API for all advanced reasoning

# Optional: Debug mode
DEBUG=false
```

### 2. MCP Server Configuration

The integration automatically updates your `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "perplexity-ask": {
      "command": "node",
      "args": ["./mcp-servers/perplexity-ask-server/perplexity-ask-mcp.js"],
      "env": {
        "PERPLEXITY_API_KEY": "${PERPLEXITY_API_KEY}",
        "DEBUG": "false"
      },
      "description": "Advanced Perplexity research with automated workflows"
    },
    "advanced-ai-integration": {
      "command": "node", 
      "args": ["./src/api/ai-integration/grok4-mcp-server.js"],
      "env": {
        "PERPLEXITY_API_KEY": "${PERPLEXITY_API_KEY}",
        "DEBUG": "false"
      },
      "description": "Advanced AI reasoning via Perplexity with multi-agent reasoning"
    }
  }
}
```

### 3. Performance Configuration

Performance budgets and monitoring:

```javascript
// Performance Budgets
const PERFORMANCE_BUDGETS = {
  perplexity: {
    maxLatency: 1500,    // ms
    maxMemory: 256,      // MB
    costBudget: 0.50     // USD per session
  },
  grok4: {
    maxLatency: 2000,    // ms
    maxMemory: 512,      // MB
    maxTokens: 6000
  }
};
```

## 🛠️ Usage Examples

### Perplexity Ask MCP Server Tools

#### 1. Real-Time Research
```javascript
// Automated during development
{
  "tool": "perplexity_research",
  "args": {
    "query": "React 19 concurrent features best practices",
    "focus": "performance",
    "context": "Building a music streaming app"
  }
}
```

#### 2. Competitive Analysis
```javascript
{
  "tool": "competitive_analysis", 
  "args": {
    "technology": "React",
    "useCase": "Music streaming platform"
  }
}
```

#### 3. Security Research
```javascript
{
  "tool": "security_research",
  "args": {
    "framework": "Express.js",
    "code_snippet": "app.use(express.static('uploads'))",
    "vulnerability_type": "file_upload_security"
  }
}
```

#### 4. API Documentation Sync
```javascript
{
  "tool": "api_documentation_fetch",
  "args": {
    "service_name": "Spotify Web API",
    "endpoint": "/v1/me/player",
    "version": "v1"
  }
}
```

#### 5. Fact-Check Code Comments
```javascript
{
  "tool": "fact_check_code_comments",
  "args": {
    "comments": "// Redis pub/sub is faster than database polling",
    "technology": "Redis"
  }
}
```

### Advanced AI Integration Tools (Perplexity-based)

#### 1. Code Analysis with Research
```javascript
{
  "tool": "analyze_code_with_research",
  "args": {
    "code": "const data = await fetch('/api/users').then(r => r.json())",
    "context": "User authentication flow",
    "focus_areas": ["security", "error_handling"]
  }
}
```

#### 2. Architectural Planning (Heavy Tier)
```javascript
{
  "tool": "architectural_planning",
  "args": {
    "requirements": "Real-time music streaming with 100k concurrent users",
    "constraints": {"budget": "$50k", "timeline": "6 months"},
    "scale": "large"
  }
}
```

#### 3. Multi-Agent Debugging
```javascript
{
  "tool": "debugging_workflow",
  "args": {
    "error": "TypeError: Cannot read property 'id' of undefined",
    "code_context": "user.profile.id in React component",
    "technology": "React",
    "environment": "production"
  }
}
```

#### 4. Performance Optimization
```javascript
{
  "tool": "performance_optimization",
  "args": {
    "code_snippet": "const heavyComputation = () => { /* expensive operation */ }",
    "performance_metrics": {"currentLatency": "2.3s"},
    "target_platform": "web",
    "optimization_goals": ["reduce_latency"]
  }
}
```

#### 5. Multi-Agent Reasoning
```javascript
{
  "tool": "multi_agent_reasoning",
  "args": {
    "problem": "Choose between microservices vs monolith for music platform",
    "domain": "software_architecture", 
    "stakeholders": ["developers", "devops", "product"],
    "complexity_level": "high"
  }
}
```

## 🔄 Automated Workflows

### 1. Competitive Analysis Workflow
- **Trigger**: Manual or technology evaluation
- **Steps**: Research alternatives → Compare technologies → Benchmark performance
- **Output**: Structured comparison report with recommendations

### 2. Security Vulnerability Research
- **Trigger**: Code analysis or security review
- **Steps**: Threat research → Vulnerability analysis → Fact-check comments
- **Output**: Security report with mitigation strategies

### 3. API Documentation Sync
- **Trigger**: API call detection
- **Steps**: Fetch docs → Analyze integration → Update documentation
- **Output**: Live documentation updates

### 4. Performance Optimization Research
- **Trigger**: Performance issue detection  
- **Steps**: Benchmark research → Code optimization → Context analysis
- **Output**: Performance improvement recommendations

### 5. Architectural Decision Workflow
- **Trigger**: Architecture planning
- **Steps**: Research → Planning → Multi-agent analysis → Benchmarking
- **Output**: Architecture Decision Record (ADR)

### 6. Debugging Assistance Workflow
- **Trigger**: Error encountered
- **Steps**: Error research → Debug analysis → Security check → Code review
- **Output**: Step-by-step solution with prevention strategies

### 7. Code Quality Enhancement
- **Trigger**: Code commit
- **Steps**: Code review → Fact-check → Analysis → Context research
- **Output**: Quality improvement suggestions

### 8. Technology Research Workflow
- **Trigger**: Technology evaluation
- **Steps**: Competitive analysis → Technology comparison → Benchmarking → Security research
- **Output**: Technology evaluation report

## 📊 Performance Metrics

### Real-Time Monitoring
- **Request latency**: p95 ≤ 1500ms (Perplexity), ≤ 2000ms (Advanced AI)
- **Success rate**: Target >95%
- **Cache hit rate**: Target >70%
- **Cost tracking**: Budget limits enforced

### Performance Budgets
```javascript
{
  "perplexity": {
    "latency": "p95 ≤ 1500ms",
    "memory": "≤ 256MB", 
    "cost": "≤ $0.50 per session"
  },
  "advanced-ai": {
    "latency": "p95 ≤ 2000ms", 
    "memory": "≤ 512MB",
    "tokens": "≤ 6000 per request"
  }
}
```

## 🔒 Security Features

### API Security
- **Rate limiting**: 20 req/min (Perplexity), 20 req/min (Advanced AI)
- **API key management**: Environment variables with validation
- **Error handling**: Graceful fallbacks and sanitized error messages
- **Request sanitization**: Input validation and output filtering

### Data Protection
- **Cache encryption**: Redis with encryption at rest
- **Citation verification**: Source credibility scoring
- **Sensitive data filtering**: Automatic removal of secrets/keys
- **Audit logging**: Request/response tracking for security analysis

## 🧪 Testing

### Integration Tests
```bash
# Test Perplexity integration
npm run test:perplexity-integration

# Test Advanced AI integration  
npm run test:advanced-ai-integration

# Test automated workflows
npm run test:ai-workflows

# Performance testing
npm run test:ai-performance
```

### Manual Testing
1. **Perplexity Research**: Query current React best practices
2. **Advanced AI Analysis**: Analyze a code snippet for security
3. **Workflow Execution**: Trigger competitive analysis workflow
4. **Performance Check**: Monitor response times and success rates

## 📈 Optimization Tips

### 1. Cache Strategy
- **Research results**: 24h TTL
- **API documentation**: 12h TTL
- **Performance data**: 6h TTL
- **Security info**: 1h TTL (fast updates)

### 2. Cost Optimization
- **Perplexity**: Use focused searches, limit results
- **Advanced AI**: Use standard Perplexity models for all reasoning tasks
- **Caching**: Aggressive caching for repeated queries
- **Batching**: Combine related requests

### 3. Performance Tuning
- **Parallel requests**: Use concurrent tool calls
- **Request optimization**: Minimize payload size
- **Smart fallbacks**: Degrade gracefully on failures
- **Monitoring**: Track and alert on budget violations

## ⚠️ Troubleshooting

### Common Issues

#### 1. API Key Errors
```bash
# Verify environment variables
node -e "console.log(process.env.PERPLEXITY_API_KEY ? 'Perplexity: ✓' : 'Perplexity: ✗')"
# OpenRouter not needed - using only Perplexity API
```

#### 2. Rate Limiting
- **Error**: "Rate limit exceeded"
- **Solution**: Implement exponential backoff, check budgets
- **Prevention**: Monitor usage patterns, optimize queries

#### 3. MCP Server Not Starting
```bash
# Check server logs
tail -f ~/.cursor/logs/mcp-server.log

# Test server directly
node ./mcp-servers/perplexity-ask-server/perplexity-ask-mcp.js
```

#### 4. Performance Issues
- **Monitor**: Check response times in server logs
- **Optimize**: Review query complexity and caching
- **Scale**: Increase rate limits if needed

### Debug Commands
```bash
# Enable debug mode
export DEBUG=true

# Test individual components
npm run test:ai-components

# Monitor performance
npm run monitor:ai-performance

# Check system health
npm run health:ai-integration
```

## 🔄 Maintenance

### Regular Tasks
1. **Weekly**: Review performance metrics and cost usage
2. **Monthly**: Update API documentation cache and security research
3. **Quarterly**: Evaluate new AI models and optimization opportunities

### Monitoring Setup
- **Alerts**: Set up alerts for budget violations and performance degradation
- **Dashboards**: Monitor success rates, latency, and usage patterns
- **Logs**: Centralized logging for debugging and analysis

## 📚 Additional Resources

### Documentation
- [Perplexity API Documentation](https://docs.perplexity.ai/)
- [OpenRouter API Documentation](https://openrouter.ai/docs)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [Cursor Workflow Documentation](https://cursor.sh/docs/workflows)

### Best Practices
- **Query Optimization**: Write specific, focused queries
- **Error Handling**: Implement robust error handling and fallbacks
- **Cost Management**: Monitor usage and implement budget controls
- **Security**: Regular security audits and key rotation

## 🎯 Next Steps

### Phase 3 Enhancements
1. **GPT-5 Integration**: Add support when available
2. **Claude 3.7 Integration**: Multi-model reasoning
3. **Custom Fine-Tuning**: Domain-specific model optimization
4. **Advanced Analytics**: Deeper performance insights
5. **Team Collaboration**: Shared research and knowledge base

---

## ✅ Implementation Checklist

- [x] Perplexity Sonar Pro API integration
- [x] Advanced AI reasoning via Perplexity API configuration
- [x] MCP server deployment
- [x] 8 automated research workflows
- [x] Performance monitoring and budgets
- [x] Security features and rate limiting
- [x] Comprehensive documentation
- [x] Integration testing
- [x] Error handling and fallbacks
- [x] Caching and optimization

**Status**: ✅ **Phase 2 Complete - Advanced AI Integration Operational**
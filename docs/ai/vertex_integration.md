# 🧠 Vertex AI Integration Guide

This guide covers the comprehensive Phase 2 Vertex AI integration in EchoTune AI, providing enterprise-grade AI capabilities with cost optimization, monitoring, and evaluation.

## 📋 Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Model Invocation](#model-invocation)
- [Cost Management](#cost-management)
- [Evaluation & Testing](#evaluation--testing)
- [Agent Orchestration](#agent-orchestration)
- [Monitoring & Metrics](#monitoring--metrics)
- [Error Handling](#error-handling)
- [Security](#security)
- [Troubleshooting](#troubleshooting)

## 🌟 Overview

The Vertex AI integration provides:

- **🚀 Automated Endpoint Deployment**: Idempotent deployment with environment-specific configuration
- **🔄 Polymorphic Invocation**: Unified interface supporting multiple AI tasks
- **💰 Cost Optimization**: Real-time cost tracking with budget controls
- **📊 Comprehensive Metrics**: Prometheus-compatible monitoring with latency/cost/failure tracking
- **🧪 Evaluation Framework**: Automated quality assessment with reporting
- **🤖 Agent Orchestration**: Smart routing between multiple AI providers
- **🛡️ Error Resilience**: Circuit breakers, retry logic, and fallback strategies

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Required environment variables
export GCP_PROJECT_ID="your-project-id"
export GCP_VERTEX_LOCATION="us-central1"
export VERTEX_PRIMARY_TEXT_MODEL="text-bison@latest"
export VERTEX_EMBED_MODEL="textembedding-gecko@latest"

# Optional cost optimization
export AI_ENABLE_COST_TRACKING="true"
export AI_CIRCUIT_BREAKER_ENABLED="true"
```

### 2. Deploy Endpoints

```bash
# Dry run to see what will be deployed
npm run ai:deploy:dry-run

# Deploy all configured endpoints
npm run ai:deploy

# Check deployment status
npm run ai:status
```

### 3. Run Evaluation

```bash
# List available test suites
npm run ai:eval:list

# Run baseline evaluation
npm run ai:eval:baseline

# Custom evaluation
npm run ai:eval -- --model text-bison@latest --suite custom_tests
```

### 4. Monitor Performance

```bash
# Check agent health
npm run ai:health

# View metrics
npm run ai:metrics

# Access web dashboard
curl http://localhost:3000/api/ai/metrics
```

## ⚙️ Configuration

### Model Registry (`config/ai/vertex_registry.json`)

Defines available models, endpoints, and deployment configurations:

```json
{
  "models": {
    "text-generation": {
      "primary": {
        "modelId": "text-bison@latest",
        "displayName": "Text Bison Latest",
        "capabilities": ["text-generation", "conversation", "reasoning"],
        "maxTokens": 8192,
        "latencyTier": "medium",
        "costTier": "standard"
      }
    }
  },
  "endpoints": {
    "text-generation-primary": {
      "modelId": "text-bison@latest",
      "machineType": "n1-standard-2",
      "minReplicas": 1,
      "maxReplicas": 3
    }
  }
}
```

### Pricing Configuration (`config/ai/pricing.json`)

Cost estimation tables with fallback heuristics:

```json
{
  "pricing": {
    "text-generation": {
      "text-bison@latest": {
        "inputCostPer1KTokens": 0.000125,
        "outputCostPer1KTokens": 0.000125
      }
    }
  },
  "fallback_estimation": {
    "charactersPerToken": 4,
    "defaultInputCostPer1KTokens": 0.000125
  }
}
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GCP_PROJECT_ID` | Google Cloud project ID | Required |
| `GCP_VERTEX_LOCATION` | Vertex AI region | `us-central1` |
| `VERTEX_PRIMARY_TEXT_MODEL` | Primary text model | `text-bison@latest` |
| `AI_RETRY_MAX_ATTEMPTS` | Maximum retry attempts | `3` |
| `AI_TIMEOUT_MS` | Request timeout | `30000` |
| `AI_ENABLE_COST_TRACKING` | Enable cost tracking | `true` |
| `AI_CIRCUIT_BREAKER_ENABLED` | Enable circuit breakers | `true` |

## 🚀 Deployment

### Automated Deployment

The deployment script provides idempotent endpoint management:

```bash
# Deploy all endpoints
node src/ai/vertex/deploymentScript.js deploy

# Deploy specific endpoint
node src/ai/vertex/deploymentScript.js deploy text-generation-primary

# Force deployment (ignore existing)
node src/ai/vertex/deploymentScript.js deploy --force

# Verbose output
node src/ai/vertex/deploymentScript.js deploy --verbose
```

### Deployment Features

- **Idempotency**: Safe to run multiple times
- **Environment Overrides**: Dev/staging/prod configurations
- **Label Management**: Automatic labeling for service discovery
- **Warm-up Testing**: Post-deployment health validation
- **Progress Tracking**: Real-time deployment status

### Manual Deployment Steps

If you need to deploy manually:

1. **Create Endpoint**:
```javascript
const { VertexEndpointManager } = require('./src/ai/vertex/endpointManager');

const manager = new VertexEndpointManager();
await manager.deployEndpoint('text-generation-primary', { wait: true });
```

2. **Verify Deployment**:
```bash
npm run ai:list
```

## 🔧 Model Invocation

### Using the Polymorphic Invoker

```javascript
const { VertexInvoker, AIRequest } = require('./src/ai/providers/vertexInvoker');

// Initialize invoker
const invoker = new VertexInvoker();
await invoker.initialize();

// Create request
const request = new AIRequest(
  'text-generation',
  'text-bison@latest',
  { prompt: 'Recommend energetic rock music for working out' },
  { 
    temperature: 0.7,
    maxTokens: 512,
    userId: 'user123', // Automatically hashed
    traceId: 'req-abc-123'
  }
);

// Execute request
const response = await invoker.invoke(request);
console.log(response.text);
console.log(`Cost: $${response.costEstimateUsd}`);
console.log(`Latency: ${response.latencyMs}ms`);
```

### Using the Agent Router

```javascript
const AgentRouter = require('./src/ai/agent/router');

const router = new AgentRouter();

// Simple routing (auto-selects best provider)
const response = await router.route({
  type: 'text-generation',
  payload: { prompt: 'Suggest jazz music similar to Miles Davis' }
});

// Strategic routing
const response = await router.route(request, {
  strategy: 'low-latency', // or 'low-cost', 'high-quality'
  maxLatency: 2000,
  maxCost: 0.01
});
```

### Integration with Existing LLM Providers

The Vertex invoker extends `BaseLLMProvider` for seamless integration:

```javascript
// Use with existing chat system
const messages = [
  { role: 'user', content: 'Recommend upbeat music for a party' }
];

const response = await invoker.generateCompletion(messages, {
  temperature: 0.8,
  maxTokens: 256
});
```

## 💰 Cost Management

### Real-time Cost Tracking

```javascript
// Get current cost report
const aiMetrics = require('./src/metrics/aiMetrics');
const costReport = await aiMetrics.generateCostReport('day');

console.log(`Daily cost: $${costReport.totalCost}`);
console.log('Cost breakdown:', costReport.breakdown);
```

### Cost Optimization Features

1. **Token Estimation**: Heuristic-based cost calculation
2. **Model Fallbacks**: Automatic cheaper model selection
3. **Budget Alerts**: Configurable cost thresholds
4. **Cache Integration**: Future caching for repeat requests

### Cost Monitoring Endpoints

```bash
# Daily cost summary
curl http://localhost:3000/api/ai/metrics | jq '.data.cost'

# Prometheus metrics
curl http://localhost:3000/metrics | grep echotune_ai_cost
```

## 🧪 Evaluation & Testing

### Test Suite Format

Create JSONL test files in `src/ai/eval/test-suites/`:

```jsonl
{"id": "music_rec_1", "input": "I love energetic rock music", "expected_tags": ["rock", "energetic"], "type": "text-generation"}
{"id": "music_rec_2", "input": "Suggest calming music for sleep", "expected_tags": ["calm", "sleep"], "type": "text-generation"}
```

### Running Evaluations

```bash
# List available test suites
node scripts/ai/run_eval.js list

# Run evaluation
node scripts/ai/run_eval.js run \
  --model text-bison@latest \
  --suite baseline_recommendations \
  --temperature 0.1 \
  --max-tokens 512

# Quick evaluation
npm run ai:eval:baseline
```

### Evaluation Reports

Generated reports include:

- **Quality Metrics**: Tag matching, token efficiency, response quality
- **Performance Metrics**: Latency distribution, success rates
- **Cost Analysis**: Total cost, cost per request
- **Recommendations**: Actionable improvements

Example report structure:
```json
{
  "stats": {
    "successRate": 0.95,
    "total": 10,
    "successful": 9
  },
  "latency": {
    "mean": 1250,
    "p95": 2100,
    "p99": 2800
  },
  "quality": {
    "averageTagMatch": 0.87,
    "tokenEfficiency": 3.2
  }
}
```

## 🤖 Agent Orchestration

### Multi-Provider Routing

The agent router intelligently selects providers based on:

- **Task Type**: Different models for generation, embeddings, classification
- **Performance Constraints**: Latency and cost thresholds
- **Provider Availability**: Health checks and circuit breaker status
- **Historical Performance**: Adaptive routing based on success rates

### Routing Strategies

```javascript
// Task-based routing (default)
await router.route(request, { strategy: 'task-based' });

// Performance-optimized routing
await router.route(request, { 
  strategy: 'low-latency',
  maxLatency: 1000 
});

// Cost-optimized routing
await router.route(request, { 
  strategy: 'low-cost',
  maxCost: 0.005 
});

// Quality-optimized routing
await router.route(request, { strategy: 'high-quality' });
```

### Fallback Chains

Automatic fallback progression:
1. **Primary**: Vertex AI (optimal quality)
2. **Fallback**: OpenAI (reliable backup)
3. **Backup**: Mock provider (development/testing)

## 📊 Monitoring & Metrics

### Prometheus Metrics

Available at `http://localhost:3000/metrics`:

```
# Invocation counters
echotune_ai_invocations_total{provider="vertex",model="text-bison",status="success"} 145
echotune_ai_invocations_total{provider="vertex",model="text-bison",status="error"} 3

# Latency histograms
echotune_ai_latency_ms_bucket{provider="vertex",model="text-bison",le="1000"} 98
echotune_ai_latency_ms_bucket{provider="vertex",model="text-bison",le="2500"} 142

# Cost tracking
echotune_ai_cost_usd_total{provider="vertex",model="text-bison"} 0.023
```

### Performance Dashboard

Access detailed metrics via API:

```bash
# Performance overview
curl http://localhost:3000/api/ai/metrics

# Routing analytics  
curl http://localhost:3000/api/ai/routing

# Agent health status
curl http://localhost:3000/api/ai/health
```

### Key Metrics

- **Latency**: Request processing time distribution
- **Cost**: Real-time cost tracking per provider/model
- **Success Rate**: Percentage of successful requests
- **Circuit Breaker State**: Provider health status
- **Token Usage**: Input/output token consumption
- **Error Distribution**: Failure classification

## 🛡️ Error Handling

### Error Classification

Errors are automatically classified for appropriate handling:

```javascript
// Retryable errors (with exponential backoff)
- RateLimitError: 429 responses, API quotas
- TransientError: Network timeouts, 5xx errors
- EndpointError: Temporary deployment issues

// Non-retryable errors (immediate failure)
- AuthenticationError: 401/403 responses
- ValidationError: Invalid input parameters
- FatalModelError: Model unavailable, configuration issues
```

### Circuit Breaker Protection

```javascript
// Circuit breaker states
- CLOSED: Normal operation
- OPEN: Blocking requests after failure threshold
- HALF_OPEN: Testing recovery with limited requests

// Configuration
{
  failureThreshold: 5,    // Failures before opening
  resetTimeout: 60000,    // Time before retry attempt
  monitorTimeout: 30000   // Half-open monitoring period
}
```

### Retry Strategy

Exponential backoff with jitter:

```javascript
// Default retry configuration
{
  maxRetries: 3,
  baseDelay: 1000,        // 1 second
  maxDelay: 30000,        // 30 seconds
  backoffMultiplier: 2,   // Double each retry
  jitter: true            // Random variation
}
```

## 🔒 Security

### Authentication

- **Google ADC**: Application Default Credentials preferred
- **Service Account**: JSON key fallback for development
- **Workload Identity**: Future federation support

### Data Protection

- **User ID Hashing**: SHA-256 anonymization
- **Request Sanitization**: Input validation and cleaning
- **Audit Logging**: Structured request/response logging
- **PII Avoidance**: No sensitive data in logs

### Environment Security

```bash
# Required for production
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"

# Or use ADC
gcloud auth application-default login
```

### Access Control

Service account requires minimal permissions:
- `aiplatform.endpoints.predict`
- `aiplatform.endpoints.list`
- `aiplatform.endpoints.get`

## 🔧 Troubleshooting

### Common Issues

#### 1. Deployment Failures

```bash
# Check project configuration
echo $GCP_PROJECT_ID
gcloud config get-value project

# Verify credentials
gcloud auth list
gcloud auth application-default print-access-token

# Check API enablement
gcloud services list --enabled | grep aiplatform
```

#### 2. Authentication Errors

```bash
# Re-authenticate
gcloud auth application-default login

# Check service account permissions
gcloud projects get-iam-policy $GCP_PROJECT_ID

# Verify workload identity (if using)
gcloud iam workload-identity-pools describe $POOL_ID
```

#### 3. High Latency

```bash
# Check endpoint health
npm run ai:list

# Monitor circuit breaker status
npm run ai:health

# Review metrics
curl http://localhost:3000/api/ai/metrics
```

#### 4. Cost Overruns

```bash
# Check current costs
npm run ai:analytics

# Review model usage
curl http://localhost:3000/metrics | grep cost

# Switch to economy models
export VERTEX_PRIMARY_TEXT_MODEL="text-bison@001"
```

### Debug Mode

Enable verbose logging:

```bash
export NODE_ENV=development
export DEBUG=echotune:ai:*

# Run with debug output
npm run ai:deploy -- --verbose
```

### Health Checks

```bash
# Quick health check
npm run ai:health

# Detailed provider status
node -e "
const AgentRouter = require('./src/ai/agent/router');
const router = new AgentRouter();
router.healthCheck().then(console.log);
"
```

### Performance Analysis

```bash
# Latency analysis
node scripts/ai/run_eval.js run \
  --model text-bison@latest \
  --suite baseline_recommendations \
  --verbose

# Cost analysis
curl http://localhost:3000/api/ai/metrics | jq '.data.cost'
```

## 🚀 Advanced Usage

### Custom Evaluation Suites

Create domain-specific test cases:

```jsonl
{"id": "playlist_gen_1", "input": "Create a workout playlist", "expected_tags": ["playlist", "workout"], "metadata": {"genre": "electronic"}}
```

### Performance Tuning

```javascript
// Optimize for latency
const request = new AIRequest('text-generation', 'text-bison@001', payload, {
  temperature: 0.1,  // Lower for consistency
  maxTokens: 256     // Reduce for speed
});

// Optimize for cost
const router = new AgentRouter({
  defaultProvider: 'vertex',
  costThreshold: 0.001  // Prefer cheaper models
});
```

### Custom Metrics

```javascript
// Add custom metrics
const aiMetrics = require('./src/metrics/aiMetrics');

aiMetrics.recordCustomMetric('music_recommendations_generated', 1, {
  genre: 'rock',
  user_satisfaction: 'high'
});
```

## 📚 API Reference

### VertexInvoker

```typescript
class VertexInvoker {
  async initialize(): Promise<void>
  async invoke(request: AIRequest): Promise<AIResponse>
  isAvailable(): boolean
  getCapabilities(): object
}
```

### AIRequest

```typescript
class AIRequest {
  constructor(
    type: string,           // 'text-generation', 'embeddings', 'rerank'
    model: string,          // Model identifier
    payload: object,        // Request payload
    options?: object        // Optional parameters
  )
}
```

### AgentRouter

```typescript
class AgentRouter {
  async route(request: AIRequest, options?: object): Promise<AIResponse>
  async healthCheck(): Promise<object>
  getAnalytics(): object
  getProviders(): object
}
```

## 🤝 Contributing

### Adding New Models

1. Update `config/ai/vertex_registry.json`
2. Add pricing to `config/ai/pricing.json`
3. Create test cases for evaluation
4. Update documentation

### Creating Test Suites

1. Create JSONL file in `src/ai/eval/test-suites/`
2. Follow the test case schema
3. Run evaluation to validate
4. Document expected outcomes

---

## 📞 Support

For issues and questions:
- Check the [troubleshooting section](#troubleshooting)
- Review logs with `npm run ai:health`
- Monitor metrics at `/api/ai/metrics`
- Contact the development team

This integration provides enterprise-grade AI capabilities with comprehensive monitoring, cost optimization, and quality assurance for EchoTune AI's music recommendation system.
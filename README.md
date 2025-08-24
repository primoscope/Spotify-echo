## LLM Providers
This project now supports pluggable LLM backends:
- OpenRouter (default) with free model enforcement
- Google Gemini (direct API)
- **Google Vertex AI** (enterprise-grade with comprehensive monitoring)
- Mock (deterministic for CI)

Configure via environment variables (see `.env.template` and `docs/LLM_INTEGRATION.md`).

Live provider tests require setting `LIVE_LLM_TEST=1` and the corresponding API key secret locally or in CI. Mock mode requires no external keys.

## 🧠 Vertex AI Integration (Phase 2)

EchoTune AI now includes enterprise-grade Vertex AI integration with comprehensive cost optimization, monitoring, and evaluation capabilities.

### ✨ Key Features

- **🚀 Automated Endpoint Deployment**: Idempotent deployment with environment-specific configuration
- **💰 Real-time Cost Tracking**: Comprehensive cost monitoring with budget controls
- **📊 Performance Metrics**: Prometheus-compatible metrics for latency, cost, and failure tracking
- **🧪 Evaluation Framework**: Automated quality assessment with detailed reporting
- **🤖 Multi-LLM Orchestration**: Intelligent routing between providers based on cost/latency/quality
- **🛡️ Enterprise Error Handling**: Circuit breakers, retry logic, and fallback strategies

### 🚀 Quick Start

```bash
# Set up environment
export GCP_PROJECT_ID="your-project-id"
export GCP_VERTEX_LOCATION="us-central1"

# Deploy Vertex AI endpoints
npm run ai:deploy

# Run evaluation tests
npm run ai:eval:baseline

# Monitor performance
npm run ai:health
```

### 📚 Documentation

- **[Complete Vertex AI Guide](docs/ai/vertex_integration.md)** - Comprehensive integration documentation
- **[API Configuration](config/ai/)** - Model registry and pricing configuration
- **[Evaluation Framework](src/ai/eval/)** - Automated testing and quality assessment

### 🎯 Available Commands

```bash
# Deployment
npm run ai:deploy              # Deploy all endpoints
npm run ai:deploy:dry-run      # Preview deployment changes
npm run ai:list                # List deployed endpoints

# Evaluation & Testing
npm run ai:eval:list           # List available test suites
npm run ai:eval:baseline       # Run baseline music recommendation tests
npm run ai:eval -- --model text-bison@latest --suite custom_tests

# Monitoring & Analytics
npm run ai:health              # Check provider health
npm run ai:analytics           # View routing analytics
npm run ai:metrics             # Get Prometheus metrics
```

### 💡 Integration Examples

**Simple AI Request:**
```javascript
const { VertexInvoker, AIRequest } = require('./src/ai/providers/vertexInvoker');

const invoker = new VertexInvoker();
await invoker.initialize();

const request = new AIRequest(
  'text-generation',
  'text-bison@latest', 
  { prompt: 'Recommend energetic rock music for working out' }
);

const response = await invoker.invoke(request);
console.log(`Response: ${response.text}`);
console.log(`Cost: $${response.costEstimateUsd}, Latency: ${response.latencyMs}ms`);
```

**Smart Agent Routing:**
```javascript
const AgentRouter = require('./src/ai/agent/router');

const router = new AgentRouter();
const response = await router.route(request, {
  strategy: 'low-cost',    // or 'low-latency', 'high-quality'
  maxCost: 0.01
});
```

For detailed documentation, configuration options, and advanced usage, see the [complete Vertex AI integration guide](docs/ai/vertex_integration.md).

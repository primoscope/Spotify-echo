# LLM Abstraction and Provider Integration Guide

## Overview

EchoTune AI features a comprehensive, provider-agnostic LLM abstraction system that enables seamless integration with multiple AI providers while providing robust error handling, telemetry, and model management capabilities.

## Architecture

### Core Components

1. **Base Provider Interface** (`BaseLLMProvider`)
2. **Dynamic Model Registry** (`ModelRegistry`)
3. **Telemetry System** (`LLMTelemetry`)
4. **Provider Manager** (`LLMProviderManager`)
5. **API Routes** (`/api/settings/llm-providers/`)
6. **Frontend Components** (`ProviderPanel`, `LLMContext`)

## Features

### ✅ Provider-Agnostic Design
- Unified interface for all LLM providers
- Automatic fallback between providers
- Hot-swappable provider configuration

### ✅ Dynamic Model Registry
- Automatic model discovery and availability checking
- Comprehensive model metadata (capabilities, costs, performance)
- Smart model recommendations based on task requirements
- Real-time model status monitoring

### ✅ Retry/Backoff Logic
- Exponential backoff with configurable parameters
- Intelligent error classification (retryable vs non-retryable)
- Automatic timeout handling
- Provider health monitoring

### ✅ Comprehensive Telemetry
- Real-time performance metrics collection
- Historical data analysis and trends
- Performance insights and recommendations
- Export capabilities (JSON, CSV)

### ✅ Secret Management
- Environment-based configuration
- API key validation and format checking
- Secure credential storage and masking
- Automatic key refresh for supported providers

### ✅ Test Suites
- Unit tests for all core components
- Integration tests for end-to-end workflows
- Performance testing capabilities
- Mock providers for testing

## Supported Providers

| Provider | Models | Capabilities | Status |
|----------|---------|-------------|---------|
| **OpenAI** | GPT-4o, GPT-4o-mini, GPT-4-turbo, GPT-3.5-turbo | Text, Vision, Function-calling, JSON-mode | ✅ Full Support |
| **Google Gemini** | Gemini-2.0-flash, Gemini-1.5-pro, Gemini-1.5-flash | Text, Vision, Audio, Function-calling, Code-execution | ✅ Full Support |
| **OpenRouter** | Claude-3.5-sonnet, Claude-3-haiku, Llama-3.1-405B, Mixtral-8x7B | Text, Vision, Function-calling, Multi-provider access | ✅ Full Support |
| **Azure OpenAI** | GPT-4, GPT-3.5-turbo | Text, Vision, Function-calling | ✅ Full Support |
| **Mock Provider** | Mock-fast | Text | ✅ Testing/Demo |

## Quick Start

### 1. Environment Setup

```bash
# Core LLM Provider Configuration
LLM_PROVIDER=gemini  # Default provider

# OpenAI
OPENAI_API_KEY=sk-your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini

# Google Gemini  
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash-exp

# OpenRouter
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Azure OpenAI
AZURE_OPENAI_API_KEY=your_azure_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=your-deployment-name
```

### 2. Basic Usage

```javascript
const llmProviderManager = require('./src/chat/llm-provider-manager');
const modelRegistry = require('./src/chat/model-registry');
const llmTelemetry = require('./src/chat/llm-telemetry');

// Initialize systems
await llmProviderManager.initialize();
await modelRegistry.initialize();
llmTelemetry.initialize();

// Send a message
const response = await llmProviderManager.sendMessage('Hello, how are you?');
console.log(response.response); // AI response
console.log(response.provider); // Provider used
console.log(response.model); // Model used
```

### 3. Advanced Usage

```javascript
// Get model recommendation
const recommendation = modelRegistry.recommendModel({
  capabilities: ['text', 'vision'],
  maxCost: 0.01,
  maxLatency: 3000,
  preferOpenSource: false
});

// Use specific provider
const response = await llmProviderManager.sendMessage('Analyze this image', {
  provider: 'gemini',
  model: 'gemini-1.5-pro'
});

// Get performance insights
const insights = llmTelemetry.getPerformanceInsights();
console.log(insights.recommendations); // Performance recommendations
console.log(insights.alerts); // Health alerts
```

## API Reference

### Model Registry API

#### Get All Models
```http
GET /api/settings/llm-providers/models
GET /api/settings/llm-providers/models?provider=openai
GET /api/settings/llm-providers/models?capability=vision&maxCost=0.01
```

#### Get Model Details
```http
GET /api/settings/llm-providers/models/openai/gpt-4o
```

#### Model Recommendation
```http
POST /api/settings/llm-providers/models/recommend
Content-Type: application/json

{
  "capabilities": ["text", "vision"],
  "maxCost": 0.01,
  "maxLatency": 5000,
  "preferOpenSource": false
}
```

#### Refresh Model Registry
```http
POST /api/settings/llm-providers/models/refresh
```

### Telemetry API

#### Get Telemetry Data
```http
GET /api/settings/llm-providers/telemetry
GET /api/settings/llm-providers/telemetry?provider=openai
GET /api/settings/llm-providers/telemetry?hours=24
```

#### Export Telemetry
```http
GET /api/settings/llm-providers/telemetry/export?format=json
GET /api/settings/llm-providers/telemetry/export?format=csv
```

#### Reset Telemetry
```http
POST /api/settings/llm-providers/telemetry/reset
```

## Provider Integration

### Creating a Custom Provider

```javascript
const BaseLLMProvider = require('./src/chat/llm-providers/base-provider');

class CustomProvider extends BaseLLMProvider {
  constructor(apiKey, config = {}) {
    super({
      enableTelemetry: true,
      maxRetries: 3,
      baseDelay: 1000,
      ...config
    });
    this.apiKey = apiKey;
  }

  async _generateCompletion(messages, options = {}) {
    // Implement your provider's API call
    const response = await this.callProviderAPI(messages, options);
    return response;
  }

  validateConfig() {
    return !!this.apiKey;
  }

  getCapabilities() {
    return {
      streaming: true,
      functionCalling: false,
      maxTokens: 4096,
      supportedModels: ['your-model-1', 'your-model-2']
    };
  }
}
```

### Registering the Provider

```javascript
// Register with provider manager
const customProvider = new CustomProvider('your-api-key');
await customProvider.initialize();

llmProviderManager.providers.set('custom', customProvider);

// Register with telemetry system
llmTelemetry.registerProvider('custom', customProvider);

// Add to model registry
modelRegistry.models.set('custom', new Map([
  ['your-model-1', {
    name: 'Your Model 1',
    description: 'Custom model description',
    capabilities: ['text'],
    maxTokens: 4096,
    contextWindow: 8192,
    costPer1kTokens: { input: 0.001, output: 0.002 },
    latencyTier: 'fast',
    qualityTier: 'good',
    available: false,
    provider: 'custom'
  }]
]));
```

## Model Registry Usage

### Filtering Models

```javascript
// Get all vision-capable models under $0.005 per 1K tokens
const visionModels = modelRegistry.getAvailableModels({
  capabilities: ['vision'],
  maxCost: 0.005
});

// Get fast models with large context windows
const fastLargeContextModels = modelRegistry.getAvailableModels({
  latencyTier: 'fast',
  minContextWindow: 100000
});

// Get all available models for a specific provider
const geminiModels = modelRegistry.getProviderModels('gemini', true);
```

### Smart Recommendations

```javascript
// For code generation tasks
const codeModel = modelRegistry.recommendModel({
  capabilities: ['text', 'function-calling'],
  maxLatency: 3000,
  minQuality: 'high'
});

// For image analysis with cost constraints
const visionModel = modelRegistry.recommendModel({
  capabilities: ['text', 'vision'],
  maxCost: 0.01,
  maxLatency: 5000
});

// For research tasks requiring large context
const researchModel = modelRegistry.recommendModel({
  capabilities: ['text'],
  minContextWindow: 500000,
  minQuality: 'highest'
});
```

## Telemetry and Monitoring

### Performance Metrics

The telemetry system automatically collects:

- **Request metrics**: Total requests, successes, failures
- **Latency metrics**: Average response time, percentiles
- **Reliability metrics**: Success rates, retry counts
- **Error tracking**: Recent errors with timestamps and context

### Getting Insights

```javascript
// Get current performance snapshot
const currentMetrics = llmTelemetry.getCurrentMetrics();

// Get performance recommendations
const insights = llmTelemetry.getPerformanceInsights();

// Check for alerts
insights.alerts.forEach(alert => {
  if (alert.severity === 'critical') {
    console.error(`CRITICAL: ${alert.message}`);
  }
});

// Get historical trends
const history = llmTelemetry.getMetricsHistory(24); // Last 24 hours
```

### Exporting Data

```javascript
// Export as JSON
const jsonData = llmTelemetry.exportMetrics('json');

// Export as CSV for spreadsheet analysis
const csvData = llmTelemetry.exportMetrics('csv');

// Save to file
const fs = require('fs');
fs.writeFileSync('telemetry-data.json', jsonData);
```

## Error Handling and Retry Logic

### Retry Configuration

```javascript
const provider = new OpenAIProvider(apiKey, {
  maxRetries: 5,           // Maximum retry attempts
  baseDelay: 2000,         // Initial delay (2 seconds)
  maxDelay: 60000,         // Maximum delay (60 seconds) 
  backoffMultiplier: 2,    // Exponential backoff multiplier
  timeout: 30000           // Request timeout (30 seconds)
});
```

### Error Classification

The system automatically determines which errors are retryable:

**Retryable Errors:**
- Network timeouts and connection errors
- HTTP 429 (Rate Limit Exceeded)
- HTTP 5xx (Server Errors)
- Temporary service unavailability

**Non-Retryable Errors:**
- HTTP 401/403 (Authentication/Authorization)
- HTTP 400 (Bad Request - malformed input)
- Quota exceeded errors
- Invalid API key errors

### Custom Error Handling

```javascript
try {
  const response = await llmProviderManager.sendMessage('Hello');
} catch (error) {
  if (error.message.includes('rate_limit')) {
    // Handle rate limiting specifically
    console.log('Rate limited, waiting before retry...');
    await new Promise(resolve => setTimeout(resolve, 60000));
  } else if (error.code === 'AUTHENTICATION_FAILED') {
    // Handle auth errors
    console.error('Please check your API key configuration');
  }
}
```

## Frontend Integration

### React Context Usage

```jsx
import { LLMProvider, useLLM } from './contexts/LLMContext';

function App() {
  return (
    <LLMProvider>
      <ChatInterface />
    </LLMProvider>
  );
}

function ChatInterface() {
  const {
    currentProvider,
    providers,
    switchProvider,
    sendMessage,
    loading
  } = useLLM();

  const handleSend = async (message) => {
    const result = await sendMessage(message);
    if (result.success) {
      console.log('Response:', result.response);
    }
  };

  return (
    <div>
      <ProviderPanel />
      <MessageInterface onSend={handleSend} />
    </div>
  );
}
```

### Enhanced Provider Panel

The `ProviderPanel` component now includes:

- **Dynamic model selection** based on availability
- **Real-time performance metrics** display
- **Model information** with capabilities and costs
- **Error history** and health indicators
- **Expandable details** view

## Testing

### Running Tests

```bash
# Run all LLM abstraction tests
npm test tests/integration/llm-abstraction.test.js
npm test tests/unit/model-registry.test.js
npm test tests/unit/llm-telemetry.test.js

# Run with coverage
npm test -- --coverage
```

### Mock Provider for Testing

```javascript
const MockProvider = require('./src/chat/llm-providers/mock-provider');

// Use in tests
const mockProvider = new MockProvider();
await mockProvider.initialize();

const response = await mockProvider.generateCompletion([
  { role: 'user', content: 'Hello' }
]);

expect(response.content).toBe('Mock response');
```

## Performance Optimization

### Best Practices

1. **Provider Selection**: Use the model registry to choose optimal models for your use case
2. **Caching**: Implement response caching for repeated queries
3. **Batch Processing**: Group similar requests when possible
4. **Timeout Configuration**: Set appropriate timeouts based on your use case
5. **Fallback Strategy**: Always configure fallback providers

### Monitoring Performance

```javascript
// Set up performance monitoring
const performanceMonitor = setInterval(async () => {
  const insights = llmTelemetry.getPerformanceInsights();
  
  // Check for performance issues
  insights.alerts.forEach(alert => {
    if (alert.severity === 'high' || alert.severity === 'critical') {
      // Send notification or take corrective action
      console.warn(`Performance Alert: ${alert.message}`);
    }
  });
}, 60000); // Check every minute
```

## Security Considerations

### API Key Management

- Store API keys in environment variables
- Use key rotation where supported by providers
- Implement key validation and format checking
- Monitor for key exposure in logs

### Request Validation

- Sanitize all user inputs
- Implement rate limiting
- Log security events
- Use HTTPS for all API communications

## Troubleshooting

### Common Issues

1. **Provider Not Available**
   - Check API key configuration
   - Verify network connectivity
   - Review provider status page

2. **High Latency**
   - Switch to faster models
   - Check network conditions
   - Review retry configuration

3. **Authentication Errors**
   - Verify API key format and validity
   - Check provider-specific requirements
   - Review quota limits

### Debug Mode

```javascript
// Enable detailed logging
const provider = new OpenAIProvider(apiKey, {
  debug: true,
  enableTelemetry: true
});

// Check telemetry for issues
const telemetry = provider.getTelemetry();
console.log('Recent errors:', telemetry.errors);
```

## Contributing

### Adding New Providers

1. Extend `BaseLLMProvider`
2. Implement required methods
3. Add model definitions to registry
4. Create unit tests
5. Update documentation

### Extending Telemetry

1. Add new metrics to base provider
2. Update telemetry collection logic
3. Add insights and recommendations
4. Update export formats

## Changelog

### Version 2.3.0
- ✅ Dynamic model registry with auto-discovery
- ✅ Enhanced telemetry system with insights
- ✅ Comprehensive retry/backoff logic
- ✅ Advanced UI components with model selection
- ✅ Complete test suite coverage
- ✅ Performance monitoring and recommendations

### Future Roadmap

- [ ] Streaming response support
- [ ] Function calling integration
- [ ] Advanced caching strategies
- [ ] Multi-modal input support
- [ ] Custom model fine-tuning integration
- [ ] Real-time performance dashboards

## Support

For issues, feature requests, or questions:
- Create an issue in the GitHub repository
- Check existing documentation and tests
- Review telemetry data for performance insights

---

*This documentation is part of the EchoTune AI project. For more information, see the main [README.md](./README.md).*
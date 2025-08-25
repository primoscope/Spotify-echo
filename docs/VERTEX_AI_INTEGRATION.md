# Vertex AI Integration Guide

## Overview

This implementation provides production-ready access to **Anthropic's Claude Opus 4.1**, **Google's Gemini 2.5 Pro**, and **Google's Gemini 2.5 Flash** through Google Cloud Vertex AI.

## 🚨 Critical Features

- **NO MOCK RUNS**: All tests execute real API calls to Google Cloud
- **Live Endpoint Validation**: Comprehensive testing with actual GCP credentials
- **Production-Ready Error Handling**: API rate limits, authentication failures, quota issues, timeouts, and safety blocks
- **Idempotent Operations**: Safe for retry and production use

## Technical Architecture

### Core Components

1. **Configuration Module** (`src/config/vertex_config.py`)
   - Pydantic-based configuration with environment validation
   - Secure handling of GCP credentials and model configurations
   - Support for multiple environments and overrides

2. **Vertex AI Service** (`src/services/vertex_ai_service.py`)
   - Unified interface for Claude Opus 4.1 and Gemini 2.5 models
   - Automatic provider routing based on model ID
   - Comprehensive error handling and retry logic
   - Rate limiting and quota management

3. **Integration Tests** (`tests/integration/test_vertex_ai_live.py`)
   - Complete test suite using live API endpoints
   - Authentication, model access, streaming, and error scenario validation
   - Performance baseline testing and health checks

## Dependencies

### Python Libraries
```bash
pip install google-cloud-aiplatform anthropic[vertex] pydantic pydantic-settings pytest pytest-asyncio
```

### Model Identifiers
- **Claude Opus 4.1**: `claude-opus-4-1@20250805` (pinned version)
- **Gemini 2.5 Pro**: `gemini-2.5-pro`
- **Gemini 2.5 Flash**: `gemini-2.5-flash`

## Setup Instructions

### 1. Environment Configuration

Create a `.env` file with required variables:

```bash
# Required
GCP_PROJECT_ID=your-project-id
GCP_REGION=us-central1

# Optional (defaults provided)
CLAUDE_OPUS_MODEL_ID=claude-opus-4-1@20250805
GEMINI_PRO_MODEL_ID=gemini-2.5-pro
GEMINI_FLASH_MODEL_ID=gemini-2.5-flash
VERTEX_REQUEST_TIMEOUT=120
VERTEX_MAX_RETRIES=3
VERTEX_MAX_RPM=60
```

### 2. Authentication Setup

Choose one of these methods:

**Option A: Application Default Credentials (Recommended)**
```bash
gcloud auth application-default login
```

**Option B: Service Account**
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
```

### 3. Enable Required APIs

```bash
gcloud services enable aiplatform.googleapis.com
gcloud services enable iamcredentials.googleapis.com
```

## Usage Examples

### Basic Usage

```python
import asyncio
from src.services.vertex_ai_service import VertexAIService, ModelRequest

async def main():
    # Initialize service
    service = VertexAIService()
    await service.initialize()
    
    # Claude Opus 4.1 request
    claude_request = ModelRequest(
        model_id="claude-opus-4-1@20250805",
        prompt="Explain quantum computing",
        max_tokens=1000,
        temperature=0.7
    )
    
    response = await service.generate(claude_request)
    print(f"Claude response: {response.content}")
    
    # Gemini 2.5 Pro request
    gemini_request = ModelRequest(
        model_id="gemini-2.5-pro",
        prompt="What is machine learning?",
        max_tokens=500,
        streaming=True
    )
    
    response = await service.generate(gemini_request)
    print(f"Gemini response: {response.content}")

asyncio.run(main())
```

### Streaming Example

```python
# Streaming is automatically handled by the service
streaming_request = ModelRequest(
    model_id="gemini-2.5-flash",
    prompt="Count from 1 to 10",
    streaming=True
)

response = await service.generate(streaming_request)
# Response will contain the complete streamed content
```

### Error Handling Example

```python
try:
    response = await service.generate(request)
except Exception as e:
    if "Permission denied" in str(e):
        print("Check your GCP permissions")
    elif "Rate limit exceeded" in str(e):
        print("Too many requests, wait before retrying")
    elif "Quota exceeded" in str(e):
        print("Check your GCP quotas")
    else:
        print(f"Unexpected error: {e}")
```

## Testing

### Basic Validation
```bash
python3 tests/integration/test_runner.py
```

### Live API Testing
```bash
# Set up environment
export GCP_PROJECT_ID=your-project-id
export GCP_REGION=us-central1

# Run comprehensive live tests
python3 -m pytest tests/integration/test_vertex_ai_live.py -v

# Or run directly
python3 tests/integration/test_vertex_ai_live.py
```

### Test Coverage

The integration tests cover:

1. **Authentication & Initialization** - Validates GCP credentials and service setup
2. **Claude Opus 4.1** - Unary and streaming requests with deterministic prompts
3. **Gemini 2.5 Pro** - Unary, streaming, and multimodal capabilities
4. **Gemini 2.5 Flash** - Fast response validation
5. **Error Handling** - Invalid models, safety blocks, rate limiting
6. **Health Checks** - Service monitoring and diagnostics
7. **Performance** - Baseline latency and token usage metrics

## Production Considerations

### Rate Limiting
- Default: 60 requests per minute
- Configurable via `VERTEX_MAX_RPM`
- Automatic enforcement with queuing

### Error Handling
- Exponential backoff for retryable errors
- Non-retryable errors (401, 403) fail immediately
- Comprehensive logging for debugging

### Security
- No hardcoded credentials
- Environment variable validation
- Secure credential handling

### Monitoring
- Request/response logging
- Performance metrics collection
- Health check endpoints

## API Reference

### VertexAIService Methods

#### `initialize() -> bool`
Initialize all Vertex AI clients and validate authentication.

#### `generate(request: ModelRequest) -> ModelResponse`
Generate response using the appropriate model with automatic provider routing.

#### `health_check() -> Dict[str, Any]`
Perform comprehensive health check of all services.

#### `get_supported_models() -> Dict[str, Any]`
Get information about all supported models and their capabilities.

### Data Structures

#### ModelRequest
```python
@dataclass
class ModelRequest:
    model_id: str
    prompt: Union[str, List[Dict[str, str]]]
    max_tokens: Optional[int] = None
    temperature: Optional[float] = None
    streaming: bool = False
    multimodal_inputs: Optional[List[Any]] = None
```

#### ModelResponse
```python
@dataclass
class ModelResponse:
    content: str
    model: str
    usage: Dict[str, int]
    metadata: Dict[str, Any]
    provider: str
    latency_ms: float
```

## Troubleshooting

### Common Issues

#### Authentication Errors
```bash
# Check credentials
gcloud auth list
gcloud auth application-default print-access-token

# Re-authenticate
gcloud auth application-default login
```

#### Permission Denied
```bash
# Check project permissions
gcloud projects get-iam-policy $GCP_PROJECT_ID

# Ensure required roles:
# - roles/aiplatform.user
# - roles/serviceusage.serviceUsageConsumer
```

#### Model Not Found
- Verify model IDs are correct and region-specific
- Check if Claude Opus 4.1 is available in your region
- Ensure Anthropic models are enabled in Vertex AI Model Garden

#### Quota Exceeded
```bash
# Check quotas
gcloud compute project-info describe --project=$GCP_PROJECT_ID
```

### Debugging

Enable debug logging:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

Run health checks:
```python
health = await service.health_check()
print(health)
```

## Cost Optimization

- Use Gemini Flash for fast, low-cost requests
- Set appropriate `max_tokens` limits
- Monitor usage through GCP console
- Implement request caching for repeated queries

## Regional Availability

Supported regions for all models:
- `us-central1` (recommended)
- `us-east1`
- `us-east4`
- `us-east5`
- `us-west1`

## Security Best Practices

1. Use Application Default Credentials in production
2. Set minimal IAM permissions
3. Enable audit logging
4. Monitor API usage and costs
5. Implement request sanitization
6. Use environment-specific configurations

## Support

For issues related to:
- **GCP/Vertex AI**: Check Google Cloud documentation
- **Claude models**: Refer to Anthropic documentation  
- **Integration code**: See test files and error logs
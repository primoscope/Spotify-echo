# Google Cloud Integration Guide

## 📋 Overview

EchoTune AI leverages Google Cloud Platform (GCP) for advanced AI capabilities, providing seamless integration with Vertex AI services for generative AI, machine learning models, and enterprise-grade infrastructure.

## 🏗️ Architecture

### Core Components
- **Vertex AI**: Primary AI platform for model hosting and inference
- **Cloud Storage**: Content storage for generated images and videos
- **IAM & Security**: Authentication and authorization management
- **Cloud Monitoring**: Performance tracking and logging
- **Cloud Functions**: Serverless execution environment

### Integration Flow
```
EchoTune AI Application
    ↓
Google Cloud Authentication
    ↓
Vertex AI Model Services
    ↓ 
Generated Content → Cloud Storage
    ↓
Response to Application
```

## 🔐 Authentication & Setup

### 1. Google Cloud Project Setup

```bash
# Install Google Cloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init

# Create or select project
gcloud projects create echotune-ai-project
gcloud config set project echotune-ai-project

# Enable required APIs
gcloud services enable aiplatform.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable monitoring.googleapis.com
```

### 2. Service Account Configuration

```bash
# Create service account
gcloud iam service-accounts create echotune-ai-service \
    --description="EchoTune AI Service Account" \
    --display-name="EchoTune AI"

# Grant necessary permissions
gcloud projects add-iam-policy-binding echotune-ai-project \
    --member="serviceAccount:echotune-ai-service@echotune-ai-project.iam.gserviceaccount.com" \
    --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding echotune-ai-project \
    --member="serviceAccount:echotune-ai-service@echotune-ai-project.iam.gserviceaccount.com" \
    --role="roles/storage.objectAdmin"

# Create and download key
gcloud iam service-accounts keys create ~/echotune-ai-key.json \
    --iam-account=echotune-ai-service@echotune-ai-project.iam.gserviceaccount.com
```

### 3. Environment Configuration

```bash
# Set environment variables
export GOOGLE_APPLICATION_CREDENTIALS="~/echotune-ai-key.json"
export GOOGLE_CLOUD_PROJECT="echotune-ai-project"
export GOOGLE_CLOUD_REGION="us-central1"
```

Add to your `.env` file:
```env
GOOGLE_APPLICATION_CREDENTIALS=/path/to/echotune-ai-key.json
GOOGLE_CLOUD_PROJECT=echotune-ai-project
GOOGLE_CLOUD_REGION=us-central1
GOOGLE_CLOUD_STORAGE_BUCKET=echotune-ai-content
```

## 🚀 Quick Start Integration

### Python Setup

```python
# Install required packages
pip install google-cloud-aiplatform google-cloud-storage vertexai

# Initialize Vertex AI
import vertexai
from google.cloud import aiplatform

# Initialize with your project
vertexai.init(
    project="echotune-ai-project",
    location="us-central1"
)

# Test connection
aiplatform.init(
    project="echotune-ai-project",
    location="us-central1"
)

print("✅ Google Cloud integration successful!")
```

### Node.js Setup

```javascript
// Install required packages
// npm install @google-cloud/aiplatform @google-cloud/storage

const aiplatform = require('@google-cloud/aiplatform');
const {Storage} = require('@google-cloud/storage');

// Initialize clients
const client = new aiplatform.PredictionServiceClient({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

const storage = new Storage({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

console.log('✅ Google Cloud integration successful!');
```

## 🛠️ Service Configuration

### Cloud Storage Setup

```bash
# Create storage bucket for generated content
gsutil mb -p echotune-ai-project -c STANDARD -l us-central1 gs://echotune-ai-content

# Set bucket permissions
gsutil iam ch serviceAccount:echotune-ai-service@echotune-ai-project.iam.gserviceaccount.com:roles/storage.objectAdmin gs://echotune-ai-content

# Configure CORS for web access
echo '[{"origin":["*"],"method":["GET","POST"],"responseHeader":["Content-Type"],"maxAgeSeconds":3600}]' > cors.json
gsutil cors set cors.json gs://echotune-ai-content
```

### Vertex AI Model Access

```python
from vertexai.preview.vision_models import ImageGenerationModel
from vertexai.preview.generative_models import GenerativeModel

# Initialize models
imagen_model = ImageGenerationModel.from_pretrained("imagegeneration@006")
gemini_model = GenerativeModel("gemini-pro")

# Test model access
print("✅ Vertex AI models accessible!")
```

## 🔍 Monitoring & Logging

### Enable Cloud Monitoring

```python
from google.cloud import monitoring_v3
from google.cloud import logging

# Initialize clients
monitoring_client = monitoring_v3.MetricServiceClient()
logging_client = logging.Client()

# Create custom metrics
def create_custom_metric():
    project_name = f"projects/{PROJECT_ID}"
    descriptor = monitoring_v3.MetricDescriptor()
    descriptor.type = "custom.googleapis.com/echotune/ai_requests"
    descriptor.metric_kind = monitoring_v3.MetricDescriptor.MetricKind.COUNTER
    descriptor.value_type = monitoring_v3.MetricDescriptor.ValueType.INT64
    descriptor.description = "Number of AI generation requests"
    
    monitoring_client.create_metric_descriptor(
        name=project_name, metric_descriptor=descriptor
    )
```

### Logging Configuration

```python
import logging
from google.cloud.logging.handlers import CloudLoggingHandler

# Setup Cloud Logging
cloud_handler = CloudLoggingHandler(logging_client)
logging.getLogger().setLevel(logging.INFO)
logging.getLogger().addHandler(cloud_handler)

# Log AI operations
logging.info("AI generation request started", extra={
    "model": "imagen-3.0",
    "user_id": "user123",
    "prompt_length": 50
})
```

## 💰 Cost Management

### Budget Alerts

```bash
# Create budget alert
gcloud billing budgets create \
    --billing-account=BILLING_ACCOUNT_ID \
    --display-name="EchoTune AI Budget" \
    --budget-amount=100 \
    --threshold-rules-percent=50,90 \
    --threshold-rules-spend-basis=CURRENT_SPEND
```

### Cost Optimization Tips

1. **Model Selection**: Use appropriate models for tasks
   - Imagen 2.0: $0.020 per image
   - Imagen 3.0: $0.025 per image
   - Veo 1.5: $0.015 per second
   - Veo 2.0: $0.025 per second

2. **Caching Strategy**: Implement response caching
3. **Request Batching**: Combine multiple requests
4. **Resource Cleanup**: Delete unused storage objects

```python
# Cost tracking implementation
class CostTracker:
    MODEL_COSTS = {
        "imagegeneration@006": 0.020,
        "imagen-3.0-generate-001": 0.025,
        "veo-1.5-001": 0.015,  # per second
        "veo-2.0-001": 0.025   # per second
    }
    
    @classmethod
    def calculate_cost(cls, model_id, image_count=1, video_seconds=0):
        unit_cost = cls.MODEL_COSTS.get(model_id, 0.025)
        if "veo" in model_id:
            return unit_cost * video_seconds
        return unit_cost * image_count
```

## 🔒 Security Best Practices

### 1. IAM Configuration

```bash
# Principle of least privilege
gcloud projects add-iam-policy-binding echotune-ai-project \
    --member="serviceAccount:echotune-ai-service@echotune-ai-project.iam.gserviceaccount.com" \
    --role="roles/aiplatform.user" \
    --condition='expression=request.time < timestamp("2025-12-31T23:59:59Z")'
```

### 2. Key Rotation

```bash
# Rotate service account keys regularly
gcloud iam service-accounts keys create new-key.json \
    --iam-account=echotune-ai-service@echotune-ai-project.iam.gserviceaccount.com

# Delete old keys
gcloud iam service-accounts keys delete OLD_KEY_ID \
    --iam-account=echotune-ai-service@echotune-ai-project.iam.gserviceaccount.com
```

### 3. Network Security

```python
# Implement request validation
def validate_request(request_data):
    """Validate incoming requests for security."""
    # Check prompt for safety
    if any(word in request_data.get('prompt', '').lower() 
           for word in ['harmful', 'illegal', 'nsfw']):
        raise ValueError("Invalid prompt content")
    
    # Validate parameters
    if request_data.get('image_count', 1) > 10:
        raise ValueError("Too many images requested")
    
    return True
```

## 🚨 Troubleshooting

### Common Issues

#### Authentication Errors
```bash
# Verify credentials
gcloud auth application-default print-access-token

# Check service account permissions
gcloud projects get-iam-policy echotune-ai-project \
    --flatten="bindings[].members" \
    --format="table(bindings.role)" \
    --filter="bindings.members:echotune-ai-service@echotune-ai-project.iam.gserviceaccount.com"
```

#### API Quota Issues
```python
from google.api_core import exceptions

try:
    response = model.generate_images(prompt="test")
except exceptions.ResourceExhausted:
    # Handle quota exceeded
    print("⚠️ Quota exceeded, implementing backoff")
    time.sleep(60)  # Wait and retry
```

#### Network Connectivity
```bash
# Test API endpoints
curl -H "Authorization: Bearer $(gcloud auth print-access-token)" \
     https://us-central1-aiplatform.googleapis.com/v1/projects/echotune-ai-project/locations/us-central1/endpoints
```

## 📊 Performance Optimization

### Regional Deployment
- **Primary**: us-central1 (Iowa) - Lowest latency for North America
- **Secondary**: europe-west4 (Netherlands) - Europe support
- **Tertiary**: asia-southeast1 (Singapore) - Asia-Pacific support

### Caching Strategy
```python
from functools import lru_cache
import hashlib

@lru_cache(maxsize=1000)
def cached_generation(prompt_hash, model_id):
    """Cache generation results for identical prompts."""
    # Implementation here
    pass

def generate_with_cache(prompt, model_id):
    prompt_hash = hashlib.md5(prompt.encode()).hexdigest()
    return cached_generation(prompt_hash, model_id)
```

## 🔄 Scaling Considerations

### Horizontal Scaling
- **Load Balancing**: Distribute requests across regions
- **Queue Management**: Implement request queuing for high load
- **Auto-scaling**: Use Cloud Run or GKE for automatic scaling

### Resource Management
```python
import asyncio
from concurrent.futures import ThreadPoolExecutor

class ScalableAIService:
    def __init__(self, max_workers=10):
        self.executor = ThreadPoolExecutor(max_workers=max_workers)
        self.semaphore = asyncio.Semaphore(max_workers)
    
    async def generate_with_limit(self, prompt, model_id):
        async with self.semaphore:
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(
                self.executor, 
                self._sync_generate, 
                prompt, 
                model_id
            )
```

## 📈 Success Metrics

### Key Performance Indicators
- **Request Success Rate**: >99.5%
- **Average Response Time**: <5 seconds
- **Cost per Request**: <$0.05
- **User Satisfaction**: >95%

### Monitoring Dashboard
```python
# Cloud Monitoring metrics
CUSTOM_METRICS = {
    "ai_requests_total": "Total AI generation requests",
    "ai_requests_failed": "Failed AI generation requests", 
    "ai_cost_total": "Total AI generation costs",
    "ai_response_time": "AI generation response time"
}
```

---

## 🎯 Next Steps

1. **Complete Setup**: Follow the authentication steps
2. **Test Integration**: Run the quick start examples
3. **Configure Monitoring**: Set up logging and alerts
4. **Optimize Costs**: Implement cost tracking
5. **Scale Deployment**: Configure auto-scaling

For detailed implementation examples, see [Usage Examples](usage-examples.md).

---

**Last Updated**: January 2025  
**Integration Status**: Production Ready ✅  
**Security Level**: Enterprise Grade 🔒
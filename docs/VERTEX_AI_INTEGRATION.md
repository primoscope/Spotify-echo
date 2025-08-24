# 🤖 Vertex AI Integration Guide

This guide covers the complete setup and usage of Google Cloud Vertex AI integration for automated ML model deployment in EchoTune AI.

## 🎯 Overview

The Vertex AI integration provides:
- **Automated ML model deployment** to Google Cloud Vertex AI
- **Secure authentication** via Workload Identity Federation or Service Account keys
- **Endpoint management** with automatic creation and reuse
- **Rolling deployments** with traffic splitting
- **GitHub Actions integration** for CI/CD workflows
- **Simple testing framework** for deployed models

## 🔧 Prerequisites

### Required Google Cloud Setup

1. **Enable APIs**:
   ```bash
   gcloud services enable aiplatform.googleapis.com
   gcloud services enable storage.googleapis.com
   ```

2. **Create a GCS bucket** for model artifacts:
   ```bash
   gsutil mb -l us-central1 gs://your-model-staging-bucket
   ```

3. **Set up authentication** (choose one option):

#### Option A: Workload Identity Federation (Recommended)
```bash
# Create workload identity pool
gcloud iam workload-identity-pools create "github-actions" \
  --location="global" \
  --description="GitHub Actions pool"

# Create provider
gcloud iam workload-identity-pools providers create-oidc "github-oidc" \
  --location="global" \
  --workload-identity-pool="github-actions" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository"

# Create service account
gcloud iam service-accounts create vertex-ai-deployer \
  --description="Service account for Vertex AI deployments" \
  --display-name="Vertex AI Deployer"

# Grant necessary roles
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:vertex-ai-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/aiplatform.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:vertex-ai-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

# Allow GitHub Actions to impersonate the service account
gcloud iam service-accounts add-iam-policy-binding \
  vertex-ai-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions/attribute.repository/primoscope/Spotify-echo"
```

#### Option B: Service Account Key (Fallback)
```bash
# Create service account
gcloud iam service-accounts create vertex-ai-deployer

# Grant roles
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:vertex-ai-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/aiplatform.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:vertex-ai-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

# Create and download key
gcloud iam service-accounts keys create vertex-ai-key.json \
  --iam-account=vertex-ai-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

## 🔐 GitHub Repository Configuration

### Required Secrets

Add these secrets in GitHub repository settings:

#### For Workload Identity Federation:
- `GOOGLE_CLOUD_PROJECT`: Your GCP project ID
- `VERTEX_AI_STAGING_BUCKET`: GCS bucket name for model artifacts
- `WIF_PROVIDER`: Workload Identity Provider resource name
- `WIF_SERVICE_ACCOUNT`: Service account email

#### For Service Account Key (fallback):
- `GOOGLE_CLOUD_PROJECT`: Your GCP project ID
- `VERTEX_AI_STAGING_BUCKET`: GCS bucket name for model artifacts
- `GOOGLE_APPLICATION_CREDENTIALS`: Base64-encoded service account key JSON

### Optional Variables

Set these in repository variables:
- `VERTEX_AI_REGION`: Deployment region (default: us-central1)

## 📁 Model Structure

Each model should follow this directory structure:

```
models/
└── your-model-name/
    ├── model.pkl                  # Model artifact (or SavedModel/, etc.)
    ├── requirements.txt           # Python dependencies
    └── model_metadata.json        # Model configuration
```

### Model Metadata Format

```json
{
  "name": "your-model-name",
  "version": "1.0.0",
  "description": "Model description",
  "type": "model_type",
  "framework": "scikit-learn|tensorflow|pytorch|xgboost",
  "input_schema": {
    "type": "object",
    "properties": {
      "input_field": {"type": "string"}
    }
  },
  "output_schema": {
    "type": "object", 
    "properties": {
      "predictions": {"type": "array"}
    }
  },
  "vertex_ai": {
    "machine_type": "n1-standard-4",
    "accelerator_type": null,
    "min_replica_count": 1,
    "max_replica_count": 3,
    "traffic_split": {"0": 100}
  }
}
```

## 🚀 Deployment Methods

### 1. Automatic Deployment (Push to Main)

Models are automatically deployed when:
- Changes are pushed to `models/**` on the `main` branch
- The workflow detects modified model directories

### 2. Pull Request Deployment

Add the `vertex-deploy` label to a PR to trigger deployment:
1. Create PR with model changes
2. Add label: `vertex-deploy`
3. Deployment runs and comments results on PR

### 3. Manual Deployment

Trigger manual deployment via GitHub Actions:
1. Go to Actions → Vertex AI Model Deployment
2. Click "Run workflow"
3. Specify model path and options

### 4. CLI Deployment

Deploy from local environment:

```bash
# Setup (one-time)
npm run vertex:setup

# Deploy specific model
npm run vertex:deploy models/your-model-name

# Deploy with force flag
npm run vertex:deploy models/your-model-name --force

# Test deployed model
npm run vertex:test-model your-model-name

# List all endpoints
npm run vertex:list-endpoints
```

## 🔄 Deployment Process

The automated deployment process:

1. **Validation**
   - Validates environment configuration
   - Checks model directory structure
   - Verifies metadata format

2. **Authentication**
   - Authenticates to Google Cloud
   - Sets up AI Platform clients

3. **Artifact Upload**
   - Uploads model files to GCS bucket
   - Preserves directory structure

4. **Model Creation**
   - Creates or updates Vertex AI Model
   - Sets up container configuration
   - Handles versioning

5. **Endpoint Management**
   - Creates endpoint if doesn't exist
   - Reuses existing endpoint if available
   - Configures traffic splitting

6. **Deployment**
   - Deploys model to endpoint
   - Configures autoscaling
   - Sets up health monitoring

7. **Testing**
   - Sends sample prediction requests
   - Validates response format
   - Generates test report

8. **Notification**
   - Posts results to GitHub PR
   - Provides endpoint URLs
   - Links to Google Cloud Console

## 🧪 Testing Deployed Models

### Automated Testing

The workflow automatically tests deployed models:
- Generates sample input based on schema
- Sends prediction requests
- Validates response format
- Reports success/failure

### Manual Testing

Test models locally:

```bash
# Test specific model
npm run vertex:test-model your-model-name

# This will:
# 1. Load model metadata
# 2. Generate sample input
# 3. Send prediction request
# 4. Validate response
# 5. Generate test report
```

### Custom Test Data

For custom test scenarios, modify the test script or add custom test cases in your model directory.

## 📊 Monitoring and Management

### View Deployed Models

```bash
# List all endpoints
npm run vertex:list-endpoints

# View in Google Cloud Console
# https://console.cloud.google.com/vertex-ai/endpoints
```

### Endpoint Information

After deployment, the workflow provides:
- **Endpoint ID**: Unique identifier
- **Prediction URL**: REST API endpoint
- **Console URL**: Google Cloud Console link
- **Traffic Split**: Current traffic distribution

### Sample Prediction Request

```bash
curl -X POST \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  https://us-central1-aiplatform.googleapis.com/v1/projects/YOUR_PROJECT/locations/us-central1/endpoints/ENDPOINT_ID:predict \
  -d '{
    "instances": [
      {
        "user_id": "test_user",
        "audio_features": {
          "energy": 0.7,
          "valence": 0.8
        }
      }
    ]
  }'
```

## 🛠️ Troubleshooting

### Common Issues

#### Authentication Errors
```bash
# Verify authentication
gcloud auth list

# Test API access
gcloud ai models list --region=us-central1

# Check service account permissions
gcloud projects get-iam-policy YOUR_PROJECT_ID
```

#### Deployment Failures
```bash
# Check workflow logs in GitHub Actions
# Verify model metadata format
# Ensure GCS bucket exists and is accessible
# Check Vertex AI API is enabled
```

#### Model Loading Errors
```bash
# Verify model artifacts are valid
# Check requirements.txt dependencies
# Ensure container image supports framework
```

### Debug Commands

```bash
# Setup validation
npm run vertex:setup

# List current endpoints
npm run vertex:list-endpoints

# Test deployment process locally
GOOGLE_CLOUD_PROJECT=your-project \
VERTEX_AI_STAGING_BUCKET=your-bucket \
npm run vertex:deploy models/sample-model
```

## 🔒 Security Best Practices

### Authentication
- Use Workload Identity Federation for GitHub Actions
- Rotate service account keys regularly
- Follow principle of least privilege

### Model Security
- Validate input data schemas
- Implement rate limiting
- Monitor for abuse patterns
- Use VPC Service Controls if needed

### Data Protection
- Encrypt data in transit and at rest
- Audit prediction requests
- Implement data retention policies
- Follow compliance requirements

## 📈 Performance Optimization

### Machine Types
- Start with `n1-standard-4` for most models
- Use `n1-highmem-*` for memory-intensive models
- Consider `n1-highcpu-*` for CPU-intensive models

### Autoscaling
- Set appropriate min/max replica counts
- Configure CPU/memory thresholds
- Monitor cold start latency

### Cost Optimization
- Use preemptible instances where appropriate
- Implement traffic-based scaling
- Monitor and optimize resource usage

## 🚀 Advanced Features

### Traffic Splitting
Deploy multiple model versions:
```json
{
  "traffic_split": {
    "0": 80,  // 80% to version 0
    "1": 20   // 20% to version 1
  }
}
```

### A/B Testing
Compare model performance:
1. Deploy new model version with small traffic percentage
2. Monitor metrics and compare performance
3. Gradually increase traffic to new version
4. Roll back if issues detected

### Custom Containers
For complex models, use custom containers:
```json
{
  "vertex_ai": {
    "container_image_uri": "gcr.io/your-project/custom-model:latest"
  }
}
```

## 📚 Additional Resources

- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation)
- [Model Deployment Best Practices](https://cloud.google.com/vertex-ai/docs/predictions/deploy-model-to-endpoint)
- [GitHub Actions Authentication](https://github.com/google-github-actions/auth)

## 🤝 Contributing

To improve the Vertex AI integration:
1. Fork the repository
2. Create a feature branch
3. Make changes to scripts or workflows
4. Test with sample models
5. Submit a pull request

---

**Ready to deploy?** Start with the sample model:
```bash
npm run vertex:setup
npm run vertex:deploy models/sample-model
```
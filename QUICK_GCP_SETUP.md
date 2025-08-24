# 🚀 Quick GCP Setup Guide - Exit Mock Mode

This guide helps you configure Google Cloud Platform credentials for EchoTune AI to enable real Vertex AI models instead of mock responses.

## ⚡ Quick Start (5 minutes)

### Option 1: For Development (Fastest)

1. **Install Google Cloud CLI** (if not already installed):
   ```bash
   # macOS
   brew install google-cloud-sdk
   
   # Ubuntu/Debian
   sudo apt-get install google-cloud-cli
   
   # Windows
   # Download from: https://cloud.google.com/sdk/docs/install
   ```

2. **Set up your GCP project**:
   ```bash
   # Authenticate with Google Cloud
   gcloud auth login
   gcloud auth application-default login
   
   # Set or create a project
   gcloud config set project YOUR_PROJECT_ID
   
   # Enable Vertex AI API
   gcloud services enable aiplatform.googleapis.com
   ```

3. **Update .env file**:
   ```bash
   # Edit .env file and set:
   GCP_PROJECT_ID=YOUR_ACTUAL_PROJECT_ID
   AI_MOCK_MODE=false
   ```

4. **Test the configuration**:
   ```bash
   node scripts/configure-gcp-credentials.js check
   node scripts/configure-gcp-credentials.js validate
   ```

### Option 2: Automated Bootstrap (Production-Ready)

1. **Follow the comprehensive bootstrap guide**: `docs/VERTEX_AI_BOOTSTRAP_GUIDE.md`
2. **Use the GitHub workflow**: "Vertex AI Bootstrap - One-Click GCP Setup"

## 🔧 Using the Configuration Script

The repository includes a comprehensive configuration script:

```bash
# Check current status
node scripts/configure-gcp-credentials.js check

# Interactive setup
node scripts/configure-gcp-credentials.js setup

# Validate configuration
node scripts/configure-gcp-credentials.js validate

# Test with real API call
node scripts/configure-gcp-credentials.js test
```

## 🧪 Verify It's Working

After configuration, test that models are no longer in mock mode:

```bash
# Test Claude Opus integration
node claude-opus-command-processor.js test

# Should show something like:
# ✅ Vertex AI configured: your-project-id
# ✅ Claude Opus 4.1 available
# ❌ Mock Mode: Disabled
```

## ⚠️ Important Notes

1. **Project ID**: Replace `spotify-echo-ai-project` in `.env` with your actual GCP project ID
2. **Billing**: Ensure your GCP project has billing enabled
3. **APIs**: The Vertex AI API will be automatically enabled during setup
4. **Permissions**: Your account needs `aiplatform.user` role or higher

## 🔒 Security Best Practices

- Use Application Default Credentials for development
- Use Workload Identity Federation for production GitHub Actions
- Never commit service account keys to the repository
- Set up least-privilege IAM roles

## 📚 Additional Resources

- [Complete Bootstrap Guide](docs/VERTEX_AI_BOOTSTRAP_GUIDE.md)
- [Vertex AI Integration Guide](docs/ai/vertex_integration.md)
- [Google Cloud SDK Installation](https://cloud.google.com/sdk/docs/install)

---

**Need help?** Run `node scripts/configure-gcp-credentials.js help` for detailed commands.
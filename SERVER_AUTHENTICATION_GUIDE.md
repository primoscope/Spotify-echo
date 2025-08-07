# 🚀 Server Authentication & Registry Configuration Guide

## Overview

This guide provides comprehensive instructions for authenticating with all deployment servers and container registries supported by EchoTune AI.

## 🔐 DigitalOcean Configuration

### Prerequisites
- Active DigitalOcean account
- Valid API token with appropriate scopes

### Authentication Methods

#### Method 1: Using doctl CLI
```bash
# Install doctl (if not already installed)
curl -L https://github.com/digitalocean/doctl/releases/latest/download/doctl-*-linux-amd64.tar.gz | tar xz
sudo mv doctl /usr/local/bin

# Authenticate using API token
doctl auth init --access-token YOUR_DO_TOKEN

# Verify authentication
doctl account get
```

#### Method 2: Container Registry Authentication
```bash
# Login to DigitalOcean Container Registry
echo "YOUR_DO_TOKEN" | docker login registry.digitalocean.com --username YOUR_EMAIL --password-stdin

# Alternative: Use doctl registry login
doctl registry login
```

### Current Configuration Status
- **Username**: scapedote@outlook.com  
- **Token**: dop_v1_afa7b76a55cca84f89f48986d212d8f2fc08de48872034eb7c8cc1ae0978d22e
- **Status**: ⚠️ Token validation failed (401 Unauthorized)

### Troubleshooting
If you get 401 errors:
1. **Verify token validity**: Check in DigitalOcean dashboard → API → Tokens
2. **Check token scopes**: Ensure token has `read` and `write` permissions
3. **Regenerate token**: Create new token if expired
4. **Verify account status**: Ensure account is active and verified

## 🐳 Docker Hub Configuration

### Authentication
```bash
# Login to Docker Hub
docker login

# Using credentials programmatically
echo "YOUR_DOCKER_PASSWORD" | docker login --username YOUR_DOCKER_USERNAME --password-stdin

# Push to Docker Hub
docker tag echotune-ai:latest YOUR_USERNAME/echotune-ai:latest
docker push YOUR_USERNAME/echotune-ai:latest
```

### Current Status
- **Status**: ✅ Docker Hub accessible (public access)
- **Authentication**: Not configured (requires Docker Hub account)

## 🏷️ GitHub Container Registry (GHCR)

### Authentication
```bash
# Create GitHub Personal Access Token with packages:read and packages:write scopes
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io --username YOUR_GITHUB_USERNAME --password-stdin

# Push to GHCR
docker tag echotune-ai:latest ghcr.io/YOUR_USERNAME/echotune-ai:latest
docker push ghcr.io/YOUR_USERNAME/echotune-ai:latest
```

### Required GitHub Token Scopes
- `read:packages`
- `write:packages`
- `delete:packages` (optional)

## ☁️ AWS ECR (Elastic Container Registry)

### Prerequisites
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

### Authentication
```bash
# Configure AWS credentials
aws configure
# AWS Access Key ID: YOUR_ACCESS_KEY
# AWS Secret Access Key: YOUR_SECRET_KEY
# Default region name: us-east-1
# Default output format: json

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Push to ECR
docker tag echotune-ai:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/echotune-ai:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/echotune-ai:latest
```

## 🔷 Azure Container Registry (ACR)

### Prerequisites
```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

### Authentication
```bash
# Login to Azure
az login

# Login to ACR
az acr login --name YOUR_REGISTRY_NAME

# Push to ACR
docker tag echotune-ai:latest YOUR_REGISTRY_NAME.azurecr.io/echotune-ai:latest
docker push YOUR_REGISTRY_NAME.azurecr.io/echotune-ai:latest
```

## 🌐 Google Container Registry (GCR) & Artifact Registry

### Prerequisites
```bash
# Install Google Cloud SDK
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init
```

### Authentication
```bash
# Authenticate with Google Cloud
gcloud auth configure-docker

# For Artifact Registry
gcloud auth configure-docker us-central1-docker.pkg.dev

# Push to GCR
docker tag echotune-ai:latest gcr.io/YOUR_PROJECT_ID/echotune-ai:latest
docker push gcr.io/YOUR_PROJECT_ID/echotune-ai:latest

# Push to Artifact Registry
docker tag echotune-ai:latest us-central1-docker.pkg.dev/YOUR_PROJECT_ID/YOUR_REPO/echotune-ai:latest
docker push us-central1-docker.pkg.dev/YOUR_PROJECT_ID/YOUR_REPO/echotune-ai:latest
```

## 🔄 Automated Testing

### Run All Registry Tests
```bash
# Test all registries and servers
npm run test:servers

# Test specific services
npm run test:docker-hub
npm run test:digitalocean
npm run test:registries
```

### Manual Testing Commands
```bash
# Test Docker installation
docker --version
docker info

# Test specific registry login
docker login registry.digitalocean.com
docker login ghcr.io
docker login

# Test image build
docker build -t echotune-test .

# Test image push (after login)
docker push YOUR_REGISTRY/echotune-ai:latest
```

## 🛡️ Security Best Practices

1. **Use dedicated service accounts** for CI/CD deployments
2. **Limit token scopes** to minimum required permissions
3. **Rotate tokens regularly** (recommended: every 90 days)
4. **Store tokens as environment variables**, never in code
5. **Enable two-factor authentication** on all cloud accounts
6. **Monitor token usage** through provider dashboards
7. **Use short-lived tokens** for temporary access

## 📋 Environment Variables

Add these to your `.env` file:

```env
# DigitalOcean
DIGITALOCEAN_TOKEN=your_do_token
DIGITALOCEAN_REGISTRY_NAME=your_registry_name

# Docker Hub
DOCKER_USERNAME=your_docker_username
DOCKER_PASSWORD=your_docker_password

# GitHub
GITHUB_TOKEN=your_github_token
GITHUB_USERNAME=your_github_username

# AWS
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_DEFAULT_REGION=us-east-1
AWS_ACCOUNT_ID=your_aws_account_id

# Azure
AZURE_CLIENT_ID=your_azure_client_id
AZURE_CLIENT_SECRET=your_azure_client_secret
AZURE_TENANT_ID=your_azure_tenant_id

# Google Cloud
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
GCP_PROJECT_ID=your_gcp_project_id
```

## 🚨 Current Issues & Solutions

### DigitalOcean Token Error (401 Unauthorized)
**Problem**: Token `dop_v1_afa7b76a55cca84f89f48986d212d8f2fc08de48872034eb7c8cc1ae0978d22e` is invalid

**Solutions**:
1. **Check token in DO dashboard**: Visit [DigitalOcean API Tokens](https://cloud.digitalocean.com/account/api/tokens)
2. **Regenerate token**: Create new token with read/write permissions
3. **Verify account**: Ensure account is verified and active
4. **Check billing**: Ensure account has valid payment method

### Docker Build Timeout
**Problem**: Docker build taking too long and timing out

**Solutions**:
1. **Optimize Dockerfile**: Use multi-stage builds, reduce layers
2. **Use .dockerignore**: Exclude unnecessary files
3. **Increase timeout**: Adjust Docker build timeout settings
4. **Use build cache**: Leverage Docker layer caching

## 📞 Support

For authentication issues:
1. **Check provider status pages**
2. **Review provider documentation** 
3. **Contact provider support**
4. **Check firewall/network restrictions**

---

**Last Updated**: August 2025  
**Next Review**: Check token validity monthly
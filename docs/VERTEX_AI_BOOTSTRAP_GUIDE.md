# 🚀 Vertex AI One-Click Bootstrap Guide

This guide explains how to use the automated Vertex AI bootstrap workflow to set up Google Cloud resources for EchoTune AI with minimal manual configuration.

## 📋 Overview

The Vertex AI Bootstrap workflow automatically provisions all required Google Cloud resources for Vertex AI integration:

- ✅ **Service Account**: `github-vertex@PROJECT_ID.iam.gserviceaccount.com`
- ✅ **Workload Identity Federation**: Pool and OIDC provider for GitHub Actions
- ✅ **Required APIs**: Vertex AI, IAM, Storage, Service Usage APIs
- ✅ **Storage Bucket**: Labeled bucket for ML artifacts and models
- ✅ **IAM Bindings**: Proper permissions and role assignments

## 🔑 Prerequisites

### 1. Google Cloud Project
- Have a Google Cloud project with billing enabled
- Project should have Owner permissions or a custom role with:
  - `iam.serviceAccounts.*`
  - `iam.workloadIdentityPoolAdmin`
  - `aiplatform.admin`
  - `storage.admin`
  - `serviceusage.services.enable`

### 2. Bootstrap Service Account
Create a temporary service account for the bootstrap process:

```bash
# Set your project ID
export PROJECT_ID="your-project-id"

# Create bootstrap service account
gcloud iam service-accounts create bootstrap-sa \
  --display-name="Bootstrap Service Account" \
  --project=$PROJECT_ID

# Grant required permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:bootstrap-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/owner"

# Create and download key
gcloud iam service-accounts keys create bootstrap-key.json \
  --iam-account="bootstrap-sa@$PROJECT_ID.iam.gserviceaccount.com"

# Base64 encode the key for GitHub secrets
base64 bootstrap-key.json | tr -d '\n' > bootstrap-key-base64.txt
```

## 🚀 Quick Start

### Step 1: Add Repository Secret

1. Go to your repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `GCP_BOOTSTRAP_SA_KEY`
4. Value: Contents of `bootstrap-key-base64.txt` (base64 encoded service account key)

### Step 2: Run Bootstrap Workflow

1. Go to Actions tab in your repository
2. Find "Vertex AI Bootstrap - One-Click GCP Setup" workflow
3. Click "Run workflow"
4. Choose options:
   - **Dry run**: `false` (set to `true` for testing)
   - **Force recreate**: `false` (set to `true` to recreate existing resources)
5. Click "Run workflow"

### Step 3: Configure Additional Secrets

After the workflow completes successfully:

1. Check the workflow run for the generated configuration
2. Add the following secrets to your repository:
   ```
   GCP_PROJECT_ID=your-project-id
   GCP_PROJECT_NUMBER=123456789
   WORKLOAD_IDENTITY_PROVIDER=projects/123456789/locations/global/workloadIdentityPools/github-actions/providers/github-oidc
   GCP_SERVICE_ACCOUNT=github-vertex@your-project-id.iam.gserviceaccount.com
   GCP_VERTEX_BUCKET=your-project-id-vertex-ai-artifacts
   ```

### Step 4: Clean Up Bootstrap Resources

1. **Delete the bootstrap service account key** from your local machine
2. **Remove the `GCP_BOOTSTRAP_SA_KEY` secret** from repository settings
3. **Delete the bootstrap service account** (optional):
   ```bash
   gcloud iam service-accounts delete bootstrap-sa@$PROJECT_ID.iam.gserviceaccount.com
   ```

## 🔧 Advanced Usage

### New Idempotent Setup Commands (Recommended)

The repository now includes improved, idempotent setup commands that handle existing resources gracefully:

```bash
# Setup Workload Identity Federation (handles NOT_FOUND errors gracefully)
node scripts/configure-gcp-credentials.js wif-setup

# Verify Vertex AI access and automatically disable mock mode on success
node scripts/configure-gcp-credentials.js vertex-verify

# Run comprehensive validation tests
node scripts/tests/test-vertex-config.mjs
```

These commands replace the need for the full bootstrap workflow in most cases and provide better error handling.

### CLI Utilities

The bootstrap includes a CLI utility for validation and management:

```bash
# Check current status
node scripts/vertex-ai-bootstrap.js status

# Validate configuration
node scripts/vertex-ai-bootstrap.js validate

# Generate GitHub secrets configuration
node scripts/vertex-ai-bootstrap.js config

# Health check all resources
node scripts/vertex-ai-bootstrap.js health

# Show available commands
node scripts/vertex-ai-bootstrap.js help
```

### Workflow Options

#### Dry Run Mode
Test the bootstrap without making actual changes:
```yaml
dry_run: true
```

#### Force Recreate
Recreate existing resources (use with caution):
```yaml
force_recreate: true
```

### Using Workload Identity in Other Workflows

After bootstrap completion, use Workload Identity Federation in your workflows:

```yaml
- name: Authenticate to Google Cloud
  uses: google-github-actions/auth@v2
  with:
    workload_identity_provider: ${{ secrets.WORKLOAD_IDENTITY_PROVIDER }}
    service_account: ${{ secrets.GCP_SERVICE_ACCOUNT }}

- name: Set up Cloud SDK
  uses: google-github-actions/setup-gcloud@v2

- name: Use Vertex AI
  run: |
    gcloud ai models list --region=us-central1
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Permission Denied
```
Error: Permission denied on project
```
**Solution**: Ensure the bootstrap service account has sufficient permissions (roles/owner or custom role with required permissions).

#### 2. API Not Enabled
```
Error: API [service] is not enabled
```
**Solution**: The workflow should automatically enable APIs. If this fails, enable manually:
```bash
gcloud services enable aiplatform.googleapis.com
```

#### 3. Resource Already Exists
```
Error: Service account already exists
```
**Solution**: Use `force_recreate: true` option or manually clean up existing resources.

#### 4. Workload Identity Binding Failed
```
Error: Cannot bind workload identity
```
**Solution**: Check that the repository name matches exactly and try running the workflow again.

#### 5. NOT_FOUND Error with FORCE_RECREATE
```
(gcloud.iam.workload-identity-pools.delete) NOT_FOUND: Requested entity was not found.
```
**Solution**: This error is now handled gracefully by the new idempotent setup script. The script uses `|| true` to ignore NOT_FOUND errors when `FORCE_RECREATE=true`. This is expected behavior when trying to delete resources that don't exist yet.

#### 6. GCP Bootstrap Fails During WIF Setup
```
Error: Workload Identity Federation setup fails
```
**Solution**: Use the new idempotent commands:
```bash
# Setup Workload Identity Federation (handles existing resources gracefully)
node scripts/configure-gcp-credentials.js wif-setup

# Verify Vertex AI access and disable mock mode
node scripts/configure-gcp-credentials.js vertex-verify
```

### Validation Commands

Run validation to diagnose issues:

```bash
# Full validation
node scripts/validate-vertex-bootstrap.js

# Check specific component
node scripts/vertex-ai-bootstrap.js validate

# Test new idempotent setup (recommended)
node scripts/configure-gcp-credentials.js wif-setup

# Verify Vertex AI and disable mock mode
node scripts/configure-gcp-credentials.js vertex-verify

# Run comprehensive tests
node scripts/tests/test-vertex-config.mjs
```

### Manual Cleanup

If you need to clean up all bootstrap resources:

```bash
# CAUTION: This will delete all Vertex AI bootstrap resources
node scripts/vertex-ai-bootstrap.js cleanup --force
```

## 📊 Monitoring

### Check Resource Status

```bash
# Check all resources
node scripts/vertex-ai-bootstrap.js status

# Check specific components
gcloud iam service-accounts list --filter="email:github-vertex@*"
gcloud iam workload-identity-pools list --location=global
gsutil ls -b gs://*-vertex-ai-artifacts
```

### Logs and Debugging

- Check GitHub Actions workflow logs for detailed execution information
- Use `dry_run: true` to test configuration without making changes
- Run validation scripts to verify setup

## 🔒 Security Best Practices

1. **Use minimal permissions**: The bootstrap service account should have only required permissions
2. **Temporary access**: Delete bootstrap service account key immediately after use
3. **Regular rotation**: Periodically rotate service account keys
4. **Audit access**: Monitor service account usage in Google Cloud Console
5. **Repository access**: Limit who can run the bootstrap workflow

## 📚 Additional Resources

- [Google Cloud IAM Documentation](https://cloud.google.com/iam/docs)
- [Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation)
- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [GitHub Actions with Google Cloud](https://github.com/google-github-actions)

---

*For more information, see the [EchoTune AI documentation](../README.md) or contact the development team.*
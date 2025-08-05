# Scripts Directory

This directory contains utility scripts for EchoTune AI deployment and automation.

## Available Scripts

### 🚀 install-doctl-ghpat.sh
Auto-installation script for DigitalOcean CLI (doctl) with GitHub PAT integration.

**Features:**
- Auto-detects platform and architecture
- Downloads latest doctl version
- Integrates with GitHub PAT for authentication
- Provides comprehensive validation
- CI/CD pipeline ready

**Usage:**
```bash
# Basic installation
./scripts/install-doctl-ghpat.sh

# With environment variables
export GH_PAT=ghp_xxxxxxxxxxxxxxxxxxxx
export DO_API_TOKEN=dop_v1_xxxxxxxxxxxxxxxxxxxx
./scripts/install-doctl-ghpat.sh

# Show help
./scripts/install-doctl-ghpat.sh --help
```

### 🧪 test-doctl-installation.sh
Comprehensive test script to validate doctl installation and GH_PAT functionality.

**Usage:**
```bash
./scripts/test-doctl-installation.sh
```

**Tests:**
- Script existence and permissions
- Syntax validation
- doctl availability
- GH_PAT environment variable
- GitHub CLI integration
- Production script integration
- Documentation updates

## Environment Variables

### Required for GitHub Integration
- `GH_PAT` - GitHub Personal Access Token
- `GITHUB_TOKEN` - Alternative GitHub token (fallback)

### Required for DigitalOcean Operations
- `DO_API_TOKEN` - DigitalOcean API token

## CI/CD Integration

Example GitHub Actions usage:
```yaml
- name: Install doctl with GH_PAT
  env:
    GH_PAT: ${{ secrets.GH_PAT }}
    DO_API_TOKEN: ${{ secrets.DO_API_TOKEN }}
  run: |
    ./scripts/install-doctl-ghpat.sh
    doctl account get
```

## Related Documentation

- [Production Deployment Guide](../PRODUCTION_DEPLOYMENT_GUIDE.md)
- [Main README](../README.md)
- [Deployment Scripts](../deploy-production-optimized.sh)
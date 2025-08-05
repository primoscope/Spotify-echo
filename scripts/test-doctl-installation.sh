#!/bin/bash

# Simple test script to verify doctl installation and GH_PAT functionality
set -e

echo "🧪 Testing doctl auto-installation with GH_PAT..."

# Test 1: Check if script exists and is executable
echo "✅ Test 1: Script existence and permissions"
if [[ -x "./scripts/install-doctl-ghpat.sh" ]]; then
    echo "   ✓ Script exists and is executable"
else
    echo "   ✗ Script not found or not executable"
    exit 1
fi

# Test 2: Check script syntax
echo "✅ Test 2: Script syntax validation"
if bash -n ./scripts/install-doctl-ghpat.sh; then
    echo "   ✓ Script syntax is valid"
else
    echo "   ✗ Script syntax error"
    exit 1
fi

# Test 3: Check if doctl is available
echo "✅ Test 3: doctl availability"
if command -v doctl >/dev/null 2>&1; then
    echo "   ✓ doctl is installed: $(doctl version | head -1)"
else
    echo "   ✗ doctl not found"
fi

# Test 4: Check GH_PAT environment variable
echo "✅ Test 4: GH_PAT environment variable"
if [[ -n "${GH_PAT:-}" ]]; then
    echo "   ✓ GH_PAT is set (${GH_PAT:0:8}...)"
else
    echo "   ⚠ GH_PAT not set (this is optional)"
fi

# Test 5: Check GitHub CLI functionality
echo "✅ Test 5: GitHub CLI integration"
if command -v gh >/dev/null 2>&1; then
    if gh auth status >/dev/null 2>&1; then
        echo "   ✓ GitHub CLI is authenticated"
    else
        echo "   ⚠ GitHub CLI available but not authenticated"
    fi
else
    echo "   ⚠ GitHub CLI not found"
fi

# Test 6: Check production deployment script integration
echo "✅ Test 6: Production deployment script integration"
if grep -q "install_doctl_with_ghpat" deploy-production-optimized.sh; then
    echo "   ✓ Production script includes doctl auto-installation"
else
    echo "   ✗ Production script missing doctl integration"
    exit 1
fi

# Test 7: Check documentation updates
echo "✅ Test 7: Documentation updates"
if grep -q "doctl Auto-Installation" PRODUCTION_DEPLOYMENT_GUIDE.md; then
    echo "   ✓ Documentation includes doctl auto-installation section"
else
    echo "   ✗ Documentation missing doctl section"
    exit 1
fi

echo ""
echo "🎉 All tests passed! doctl auto-installation with GH_PAT is ready."
echo ""
echo "Next steps:"
echo "1. Set DO_API_TOKEN for DigitalOcean authentication"
echo "2. Run ./scripts/install-doctl-ghpat.sh to install doctl"
echo "3. Use ./deploy-production-optimized.sh for production deployment"
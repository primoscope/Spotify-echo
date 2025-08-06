#!/bin/bash

# EchoTune AI - Documentation Link Validation Script
# Validates that all referenced documents exist and are accessible

set -e

echo "🔍 EchoTune AI - Documentation Validation"
echo "========================================"

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ERRORS=0

# Function to check if file exists
check_file() {
    local file="$1"
    local description="$2"
    
    if [[ -f "$PROJECT_ROOT/$file" ]]; then
        echo "✅ $description: $file"
    else
        echo "❌ $description: $file (MISSING)"
        ((ERRORS++))
    fi
}

# Function to check directory exists
check_directory() {
    local dir="$1"
    local description="$2"
    
    if [[ -d "$PROJECT_ROOT/$dir" ]]; then
        echo "✅ $description: $dir/"
    else
        echo "❌ $description: $dir/ (MISSING)"
        ((ERRORS++))
    fi
}

echo
echo "📚 Checking Core Documentation Files..."

# Core documentation files referenced in README
check_file "DEPLOYMENT.md" "DigitalOcean Deployment Guide"
check_file "DOCKER_ENHANCED_GUIDE.md" "Enhanced Docker Guide"
check_file "CODING_AGENT_GUIDE.md" "Development Guide"
check_file "DATABASE_ARCHITECTURE_GUIDE.md" "Database Architecture Guide"
check_file "CONTRIBUTING.md" "Contributing Guide"
check_file ".env.example" "Environment Example"

echo
echo "📁 Checking Documentation Directories..."

# Documentation directories
check_directory "docs" "Documentation Directory"
check_directory "docs/api" "API Documentation"
check_directory "docs/deployment" "Deployment Guides"
check_directory "scripts" "Scripts Directory"
check_directory "scripts/deployment" "Deployment Scripts"
check_directory "scripts/docker" "Docker Scripts"

echo
echo "🔧 Checking Key Scripts..."

# Key scripts referenced in documentation
check_file "scripts/simple-deploy.sh" "Simple Deploy Script"
check_file "scripts/docker/docker-ubuntu-setup.sh" "Docker Ubuntu Setup"
check_file "scripts/deployment/deployment-demo.sh" "Deployment Demo"
check_file "test-fixes.sh" "Fix Validation Script"

echo
echo "📋 Checking Configuration Files..."

# Configuration files
check_file "package.json" "Package Configuration"
check_file "docker-compose.yml" "Docker Compose"
check_file "Dockerfile" "Dockerfile"
check_file ".env.example" "Environment Example"

echo
echo "🏗️ Checking Project Structure..."

# Core project directories
check_directory "src" "Source Code"
check_directory "public" "Static Assets"
check_directory "tests" "Test Directory"

# Specific docs referenced in README
check_file "docs/QUICK_START.md" "Quick Start Guide"
check_file "docs/deployment/ubuntu-deployment.md" "Ubuntu Deployment Guide"
check_file "docs/api/README.md" "API Documentation"

echo
echo "🔗 Checking Internal Links in README..."

# Extract and validate markdown links in README
if command -v grep >/dev/null 2>&1; then
    echo "📖 Scanning README.md for broken links..."
    
    # Check for common markdown link patterns
    grep -n "\[.*\](" README.md | while IFS= read -r line; do
        # Extract filename from markdown link
        file=$(echo "$line" | sed 's/.*](\([^)]*\)).*/\1/' | head -1)
        
        # Skip external URLs
        if [[ "$file" =~ ^https?:// ]]; then
            continue
        fi
        
        # Skip anchor links
        if [[ "$file" =~ ^# ]]; then
            continue
        fi
        
        line_num=$(echo "$line" | cut -d: -f1)
        
        if [[ -f "$PROJECT_ROOT/$file" ]] || [[ -d "$PROJECT_ROOT/$file" ]]; then
            echo "✅ Line $line_num: $file"
        else
            echo "❌ Line $line_num: $file (MISSING)"
            ((ERRORS++))
        fi
    done
fi

echo
echo "📊 Validation Summary"
echo "===================="

if [[ $ERRORS -eq 0 ]]; then
    echo "✅ All documentation links are valid!"
    echo "🎉 Documentation is complete and accessible."
    exit 0
else
    echo "❌ Found $ERRORS missing files or directories."
    echo "🔧 Please create the missing documentation files."
    exit 1
fi
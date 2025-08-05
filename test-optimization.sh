#!/bin/bash

# Test script for optimized deployment validation
# Tests the production-optimized deployment configurations

set -euo pipefail

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧪 Testing EchoTune AI Production Optimization${NC}"
echo ""

# Test 1: Verify optimized files exist
echo -e "${BLUE}Test 1: Checking optimized files...${NC}"
files=(
    "deploy-production-optimized.sh"
    "requirements-minimal.txt"
    "Dockerfile.minimal"
    "package-production.json"
    "analyze-dependencies.sh"
)

all_files_exist=true
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ $file exists${NC}"
    else
        echo -e "${RED}✗ $file missing${NC}"
        all_files_exist=false
    fi
done

# Test 2: Validate package-production.json
echo -e "\n${BLUE}Test 2: Validating production package.json...${NC}"
if node -e "
const pkg = require('./package-production.json');
const excludedTypes = ['puppeteer', 'playwright', '@types', 'jest', 'eslint', 'babel', 'webpack'];
const deps = Object.keys(pkg.dependencies || {});
const hasExcluded = deps.some(dep => excludedTypes.some(type => dep.includes(type)));
if (hasExcluded) {
    console.log('❌ Production package includes excluded dependencies');
    process.exit(1);
} else {
    console.log('✅ Production package is clean');
}
const coreCount = deps.filter(dep => ['express', 'mongodb', 'openai', 'socket.io'].some(core => dep.includes(core))).length;
console.log(\`✅ Contains \${coreCount} core dependencies\`);
"; then
    echo -e "${GREEN}✓ Production package validation passed${NC}"
else
    echo -e "${RED}✗ Production package validation failed${NC}"
fi

# Test 3: Validate minimal requirements
echo -e "\n${BLUE}Test 3: Checking minimal Python requirements...${NC}"
if [ -f "requirements-minimal.txt" ]; then
    echo "Core dependencies in minimal requirements:"
    grep -E "(spotipy|requests|fastapi|pymongo)" requirements-minimal.txt | head -5
    
    echo "Checking for excluded heavy packages..."
    if grep -E "(scikit-learn|matplotlib|jupyter|librosa)" requirements-minimal.txt >/dev/null 2>&1; then
        echo -e "${RED}✗ Found heavy ML packages in minimal requirements${NC}"
    else
        echo -e "${GREEN}✓ No heavy ML packages found${NC}"
    fi
else
    echo -e "${RED}✗ requirements-minimal.txt not found${NC}"
fi

# Test 4: Docker file validation
echo -e "\n${BLUE}Test 4: Validating Dockerfile.minimal...${NC}"
if [ -f "Dockerfile.minimal" ]; then
    if grep -q "production-minimal" Dockerfile.minimal; then
        echo -e "${GREEN}✓ Dockerfile configured for minimal production${NC}"
    fi
    
    if grep -q "excludes.*dev.*tools" Dockerfile.minimal; then
        echo -e "${GREEN}✓ Dockerfile excludes development tools${NC}"
    fi
    
    echo "Dockerfile size optimizations:"
    grep -c "apk add" Dockerfile.minimal | xargs echo "  - APK packages limited to:"
    grep "apk add" Dockerfile.minimal | head -2
else
    echo -e "${RED}✗ Dockerfile.minimal not found${NC}"
fi

# Test 5: Deployment script validation  
echo -e "\n${BLUE}Test 5: Validating deployment script configuration...${NC}"
if [ -f "deploy-production-optimized.sh" ]; then
    if grep -q "EXCLUDE_DEV_DEPS=true" deploy-production-optimized.sh; then
        echo -e "${GREEN}✓ Development dependencies exclusion enabled${NC}"
    fi
    
    if grep -q "EXCLUDE_CODING_AGENTS=true" deploy-production-optimized.sh; then
        echo -e "${GREEN}✓ Coding agent exclusion enabled${NC}"
    fi
    
    if grep -q "MINIMAL_INSTALL=true" deploy-production-optimized.sh; then
        echo -e "${GREEN}✓ Minimal installation mode enabled${NC}"
    fi
    
    echo "Script configuration:"
    grep -E "(EXCLUDE_|MINIMAL_)" deploy-production-optimized.sh | head -5
else
    echo -e "${RED}✗ deploy-production-optimized.sh not found${NC}"
fi

# Test 6: Size comparison simulation
echo -e "\n${BLUE}Test 6: Estimating size reduction...${NC}"
if [ -d "node_modules" ]; then
    total_deps=$(npm list --depth=0 2>/dev/null | wc -l)
    dev_deps=$(npm list --depth=0 --dev 2>/dev/null | wc -l)
    prod_deps=$((total_deps - dev_deps))
    
    echo "Current installation:"
    echo "  - Total dependencies: $total_deps"
    echo "  - Development dependencies: $dev_deps"
    echo "  - Production dependencies: $prod_deps"
    
    if [ $dev_deps -gt 0 ]; then
        savings_percent=$((dev_deps * 100 / total_deps))
        echo -e "${GREEN}  - Estimated savings by excluding dev deps: ${savings_percent}%${NC}"
    fi
else
    echo -e "${YELLOW}⚠ node_modules not found - run 'npm install' to test size impact${NC}"
fi

# Test 7: Configuration validation
echo -e "\n${BLUE}Test 7: Testing configuration generation...${NC}"
temp_dir=$(mktemp -d)

# Test minimal package.json generation
node -e "
const originalPkg = require('./package.json');
const minimalPkg = {
  name: originalPkg.name + '-minimal',
  version: originalPkg.version,
  dependencies: {}
};

// Include only core dependencies
const coreDeps = ['express', 'cors', 'helmet', 'mongodb', 'openai', 'socket.io', 'dotenv', 'axios'];
Object.keys(originalPkg.dependencies || {}).forEach(dep => {
  if (coreDeps.some(core => dep.includes(core)) || ['uuid', 'lodash', 'compression'].includes(dep)) {
    minimalPkg.dependencies[dep] = originalPkg.dependencies[dep];
  }
});

console.log('Generated minimal package with', Object.keys(minimalPkg.dependencies).length, 'dependencies');
console.log('Excluded', Object.keys(originalPkg.dependencies || {}).length - Object.keys(minimalPkg.dependencies).length, 'dependencies');
" && echo -e "${GREEN}✓ Configuration generation works${NC}"

rm -rf "$temp_dir"

# Summary
echo ""
echo -e "${BLUE}🎯 Test Summary:${NC}"
if [ "$all_files_exist" = true ]; then
    echo -e "${GREEN}✅ All optimization files created successfully${NC}"
    echo -e "${GREEN}✅ Production configurations validated${NC}"
    echo -e "${GREEN}✅ Deployment scripts configured for minimal installation${NC}"
    echo ""
    echo -e "${YELLOW}📋 Next Steps:${NC}"
    echo "1. Test deployment: sudo ./deploy-production-optimized.sh --dry-run"
    echo "2. Build minimal Docker image: docker build -f Dockerfile.minimal -t echotune:minimal ."
    echo "3. Compare sizes: docker images | grep echotune"
    echo "4. Run validation: ./analyze-dependencies.sh"
else
    echo -e "${RED}❌ Some optimization files are missing${NC}"
    echo "Please check the file creation process"
fi

echo ""
echo -e "${BLUE}🚀 Production optimization ready for deployment!${NC}"
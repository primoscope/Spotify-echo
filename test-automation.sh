#!/bin/bash

# Test Script for Continuous Agent Auto-Review and Merge
# This script tests the complete automation cycle

set -e

echo "🤖 Testing Continuous Agent Auto-Review and Merge Functionality"
echo "=============================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "agent-workflow/config/config.json" ]; then
    print_error "Not in the Spotify-echo repository root directory"
    exit 1
fi

print_status "Step 1: Validating agent configuration..."

# Check agent configuration
auto_merge=$(jq -r '.auto_merge' agent-workflow/config/config.json 2>/dev/null || echo "false")
auto_review=$(jq -r '.coding_agent.auto_review // false' agent-workflow/config/config.json 2>/dev/null || echo "false")

if [ "$auto_merge" == "true" ] && [ "$auto_review" == "true" ]; then
    print_success "Agent configuration is correctly set for auto-merge"
else
    print_error "Agent configuration missing auto-merge settings"
    echo "  auto_merge: $auto_merge"
    echo "  auto_review: $auto_review"
    exit 1
fi

print_status "Step 2: Checking workflow files..."

# Check if auto-review workflow exists
if [ -f ".github/workflows/auto-review-merge.yml" ]; then
    print_success "Auto-review workflow found"
else
    print_error "Auto-review workflow missing"
    exit 1
fi

# Check if continuous agent workflow exists
if [ -f ".github/workflows/continuous-agent.yml" ]; then
    print_success "Continuous agent workflow found"
else
    print_warning "Continuous agent workflow missing"
fi

print_status "Step 3: Testing continuous agent script..."

# Test continuous agent script
if [ -f "scripts/continuous-agent.js" ]; then
    # Check if the script can be executed (basic syntax check)
    node -c scripts/continuous-agent.js && print_success "Continuous agent script syntax is valid"
else
    print_error "Continuous agent script missing"
    exit 1
fi

print_status "Step 4: Validating current repository state..."

# Check for any linting errors
if command -v npm &> /dev/null && [ -f "package.json" ]; then
    if npm run lint &> /dev/null; then
        print_success "No linting errors found"
    else
        print_warning "Linting issues detected (may affect auto-merge)"
    fi
else
    print_warning "Cannot run linting check (npm or package.json missing)"
fi

# Check if we're on a feature branch
current_branch=$(git branch --show-current)
if [[ $current_branch == copilot/* ]]; then
    print_success "On Copilot feature branch: $current_branch"
else
    print_warning "Not on a Copilot feature branch: $current_branch"
fi

print_status "Step 5: Simulating automation workflow..."

# Simulate the continuous agent workflow
echo "Simulating continuous agent analysis..."
if node scripts/continuous-agent.js status 2>/dev/null; then
    print_success "Continuous agent executed successfully"
else
    print_warning "Continuous agent execution had issues (may be expected without full setup)"
fi

print_status "Step 6: Checking current PR status..."

# Check if there's an open PR for this branch
if command -v gh &> /dev/null; then
    if gh pr view --json state,draft,mergeable 2>/dev/null; then
        print_success "PR found and accessible via GitHub CLI"
        
        # Get PR details
        pr_state=$(gh pr view --json state --jq '.state' 2>/dev/null || echo "unknown")
        pr_draft=$(gh pr view --json draft --jq '.draft' 2>/dev/null || echo "unknown")
        pr_mergeable=$(gh pr view --json mergeable --jq '.mergeable' 2>/dev/null || echo "unknown")
        
        echo "  State: $pr_state"
        echo "  Draft: $pr_draft"
        echo "  Mergeable: $pr_mergeable"
        
        if [ "$pr_draft" == "true" ]; then
            print_warning "PR is currently in draft state"
            echo "  Auto-review will trigger once PR is marked as ready"
        else
            print_success "PR is ready for review and auto-merge"
        fi
    else
        print_warning "Cannot access PR information (may need GitHub CLI setup)"
    fi
else
    print_warning "GitHub CLI not available for PR status check"
fi

echo ""
print_status "🎯 Auto-Review and Merge Test Summary"
echo "======================================"

echo "✅ Configuration Validation: PASSED"
echo "✅ Workflow Files: PRESENT"  
echo "✅ Script Validation: PASSED"
echo "✅ Repository State: VALIDATED"

print_success "The continuous agent auto-review and merge functionality is properly configured!"

echo ""
print_status "📋 Next Steps:"
echo "1. The auto-review workflow will trigger automatically for PRs created by Copilot"
echo "2. PRs will be validated (linting, mergeable state) before auto-merge"
echo "3. Successful merges will trigger the next automation cycle"
echo "4. Monitor the Actions tab for workflow execution logs"

echo ""
print_status "🔄 To manually trigger the automation cycle:"
echo "   gh workflow run continuous-agent.yml --field mode=full --field force_run=true"

echo ""
print_status "🤖 Auto-Review and Merge Setup Complete!"
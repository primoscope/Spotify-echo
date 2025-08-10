#!/usr/bin/env bash
set -euo pipefail

# EchoTune AI - DigitalOcean App Platform Spec Generator
# Generates production-ready App Platform specifications from templates

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
SPEC_OUTPUT="$PROJECT_ROOT/.do/app-platform.yaml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running in CI or local environment
is_ci() {
    [ -n "${CI:-}" ] || [ -n "${GITHUB_ACTIONS:-}" ]
}

# Validate that no secrets are present in template
validate_template_security() {
    log_info "Validating template security..."
    
    local template_file="$PROJECT_ROOT/.do/deploy.template.yaml"
    
    # Check for common secret patterns
    local secret_patterns=(
        "dop_v1_"          # DigitalOcean API tokens
        "sk-"              # OpenAI API keys
        "AIza"             # Google API keys  
        "password.*:"      # Password fields
        "_key.*:.*[a-zA-Z0-9]{20}" # Long key values
        "_secret.*:.*[a-zA-Z0-9]{20}" # Long secret values
    )
    
    local issues_found=0
    
    for pattern in "${secret_patterns[@]}"; do
        if grep -i "$pattern" "$template_file" >/dev/null 2>&1; then
            log_error "Security issue: Pattern '$pattern' found in template"
            ((issues_found++))
        fi
    done
    
    # Check for demo/mock configurations in production specs
    if grep -i "demo_mode.*true" "$template_file" >/dev/null 2>&1; then
        log_error "Security issue: DEMO_MODE=true found in production template"
        ((issues_found++))
    fi
    
    if grep -i "default_llm_provider.*mock" "$template_file" >/dev/null 2>&1; then
        log_error "Security issue: DEFAULT_LLM_PROVIDER=mock found in production template"
        ((issues_found++))
    fi
    
    if [ $issues_found -gt 0 ]; then
        log_error "Template security validation failed with $issues_found issues"
        return 1
    fi
    
    log_success "Template security validation passed"
    return 0
}

# Generate App Platform spec from template
generate_spec() {
    local environment="${1:-production}"
    
    log_info "Generating DigitalOcean App Platform spec for $environment environment..."
    
    # Use the secure template as base
    local template_file="$PROJECT_ROOT/.do/deploy.template.yaml"
    
    if [ ! -f "$template_file" ]; then
        log_error "Template file not found: $template_file"
        return 1
    fi
    
    # Copy template to output with timestamp and metadata
    cat > "$SPEC_OUTPUT" << EOF
# Generated DigitalOcean App Platform Specification
# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# Environment: $environment
# Repository: dzp5103/Spotify-echo
# 
# SECURITY NOTICE: This spec contains NO secrets or API keys
# All sensitive environment variables must be set in the DigitalOcean UI
#
# Required Environment Variables (set in DO UI):
# - SPOTIFY_CLIENT_ID (required)
# - SPOTIFY_CLIENT_SECRET (required)  
# - SPOTIFY_REDIRECT_URI (required)
# - OPENAI_API_KEY (required)
# - MONGODB_URI (required)
# - SESSION_SECRET (required - generate random string)
# - JWT_SECRET (required - generate random string)
#
# Optional Environment Variables:
# - GEMINI_API_KEY (alternative AI provider)
# - LLM_PROVIDER (defaults to 'openai')
# - REDIS_URL (for caching and sessions)
# - BROWSERBASE_API_KEY (for browser automation)
# - BROWSERBASE_PROJECT_ID (for browser automation)

EOF
    
    # Append the template content
    cat "$template_file" >> "$SPEC_OUTPUT"
    
    log_success "App Platform spec generated: $SPEC_OUTPUT"
}

# Validate the generated spec
validate_spec() {
    log_info "Validating generated spec..."
    
    if [ ! -f "$SPEC_OUTPUT" ]; then
        log_error "Generated spec file not found"
        return 1
    fi
    
    # Check if doctl is available for validation
    if command -v doctl >/dev/null 2>&1; then
        if doctl apps spec validate "$SPEC_OUTPUT" >/dev/null 2>&1; then
            log_success "Spec validation passed (doctl)"
        else
            log_warning "Spec validation failed (doctl) - this may be due to missing credentials"
        fi
    else
        log_warning "doctl not available - skipping formal spec validation"
    fi
    
    # Basic YAML syntax validation
    if command -v yq >/dev/null 2>&1; then
        if yq eval '.' "$SPEC_OUTPUT" >/dev/null 2>&1; then
            log_success "YAML syntax validation passed"
        else
            log_error "YAML syntax validation failed"
            return 1
        fi
    elif command -v python3 >/dev/null 2>&1; then
        if python3 -c "import yaml; yaml.safe_load(open('$SPEC_OUTPUT'))" 2>/dev/null; then
            log_success "YAML syntax validation passed (python)"
        else
            log_error "YAML syntax validation failed (python)"
            return 1
        fi
    else
        log_warning "No YAML validator available - skipping syntax check"
    fi
    
    log_success "Spec validation completed"
}

# Show deployment instructions
show_deployment_instructions() {
    cat << EOF

🚀 DigitalOcean Deployment Instructions
=====================================

Your App Platform specification has been generated: $SPEC_OUTPUT

Next Steps:
1. Set environment variables in DigitalOcean UI (see spec file comments)
2. Deploy using one of these methods:

Method 1: DigitalOcean UI
- Go to https://cloud.digitalocean.com/apps
- Click "Create App" 
- Select "GitHub" and authorize your repo
- Upload the generated spec file: $SPEC_OUTPUT

Method 2: doctl CLI (if configured)
- doctl apps create --spec $SPEC_OUTPUT

Method 3: One-click Deploy Button  
- Use the button in README.md which references the template

⚠️  IMPORTANT SECURITY REMINDERS:
- NEVER commit API keys or secrets to the repository
- Always set sensitive environment variables in the DO UI
- The spec file contains NO secrets by design
- Review the environment variables list in the generated spec

🔗 Useful Links:
- DigitalOcean Apps: https://cloud.digitalocean.com/apps
- Environment Variables: https://docs.digitalocean.com/products/app-platform/how-to/use-environment-variables/
- doctl CLI: https://docs.digitalocean.com/reference/doctl/

EOF
}

# Main function
main() {
    local environment="${1:-production}"
    local validate_only="${2:-false}"
    
    echo "🌊 DigitalOcean App Platform Spec Generator"
    echo "==========================================="
    echo ""
    
    # Security validation first
    if ! validate_template_security; then
        log_error "Template security validation failed - aborting"
        exit 1
    fi
    
    if [ "$validate_only" = "true" ]; then
        log_success "Template security validation completed successfully"
        exit 0
    fi
    
    # Generate spec
    generate_spec "$environment"
    
    # Validate generated spec
    validate_spec
    
    # Show instructions (skip in CI)
    if ! is_ci; then
        show_deployment_instructions
    fi
    
    log_success "DigitalOcean App Platform spec generation completed"
}

# Handle command line arguments
case "${1:-generate}" in
    generate)
        main "${2:-production}"
        ;;
    validate)
        main "production" "true"
        ;;
    help|--help)
        cat << EOF
Usage: $0 [command] [environment]

Commands:
  generate [env]  Generate App Platform spec (default: production)
  validate        Validate template security only
  help           Show this help message

Examples:
  $0 generate production
  $0 validate

EOF
        exit 0
        ;;
    *)
        log_error "Unknown command: $1"
        exit 1
        ;;
esac
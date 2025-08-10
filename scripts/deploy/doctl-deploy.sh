#!/usr/bin/env bash
set -euo pipefail

# EchoTune AI - DigitalOcean doctl Deployment Script
# Validates spec and updates/creates App Platform apps when secrets are present

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
SPEC_FILE="$PROJECT_ROOT/.do/app-platform.yaml"
GENERATED_SPEC="$PROJECT_ROOT/.do/generated-app-spec.yaml"

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

# Check if running in CI environment
is_ci() {
    [ -n "${CI:-}" ] || [ -n "${GITHUB_ACTIONS:-}" ]
}

# Check if doctl is configured with valid credentials
check_doctl_auth() {
    log_info "Checking doctl authentication..."
    
    if ! command -v doctl >/dev/null 2>&1; then
        log_warning "doctl CLI not found"
        return 1
    fi
    
    # Check if DO_TOKEN is set
    if [ -z "${DO_TOKEN:-}" ]; then
        log_warning "DO_TOKEN environment variable not set"
        return 1
    fi
    
    # Try to authenticate using the token
    if ! doctl auth init --access-token "$DO_TOKEN" >/dev/null 2>&1; then
        log_error "doctl authentication failed with provided DO_TOKEN"
        return 1
    fi
    
    # Test account access
    if ! doctl account get >/dev/null 2>&1; then
        log_error "Cannot access DigitalOcean account with provided credentials"
        return 1
    fi
    
    log_success "doctl authentication successful"
    return 0
}

# Generate App Platform specification
generate_spec() {
    log_info "Generating App Platform specification..."
    
    # Use our spec generator
    if [ -f "$SCRIPT_DIR/do-app-platform-spec.sh" ]; then
        if ! "$SCRIPT_DIR/do-app-platform-spec.sh" generate production; then
            log_error "Failed to generate App Platform specification"
            return 1
        fi
    else
        log_error "App Platform spec generator not found"
        return 1
    fi
    
    # Copy to generated location for deployment
    if [ -f "$SPEC_FILE" ]; then
        cp "$SPEC_FILE" "$GENERATED_SPEC"
        log_success "App Platform spec ready for deployment"
    else
        log_error "Generated spec file not found"
        return 1
    fi
}

# Validate the app specification
validate_spec() {
    log_info "Validating App Platform specification..."
    
    if [ ! -f "$GENERATED_SPEC" ]; then
        log_error "Spec file not found: $GENERATED_SPEC"
        return 1
    fi
    
    if ! doctl apps spec validate "$GENERATED_SPEC"; then
        log_error "App Platform spec validation failed"
        return 1
    fi
    
    log_success "App Platform spec validation passed"
}

# Check if app already exists
check_existing_app() {
    local app_name="${1:-echotune-ai}"
    
    log_info "Checking for existing App Platform app: $app_name"
    
    # List apps and check if our app exists
    if doctl apps list --format Name --no-header | grep -q "^$app_name$"; then
        log_success "Found existing app: $app_name"
        
        # Get app ID
        local app_id=$(doctl apps list --format ID,Name --no-header | grep "$app_name" | cut -d' ' -f1)
        echo "$app_id"
        return 0
    else
        log_info "No existing app found with name: $app_name"
        echo ""
        return 1
    fi
}

# Create new app
create_app() {
    log_info "Creating new App Platform app..."
    
    if ! doctl apps create --spec "$GENERATED_SPEC"; then
        log_error "Failed to create App Platform app"
        return 1
    fi
    
    log_success "App Platform app created successfully"
}

# Update existing app
update_app() {
    local app_id="$1"
    
    log_info "Updating existing App Platform app: $app_id"
    
    if ! doctl apps update "$app_id" --spec "$GENERATED_SPEC"; then
        log_error "Failed to update App Platform app"
        return 1
    fi
    
    log_success "App Platform app updated successfully"
}

# Monitor deployment progress
monitor_deployment() {
    local app_id="${1:-}"
    
    if [ -z "$app_id" ]; then
        log_warning "No app ID provided for monitoring"
        return
    fi
    
    log_info "Monitoring deployment progress for app: $app_id"
    
    # Get deployment status
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        local status=$(doctl apps get "$app_id" --format Status --no-header 2>/dev/null || echo "unknown")
        
        case $status in
            "ACTIVE")
                log_success "Deployment completed successfully"
                return 0
                ;;
            "BUILDING"|"DEPLOYING")
                log_info "Deployment in progress... ($status)"
                ;;
            "ERROR")
                log_error "Deployment failed"
                return 1
                ;;
            *)
                log_warning "Unknown deployment status: $status"
                ;;
        esac
        
        ((attempt++))
        sleep 10
    done
    
    log_warning "Deployment monitoring timed out"
}

# Get app URL
get_app_url() {
    local app_id="${1:-}"
    
    if [ -z "$app_id" ]; then
        return
    fi
    
    local url=$(doctl apps get "$app_id" --format LiveURL --no-header 2>/dev/null || echo "")
    if [ -n "$url" ]; then
        log_success "App deployed at: $url"
        echo "🌐 Access your app at: $url"
    fi
}

# Show deployment summary
show_summary() {
    local app_id="${1:-}"
    local operation="${2:-deployment}"
    
    echo ""
    echo "📋 Deployment Summary"
    echo "===================="
    
    if [ -n "$app_id" ]; then
        echo "App ID: $app_id"
        echo "Operation: $operation"
        
        # Get app details
        if command -v doctl >/dev/null 2>&1 && [ -n "${DO_TOKEN:-}" ]; then
            echo ""
            echo "App Details:"
            doctl apps get "$app_id" --format Name,Status,LiveURL --no-header 2>/dev/null || echo "Unable to fetch app details"
        fi
    fi
    
    echo ""
    echo "Next steps:"
    echo "1. Check your app status in the DigitalOcean UI"
    echo "2. Monitor logs: doctl apps logs $app_id --follow"
    echo "3. Set any missing environment variables in the DO UI"
}

# Dry run mode - validate only
dry_run() {
    log_info "Running in dry-run mode - validation only"
    
    generate_spec
    
    if check_doctl_auth; then
        validate_spec
        log_success "Dry run completed - spec is valid and ready for deployment"
    else
        log_warning "Dry run completed - spec generated but doctl validation skipped (no credentials)"
    fi
}

# Main deployment function
deploy() {
    local force_create="${1:-false}"
    local monitor="${2:-true}"
    
    log_info "Starting DigitalOcean App Platform deployment..."
    
    # Generate specification
    generate_spec
    
    # Check authentication
    if ! check_doctl_auth; then
        if is_ci; then
            log_warning "No doctl credentials in CI - this is expected for PR builds"
            exit 0
        else
            log_error "doctl authentication required for deployment"
            exit 1
        fi
    fi
    
    # Validate spec
    validate_spec
    
    # Check for existing app
    local app_id=""
    if [ "$force_create" = "false" ]; then
        app_id=$(check_existing_app "echotune-ai" || echo "")
    fi
    
    # Deploy app
    if [ -n "$app_id" ] && [ "$force_create" = "false" ]; then
        update_app "$app_id"
        operation="update"
    else
        create_app
        # Get the new app ID
        app_id=$(doctl apps list --format ID,Name --no-header | grep "echotune-ai" | cut -d' ' -f1 | head -1)
        operation="create"
    fi
    
    # Monitor deployment if requested
    if [ "$monitor" = "true" ] && [ -n "$app_id" ]; then
        monitor_deployment "$app_id"
        get_app_url "$app_id"
    fi
    
    # Show summary
    show_summary "$app_id" "$operation"
    
    log_success "DigitalOcean App Platform deployment completed"
}

# Main function
main() {
    echo "🌊 DigitalOcean App Platform Deployment"
    echo "======================================="
    echo ""
    
    case "${1:-deploy}" in
        deploy)
            deploy false true
            ;;
        create)
            deploy true true
            ;;
        update)
            # Find existing app and update it
            if app_id=$(check_existing_app "echotune-ai"); then
                update_app "$app_id"
            else
                log_error "No existing app found to update"
                exit 1
            fi
            ;;
        validate|dry-run)
            dry_run
            ;;
        monitor)
            if [ -n "${2:-}" ]; then
                monitor_deployment "$2"
            else
                log_error "App ID required for monitoring"
                exit 1
            fi
            ;;
        help|--help)
            cat << EOF
Usage: $0 [command] [options]

Commands:
  deploy      Deploy app (update if exists, create if not)
  create      Force create new app
  update      Update existing app only  
  validate    Validate spec without deploying (dry-run)
  monitor     Monitor deployment progress
  help        Show this help message

Environment Variables:
  DO_TOKEN    DigitalOcean API token (required for deployment)

Examples:
  $0 deploy
  $0 validate
  $0 monitor <app-id>

EOF
            exit 0
            ;;
        *)
            log_error "Unknown command: $1"
            log_info "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Cleanup on exit
cleanup() {
    if [ -f "$GENERATED_SPEC" ]; then
        rm -f "$GENERATED_SPEC"
    fi
}
trap cleanup EXIT

# Run main function
main "$@"
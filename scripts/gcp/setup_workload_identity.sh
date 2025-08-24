#!/usr/bin/env bash

# GCP Workload Identity Federation Setup Script
# 
# This script provides idempotent setup of Workload Identity Federation for GitHub Actions
# to access Google Cloud resources securely without long-lived service account keys.
#
# Usage:
#   ./setup_workload_identity.sh
#   
# Environment Variables:
#   PROJECT_ID          - GCP Project ID (required)
#   PROJECT_NUMBER      - GCP Project Number (optional, will be fetched if not set)
#   REPO_FULL_NAME      - GitHub repository in format owner/repo (required)
#   POOL_ID            - Workload Identity Pool ID (default: github-actions)
#   PROVIDER_ID        - OIDC Provider ID (default: github-oidc)
#   SA_EMAIL           - Service Account Email (default: github-vertex@PROJECT_ID.iam.gserviceaccount.com)
#   FORCE_RECREATE     - Force recreation of existing resources (default: false)
#   DRY_RUN           - Show what would be done without making changes (default: false)

set -euo pipefail

# Configuration
PROJECT_ID=${PROJECT_ID:-}
PROJECT_NUMBER=${PROJECT_NUMBER:-}
REPO_FULL_NAME=${REPO_FULL_NAME:-}
POOL_ID=${POOL_ID:-github-actions}
PROVIDER_ID=${PROVIDER_ID:-github-oidc}
SA_EMAIL=${SA_EMAIL:-}
FORCE_RECREATE=${FORCE_RECREATE:-false}
DRY_RUN=${DRY_RUN:-false}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    printf "[%s] %s\n" "$(date -u +%H:%M:%S)" "$*"
}

log_info() {
    printf "${BLUE}[INFO]${NC} %s\n" "$*"
}

log_success() {
    printf "${GREEN}[SUCCESS]${NC} %s\n" "$*"
}

log_warning() {
    printf "${YELLOW}[WARNING]${NC} %s\n" "$*"
}

log_error() {
    printf "${RED}[ERROR]${NC} %s\n" "$*"
}

# Validation functions
validate_requirements() {
    log_info "Validating requirements..."
    
    # Check if gcloud is installed
    if ! command -v gcloud &> /dev/null; then
        log_error "gcloud CLI not found. Please install Google Cloud SDK"
        exit 1
    fi
    
    # Check if authenticated
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        log_error "No active gcloud authentication found. Please run 'gcloud auth login'"
        exit 1
    fi
    
    # Check required environment variables
    if [[ -z "$PROJECT_ID" ]]; then
        log_error "PROJECT_ID environment variable is required"
        exit 1
    fi
    
    if [[ -z "$REPO_FULL_NAME" ]]; then
        log_error "REPO_FULL_NAME environment variable is required (format: owner/repo)"
        exit 1
    fi
    
    # Set default service account email if not provided
    if [[ -z "$SA_EMAIL" ]]; then
        SA_EMAIL="github-vertex@${PROJECT_ID}.iam.gserviceaccount.com"
    fi
    
    log_success "Requirements validation passed"
}

# Get project number if not set
get_project_number() {
    if [[ -z "$PROJECT_NUMBER" ]]; then
        log_info "Fetching project number for $PROJECT_ID..."
        PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)" 2>/dev/null || true)
        if [[ -z "$PROJECT_NUMBER" ]]; then
            log_error "Could not fetch project number for $PROJECT_ID"
            exit 1
        fi
        log_success "Project number: $PROJECT_NUMBER"
    fi
}

# Check if resource exists
exists_pool() {
    gcloud iam workload-identity-pools describe "$POOL_ID" --location=global --project="$PROJECT_ID" >/dev/null 2>&1
}

exists_provider() {
    gcloud iam workload-identity-pools providers describe "$PROVIDER_ID" \
        --workload-identity-pool="$POOL_ID" \
        --location=global \
        --project="$PROJECT_ID" >/dev/null 2>&1
}

exists_service_account() {
    gcloud iam service-accounts describe "$SA_EMAIL" --project="$PROJECT_ID" >/dev/null 2>&1
}

# Enable required APIs
enable_apis() {
    log_info "Enabling required APIs..."
    
    local apis=(
        "aiplatform.googleapis.com"
        "iamcredentials.googleapis.com" 
        "iam.googleapis.com"
        "serviceusage.googleapis.com"
    )
    
    for api in "${apis[@]}"; do
        if [[ "$DRY_RUN" == "true" ]]; then
            log_info "[DRY RUN] Would enable API: $api"
        else
            log_info "Enabling API: $api"
            if gcloud services enable "$api" --project="$PROJECT_ID" 2>/dev/null; then
                log_success "Enabled: $api"
            else
                log_warning "Failed to enable $api or already enabled"
            fi
        fi
    done
}

# Setup workload identity pool
setup_pool() {
    log_info "Setting up Workload Identity Pool: $POOL_ID"
    
    if exists_pool; then
        log_info "Pool $POOL_ID already exists"
        if [[ "$FORCE_RECREATE" == "true" ]]; then
            if [[ "$DRY_RUN" == "true" ]]; then
                log_info "[DRY RUN] Would recreate pool: $POOL_ID"
            else
                log_warning "Recreating pool $POOL_ID (FORCE_RECREATE=true)"
                # Use || true to ignore NOT_FOUND errors gracefully
                gcloud iam workload-identity-pools delete "$POOL_ID" \
                    --location=global \
                    --project="$PROJECT_ID" \
                    --quiet || {
                    log_warning "Pool deletion failed or pool didn't exist (this is OK)"
                }
                log_info "Creating new pool: $POOL_ID"
                gcloud iam workload-identity-pools create "$POOL_ID" \
                    --location=global \
                    --display-name="GitHub Actions Pool" \
                    --project="$PROJECT_ID"
                log_success "Pool recreated: $POOL_ID"
            fi
        else
            log_success "Using existing pool: $POOL_ID"
        fi
    else
        if [[ "$DRY_RUN" == "true" ]]; then
            log_info "[DRY RUN] Would create pool: $POOL_ID"
        else
            log_info "Creating pool: $POOL_ID"
            gcloud iam workload-identity-pools create "$POOL_ID" \
                --location=global \
                --display-name="GitHub Actions Pool" \
                --project="$PROJECT_ID"
            log_success "Pool created: $POOL_ID"
        fi
    fi
}

# Setup OIDC provider
setup_provider() {
    log_info "Setting up OIDC Provider: $PROVIDER_ID"
    
    if exists_provider; then
        log_info "Provider $PROVIDER_ID already exists"
        if [[ "$FORCE_RECREATE" == "true" ]]; then
            if [[ "$DRY_RUN" == "true" ]]; then
                log_info "[DRY RUN] Would recreate provider: $PROVIDER_ID"
            else
                log_warning "Recreating provider $PROVIDER_ID (FORCE_RECREATE=true)"
                # Use || true to ignore NOT_FOUND errors gracefully
                gcloud iam workload-identity-pools providers delete "$PROVIDER_ID" \
                    --workload-identity-pool="$POOL_ID" \
                    --location=global \
                    --project="$PROJECT_ID" \
                    --quiet || {
                    log_warning "Provider deletion failed or provider didn't exist (this is OK)"
                }
                log_info "Creating new provider: $PROVIDER_ID"
                gcloud iam workload-identity-pools providers create-oidc "$PROVIDER_ID" \
                    --workload-identity-pool="$POOL_ID" \
                    --location=global \
                    --issuer-uri="https://token.actions.githubusercontent.com" \
                    --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
                    --attribute-condition="assertion.repository=='$REPO_FULL_NAME'" \
                    --project="$PROJECT_ID"
                log_success "Provider recreated: $PROVIDER_ID"
            fi
        else
            log_success "Using existing provider: $PROVIDER_ID"
        fi
    else
        if [[ "$DRY_RUN" == "true" ]]; then
            log_info "[DRY RUN] Would create provider: $PROVIDER_ID"
        else
            log_info "Creating provider: $PROVIDER_ID"
            gcloud iam workload-identity-pools providers create-oidc "$PROVIDER_ID" \
                --workload-identity-pool="$POOL_ID" \
                --location=global \
                --issuer-uri="https://token.actions.githubusercontent.com" \
                --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
                --attribute-condition="assertion.repository=='$REPO_FULL_NAME'" \
                --project="$PROJECT_ID"
            log_success "Provider created: $PROVIDER_ID"
        fi
    fi
}

# Setup service account and IAM bindings
setup_service_account() {
    log_info "Setting up service account: $SA_EMAIL"
    
    if ! exists_service_account; then
        if [[ "$DRY_RUN" == "true" ]]; then
            log_info "[DRY RUN] Would create service account: $SA_EMAIL"
        else
            log_info "Creating service account: $SA_EMAIL"
            local sa_name=$(echo "$SA_EMAIL" | cut -d'@' -f1)
            gcloud iam service-accounts create "$sa_name" \
                --display-name="GitHub Actions Vertex AI Service Account" \
                --project="$PROJECT_ID"
            log_success "Service account created: $SA_EMAIL"
        fi
    else
        log_success "Service account already exists: $SA_EMAIL"
    fi
    
    # Grant required roles
    log_info "Setting up IAM roles for service account..."
    local roles=(
        "roles/aiplatform.user"
        "roles/storage.admin"
        "roles/monitoring.viewer"
        "roles/logging.viewer"
    )
    
    for role in "${roles[@]}"; do
        if [[ "$DRY_RUN" == "true" ]]; then
            log_info "[DRY RUN] Would grant role $role to $SA_EMAIL"
        else
            log_info "Granting role: $role"
            gcloud projects add-iam-policy-binding "$PROJECT_ID" \
                --member="serviceAccount:$SA_EMAIL" \
                --role="$role" \
                --quiet || log_warning "Role $role may already be assigned"
        fi
    done
}

# Setup workload identity binding
setup_workload_identity_binding() {
    log_info "Setting up Workload Identity binding..."
    
    local principal="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$POOL_ID/attribute.repository/$REPO_FULL_NAME"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would bind workloadIdentityUser role"
        log_info "[DRY RUN] Principal: $principal"
        log_info "[DRY RUN] Service Account: $SA_EMAIL"
    else
        log_info "Binding workloadIdentityUser role..."
        
        # Check if binding already exists
        local existing_binding
        existing_binding=$(gcloud iam service-accounts get-iam-policy "$SA_EMAIL" \
            --project="$PROJECT_ID" \
            --format="value(bindings[].members)" 2>/dev/null | grep -F "$principal" || true)
        
        if [[ -n "$existing_binding" ]]; then
            log_success "Workload identity binding already exists"
        else
            gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
                --role="roles/iam.workloadIdentityUser" \
                --member="$principal" \
                --project="$PROJECT_ID"
            log_success "Workload identity binding created"
        fi
    fi
}

# Display summary
display_summary() {
    log_info "=== Workload Identity Federation Setup Summary ==="
    echo ""
    echo "Project ID: $PROJECT_ID"
    echo "Project Number: $PROJECT_NUMBER"
    echo "Repository: $REPO_FULL_NAME"
    echo "Pool ID: $POOL_ID"
    echo "Provider ID: $PROVIDER_ID"
    echo "Service Account: $SA_EMAIL"
    echo "Dry Run: $DRY_RUN"
    echo "Force Recreate: $FORCE_RECREATE"
    echo ""
    
    if [[ "$DRY_RUN" != "true" ]]; then
        echo "Generated Workload Identity Provider:"
        echo "projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$POOL_ID/providers/$PROVIDER_ID"
        echo ""
        echo "Add these secrets to your GitHub repository:"
        echo "GCP_PROJECT_ID=$PROJECT_ID"
        echo "GCP_PROJECT_NUMBER=$PROJECT_NUMBER"
        echo "WORKLOAD_IDENTITY_PROVIDER=projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$POOL_ID/providers/$PROVIDER_ID"
        echo "GCP_SERVICE_ACCOUNT=$SA_EMAIL"
    fi
    echo ""
    log_success "Workload Identity Federation setup completed!"
}

# Main execution
main() {
    log_info "Starting Workload Identity Federation setup..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_warning "DRY RUN MODE - No actual changes will be made"
    fi
    
    validate_requirements
    get_project_number
    enable_apis
    setup_pool
    setup_provider
    setup_service_account
    setup_workload_identity_binding
    display_summary
}

# Handle script interruption
trap 'log_error "Script interrupted"; exit 1' INT TERM

# Run main function
main "$@"
#!/bin/bash

# EchoTune AI - Comprehensive Vercel Deployment Script
# This script automates the complete Vercel deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="echotune-ai"
VERCEL_TEAM=""
VERCEL_PROJECT_ID=""
DEPLOYMENT_TYPE="preview" # preview, production, or both

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${MAGENTA}[STEP]${NC} $1"
}

log_header() {
    echo -e "\n${CYAN}${1}${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_step "Checking prerequisites..."
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        log_error "Vercel CLI is not installed. Installing now..."
        npm install -g vercel
    else
        log_success "Vercel CLI is installed ($(vercel --version))"
    fi
    
    # Check if Node.js is available
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    # Check if npm is available
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    # Check if git is available
    if ! command -v git &> /dev/null; then
        log_error "Git is not installed"
        exit 1
    fi
    
    log_success "All prerequisites are met"
}

# Install dependencies
install_dependencies() {
    log_step "Installing dependencies..."
    
    if [ -f "package-lock.json" ]; then
        npm ci
    else
        npm install
    fi
    
    log_success "Dependencies installed"
}

# Build the project
build_project() {
    log_step "Building the project..."
    
    # Clean previous builds
    if [ -d "dist" ]; then
        rm -rf dist
    fi
    
    # Run build
    npm run build
    
    if [ ! -d "dist" ]; then
        log_error "Build failed - dist directory not created"
        exit 1
    fi
    
    # Verify build output
    if [ ! -f "dist/index.html" ]; then
        log_error "Build output missing index.html"
        exit 1
    fi
    
    log_success "Project built successfully"
    log_info "Build size: $(du -sh dist | cut -f1)"
}

# Check Vercel project status
check_vercel_status() {
    log_step "Checking Vercel project status..."
    
    if [ -f ".vercel/project.json" ]; then
        log_info "Project is already linked to Vercel"
        VERCEL_PROJECT_ID=$(cat .vercel/project.json | grep -o '"projectId":"[^"]*"' | cut -d'"' -f4)
        log_info "Project ID: $VERCEL_PROJECT_ID"
        
        # Get project info
        if vercel project ls | grep -q "$VERCEL_PROJECT_ID"; then
            log_success "Project found on Vercel"
        else
            log_warning "Project not found on Vercel, will create new one"
            VERCEL_PROJECT_ID=""
        fi
    else
        log_warning "Project is not linked to Vercel"
    fi
}

# Link to Vercel project
link_vercel_project() {
    log_step "Linking to Vercel project..."
    
    if [ -z "$VERCEL_PROJECT_ID" ]; then
        log_info "Creating new Vercel project..."
        vercel --yes
    else
        log_info "Linking to existing project: $VERCEL_PROJECT_ID"
        vercel link --project-id "$VERCEL_PROJECT_ID"
    fi
    
    log_success "Project linked to Vercel"
}

# Set environment variables
set_environment_variables() {
    log_step "Setting environment variables..."
    
    # Check if .env.production.vercel exists
    if [ ! -f ".env.production.vercel" ]; then
        log_warning ".env.production.vercel file not found"
        log_info "Running environment setup script..."
        node scripts/setup-vercel-env.js
    fi
    
    if [ ! -f ".env.production.vercel" ]; then
        log_error "Environment file still not found after setup"
        exit 1
    fi
    
    # Read environment variables and set them in Vercel
    local env_count=0
    while IFS= read -r line; do
        # Skip comments and empty lines
        if [[ $line =~ ^[[:space:]]*# ]] || [[ -z $line ]]; then
            continue
        fi
        
        # Extract key and value
        if [[ $line =~ ^([^=]+)=(.*)$ ]]; then
            key="${BASH_REMATCH[1]}"
            value="${BASH_REMATCH[2]}"
            
            # Skip placeholder values
            if [[ $value =~ your_.*_here ]] || [[ $value =~ your_.*_key_here ]]; then
                log_warning "Skipping placeholder: $key"
                continue
            fi
            
            log_info "Setting $key..."
            echo "$value" | vercel env add "$key" production
            ((env_count++))
        fi
    done < .env.production.vercel
    
    log_success "Environment variables set ($env_count variables)"
}

# Deploy to Vercel
deploy_to_vercel() {
    log_step "Deploying to Vercel..."
    
    case $DEPLOYMENT_TYPE in
        "preview")
            log_info "Deploying to preview environment..."
            vercel
            ;;
        "production")
            log_info "Deploying directly to production..."
            vercel --prod
            ;;
        "both")
            log_info "Deploying to preview first..."
            vercel
            
            # Ask if user wants to deploy to production
            read -p "Do you want to deploy to production? (y/N): " -n 1 -r
            echo
            
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                log_info "Deploying to production..."
                vercel --prod
                log_success "Deployed to production successfully!"
            else
                log_info "Skipping production deployment"
            fi
            ;;
    esac
}

# Verify deployment
verify_deployment() {
    log_step "Verifying deployment..."
    
    # Get the deployment URL
    local deployment_url=""
    if [ "$DEPLOYMENT_TYPE" = "production" ] || [ "$DEPLOYMENT_TYPE" = "both" ]; then
        deployment_url=$(vercel ls | grep -o 'https://[^[:space:]]*' | head -1)
    else
        deployment_url=$(vercel ls | grep -o 'https://[^[:space:]]*' | tail -1)
    fi
    
    if [ -n "$deployment_url" ]; then
        log_success "Deployment URL: $deployment_url"
        
        # Test health endpoint
        log_info "Testing health endpoint..."
        if curl -f "$deployment_url/api/health" > /dev/null 2>&1; then
            log_success "Health endpoint is working"
        else
            log_warning "Health endpoint test failed"
        fi
        
        # Test frontend
        log_info "Testing frontend..."
        if curl -f "$deployment_url" > /dev/null 2>&1; then
            log_success "Frontend is accessible"
        else
            log_warning "Frontend test failed"
        fi
        
        # Save deployment info
        echo "Deployment URL: $deployment_url" > .vercel-deployment-info.txt
        echo "Deployment Time: $(date)" >> .vercel-deployment-info.txt
        echo "Deployment Type: $DEPLOYMENT_TYPE" >> .vercel-deployment-info.txt
        
    else
        log_warning "Could not determine deployment URL"
    fi
}

# Show deployment status
show_deployment_status() {
    log_step "Checking deployment status..."
    
    if [ -f ".vercel-deployment-info.txt" ]; then
        log_info "Last deployment info:"
        cat .vercel-deployment-info.txt
    fi
    
    log_info "Recent deployments:"
    vercel ls --limit 5
}

# Clean up
cleanup() {
    log_step "Cleaning up..."
    
    # Remove build artifacts if requested
    if [ "$CLEANUP_BUILD" = "true" ]; then
        if [ -d "dist" ]; then
            rm -rf dist
            log_info "Build artifacts cleaned up"
        fi
    fi
    
    log_success "Cleanup completed"
}

# Main deployment function
main() {
    log_header "🚀 Starting Vercel deployment for EchoTune AI..."
    
    check_prerequisites
    install_dependencies
    build_project
    check_vercel_status
    link_vercel_project
    set_environment_variables
    deploy_to_vercel
    verify_deployment
    cleanup
    
    log_success "Deployment completed successfully!"
    log_info "Next steps:"
    log_info "1. Update your domain settings in Vercel dashboard"
    log_info "2. Configure custom domain if needed"
    log_info "3. Set up monitoring and analytics"
    log_info "4. Test all functionality in production"
    log_info "5. Check .vercel-deployment-info.txt for deployment details"
}

# Help function
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help           Show this help message"
    echo "  -c, --check          Only check prerequisites and project status"
    echo "  -b, --build          Only build the project"
    echo "  -e, --env            Only set environment variables"
    echo "  -d, --deploy         Only deploy (assumes everything else is ready)"
    echo "  -p, --preview        Deploy to preview environment only"
    echo "  -P, --production     Deploy directly to production"
    echo "  -s, --status         Show deployment status"
    echo "  --cleanup            Clean up build artifacts after deployment"
    echo "  --deployment-type    Set deployment type (preview/production/both)"
    echo ""
    echo "Examples:"
    echo "  $0                    # Full deployment (preview + optional production)"
    echo "  $0 --check            # Check prerequisites only"
    echo "  $0 --build            # Build project only"
    echo "  $0 --deploy           # Deploy only"
    echo "  $0 --production       # Deploy directly to production"
    echo "  $0 --status           # Show deployment status"
    echo "  $0 --cleanup          # Deploy with cleanup"
}

# Parse command line arguments
CLEANUP_BUILD="false"

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -c|--check)
            check_prerequisites
            check_vercel_status
            exit 0
            ;;
        -b|--build)
            check_prerequisites
            install_dependencies
            build_project
            exit 0
            ;;
        -e|--env)
            check_prerequisites
            set_environment_variables
            exit 0
            ;;
        -d|--deploy)
            check_prerequisites
            deploy_to_vercel
            verify_deployment
            exit 0
            ;;
        -p|--preview)
            DEPLOYMENT_TYPE="preview"
            shift
            ;;
        -P|--production)
            DEPLOYMENT_TYPE="production"
            shift
            ;;
        -s|--status)
            show_deployment_status
            exit 0
            ;;
        --cleanup)
            CLEANUP_BUILD="true"
            shift
            ;;
        --deployment-type)
            DEPLOYMENT_TYPE="$2"
            shift 2
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate deployment type
if [[ ! "$DEPLOYMENT_TYPE" =~ ^(preview|production|both)$ ]]; then
    log_error "Invalid deployment type: $DEPLOYMENT_TYPE"
    log_error "Valid options: preview, production, both"
    exit 1
fi

# Run main function
main
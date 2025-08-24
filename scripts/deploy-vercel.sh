#!/bin/bash

# EchoTune AI - Vercel Deployment Script
# This script automates the Vercel deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="echotune-ai"
VERCEL_TEAM=""
VERCEL_PROJECT_ID=""

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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        log_error "Vercel CLI is not installed. Installing now..."
        npm install -g vercel
    else
        log_success "Vercel CLI is installed"
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
    
    log_success "All prerequisites are met"
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    
    if [ -f "package-lock.json" ]; then
        npm ci
    else
        npm install
    fi
    
    log_success "Dependencies installed"
}

# Build the project
build_project() {
    log_info "Building the project..."
    
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
    
    log_success "Project built successfully"
}

# Check Vercel project status
check_vercel_status() {
    log_info "Checking Vercel project status..."
    
    if [ -f ".vercel/project.json" ]; then
        log_info "Project is already linked to Vercel"
        VERCEL_PROJECT_ID=$(cat .vercel/project.json | grep -o '"projectId":"[^"]*"' | cut -d'"' -f4)
        log_info "Project ID: $VERCEL_PROJECT_ID"
    else
        log_warning "Project is not linked to Vercel"
    fi
}

# Link to Vercel project
link_vercel_project() {
    log_info "Linking to Vercel project..."
    
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
    log_info "Setting environment variables..."
    
    # Check if .env.production.vercel exists
    if [ ! -f ".env.production.vercel" ]; then
        log_error ".env.production.vercel file not found"
        log_info "Please create this file with your production environment variables"
        exit 1
    fi
    
    # Read environment variables and set them in Vercel
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
            if [[ $value =~ your_.*_here ]]; then
                log_warning "Skipping placeholder: $key"
                continue
            fi
            
            log_info "Setting $key..."
            echo "$value" | vercel env add "$key" production
        fi
    done < .env.production.vercel
    
    log_success "Environment variables set"
}

# Deploy to Vercel
deploy_to_vercel() {
    log_info "Deploying to Vercel..."
    
    # Deploy to preview first
    log_info "Deploying to preview environment..."
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
}

# Verify deployment
verify_deployment() {
    log_info "Verifying deployment..."
    
    # Get the deployment URL
    DEPLOYMENT_URL=$(vercel ls | grep -o 'https://[^[:space:]]*' | head -1)
    
    if [ -n "$DEPLOYMENT_URL" ]; then
        log_success "Deployment URL: $DEPLOYMENT_URL"
        
        # Test health endpoint
        log_info "Testing health endpoint..."
        if curl -f "$DEPLOYMENT_URL/api/health" > /dev/null 2>&1; then
            log_success "Health endpoint is working"
        else
            log_warning "Health endpoint test failed"
        fi
    else
        log_warning "Could not determine deployment URL"
    fi
}

# Main deployment function
main() {
    log_info "Starting Vercel deployment for EchoTune AI..."
    
    check_prerequisites
    install_dependencies
    build_project
    check_vercel_status
    link_vercel_project
    set_environment_variables
    deploy_to_vercel
    verify_deployment
    
    log_success "Deployment completed successfully!"
    log_info "Next steps:"
    log_info "1. Update your domain settings in Vercel dashboard"
    log_info "2. Configure custom domain if needed"
    log_info "3. Set up monitoring and analytics"
    log_info "4. Test all functionality in production"
}

# Help function
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -c, --check    Only check prerequisites and project status"
    echo "  -b, --build    Only build the project"
    echo "  -e, --env      Only set environment variables"
    echo "  -d, --deploy   Only deploy (assumes everything else is ready)"
    echo ""
    echo "Examples:"
    echo "  $0              # Full deployment"
    echo "  $0 --check      # Check prerequisites only"
    echo "  $0 --build      # Build project only"
    echo "  $0 --deploy     # Deploy only"
}

# Parse command line arguments
case "${1:-}" in
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
    "")
        main
        ;;
    *)
        log_error "Unknown option: $1"
        show_help
        exit 1
        ;;
esac
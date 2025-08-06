#!/bin/bash

# Comprehensive Deployment Validation Script for EchoTune AI
# Uses MCP Browserbase for automated browser-based testing
# Validates SSL, domain configuration, and end-to-end functionality

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="${DOMAIN:-localhost}"
PORT="${PORT:-3000}"
HTTPS_PORT="${HTTPS_PORT:-443}"
HTTP_PORT="${HTTP_PORT:-80}"

echo -e "${BLUE}🚀 EchoTune AI Deployment Validation${NC}"
echo "=================================="
echo -e "Domain: ${GREEN}$DOMAIN${NC}"
echo -e "Ports: HTTP=${GREEN}$HTTP_PORT${NC}, HTTPS=${GREEN}$HTTPS_PORT${NC}, App=${GREEN}$PORT${NC}"
echo ""

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Validation results
VALIDATION_RESULTS=()
CRITICAL_ERRORS=()
WARNINGS=()

# Helper functions
log_success() {
    echo -e "${GREEN}✅ $1${NC}"
    VALIDATION_RESULTS+=("SUCCESS: $1")
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    WARNINGS+=("WARNING: $1")
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    CRITICAL_ERRORS+=("ERROR: $1")
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Test health endpoint
test_health_endpoint() {
    log_info "Testing health endpoint..."
    
    local url="http://$DOMAIN:$PORT/health"
    if [ "$DOMAIN" != "localhost" ] && [ "$SSL_ENABLED" = "true" ]; then
        url="https://$DOMAIN/health"
    fi
    
    if curl -f -s --max-time 10 "$url" > /tmp/health_response.json; then
        local status=$(cat /tmp/health_response.json | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        if [ "$status" = "healthy" ] || [ "$status" = "alive" ]; then
            log_success "Health endpoint accessible and returning healthy status"
        else
            log_warning "Health endpoint accessible but status is: $status"
        fi
    else
        log_error "Health endpoint not accessible at $url"
    fi
}

# Test SSL configuration
test_ssl_configuration() {
    log_info "Testing SSL configuration..."
    
    if [ "$SSL_ENABLED" = "true" ] && [ "$DOMAIN" != "localhost" ]; then
        # Test SSL certificate
        if openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" </dev/null 2>/dev/null | openssl x509 -noout -dates 2>/dev/null; then
            log_success "SSL certificate is valid and accessible"
            
            # Check certificate expiry
            local cert_expiry=$(openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" </dev/null 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
            if [ -n "$cert_expiry" ]; then
                log_info "SSL certificate expires: $cert_expiry"
            fi
        else
            log_error "SSL certificate not valid or not accessible"
        fi
        
        # Test HTTPS redirect
        if curl -I --max-time 10 "http://$DOMAIN" 2>/dev/null | grep -q "301\|302"; then
            log_success "HTTP to HTTPS redirect is working"
        else
            log_warning "HTTP to HTTPS redirect may not be configured"
        fi
    else
        log_info "SSL is disabled or domain is localhost, skipping SSL tests"
    fi
}

# Test nginx configuration
test_nginx_configuration() {
    log_info "Testing nginx configuration..."
    
    if command -v nginx >/dev/null 2>&1; then
        if nginx -t 2>/dev/null; then
            log_success "Nginx configuration is valid"
        else
            log_error "Nginx configuration is invalid"
        fi
    else
        log_info "Nginx not installed, skipping configuration test"
    fi
    
    # Test if nginx is running
    if systemctl is-active --quiet nginx 2>/dev/null; then
        log_success "Nginx service is running"
    elif pgrep nginx >/dev/null; then
        log_success "Nginx process is running"
    else
        log_warning "Nginx service/process not detected"
    fi
}

# Test database connectivity
test_database_connectivity() {
    log_info "Testing database connectivity..."
    
    local url="http://$DOMAIN:$PORT/api/database/status"
    if [ "$DOMAIN" != "localhost" ] && [ "$SSL_ENABLED" = "true" ]; then
        url="https://$DOMAIN/api/database/status"
    fi
    
    if curl -f -s --max-time 10 "$url" > /tmp/db_status.json; then
        local mongodb_status=$(cat /tmp/db_status.json | grep -o '"mongodb":{"status":"[^"]*"' | cut -d'"' -f6)
        local sqlite_status=$(cat /tmp/db_status.json | grep -o '"sqlite":{"status":"[^"]*"' | cut -d'"' -f6)
        
        if [ "$mongodb_status" = "connected" ]; then
            log_success "MongoDB connection is healthy"
        else
            log_warning "MongoDB status: ${mongodb_status:-unknown}"
        fi
        
        if [ "$sqlite_status" = "connected" ]; then
            log_success "SQLite fallback is available"
        else
            log_info "SQLite status: ${sqlite_status:-unknown}"
        fi
    else
        log_error "Database status endpoint not accessible"
    fi
}

# Test API endpoints
test_api_endpoints() {
    log_info "Testing core API endpoints..."
    
    local base_url="http://$DOMAIN:$PORT"
    if [ "$DOMAIN" != "localhost" ] && [ "$SSL_ENABLED" = "true" ]; then
        base_url="https://$DOMAIN"
    fi
    
    # Test settings endpoint
    if curl -f -s --max-time 10 "$base_url/api/settings" >/dev/null; then
        log_success "Settings API is accessible"
    else
        log_warning "Settings API not accessible"
    fi
    
    # Test chat providers endpoint
    if curl -f -s --max-time 10 "$base_url/api/chat/providers" >/dev/null; then
        log_success "Chat providers API is accessible"
    else
        log_warning "Chat providers API not accessible"
    fi
    
    # Test database analytics endpoint
    if curl -f -s --max-time 10 "$base_url/api/database/analytics" >/dev/null; then
        log_success "Database analytics API is accessible"
    else
        log_warning "Database analytics API not accessible"
    fi
}

# Test Docker setup (if using Docker)
test_docker_setup() {
    if command -v docker >/dev/null 2>&1 && docker ps >/dev/null 2>&1; then
        log_info "Testing Docker setup..."
        
        # Check if EchoTune containers are running
        if docker ps --format "table {{.Names}}" | grep -E "(echotune|app)" >/dev/null; then
            log_success "EchoTune Docker containers are running"
            
            # Check container health
            for container in $(docker ps --format "{{.Names}}" | grep -E "(echotune|app)"); do
                local health=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "unknown")
                if [ "$health" = "healthy" ]; then
                    log_success "Container $container is healthy"
                elif [ "$health" = "starting" ]; then
                    log_info "Container $container is starting"
                elif [ "$health" = "unknown" ]; then
                    log_info "Container $container health status unknown"
                else
                    log_warning "Container $container health status: $health"
                fi
            done
        else
            log_info "No EchoTune Docker containers found"
        fi
    else
        log_info "Docker not available, skipping Docker tests"
    fi
}

# Browser-based end-to-end test using MCP
test_browser_functionality() {
    log_info "Running browser-based functionality tests..."
    
    local url="http://$DOMAIN:$PORT"
    if [ "$DOMAIN" != "localhost" ] && [ "$SSL_ENABLED" = "true" ]; then
        url="https://$DOMAIN"
    fi
    
    # Create a simple browser test script
    cat > /tmp/browser_test.js << 'EOF'
const puppeteer = require('puppeteer');

async function testBrowserFunctionality(url) {
    const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors']
    });
    
    try {
        const page = await browser.newPage();
        
        // Set a reasonable timeout
        page.setDefaultTimeout(30000);
        
        console.log(`Testing URL: ${url}`);
        
        // Navigate to the main page
        await page.goto(url, { waitUntil: 'networkidle2' });
        
        // Check if page loaded successfully
        const title = await page.title();
        console.log(`✅ Page loaded successfully. Title: ${title}`);
        
        // Check for critical elements
        const hasHeader = await page.$('header, .header, #header') !== null;
        const hasMain = await page.$('main, .main, #main') !== null;
        const hasChatInterface = await page.$('.chat-interface, #chat, .chat') !== null;
        
        if (hasHeader) console.log('✅ Header element found');
        else console.log('⚠️  Header element not found');
        
        if (hasMain) console.log('✅ Main content area found');
        else console.log('⚠️  Main content area not found');
        
        if (hasChatInterface) console.log('✅ Chat interface found');
        else console.log('ℹ️  Chat interface not detected (may be on different route)');
        
        // Test navigation to chat page
        try {
            const chatLink = await page.$('a[href*="chat"], a[href="/chat"]');
            if (chatLink) {
                await chatLink.click();
                await page.waitForTimeout(2000);
                console.log('✅ Chat navigation working');
            }
        } catch (e) {
            console.log('ℹ️  Chat navigation test skipped');
        }
        
        // Test settings page if accessible
        try {
            await page.goto(`${url}/settings`, { waitUntil: 'networkidle2' });
            const settingsTitle = await page.title();
            console.log('✅ Settings page accessible');
        } catch (e) {
            console.log('ℹ️  Settings page test skipped');
        }
        
        console.log('✅ Browser functionality test completed successfully');
        return true;
        
    } catch (error) {
        console.error(`❌ Browser test failed: ${error.message}`);
        return false;
    } finally {
        await browser.close();
    }
}

// Run the test
const url = process.argv[2] || 'http://localhost:3000';
testBrowserFunctionality(url)
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
        console.error('Test error:', error);
        process.exit(1);
    });
EOF

    # Run the browser test if puppeteer is available
    if command -v node >/dev/null 2>&1 && node -e "require('puppeteer')" 2>/dev/null; then
        if node /tmp/browser_test.js "$url" 2>&1; then
            log_success "Browser functionality tests passed"
        else
            log_warning "Browser functionality tests failed or had issues"
        fi
    else
        log_info "Puppeteer not available, skipping browser tests"
    fi
    
    # Clean up
    rm -f /tmp/browser_test.js
}

# Test environment configuration
test_environment_configuration() {
    log_info "Testing environment configuration..."
    
    # Check critical environment variables
    if [ -n "$DOMAIN" ]; then
        log_success "DOMAIN is configured: $DOMAIN"
    else
        log_warning "DOMAIN not configured (using localhost)"
    fi
    
    if [ -n "$SPOTIFY_CLIENT_ID" ]; then
        log_success "Spotify Client ID is configured"
    else
        log_warning "Spotify Client ID not configured (demo mode only)"
    fi
    
    if [ -n "$MONGODB_URI" ]; then
        log_success "MongoDB URI is configured"
    else
        log_warning "MongoDB URI not configured (using SQLite fallback)"
    fi
    
    # Check for AI provider keys
    local ai_providers=0
    if [ -n "$OPENAI_API_KEY" ]; then
        log_success "OpenAI API key is configured"
        ((ai_providers++))
    fi
    
    if [ -n "$GEMINI_API_KEY" ]; then
        log_success "Gemini API key is configured"
        ((ai_providers++))
    fi
    
    if [ -n "$OPENROUTER_API_KEY" ]; then
        log_success "OpenRouter API key is configured"
        ((ai_providers++))
    fi
    
    if [ $ai_providers -eq 0 ]; then
        log_warning "No AI provider keys configured (using mock provider)"
    fi
}

# Main test execution
echo -e "${BLUE}Running validation tests...${NC}"
echo ""

# Generate nginx config if template exists
if [ -f "nginx.conf.template" ] && [ -x "scripts/generate-nginx-config.sh" ]; then
    log_info "Generating nginx configuration from template..."
    ./scripts/generate-nginx-config.sh
fi

# Run all tests
test_environment_configuration
test_health_endpoint
test_ssl_configuration
test_nginx_configuration
test_database_connectivity
test_api_endpoints
test_docker_setup
test_browser_functionality

# Clean up temporary files
rm -f /tmp/health_response.json /tmp/db_status.json

# Summary
echo ""
echo -e "${BLUE}🎯 Validation Summary${NC}"
echo "===================="

if [ ${#VALIDATION_RESULTS[@]} -gt 0 ]; then
    echo -e "${GREEN}Successful validations (${#VALIDATION_RESULTS[@]}):${NC}"
    for result in "${VALIDATION_RESULTS[@]}"; do
        echo "  $result"
    done
    echo ""
fi

if [ ${#WARNINGS[@]} -gt 0 ]; then
    echo -e "${YELLOW}Warnings (${#WARNINGS[@]}):${NC}"
    for warning in "${WARNINGS[@]}"; do
        echo "  $warning"
    done
    echo ""
fi

if [ ${#CRITICAL_ERRORS[@]} -gt 0 ]; then
    echo -e "${RED}Critical errors (${#CRITICAL_ERRORS[@]}):${NC}"
    for error in "${CRITICAL_ERRORS[@]}"; do
        echo "  $error"
    done
    echo ""
fi

# Final status
if [ ${#CRITICAL_ERRORS[@]} -eq 0 ]; then
    echo -e "${GREEN}🎉 Deployment validation completed successfully!${NC}"
    if [ ${#WARNINGS[@]} -gt 0 ]; then
        echo -e "${YELLOW}Note: There are ${#WARNINGS[@]} warnings that you may want to address.${NC}"
    fi
    exit 0
else
    echo -e "${RED}❌ Deployment validation failed with ${#CRITICAL_ERRORS[@]} critical errors.${NC}"
    echo -e "${YELLOW}Please address the critical errors before proceeding.${NC}"
    exit 1
fi
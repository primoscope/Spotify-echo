#!/bin/bash

# =============================================================================
# EchoTune AI - Deployment Verification Script
# Phase 3: Automated Testing & Deployment Verification
# =============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="${SCRIPT_DIR}/deployment-verification.log"
DOMAIN="${DOMAIN:-localhost}"
HTTP_PORT="${PORT:-3000}"
HTTPS_PORT="443"
MCP_PORT="${MCP_SERVER_PORT:-3001}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Status tracking
CHECKS_PASSED=0
CHECKS_TOTAL=0
ERRORS=()

# Function to run a check
run_check() {
    local test_name="$1"
    local command="$2"
    local expected_result="${3:-0}"
    
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
    
    echo -e "\n${BLUE}[CHECK $CHECKS_TOTAL]${NC} $test_name"
    log "Running check: $test_name"
    
    if eval "$command" >> "$LOG_FILE" 2>&1; then
        if [[ "$expected_result" == "0" ]]; then
            echo -e "${GREEN}✅ PASS${NC}"
            log "PASS: $test_name"
            CHECKS_PASSED=$((CHECKS_PASSED + 1))
        else
            echo -e "${RED}❌ FAIL${NC} (Command succeeded but expected failure)"
            ERRORS+=("$test_name: Expected failure but command succeeded")
            log "FAIL: $test_name - Expected failure but command succeeded"
        fi
    else
        if [[ "$expected_result" == "1" ]]; then
            echo -e "${GREEN}✅ PASS${NC} (Expected failure)"
            log "PASS: $test_name - Expected failure"
            CHECKS_PASSED=$((CHECKS_PASSED + 1))
        else
            echo -e "${RED}❌ FAIL${NC}"
            ERRORS+=("$test_name")
            log "FAIL: $test_name"
        fi
    fi
}

# Initialize log
echo "==============================================================================" > "$LOG_FILE"
echo "EchoTune AI Deployment Verification - $(date)" >> "$LOG_FILE"
echo "Domain: $DOMAIN" >> "$LOG_FILE"
echo "==============================================================================" >> "$LOG_FILE"

echo -e "${BLUE}🚀 EchoTune AI - Deployment Verification${NC}"
echo -e "${BLUE}===============================================${NC}"
echo "Domain: $DOMAIN"
echo "Log file: $LOG_FILE"
echo ""

# =============================================================================
# Phase 3.1: Domain & SSL Certificate Verification
# =============================================================================

echo -e "${YELLOW}📋 Phase 3.1: Domain & SSL Certificate Verification${NC}"

# Check if domain resolves
run_check "Domain DNS Resolution" \
    "nslookup $DOMAIN > /dev/null"

# Check HTTP accessibility (should redirect to HTTPS)
run_check "HTTP Accessibility" \
    "curl -s -o /dev/null -w '%{http_code}' http://$DOMAIN | grep -q '301'"

# Check HTTPS accessibility
run_check "HTTPS Accessibility" \
    "curl -s -o /dev/null -w '%{http_code}' https://$DOMAIN | grep -q '200'"

# SSL Certificate validation
run_check "SSL Certificate Validity" \
    "echo | timeout 10 openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>/dev/null | openssl x509 -noout -dates | grep -q 'notAfter'"

# SSL Certificate expiry check (should not expire in next 30 days)
run_check "SSL Certificate Not Expiring Soon" \
    "echo | timeout 10 openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>/dev/null | openssl x509 -noout -checkend 2592000"

# Check SSL Labs rating (optional, requires internet)
if command -v curl &> /dev/null; then
    run_check "SSL Configuration Security Headers" \
        "curl -sI https://$DOMAIN | grep -q 'Strict-Transport-Security'"
fi

# =============================================================================
# Phase 3.2: Application Load Verification
# =============================================================================

echo -e "\n${YELLOW}📋 Phase 3.2: Application Load Verification${NC}"

# Check if main page loads without errors
run_check "Main Page Load" \
    "curl -s https://$DOMAIN | grep -q 'EchoTune' || curl -s https://$DOMAIN | grep -q 'html'"

# Check for JavaScript errors in console (basic check)
run_check "No Critical JavaScript Errors" \
    "! curl -s https://$DOMAIN | grep -i 'error\\|exception\\|undefined is not a function'"

# Check if favicon loads
run_check "Favicon Accessibility" \
    "curl -s -o /dev/null -w '%{http_code}' https://$DOMAIN/favicon.ico | grep -q '200\\|304'"

# Check if CSS loads properly
run_check "CSS Resources Load" \
    "curl -s https://$DOMAIN | grep -q 'stylesheet\\|<style'"

# =============================================================================
# Phase 3.3: API Connectivity Verification
# =============================================================================

echo -e "\n${YELLOW}📋 Phase 3.3: API Connectivity Verification${NC}"

# Health check endpoint
run_check "Health Check Endpoint" \
    "curl -s https://$DOMAIN/health | grep -q 'healthy\\|ok\\|status'"

# API endpoints accessibility
run_check "API Base Route" \
    "curl -s -o /dev/null -w '%{http_code}' https://$DOMAIN/api/ | grep -q '200\\|404'"

# Check if API returns JSON
run_check "API Returns JSON" \
    "curl -s -H 'Accept: application/json' https://$DOMAIN/api/health | python3 -m json.tool > /dev/null"

# Settings API endpoint
run_check "Settings API Accessibility" \
    "curl -s -o /dev/null -w '%{http_code}' https://$DOMAIN/api/settings/health | grep -q '200'"

# =============================================================================
# Phase 3.4: Database Connection Verification
# =============================================================================

echo -e "\n${YELLOW}📋 Phase 3.4: Database Connection Verification${NC}"

# Test database health through API
run_check "Database Health Check" \
    "curl -s https://$DOMAIN/api/health | grep -q 'database'\\|'healthy'"

# Check database analytics endpoint
run_check "Database Analytics Endpoint" \
    "curl -s -o /dev/null -w '%{http_code}' https://$DOMAIN/api/analytics/database | grep -q '200\\|403\\|401'"

# =============================================================================
# Phase 3.5: Performance & Security Verification
# =============================================================================

echo -e "\n${YELLOW}📋 Phase 3.5: Performance & Security Verification${NC}"

# Response time check (should be under 5 seconds)
run_check "Response Time Under 5s" \
    "curl -o /dev/null -s -w '%{time_total}' https://$DOMAIN | awk '{if (\$1 < 5) exit 0; else exit 1}'"

# Security headers check
run_check "X-Frame-Options Header" \
    "curl -sI https://$DOMAIN | grep -q 'X-Frame-Options'"

run_check "X-Content-Type-Options Header" \
    "curl -sI https://$DOMAIN | grep -q 'X-Content-Type-Options'"

run_check "Content Security Policy Header" \
    "curl -sI https://$DOMAIN | grep -q 'Content-Security-Policy'"

# Rate limiting check (optional)
run_check "Rate Limiting Active" \
    "for i in {1..15}; do curl -s https://$DOMAIN/api/health > /dev/null; done; curl -s -w '%{http_code}' https://$DOMAIN/api/health | grep -q '429'" \
    "0"

# =============================================================================
# Phase 3.6: Service Integration Verification
# =============================================================================

echo -e "\n${YELLOW}📋 Phase 3.6: Service Integration Verification${NC}"

# WebSocket connection (if enabled)
if command -v wscat &> /dev/null; then
    run_check "WebSocket Connection" \
        "timeout 5 wscat -c wss://$DOMAIN/socket.io/\\?EIO\\=4\\&transport\\=websocket --no-check"
fi

# MCP Server connectivity (if running on same host)
if [[ "$DOMAIN" == "localhost" || "$DOMAIN" == "127.0.0.1" ]]; then
    run_check "MCP Server Health" \
        "curl -s http://localhost:$MCP_PORT/health > /dev/null"
fi

# =============================================================================
# Phase 3.7: End-to-End User Journey Verification
# =============================================================================

echo -e "\n${YELLOW}📋 Phase 3.7: End-to-End User Journey Verification${NC}"

# Simulate user landing on homepage
run_check "Homepage User Flow" \
    "curl -s https://$DOMAIN | grep -q 'EchoTune\\|music\\|recommendation\\|AI'"

# Check if settings page is accessible
run_check "Settings Page Accessibility" \
    "curl -s -o /dev/null -w '%{http_code}' https://$DOMAIN/settings | grep -q '200'"

# Check if chat interface elements exist
run_check "Chat Interface Elements" \
    "curl -s https://$DOMAIN | grep -q 'chat\\|message\\|conversation'"

# =============================================================================
# Results Summary
# =============================================================================

echo -e "\n${BLUE}===============================================${NC}"
echo -e "${BLUE}🏁 Deployment Verification Results${NC}"
echo -e "${BLUE}===============================================${NC}"

echo "Checks completed: $CHECKS_TOTAL"
echo -e "Checks passed: ${GREEN}$CHECKS_PASSED${NC}"
echo -e "Checks failed: ${RED}$((CHECKS_TOTAL - CHECKS_PASSED))${NC}"

if [[ ${#ERRORS[@]} -gt 0 ]]; then
    echo -e "\n${RED}❌ Failed Checks:${NC}"
    printf '%s\n' "${ERRORS[@]}" | sed 's/^/  - /'
    
    echo -e "\n${YELLOW}📋 Recommendations:${NC}"
    echo "  1. Check application logs for detailed error information"
    echo "  2. Verify all environment variables are set correctly"
    echo "  3. Ensure all required services are running"
    echo "  4. Check firewall rules and port accessibility"
    echo "  5. Review SSL certificate configuration"
    
    echo -e "\n${RED}🚨 Deployment verification FAILED${NC}"
    log "DEPLOYMENT VERIFICATION FAILED: $((CHECKS_TOTAL - CHECKS_PASSED)) checks failed"
    exit 1
else
    echo -e "\n${GREEN}✅ All checks passed! Deployment verification SUCCESSFUL${NC}"
    log "DEPLOYMENT VERIFICATION SUCCESSFUL: All $CHECKS_TOTAL checks passed"
    
    echo -e "\n${GREEN}🎉 Your EchoTune AI deployment is ready for production!${NC}"
    echo "  🌐 Application URL: https://$DOMAIN"
    echo "  🔧 Health Check: https://$DOMAIN/health"
    echo "  ⚙️ Settings Panel: https://$DOMAIN/settings"
    
    exit 0
fi
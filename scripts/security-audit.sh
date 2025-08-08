#!/bin/bash
# Security audit script for EchoTune AI
# Comprehensive security check for production deployment

set -euo pipefail

echo "🔐 EchoTune AI Security Audit"
echo "============================"
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASS=0
WARN=0
FAIL=0

# Helper functions
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASS++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARN++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAIL++))
}

# 1. Environment Variables Security Check
echo "1. Environment Variables"
echo "------------------------"

if [ -f .env ]; then
    if grep -q "SPOTIFY_CLIENT_SECRET" .env; then
        check_pass "Spotify credentials configured"
    else
        check_fail "Missing Spotify credentials"
    fi
    
    if grep -q "JWT_SECRET" .env; then
        check_pass "JWT secret configured"
    else
        check_fail "Missing JWT secret"
    fi
    
    if grep -q "SESSION_SECRET" .env; then
        check_pass "Session secret configured"
    else
        check_fail "Missing session secret"
    fi
    
    # Check for weak secrets
    if grep -E "(secret|password|key).*=.{1,10}$" .env > /dev/null; then
        check_fail "Weak secrets detected (too short)"
    else
        check_pass "Secret length appears adequate"
    fi
else
    check_fail "No .env file found"
fi

# 2. SSL/TLS Configuration
echo
echo "2. SSL/TLS Configuration"
echo "------------------------"

if [ -d "nginx/ssl" ] || [ -f "ssl/cert.pem" ]; then
    check_pass "SSL certificates directory exists"
else
    check_warn "No SSL certificates found (development mode?)"
fi

# Check nginx configuration
if [ -f "nginx/nginx.conf" ]; then
    if grep -q "ssl_protocols" nginx/nginx.conf; then
        check_pass "SSL protocols configured in nginx"
    else
        check_warn "SSL protocols not explicitly configured"
    fi
    
    if grep -q "ssl_ciphers" nginx/nginx.conf; then
        check_pass "SSL ciphers configured"
    else
        check_warn "SSL ciphers not explicitly configured"
    fi
else
    check_warn "Nginx configuration not found"
fi

# 3. Dependencies Security
echo
echo "3. Dependencies Security"
echo "------------------------"

if command -v npm > /dev/null; then
    echo "Running npm audit..."
    if npm audit --audit-level=high --json > /tmp/audit.json 2>/dev/null; then
        HIGH_VULNS=$(jq '.metadata.vulnerabilities.high // 0' /tmp/audit.json)
        CRITICAL_VULNS=$(jq '.metadata.vulnerabilities.critical // 0' /tmp/audit.json)
        
        if [ "$CRITICAL_VULNS" -eq 0 ] && [ "$HIGH_VULNS" -eq 0 ]; then
            check_pass "No critical or high severity vulnerabilities"
        elif [ "$CRITICAL_VULNS" -eq 0 ]; then
            check_warn "$HIGH_VULNS high severity vulnerabilities found"
        else
            check_fail "$CRITICAL_VULNS critical and $HIGH_VULNS high severity vulnerabilities"
        fi
    else
        check_warn "Could not run npm audit"
    fi
else
    check_warn "npm not available"
fi

# 4. File Permissions
echo
echo "4. File Permissions"
echo "------------------"

# Check for executable scripts
EXEC_COUNT=$(find . -name "*.sh" -executable | wc -l)
if [ "$EXEC_COUNT" -gt 0 ]; then
    check_pass "$EXEC_COUNT executable scripts found"
else
    check_warn "No executable shell scripts found"
fi

# Check for world-readable sensitive files
if find . -name ".env*" -perm /o+r | grep -q .; then
    check_fail "Environment files are world-readable"
else
    check_pass "Environment files have proper permissions"
fi

# 5. Network Security
echo
echo "5. Network Security Configuration"
echo "--------------------------------"

# Check for CORS configuration
if grep -r "cors" src/ > /dev/null; then
    check_pass "CORS middleware configured"
else
    check_warn "CORS configuration not found"
fi

# Check for rate limiting
if grep -r "rate.*limit" src/ > /dev/null; then
    check_pass "Rate limiting implemented"
else
    check_fail "Rate limiting not found"
fi

# Check for helmet security headers
if grep -r "helmet" src/ package.json > /dev/null; then
    check_pass "Security headers (helmet) configured"
else
    check_warn "Security headers middleware not found"
fi

# 6. Authentication Security
echo
echo "6. Authentication & Authorization"
echo "--------------------------------"

# Check for JWT implementation
if grep -r "jwt\|JWT" src/ > /dev/null; then
    check_pass "JWT authentication implemented"
else
    check_warn "JWT authentication not found"
fi

# Check for session management
if grep -r "session" src/ > /dev/null; then
    check_pass "Session management implemented"
else
    check_warn "Session management not found"
fi

# 7. Database Security
echo
echo "7. Database Security"
echo "-------------------"

# Check for SQL injection protection
if grep -r "prepared\|parameterized\|sanitize" src/ > /dev/null; then
    check_pass "SQL injection protection measures found"
else
    check_warn "SQL injection protection not clearly implemented"
fi

# Check for database connection encryption
if grep -r "ssl.*true\|tls.*true" src/ .env* > /dev/null 2>&1; then
    check_pass "Database connection encryption enabled"
else
    check_warn "Database connection encryption not configured"
fi

# 8. Logging and Monitoring
echo
echo "8. Security Logging & Monitoring"
echo "--------------------------------"

# Check for security logging
if grep -r "security.*log\|audit.*log" src/ > /dev/null; then
    check_pass "Security logging implemented"
else
    check_warn "Security logging not found"
fi

# Check for error handling
if grep -r "try.*catch\|error.*handler" src/ > /dev/null; then
    check_pass "Error handling implemented"
else
    check_warn "Error handling not found"
fi

# 9. Production Configuration
echo
echo "9. Production Configuration"
echo "---------------------------"

if grep -q "NODE_ENV.*production" .env* 2>/dev/null; then
    check_pass "Production environment configured"
else
    check_warn "Production environment not set"
fi

# Check for debug mode disabled
if grep -q "DEBUG.*false\|DEBUG.*$" .env* 2>/dev/null; then
    check_pass "Debug mode properly configured"
else
    check_warn "Debug configuration not found"
fi

# 10. Docker Security (if applicable)
echo
echo "10. Docker Security"
echo "------------------"

if [ -f "Dockerfile" ]; then
    if grep -q "USER.*[^root]" Dockerfile; then
        check_pass "Non-root user in Dockerfile"
    else
        check_warn "Dockerfile runs as root"
    fi
    
    if grep -q "COPY.*--chown" Dockerfile; then
        check_pass "Proper file ownership in Dockerfile"
    else
        check_warn "File ownership not explicitly set in Dockerfile"
    fi
else
    check_warn "No Dockerfile found"
fi

# Summary
echo
echo "Security Audit Summary"
echo "====================="
echo -e "${GREEN}✓ Passed: $PASS${NC}"
echo -e "${YELLOW}⚠ Warnings: $WARN${NC}"
echo -e "${RED}✗ Failed: $FAIL${NC}"

# Calculate score
TOTAL=$((PASS + WARN + FAIL))
SCORE=$((PASS * 100 / TOTAL))

echo
echo "Security Score: $SCORE%"

if [ "$SCORE" -ge 80 ]; then
    echo -e "${GREEN}Excellent security posture!${NC}"
elif [ "$SCORE" -ge 60 ]; then
    echo -e "${YELLOW}Good security, some improvements needed${NC}"
else
    echo -e "${RED}Security needs significant improvements${NC}"
fi

# Recommendations
echo
echo "Recommendations"
echo "==============="

if [ "$FAIL" -gt 0 ]; then
    echo "🔴 Critical: Address all failed checks before production deployment"
fi

if [ "$WARN" -gt 0 ]; then
    echo "🟡 Important: Review and address warnings for enhanced security"
fi

echo "🔵 Consider implementing additional security measures:"
echo "   - Web Application Firewall (WAF)"
echo "   - Intrusion Detection System (IDS)"
echo "   - Regular security scanning and penetration testing"
echo "   - Security headers analysis (securityheaders.com)"
echo "   - Dependency vulnerability monitoring"

# Exit with appropriate code
if [ "$FAIL" -gt 0 ]; then
    exit 1
elif [ "$WARN" -gt 0 ]; then
    exit 2
else
    exit 0
fi
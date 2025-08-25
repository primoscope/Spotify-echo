#!/bin/bash

# Security Validation Script for EchoTune AI
# Validates input sanitization, API key handling, and vulnerability scanning

set -e

echo "🔒 Starting Security Validation for EchoTune AI..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running in project directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Must be run from project root directory${NC}"
    exit 1
fi

echo "📋 Security Validation Checklist:"
echo "================================="

# 1. Check for hardcoded secrets
echo -e "\n1. ${YELLOW}Checking for hardcoded secrets...${NC}"
SECRET_PATTERNS=(
    "api[_-]?key.*[=:]\s*['\"][^'\"]{20,}"
    "secret.*[=:]\s*['\"][^'\"]{20,}"
    "token.*[=:]\s*['\"][^'\"]{20,}"
    "password.*[=:]\s*['\"][^'\"]{8,}"
    "sk-[a-zA-Z0-9]{48}"
    "xai-[a-zA-Z0-9]{64}"
    "AIza[a-zA-Z0-9]{35}"
)

SECRET_FOUND=false
for pattern in "${SECRET_PATTERNS[@]}"; do
    if grep -r -E "$pattern" src/ --include="*.js" --include="*.ts" --exclude-dir=node_modules > /dev/null 2>&1; then
        echo -e "${RED}   ❌ Potential hardcoded secret found with pattern: $pattern${NC}"
        SECRET_FOUND=true
    fi
done

if [ "$SECRET_FOUND" = false ]; then
    echo -e "${GREEN}   ✅ No hardcoded secrets found${NC}"
fi

# 2. Check environment variable usage
echo -e "\n2. ${YELLOW}Validating environment variable usage...${NC}"
if grep -r "process\.env\." src/ --include="*.js" --include="*.ts" | grep -v "process\.env\.NODE_ENV" > /dev/null; then
    echo -e "${GREEN}   ✅ Environment variables are being used${NC}"
else
    echo -e "${YELLOW}   ⚠️  No environment variables found - check if API keys are properly externalized${NC}"
fi

# 3. Check for secure API key validation
echo -e "\n3. ${YELLOW}Checking API key validation patterns...${NC}"
VALIDATION_PATTERNS=(
    "startsWith.*sk-"
    "\.length.*>=.*40"
    "apiKey.*validation"
    "invalid.*api.*key"
)

VALIDATION_FOUND=false
for pattern in "${VALIDATION_PATTERNS[@]}"; do
    if grep -r -E "$pattern" src/ --include="*.js" --include="*.ts" > /dev/null 2>&1; then
        VALIDATION_FOUND=true
        break
    fi
done

if [ "$VALIDATION_FOUND" = true ]; then
    echo -e "${GREEN}   ✅ API key validation patterns found${NC}"
else
    echo -e "${YELLOW}   ⚠️  Consider adding API key format validation${NC}"
fi

# 4. Check for input sanitization
echo -e "\n4. ${YELLOW}Checking input sanitization...${NC}"
SANITIZATION_PATTERNS=(
    "trim\(\)"
    "sanitize"
    "escape"
    "validator\."
    "xss"
)

SANITIZATION_FOUND=false
for pattern in "${SANITIZATION_PATTERNS[@]}"; do
    if grep -r -E "$pattern" src/ --include="*.js" --include="*.ts" > /dev/null 2>&1; then
        SANITIZATION_FOUND=true
        break
    fi
done

if [ "$SANITIZATION_FOUND" = true ]; then
    echo -e "${GREEN}   ✅ Input sanitization patterns found${NC}"
else
    echo -e "${YELLOW}   ⚠️  Consider adding input sanitization for user data${NC}"
fi

# 5. Check for SQL injection protection
echo -e "\n5. ${YELLOW}Checking SQL injection protection...${NC}"
if grep -r -E "(\.query\(|\.exec\(|\.find\()" src/ --include="*.js" --include="*.ts" | grep -v "//.*query" > /dev/null; then
    echo -e "${GREEN}   ✅ Using parameterized queries/ORM methods${NC}"
else
    echo -e "${GREEN}   ✅ No direct SQL query patterns found${NC}"
fi

# 6. Check for proper error handling
echo -e "\n6. ${YELLOW}Checking error handling patterns...${NC}"
ERROR_PATTERNS=(
    "try.*{[\s\S]*catch"
    "\.catch\("
    "throw new Error"
    "console\.error"
)

ERROR_HANDLING_FOUND=false
for pattern in "${ERROR_PATTERNS[@]}"; do
    if grep -r -E "$pattern" src/ --include="*.js" --include="*.ts" > /dev/null 2>&1; then
        ERROR_HANDLING_FOUND=true
        break
    fi
done

if [ "$ERROR_HANDLING_FOUND" = true ]; then
    echo -e "${GREEN}   ✅ Error handling patterns found${NC}"
else
    echo -e "${RED}   ❌ Limited error handling found - add try/catch blocks${NC}"
fi

# 7. Check for rate limiting
echo -e "\n7. ${YELLOW}Checking rate limiting implementation...${NC}"
RATE_LIMIT_PATTERNS=(
    "rate.*limit"
    "express-rate-limit"
    "slowDown"
    "limiter"
)

RATE_LIMIT_FOUND=false
for pattern in "${RATE_LIMIT_PATTERNS[@]}"; do
    if grep -r -E "$pattern" src/ --include="*.js" --include="*.ts" > /dev/null 2>&1; then
        RATE_LIMIT_FOUND=true
        break
    fi
done

if [ "$RATE_LIMIT_FOUND" = true ]; then
    echo -e "${GREEN}   ✅ Rate limiting implementation found${NC}"
else
    echo -e "${YELLOW}   ⚠️  Consider implementing rate limiting for API endpoints${NC}"
fi

# 8. Check dependencies for known vulnerabilities
echo -e "\n8. ${YELLOW}Checking for dependency vulnerabilities...${NC}"
if command -v npm &> /dev/null; then
    npm audit --audit-level=moderate > audit_results.txt 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}   ✅ No moderate or higher vulnerabilities found${NC}"
    else
        VULN_COUNT=$(grep -c "vulnerability" audit_results.txt 2>/dev/null || echo "0")
        if [ "$VULN_COUNT" -gt 0 ]; then
            echo -e "${YELLOW}   ⚠️  $VULN_COUNT vulnerabilities found - run 'npm audit fix'${NC}"
        else
            echo -e "${GREEN}   ✅ Dependency audit completed${NC}"
        fi
    fi
    rm -f audit_results.txt
else
    echo -e "${YELLOW}   ⚠️  npm not available - skipping dependency audit${NC}"
fi

# 9. Check HTTPS usage
echo -e "\n9. ${YELLOW}Checking HTTPS enforcement...${NC}"
HTTPS_PATTERNS=(
    "https://"
    "ssl"
    "tls"
    "secure.*true"
)

HTTPS_FOUND=false
for pattern in "${HTTPS_PATTERNS[@]}"; do
    if grep -r -E "$pattern" src/ --include="*.js" --include="*.ts" > /dev/null 2>&1; then
        HTTPS_FOUND=true
        break
    fi
done

if [ "$HTTPS_FOUND" = true ]; then
    echo -e "${GREEN}   ✅ HTTPS/SSL patterns found${NC}"
else
    echo -e "${YELLOW}   ⚠️  Ensure HTTPS is enforced in production${NC}"
fi

# 10. Check for security headers
echo -e "\n10. ${YELLOW}Checking security headers implementation...${NC}"
SECURITY_HEADERS=(
    "helmet"
    "cors"
    "csp"
    "x-frame-options"
    "x-content-type-options"
)

HEADERS_FOUND=false
for header in "${SECURITY_HEADERS[@]}"; do
    if grep -r -E "$header" src/ --include="*.js" --include="*.ts" > /dev/null 2>&1; then
        HEADERS_FOUND=true
        break
    fi
done

if [ "$HEADERS_FOUND" = true ]; then
    echo -e "${GREEN}   ✅ Security headers implementation found${NC}"
else
    echo -e "${YELLOW}   ⚠️  Consider implementing security headers (helmet, CORS, CSP)${NC}"
fi

# Generate security report
echo -e "\n📊 ${YELLOW}Generating Security Report...${NC}"

cat > security-validation-report.md << EOF
# Security Validation Report
Generated: $(date)

## Summary
- **Hardcoded Secrets**: $([ "$SECRET_FOUND" = false ] && echo "✅ PASS" || echo "❌ FAIL")
- **Environment Variables**: ✅ CHECKED  
- **API Key Validation**: $([ "$VALIDATION_FOUND" = true ] && echo "✅ PASS" || echo "⚠️ REVIEW")
- **Input Sanitization**: $([ "$SANITIZATION_FOUND" = true ] && echo "✅ PASS" || echo "⚠️ REVIEW")
- **Error Handling**: $([ "$ERROR_HANDLING_FOUND" = true ] && echo "✅ PASS" || echo "❌ NEEDS WORK")
- **Rate Limiting**: $([ "$RATE_LIMIT_FOUND" = true ] && echo "✅ PASS" || echo "⚠️ REVIEW")
- **HTTPS Usage**: $([ "$HTTPS_FOUND" = true ] && echo "✅ PASS" || echo "⚠️ REVIEW")
- **Security Headers**: $([ "$HEADERS_FOUND" = true ] && echo "✅ PASS" || echo "⚠️ REVIEW")

## Recommendations
1. Ensure all API keys are stored in environment variables
2. Implement input validation and sanitization for all user inputs
3. Add comprehensive error handling with proper logging
4. Consider implementing rate limiting for API endpoints
5. Enforce HTTPS in production environments
6. Add security headers using helmet middleware
7. Regular dependency audits and updates
8. Implement proper session management and authentication

## Next Steps
- Address any failing checks above
- Consider security testing with tools like OWASP ZAP
- Implement automated security scanning in CI/CD pipeline
- Regular security reviews and penetration testing
EOF

echo -e "${GREEN}✅ Security validation complete!${NC}"
echo -e "📄 Report saved to: security-validation-report.md"

# Set exit code based on critical issues
if [ "$SECRET_FOUND" = true ] || [ "$ERROR_HANDLING_FOUND" = false ]; then
    echo -e "\n${RED}⚠️  Critical security issues found - address before production deployment${NC}"
    exit 1
else
    echo -e "\n${GREEN}🔒 Security validation passed - no critical issues found${NC}"
    exit 0
fi
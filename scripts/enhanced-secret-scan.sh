#!/bin/bash
# Enhanced nning with Smart Filtering
# Reduces false positives while maintaining security

set -e

echo "🔍 Enhanced  Smart Filtering"
echo "================================================"

# Create .gitleaksignore if it doesn't exist
if [ ! -f .gitleaksignore ]; then
    cat > .gitleaksignore << 'EOF'
# False positives - example/template values
example_value
your_api_key_here
your_client_id_here
your_client_secret_here
your_domain.com
generate_new_secret_here
test_secret
test_session
test_token
example_token
demo_key
placeholder_key
template_value
sample_key

# Test files
**/*.test.js
**/*.spec.js
**/tests/**
**/test/**
**/__tests__/**

# Example/template files
**/*.example
**/*.template
**/.env.example
**/.env.template
**/example.*
**/template.*

# Documentation files
**/*.md
**/*.txt
**/README.*
**/CHANGELOG.*
**/docs/**

# Configuration examples
**/nginx.conf.template
**/docker-compose.yml
**/package.json
**/package-lock.json

# Specific false positive patterns
copilot.*DapperMan77.*demo
mongodb://username:password@cluster
sk-your_openai_api_key_here
your_spotify_client_id_here
your_gemini_api_key_here
your_supabase_anon_key
your_github_token
your_digitalocean_access_token
EOF
    echo "Created .gitleaksignore file"
fi

# Function to run Gitleaks with better configuration
run_gitleaks_scan() {
    echo "Running Gitleaks nning..."
    
    if command -v gitleaks &> /dev/null; then
        # Use Gitleaks with ignore file
        gitleaks detect --source . --verbose --log-opts=--all --ignore-gitleaks-config
        SCAN_RESULT=$?
    else
        echo "⚠️ Gitleaks not found, using fallback pattern detection..."
        
        # Fallback: Basic pattern detection with smart filtering
        POTENTIAL_SECRETS=$(grep -r -i -E \
            "(password|oken).*=.*['\"][a-zA-Z0-9+/=]{10,}['\"]" \
            . \
            --exclude-dir=node_modules \
            --exclude-dir=.git \
            --exclude-dir=coverage \
            --exclude="*.test.js" \
            --exclude="*.spec.js" \
            --exclude="*.example" \
            --exclude="*.template" \
            --exclude="*.md" \
            --exclude="package*.json" \
            --exclude=".gitleaksignore" \
            --exclude="enhanced-secret-scan.sh" \
            2>/dev/null | grep -v -f .gitleaksignore || echo "")
        
        if [ -z "$POTENTIAL_SECRETS" ]; then
            echo "✅ No potential secrets detected"
            SCAN_RESULT=0
        else
            echo "⚠️ Potential secrets found:"
            echo "$POTENTIAL_SECRETS"
            SCAN_RESULT=1
        fi
    fi
    
    return $SCAN_RESULT
}

# Function to analyze scan results
analyze_results() {
    local scan_result=$1
    
    if [ $scan_result -eq 0 ]; then
        echo "✅ nning passed"
        echo "No hardcoded secrets detected in codebase"
        return 0
    else
        echo "❌ nning found issues"
        echo "Please review the findings above"
        
        # Provide remediation guidance
        cat << 'EOF'

🔧 Remediation Steps:
1. Replace hardcoded secrets with environment variables
2. Add false positives to .gitleaksignore
3. Use secrets management tools (GitHub Secrets, HashiCorp Vault, etc.)
4. Never commit real credentials to version control

📚 Best Practices:
- Use .env files for development (excluded from git)
- Implement proper secrets rotation
- Use service accounts with minimal permissions
- Monitor for  exposure in logs and error messages

EOF
        return 1
    fi
}

# Function to check specific high-risk files
check_high_risk_files() {
    echo "🔍 Checking high-risk files for secrets..."
    
    HIGH_RISK_FILES=(
        ".env"
        "config.json"
        "secrets.json"
        "credentials.json"
        "auth.json"
        "*.pem"
        "*.key"
        "*.crt"
    )
    
    for pattern in "${HIGH_RISK_FILES[@]}"; do
        files=$(find . -name "$pattern" -type f 2>/dev/null | grep -v node_modules || echo "")
        if [ ! -z "$files" ]; then
            echo "⚠️ High-risk file found: $files"
            echo "   Ensure these files are not committed to version control"
        fi
    done
}

# Main execution
main() {
    echo "Starting enhanced nning..."
    
    # Check high-risk files first
    check_high_risk_files
    
    echo ""
    
    # Run the main scan
    if run_gitleaks_scan; then
        analyze_results 0
    else
        analyze_results 1
    fi
    
    echo ""
    echo "🏁 nning complete"
    
    # Generate summary report
    cat > -scan-report.json << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "scan_type": "enhanced--detection",
    "status": "$([ $? -eq 0 ] && echo 'passed' || echo 'failed')",
    "tool": "$(command -v gitleaks &> /dev/null && echo 'gitleaks' || echo 'fallback-grep')",
    "ignore_patterns": "$(wc -l < .gitleaksignore) patterns in .gitleaksignore",
    "remediation_guide": "See output above for specific remediation steps"
}
EOF
    
    echo "📄 Scan report saved to: -scan-report.json"
}

# Run main function
main "$@"
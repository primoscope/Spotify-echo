#!/bin/bash

# ===================================================================
# EchoTune AI - Error Analysis and Fix Script
# Analyzes deployment errors and attempts automatic fixes
# ===================================================================

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/tmp/echotune-fix-$(date +%Y%m%d-%H%M%S).log"
DEPLOY_DIR="/opt/echotune"
DEPLOY_USER="echotune"
SERVICE_NAME="echotune-ai"

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] ✓ $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ✗ $1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] ℹ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠ $1${NC}" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${PURPLE}[$(date +'%H:%M:%S')] 🎉 $1${NC}" | tee -a "$LOG_FILE"
}

debug() {
    echo -e "${CYAN}[$(date +'%H:%M:%S')] 🔍 $1${NC}" | tee -a "$LOG_FILE"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root. Use: sudo $0"
        exit 1
    fi
}

# Analyze system health
analyze_system_health() {
    log "Analyzing system health..."
    
    local issues=0
    
    # Check disk space
    local disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [[ $disk_usage -gt 90 ]]; then
        error "Disk usage is ${disk_usage}% (critical)"
        ((issues++))
    elif [[ $disk_usage -gt 80 ]]; then
        warning "Disk usage is ${disk_usage}% (high)"
    else
        log "Disk usage: ${disk_usage}% (OK)"
    fi
    
    # Check memory usage
    local mem_usage=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')
    if [[ $mem_usage -gt 90 ]]; then
        error "Memory usage is ${mem_usage}% (critical)"
        ((issues++))
    elif [[ $mem_usage -gt 80 ]]; then
        warning "Memory usage is ${mem_usage}% (high)"
    else
        log "Memory usage: ${mem_usage}% (OK)"
    fi
    
    # Check load average
    local load_avg=$(uptime | awk -F'load average:' '{ print $2 }' | cut -d, -f1 | xargs)
    local cpu_cores=$(nproc)
    local load_ratio=$(echo "$load_avg $cpu_cores" | awk '{printf("%.2f", $1/$2)}')
    
    if (( $(echo "$load_ratio > 2.0" | bc -l) )); then
        error "Load average is high: $load_avg (${load_ratio}x CPU cores)"
        ((issues++))
    else
        log "Load average: $load_avg (${load_ratio}x CPU cores) (OK)"
    fi
    
    log "System health analysis completed (${issues} critical issues found)"
    return $issues
}

# Analyze service status
analyze_service_status() {
    log "Analyzing service status..."
    
    local issues=0
    
    # Check application service
    if systemctl is-active "$SERVICE_NAME" >/dev/null 2>&1; then
        log "✅ $SERVICE_NAME service is running"
    else
        error "❌ $SERVICE_NAME service is not running"
        ((issues++))
    fi
    
    # Check Nginx
    if systemctl is-active nginx >/dev/null 2>&1; then
        log "✅ Nginx service is running"
    else
        error "❌ Nginx service is not running"
        ((issues++))
    fi
    
    # Check Docker (if used)
    if command -v docker >/dev/null 2>&1; then
        if systemctl is-active docker >/dev/null 2>&1; then
            log "✅ Docker service is running"
        else
            warning "⚠ Docker service is not running"
        fi
    fi
    
    log "Service status analysis completed (${issues} service issues found)"
    return $issues
}

# Analyze application logs
analyze_application_logs() {
    log "Analyzing application logs..."
    
    local issues=0
    local app_log="$DEPLOY_DIR/logs/app.log"
    local error_log="$DEPLOY_DIR/logs/error.log"
    
    # Check if log files exist
    if [[ ! -f "$app_log" ]]; then
        warning "Application log file not found: $app_log"
    else
        # Look for common errors in last 100 lines
        local error_patterns=(
            "Error:"
            "ERROR"
            "ENOENT"
            "EACCES"
            "EPERM"
            "MODULE_NOT_FOUND"
            "Cannot find module"
            "listen EADDRINUSE"
            "Connection refused"
            "SPOTIFY_CLIENT_ID"
            "SPOTIFY_CLIENT_SECRET"
        )
        
        for pattern in "${error_patterns[@]}"; do
            local count=$(tail -100 "$app_log" 2>/dev/null | grep -c "$pattern" || echo 0)
            if [[ $count -gt 0 ]]; then
                error "Found $count occurrences of '$pattern' in application log"
                ((issues++))
            fi
        done
    fi
    
    # Check error log
    if [[ -f "$error_log" ]]; then
        local error_count=$(wc -l < "$error_log" 2>/dev/null || echo 0)
        if [[ $error_count -gt 0 ]]; then
            error "Found $error_count entries in error log"
            ((issues++))
        fi
    fi
    
    # Check systemd journal
    local journal_errors=$(journalctl -u "$SERVICE_NAME" --since "1 hour ago" | grep -i error | wc -l || echo 0)
    if [[ $journal_errors -gt 0 ]]; then
        error "Found $journal_errors error entries in systemd journal"
        ((issues++))
    fi
    
    log "Application log analysis completed (${issues} log issues found)"
    return $issues
}

# Analyze network connectivity
analyze_network_connectivity() {
    log "Analyzing network connectivity..."
    
    local issues=0
    
    # Check if application port is listening
    local app_port=$(grep "^PORT=" "$DEPLOY_DIR/.env" 2>/dev/null | cut -d'=' -f2 || echo "3000")
    if netstat -tlnp | grep ":$app_port " >/dev/null 2>&1; then
        log "✅ Application is listening on port $app_port"
    else
        error "❌ Application is not listening on port $app_port"
        ((issues++))
    fi
    
    # Check if HTTP port 80 is accessible
    if netstat -tlnp | grep ":80 " >/dev/null 2>&1; then
        log "✅ HTTP port 80 is listening"
    else
        warning "⚠ HTTP port 80 is not listening (Nginx may not be configured)"
    fi
    
    # Check if HTTPS port 443 is accessible
    if netstat -tlnp | grep ":443 " >/dev/null 2>&1; then
        log "✅ HTTPS port 443 is listening"
    else
        warning "⚠ HTTPS port 443 is not listening (SSL may not be configured)"
    fi
    
    # Test external connectivity
    if curl -s --connect-timeout 5 google.com >/dev/null 2>&1; then
        log "✅ External internet connectivity is working"
    else
        error "❌ External internet connectivity failed"
        ((issues++))
    fi
    
    log "Network connectivity analysis completed (${issues} network issues found)"
    return $issues
}

# Analyze configuration files
analyze_configuration() {
    log "Analyzing configuration files..."
    
    local issues=0
    
    # Check environment file
    if [[ -f "$DEPLOY_DIR/.env" ]]; then
        log "✅ Environment file exists"
        
        # Check for required variables
        local required_vars=(
            "DOMAIN"
            "PORT"
            "SESSION_SECRET"
            "JWT_SECRET"
        )
        
        for var in "${required_vars[@]}"; do
            if grep -q "^$var=" "$DEPLOY_DIR/.env"; then
                log "✅ $var is configured"
            else
                error "❌ Required variable $var is missing"
                ((issues++))
            fi
        done
        
        # Check for placeholder values
        if grep -q "your_.*_here\|change_this\|replace_with" "$DEPLOY_DIR/.env"; then
            warning "⚠ Found placeholder values in environment file"
        fi
        
    else
        error "❌ Environment file not found: $DEPLOY_DIR/.env"
        ((issues++))
    fi
    
    # Check Nginx configuration
    local domain=$(grep "^DOMAIN=" "$DEPLOY_DIR/.env" 2>/dev/null | cut -d'=' -f2 || echo "localhost")
    if [[ -f "/etc/nginx/sites-available/$domain" ]]; then
        log "✅ Nginx configuration exists"
        
        # Test Nginx configuration
        if nginx -t >/dev/null 2>&1; then
            log "✅ Nginx configuration is valid"
        else
            error "❌ Nginx configuration test failed"
            ((issues++))
        fi
    else
        error "❌ Nginx configuration not found for domain: $domain"
        ((issues++))
    fi
    
    # Check SSL certificates
    if [[ -f "/etc/nginx/ssl/$domain.crt" && -f "/etc/nginx/ssl/$domain.key" ]]; then
        log "✅ SSL certificates exist"
        
        # Check certificate validity
        if openssl x509 -in "/etc/nginx/ssl/$domain.crt" -checkend 86400 >/dev/null 2>&1; then
            log "✅ SSL certificate is valid"
        else
            warning "⚠ SSL certificate is expired or will expire within 24 hours"
        fi
    else
        warning "⚠ SSL certificates not found (HTTPS may not work)"
    fi
    
    log "Configuration analysis completed (${issues} configuration issues found)"
    return $issues
}

# Fix permission issues
fix_permission_issues() {
    log "Fixing permission issues..."
    
    # Fix deploy directory permissions
    if [[ -d "$DEPLOY_DIR" ]]; then
        chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_DIR"
        chmod -R 755 "$DEPLOY_DIR"
        log "Fixed deploy directory permissions"
    fi
    
    # Fix log directory permissions
    if [[ -d "$DEPLOY_DIR/logs" ]]; then
        chmod -R 777 "$DEPLOY_DIR/logs"
        log "Fixed log directory permissions"
    fi
    
    # Fix SSL directory permissions
    if [[ -d "/etc/nginx/ssl" ]]; then
        chmod 755 /etc/nginx/ssl
        chmod 600 /etc/nginx/ssl/*.key 2>/dev/null || true
        chmod 644 /etc/nginx/ssl/*.crt 2>/dev/null || true
        log "Fixed SSL directory permissions"
    fi
    
    # Fix Docker socket permissions
    if [[ -S "/var/run/docker.sock" ]]; then
        chmod 666 /var/run/docker.sock
        log "Fixed Docker socket permissions"
    fi
}

# Fix service issues
fix_service_issues() {
    log "Fixing service issues..."
    
    # Restart failed services
    if ! systemctl is-active "$SERVICE_NAME" >/dev/null 2>&1; then
        log "Restarting $SERVICE_NAME service..."
        systemctl restart "$SERVICE_NAME" || {
            error "Failed to restart $SERVICE_NAME service"
            return 1
        }
        sleep 5
        
        if systemctl is-active "$SERVICE_NAME" >/dev/null 2>&1; then
            log "✅ $SERVICE_NAME service restarted successfully"
        else
            error "❌ $SERVICE_NAME service still not running"
            return 1
        fi
    fi
    
    # Restart Nginx if needed
    if ! systemctl is-active nginx >/dev/null 2>&1; then
        log "Restarting Nginx service..."
        systemctl restart nginx || {
            error "Failed to restart Nginx service"
            return 1
        }
        
        if systemctl is-active nginx >/dev/null 2>&1; then
            log "✅ Nginx service restarted successfully"
        else
            error "❌ Nginx service still not running"
            return 1
        fi
    fi
}

# Fix dependency issues
fix_dependency_issues() {
    log "Fixing dependency issues..."
    
    cd "$DEPLOY_DIR/app" || return 1
    
    # Reinstall Node.js dependencies
    if [[ -f "package.json" ]]; then
        log "Reinstalling Node.js dependencies..."
        sudo -u "$DEPLOY_USER" npm install --production || {
            warning "npm install failed, trying to fix..."
            sudo -u "$DEPLOY_USER" rm -rf node_modules package-lock.json
            sudo -u "$DEPLOY_USER" npm install --production
        }
        log "Node.js dependencies fixed"
    fi
    
    # Reinstall Python dependencies
    if [[ -f "requirements.txt" ]]; then
        log "Reinstalling Python dependencies..."
        python3 -m pip install -r requirements.txt --force-reinstall
        log "Python dependencies fixed"
    fi
}

# Fix network issues
fix_network_issues() {
    log "Fixing network issues..."
    
    # Restart networking if needed
    systemctl restart systemd-networkd || true
    
    # Flush DNS cache
    systemd-resolve --flush-caches 2>/dev/null || true
    
    # Reset iptables to permissive state
    iptables -F || true
    iptables -X || true
    iptables -t nat -F || true
    iptables -t nat -X || true
    
    log "Network configuration reset"
}

# Automatic fix orchestration
perform_automatic_fixes() {
    log "Performing automatic fixes..."
    
    local fixes_applied=0
    
    # Fix permissions (always safe)
    if fix_permission_issues; then
        ((fixes_applied++))
        log "✅ Permission fixes applied"
    fi
    
    # Fix dependencies
    if fix_dependency_issues; then
        ((fixes_applied++))
        log "✅ Dependency fixes applied"
    fi
    
    # Fix services
    if fix_service_issues; then
        ((fixes_applied++))
        log "✅ Service fixes applied"
    fi
    
    # Fix network (if needed)
    if [[ "$(analyze_network_connectivity)" -gt 0 ]]; then
        if fix_network_issues; then
            ((fixes_applied++))
            log "✅ Network fixes applied"
        fi
    fi
    
    log "$fixes_applied automatic fixes applied"
    return $fixes_applied
}

# Generate detailed error report
generate_error_report() {
    log "Generating detailed error report..."
    
    local report_file="$DEPLOY_DIR/ERROR_ANALYSIS_REPORT.md"
    
    cat > "$report_file" << EOF
# EchoTune AI Error Analysis Report

Generated on: $(date)
Script version: 1.0.0

## System Information
- Hostname: $(hostname)
- OS: $(lsb_release -d 2>/dev/null | cut -f2 || uname -s)
- Kernel: $(uname -r)
- Uptime: $(uptime -p 2>/dev/null || uptime)

## Resource Usage
- Disk Usage: $(df -h / | awk 'NR==2 {print $5}') used
- Memory Usage: $(free -h | grep Mem | awk '{print $3 "/" $2}')
- Load Average: $(uptime | awk -F'load average:' '{print $2}')
- CPU Cores: $(nproc)

## Service Status
- Application Service: $(systemctl is-active "$SERVICE_NAME" 2>/dev/null || echo 'inactive')
- Nginx Service: $(systemctl is-active nginx 2>/dev/null || echo 'inactive')
- Docker Service: $(systemctl is-active docker 2>/dev/null || echo 'not installed')

## Network Status
- Application Port: $(netstat -tlnp | grep ":$(grep "^PORT=" "$DEPLOY_DIR/.env" 2>/dev/null | cut -d'=' -f2 || echo "3000")" | wc -l) listeners
- HTTP Port 80: $(netstat -tlnp | grep ":80" | wc -l) listeners
- HTTPS Port 443: $(netstat -tlnp | grep ":443" | wc -l) listeners

## Configuration Files
- Environment File: $(if [[ -f "$DEPLOY_DIR/.env" ]]; then echo "✅ Exists"; else echo "❌ Missing"; fi)
- Nginx Config: $(if [[ -f "/etc/nginx/sites-available/$(grep "^DOMAIN=" "$DEPLOY_DIR/.env" 2>/dev/null | cut -d'=' -f2 || echo "localhost")" ]]; then echo "✅ Exists"; else echo "❌ Missing"; fi)
- SSL Certificates: $(if [[ -f "/etc/nginx/ssl/$(grep "^DOMAIN=" "$DEPLOY_DIR/.env" 2>/dev/null | cut -d'=' -f2 || echo "localhost").crt" ]]; then echo "✅ Exists"; else echo "❌ Missing"; fi)

## Recent Errors

### Application Logs (Last 10 lines)
\`\`\`
$(tail -10 "$DEPLOY_DIR/logs/app.log" 2>/dev/null || echo "No application log found")
\`\`\`

### Error Logs (Last 10 lines)
\`\`\`
$(tail -10 "$DEPLOY_DIR/logs/error.log" 2>/dev/null || echo "No error log found")
\`\`\`

### Systemd Journal (Last 10 entries)
\`\`\`
$(journalctl -u "$SERVICE_NAME" -n 10 --no-pager 2>/dev/null || echo "No systemd journal entries found")
\`\`\`

### Nginx Error Log (Last 10 lines)
\`\`\`
$(tail -10 /var/log/nginx/error.log 2>/dev/null || echo "No nginx error log found")
\`\`\`

## Process Information
\`\`\`
$(ps aux | grep -E "(node|nginx|python)" | grep -v grep || echo "No relevant processes found")
\`\`\`

## Port Usage
\`\`\`
$(netstat -tlnp | grep -E ":(80|443|3000|8080)" || echo "No web server ports in use")
\`\`\`

## Disk Space
\`\`\`
$(df -h)
\`\`\`

## Memory Usage
\`\`\`
$(free -h)
\`\`\`

## Recommendations

Based on the analysis above, consider the following actions:

1. **If services are not running:**
   - Check logs for specific error messages
   - Verify environment configuration
   - Restart services: \`sudo systemctl restart $SERVICE_NAME nginx\`

2. **If configuration issues are found:**
   - Run: \`sudo ./deploy-environment.sh\`
   - Verify Spotify API credentials
   - Check domain DNS configuration

3. **If permission issues exist:**
   - Run: \`sudo ./deploy-permissions.sh\`

4. **If dependency issues are present:**
   - Run: \`sudo ./deploy-install.sh\`
   - Clear npm cache: \`npm cache clean --force\`

5. **If network issues persist:**
   - Check firewall settings
   - Verify domain DNS records
   - Test SSL certificate configuration

## Next Steps

1. Review the error details above
2. Apply the recommended fixes
3. Re-run the error analysis: \`sudo ./deploy-fix.sh\`
4. Monitor logs after fixes: \`tail -f $DEPLOY_DIR/logs/app.log\`

For additional support, visit: https://github.com/dzp5103/Spotify-echo/issues
EOF
    
    chown "$DEPLOY_USER:$DEPLOY_USER" "$report_file"
    chmod 644 "$report_file"
    
    log "Error report generated: $report_file"
}

# Display analysis summary
show_analysis_summary() {
    log ""
    success "🔍 Error analysis and fix attempt completed!"
    log ""
    log "📋 Analysis Summary:"
    
    local total_issues=0
    
    # Run all analyses and count issues
    analyze_system_health || ((total_issues+=$?))
    analyze_service_status || ((total_issues+=$?))
    analyze_application_logs || ((total_issues+=$?))
    analyze_network_connectivity || ((total_issues+=$?))
    analyze_configuration || ((total_issues+=$?))
    
    log "   • Total issues found: $total_issues"
    
    if [[ $total_issues -eq 0 ]]; then
        success "✅ No critical issues found - system appears healthy!"
    elif [[ $total_issues -le 3 ]]; then
        warning "⚠ Minor issues found - system may need attention"
    else
        error "❌ Multiple issues found - manual intervention may be required"
    fi
    
    log ""
    log "📄 Detailed reports:"
    log "   • Error analysis: $DEPLOY_DIR/ERROR_ANALYSIS_REPORT.md"
    log "   • Fix log: $LOG_FILE"
    log ""
    log "🔧 Manual checks you can perform:"
    log "   • View application logs: tail -f $DEPLOY_DIR/logs/app.log"
    log "   • Check service status: sudo systemctl status $SERVICE_NAME"
    log "   • Test health endpoint: curl http://localhost:3000/health"
    log "   • Verify Nginx config: sudo nginx -t"
    log ""
    log "🚀 If issues persist:"
    log "   1. Review the error report above"
    log "   2. Check GitHub issues: https://github.com/dzp5103/Spotify-echo/issues"
    log "   3. Run individual fix scripts: ./deploy-install.sh, ./deploy-permissions.sh, etc."
}

# Main analysis function
main() {
    log "Starting EchoTune AI error analysis and fix..."
    log "Log file: $LOG_FILE"
    
    check_root
    
    # Perform analysis
    log "🔍 Phase 1: Analyzing system state..."
    analyze_system_health
    analyze_service_status
    analyze_application_logs
    analyze_network_connectivity
    analyze_configuration
    
    # Attempt automatic fixes
    log "🔧 Phase 2: Attempting automatic fixes..."
    perform_automatic_fixes
    
    # Generate report
    log "📊 Phase 3: Generating error report..."
    generate_error_report
    
    # Show summary
    show_analysis_summary
    
    log ""
    log "📄 Complete analysis log: $LOG_FILE"
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "EchoTune AI Error Analysis and Fix Script"
        echo ""
        echo "Usage: sudo $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --version, -v  Show script version"
        echo "  --report-only  Generate report without attempting fixes"
        echo ""
        echo "This script analyzes deployment errors and attempts automatic fixes."
        exit 0
        ;;
    --version|-v)
        echo "EchoTune AI Error Analysis and Fix Script v1.0.0"
        exit 0
        ;;
    --report-only)
        log "Running in report-only mode..."
        check_root
        analyze_system_health
        analyze_service_status
        analyze_application_logs
        analyze_network_connectivity
        analyze_configuration
        generate_error_report
        log "Report generated without performing fixes"
        ;;
    *)
        main "$@"
        ;;
esac
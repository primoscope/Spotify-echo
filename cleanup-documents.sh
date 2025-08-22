#!/bin/bash

# =============================================================================
# 🧹 DOCUMENT CLEANUP AND CONSOLIDATION SCRIPT
# Remove redundant files and consolidate documentation
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${SCRIPT_DIR}/document-backups-$(date +%Y%m%d-%H%M%S)"
CLEANUP_LOG="${SCRIPT_DIR}/document-cleanup.log"

print_header() {
    echo -e "${BLUE}"
    echo "═══════════════════════════════════════════════════════════════"
    echo "  🧹 EchoTune AI - Document Cleanup & Consolidation"
    echo "═══════════════════════════════════════════════════════════════"
    echo -e "${NC}"
}

log_message() {
    local message=$1
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $message" >> "$CLEANUP_LOG"
    echo -e "${GREEN}[$(date '+%H:%M:%S')] $message${NC}"
}

log_warning() {
    local message=$1
    echo "$(date '+%Y-%m-%d %H:%M:%S') - [WARN] $message" >> "$CLEANUP_LOG"
    echo -e "${YELLOW}[WARN] $message${NC}"
}

backup_and_remove() {
    local file_path=$1
    local reason=$2
    
    if [ -f "$file_path" ]; then
        # Create backup directory if it doesn't exist
        mkdir -p "$BACKUP_DIR"
        
        # Create relative path structure in backup
        local relative_path=${file_path#$SCRIPT_DIR/}
        local backup_file="$BACKUP_DIR/$relative_path"
        local backup_dir=$(dirname "$backup_file")
        mkdir -p "$backup_dir"
        
        # Copy to backup and remove original
        cp "$file_path" "$backup_file"
        rm "$file_path"
        log_message "🗑️  Removed redundant file: $relative_path ($reason)"
    fi
}

cleanup_validation_reports() {
    echo -e "\n${YELLOW}▶ Cleaning up redundant validation reports${NC}"
    
    # Keep only the main validation report
    backup_and_remove "./MCP_SERVERS_VALIDATION_REPORT.md" "Superseded by main validation"
    backup_and_remove "./GROK4_VALIDATION_REPORT.md" "Superseded by comprehensive validation"  
    backup_and_remove "./GROK4_VALIDATION_REPORT.json" "Superseded by comprehensive validation"
    backup_and_remove "./PERPLEXITY_INTEGRATION_EFFECTIVENESS_VALIDATION_REPORT.md" "Superseded by main validation"
    backup_and_remove "./MCP_RESEARCH_VALIDATION_REPORT.md" "Superseded by main validation"
    backup_and_remove "./MCP_RESEARCH_VALIDATION_REPORT.json" "Superseded by main validation"
    backup_and_remove "./UPDATED_API_VALIDATION_REPORT_FINAL.md" "Superseded by API keys validation"
    backup_and_remove "./REORGANIZATION_VALIDATION_REPORT.md" "Outdated report"
    backup_and_remove "./API_KEYS_VALIDATION_REPORT.json" "Superseded by new validation system"
}

cleanup_roadmaps() {
    echo -e "\n${YELLOW}▶ Consolidating roadmap files${NC}"
    
    # Keep AUTONOMOUS_DEVELOPMENT_ROADMAP.md as the main roadmap
    backup_and_remove "./STRATEGIC_ROADMAP.md" "Consolidated into main roadmap"
    backup_and_remove "./ROADMAP_AUTO.md" "Consolidated into main roadmap"
    backup_and_remove "./COMPREHENSIVE_DEVELOPMENT_ROADMAP.md" "Consolidated into main roadmap"
    backup_and_remove "./docs/FEATURES_AND_FUNCTIONS_ROADMAP.md" "Consolidated into main roadmap"
    backup_and_remove "./docs/AGENT_ROADMAP.md" "Consolidated into main roadmap"
    backup_and_remove "./automation-artifacts/research-output/ROADMAP_UPDATED.md" "Consolidated into main roadmap"
}

cleanup_guides() {
    echo -e "\n${YELLOW}▶ Cleaning up redundant guides${NC}"
    
    # Consolidate setup guides
    backup_and_remove "./ENHANCED_SETUP_GUIDE.md" "Superseded by main setup guide"
    backup_and_remove "./MCP_STACK_COMPLETE_INSTALLATION_GUIDE.md" "Integrated into main setup"
    
    # Consolidate cursor guides  
    backup_and_remove "./CURSOR_IDE_COMPREHENSIVE_USAGE_GUIDE_UPDATED.md" "Superseded by main cursor guide"
    backup_and_remove "./CURSOR_IDE_COMPREHENSIVE_SETUP_GUIDE_FINAL.md" "Superseded by main cursor guide"
    backup_and_remove "./CURSOR_IDE_SETUP.md" "Superseded by comprehensive guide"
}

cleanup_implementation_reports() {
    echo -e "\n${YELLOW}▶ Cleaning up outdated implementation reports${NC}"
    
    backup_and_remove "./ENHANCED_INTEGRATION_IMPLEMENTATION.md" "Implementation completed"
    backup_and_remove "./ENHANCED_MULTIMODAL_GPT5_IMPLEMENTATION.md" "Implementation completed"
    backup_and_remove "./ENHANCED_MULTIMODAL_GPT5_IMPLEMENTATION_SUMMARY.md" "Implementation completed"
    backup_and_remove "./STREAMING_CHAT_IMPLEMENTATION_COMPLETE.md" "Implementation completed"
    backup_and_remove "./MCP_CANDIDATES_IMPLEMENTATION.md" "Implementation completed"
    backup_and_remove "./REDIS_PERFORMANCE_IMPLEMENTATION.md" "Implementation completed"
}

cleanup_analysis_reports() {
    echo -e "\n${YELLOW}▶ Cleaning up redundant analysis reports${NC}"
    
    backup_and_remove "./COMPREHENSIVE_CODE_ASSESSMENT.md" "Assessment completed"
    backup_and_remove "./COMPREHENSIVE_PRODUCTION_ANALYSIS.md" "Analysis completed"
    backup_and_remove "./PRODUCTION_READINESS_ANALYSIS.md" "Analysis completed"
    backup_and_remove "./PRODUCTION_READINESS_EXECUTIVE_SUMMARY.md" "Analysis completed"
    backup_and_remove "./VS_CODE_PERFORMANCE_OPTIMIZATION_REPORT.md" "Optimization completed"
}

cleanup_test_reports() {
    echo -e "\n${YELLOW}▶ Cleaning up test artifacts${NC}"
    
    # Clean up test results and reports that are outdated
    find . -name "MCP_COMPREHENSIVE_TEST_REPORT_*.json" -type f | while read file; do
        backup_and_remove "$file" "Outdated test report"
    done
    
    find . -name "MCP_COMPREHENSIVE_TEST_REPORT_*.md" -type f | while read file; do
        backup_and_remove "$file" "Outdated test report"
    done
}

cleanup_duplicate_configs() {
    echo -e "\n${YELLOW}▶ Cleaning up duplicate configurations${NC}"
    
    backup_and_remove "./env.example (6).txt" "Duplicate env file"
    backup_and_remove "./package-production.json" "Superseded by main package.json"
    backup_and_remove "./requirements-core.txt" "Superseded by main requirements.txt"
    backup_and_remove "./requirements-minimal.txt" "Superseded by main requirements.txt"
    backup_and_remove "./requirements-production.txt" "Superseded by main requirements.txt"
}

create_master_documentation_index() {
    echo -e "\n${YELLOW}▶ Creating master documentation index${NC}"
    
    cat > "./DOCUMENTATION_INDEX.md" << 'EOF'
# 📚 EchoTune AI - Master Documentation Index

## 🎯 Essential Documents (Current & Active)

### Core Configuration
- **README.md** - Primary project documentation and setup guide
- **AUTONOMOUS_DEVELOPMENT_ROADMAP.md** - Main development roadmap and task tracking
- **CURSOR_AI_INSTRUCTIONS.txt** - Instructions for Cursor IDE coding agent

### Environment & Setup
- **.env.example** - Environment variable template with all configurations
- **docker-compose.dev.yml** - Development Docker stack
- **docker-compose.n8n.yml** - N8N automation server configuration
- **start-mcp-servers.sh** - MCP server startup and validation script

### API & Configuration
- **mcp-servers-config.json** - MCP server configuration with API keys
- **API_CONFIGURATION_QUICK_START.md** - API setup quick reference
- **COMPREHENSIVE_N8N_IMPLEMENTATION_COMPLETE.md** - N8N workflow documentation

### Development Tools
- **CURSOR_AI_INSTRUCTIONS.txt** - Complete instructions for coding agents
- **CODING_AGENT_GUIDE.md** - Guidelines for GitHub coding agents

## 🗂️ Archived Documents

All redundant and outdated documents have been moved to:
- **document-backups-[timestamp]/** - Backup of removed documents

## 🧹 Cleanup Summary

### Removed Categories:
- ✅ Redundant validation reports (8 files)
- ✅ Duplicate roadmaps (6 files)  
- ✅ Outdated setup guides (4 files)
- ✅ Completed implementation reports (6 files)
- ✅ Outdated analysis reports (5 files)
- ✅ Old test artifacts (10+ files)
- ✅ Duplicate configurations (5 files)

### Retained Documents:
- ✅ Main roadmap with current tasks
- ✅ Active configuration files
- ✅ Current API documentation
- ✅ Production-ready deployment files
- ✅ Coding agent instructions

## 📋 Next Steps

1. **Follow Main Roadmap**: Use AUTONOMOUS_DEVELOPMENT_ROADMAP.md for development tasks
2. **Environment Setup**: Configure using .env.example template
3. **Start Development**: Use start-mcp-servers.sh for MCP server initialization
4. **Coding Assistance**: Reference CURSOR_AI_INSTRUCTIONS.txt for agent guidance

---

*Last Updated: $(date '+%Y-%m-%d %H:%M:%S')*
*Cleanup Performed: Document consolidation and redundancy removal*
EOF
    
    log_message "📚 Created master documentation index"
}

update_workflows() {
    echo -e "\n${YELLOW}▶ Validating and updating GitHub workflows${NC}"
    
    # Check for YAML syntax errors in workflows
    local workflow_dir=".github/workflows"
    if [ -d "$workflow_dir" ]; then
        for workflow in "$workflow_dir"/*.yml "$workflow_dir"/*.yaml; do
            if [ -f "$workflow" ]; then
                # Basic YAML syntax validation
                if command -v yamllint >/dev/null 2>&1; then
                    yamllint "$workflow" || log_warning "YAML syntax issues in $(basename $workflow)"
                else
                    log_warning "yamllint not available - skipping validation for $(basename $workflow)"
                fi
            fi
        done
    fi
}

create_cleanup_summary() {
    local summary_file="${SCRIPT_DIR}/document-cleanup-summary.json"
    local current_time=$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)
    local files_removed=$(find "$BACKUP_DIR" -type f 2>/dev/null | wc -l || echo 0)
    
    cat > "$summary_file" << EOF
{
  "cleanup_time": "$current_time",
  "status": "completed",
  "actions": {
    "files_removed": $files_removed,
    "backup_location": "$BACKUP_DIR",
    "categories_cleaned": [
      "validation_reports",
      "duplicate_roadmaps", 
      "redundant_guides",
      "implementation_reports",
      "analysis_reports",
      "test_artifacts",
      "duplicate_configurations"
    ]
  },
  "remaining_documents": {
    "essential_count": $(find . -maxdepth 1 -name "*.md" -type f | wc -l),
    "main_roadmap": "AUTONOMOUS_DEVELOPMENT_ROADMAP.md",
    "setup_guide": "README.md",
    "coding_instructions": "CURSOR_AI_INSTRUCTIONS.txt"
  },
  "log_files": [
    "$CLEANUP_LOG",
    "$summary_file"
  ]
}
EOF
    
    log_message "📄 Cleanup summary written to: $summary_file"
}

main() {
    print_header
    
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Document cleanup initiated" > "$CLEANUP_LOG"
    
    cleanup_validation_reports
    cleanup_roadmaps
    cleanup_guides
    cleanup_implementation_reports
    cleanup_analysis_reports
    cleanup_test_reports
    cleanup_duplicate_configs
    create_master_documentation_index
    update_workflows
    create_cleanup_summary
    
    echo -e "\n${GREEN}🎉 Document cleanup completed successfully!${NC}"
    echo -e "${BLUE}📋 Backup location: $BACKUP_DIR${NC}"
    echo -e "${BLUE}📝 Cleanup log: $CLEANUP_LOG${NC}"
    echo -e "${BLUE}📚 Documentation index: ./DOCUMENTATION_INDEX.md${NC}"
}

main "$@"
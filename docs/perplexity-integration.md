# Perplexity API Integration Documentation

## Overview

This document describes the comprehensive Perplexity API integration implemented for cost-effective, budget-controlled AI analysis of GitHub issues. The system provides centralized configuration, dynamic model selection, intelligent caching, and strict budget enforcement.

## Architecture Diagram

```
┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│   GitHub Issues     │    │  GitHub Actions      │    │  Perplexity API     │
│                     │    │  Workflows           │    │                     │
│ - New Issues        │────┤                      │────┤ - sonar             │
│ - Manual Triggers   │    │ - ai-issue-analysis  │    │ - sonar-reasoning   │
│ - Scheduled Batch   │    │ - ai-budget-monitor  │    │ - sonar-pro         │
└─────────────────────┘    └──────────────────────┘    └─────────────────────┘
                                      │                           │
                                      ▼                           │
                           ┌─────────────────────┐                │
                           │  Budget Manager     │◄───────────────┘
                           │                     │
                           │ - Weekly $3 limit   │
                           │ - Usage tracking    │
                           │ - Alert generation  │
                           └─────────────────────┘
                                      │
                                      ▼
                           ┌─────────────────────┐
                           │  Cache Manager      │
                           │                     │
                           │ - MD5 key hashing   │
                           │ - 14-day TTL        │
                           │ - Smart invalidation│
                           └─────────────────────┘
                                      │
                                      ▼
                           ┌─────────────────────┐
                           │  Analysis Engine    │
                           │                     │
                           │ - Complexity scoring│
                           │ - Model selection   │
                           │ - Batch processing  │
                           └─────────────────────┘
```

## Budget Management

### Weekly Budget: $3.00 USD

Based on current Perplexity API pricing and optimization strategies, the $3.00 weekly budget allows for approximately:

- **300-400 light analyses** using `sonar` model (simple issues, cached responses)
- **100-150 medium analyses** using `sonar-reasoning` model (complex issues)  
- **50-75 heavy analyses** using `sonar-pro` model (research-intensive issues)
- **Mixed usage**: Approximately 200 analyses with intelligent model selection

### Budget Enforcement Levels

| Usage Level | Actions |
|-------------|---------|
| **0-50%** | ✅ Normal operation, all models available |
| **50-80%** | ✅ Normal operation with monitoring |
| **80-100%** | ⚠️ Warning alerts, batch size reduction |
| **100%+** | 🚨 API calls blocked, budget lock active |

### Budget Reset Schedule

- **Automatic Reset**: Every Monday at 00:00 UTC
- **Emergency Reset**: Manual via workflow dispatch (requires confirmation)
- **Reset Scope**: Usage ledger cleared, budget lock removed, cache preserved

## Dynamic Model Selection

The system automatically selects the optimal Perplexity model based on issue complexity:

### Complexity Scoring (1-10)

```python
def calculate_complexity_score(title, body):
    score = 5  # Base score
    
    # Length factor
    if len(content) > 2000: score += 3
    elif len(content) > 1000: score += 2
    elif len(content) > 500: score += 1
    
    # Technical keywords
    technical_keywords = ['algorithm', 'security', 'performance', 'api', ...]
    score += min(keyword_count // 2, 3)
    
    # Code/language indicators  
    if has_code_references: score += 1
    
    return clamp(score, 1, 10)
```

### Model Selection Logic

```python
def select_model(complexity_score, research=False):
    if research or complexity_score >= 8:
        return 'sonar-pro'      # $0.006/1k tokens + $0.01/search
    elif complexity_score >= 6:
        return 'sonar-reasoning' # $0.003/1k tokens + $0.005/search  
    else:
        return 'sonar'          # $0.001/1k tokens + $0.005/search
```

### Model Characteristics

| Model | Cost/1k Tokens | Cost/Search | Best For | Max Tokens |
|-------|----------------|-------------|----------|------------|
| `sonar` | $0.001 | $0.005 | Current events, factual search | 2000 |
| `sonar-reasoning` | $0.003 | $0.005 | Complex analysis, reasoning | 4000 |
| `sonar-pro` | $0.006 | $0.010 | Premium analysis, research | 4000 |

## Caching Strategy

### Cache Key Generation
```python
cache_key = md5(f"{title}|{body}|{model}")
```

### Cache Storage Structure
```
.perplexity/cache/
├── a1b2c3d4e5f6.json  # Cached analysis 1
├── f6e5d4c3b2a1.json  # Cached analysis 2  
└── ...
```

### Cache Invalidation
- **TTL**: 14 days (configurable)
- **Manual**: Clear cache directory
- **Automatic**: Expired entries removed on access

### Cache Hit Benefits
- **Cost**: $0.00 (no API call)
- **Speed**: Instant response
- **Budget**: No impact on weekly limit

## Usage Examples

### Basic Issue Analysis
```bash
# Analyze single issue with auto model selection
python scripts/issue_analyzer.py --issue 123

# Dry run to see cost estimate
python scripts/issue_analyzer.py --issue 123 --dry-run

# Manual analysis with custom input
python scripts/issue_analyzer.py \
  --title "Fix authentication bug" \
  --body "Users can't log in after password reset" \
  --output-comment
```

### Batch Processing
```bash
# Process up to 5 unanalyzed issues
python scripts/batch_issue_analyzer.py --max-issues 5

# Use similarity grouping for efficiency
python scripts/batch_issue_analyzer.py --similarity-grouping

# Generate batch summary
python scripts/batch_issue_analyzer.py --summary-comment
```

### Budget Monitoring
```bash
# Check current budget status
python scripts/cost_monitor.py --check-budget

# Generate weekly report
python scripts/cost_monitor.py --report --weeks 4

# Emergency budget reset (requires --confirm)
python scripts/cost_monitor.py --reset-budget --confirm
```

## Configuration

### Repository Secrets (Required)
```bash
# Primary API key (REQUIRED)
PERPLEXITY_API_KEY=pplx-your-api-key-here
```

### Repository Variables (Optional)
```bash
# Weekly budget in USD (default: 3.0)
PPLX_WEEKLY_BUDGET=3.0

# Force specific model (overrides auto-selection)
PPLX_MODEL_OVERRIDE=sonar-pro
```

### Environment Variables
```bash
# Weekly budget limit
PPLX_WEEKLY_BUDGET=3.0

# Model override (optional)
PPLX_MODEL_OVERRIDE=sonar

# Cache TTL in days (default: 14)
PPLX_CACHE_TTL_DAYS=14
```

## GitHub Actions Integration

### Workflow Triggers

#### AI Issue Analysis (`ai-issue-analysis.yml`)
- **Issues**: `opened` - Analyze new issues automatically
- **Schedule**: `0 2 * * *` - Nightly batch processing at 2 AM UTC
- **Manual**: Workflow dispatch with issue number

#### Budget Monitor (`ai-budget-monitor.yml`)  
- **Schedule**: `0 */6 * * *` - Every 6 hours monitoring
- **Manual**: Workflow dispatch with force check/reset options

### Workflow Outputs

#### Issue Comments
```markdown
## 🔍 AI Issue Analysis 💾 Cached

**Summary of the issue and recommended approach**

### 📋 Technical Analysis
Detailed technical breakdown...

### 🎯 Priority & Effort  
- **Priority**: High
- **Estimated Effort**: 1-2 weeks

[Structured JSON data block for downstream parsing]

---
**Analysis Metadata:** 🤖 sonar-pro • 📊 Complexity: 8/10 • 💰 $0.0631
```

#### Budget Alerts
- **Warning (80%+)**: Creates warning issue with recommendations
- **Critical (100%+)**: Creates urgent issue, blocks API calls
- **Reset Notification**: Documents emergency budget resets

## File Structure

```
.perplexity/
├── usage_ledger.json     # Weekly usage tracking (committed)
├── cache/               # API response cache (gitignored)
│   ├── a1b2c3d4.json   # Cached analysis files
│   └── ...
├── alerts/              # Budget alert files (gitignored)
│   ├── budget_warning_2024-W03.json
│   └── budget_exceeded_2024-W03.json
├── backups/            # Budget reset backups (gitignored)
│   └── budget_reset_2024-W03_20240115_143022.json
└── BUDGET_LOCK         # Budget lock marker (gitignored)

scripts/
├── perplexity_client.py      # Core client and configuration
├── issue_analyzer.py         # Single issue analysis
├── batch_issue_analyzer.py   # Batch processing
└── cost_monitor.py          # Budget monitoring and enforcement
```

## Cost Optimization Strategies

### 1. Intelligent Caching
- 14-day TTL reduces repeat analysis costs
- MD5 hashing ensures cache accuracy
- Preserves cache across budget resets

### 2. Dynamic Model Selection
- Simple issues use cheaper `sonar` model
- Complex issues use appropriate higher-tier models
- Manual override available for specific needs

### 3. Batch Processing  
- Groups similar issues to reduce API calls
- Processes multiple issues in single workflow run
- Similarity-based grouping optimizes efficiency

### 4. Budget Controls
- Hard weekly limit prevents overage
- Warning system at 80% usage
- Automatic request blocking at 100%

### 5. Usage Analytics
- Daily spending breakdown
- Model usage statistics  
- Cost trend analysis
- Optimization recommendations

## Error Handling & Fallbacks

### API Key Missing
- Graceful degradation to dry-run mode
- Clear error messages in workflow logs
- Fallback analysis based on heuristics

### Budget Exceeded
- Immediate API call blocking
- Clear alert messages
- Recommended remediation steps
- Emergency reset procedures

### Network/API Failures
- Retry logic with exponential backoff
- Fallback to cached responses when possible
- Detailed error logging for debugging

## Security Considerations

### API Key Management
- ✅ Stored as GitHub repository secret
- ✅ Never committed to version control
- ✅ Not echoed in workflow logs
- ✅ Rotatable without code changes

### Sensitive Data Patterns  
- Extensive `.gitignore` patterns for API keys
- Alert files contain no sensitive data
- Usage logs contain only metadata
- Cache files contain only public issue data

### Access Controls
- Repository secrets require admin access
- Workflow dispatch requires write permissions
- Budget reset requires explicit confirmation

## Monitoring & Alerting

### Real-time Monitoring
- Budget status checked before each API call
- Usage tracked with detailed metadata
- Automatic alert generation at thresholds

### Weekly Reports  
- Comprehensive usage analytics
- Cost trend analysis
- Model efficiency metrics
- Optimization recommendations

### Emergency Procedures
- Budget lock activation/deactivation
- Emergency budget reset with backup
- Alert escalation to repository issues
- Manual override capabilities

## Troubleshooting Guide

### Common Issues

#### "Budget exceeded" errors
```bash
# Check current status
python scripts/cost_monitor.py --check-budget

# View detailed report  
python scripts/cost_monitor.py --report

# Emergency reset (if authorized)
python scripts/cost_monitor.py --reset-budget --confirm
```

#### Cache not working
```bash
# Clear cache directory
rm -rf .perplexity/cache/

# Check cache status
python scripts/issue_analyzer.py --issue 123 --dry-run
```

#### Workflows not triggering
1. Verify `PERPLEXITY_API_KEY` secret is set
2. Check workflow permissions in repository settings  
3. Review workflow logs for specific errors
4. Ensure branch is up to date

### Debug Commands

```bash
# Test client functionality
python scripts/perplexity_client.py --dry-run --issue 123

# Validate cost calculations
python scripts/cost_monitor.py --check-budget --dry-run

# Test batch processing
python scripts/batch_issue_analyzer.py --max-issues 2 --dry-run
```

## Maintenance & Updates

### Weekly Maintenance
- Review budget usage patterns
- Optimize model selection thresholds
- Clean up old cache files
- Monitor alert patterns

### Monthly Maintenance  
- Analyze cost trends
- Adjust budget if needed
- Update model configurations
- Review security practices

### API Key Rotation
1. Generate new Perplexity API key
2. Update `PERPLEXITY_API_KEY` repository secret
3. Test with dry-run analysis
4. Revoke old API key

---

## Quick Start Checklist

- [ ] Set `PERPLEXITY_API_KEY` repository secret
- [ ] Optionally set `PPLX_WEEKLY_BUDGET` repository variable
- [ ] Trigger first analysis: `/workflow-dispatch` with issue number
- [ ] Verify budget tracking: Check `.perplexity/usage_ledger.json`
- [ ] Monitor first week usage patterns
- [ ] Adjust configuration as needed

**Budget will reset automatically every Monday at 00:00 UTC**

For questions or issues, refer to the troubleshooting guide or create an issue with the `automated-analysis` label.
# Perplexity API Budget Management and Integration Guide

This guide provides comprehensive documentation for the enhanced Perplexity API integration with budget controls, cost management, and workflow automation.

## 🎯 Overview

The EchoTune AI project implements sophisticated budget management for Perplexity API usage across all GitHub Actions workflows. The system enforces a strict **$3/week (~$12/month)** budget with multiple layers of cost protection, intelligent caching, and dynamic model selection.

## 📊 Cost Structure and Pricing

### Model Pricing (Per Million Tokens)

| Model | Use Case | Input Cost | Output Cost | Max Tokens |
|-------|----------|------------|-------------|------------|
| `sonar` | Simple queries | $1.00 | $1.00 | 4,096 |
| `sonar-reasoning` | Moderate analysis | $1.00 | $5.00 | 8,192 |
| `sonar-pro` | Complex research | $3.00 | $15.00 | 16,384 |

### Additional Costs
- **Search Queries**: $5.00 per 1,000 queries
- **Weekly Budget**: $3.00 maximum
- **Warning Threshold**: 70% ($2.10)
- **Hard Stop Threshold**: 100% ($3.00)

## 🏗️ System Architecture

### Core Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Budget Guard   │───▶│  Cost Manager   │───▶│  Usage Logger   │
│  (Pre-flight)   │    │  (Estimation)    │    │  (.perplexity/) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Workflow Gates  │    │ Model Selector   │    │ Cache Manager   │
│ (GitHub Actions)│    │ (Complexity)     │    │ (Content-based) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### File Structure

```
.github/
├── perplexity-config.yml          # Central configuration
└── workflows/
    ├── perplexity-budget-guard.yml # Budget monitoring
    └── perplexity-research.yml     # Enhanced research workflow

scripts/
├── perplexity_costs.py             # Cost tracking and budget management
├── perplexity_cache.py             # Intelligent caching system
├── complexity_classifier.py       # Model selection based on complexity
├── budget_guard.py                 # Workflow budget validation
├── analyze_issues.py               # Enhanced issue analysis
├── batch_analyze.py                # Batch processing with cost controls
└── tests/
    └── test_perplexity_costs.py    # Unit tests

.perplexity/
├── cache/                          # Cached responses (auto-managed)
└── usage.json                      # Cost and usage logs
```

## ⚙️ Configuration Reference

### `.github/perplexity-config.yml`

The central configuration file controls all aspects of the budget management system:

```yaml
# Budget Configuration
weekly_budget_usd: 3.00
warn_threshold_pct: 70              # Warning at $2.10
hard_stop_threshold_pct: 100        # Hard stop at $3.00
default_model: sonar

# Model Policies
model_policies:
  - name: sonar
    use_for: [simple]
    input_cost_per_million: 1.00
    output_cost_per_million: 1.00
    max_tokens: 4096
    
  - name: sonar-reasoning  
    use_for: [moderate]
    input_cost_per_million: 1.00
    output_cost_per_million: 5.00
    max_tokens: 8192
    
  - name: sonar-pro
    use_for: [complex]
    input_cost_per_million: 3.00
    output_cost_per_million: 15.00
    max_tokens: 16384

# Caching Configuration
caching:
  enabled: true
  dir: .perplexity/cache
  max_age_days: 14
  max_cache_size_mb: 100
  compression: true

# Batching Configuration  
batching:
  max_issues_per_run: 5
  similarity_batch: true
  similarity_threshold: 0.7
  batch_delay_seconds: 2

# Budget Enforcement
budget_enforcement:
  enabled: true
  defer_label: analysis-deferred-budget
  disable_label: ai-analysis-disabled
  override_label: override-budget-guard
```

## 🧠 Dynamic Model Selection

The system automatically selects the most cost-effective model based on content complexity:

### Complexity Scoring Algorithm

```python
# Example complexity calculation
def calculate_complexity_score(title, body, labels):
    score = 10  # Base score
    
    # Keyword-based scoring
    if "error" in text or "exception" in text:
        score += 15  # Error indicators
    if "architecture" in text or "design" in text:
        score += 25  # Architecture terms
    if "performance" in text or "optimization" in text:
        score += 20  # Performance terms
        
    # Length-based scoring
    score += len(text) // 100  # 1 point per 100 characters
    score += code_blocks * 10   # 10 points per code block
    
    return score
```

### Model Selection Logic

| Score Range | Complexity | Model | Use Case |
|-------------|------------|-------|----------|
| 0-20 | Simple | `sonar` | Basic queries, typos, simple bugs |
| 21-79 | Moderate | `sonar-reasoning` | Feature requests, standard debugging |
| 80+ | Complex | `sonar-pro` | Architecture, performance, complex analysis |

## 💾 Intelligent Caching System

### Cache Key Generation

Cache keys are generated from normalized content to maximize hit rates:

```python
# Cache key generation process
1. Normalize title and body text (lowercase, remove markdown)
2. Extract top keywords using frequency analysis  
3. Sort labels alphabetically
4. Create SHA256 hash of combined content
5. Generate key: "perplexity_{hash[:16]}"
```

### Cache Management

- **Expiration**: 14 days (configurable)
- **Size Limit**: 100MB (configurable)
- **Compression**: Gzip compression enabled by default
- **Cleanup**: Automatic cleanup during budget monitoring runs

## 🔄 Workflow Integration

### Budget Guard Workflow (`.github/workflows/perplexity-budget-guard.yml`)

Runs every 4 hours to monitor budget status:

```yaml
on:
  schedule:
    - cron: '0 */4 * * *'  # Every 4 hours
  workflow_dispatch:
```

**Key Functions:**
- Monitors weekly budget usage
- Creates/updates budget status issues
- Manages repository labels (disabled/deferred)
- Performs cache cleanup
- Generates budget summary artifacts

### Enhanced Research Workflow (`.github/workflows/perplexity-research.yml`)

Updated with budget controls and intelligent analysis:

```yaml
jobs:
  budget-guard:
    # Pre-flight budget validation
    
  enhanced-perplexity-research:
    needs: budget-guard
    if: needs.budget-guard.outputs.can_proceed == 'true'
    # Analysis with cost tracking
```

## 📈 Budget States and Auto-Throttling Logic

### Budget State Machine

```
┌─────────┐  70% usage   ┌─────────────┐  100% usage  ┌─────────────┐
│   OK    │─────────────▶│   WARNING   │─────────────▶│ HARD_STOP   │
│ (Green) │              │  (Yellow)   │              │   (Red)     │
└─────────┘              └─────────────┘              └─────────────┘
     │                           │                           │
     │ All models allowed        │ Simple issues only        │ No analysis
     │ Full batching            │ Reduced batching          │ All deferred
```

### State-Based Behavior

| State | Behavior | Actions |
|-------|----------|---------|
| **OK** | Normal operation | All complexity levels, full batching |
| **WARNING** | Throttled operation | Simple issues only, longer delays |
| **HARD_STOP** | No new analysis | All requests deferred, disable label added |

### Manual Override

Repository maintainers can override budget limits by adding the `override-budget-guard` label:

```bash
# Add override label
gh label create "override-budget-guard" --description "Override budget restrictions" --color "blue"
```

## 🛠️ Command Line Tools

All Python utilities support command-line usage for testing and manual operations:

### Cost Estimation

```bash
# Estimate cost for a request
python3 scripts/perplexity_costs.py estimate \
  --tokens-in 1000 \
  --tokens-out 500 \
  --search-queries 2 \
  --model sonar-pro

# Output: {"estimated_cost_usd": 0.048}
```

### Budget Checking

```bash
# Check current budget status
python3 scripts/perplexity_costs.py budget

# Check weekly usage
python3 scripts/perplexity_costs.py usage
```

### Cache Management

```bash
# Generate cache key for content
python3 scripts/perplexity_cache.py key \
  --title "Fix authentication bug" \
  --body "User login fails with 500 error" \
  --labels bug urgent

# Clean up old cache files
python3 scripts/perplexity_cache.py cleanup
```

### Complexity Analysis

```bash
# Analyze content complexity
python3 scripts/complexity_classifier.py score \
  --title "Implement OAuth authentication" \
  --body "Need secure user authentication with JWT tokens" \
  --labels feature security

# Test with example cases
python3 scripts/complexity_classifier.py test
```

### Issue Analysis

```bash
# Analyze single issue with budget controls
python3 scripts/analyze_issues.py \
  --issue-number 123 \
  --title "Performance issues" \
  --body "Database queries are slow" \
  --labels performance bug \
  --dry-run

# Batch analysis from JSON file
python3 scripts/batch_analyze.py \
  --input-file issues.json \
  --max-issues 10 \
  --output-file results.json
```

## 🔒 Security and Secret Handling

### API Key Management

**CRITICAL**: Never commit the Perplexity API key to the repository.

#### Required Repository Secret

Add the API key as a repository secret:

1. Go to repository **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `PERPLEXITY_API_KEY`
4. Value: Your Perplexity API key (starts with `pplx-`)

#### Code Access Pattern

```python
# ✅ CORRECT: Read from environment variable
api_key = os.environ.get('PERPLEXITY_API_KEY')

# ❌ WRONG: Never hardcode the key
api_key = "pplx-abc123..."  # NEVER DO THIS
```

### Security Safeguards

The system includes multiple layers of protection:

1. **Grep Prevention**: Pre-commit checks for plaintext keys
2. **Environment-Only Access**: Keys only accessible via env vars
3. **No Logging**: API keys never logged or included in outputs
4. **Secure Transport**: HTTPS-only API communications

## 📊 Observability and Reporting

### Usage Logging Schema

All API usage is logged to `.perplexity/usage.json`:

```json
[
  {
    "timestamp": "2024-08-23T19:30:00Z",
    "iso_week": "2024-W34",
    "issue_number": 123,
    "model": "sonar-reasoning",
    "tokens_in": 1500,
    "tokens_out": 800,
    "search_queries": 2,
    "estimated_cost_usd": 0.014,
    "cached": false
  }
]
```

### Cost Summary Reports

Weekly summaries are automatically generated:

```json
{
  "batch_summary": {
    "timestamp": "2024-08-23T19:30:00Z",
    "total_issues": 15,
    "successful_analyses": 12,
    "deferred_analyses": 3,
    "cached_responses": 8,
    "cache_hit_rate": 53.3,
    "total_cost_usd": 0.245,
    "average_cost_per_issue": 0.035
  },
  "budget_status": {
    "iso_week": "2024-W34",
    "state": "OK",
    "usage_percentage": 8.2,
    "remaining_amount_usd": 2.755
  }
}
```

### GitHub Integration

- **Step Summaries**: Markdown summaries in workflow runs
- **Issue Comments**: Cost information appended to AI analysis comments
- **Status Issues**: Automatic creation/updating of budget status issues
- **Artifacts**: JSON summaries uploaded for each run

## 🧪 Testing and Validation

### Unit Tests

Comprehensive test suite ensures system reliability:

```bash
# Run all tests
python3 scripts/tests/test_perplexity_costs.py

# Expected output: 
# Ran 10 tests in 0.023s
# OK
```

### Test Coverage

- ✅ Cost estimation accuracy
- ✅ Budget threshold logic
- ✅ ISO week calculations
- ✅ Usage logging functionality
- ✅ Cache key generation
- ✅ Cleanup operations

### Dry Run Mode

All analysis scripts support dry-run mode for testing:

```bash
# Test without making API calls
python3 scripts/analyze_issues.py --dry-run \
  --title "Test issue" \
  --body "Test description"

# Test budget guard without side effects
python3 scripts/budget_guard.py --dry-run
```

## 🚀 Quick Start Guide

### 1. Setup Repository Secret

Add `PERPLEXITY_API_KEY` to repository secrets (see Security section above).

### 2. Configure Budget (Optional)

The default configuration enforces a $3/week budget. To modify:

```yaml
# Edit .github/perplexity-config.yml
weekly_budget_usd: 5.00  # Increase to $5/week
warn_threshold_pct: 80   # Warning at 80%
```

### 3. Test the System

```bash
# Test cost estimation
python3 scripts/perplexity_costs.py estimate --tokens-in 1000 --tokens-out 500 --model sonar

# Test complexity analysis
python3 scripts/complexity_classifier.py test

# Test budget guard
python3 scripts/budget_guard.py --dry-run
```

### 4. Monitor Usage

The system automatically monitors usage every 4 hours. You can also check manually:

```bash
# Check current budget status
python3 scripts/perplexity_costs.py budget

# View usage history
python3 scripts/perplexity_costs.py usage
```

## 🔧 Troubleshooting

### Common Issues

#### 1. "PERPLEXITY_API_KEY not set"

**Solution**: Add the API key as a repository secret (see Security section).

#### 2. Budget Guard Fails

**Check**:
- Configuration file exists: `.github/perplexity-config.yml`
- Python dependencies installed: `pip install pyyaml`
- Permissions: Scripts should be executable

#### 3. Cache Issues

**Solutions**:
```bash
# Clear all cache files
python3 scripts/perplexity_cache.py cleanup --force

# Check cache statistics
python3 scripts/perplexity_cache.py stats
```

#### 4. High Costs

**Analysis Steps**:
```bash
# Check weekly usage breakdown
python3 scripts/perplexity_costs.py usage

# Review model selection
python3 scripts/complexity_classifier.py score --title "Your issue title" --body "Your issue body"

# Check cache hit rate
python3 scripts/perplexity_cache.py stats
```

### Debug Mode

Enable verbose logging for troubleshooting:

```bash
# Enable debug output
python3 scripts/budget_guard.py --verbose

# Check configuration loading
python3 scripts/perplexity_costs.py budget --verbose
```

## 📚 Advanced Configuration

### Custom Model Policies

Add new models or modify existing ones:

```yaml
model_policies:
  - name: custom-model
    use_for: [experimental]
    input_cost_per_million: 2.00
    output_cost_per_million: 8.00
    max_tokens: 12288
    description: "Custom experimental model"
```

### Advanced Batching

Fine-tune batch processing behavior:

```yaml
batching:
  max_issues_per_run: 10           # Process more issues per batch
  similarity_threshold: 0.8        # Higher similarity requirement
  batch_delay_seconds: 5           # Longer delays between batches
  max_concurrent_requests: 1       # Reduce concurrency
```

### Cache Optimization

Optimize cache performance:

```yaml
caching:
  max_age_days: 7                  # Shorter cache lifetime
  max_cache_size_mb: 200           # Larger cache size
  cleanup_interval_hours: 12       # More frequent cleanup
```

## 🔄 Weekly Budget Reset

The budget automatically resets every Monday at 00:00 UTC using ISO week calculations. The system:

1. **Tracks Usage**: By ISO week (e.g., "2024-W34")
2. **Auto-Resets**: No manual intervention required
3. **Carries Forward**: Deferred issues are automatically retried
4. **Notifies**: Status issues are updated with reset information

## 📈 Performance Optimization

### Cache Hit Rate Optimization

Target: >30% cache hit rate

**Strategies**:
- Similar issues are automatically detected
- Cache keys normalize content for better matching
- 14-day retention balances freshness and efficiency

### Cost Reduction Techniques

1. **Smart Model Selection**: Complexity analysis prevents over-provisioning
2. **Batch Processing**: Similarity grouping reduces duplicate analysis
3. **Aggressive Caching**: Content-based keys maximize hit rates
4. **Early Termination**: Budget guards prevent runaway costs

### Performance Budgets

The system enforces performance limits:

- **Latency**: p95 ≤ 1500ms
- **Memory**: ≤ 256MB per operation
- **CPU**: ≤ 0.5 cores per operation

## 🎯 Best Practices

### For Repository Maintainers

1. **Monitor Weekly**: Review budget status issues
2. **Label Management**: Use defer/disable labels appropriately  
3. **Override Sparingly**: Only use override for urgent analysis
4. **Cost Awareness**: Understand model costs before analysis

### For Contributors

1. **Check Budget**: Verify analysis completed before expecting results
2. **Issue Quality**: Well-written issues get better analysis
3. **Label Appropriately**: Complexity affects model selection
4. **Be Patient**: Deferred analysis will retry automatically

### For System Administrators

1. **Regular Monitoring**: Check budget usage trends
2. **Configuration Tuning**: Adjust thresholds based on usage patterns
3. **Cache Maintenance**: Monitor cache hit rates and sizing
4. **Cost Optimization**: Review model selection accuracy

---

This guide provides complete documentation for the enhanced Perplexity API integration. For additional support or questions, please refer to the troubleshooting section or create an issue in the repository.
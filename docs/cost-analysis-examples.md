# Perplexity API Cost Analysis Examples

This document provides detailed examples of cost calculations, budget scenarios, and optimization strategies for the Perplexity API integration in EchoTune AI.

## 📊 Cost Calculation Examples

### Example 1: Simple Bug Report

**Issue Content:**
```
Title: "Fix typo in README.md"
Body: "There's a typo on line 15 of the README file. Should be 'authorization' not 'authorisation'."
Labels: ["bug", "documentation"]
```

**Cost Analysis:**
```python
# Complexity Classification
complexity_score = 15  # Simple issue
selected_model = "sonar"  # $1/$1 per million tokens

# Token Estimation
input_tokens = 50   # Short title and body
output_tokens = 200 # Brief response expected

# Cost Calculation
input_cost = (50 / 1_000_000) * 1.00 = $0.00005
output_cost = (200 / 1_000_000) * 1.00 = $0.0002
search_cost = (1 / 1_000) * 5.00 = $0.005
total_cost = $0.00525

# Weekly Budget Impact: 0.18% of $3 budget
```

**Cache Potential:** HIGH - Simple typo fixes often repeat

### Example 2: Moderate Feature Request

**Issue Content:**
```
Title: "Add user profile avatars to dashboard"
Body: "Users should be able to upload and display profile pictures in the dashboard. 
       Need to implement:
       - File upload handling
       - Image resize/crop functionality  
       - Database schema updates
       - UI components for avatar display"
Labels: ["feature", "frontend", "backend"]
```

**Cost Analysis:**
```python
# Complexity Classification
complexity_score = 45  # Moderate complexity
selected_model = "sonar-reasoning"  # $1/$5 per million tokens

# Token Estimation
input_tokens = 300   # Detailed description
output_tokens = 1200 # Comprehensive analysis

# Cost Calculation
input_cost = (300 / 1_000_000) * 1.00 = $0.0003
output_cost = (1200 / 1_000_000) * 5.00 = $0.006
search_cost = (2 / 1_000) * 5.00 = $0.01
total_cost = $0.0163

# Weekly Budget Impact: 0.54% of $3 budget
```

**Cache Potential:** MEDIUM - Feature requests may have similar patterns

### Example 3: Complex Architecture Issue

**Issue Content:**
```
Title: "Database performance bottleneck in recommendation engine"
Body: "The recommendation engine is experiencing severe performance issues during peak hours.
       
       Stack trace:
       ```
       at RecommendationService.generateRecommendations(rec.js:156)
       at DatabaseConnection.query(db.js:89) 
       Query timeout after 30000ms
       ```
       
       Current architecture:
       - MongoDB for user data (1M+ users)
       - Redis for caching (128MB limit)
       - Node.js API server (4 core, 8GB RAM)
       
       Issues observed:
       - Query times >5 seconds during peak (normal: <100ms)
       - Memory usage spiking to 90%+
       - Cache hit rate dropped to 15%
       
       Need comprehensive analysis of:
       1. Database indexing strategy
       2. Query optimization opportunities
       3. Caching architecture improvements
       4. Horizontal scaling options
       5. Alternative database solutions"
Labels: ["performance", "critical", "architecture", "database"]
```

**Cost Analysis:**
```python
# Complexity Classification  
complexity_score = 125  # High complexity
selected_model = "sonar-pro"  # $3/$15 per million tokens

# Token Estimation
input_tokens = 800   # Detailed technical content
output_tokens = 3000 # Comprehensive analysis with recommendations

# Cost Calculation
input_cost = (800 / 1_000_000) * 3.00 = $0.0024
output_cost = (3000 / 1_000_000) * 15.00 = $0.045
search_cost = (3 / 1_000) * 5.00 = $0.015
total_cost = $0.0624

# Weekly Budget Impact: 2.08% of $3 budget
```

**Cache Potential:** LOW - Complex issues are typically unique

## 💰 Weekly Budget Scenarios

### Scenario A: Mixed Workload (Typical Week)

**Issue Distribution:**
- 12 simple issues (typos, minor bugs)
- 6 moderate issues (features, standard debugging)
- 2 complex issues (architecture, performance)

**Cost Breakdown:**
```
Simple Issues:   12 × $0.005  = $0.060  (2.0%)
Moderate Issues:  6 × $0.016  = $0.096  (3.2%)
Complex Issues:   2 × $0.062  = $0.124  (4.1%)

Total Weekly Cost: $0.280 (9.3% of budget)
Remaining Budget: $2.720 (90.7%)
Status: ✅ HEALTHY
```

### Scenario B: High-Complexity Week

**Issue Distribution:**
- 5 simple issues
- 8 moderate issues  
- 6 complex issues

**Cost Breakdown:**
```
Simple Issues:    5 × $0.005  = $0.025  (0.8%)
Moderate Issues:  8 × $0.016  = $0.128  (4.3%)
Complex Issues:   6 × $0.062  = $0.372  (12.4%)

Total Weekly Cost: $0.525 (17.5% of budget)
Remaining Budget: $2.475 (82.5%)
Status: ✅ HEALTHY
```

### Scenario C: Budget Warning Threshold

**Reaching 70% Warning:**
```
Current Usage: $2.10 (70.0% of budget)
Remaining: $0.90 (30.0%)
Status: ⚠️ WARNING

Restrictions Activated:
- Only simple issues processed (sonar model)
- Complex/moderate issues deferred
- Batch processing delays increased
- Enhanced cache utilization
```

**Cost Analysis for Warning State:**
```python
# Can still process ~180 simple issues before hard stop
remaining_budget = 0.90
cost_per_simple = 0.005
max_simple_issues = 0.90 / 0.005 = 180 issues

# Or ~56 moderate issues (if override enabled)
max_moderate_issues = 0.90 / 0.016 = 56 issues

# Or ~14 complex issues (if override enabled)
max_complex_issues = 0.90 / 0.062 = 14 issues
```

### Scenario D: Budget Hard Stop

**Reaching 100% Limit:**
```
Current Usage: $3.00 (100% of budget)
Remaining: $0.00 (0%)
Status: 🔴 HARD_STOP

Actions Taken:
- All new analysis requests deferred
- "ai-analysis-disabled" label added to repository
- Budget status issue created/updated
- Deferred issues queued for next week
```

## 📈 Cache Impact Analysis

### Example: Cache Hit Rate Scenarios

**No Cache (0% hit rate):**
```
20 issues × average $0.025 = $0.500
Weekly impact: 16.7% of budget
```

**Good Cache (30% hit rate):**
```
14 new analyses × $0.025 = $0.350
6 cache hits × $0.000 = $0.000
Total: $0.350
Weekly impact: 11.7% of budget
Savings: $0.150 (30% reduction)
```

**Excellent Cache (60% hit rate):**
```
8 new analyses × $0.025 = $0.200
12 cache hits × $0.000 = $0.000
Total: $0.200
Weekly impact: 6.7% of budget
Savings: $0.300 (60% reduction)
```

### Cache Effectiveness by Issue Type

| Issue Type | Cache Hit Rate | Reasoning |
|------------|---------------|-----------|
| Typos/Grammar | 80% | Highly repetitive |
| Common Bugs | 60% | Similar error patterns |
| Feature Requests | 40% | Some UI/UX patterns repeat |
| Performance Issues | 20% | Usually system-specific |
| Architecture | 10% | Highly unique |

## 🎯 Optimization Strategies

### Strategy 1: Intelligent Pre-filtering

**Before Enhancement:**
```python
# All issues processed with sonar-pro
20 issues × $0.062 = $1.240 (41.3% of budget)
```

**After Complexity Classification:**
```python
# Optimized model selection
15 simple × $0.005 = $0.075
4 moderate × $0.016 = $0.064
1 complex × $0.062 = $0.062
Total: $0.201 (6.7% of budget)
Savings: $1.039 (84% reduction)
```

### Strategy 2: Batch Processing Optimization

**Individual Processing:**
```python
# 20 separate API calls
20 × $0.025 + API overhead = $0.520
```

**Similarity Batching:**
```python
# Group similar issues, reduce redundant analysis
12 unique analyses × $0.025 = $0.300
8 similar issues benefit from patterns
Effective cost: $0.300 (42% reduction)
```

### Strategy 3: Adaptive Model Selection

**Static High-End Model:**
```python
# Always use sonar-pro
Weekly cost: $1.500+ (50%+ of budget)
Risk: Budget exhaustion by Wednesday
```

**Dynamic Selection:**
```python
# Complexity-based selection
Weekly cost: $0.300 (10% of budget)
Risk: Minimal, sustainable long-term
Quality: Appropriate for each issue type
```

## 📊 Budget Forecasting

### Monthly Projections

**Conservative Usage (Current Implementation):**
```
Week 1: $0.280 (9.3%)
Week 2: $0.320 (10.7%)  
Week 3: $0.290 (9.7%)
Week 4: $0.350 (11.7%)

Monthly Total: $1.240
Monthly Budget: $12.00 (4 × $3.00)
Utilization: 10.3%
Status: ✅ Very sustainable
```

**Moderate Growth Scenario:**
```
Week 1: $0.450 (15.0%)
Week 2: $0.620 (20.7%)
Week 3: $0.580 (19.3%)
Week 4: $0.680 (22.7%)

Monthly Total: $2.330
Monthly Budget: $12.00
Utilization: 19.4%
Status: ✅ Sustainable
```

**High Usage Scenario:**
```
Week 1: $1.200 (40.0%)
Week 2: $1.500 (50.0%)
Week 3: $1.800 (60.0%)  
Week 4: $2.100 (70.0%)

Monthly Total: $6.600
Monthly Budget: $12.00
Utilization: 55.0%
Status: ⚠️ Monitor closely
```

## 🔧 Cost Optimization Techniques

### Technique 1: Content Normalization

**Before Normalization:**
```
Issue A: "Fix bug in login system"
Issue B: "Fix Bug in Login System" 
Issue C: "fix bug in the login system"

Result: 3 separate analyses, 3× cost
```

**After Normalization:**
```
All issues normalize to: "fix bug in login system"
Cache key: "perplexity_a1b2c3d4"
Result: 1 analysis + 2 cache hits
Cost reduction: 67%
```

### Technique 2: Strategic Batching

**Poor Batching:**
```
Batch 1: [complex, simple, complex, simple]
Result: All processed with complex model
Cost: 4 × $0.062 = $0.248
```

**Optimized Batching:**
```
Batch 1: [simple, simple] → sonar model
Batch 2: [complex, complex] → sonar-pro model
Cost: 2 × $0.005 + 2 × $0.062 = $0.134
Savings: 46%
```

### Technique 3: Cache-Aware Queuing

**FIFO Processing:**
```
Process issues in order: 1, 2, 3, 4, 5
Cache misses: 5/5 (100%)
Total cost: 5 × $0.025 = $0.125
```

**Similarity-First Processing:**
```
Group by similarity: [1,3,5], [2,4]
Process similar issues together
Cache hits from pattern recognition
Cache misses: 2/5 (40%)
Total cost: 2 × $0.025 = $0.050
Savings: 60%
```

## 🚨 Budget Emergency Procedures

### Emergency Override Process

**Step 1: Assess Urgency**
```bash
# Check current budget status
python3 scripts/perplexity_costs.py budget

# Review deferred issues
gh issue list --label "analysis-deferred-budget"
```

**Step 2: Apply Override (if justified)**
```bash
# Add override label (maintainers only)
gh label create "override-budget-guard" \
  --description "Emergency budget override" \
  --color "blue"
```

**Step 3: Monitor Override Usage**
```bash
# Track override cost impact
python3 scripts/perplexity_costs.py usage --verbose
```

**Step 4: Remove Override**
```bash
# Remove override when no longer needed
gh label delete "override-budget-guard"
```

### Cost Recovery Strategies

**Strategy 1: Aggressive Caching**
```yaml
# Temporary config adjustment
caching:
  max_age_days: 21      # Extend cache lifetime
  similarity_threshold: 0.6  # Lower similarity threshold
```

**Strategy 2: Model Downgrading**
```yaml
# Emergency model mapping
complexity_scoring:
  complex_threshold: 150  # Raise threshold for sonar-pro
```

**Strategy 3: Batch Size Reduction**
```yaml
# Process fewer issues per run
batching:
  max_issues_per_run: 2   # Reduce from 5 to 2
  batch_delay_seconds: 10 # Increase delays
```

## 📋 Cost Monitoring Checklist

### Daily Monitoring
- [ ] Check budget summary from latest workflow run
- [ ] Review any deferred analysis issues
- [ ] Monitor cache hit rate trends
- [ ] Verify model selection is appropriate

### Weekly Monitoring  
- [ ] Analyze weekly cost breakdown
- [ ] Review budget status issue (if created)
- [ ] Clean up expired cache entries
- [ ] Assess model selection accuracy

### Monthly Monitoring
- [ ] Calculate monthly utilization trends
- [ ] Review cost optimization opportunities
- [ ] Analyze cache performance metrics
- [ ] Update budget forecasts

## 🎓 Advanced Cost Analysis

### Cost per Issue Type Analysis

**Data Collection:**
```sql
-- Theoretical query for cost analysis
SELECT 
  issue_type,
  AVG(estimated_cost_usd) as avg_cost,
  COUNT(*) as issue_count,
  SUM(estimated_cost_usd) as total_cost,
  AVG(CASE WHEN cached THEN 1 ELSE 0 END) as cache_rate
FROM usage_log 
WHERE iso_week = '2024-W34'
GROUP BY issue_type;
```

**Sample Results:**
```
Issue Type    | Avg Cost | Count | Total Cost | Cache Rate
--------------|----------|-------|------------|----------
bug           | $0.008   | 45    | $0.360     | 65%
feature       | $0.021   | 22    | $0.462     | 35%  
performance   | $0.058   | 8     | $0.464     | 15%
documentation | $0.003   | 15    | $0.045     | 85%
```

### ROI Analysis

**Manual Analysis Cost:**
```
Developer time: 30 minutes/issue
Developer rate: $50/hour  
Cost per manual analysis: $25.00
```

**AI Analysis Cost:**
```
Average AI cost: $0.025/issue
Time saved: 29.5 minutes  
Cost reduction: 99.9%
```

**ROI Calculation:**
```
Cost savings per issue: $24.975
Break-even point: 1 issue
Monthly savings (100 issues): $2,497.50
Annual ROI: 299,700%
```

---

These examples demonstrate the comprehensive cost management and optimization strategies implemented in the Perplexity API integration. The system is designed to maximize value while maintaining strict budget controls.
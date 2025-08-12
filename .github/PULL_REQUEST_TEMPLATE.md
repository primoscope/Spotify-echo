# Summary

Describe the change and link related issues.

## 🛡️ MCP Validation Gateway Checklist

**Critical Validations (Auto-checked for Agent/MCP PRs):**
- [ ] **Security Scan**: No high-severity vulnerabilities detected
- [ ] **Secret Detection**: No exposed API keys, tokens, or credentials
- [ ] **MCP Server Health**: All critical MCP servers responding  
- [ ] **Code Intelligence**: MCP integrations functioning properly
- [ ] **Integration Tests**: Community MCP servers validated

**Standard Validations:**
- [ ] CI pipeline passed (build, tests, linting)
- [ ] No breaking changes to existing functionality
- [ ] Environment variables properly handled (no hardcoded secrets)
- [ ] Documentation updated for significant changes

## 🔬 Perplexity Research Summary

**For Agent/Research-based PRs - Complete this section:**

### Research Methodology
- [ ] **Query Formulation**: Used specific, focused research questions
- [ ] **Source Validation**: Cross-referenced findings across multiple credible sources  
- [ ] **Recency Filter**: Applied appropriate time constraints (week/month/year)
- [ ] **Citation Quality**: All sources properly attributed with dates and URLs

### Research Budget Compliance
- [ ] **Cost Control**: Total research cost ≤ $0.50 USD per session
- [ ] **Performance**: Query response times ≤ 1500ms (p95)  
- [ ] **Caching**: Utilized caching for repeated queries to minimize costs
- [ ] **Model Selection**: Used appropriate model size for query complexity

### Research Findings Summary
**Main Research Question(s):**
<!-- Example: "What are the latest developments in AI music recommendation systems in 2024?" -->

**Key Findings (with citations):**
<!-- 
1. **Finding 1**: [Brief description] [Citation 1]
2. **Finding 2**: [Brief description] [Citation 2]
3. **Finding 3**: [Brief description] [Citation 3]
-->

**Research Quality Metrics:**
- **Sources Count**: [Number] credible sources
- **Average Source Age**: [Days/weeks/months]
- **Cost**: $[amount] USD
- **Average Response Time**: [ms]

## 📚 Citations

**All sources referenced in this PR:**

<!-- 
[1] Author, Title - Publication/Source, Date, URL
[2] Author, Title - Publication/Source, Date, URL
[3] Author, Title - Publication/Source, Date, URL
-->

## 📊 Benchmarks/Performance Impact

**Performance Analysis (Required for code changes):**

### Before/After Metrics
- [ ] **Memory Usage**: Before [X]MB → After [Y]MB
- [ ] **Response Time**: Before [X]ms → After [Y]ms  
- [ ] **Throughput**: Before [X] req/s → After [Y] req/s
- [ ] **Error Rate**: Before [X]% → After [Y]%

### Performance Budget Compliance
- [ ] **Memory Budget**: ≤ 256MB per MCP server ✅/❌
- [ ] **Latency Budget**: p95 ≤ 1500ms (Perplexity), p95 ≤ 500ms (local) ✅/❌
- [ ] **CPU Budget**: ≤ 0.5 core per MCP server ✅/❌
- [ ] **No Performance Regression**: Metrics within acceptable thresholds ✅/❌

### Validation Artifacts
- [ ] **Validation Report**: [enhanced-mcp-validation-report.json](link) generated
- [ ] **Performance Baseline**: Updated baseline with new metrics
- [ ] **Test Coverage**: New tests added for changed functionality
- [ ] **Load Testing**: Performance under expected load verified (if applicable)

## 📦 Validation Artifacts

**For Agent/MCP PRs, validation artifacts will be automatically generated:**
- 📋 **Validation Report**: Comprehensive MCP validation results
- 🔍 **Security Scan**: Dependency audit and secret detection results  
- 🧪 **Integration Tests**: MCP server integration test results
- 📊 **Validation Summary**: Machine-readable validation data (JSON)

**Manual Artifacts (attach if applicable):**
- Performance test results
- Custom integration test outputs
- Additional security scan reports

## 🔄 Available Slash Commands

**Validation Commands:**
- `/run-mcp-validation` - Re-run comprehensive MCP validation
- `/mcp-health-check` - Quick MCP server health check
- `/run-mcp-all` - Run complete validation suite

**Analysis Commands:**  
- `/gpt5 analyze` - Trigger GPT-5 code analysis
- `/review-gpt5` - GPT-5 code review
- `/optimize-gpt5` - GPT-5 optimization suggestions

**Override Commands (Maintainers Only):**
- `/approve-merge` - Override validation and approve merge
- `/force-validation` - Force validation even if not required

---

**Note**: Agent-generated and MCP-related PRs are subject to enhanced validation requirements including security scanning, MCP server health checks, and integration testing. Critical failures will block merge until resolved.
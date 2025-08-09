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
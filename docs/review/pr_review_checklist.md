# PR Review Checklist

A comprehensive checklist for pull request reviews to ensure consistency across areas: scope clarity, security, observability, reliability, performance, testing, documentation, and developer experience.

## How to Use This Checklist

- **For Authors**: Review relevant sections before submitting your PR
- **For Reviewers**: Copy applicable sections into PR comments for thorough review
- **For Teams**: Use as a reference during code review discussions

## Pre-Flight

- [ ] **Scope Clear**: PR description clearly explains what changed and why
- [ ] **Issue Linked**: PR is linked to relevant issue(s) or includes sufficient context
- [ ] **Migration Plan**: Database/API changes include migration strategy if applicable
- [ ] **Feature Flags**: New features use appropriate feature toggles for safe rollout
- [ ] **Breaking Changes**: Breaking changes are clearly documented with migration guide
- [ ] **Size Appropriate**: PR is focused and reasonably sized for effective review

## Security

- [ ] **Input Validation**: All user inputs are properly validated and sanitized
- [ ] **Authentication Impact**: Changes to auth flows are secure and tested
- [ ] **Secrets Management**: No hardcoded secrets, credentials use environment variables
- [ ] **Dependency Changes**: New dependencies are security-scanned and justified
- [ ] **Security Headers**: HTTP security headers remain intact or are improved
- [ ] **Scanning Results**: Security scanning tools pass or issues are addressed
- [ ] **Least Privilege**: Code follows principle of least privilege for access control
- [ ] **SQL Injection**: Database queries use parameterized statements
- [ ] **XSS Prevention**: User content is properly escaped in templates

## Observability

- [ ] **Structured Logs**: New functionality includes appropriate structured logging
- [ ] **Metrics Added**: Performance-critical paths have metrics instrumentation
- [ ] **Trace Spans**: Distributed tracing spans added for new service calls
- [ ] **Cardinality Review**: New metrics won't cause high cardinality issues
- [ ] **Dashboard Impact**: Existing dashboards remain functional or are updated
- [ ] **Error Logging**: Error conditions are logged with sufficient context
- [ ] **Log Levels**: Appropriate log levels used (debug/info/warn/error)

## Reliability & Resilience

- [ ] **Graceful Shutdown**: Changes don't interfere with graceful shutdown process
- [ ] **Retries/Circuit Breakers**: External calls have appropriate retry and circuit breaker logic
- [ ] **Idempotency**: Operations that should be idempotent are properly implemented
- [ ] **Failure Modes**: Potential failure modes are identified and handled
- [ ] **Timeouts**: Network calls have appropriate timeout configurations
- [ ] **Resource Management**: Proper cleanup of resources (connections, file handles)
- [ ] **Error Recovery**: System can recover gracefully from transient failures

## Performance

- [ ] **Algorithmic Complexity**: Algorithm changes don't introduce performance regressions
- [ ] **Caching Usage**: Appropriate caching strategies are used where beneficial
- [ ] **Performance Regression Risk**: Changes assessed for potential performance impact
- [ ] **Benchmarks Updated**: Performance benchmarks updated for critical path changes
- [ ] **Database Queries**: New queries are optimized and use appropriate indexes
- [ ] **Memory Usage**: Memory usage patterns reviewed for potential leaks
- [ ] **Async Operations**: Long-running operations are properly asynchronous

## Data Integrity

- [ ] **Schema Changes**: Database schema changes are backward compatible or include migration
- [ ] **Backfill Plan**: Data migrations include backfill strategy for existing records
- [ ] **PII Handling**: Personal information is handled according to privacy requirements
- [ ] **Data Validation**: Data integrity constraints are maintained
- [ ] **Transaction Boundaries**: Database transactions are properly scoped
- [ ] **Backup Impact**: Changes don't interfere with backup/restore procedures

## Testing

- [ ] **Unit Tests**: New functionality has appropriate unit test coverage
- [ ] **Integration Tests**: Integration tests added for new service interactions
- [ ] **Negative Test Cases**: Edge cases and error conditions are tested
- [ ] **Coverage Delta**: Test coverage metrics don't decrease significantly
- [ ] **Flaky Test Risk**: New tests are stable and don't introduce flakiness
- [ ] **Test Data**: Tests use appropriate test data and don't depend on production data
- [ ] **Mocking Strategy**: External dependencies are properly mocked in tests

## Developer Experience & Maintainability

- [ ] **Code Style**: Code follows established style guidelines and passes linting
- [ ] **Modular Boundaries**: Changes respect existing module boundaries and interfaces
- [ ] **Comments Added**: Non-obvious logic includes explanatory comments
- [ ] **TODOs Converted**: TODO comments are converted to tracked issues
- [ ] **Documentation**: Code is self-documenting with clear variable/function names
- [ ] **Refactoring**: Opportunities for refactoring are identified or addressed
- [ ] **Dependencies**: New dependencies are justified and well-maintained

## Documentation

- [ ] **README Updated**: Changes to functionality are reflected in README
- [ ] **Feature Docs**: New features include user-facing documentation
- [ ] **Environment Variables**: New configuration options are documented
- [ ] **API Documentation**: API changes are reflected in documentation
- [ ] **Diagrams Current**: Architecture diagrams are updated if system design changed
- [ ] **Changelog**: Significant changes are noted for release notes
- [ ] **Migration Guide**: Breaking changes include step-by-step migration instructions

## Release & Rollback

- [ ] **Rollback Steps**: Clear rollback procedure is documented
- [ ] **Configuration Toggles**: Feature can be disabled via configuration if needed
- [ ] **Versioning Impact**: Changes properly handle API/schema versioning
- [ ] **Deploy Dependencies**: Deployment dependencies are clearly identified
- [ ] **Monitoring Plan**: Plan for monitoring the change post-deployment
- [ ] **Canary Strategy**: High-risk changes include canary deployment plan

## Compliance & Governance

- [ ] **License Compatibility**: New dependencies have compatible licenses
- [ ] **Audit Logging**: Privileged actions include appropriate audit logging
- [ ] **Data Retention**: Changes respect data retention policies
- [ ] **Access Controls**: Proper authorization checks are in place
- [ ] **Regulatory Requirements**: Changes comply with relevant regulations (GDPR, etc.)
- [ ] **Security Policies**: Changes align with organizational security policies

---

## Quick Reference Links

- [Security Guidelines](../guides/coding-standards.md#security)
- [Testing Strategy](../guides/coding-standards.md#testing)
- [Performance Optimization](../guides/production-optimization.md)
- [Architecture Documentation](../architecture/)
- [Deployment Guide](../deployment/)

---

*This checklist is designed to be copied and used in PR discussions as needed. Not every section applies to every PR - use your judgment to focus on relevant areas.*
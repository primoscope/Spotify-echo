# Performance & Validation Testing Suite
# EchoTune AI - Phase 1 Implementation

This directory contains comprehensive testing infrastructure for EchoTune AI's Phase 1 implementation, focusing on performance monitoring, security validation, and regression testing.

## Test Categories

### 🚀 Performance Testing (`./perf/`)
- **performance-smoke-test.js**: Load testing and latency validation
- **Budget Validation**: Automated performance budget enforcement
- **Baseline Comparison**: Regression detection against historical data
- **Multi-scenario Testing**: Health checks, API endpoints, authentication flows

#### Usage:
```bash
# Run performance smoke test
npm run test:performance-smoke

# Run with custom parameters
TEST_DURATION=60 TEST_CONNECTIONS=20 npm run test:performance-smoke

# Generate baseline
node tests/perf/performance-smoke-test.js
```

### 🔒 Security Testing (`./security/`)
- **Vulnerability Scanning**: Automated security assessment
- **Rate Limiting Validation**: Token bucket and circuit breaker testing
- **Threat Detection**: Injection attack simulation
- **Access Control**: Authentication and authorization testing

#### Usage:
```bash
# Run security test suite
npm run test:security

# Test specific security component
npm run test:security:rate-limiting
npm run test:security:headers
```

### 🧪 Unit Testing (`./unit/`)
- **Component Testing**: Individual module validation
- **Integration Testing**: Inter-module communication
- **Mock Data**: Realistic test data sets
- **Coverage Reporting**: Code coverage metrics

#### Usage:
```bash
# Run all unit tests
npm run test:unit

# Run with coverage
npm run test:unit --coverage

# Watch mode for development
npm run test:unit:watch
```

## Performance Budgets

### Latency Budgets
- **API Endpoints**: P95 < 400ms
- **Database Queries**: P95 < 200ms
- **Cache Operations**: P95 < 50ms
- **External API Calls**: P95 < 1000ms

### Throughput Budgets
- **API Requests**: > 100 RPS sustained
- **Recommendation Generation**: > 50 RPS
- **Feedback Processing**: > 200 events/sec
- **Concurrent Users**: > 500 active sessions

### Resource Budgets
- **Memory Usage**: < 512MB baseline
- **CPU Utilization**: < 70% average
- **Disk I/O**: < 100MB/s sustained
- **Network Bandwidth**: < 10Mbps per service

## Automated Validation

### GitHub Actions Integration
```yaml
# .github/workflows/validation.yml
name: Performance & Security Validation

on: [push, pull_request]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Performance Tests
        run: npm run test:performance-smoke
        
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Security Tests
        run: npm run test:security
```

### Pre-commit Hooks
```bash
# Install pre-commit hooks
npm run prepare

# Hooks will run:
# - Unit tests
# - Security linting
# - Performance smoke test (lightweight)
```

## Test Data Management

### Fixtures (`./fixtures/`)
- **User Profiles**: Synthetic user data for testing
- **Track Catalogs**: Sample music data with features
- **Interaction Logs**: Simulated user behavior patterns
- **Performance Baselines**: Historical performance data

### Data Generation
```bash
# Generate test data
npm run test:generate-data

# Refresh baselines
npm run test:refresh-baselines

# Clean test artifacts
npm run test:clean
```

## Monitoring Integration

### Metrics Collection
- **Test Execution Metrics**: Duration, success rate, resource usage
- **Application Metrics**: During test execution
- **System Metrics**: CPU, memory, network during load tests
- **Business Metrics**: Recommendation quality during testing

### Dashboard Integration
- **Grafana Dashboards**: Real-time test execution monitoring
- **Performance Trends**: Historical test performance analysis
- **Alert Integration**: Failed test notifications
- **Regression Detection**: Automated performance regression alerts

## Test Environment Configuration

### Local Development
```bash
# Start test environment
docker-compose -f docker-compose.test.yml up

# Environment includes:
# - MongoDB test instance
# - Redis test instance
# - Test data seeds
```

### CI/CD Environment
```bash
# Lightweight test setup for CI
npm run test:setup:ci

# Cleanup after tests
npm run test:cleanup:ci
```

## Quality Gates

### Pull Request Gates
- [ ] All unit tests pass
- [ ] Performance budgets not exceeded
- [ ] Security tests pass
- [ ] Test coverage > 80%
- [ ] No critical vulnerabilities introduced

### Deployment Gates
- [ ] Performance smoke tests pass
- [ ] Security audit passes
- [ ] Load testing validates capacity
- [ ] Monitoring dashboards updated
- [ ] Rollback procedures tested

## Test Reporting

### Report Formats
- **JSON**: Machine-readable test results
- **HTML**: Human-readable test reports
- **JUnit XML**: CI/CD integration format
- **Prometheus Metrics**: Time-series test data

### Report Storage
```
reports/
├── performance/
│   ├── smoke-test-{timestamp}.json
│   ├── load-test-{timestamp}.html
│   └── baseline-comparison.json
├── security/
│   ├── vulnerability-scan-{timestamp}.json
│   ├── penetration-test-{timestamp}.html
│   └── compliance-report.json
└── coverage/
    ├── lcov.info
    ├── coverage-summary.json
    └── html/
```

## Development Workflow

### Test-Driven Development
1. **Write Test**: Create test case for new feature
2. **Run Test**: Verify test fails (red)
3. **Implement**: Write minimal code to pass test
4. **Validate**: Ensure test passes (green)
5. **Refactor**: Optimize code while maintaining tests
6. **Performance**: Validate performance budgets

### Continuous Testing
```bash
# Watch mode for development
npm run test:watch

# Run tests on file changes
npm run test:dev

# Full validation suite
npm run test:full
```

## Performance Analysis

### Profiling Tools
- **Node.js Profiler**: CPU and memory profiling
- **Artillery**: Load testing and performance analysis
- **Chrome DevTools**: Frontend performance analysis
- **MongoDB Profiler**: Database query optimization

### Optimization Workflow
1. **Baseline**: Establish current performance metrics
2. **Profile**: Identify performance bottlenecks
3. **Optimize**: Implement performance improvements
4. **Validate**: Confirm improvements with tests
5. **Monitor**: Track performance in production

## Best Practices

### Test Organization
- **Clear Naming**: Descriptive test names and groups
- **Isolation**: Tests don't depend on each other
- **Repeatability**: Tests produce consistent results
- **Fast Feedback**: Quick test execution for development

### Data Management
- **Synthetic Data**: Use realistic but synthetic test data
- **Data Cleanup**: Clean up test data after execution
- **Environment Separation**: Separate test and production data
- **GDPR Compliance**: No real user data in tests

### Maintenance
- **Regular Updates**: Keep test dependencies updated
- **Baseline Refresh**: Update performance baselines regularly
- **Test Cleanup**: Remove obsolete tests
- **Documentation**: Keep test documentation current

---

## Quick Reference

### Common Commands
```bash
# Run all tests
npm test

# Performance only
npm run test:perf

# Security only  
npm run test:security

# Generate test report
npm run test:report

# Clean test artifacts
npm run test:clean
```

### Environment Variables
```bash
# Test configuration
TEST_ENV=development
TEST_TIMEOUT=30000
TEST_PARALLEL=true

# Performance testing
PERF_DURATION=30
PERF_CONNECTIONS=10
PERF_BASE_URL=http://localhost:3000

# Security testing
SECURITY_SCAN_DEPTH=deep
SECURITY_ALLOW_MEDIUM=false
```

### Troubleshooting
- **Slow Tests**: Check database connections and cleanup
- **Flaky Tests**: Review test isolation and timing
- **Memory Issues**: Verify test data cleanup
- **CI Failures**: Check environment configuration

For detailed information on specific test categories, see the README files in each subdirectory.
# Security Hardening Checklist (Phase 1 & 2)

Status Legend: [ ] pending, [x] implemented, [~] partial

## Phase 1 Security Baseline
- [x] Dependency audit script (npm audit + optional osv-scanner)
- [x] Optional secret scan integration (gitleaks if installed)
- [x] Helmet middleware
- [x] Rate limiting
- [x] Input validation abstraction (zod)
- [x] Centralized error handler (no prod stack leaks)
- [x] Env var validation utility
- [~] CodeQL workflow (added if absent)

## Phase 2 Security Enhancements
- [x] Standard error codes (E_VALIDATION, E_NOT_FOUND, E_INTERNAL)
- [x] Enhanced validation middleware with structured error responses
- [~] Auth scaffold (JWT middleware, non-enforcing by default)
- [x] CSP report-only toggle (ENABLE_CSP_REPORT_ONLY=1)

## Error Handling & Validation
- [x] Standardized error codes across application
- [x] Structured error responses with codes, messages, and details
- [x] 404 catch-all middleware for unmatched routes
- [x] Validation errors with field-level details

## Authentication Scaffold
- [~] JWT middleware (non-enforcing, parses tokens if present)
- [x] Auth metrics tracking (success/failure/skipped)
- [ ] Auth enforcement helpers (requireAuth middleware available)
- [ ] Token refresh mechanism (future)

## Content Security Policy
- [x] CSP report-only mode toggle via environment variable
- [x] Secure default directives (default-src 'self', object-src 'none', etc.)
- [x] Frame protection (frame-ancestors 'none')
- [x] Base URI restriction (base-uri 'self')

## Environment Configuration
- [x] Environment variables documentation
- [x] Security-related environment variables documented
- [x] Demo routes protection (ENABLE_DEMO_ROUTES flag)

## Future Phases
- [ ] Threat model document
- [ ] Full AuthN/AuthZ enforcement
- [ ] CSP enforcement mode (remove report-only)
- [ ] Trusted types for script injection prevention
- [ ] Dependency update automation
- [ ] Security headers testing automation
- [ ] Rate limiting per-user quotas

## Validation Commands

### Standard Error Codes
```bash
# Test validation error
curl -X POST http://localhost:3000/internal/example-validation -d '{}' -H "Content-Type: application/json"
# Should return 400 with E_VALIDATION code

# Test 404 error  
curl http://localhost:3000/api/nonexistent
# Should return 404 with E_NOT_FOUND code
```

### Auth Scaffold
```bash
# Generate test token (requires JWT_SECRET env var)
node -e "console.log(require('jsonwebtoken').sign({userId:'demo'}, process.env.JWT_SECRET || 'devsecret'))"

# Test with valid token
TOKEN=$(node -e "console.log(require('jsonwebtoken').sign({userId:'demo'}, 'devsecret'))")
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/internal/metrics | grep auth_token_validation_total
```

### CSP Report-Only
```bash
# Enable CSP and test headers
ENABLE_CSP_REPORT_ONLY=1 npm start &
curl -I http://localhost:3000/internal/health | grep -i content-security-policy
# Should show Content-Security-Policy-Report-Only header
```

## Security Metrics Available
- `auth_token_validation_total{outcome}` - Auth attempts by outcome
- Standard error response tracking via application logs
- Security header presence via integration tests

Next Phase: Enhanced authentication enforcement, security monitoring, and automated security testing.
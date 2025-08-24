# Security Hardening Checklist (Phase 1)

Status Legend: [ ] pending, [x] implemented, [~] partial

- [x] Dependency audit script (npm audit + optional osv-scanner)
- [x] Optional secret scan integration (gitleaks if installed)
- [x] Helmet middleware
- [x] Rate limiting
- [x] Input validation abstraction (zod)
- [x] Centralized error handler (no prod stack leaks)
- [x] Env var validation utility
- [~] CodeQL workflow (added if absent)
- [ ] Threat model document (future)
- [ ] AuthN/AuthZ hardening (future)
- [ ] CSP policy (future phase)

Next Phases: Tracing security correlation, auth enforcement, CSP + trusted types, dependency update automation.
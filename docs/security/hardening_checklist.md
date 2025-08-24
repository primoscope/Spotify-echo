# Security Hardening Checklist (Phase 1)
- [ ] Dependency audit (npm audit / osv-scanner)
- [ ] Lockfile regeneration
- [ ] Helmet middleware
- [ ] Rate limiting
- [ ] Input validation abstraction
- [ ] Centralized error handling (no stack leaks)
- [ ] Secrets validation on startup
- [ ] Secrets scanning (gitleaks / trufflehog)
- [ ] SAST (CodeQL) (optional early)
- [ ] Threat model draft
Will be updated in Security Baseline PR.
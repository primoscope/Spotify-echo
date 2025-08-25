# Backend Rules (Node + Express)

API Design
- RESTful routes; nouns for resources, verbs in HTTP methods. Validate input with lightweight checks.
- Return structured errors `{ code, message, details }`.

Error Handling
- Centralize error middleware. Never throw raw errors to clients.
- Add timeouts and rate limits (already using `express-rate-limit` and `express-slow-down`).

Security
- Use `helmet`, CORS allowlist, and session cookie settings (HttpOnly, Secure when TLS).
- Never log secrets. Read tokens from environment only.

Performance
- Use compression for large payloads. Stream large responses where possible.
- Prefer async I/O and connection pooling for databases.

Testing
- Integration tests target routes and middleware. Mock external APIs; don’t hit real services in CI.

Operational
- Health endpoints: `/health` and `/status` should be fast and side-effect free.
# Secret Spill Response

If the history scan or gitleaks finds leaks:

## 1) Contain
- Revoke/rotate exposed credentials immediately (GitHub tokens, DO tokens, third-party API keys).
- Temporarily restrict repo access if necessary.

## 2) Eradicate
- Remove secrets from code; add `.env` to `.gitignore` (already included).
- Purge history using `git filter-repo` or BFG for the specific files/paths.
- Force-push protected branches with coordination.

## 3) Recover
- Redeploy with fresh secrets.
- Invalidate cached images and artifacts if they included secrets.

## 4) Learn & Prevent
- Enable secret scanning (and push protection) in repository security settings if available.
- Keep `.env.example` updated; ensure CI validates required secret NAMES exist.
- Run `History Secret Scan` workflow weekly.
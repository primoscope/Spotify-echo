Title
Epic: Combine PRs #149, #150, #151, #154

Purpose
Unify the work from PRs #149, #150, #151, and #154 into a single, reviewable branch and PR to reduce integration risk and speed up end-to-end verification.

Supersedes
- Supersedes #149
- Supersedes #150
- Supersedes #151
- Supersedes #154

Scope
- Integrate the code changes from all four PRs.
- Resolve any merge conflicts and ensure consistent patterns across updated modules.
- Harmonize config/env, migrations, and interfaces so the combined changes build and test cleanly.

Non-goals
- New features beyond what’s already in the four PRs.
- Refactors not required to resolve conflicts or keep the build/test stable.

Implementation plan (agent-executable)
1) Branch setup
   - git fetch origin
   - git checkout -b epic/combine-149-150-151-154 origin/main
2) Identify PR head branches (and remotes if forked)
   - For each PR: retrieve headRefName and remote; add fork remotes as needed.
3) Merge sequence (adjust if needed)
   - Merge PR #154, then #149, then #150, then #151 using: git merge --no-ff <head-branch>
   - Resolve conflicts:
     - Prefer current main’s modern patterns and typings.
     - Keep a single source of truth for env/config; de-duplicate constants.
     - Reconcile route/middleware registration order to preserve expected auth and error handling semantics.
4) Stability and consistency passes
   - npm ci && npm run lint && npm test && npm run build
   - Update docs/config/env samples if any keys or flows changed.
   - Add or fix tests where combined changes create new code paths.
5) Observability
   - Ensure logs/metrics remain consistent; add missing instrumentation if needed.
6) Finalize
   - git push -u origin epic/combine-149-150-151-154
   - Open this PR targeting main.

Test plan
- Unit: all suites must pass; add tests covering merged conflict resolutions and any altered interfaces.
- Integration/E2E:
  - Validate all core flows touched by the combined PRs.
  - Verify auth/session flows, API endpoints, and UI routes (if applicable) continue to work as expected.
- Manual:
  - Smoke-test local dev: start app, check health endpoints, and run a representative user journey.

Risk and rollback
- Risks: conflict mis-resolutions, hidden coupling between the PRs, config drift.
- Rollback: revert this PR with a single revert commit; individual PRs remain available for re-landing if needed.

Completion definition
- The combined branch builds cleanly (lint, test, build all passing).
- Reviewers validate merged behavior and documentation changes.
- This PR merges to main.
- Original PRs (#149, #150, #151, #154) are closed as superseded.
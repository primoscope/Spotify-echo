## CI Automation Fixes — Roadmap Refresh & Analyzer Path

Purpose: Implement safe, minimal CI updates to fix roadmap auto-refresh push permissions and continuous-improvement analyzer path errors, using a PR-based approach that respects branch protections.

### Checklist
- [ ] Set workflow permissions for jobs that write to the repo: `permissions: contents: write`
- [ ] Configure git identity before any commit-in-workflow steps:
  - `git config user.name "github-actions[bot]"`
  - `git config user.email "41898282+github-actions[bot]@users.noreply.github.com"`
- [ ] Replace direct `git push` in workflows with PR creation using `peter-evans/create-pull-request@v6`
- [ ] Use `GITHUB_TOKEN` only; do not add custom tokens. Confirm required scopes are enabled
- [ ] Continuous Improvement analyzer: avoid ENOTDIR by checking `fs.stat().isDirectory()` before recursive scans
- [ ] Analyze the `src/` directory (not `src/server.js`) and guard for missing/renamed paths
- [ ] Validate `ROADMAP_AUTO.md` generation and ensure it is added to the PR instead of pushed directly
- [ ] Provide a rollback note; if adverse effects, close PR or revert merge

### Proposed workflow changes (reference only)
```yaml
permissions:
  contents: write

jobs:
  roadmap_refresh:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup git user
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
      - name: Generate roadmap
        run: node scripts/roadmap-refresh.js || true
      - name: Create Pull Request
        uses: peter-evans/create-pull-request@v6
        with:
          commit-message: "chore(roadmap): auto-refresh roadmap"
          title: "chore(roadmap): auto-refresh roadmap"
          body: "Automated roadmap refresh via workflow"
          branch: automation/roadmap-refresh
          base: main
          labels: automation, roadmap
```

### Analyzer patch (reference only)
```diff
- this.walkDirectory(path.join(root, 'src/server.js'))
+ const target = path.join(root, 'src')
+ const stat = fs.statSync(target)
+ if (stat.isDirectory()) {
+   this.walkDirectory(target)
+ }
```

### Test Plan
- [ ] Run workflow on a test branch; confirm a PR is opened with updated `ROADMAP_AUTO.md`
- [ ] Verify no direct pushes from CI to protected branches
- [ ] Confirm analyzer completes without ENOTDIR and produces a report

### Risk & Rollback
- Risk: Low (workflow-only changes; PR-based writes)
- Rollback: Revert workflow commit or close the automation PR before merge

### Owner
- CLI Agent
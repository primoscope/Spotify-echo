# Secrets & API Inventory (Names Only)

This runbook inventories secret and variable NAMES for:
- Repo-level: Actions secrets, Actions variables, Dependabot secrets
- Environment-level: Secrets and variables
- Org-level (if applicable): Actions secrets/variables, Dependabot secrets, Codespaces secrets

## Important
- GitHub never exposes secret VALUES. This is by design.
- Use this inventory to validate coverage, plan rotations, and align naming across GitHub, DigitalOcean, and runtime.

## Prerequisites
- GitHub CLI, jq
- Appropriate permissions (org-level listings require org admin)

## Quick start
```bash
# From repo root
bash scripts/export/github_inventory.sh dzp5103/Spotify-echo
# Optionally encrypt the export
bash scripts/export/encrypt.sh exports/github/dzp5103/Spotify-echo-YYYYMMDD-HHMMSS
```

## Outputs
- inventory.index.json, repo.actions.secrets.json, repo.actions.variables.json, repo.dependabot.secrets.json, repo.environments.json, org.* (if applicable)
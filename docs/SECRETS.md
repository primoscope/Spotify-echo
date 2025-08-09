# Secrets, Environment, and Safety

This repository previously contained a corrupted `.env` with mojibake and random `=` characters. To keep secrets operational while improving safety and developer experience, we:

- Added `.env.example` with clean, standardized keys and placeholders.
- Ignore `.env` and `.env.*` in Git (but keep `.env.example`).
- Added a CI guard to block future `.env` files in PRs.
- Added local scripts to repair the existing `.env` and to sync secrets to GitHub.

Important: This PR does not modify or remove the existing `.env` file. Maintain operational continuity first, then migrate secrets when ready.

## Repair the corrupted .env locally (do not commit)

```bash
node scripts/repair-dotenv.js .env .env.local
```

Review `.env.local` carefully. Use it for local development or as input for secret managers. Do not commit it.

## Sync secrets to GitHub Actions (optional)

Use the GitHub CLI to store secrets securely:

```bash
./scripts/gh-sync-secrets.sh .env.local --env Production
# or for repo-wide secrets
./scripts/gh-sync-secrets.sh .env.local
```

## Migrate to cloud/runtime secret managers

- GitHub Actions: Repository or Environment secrets
- DigitalOcean App Platform: Configure Environment Variables in the app settings
- Server deployments: Use systemd EnvironmentFile or an orchestration tool (Ansible, Docker secrets)

## Optional: Purge secret file from Git history (later)

Once secrets are migrated and stable, remove `.env` from history (not part of this PR):

Using git-filter-repo:

```bash
pip install git-filter-repo
git filter-repo --path .env --invert-paths
```

Or using BFG:

```bash
bfg --delete-files .env
```

After history cleanup, rotate any secrets that were ever exposed.
#!/usr/bin/env bash
set -euo pipefail

# GitHub Secrets & Variables Inventory (names/metadata only)
# Requires: gh CLI (https://cli.github.com/), authenticated with sufficient scopes
# Outputs JSON files under exports/github/{owner}/{repo}-{date}/
#
# Usage:
#   scripts/export/github_inventory.sh [OWNER/REPO]
#   scripts/export/github_inventory.sh dzp5103/Spotify-echo
#
# If OWNER/REPO is omitted, derives from the current git remote.

requires() {
  command -v "$1" >/dev/null 2>&1 || { echo "Missing dependency: $1" >&2; exit 1; }
}

requires gh
requires jq

REPO_SLUG="${1:-}"
if [[ -z "${REPO_SLUG}" ]]; then
  REPO_SLUG="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
fi

OWNER="${REPO_SLUG%/*}"
REPO="${REPO_SLUG#*/}"

DATE="$(date +%Y%m%d-%H%M%S)"
OUT_DIR="exports/github/${OWNER}/${REPO}-${DATE}"
mkdir -p "${OUT_DIR}"

echo "Inventorying ${OWNER}/${REPO} -> ${OUT_DIR}"

# Determine repository databaseId (numeric) for environment endpoints
REPO_DBID="$(gh repo view "${OWNER}/${REPO}" --json databaseId -q .databaseId)"

# Determine if OWNER is an Organization or User
OWNER_TYPE="$(gh api -X GET "/users/${OWNER}" -q .type || echo "Unknown")"

# Helper: safe API call (skip on 403/404)
api_or_skip() {
  local path="$1"
  if ! out="$(gh api -H "Accept: application/vnd.github+json" "$path" 2>/dev/null)"; then
    echo "{}"
    return 0
  fi
  echo "${out}"
}

# Repo-level
echo "  - Repo secrets (Actions)"
api_or_skip "/repos/${OWNER}/${REPO}/actions/secrets?per_page=100" \
  | jq '{secrets: (.secrets // []) | map({name, created_at, updated_at})}' \
  > "${OUT_DIR}/repo.actions.secrets.json"

echo "  - Repo variables (Actions)"
api_or_skip "/repos/${OWNER}/${REPO}/actions/variables?per_page=100" \
  | jq '{variables: (.variables // []) | map({name, created_at, updated_at})}' \
  > "${OUT_DIR}/repo.actions.variables.json"

echo "  - Repo secrets (Dependabot)"
api_or_skip "/repos/${OWNER}/${REPO}/dependabot/secrets?per_page=100" \
  | jq '{secrets: (.secrets // []) | map({name, created_at, updated_at})}' \
  > "${OUT_DIR}/repo.dependabot.secrets.json"

# Environments
echo "  - Environments"
ENVS="$(api_or_skip "/repos/${OWNER}/${REPO}/environments?per_page=100" | jq -r '.environments[]?.name' || true)"
ENV_AGG="[]"
if [[ -n "${ENVS}" ]]; then
  while IFS= read -r ENV_NAME; do
    echo "      * ${ENV_NAME}"
    ENV_SECRETS="$(api_or_skip "/repositories/${REPO_DBID}/environments/${ENV_NAME}/secrets?per_page=100" \
      | jq '{secrets: (.secrets // []) | map({name, created_at, updated_at})}')"
    ENV_VARIABLES="$(api_or_skip "/repositories/${REPO_DBID}/environments/${ENV_NAME}/variables?per_page=100" \
      | jq '{variables: (.variables // []) | map({name, created_at, updated_at})}')"
    ENV_OBJ="$(jq -n \
      --arg name "${ENV_NAME}" \
      --argjson secrets "${ENV_SECRETS}" \
      --argjson variables "${ENV_VARIABLES}" \
      '{name: $name} + $secrets + $variables')"
    ENV_AGG="$(jq -n --argjson agg "${ENV_AGG}" --argjson item "${ENV_OBJ}" '$agg + [$item]')"
  done <<< "${ENVS}"
fi
echo "${ENV_AGG}" > "${OUT_DIR}/repo.environments.json"

# Org-level (if applicable)
if [[ "${OWNER_TYPE}" == "Organization" ]]; then
  echo "  - Org secrets (Actions)"
  api_or_skip "/orgs/${OWNER}/actions/secrets?per_page=100" \
    | jq '{secrets: (.secrets // []) | map({name, created_at, updated_at, visibility, selected_repositories_url})}' \
    > "${OUT_DIR}/org.actions.secrets.json"

  echo "  - Org variables (Actions)"
  api_or_skip "/orgs/${OWNER}/actions/variables?per_page=100" \
    | jq '{variables: (.variables // []) | map({name, created_at, updated_at, visibility, selected_repositories_url})}' \
    > "${OUT_DIR}/org.actions.variables.json"

  echo "  - Org secrets (Dependabot)"
  api_or_skip "/orgs/${OWNER}/dependabot/secrets?per_page=100" \
    | jq '{secrets: (.secrets // []) | map({name, created_at, updated_at, visibility, selected_repositories_url})}' \
    > "${OUT_DIR}/org.dependabot.secrets.json"

  echo "  - Org secrets (Codespaces)"
  api_or_skip "/orgs/${OWNER}/codespaces/secrets?per_page=100" \
    | jq '{secrets: (.secrets // []) | map({name, created_at, updated_at, visibility, selected_repositories_url})}' \
    > "${OUT_DIR}/org.codespaces.secrets.json"
fi

# Top-level manifest with pointers
jq -n \
  --arg owner "${OWNER}" \
  --arg repo "${REPO}" \
  --arg date "${DATE}" \
  --arg owner_type "${OWNER_TYPE}" \
  --arg repo_dbid "${REPO_DBID}" \
  --argjson repo_actions_secrets "$(cat "${OUT_DIR}/repo.actions.secrets.json")" \
  --argjson repo_actions_variables "$(cat "${OUT_DIR}/repo.actions.variables.json")" \
  --argjson repo_dependabot_secrets "$(cat "${OUT_DIR}/repo.dependabot.secrets.json")" \
  --argjson repo_environments "$(cat "${OUT_DIR}/repo.environments.json")" \
  --argjson org_actions_secrets "$(cat "${OUT_DIR}/org.actions.secrets.json" 2>/dev/null || echo '{}')" \
  --argjson org_actions_variables "$(cat "${OUT_DIR}/org.actions.variables.json" 2>/dev/null || echo '{}')" \
  --argjson org_dependabot_secrets "$(cat "${OUT_DIR}/org.dependabot.secrets.json" 2>/dev/null || echo '{}')" \
  --argjson org_codespaces_secrets "$(cat "${OUT_DIR}/org.codespaces.secrets.json" 2>/dev/null || echo '{}')" \
  '{
    owner: $owner,
    repo: $repo,
    owner_type: $owner_type,
    repo_database_id: $repo_dbid,
    generated_at: $date,
    inventory: {
      repo: {
        actions_secrets: $repo_actions_secrets.secrets,
        actions_variables: $repo_actions_variables.variables,
        dependabot_secrets: $repo_dependabot_secrets.secrets,
        environments: $repo_environments
      },
      org: {
        actions_secrets: $org_actions_secrets.secrets,
        actions_variables: $org_actions_variables.variables,
        dependabot_secrets: $org_dependabot_secrets.secrets,
        codespaces_secrets: $org_codespaces_secrets.secrets
      }
    }
  }' > "${OUT_DIR}/inventory.index.json"

echo "Done. Inventory written to: ${OUT_DIR}"
echo "Note: Values are NOT exported by design. Only names/metadata."
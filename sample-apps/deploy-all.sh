#!/usr/bin/env bash
# Deploys all five apps (FlareID, hr-app, crm-app, collab-app, wiki-app) to a
# single Cloudflare account: creates D1/KV resources as needed, applies
# migrations, sets internal secrets, and deploys every Worker.
#
# Normally you don't run this directly - see ./deploy.sh, which runs this and
# then wire-access.sh (custom domains + Cloudflare Access) with one command.
#
# Requires:
#   - CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID (see config.sh.example for
#     the exact token permissions needed - wrangler reads CLOUDFLARE_API_TOKEN
#     directly, no `wrangler login` required)
#   - Node.js + npm
#
# Usage:
#   ./deploy-all.sh   (reads config.sh - copy config.sh.example to config.sh first)
#
# Safe to re-run: existing D1 databases/KV namespaces (matched by name) are
# reused rather than duplicated. Internal service-to-service secrets
# (ADMIN/WEB/MCP_INTERNAL_SECRET) are rotated fresh on every run since they're
# always redeployed to every worker in the same run anyway; standalone secrets
# (COOKIE_ENCRYPTION_KEY, FlareID's signing key) are only generated once and
# left alone on subsequent runs, to avoid needlessly invalidating live sessions.
#
# Deploys everything to *.workers.dev - run ./wire-access.sh (or just
# ./deploy.sh, which chains both) afterward for custom domains + Access.
#
# Order matters: hr-app/crm-app/collab-app/wiki-app all derive their seeded
# identities from hr-app's own seed data, and FlareID mirrors the same seed -
# but since every app's migrations (including seed data) are already committed
# to this repo, this script just applies the existing migration files as-is.
# Run `npm run seed:generate` in an app's directory first if you want to
# regenerate seed data from scratch before deploying.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Pick up settings from config.sh if you've created one (copy config.sh.example
# to config.sh and fill it in) - otherwise falls back to whatever's already
# exported in your shell.
[ -f "$ROOT/config.sh" ] && source "$ROOT/config.sh"

: "${CLOUDFLARE_API_TOKEN:?Set CLOUDFLARE_API_TOKEN - copy config.sh.example to config.sh and fill it in, or export it directly}"
: "${CLOUDFLARE_ACCOUNT_ID:?Set CLOUDFLARE_ACCOUNT_ID - copy config.sh.example to config.sh and fill it in, or export it directly}"
FORCE_ROTATE_STANDALONE_SECRETS="${FORCE_ROTATE_STANDALONE_SECRETS:-false}"

log() { echo -e "\n\033[1;36m==> $*\033[0m"; }

patch_field() { # <file> <field> <value> [occurrence]
  node "$ROOT/scripts/patch-json-field.mjs" "$1" "$2" "$3" "${4:-0}"
}

set_account_id() { # <wrangler.jsonc>
  patch_field "$1" "account_id" "$CLOUDFLARE_ACCOUNT_ID"
}

random_hex() { node -e "console.log(require('crypto').randomBytes(${1:-24}).toString('hex'))"; }

# Creates a D1 database if it doesn't already exist (by name), and echoes its uuid either way.
ensure_d1() { # <dir> <db_name>
  local dir="$1" name="$2" out id
  set +e
  out=$(cd "$dir" && npx wrangler d1 create "$name" 2>&1)
  set -e
  id=$(echo "$out" | grep -o '"database_id": *"[^"]*"' | head -1 | sed -E 's/.*"([a-f0-9-]+)"/\1/')
  if [ -z "$id" ]; then
    out=$(cd "$dir" && npx wrangler d1 list --json 2>&1)
    id=$(node -e "
      const list = JSON.parse(process.argv[1]);
      const match = list.find((d) => d.name === process.argv[2]);
      if (!match) { console.error('Could not find or create D1 database: ' + process.argv[2]); process.exit(1); }
      console.log(match.uuid);
    " "$out" "$name")
  fi
  echo "$id"
}

# Creates a KV namespace if it doesn't already exist (by title), and echoes its id either way.
ensure_kv() { # <dir> <kv_title>
  local dir="$1" name="$2" out id
  set +e
  out=$(cd "$dir" && npx wrangler kv namespace create "$name" 2>&1)
  set -e
  id=$(echo "$out" | grep -o '"id": *"[^"]*"' | head -1 | sed -E 's/.*"([a-f0-9]+)"/\1/')
  if [ -z "$id" ]; then
    out=$(cd "$dir" && npx wrangler kv namespace list 2>&1)
    id=$(node -e "
      const list = JSON.parse(process.argv[1]);
      const match = list.find((n) => n.title === process.argv[2] || n.title.endsWith('-' + process.argv[2]));
      if (!match) { console.error('Could not find or create KV namespace: ' + process.argv[2]); process.exit(1); }
      console.log(match.id);
    " "$out" "$name")
  fi
  echo "$id"
}

has_secret() { # <dir> <name>
  (cd "$1" && npx wrangler secret list 2>&1) | grep -q "\"name\": \"$2\""
}

# Always overwrites - use for secrets shared between two workers, which must match.
set_secret() { # <dir> <name> <value>
  printf '%s' "$3" | (cd "$1" && npx wrangler secret put "$2") > /dev/null
  echo "  set $2"
}

# Only sets if missing (unless FORCE_ROTATE_STANDALONE_SECRETS=true) - use for secrets
# that aren't shared with another worker, so there's no correctness reason to rotate them.
set_secret_once() { # <dir> <name> <value>
  if [ "$FORCE_ROTATE_STANDALONE_SECRETS" = "true" ] || ! has_secret "$1" "$2"; then
    set_secret "$1" "$2" "$3"
  else
    echo "  $2 already set, skipping (FORCE_ROTATE_STANDALONE_SECRETS=true to rotate)"
  fi
}

# Deploys a worker and echoes the workers.dev URL wrangler reports.
deploy_and_get_url() { # <dir>
  local out
  out=$(cd "$1" && npx wrangler deploy 2>&1)
  echo "$out" >&2
  echo "$out" | grep -oE 'https://[a-z0-9.-]+\.workers\.dev' | head -1
}

check_wrangler_auth() {
  log "Checking wrangler auth"
  npx wrangler whoami
}

# ---------------------------------------------------------------------------
# FlareID
# ---------------------------------------------------------------------------
deploy_flareid() {
  local dir="$ROOT/flareid-idp"
  log "FlareID: install + typecheck"
  (cd "$dir" && npm install && npm run typecheck)

  log "FlareID: D1 + KV"
  set_account_id "$dir/wrangler.jsonc"
  local db_id kv_id
  db_id=$(ensure_d1 "$dir" "flareid-db")
  kv_id=$(ensure_kv "$dir" "flareid-idp-sessions")
  patch_field "$dir/wrangler.jsonc" "database_id" "$db_id"
  patch_field "$dir/wrangler.jsonc" "id" "$kv_id"

  log "FlareID: migrations"
  (cd "$dir" && npx wrangler d1 migrations apply flareid-db --remote)

  log "FlareID: secrets"
  set_secret_once "$dir" "COOKIE_ENCRYPTION_KEY" "$(random_hex 32)"
  if [ "$FORCE_ROTATE_STANDALONE_SECRETS" = "true" ] || ! has_secret "$dir" "SIGNING_KEY_PKCS8"; then
    echo "  generating fresh RS256 signing keypair..."
    (cd "$dir" && node scripts/gen-secrets-for-deploy.mjs .)
    set_secret "$dir" "SIGNING_KEY_PKCS8" "$(cat "$dir/.signing-key.pem")"
    patch_field "$dir/wrangler.jsonc" "SIGNING_PUBLIC_JWK" "$(cat "$dir/.signing-public-jwk.txt")"
    patch_field "$dir/wrangler.jsonc" "SIGNING_KEY_ID" "flareid-key-1"
    rm -f "$dir/.signing-key.pem" "$dir/.signing-public-jwk.txt"
  else
    echo "  SIGNING_KEY_PKCS8 already set, skipping (FORCE_ROTATE_STANDALONE_SECRETS=true to rotate)"
  fi

  log "FlareID: deploy (pass 1, to discover the workers.dev URL)"
  local url
  url=$(deploy_and_get_url "$dir")
  echo "  deployed at $url"

  log "FlareID: point ISSUER_URL at the deployed URL and redeploy"
  patch_field "$dir/wrangler.jsonc" "ISSUER_URL" "$url"
  deploy_and_get_url "$dir" > /dev/null

  echo "FLAREID_URL=$url"
}

# ---------------------------------------------------------------------------
# Generic three-worker app (hr-app / crm-app / collab-app all follow this
# exact same api+mcp+web shape).
# ---------------------------------------------------------------------------
deploy_three_worker_app() { # <app_dir> <db_name> <kv_name>
  local app_dir="$1" db_name="$2" kv_name="$3"
  local root="$ROOT/$app_dir"
  local api_dir="$root/api" mcp_dir="$root/mcp" web_dir="$root/web"

  log "$app_dir: install + typecheck"
  (cd "$root" && npm install && npm run typecheck)

  log "$app_dir: api - D1"
  set_account_id "$api_dir/wrangler.jsonc"
  local db_id
  db_id=$(ensure_d1 "$api_dir" "$db_name")
  patch_field "$api_dir/wrangler.jsonc" "database_id" "$db_id"

  log "$app_dir: api - migrations"
  (cd "$api_dir" && npx wrangler d1 migrations apply "$db_name" --remote)

  log "$app_dir: api - secrets"
  local admin_secret web_secret mcp_secret
  admin_secret=$(random_hex 24)
  web_secret=$(random_hex 24)
  mcp_secret=$(random_hex 24)
  set_secret "$api_dir" "ADMIN_INTERNAL_SECRET" "$admin_secret"
  set_secret "$api_dir" "WEB_INTERNAL_SECRET" "$web_secret"
  set_secret "$api_dir" "MCP_INTERNAL_SECRET" "$mcp_secret"

  log "$app_dir: api - deploy"
  local api_url
  api_url=$(deploy_and_get_url "$api_dir")
  echo "  deployed at $api_url"

  log "$app_dir: mcp - KV + API_BASE_URL"
  set_account_id "$mcp_dir/wrangler.jsonc"
  local kv_id
  kv_id=$(ensure_kv "$mcp_dir" "$kv_name")
  patch_field "$mcp_dir/wrangler.jsonc" "id" "$kv_id"
  patch_field "$mcp_dir/wrangler.jsonc" "API_BASE_URL" "$api_url"

  log "$app_dir: mcp - secrets"
  set_secret "$mcp_dir" "MCP_INTERNAL_SECRET" "$mcp_secret"
  set_secret_once "$mcp_dir" "COOKIE_ENCRYPTION_KEY" "$(random_hex 32)"
  echo "  NOTE: ACCESS_CLIENT_ID / ACCESS_CLIENT_SECRET / ACCESS_AUTHORIZATION_URL /"
  echo "        ACCESS_TOKEN_URL / ACCESS_JWKS_URL are still placeholders - mcp will"
  echo "        deploy fine but its OAuth login won't work until you create an"
  echo "        'Access for SaaS' application for it (see the app's README)."

  log "$app_dir: mcp - deploy"
  deploy_and_get_url "$mcp_dir" > /dev/null

  log "$app_dir: web - secrets"
  set_account_id "$web_dir/wrangler.jsonc"
  set_secret "$web_dir" "ADMIN_INTERNAL_SECRET" "$admin_secret"
  set_secret "$web_dir" "WEB_INTERNAL_SECRET" "$web_secret"

  log "$app_dir: web - deploy"
  (cd "$web_dir" && npm run deploy)
}

main() {
  check_wrangler_auth
  deploy_flareid
  deploy_three_worker_app "hr-app" "hr-app-db" "hr-app-mcp-oauth"
  deploy_three_worker_app "crm-app" "crm-app-db" "crm-app-mcp-oauth"
  deploy_three_worker_app "collab-app" "collab-app-db" "collab-app-mcp-oauth"
  deploy_three_worker_app "wiki-app" "wiki-app-db" "wiki-app-mcp-oauth"

  log "All done"
  echo "Everything is deployed to *.workers.dev."
  echo "Next: run ./wire-access.sh (same CLOUDFLARE_API_TOKEN/config.sh) to set up"
  echo "  custom domains, an Access app for each web app, and an Access-for-SaaS app"
  echo "  for each mcp server - or just run ./deploy.sh to do both in one go."
}

main "$@"

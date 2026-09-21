#!/usr/bin/env bash
# Fully automates the Cloudflare Access side of the demo: custom domains for
# all 15 Workers, an Access application in front of each `web`, an
# "Access for SaaS" application (+ OAuth wiring) in front of each `mcp`, and
# bootstraps FlareID itself (first-run setup + an OIDC client for Access) if
# it hasn't been done yet.
#
# Normally you don't run this directly - see ./deploy.sh, which runs
# deploy-all.sh and then this with one command. Run deploy-all.sh first if
# you do run this on its own - it assumes all 15 Workers already exist and
# are reachable on *.workers.dev.
#
# Uses the same CLOUDFLARE_API_TOKEN as deploy-all.sh - see config.sh.example
# for the full permission list that single token needs (it covers both
# deploying Workers/D1/KV and managing Access here).
#
# Usage:
#   ./wire-access.sh   (reads config.sh - copy config.sh.example to config.sh first)
#   (optionally set ZONE_NAME in config.sh to skip the interactive zone picker)
#
# Default Access policy: "anyone who successfully logs in via FlareID" (an
# AccessLoginMethodRule keyed to FlareID's identity provider). This is a
# pragmatic stand-in for "All Employees": FlareID is the *only* identity
# source in this whole setup, so "authenticated via FlareID" and "is an
# employee" are equivalent here. Swap in a real Access Group afterward if you
# want finer-grained policy.
#
# Safe to re-run: every resource is looked up by name/hostname before being
# created, so already-wired apps are left alone and only missing pieces get
# filled in.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Pick up settings from config.sh if you've created one (copy config.sh.example
# to config.sh and fill it in) - otherwise falls back to whatever's already
# exported in your shell.
[ -f "$ROOT/config.sh" ] && source "$ROOT/config.sh"

: "${CLOUDFLARE_API_TOKEN:?Set CLOUDFLARE_API_TOKEN (see header comment for the permissions it needs) - copy config.sh.example to config.sh and fill it in, or export it directly}"
: "${CLOUDFLARE_ACCOUNT_ID:?Set CLOUDFLARE_ACCOUNT_ID}"
CF_API="https://api.cloudflare.com/client/v4"

log() { echo -e "\n\033[1;36m==> $*\033[0m"; }
jqlite() { node "$ROOT/scripts/jq-lite.mjs" "$1"; } # reads JSON from stdin
patch_field() { node "$ROOT/scripts/patch-json-field.mjs" "$1" "$2" "$3" "${4:-0}"; }

cf_get() { curl -s "$CF_API$1" -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"; }
cf_post() { curl -s -X POST "$CF_API$1" -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" -H "Content-Type: application/json" --data "$2"; }
cf_put() { curl -s -X PUT "$CF_API$1" -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" -H "Content-Type: application/json" --data "$2"; }

require_success() { # <json> <error-context>
  local ok; ok=$(echo "$1" | jqlite "success" 2>/dev/null || echo "false")
  if [ "$ok" != "true" ]; then
    echo "Cloudflare API call failed ($2):" >&2
    echo "$1" >&2
    exit 1
  fi
}

# ---------------------------------------------------------------------------
# Phase 0: zone selection + Zero Trust team info
# ---------------------------------------------------------------------------
pick_zone() {
  local zones_json
  zones_json=$(cf_get "/zones?account.id=$CLOUDFLARE_ACCOUNT_ID")
  require_success "$zones_json" "listing zones"

  if [ -n "${ZONE_NAME:-}" ]; then
    ZONE_ID=$(echo "$zones_json" | jqlite "result.find(name=$ZONE_NAME).id")
    if [ -z "$ZONE_ID" ]; then
      echo "Zone '$ZONE_NAME' not found in this account." >&2
      exit 1
    fi
    return
  fi

  local names count
  count=$(echo "$zones_json" | jqlite "result" | node -e "console.log(JSON.parse(require('fs').readFileSync(0,'utf8')).length)")
  if [ "$count" -eq 1 ]; then
    ZONE_NAME=$(echo "$zones_json" | jqlite "result[0].name")
    ZONE_ID=$(echo "$zones_json" | jqlite "result[0].id")
    echo "Only one zone in this account, using it: $ZONE_NAME"
    return
  fi

  echo "Zones in this account:"
  echo "$zones_json" | node -e "
    const d = JSON.parse(require('fs').readFileSync(0,'utf8'));
    d.result.forEach((z, i) => console.log(\`  [\${i}] \${z.name}\`));
  "
  read -r -p "Which zone should host all custom domains? Enter the index: " idx
  ZONE_NAME=$(echo "$zones_json" | jqlite "result[$idx].name")
  ZONE_ID=$(echo "$zones_json" | jqlite "result[$idx].id")
  if [ -z "$ZONE_ID" ]; then
    echo "Invalid selection." >&2
    exit 1
  fi
}

get_auth_domain() {
  local org_json
  org_json=$(cf_get "/accounts/$CLOUDFLARE_ACCOUNT_ID/access/organizations")
  require_success "$org_json" "getting Zero Trust organization"
  AUTH_DOMAIN=$(echo "$org_json" | jqlite "result.auth_domain")
}

# ---------------------------------------------------------------------------
# Custom domains
# ---------------------------------------------------------------------------
ensure_custom_domain() { # <hostname> <worker_name>
  local hostname="$1" worker="$2"
  log "Custom domain: $hostname -> $worker"
  local out
  out=$(cf_put "/accounts/$CLOUDFLARE_ACCOUNT_ID/workers/domains/records" \
    "{\"hostname\":\"$hostname\",\"service\":\"$worker\",\"environment\":\"production\",\"zone_id\":\"$ZONE_ID\"}")
  local ok; ok=$(echo "$out" | jqlite "success" 2>/dev/null || echo "false")
  if [ "$ok" != "true" ]; then
    # Already attached to this worker is fine; anything else is a real error.
    if echo "$out" | grep -q "already has"; then
      echo "  already attached, leaving as-is"
    else
      echo "  Cloudflare API error attaching $hostname:" >&2
      echo "$out" >&2
      exit 1
    fi
  else
    echo "  attached"
  fi
}

# ---------------------------------------------------------------------------
# FlareID bootstrap: first-run setup + an OAuth client for Access to use.
# Skipped entirely if an Access identity provider for FlareID already exists.
# ---------------------------------------------------------------------------
find_flareid_idp_id() {
  local list
  list=$(cf_get "/accounts/$CLOUDFLARE_ACCOUNT_ID/access/identity_providers")
  require_success "$list" "listing identity providers"
  echo "$list" | node -e "
    const d = JSON.parse(require('fs').readFileSync(0,'utf8'));
    const match = d.result.find((p) => (p.config?.auth_url || '').includes(process.argv[1]));
    if (match) console.log(match.id);
  " "$FLAREID_HOST"
}

bootstrap_flareid_and_register_idp() {
  log "FlareID: checking for an existing Access identity provider"
  FLAREID_IDP_ID=$(find_flareid_idp_id || true)
  if [ -n "$FLAREID_IDP_ID" ]; then
    echo "  found existing identity provider: $FLAREID_IDP_ID"
    return
  fi

  log "FlareID: bootstrapping (first login + setup wizard)"
  local base="https://$FLAREID_HOST"
  local jar; jar=$(mktemp)

  local login_html; login_html=$(curl -s -c "$jar" "$base/login")
  local flow_id; flow_id=$(echo "$login_html" | grep -o 'name="flow_id" value="[^"]*"' | sed -E 's/.*value="([^"]*)"/\1/')

  curl -s -b "$jar" -c "$jar" -X POST "$base/login" \
    --data-urlencode "flow_id=$flow_id" \
    --data-urlencode "upn=admin@company.com" \
    --data-urlencode "password=Savetheinternet!1" -o /dev/null

  curl -s -b "$jar" -c "$jar" -X POST "$base/admin/setup" \
    --data-urlencode "domain=company.com" \
    --data-urlencode "default_password=Savetheinternet!1" -o /dev/null
  echo "  setup completed (or already was)"

  log "FlareID: creating an OIDC client for Access"
  local client_html
  client_html=$(curl -s -b "$jar" -X POST "$base/admin/clients" \
    --data-urlencode "name=Cloudflare Access" \
    --data-urlencode "redirect_uris=https://$AUTH_DOMAIN/cdn-cgi/access/callback")

  FLAREID_CLIENT_ID=$(echo "$client_html" | grep -o 'flareid_[a-f0-9]\+' | head -1)
  FLAREID_CLIENT_SECRET=$(echo "$client_html" | grep -A2 "copy this now" | grep -o '<code>[^<]*</code>' | head -1 | sed -E 's/<[^>]*>//g')
  rm -f "$jar"

  if [ -z "$FLAREID_CLIENT_ID" ] || [ -z "$FLAREID_CLIENT_SECRET" ]; then
    echo "Failed to create/parse FlareID's OAuth client for Access. Response was:" >&2
    echo "$client_html" >&2
    exit 1
  fi
  echo "  created client $FLAREID_CLIENT_ID"

  log "FlareID: registering it as an Access identity provider"
  local idp_out
  idp_out=$(cf_post "/accounts/$CLOUDFLARE_ACCOUNT_ID/access/identity_providers" "$(node -e '
    console.log(JSON.stringify({
      name: "FlareID",
      type: "oidc",
      config: {
        client_id: process.argv[1],
        client_secret: process.argv[2],
        auth_url: `https://${process.argv[3]}/authorize`,
        token_url: `https://${process.argv[3]}/token`,
        certs_url: `https://${process.argv[3]}/jwks.json`,
        pkce_enabled: false,
        claims: ["groups"],
        scopes: ["openid", "email", "profile", "groups"],
      },
    }));
  ' "$FLAREID_CLIENT_ID" "$FLAREID_CLIENT_SECRET" "$FLAREID_HOST")")
  require_success "$idp_out" "creating FlareID identity provider"
  FLAREID_IDP_ID=$(echo "$idp_out" | jqlite "result.id")
  echo "  identity provider id: $FLAREID_IDP_ID"
}

# ---------------------------------------------------------------------------
# Reusable "logged in via FlareID" policy
# ---------------------------------------------------------------------------
ensure_default_policy() {
  log "Access: default policy (anyone authenticated via FlareID)"
  local list; list=$(cf_get "/accounts/$CLOUDFLARE_ACCOUNT_ID/access/policies")
  require_success "$list" "listing policies"
  POLICY_ID=$(echo "$list" | jqlite "result.find(name=Logged in via FlareID).id" || true)
  if [ -n "$POLICY_ID" ]; then
    echo "  reusing existing policy: $POLICY_ID"
    return
  fi

  local out
  out=$(cf_post "/accounts/$CLOUDFLARE_ACCOUNT_ID/access/policies" "$(node -e '
    console.log(JSON.stringify({
      name: "Logged in via FlareID",
      decision: "allow",
      include: [{ login_method: { id: process.argv[1] } }],
    }));
  ' "$FLAREID_IDP_ID")")
  require_success "$out" "creating default policy"
  POLICY_ID=$(echo "$out" | jqlite "result.id")
  echo "  created policy: $POLICY_ID"
}

# ---------------------------------------------------------------------------
# Access self-hosted application (for a `web` worker)
# ---------------------------------------------------------------------------
ensure_self_hosted_app() { # <name> <hostname>
  local name="$1" hostname="$2"
  log "Access app: $name ($hostname)"
  local list; list=$(cf_get "/accounts/$CLOUDFLARE_ACCOUNT_ID/access/apps")
  require_success "$list" "listing access apps"
  local existing; existing=$(echo "$list" | jqlite "result.find(domain=$hostname).id" || true)
  if [ -n "$existing" ]; then
    echo "  already exists: $existing"
    return
  fi

  local out
  out=$(cf_post "/accounts/$CLOUDFLARE_ACCOUNT_ID/access/apps" "$(node -e '
    console.log(JSON.stringify({
      name: process.argv[1],
      type: "self_hosted",
      domain: process.argv[2],
      session_duration: "24h",
      auto_redirect_to_identity: true,
      allowed_idps: [process.argv[3]],
      policies: [process.argv[4]],
    }));
  ' "$name" "$hostname" "$FLAREID_IDP_ID" "$POLICY_ID")")
  require_success "$out" "creating access app for $hostname"
  echo "  created: $(echo "$out" | jqlite "result.id")"
}

# ---------------------------------------------------------------------------
# Access for SaaS (OIDC) application (for an `mcp` worker) - and wires the
# resulting client credentials straight into that worker's config/secrets.
# ---------------------------------------------------------------------------
ensure_saas_app_and_wire_mcp() { # <name> <hostname> <mcp_dir>
  local name="$1" hostname="$2" mcp_dir="$3"
  local callback="https://$hostname/callback"

  log "Access for SaaS app: $name ($hostname)"
  local list; list=$(cf_get "/accounts/$CLOUDFLARE_ACCOUNT_ID/access/apps")
  require_success "$list" "listing access apps"
  local existing; existing=$(echo "$list" | jqlite "result.find(name=$name).id" || true)

  local client_id
  if [ -n "$existing" ]; then
    echo "  Access for SaaS app already exists ($existing) - can't recover its client secret via API,"
    echo "  so leaving $mcp_dir's ACCESS_* config untouched. Delete the app in the dashboard and re-run"
    echo "  this script if you need to rewire it."
    return
  fi

  local out
  out=$(cf_post "/accounts/$CLOUDFLARE_ACCOUNT_ID/access/apps" "$(node -e '
    console.log(JSON.stringify({
      name: process.argv[1],
      type: "saas",
      allowed_idps: [process.argv[2]],
      policies: [process.argv[3]],
      saas_app: {
        auth_type: "oidc",
        redirect_uris: [process.argv[4]],
        grant_types: ["authorization_code", "refresh_tokens"],
      },
    }));
  ' "$name" "$FLAREID_IDP_ID" "$POLICY_ID" "$callback")")
  require_success "$out" "creating access for SaaS app for $hostname"

  client_id=$(echo "$out" | jqlite "result.saas_app.client_id")
  local client_secret; client_secret=$(echo "$out" | jqlite "result.saas_app.client_secret")
  echo "  created SaaS app, client_id=$client_id"

  local auth_url="https://$AUTH_DOMAIN/cdn-cgi/access/sso/oidc/$client_id/authorization"
  local token_url="https://$AUTH_DOMAIN/cdn-cgi/access/sso/oidc/$client_id/token"
  local jwks_url="https://$AUTH_DOMAIN/cdn-cgi/access/sso/oidc/$client_id/jwks"

  patch_field "$mcp_dir/wrangler.jsonc" "ACCESS_AUTHORIZATION_URL" "$auth_url"
  patch_field "$mcp_dir/wrangler.jsonc" "ACCESS_TOKEN_URL" "$token_url"
  patch_field "$mcp_dir/wrangler.jsonc" "ACCESS_JWKS_URL" "$jwks_url"
  printf '%s' "$client_id" | (cd "$mcp_dir" && npx wrangler secret put ACCESS_CLIENT_ID) > /dev/null
  printf '%s' "$client_secret" | (cd "$mcp_dir" && npx wrangler secret put ACCESS_CLIENT_SECRET) > /dev/null

  log "Redeploying $mcp_dir with its new Access-for-SaaS config"
  (cd "$mcp_dir" && npx wrangler deploy)
}

# Sets ROOT_DOMAIN on every app (FlareID + the 4 web workers) so their
# /about-demo pages can cross-link to each other - each app builds its
# siblings' URLs itself from this one shared var plus the fixed subdomain
# convention above (idp./hr./crm./work./wiki.), so there's nothing per-app to
# compute here beyond redeploying with the var set.
wire_cross_app_links() {
  log "Setting ROOT_DOMAIN on every app so their /about-demo pages cross-link to each other"

  patch_field "$ROOT/flareid-idp/wrangler.jsonc" "ROOT_DOMAIN" "$ZONE_NAME"
  (cd "$ROOT/flareid-idp" && npx wrangler deploy) > /dev/null

  for app in hr-app crm-app collab-app wiki-app; do
    patch_field "$ROOT/$app/web/wrangler.jsonc" "ROOT_DOMAIN" "$ZONE_NAME"
    (cd "$ROOT/$app/web" && npm run deploy) > /dev/null
  done
}

main() {
  pick_zone
  get_auth_domain
  echo "Using zone: $ZONE_NAME ($ZONE_ID), Zero Trust auth domain: $AUTH_DOMAIN"

  FLAREID_HOST="idp.$ZONE_NAME"
  ensure_custom_domain "$FLAREID_HOST" "flareid-idp"
  bootstrap_flareid_and_register_idp
  ensure_default_policy

  # hr-app
  ensure_custom_domain "hr-api.$ZONE_NAME" "hr-app-api"
  ensure_custom_domain "hr-mcp.$ZONE_NAME" "hr-app-mcp"
  ensure_custom_domain "hr.$ZONE_NAME" "hr-app-web"
  ensure_self_hosted_app "WorkWeek (HR)" "hr.$ZONE_NAME"
  ensure_saas_app_and_wire_mcp "WorkWeek MCP" "hr-mcp.$ZONE_NAME" "$ROOT/hr-app/mcp"

  # crm-app
  ensure_custom_domain "crm-api.$ZONE_NAME" "crm-app-api"
  ensure_custom_domain "crm-mcp.$ZONE_NAME" "crm-app-mcp"
  ensure_custom_domain "crm.$ZONE_NAME" "crm-app-web"
  ensure_self_hosted_app "Pipeline (CRM)" "crm.$ZONE_NAME"
  ensure_saas_app_and_wire_mcp "Pipeline MCP" "crm-mcp.$ZONE_NAME" "$ROOT/crm-app/mcp"

  # collab-app
  ensure_custom_domain "work-api.$ZONE_NAME" "collab-app-api"
  ensure_custom_domain "work-mcp.$ZONE_NAME" "collab-app-mcp"
  ensure_custom_domain "work.$ZONE_NAME" "collab-app-web"
  ensure_self_hosted_app "Relay (Inbox/Calendar)" "work.$ZONE_NAME"
  ensure_saas_app_and_wire_mcp "Relay MCP" "work-mcp.$ZONE_NAME" "$ROOT/collab-app/mcp"

  # wiki-app
  ensure_custom_domain "wiki-api.$ZONE_NAME" "wiki-app-api"
  ensure_custom_domain "wiki-mcp.$ZONE_NAME" "wiki-app-mcp"
  ensure_custom_domain "wiki.$ZONE_NAME" "wiki-app-web"
  ensure_self_hosted_app "Nexus (Wiki)" "wiki.$ZONE_NAME"
  ensure_saas_app_and_wire_mcp "Nexus MCP" "wiki-mcp.$ZONE_NAME" "$ROOT/wiki-app/mcp"

  wire_cross_app_links

  log "Done"
  echo "hr-app-api / crm-app-api / collab-app-api / wiki-app-api now have custom domains"
  echo "but no Access app in front of them (matching how we've done it manually all along -"
  echo "they're internal-only, gated by shared secrets/bearer tokens, not Access)."
  echo
  echo "Each mcp worker's API_BASE_URL still points at its workers.dev URL from"
  echo "deploy-all.sh - update it to the new *-api custom domain and redeploy if"
  echo "you want mcp calling api over the custom domain too."
}

main "$@"

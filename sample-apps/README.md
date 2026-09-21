# Cloudflare AI Security Workshop - Demo Apps

Four demo apps for a workshop on securing AI/agent access to internal
applications with Cloudflare Access, Gateway, and AI Gateway:

| App | Brand | What it demonstrates |
| --- | --- | --- |
| [`flareid-idp`](flareid-idp/) | FlareID | The shared identity provider (OIDC) behind everything else |
| [`hr-app`](hr-app/) | WorkWeek | HR system - employees, comp, benefits, org chart |
| [`crm-app`](crm-app/) | Pipeline | Sales CRM - accounts, contacts, deals |
| [`collab-app`](collab-app/) | Relay | Inbox + calendar |
| [`wiki-app`](wiki-app/) | Nexus | Internal wiki - spaces (some restricted), pages, version history |

Each app (except FlareID) is three independently-deployed Cloudflare Workers -
`api` (owns the D1 database), `mcp` (its own OAuth 2.1 MCP server, delegating
login to Cloudflare Access), and `web` (the end-user dashboard, sitting behind
Access). See each app's own README for its specific architecture.

## Quick start: deploy everything

**Prerequisites:**
- Node.js + npm
- One Cloudflare API Token (see below) - no `wrangler login` needed at all,
  `wrangler` reads `CLOUDFLARE_API_TOKEN` directly

**1. Create an API Token**

At dash.cloudflare.com -> My Profile -> API Tokens -> Create Token -> Custom
token, for the target account. See [`config.sh.example`](config.sh.example)
for the exact permission list - one token covers both deploying every Worker
and setting up custom domains + Cloudflare Access.

**2. Configure**

```bash
cp config.sh.example config.sh
# edit config.sh: set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN
```

**3. Deploy**

```bash
./deploy.sh
```

This runs two scripts in sequence, both driven by the one token above:

- **`deploy-all.sh`**: creates every D1 database/KV namespace (reusing them if
  they already exist by name), applies all migrations (seed data included),
  sets internal secrets, and deploys every Worker to `*.workers.dev`.
- **`wire-access.sh`**: enumerates zones in the account (or prompts you to
  pick one), attaches custom domains to all 15 Workers, bootstraps FlareID's
  own first-run setup, registers it as an Access identity provider, and
  creates an Access application in front of every `web` app plus an
  Access-for-SaaS application in front of every `mcp` server - pulling the
  resulting OAuth credentials straight into each `mcp`'s secrets, no manual
  copy-paste.

You can also run either script on its own (`./deploy-all.sh` or
`./wire-access.sh`) - both are safe to re-run, since every resource is looked
up by name/hostname first and reused rather than duplicated.

**4. Log in**

Every seeded account (including FlareID's own super-admin) uses the same
default password: `Savetheinternet!1`. The super-admin account is
`admin@company.com` (or just the username `admin`) - use it to sign in to
FlareID directly at `/login` and finish reviewing setup at `/admin`, or to
reach any app's own `/admin` page (branding, accounts, API tokens). Every
other seeded person (e.g. `nikita.crist@company.com`, the CEO) uses the same
password and works the same way for signing into the apps themselves via
Access. Change the default password at `/admin/security` in FlareID before
using this for anything beyond the workshop.

## What's still manual

- Reviewing/tightening the default Access policy (`wire-access.sh` applies a
  simple "anyone who logs in via FlareID" policy to get you started)
- Anything you want beyond the defaults: MCP Server Portals, Gateway routing,
  AI Gateway, DLP policies, tighter per-app Access policies, etc. - that's the
  point of the workshop.

## Repo layout

```
flareid-idp/   Identity provider
hr-app/        HR demo app (api / mcp / web)
crm-app/       CRM demo app (api / mcp / web)
collab-app/    Inbox + calendar demo app (api / mcp / web)
wiki-app/      Wiki demo app (api / mcp / web)
shared-ui/     Canonical UI content duplicated (not imported) across every app
               - see shared-ui/README.md
scripts/       Shared deploy tooling (JSON patching, JSON parsing)
deploy.sh      Runs deploy-all.sh then wire-access.sh - the one command to run
deploy-all.sh  Deploys every Worker
wire-access.sh Wires up custom domains + Cloudflare Access
config.sh.example  Copy to config.sh and fill in before running the scripts above
```

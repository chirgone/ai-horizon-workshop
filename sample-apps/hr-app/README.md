# hr-app (WorkWeek)

A Workday-style demo HR application for the Cloudflare AI security workshop.
Deliberately built to demonstrate securing AI/MCP access with Cloudflare Access,
Gateway, and AI Gateway - not to be a real HRIS.

Branded as **WorkWeek** by default (configurable from `/admin`).

## Architecture

Three independently-deployed Cloudflare Workers, sharing one D1 database:

```
hr-app/
├── shared/    types + seed-data generator (30 employees, derived from @faker-js/faker)
├── api/       Hono REST API, owns the D1 database (hr-app-db)
├── mcp/       Standalone OAuth 2.1 MCP server (agents/mcp + @cloudflare/workers-oauth-provider),
│              delegates end-user login to Cloudflare Access (Access for SaaS OIDC upstream)
└── web/       React + Vite SPA on Workers Static Assets - the end-user dashboard + /admin
```

- **`api`** exposes `/api/v1/*` (bearer-token protected) plus internal-only
  routes (`/admin/*`, `/internal/*`) reachable only via service binding from
  `web` and `mcp` - never given a public route.
- **`mcp`** is its own OAuth 2.1 authorization server (portable to any MCP
  client/harness), delegating actual login to Cloudflare Access as its upstream
  OIDC provider. Once a user authorizes, `mcp` mints them a per-user `api`
  bearer token and calls `api` on their behalf, row-capped and with no
  bulk-export tool - intentionally minimal guardrails, since the workshop's
  point is to add Access/Gateway/AI Gateway policy on top.
- **`web`** sits entirely behind Cloudflare Access. It resolves "me" from the
  `Cf-Access-Authenticated-User-Email` header (falling back to a demo employee
  locally), and proxies data calls to `api` using a per-user token it mints via
  the same internal token-issuance endpoint `mcp` uses.

See `/Users/simon/.devin/plans/plan-476e21321c10805a.md` for the original design
notes, and `../flareid-idp/README.md` for the shared identity provider this
workshop uses to back Cloudflare Access.

## Data model

`departments`, `employees` (with a manager hierarchy), `compensation_history`,
`time_off_balances` / `time_off_requests`, `performance_reviews`,
`benefits_enrollments`, `api_tokens` (per-user, hashed), `app_settings`
(branding). 30 employees are seeded deterministically (5 departments, a CEO,
5 department heads, 24 ICs).

## Local development

Install once from the repo root:

```bash
npm install
```

### 1. Generate and apply the D1 seed

From the `hr-app/` root:

```bash
npm run seed:generate                          # writes api/migrations/0002_seed.sql
cd api && npx wrangler d1 migrations apply hr-app-db --local
```

### 2. Set local secrets

Each Worker reads a `.dev.vars` file (gitignored) for local secrets:

**`api/.dev.vars`**
```
ADMIN_INTERNAL_SECRET=<any string>
MCP_INTERNAL_SECRET=<any string>
WEB_INTERNAL_SECRET=<any string>
```

**`mcp/.dev.vars`**
```
MCP_INTERNAL_SECRET=<same value as api's>
COOKIE_ENCRYPTION_KEY=<any random string>
ACCESS_CLIENT_ID=<placeholder until you wire up Access - see below>
ACCESS_CLIENT_SECRET=<placeholder>
```

**`web/.dev.vars`**
```
ADMIN_INTERNAL_SECRET=<same value as api's>
WEB_INTERNAL_SECRET=<same value as api's>
```

### 3. Run all three

Run each from the `hr-app/` root in separate terminals:

```bash
npm run dev:api    # or: cd api && npx wrangler dev --port 18787
npm run dev:mcp    # or: cd mcp && npx wrangler dev --port 18788
npm run dev:web    # or: cd web && npx vite dev --port 5173
```

`web`'s `wrangler.jsonc` declares a service binding to `api` (`hr-app-api`), and
`mcp` calls `api` over plain HTTP via `API_BASE_URL` - both resolve to whichever
`api` instance is running locally on port 18787 during dev.

Visit `http://localhost:5173` for the dashboard, `http://localhost:5173/admin`
for the admin page (token management, branding, employee identity mapping).

## Deploying

Deploy order matters (`mcp` and `web` both depend on `api`):

```bash
npm run deploy:api    # or: cd api && npx wrangler deploy
npm run deploy:mcp    # or: cd mcp && npx wrangler deploy
npm run deploy:web    # or: cd web && npx vite build && npx wrangler deploy
# or all three in order:
npm run deploy:all
```

Then set production secrets (`wrangler secret put ...`) for each Worker as
documented in that Worker's `wrangler.jsonc` comments:

- `api`: `ADMIN_INTERNAL_SECRET`, `MCP_INTERNAL_SECRET`, `WEB_INTERNAL_SECRET`
- `mcp`: `ACCESS_CLIENT_ID`, `ACCESS_CLIENT_SECRET`, `COOKIE_ENCRYPTION_KEY`,
  `MCP_INTERNAL_SECRET`
- `web`: `ADMIN_INTERNAL_SECRET`, `WEB_INTERNAL_SECRET`

Update `mcp/wrangler.jsonc`'s `vars.API_BASE_URL` and `vars.ACCESS_*` URLs, and
`web/wrangler.jsonc`'s `services` binding, to point at the deployed `api`
Worker's URL/name.

## Wiring up Cloudflare Access

### Identity provider

Use [`flareid-idp`](../flareid-idp) (this repo's own OIDC identity provider) as
Access's Generic OIDC login method - see its README for exact setup steps.
Because FlareID's seeded users share the same emails as this app's seeded
employees, signing in through Access resolves to the matching HR employee with
no extra configuration.

### `web` app

1. Create a Cloudflare Access **self-hosted application** for the `web`
   Worker's hostname, with a permissive policy (e.g. "allow all authenticated
   users" or your workshop attendee group).
2. Add a **second, stricter** Access application/policy scoped to the same
   hostname's `/admin*` path (e.g. only you / workshop facilitators) - this is
   what actually protects `/admin`, not app code.

### `mcp` server (Access for SaaS OIDC upstream)

`mcp` is its own OAuth server that delegates login to Access, matching
Cloudflare's `remote-mcp-cf-access` pattern:

1. In Cloudflare Zero Trust, create an **Access for SaaS** application, type
   **OIDC**.
2. Authorization callback URL: `https://<mcp-worker-domain>/callback` (and
   `http://localhost:8788/callback` for local dev).
3. Copy the Client ID/Secret and the Authorization/Token/JWKS URLs into `mcp`'s
   `ACCESS_CLIENT_ID` / `ACCESS_CLIENT_SECRET` secrets and
   `ACCESS_AUTHORIZATION_URL` / `ACCESS_TOKEN_URL` / `ACCESS_JWKS_URL` vars.
4. Point an MCP client (Claude, `mcp-remote`, an MCP inspector, or an
   AI Gateway-fronted agent) at `https://<mcp-worker-domain>/mcp` - it will
   redirect through `mcp`'s own approval screen, then to Access/FlareID to sign
   in, then back with a scoped MCP session tied to that person's identity.

## Guardrails

- `api`'s public REST endpoints require a per-user bearer token (SHA-256 hashed
  in D1, never stored in plaintext) - minted individually for each MCP OAuth
  grant and each web dashboard session, independently revocable from `/admin`.
- `mcp`'s tools hard-cap result sizes (25 rows/page) and there is deliberately
  no bulk "export everything" tool.
- Everything else (rate limiting, DLP, prompt-injection defenses, per-scope
  field redaction) is intentionally left for the workshop to configure via
  Cloudflare Access, Gateway, and AI Gateway on top of this app - that's the
  point of the exercise.

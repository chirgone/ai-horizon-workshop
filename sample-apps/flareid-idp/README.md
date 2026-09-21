# FlareID

A small, standalone OpenID Connect identity provider built on Cloudflare Workers
+ D1, for the AI Horizon workshop. The name is a nod to Okta / Ping / (Microsoft)
Entra - the real-world IdPs this stands in for when a customer can't provision one
for a workshop.

FlareID is the single shared identity source for every demo app in this repo
(`hr-app`, `crm-app`, `collab-app`). Register it in Cloudflare Access as a
**Generic OIDC** identity provider, and every workshop app that sits behind
Access will resolve to the same 30 seeded users.

## What it does

- Username (User Principal Name, i.e. an email address) + password login
- Optional per-user TOTP MFA (Google Authenticator, Authy, 1Password, etc.)
- Standard OIDC: `/authorize`, `/token`, `/userinfo`, `/jwks.json`,
  `/.well-known/openid-configuration` - works with Cloudflare Access's Generic
  OIDC integration, or any other standards-compliant OIDC relying party
- Flat groups (no nesting) - `groups` claim in the `id_token` and `/userinfo`
- Admin UX (`/admin`) to manage users, groups, and registered OIDC clients
- Self-service `/account` page for MFA enrollment

It intentionally does **not** implement SAML - see the architecture note below.

## Architecture

| Piece | Where |
|---|---|
| Users, groups, group membership | D1 table `users` / `groups` / `group_members` |
| Registered OIDC clients (relying parties) | D1 table `oauth_clients` |
| Authorization codes / access tokens / refresh tokens | D1 tables `auth_codes` / `access_tokens` / `refresh_tokens` |
| Short-lived login-flow + pending-MFA state | KV (`SESSIONS_KV`) |
| `id_token` signing | RS256, `jose`, key pair generated once via `scripts/generate-keypair.mjs` |
| Password hashing | PBKDF2-SHA256 via Web Crypto (no external dependency) |
| TOTP | Hand-rolled RFC 6238 (HMAC-SHA1, 6 digits, 30s step) - standard authenticator app compatible |

Everything is one Hono Worker (`src/index.ts`), server-rendering plain HTML for
login/MFA/admin pages (no build step, no client-side framework).

### Why OIDC and not SAML

SAML needs XML canonicalization and XML-DSig signing, which is painful and
fragile outside a Node/browser DOM environment. OIDC is just OAuth 2.1 + JSON +
JWTs, which maps cleanly onto Workers using `jose`. Cloudflare Access has
first-class "Generic OIDC" support, so this is also the path of least friction
for the workshop's IdP integration.

## Local development

```bash
npm install
npm run keygen                      # only needed once, or to rotate the signing key
npm run db:migrations:local
npm run seed:generate               # requires hr-app's seed to already be generated
npm run db:migrations:local         # re-run to apply the generated 0002_seed.sql
npm run dev                         # wrangler dev, defaults to http://localhost:8790
```

Default password for every seeded user: **`Savetheinternet!1`** (demo only - a real
deployment should force a reset on first login). The dedicated `admin@<domain>`
account (a member of the "Super Admins" group) is the one seeded admin, so you
can sign in with it and reach `/admin` immediately. Until initial setup is
completed at `/admin/setup`, only Super Admins can log in at all.

`.dev.vars` (gitignored) needs:

```
COOKIE_ENCRYPTION_KEY=<any random string>
SIGNING_KEY_PKCS8="<private key PEM from npm run keygen>"
```

## Registering a client (e.g. Cloudflare Access)

1. Sign in to FlareID as an admin (`/admin`) → **OIDC Clients** → **+ New client**.
2. Give it a name (e.g. "Cloudflare Access") and the redirect URI Access will
   use for its OIDC callback (see below) - one per line if there's more than one
   environment.
3. Copy the **Client ID** and **Client secret** shown once at creation time.

## Wiring into Cloudflare Access (Generic OIDC)

1. In [Cloudflare Zero Trust](https://one.dash.cloudflare.com) → **Settings** →
   **Authentication** → **Login methods** → **Add new** → **OpenID Connect**.
2. Fill in:
   - **App ID (Client ID)**: from the FlareID client you registered
   - **Client secret**: from the same
   - **Auth URL**: `https://<flareid-worker-domain>/authorize`
   - **Token URL**: `https://<flareid-worker-domain>/token`
   - **Certificate URL**: `https://<flareid-worker-domain>/jwks.json`
   - **Scopes**: `openid email profile groups`
3. Cloudflare will show you the **redirect URI** it will call back to (something
   like `https://<your-team>.cloudflareaccess.com/cdn-cgi/access/callback`) -
   copy that into the FlareID client's redirect URIs and save.
4. Save the identity provider, then add it to your Access application(s)
   (`hr-app`, `crm-app`, `collab-app`, and their `/admin` policies).
5. Test: visiting an Access-protected app should redirect to FlareID's login
   page, and after signing in (and completing MFA if enrolled), land back on the
   app authenticated as that user - with `email` and `groups` available to
   Access policies.

Because `hr-app`'s 30 seeded employees and FlareID's 30 seeded users share the
same emails (FlareID's seed script derives directly from `hr-app`'s seed data),
signing in through Access with any seeded UPN resolves to the matching HR
employee out of the box - no manual identity mapping needed for the happy path.
Use `hr-app`'s `/admin` → Identity mapping if you want to point a seeded
employee at a *different* email (e.g. your own real account).

## Admin UX

- **Users**: create/search users, toggle admin/active status, manage group
  membership, reset password (shown once) or reset MFA enrollment.
- **Groups**: flat groups with a name/description and a member checklist -
  no nested groups.
- **OIDC Clients**: register relying parties, rotate their client secret.

## Deploying

```bash
npm run keygen                                  # if not already done
wrangler secret put SIGNING_KEY_PKCS8           # paste the private key PEM
wrangler secret put COOKIE_ENCRYPTION_KEY       # any random string
npm run db:migrations:remote
wrangler deploy
```

After deploying, update `wrangler.jsonc`'s `vars.ISSUER_URL` to the deployed
Worker's URL (workers.dev or custom domain) **before** registering it with
Cloudflare Access - the issuer must exactly match what's in every `id_token`.

### Note on `workers.dev` + Zero Trust

Some accounts (this workshop's included) have Cloudflare Access/Gateway
protection enabled for all `*.workers.dev` subdomains, which blocks
unauthenticated requests with `error code: 1050` - a problem for an IdP that
needs to be reachable by browsers and RPs that aren't authenticated yet. If you
hit this, either:

- Add a Cloudflare Access **bypass policy** scoped to this Worker's
  `workers.dev` hostname, or
- Attach a **custom domain** to the Worker (Workers & Pages → the Worker →
  Settings → Domains & Routes → Add Custom Domain) and use that as
  `ISSUER_URL` instead.

This deployment uses the latter: `https://horizon-idp.cloudflaredemos.com`.

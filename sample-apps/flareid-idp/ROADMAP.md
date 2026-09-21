# FlareID Roadmap

FlareID is currently a **demo-grade** identity provider built for the AI Horizon
workshop - functional OIDC, password + TOTP auth, groups, SCIM push, and an
admin UX, but intentionally missing several things a production IdP needs.
This tracks what's required before calling it "V1" (safe to point real,
non-demo traffic at).

## Done (demo-grade, functional today)

- OIDC 2.1: `/authorize`, `/token` (authorization_code + refresh_token, PKCE),
  `/userinfo`, `/jwks.json`, `/.well-known/openid-configuration`
- Password (PBKDF2) + optional per-user TOTP MFA
- Flat groups, OIDC client registration, multi-domain UPNs
- SCIM 2.0 client push (users + groups) to an external SCIM server, scoped to
  "all groups" or a specific set
- Admin UX: users, groups, clients, domains, settings, audit log
- Self-service account page: MFA enrollment, password change
- Audit logging of security-relevant admin/auth actions
- Basic login rate limiting / lockout
- MFA backup/recovery codes
- Signing key rotation with an overlap window (old + new key both published)
- Token introspection (`/introspect`) and revocation (`/revoke`) endpoints
- Server-tracked sessions: view/revoke active sessions and connected apps
  (both self-service and admin-managed)
- Audit log captures requesting IP + User-Agent

## V1 release requirements (not yet built)

These are the gaps identified in review that should be closed before treating
FlareID as more than a workshop demo:

1. **Self-service password recovery ("forgot password")** - requires outbound
   email (Cloudflare Email Routing/sending). No email capability exists today,
   so the only recovery path is an admin-initiated reset.
2. **RP-initiated logout** (`end_session_endpoint`) - let a relying party (e.g.
   Cloudflare Access) tell FlareID to end the IdP session too, not just its own.
3. **Consent screen** - show the user what scopes/claims a client is
   requesting before completing authorization, at least for non-trusted
   clients (first-party/admin-marked-trusted clients could skip it).
4. **Public/native OAuth clients** - support PKCE-only clients with no
   `client_secret`, for SPAs and mobile/native apps.
5. **Bulk user import** - CSV import or SCIM *pull*, so onboarding an existing
   directory doesn't mean creating users one at a time.
6. **Invitation flow** - email-based invite/activation instead of an admin
   manually generating and relaying a temporary password (depends on #1's
   email capability).
7. **Self-service profile editing** - let users update their own display name
   (and similar low-risk profile fields) from `/account`.
8. **SAML 2.0 support** - a second protocol alongside OIDC, for relying
   parties that only speak SAML. Meaningfully more effort than OIDC (XML
   signing/canonicalization); see the architecture note below.
9. **SCIM pull from hr-app** - hr-app should own identity for its employees and
   push changes to FlareID via SCIM (hire/fire/attribute changes flow
   HR -> IdP automatically), instead of FlareID being seeded once from a
   point-in-time export of hr-app's data. Requires hr-app to expose a SCIM 2.0
   server and FlareID to consume it (the reverse of the SCIM *push* FlareID
   already does today toward Cloudflare Access).

## V2 ideas (further out, not yet scoped)

- **User-defined schema** - let an admin define custom user attributes (name,
  type, whether it's required/shown on forms/exposed as a claim) and have the
  database schema, admin UX forms, and OIDC/SCIM attribute mapping update
  automatically, instead of every new HR-style attribute needing a manual
  migration + form + claims wiring (as job_title/department/manager/etc. did).
- **Per-client claim/attribute filtering** - see the discussion below; right
  now every OIDC client gets the full claim set regardless of what it
  actually needs.

## Explicitly out of scope (deliberate, not oversights)

- **Self-service signup** - admin-only user provisioning is intentional.
- **Nested groups** - flat groups only. See discussion below.
- **WebAuthn/passkeys** - TOTP is the MFA baseline for now; passkeys are a
  reasonable post-V1 addition but not required to call this "basic but real."

## Notes on specific items

### SAML 2.0

SAML needs XML canonicalization (C14N) and XML-DSig signing/verification,
which have poor native support in the Workers runtime (no DOM, limited XML
tooling) compared to OIDC's JSON/JWT model. Realistic options when we pick
this up:
- A pure-JS XML-DSig library that works in Workers (needs vetting for
  Workers-runtime compatibility, not just Node).
- Scope SAML down to SP-initiated SSO only (skip IdP-initiated, artifact
  binding, encrypted assertions) to keep the surface area small for a first
  pass.

### Per-client claim/attribute filtering

Today, `buildClaims()` in `src/lib/jwt.ts` returns the *same* full claim set
(email/name/groups/job_title/department/manager/amr, mirrored under `custom`)
to every OIDC client, regardless of what that client actually needs. That's a
real data-minimization gap: a client that only needs to check group
membership still receives job title, department, and manager. It's not a problem today because Cloudflare Access is the only real client
and legitimately wants most of this, but it doesn't scale well as more
clients get registered.

This is worth building - the standard shape is a per-client allowlist of
which top-level claims to include (stored on `oauth_clients`, editable from
the client's admin page), applied in `buildClaims()`/`signIdToken()` and in
`/userinfo` before the response is built. Flagging as a candidate for V1
(it's a real security/privacy property, not just a nice-to-have) rather than
deferring to V2 - open to prioritizing it sooner if needed.

### Nested groups

Flat groups are staying flat by design - see the discussion in-session: the
practical benefit of nesting is small (anything you'd nest for is just as
clear as two flat memberships), the implementation cost is real (recursive
expansion, cycle detection, performance), and SCIM consumers like Cloudflare
Access expect flat, resolved membership anyway - nesting on our side wouldn't
survive the trip to Access. If a concrete need ever emerges, prefer a capped,
non-recursive "group of groups" (one level, cycle-checked, expanded to a flat
set at read/SCIM-push time) over true recursive hierarchy.

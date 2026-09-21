# Sprint 4: Corporate Test Connectors

Date: 2026-09-21

## Outcome

- Added a customer-facing catalog for Pipeline CRM, WorkWeek HR, Relay Collaboration, Nexus Wiki, and FlareID Identity.
- Added connector detail routes covering evidence, protocol, scope, ownership, allowed capabilities, and excluded operations.
- Linked optional Corporate Test Connectors to every Blueprint and generated Workspace record with an explicit workshop purpose.
- Added local connection preflight for exact HTTPS origins, expected paths, empty credentials, standard ports, read-only scopes, and harmless first actions.
- Kept preflight local. It does not contact a server, verify a live identity, start OAuth, or store credentials.

## Routes

- `/connectors`
- `/connectors/:slug`

## Read-only enforcement

- Removed `log_deal_activity` from the Pipeline MCP registration.
- Removed `mark_email_read` and `respond_to_meeting` from the Relay MCP registration.
- Removed `create_page` and `update_page` from the Nexus MCP registration.
- Confirmed no registered MCP tool performs `POST`, `PATCH`, `PUT`, or `DELETE`.
- Added explicit `truncated` and `limit` metadata to capped collection responses.

## HR data boundary

- Employee list and direct-report queries project directory-safe fields and return `home_address` as null.
- MCP responses remove `home_address` again before returning employee data.
- Removed time-off balances from the WorkWeek MCP contract.
- Added self-or-management-chain authorization to the underlying time-off API route.

## Catalog contract

- The canonical workshop contract is recorded in `mcp/README.md`.
- The front-end connector data contains no internal repository path or credential.
- Cloudflare evidence sources remain required by each Blueprint.
- Corporate Test Connectors are labeled optional and supplement, rather than replace, Cloudflare evidence.

## Installation invariant

- `src/installation.js` was not modified.
- The serialized Installation object matches Sprint 3 exactly.
- Installation keeps its original URLs, steps, order, troubleshooting, and hosted flow.

## Validation

- `npm run build` completed successfully with Vite 6.4.3.
- Five exact-origin, read-only connector definitions passed structural validation.
- Every connector mapping resolves for all three Blueprints.
- Connector catalog and WorkWeek detail deep links returned HTTP 200 locally.
- Static review found no registered write method or uncapped collection without truncation metadata.
- Changed TypeScript files passed static esbuild review.
- Full MCP `tsc --noEmit` could not run because `npm ci` was blocked by corporate npm TLS validation (`UNABLE_TO_GET_ISSUER_CERT_LOCALLY`). TLS validation was not disabled.
- `git diff --check` completed successfully.
- No deployment command was executed.

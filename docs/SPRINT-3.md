# Sprint 3: Blueprint Catalog

Date: 2026-09-21

## Outcome

- Replaced the Blueprint preview hub with a searchable, filterable catalog.
- Added complete definitions for Cloudflare Account Audit, Attack Surface and Risk, and AI Governance Readiness.
- Added a dedicated detail route for each Blueprint with its decision, required inputs, read-only MCP plan, evidence requirements, PDF structure, and guardrails.
- Connected every Blueprint to a governed Workspace charter flow.
- Added browser-local Workspace records, a complete Workspace library, and the three newest records in `Recent workspaces`.
- Linked each Workspace to common setup guidance and a Blueprint-specific execution path.

## Routes

- `/blueprints`
- `/blueprints/:slug`
- `/workspaces/new?blueprint=:slug`
- `/workspaces/:workspaceId`

## Storage model

- Workspace records use the `ai-horizon-workshop-v3-workspaces` local storage key.
- Records contain only the Workspace name, owner, audience, Blueprint identifier, status, and creation time.
- Stored records are schema-checked before rendering.
- Writes merge against the latest stored records and open tabs synchronize through the browser storage event.
- Storage failures remain on the form and display an actionable error.
- Creating a record does not authorize MCP access, connect a system, execute a Blueprint, or change a Cloudflare account.

## Security boundary

- Every connection is labeled as read-only.
- Each Blueprint documents explicit evidence and guardrail requirements.
- Write access, active scanning, prompt-content collection, and final risk acceptance remain outside automatic execution.

## Installation invariant

- `src/installation.js` was not modified.
- The serialized Installation object matches Sprint 2 exactly.
- Installation remains the first Workspace with its original URLs, steps, ordering, troubleshooting, and hosted flow.

## Validation

- `npm run build` completed successfully with Vite 6.4.3.
- All three Blueprint definitions passed required-field validation.
- Blueprint catalog, Blueprint detail, and Workspace creation deep links returned HTTP 200 locally.
- The generated bundle contains all three Blueprint titles and no `Coming soon`, `AI Horizon School`, or prohibited Favorites helper text.
- Responsive layouts collapse Blueprint and Workspace detail grids before the persistent sidebar constrains them.
- `git diff --check` completed successfully.
- No deployment command was executed.

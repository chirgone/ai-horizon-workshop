# Sprint 2: Workshop Content

Date: 2026-09-21

## Outcome

- Replaced the exported learning path with a customer-facing MCP Blueprint Workshop journey.
- Established a single English content path from workspace setup through remediation planning.
- Added eight post-installation Workspaces: setup, corporate system connections, Blueprint selection, evidence collection, PDF generation, security review, remediation roadmap, and Super Skills.
- Added five Blueprint practices covering governance, MCP connections, account audit, executive PDF production, and roadmap approval.
- Added six Explore resources covering workshop orientation, MCP sources, Blueprint selection, report quality, security guardrails, and advanced deployment.
- Removed the visible language selector, certificate route, and completion-certificate journey.
- Removed the legacy catalog from the active tree; its Sprint 1 version remains available in Git history.

## Product narrative

- Cloudflare OS is the door.
- AI is the hook.
- MCP Blueprints are the operating model.
- PDF reports are the outcome.
- Security is the destination.

## Installation invariant

- The exported Installation object is byte-for-byte equivalent when serialized to the Sprint 1 version.
- Installation remains the first Workspace and keeps its URLs, steps, order, troubleshooting, and hosted deployment flow.
- Only the presentation-layer product name renders as `Cloudflare OS`.

## Validation

- `npm run build` completed successfully with Vite 6.4.3.
- The customer JavaScript bundle decreased from 495 KB to 288 KB after isolating legacy content.
- The customer bundle contains no `AI Horizon School` string.
- Sixteen primary and deep-link routes returned HTTP 200 locally.
- Desktop rendering was reviewed for Home and Evidence Collection.
- Responsive rendering was reviewed for PDF Report generation.
- `git diff --check` completed successfully.
- No deployment command was executed.

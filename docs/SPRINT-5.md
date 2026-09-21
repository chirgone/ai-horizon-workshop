# Sprint 5: PDF Report Outputs

Date: 2026-09-21

## Outcome

- Replaced the Outputs preview with a catalog of three Blueprint-specific report templates.
- Added complete section schemas for the Security Posture Brief, Attack Surface Review, and AI Governance Assessment.
- Added a report composer connected to governed Workspace records.
- Added support for one to five structured findings with severity, rationale, source, retrieval time, affected scope, observed fact, confidence, action, owner, and target horizon.
- Added a branded, responsive, print-ready report view with explicit draft status and visible release gates.
- Added browser print support for saving the draft as PDF.

## Routes

- `/outputs`
- `/outputs/templates/:slug`
- `/outputs/new`
- `/outputs/:reportId`

## Evidence integrity

- Every report must belong to an existing Workspace with the same Blueprint.
- Template section keys and field lengths are validated during hydration.
- Severity, confidence, and horizon values use closed enums.
- Report status, audience, and Workspace owner are derived by the application rather than trusted from stored report input.
- Switching Workspaces discards the current evidence only after confirmation and resets every report field.
- Every release gate remains visible as input-complete or pending until human review.

## Privacy and retention

- Customer report evidence uses browser `sessionStorage`, not persistent local storage.
- Drafts remain available only in the current browser tab session.
- Users can delete an individual draft or clear all session drafts.
- The UI instructs shared-device users to print, delete, and close the tab.
- React renders all supplied content as escaped text.

## PDF behavior

- `Print / Save as PDF` uses the browser print dialog and does not upload report data.
- Print CSS removes application navigation, preserves branded backgrounds, and allows long sections to flow across pages.
- Printing does not approve evidence, close release gates, or change draft status.

## Installation invariant

- `src/installation.js` was not modified.
- The serialized Installation object matches Sprint 4 exactly.
- Installation keeps its original URLs, steps, order, troubleshooting, and hosted flow.

## Validation

- `npm run build` completed successfully with Vite 6.4.3.
- All three report schemas passed section, prompt, findings-section, and release-gate validation.
- Outputs catalog and Account Audit template deep links returned HTTP 200 locally.
- Desktop, intermediate, mobile, and print layouts have dedicated responsive rules.
- Security review found no remaining high or medium findings.
- `git diff --check` completed successfully.
- No deployment command was executed.

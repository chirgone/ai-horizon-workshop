# Cloudflare OS Report Templates

Sprint 5 defines three customer-facing, PDF-ready report templates:

- Security posture brief, produced by the Cloudflare Account Audit Blueprint.
- Attack surface review, produced by the Attack Surface and Risk Blueprint.
- AI governance assessment, produced by the AI Governance Readiness Blueprint.

## Required finding contract

Every finding must include:

- Title and severity.
- Severity rationale.
- Evidence source, retrieval time, affected scope, observed fact, and confidence.
- Accountable owner.
- Recommended action.
- Target horizon.

## Release gates

- Every material claim has cited evidence.
- Security owners review severity.
- Owners and horizons are explicit.
- Assumptions and evidence gaps are visible.
- The sharing audience is approved.

Cloudflare OS creates a draft marked `Draft, review required`. Each Blueprint renders its own complete section structure and supports up to five structured findings. Browser print provides the PDF-ready artifact. Printing does not approve the report, validate its evidence, or change the release status.

## Privacy and retention

- Draft report evidence uses browser `sessionStorage`, not persistent local storage.
- Drafts remain available only in the current browser tab session.
- Users can delete one report or clear every session draft.
- Shared-device users should print the required PDF, delete the draft, and close the tab.

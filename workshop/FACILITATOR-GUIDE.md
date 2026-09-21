# Cloudflare OS Workshop Facilitator Guide

## Release gate

Run this command before every workshop:

```bash
cd site/ai-horizon-front
npm ci
npm run check
```

Do not run `npm run deploy` without Ivan Anguiano's explicit approval.

## Before the room opens

- Use a current Chromium, Firefox, or Safari browser.
- Open the workshop in a dedicated browser profile.
- Select `Reset workshop data` and confirm the Home page has no prior customer records.
- Use synthetic Workspace names and role-based owners. Never enter real customer identifiers, credentials, tokens, or prohibited data.
- Confirm the hosted Installation path and required Cloudflare account permissions with the customer.
- Confirm the selected Blueprint, decision owner, evidence boundary, and report audience.
- Authorize only the minimum read-only MCP sources required by the Blueprint.

## Recommended 60-minute flow

1. **5 minutes:** Explain the operating model: Cloudflare OS, MCP Blueprints, Super Skills, PDF outcome, and human release gates.
2. **10 minutes:** Select one Blueprint and create a governed Workspace with synthetic labels.
3. **10 minutes:** Review required Cloudflare sources and optional Corporate Test Connectors. Run only harmless identity or metadata validation.
4. **15 minutes:** Walk through the five Super Skills. Keep evidence, inference, contradictions, and missing data separate.
5. **15 minutes:** Create the PDF-ready report draft, inspect citations and remediation ownership, then run the quality gate.
6. **5 minutes:** Print or save the approved workshop artifact, delete the draft, and reset workshop data.

## Blueprint acceptance checks

### Cloudflare Account Audit Report

- Account and zone scope is explicit.
- Material findings cite account evidence.
- Administrative changes include actor attribution where available.
- Every remediation has an owner and 30/60/90-day horizon.

### Attack Surface and Risk Report

- Discovery remains passive and inside the approved boundary.
- Reachable assets have validated business owners.
- Risk paths separate observed exposure from inferred impact.
- Reduction actions prioritize reachable risk and verified controls.

### AI Governance Readiness Report

- Prompt content is excluded unless separately approved.
- Observed AI usage is separated from visibility gaps.
- Security, legal, and data governance ownership remains explicit.
- Adoption recommendations preserve unresolved policy decisions.

## Human gates

- Source owner confirms material evidence records.
- Security owner challenges severity and records unresolved decisions.
- Executive sponsor confirms decision framing and customer-safe language.
- Action owners confirm ownership, dependencies, and target horizon.
- Named reviewer closes blocking quality gates and authorizes distribution.

Cloudflare OS prepares draft outputs. It never closes these gates, accepts risk, changes an account, or distributes a report.

## Responsive and accessibility UAT

- Desktop: validate at 1440 CSS pixels or wider.
- Intermediate: validate at 921 to 1200 CSS pixels.
- Mobile: validate at 390 CSS pixels and at 200 percent zoom.
- Navigate every primary route using keyboard only.
- Open and close the mobile menu with the toggle, backdrop, Escape, and a navigation link.
- Confirm route changes move focus to the page heading and update the browser title.
- Confirm the skip link reaches main content.
- Confirm filters and mobile controls retain a minimum 44-pixel touch target.
- Confirm reduced-motion mode removes nonessential movement.
- Print every report template to A4 and confirm headings, findings, evidence, and remediation tables do not split incorrectly.

## Data lifecycle

- Workspace records remain browser-local and expire after 24 hours.
- Report evidence remains in the current tab session and may survive reload or browser session restoration.
- In-progress report composition is autosaved in the same tab session and resumes when the report composer is reopened.
- The final quality-audit state is scoped to the exact report draft.
- `Delete Workspace` removes that Workspace, its session reports, and its workflow checklist.
- `Reset workshop data` removes all AI Horizon Workspaces, reports, workflows, progress, and settings from the browser without touching unrelated site data.
- Always reset after a workshop on a shared device.

## Incident response

- If storage is blocked, stop entering evidence and use a dedicated browser profile.
- If a connector requests write access, cancel authorization and record the scope mismatch.
- If evidence contradicts the draft, reopen the workflow at the earliest affected Skill.
- If a report contains unintended data, delete the draft, reset workshop data, and do not distribute the PDF.
- If a release gate is pending, keep the report marked draft and do not share it.

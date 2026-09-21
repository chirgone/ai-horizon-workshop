# Sprint 8: Release Preflight

Date: 2026-09-21

## Release status

**Deployment is blocked pending explicit approval from Ivan Anguiano.**

The automated Chrome preflight, Firefox UAT, and Cloudflare Access checks passed. Chrome and Firefox are the supported workshop browsers. Safari is advisory and does not block release. No deploy command was executed.

## Reproducible command

```bash
cd site/ai-horizon-front
npm run release:gate
```

The command performs the non-deploying release gate, starts the production build locally, drives Google Chrome through the Chrome DevTools Protocol, creates synthetic Workspace and report records, and writes temporary review artifacts outside the repository.

Set `CHROME_PATH` when Google Chrome is not installed at the default macOS application path.

The release gate always runs the required Chrome and Firefox suites. Firefox 156 and `geckodriver` 0.37.1 were used for this release; install them with `brew install --cask firefox` and `brew install geckodriver`, or set `GECKODRIVER_PATH` when the driver is not available on `PATH`. Set `UAT_BROWSERS=safari` with `npm run uat:cross-browser` for a separate optional Safari pass; it cannot replace Firefox in `release:gate`.

## Automated results

- Google Chrome 150 completed the preflight successfully.
- 40 customer and redirect cases passed at desktop, intermediate, and mobile viewports.
- Total route and viewport combinations: 120.
- Route checks include every Blueprint, connector, Skill, report template, synthetic Workspace and report details, creation flows, and representative legacy workshop content.
- Every route preserved its expected pathname and unique H1 instead of silently redirecting to another valid page.
- Workspace and report creation routes preserved their query selection and loaded the intended record.
- Unknown application, Blueprint, Workspace, and report routes reached their intended safe fallback.
- Every combination exposed an H1 and accessibility-tree heading.
- No tested route had horizontal overflow.
- No tested route exposed unnamed interactive controls in the accessibility tree.
- Every tested route exposed the skip link.
- Mobile navigation moved focus into the drawer, closed with Escape, and restored focus to the toggle.
- No browser runtime or console errors were recorded.
- The 16 native release tests, canonical Skill validation, and production build passed before browser UAT.

## PDF results

- Generated one synthetic A4 PDF for each Blueprint.
- Cloudflare Account Audit Report: four pages.
- Attack Surface and Risk Report: four pages.
- AI Governance Readiness Report: four pages.
- All PDFs contained a branded cover, decision section, evidence-backed finding, remediation ownership, assumptions, release gates, and draft disclaimer.
- Visual inspection found and fixed two print defects: the skip link was visible and `PENDING` wrapped inside release gates.
- The final PDFs for all three Blueprints passed visual inspection after the fixes.
- The preflight now blocks if either defect returns.
- The preflight verifies that each PDF preserves the reviewed four-page layout.
- No live customer data or systems were used.

The automated page-count check targets Chromium's generated PDF structure. Visual inspection remains authoritative, and maximum-length five-finding reports remain a separate stress-test gap.

## Cloudflare Access

- Validation type: manual external request check on 2026-09-21.
- An unauthenticated request to `https://ai-horizon.cf1demos.com/` returned `302` to the Cloudflare Access login flow.
- The protected-resource challenge was present.
- An authorized corporate session reached the application with `200`.
- The current hostname still serves the pre-Sprint-8 application and headers, as expected before deployment.
- New Worker security headers must be verified again after an approved deploy.

## Browser matrix

| Browser | Status | Evidence |
| --- | --- | --- |
| Google Chrome 150 | Passed | Automated routes, responsive, accessibility, mobile keyboard, and PDF preflight |
| Firefox 156 | Passed | 24 critical route and viewport cases, named controls, responsive layout, mobile keyboard flow, and visual screenshot |
| Safari 26.5 | Advisory only | Not a supported workshop browser and not required for go-live |

## Installation invariant

- `src/installation.js` was not modified.
- `src/workshop-content.js` was not modified.
- The serialized Installation SHA-256 test remains green.
- The existing hosted URLs, steps, order, troubleshooting, and behavior remain unchanged.

## Approval gate

Before deployment approval:

- Run `npm run release:gate` for the required Chrome and Firefox gates.
- Revalidate Cloudflare Access manually because the local command does not test the external policy.
- Confirm the three generated PDFs remain acceptable.
- Obtain Ivan Anguiano's explicit approval to run the deployment command.

After an approved deployment:

- Verify Home, Blueprints, Workspaces, Skills, Outputs, and Installation on the production hostname.
- Verify Access still challenges an unauthenticated request.
- Verify CSP, Permissions Policy, Referrer Policy, MIME sniffing, frame protection, and HTML cache-control headers.
- Run one synthetic report generation and PDF save.
- If a blocking check fails, stop and roll back before customer use.

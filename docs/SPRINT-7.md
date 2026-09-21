# Sprint 7: Preproduction Release Gates

Date: 2026-09-21

## Outcome

- Added a non-deploying release gate with contract, route, storage, workflow, Installation, and Worker tests.
- Added a complete facilitator-safe reset that removes only AI Horizon browser data.
- Added individual Workspace deletion with report and workflow cleanup.
- Added a 24-hour lifecycle for browser-local Workspace records and physical cleanup after expiration.
- Corrected report retention language to account for browser session restoration.
- Added session-scoped report composer autosave so internal navigation or reload does not discard in-progress evidence.
- Added baseline production security headers at the Worker boundary.
- Hardened mobile navigation, route focus, page titles, touch targets, contrast, reduced motion, and print pagination.
- Added a facilitator guide covering preflight, delivery, human gates, UAT, data lifecycle, and incident response.

## Release command

```bash
cd site/ai-horizon-front
npm run check
```

The command runs:

1. Canonical Super Skill contract validation.
2. Native Node test suite.
3. Production Vite build.

It never invokes Wrangler or deploys the Worker.

## Automated coverage

- All three Blueprint identities and dependency relationships.
- All five Skills in canonical order for every Blueprint.
- Read-only connector scopes, HTTPS origins, and blocked-tool separation.
- Report sections, prompts, findings sections, quality gates, and closed enums.
- SHA-256 invariant for the serialized Installation lesson.
- Complete application route contract and accessibility wiring.
- Exact ordered-prefix workflow hydration.
- Workspace/report isolation and report-specific quality state.
- 24-hour Workspace expiration and namespaced browser reset.
- HTML cache control and baseline security headers.
- Non-HTML response status, body, and cache preservation.

## Security headers

- `Content-Security-Policy` with `frame-ancestors 'none'`, restricted scripts, connections, forms, objects, and base URI.
- `Permissions-Policy` disabling camera, microphone, geolocation, payment, and USB.
- `Referrer-Policy: no-referrer`.
- `X-Content-Type-Options: nosniff`.
- `X-Frame-Options: DENY`.
- HTML retains `Cache-Control: no-cache, must-revalidate`.

## Privacy and retention

- New and existing valid Workspace records expire 24 hours after creation.
- Expired or structurally invalid Workspace records are removed from `localStorage` during hydration.
- Invalid report drafts are removed from `sessionStorage` during hydration.
- Report quality state remains in `sessionStorage` and is scoped to the exact Workspace and report IDs.
- In-progress report composition is validated and autosaved per Workspace in `sessionStorage`, then removed after successful report creation, Workspace deletion, expiration, or reset.
- Reset removes only keys beginning with `ai-horizon-` from local and session storage.
- Unrelated browser storage remains untouched.

## Accessibility and responsive behavior

- The mobile sidebar is hidden from pointer and keyboard access while closed.
- Menu state exposes `aria-expanded` and `aria-controls`.
- Escape, backdrop click, route selection, and the menu toggle close navigation.
- Background route content becomes inert while mobile navigation is open.
- Active primary navigation exposes `aria-current="page"`.
- A skip link and route-change heading focus support keyboard navigation.
- Small muted labels use a higher-contrast color.
- Mobile controls use a 44-pixel minimum target.
- Reduced-motion preferences suppress nonessential transitions and transforms.
- Print rules protect findings, evidence, remediation tables, headings, widows, and orphans.

## Installation invariant

- `src/installation.js` was not modified.
- `src/workshop-content.js` was not modified.
- The test suite pins the serialized Installation object to SHA-256 `c54363f2afaee8154c95ecfec49a50f0d39ce11a0b4fbcb10a7c02f5c496691b`.
- Installation retains its existing URLs, steps, ordering, troubleshooting, and hosted flow.

## Residual manual gates

- A facilitator must complete the responsive and accessibility checklist in `workshop/FACILITATOR-GUIDE.md` on target browsers before deployment approval.
- A facilitator must inspect one saved A4 PDF per Blueprint before deployment approval.
- Cloudflare Access protection for the target hostname must be confirmed outside this repository.
- No deployment command was executed.

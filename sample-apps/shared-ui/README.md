# shared-ui

Canonical source for UI content shared across every app in this repo (FlareID +
the 4 demo apps), which don't share an npm package with each other by design
(each is independently deployable). Same pattern as the other cross-app
boilerplate in this repo (`workers-oauth-utils.ts`, `access-jwt.ts`, etc.):
edit the canonical copy here, then re-copy it into each app.

- `react/DemoDisclaimer.tsx` + `react/AboutDemo.tsx` - for the 4 React apps
  (hr-app, crm-app, collab-app, wiki-app). Copy verbatim into each app's
  `web/src/components/` and `web/src/pages/`.
- `flareid/about-demo.ts` - the Hono/server-rendered equivalent for FlareID,
  which doesn't use React. Copy verbatim into `flareid-idp/src/routes/`.

## What changed, propagate to:

- hr-app/web/src/components/DemoDisclaimer.tsx, hr-app/web/src/pages/AboutDemo.tsx
- crm-app/web/src/components/DemoDisclaimer.tsx, crm-app/web/src/pages/AboutDemo.tsx
- collab-app/web/src/components/DemoDisclaimer.tsx, collab-app/web/src/pages/AboutDemo.tsx
- wiki-app/web/src/components/DemoDisclaimer.tsx, wiki-app/web/src/pages/AboutDemo.tsx
- flareid-idp/src/routes/about-demo.ts

If the wording ever changes, grep the repo for "not for production use" to find every copy.

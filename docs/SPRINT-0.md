# Sprint 0: Foundation

Date: 2026-09-21

## Outcome

- Created the canonical local workspace at `/Users/janguiano/ai-horizon-workshop`.
- Copied the current front-end working tree into `site/ai-horizon-front/` without its Git metadata, dependencies, or build artifacts.
- Extracted the Corporate Test Connector Pack into `sample-apps/`.
- Established repository structure, scope rules, and deployment safety controls.

## Source state

The source repository at `/Users/janguiano/ai-horizon` had local modifications in these files when the snapshot was taken:

- `README.md`
- `src/App.jsx`
- `src/content.js`
- `src/styles.css`

The source repository was not modified or cleaned. The canonical snapshot intentionally includes its current working-tree versions.

## Connector pack inventory

- `flareid-idp/`: shared workshop identity provider
- `hr-app/`: employee, compensation, benefits, and organization data
- `crm-app/`: accounts, contacts, and opportunity data
- `collab-app/`: inbox and calendar data
- `wiki-app/`: internal knowledge and restricted-space data
- `shared-ui/`: shared visual assets and patterns
- `scripts/`: deployment support tooling

## Exit criteria

- Canonical directory structure exists.
- Front-end source snapshot exists without generated artifacts.
- Sample apps are available directly under `sample-apps/`.
- Installation behavior invariant is documented.
- Target navigation is documented.
- Deployment requires explicit approval.

## Validation

- SHA-1 checksums match between the source and canonical copies of `README.md`, `src/App.jsx`, `src/content.js`, and `src/styles.css`.
- `npm ci` completed successfully in `site/ai-horizon-front/`.
- `npm run build` completed successfully with Vite 6.4.3.
- Generated dependencies and build artifacts remain ignored by Git.
- No deployment command was executed.

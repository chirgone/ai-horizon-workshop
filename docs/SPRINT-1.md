# Sprint 1: Cloudflare OS Shell

Date: 2026-09-21

## Outcome

- Replaced visible `Super Seal` branding with `Cloudflare OS`.
- Changed the primary navigation to `Home`, `Workspaces`, `Blueprints`, `Outputs`, and `Explore`.
- Added `Favorites` and `Recent workspaces` without a counter or empty-state helper text.
- Added customer-facing hub pages for workspaces, Blueprints, outputs, and workshop discovery.
- Exposed Super Skills through both `Blueprints` and `Explore`.
- Added the three initial report Blueprints to the catalog preview.
- Preserved legacy content routes so existing deep links remain valid.
- Set English as the initial locale for new visitors, as required for customer-facing workshop content.

## Installation invariant

- The Installation data, URLs, steps, and ordering were not modified.
- The existing `/lessons/installation` route remains available.
- Visible `Super Seal` references render as `Cloudflare OS` through the presentation layer.
- Its return navigation now points to `Workspaces` instead of exposing the legacy lesson taxonomy.

## Validation

- `npm run build` completed successfully with Vite 6.4.3.
- Home, Workspaces, Blueprints, Outputs, Explore, and Installation returned HTTP 200 locally.
- Desktop screenshots were reviewed for Home, Blueprints, and Installation.
- Responsive rendering was reviewed at a 500-pixel viewport for Explore.
- `git diff --check` completed successfully.
- No deployment command was executed.

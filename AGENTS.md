# AI Horizon Workshop Working Agreement

## Scope

- Treat this repository as the canonical Cloudflare OS workshop workspace.
- Keep customer-facing copy in English.
- Use `Cloudflare OS` for visible product naming. Do not introduce new visible `Super Seal` references.
- Preserve established Cloudflare visual patterns where they already exist.

## Installation invariant

- Preserve the existing Installation workflow, URLs, steps, ordering, and behavior.
- During the navigation migration, only its visible `Super Seal` naming may change to `Cloudflare OS`.
- Verify this invariant before accepting any Installation-related change.

## Target navigation

- Home
- Workspaces
- Blueprints
- Outputs
- Explore
- Favorites
- Recent workspaces

Do not show a Favorites count or the text `Favorite a workspace to keep it here.`

## Safety

- Never deploy without explicit approval from Ivan Anguiano.
- Never commit credentials, API tokens, `.dev.vars`, or generated deployment configuration.
- Keep MCP access read-only by default and document every scope expansion.
- Do not use the sample credentials outside an isolated workshop environment.

## Validation

- Build the affected application before closing a sprint.
- Validate desktop and mobile behavior for front-end changes.
- Record major scope or architecture decisions under `docs/`.

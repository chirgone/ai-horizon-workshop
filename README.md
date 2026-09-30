# AI Horizon Workshop

Canonical workspace for the customer-facing Cloudflare OS workshop. The workshop teaches customers how to install MCP Blueprints, connect corporate systems, and produce actionable security and governance reports.

## Product thesis

- Cloudflare OS is the door.
- AI is the hook.
- MCP Blueprints are the operating model.
- PDF reports are the outcome.
- Security is the destination.

## Repository layout

| Path | Purpose |
| --- | --- |
| `site/ai-horizon-front/` | Current AI Horizon front-end snapshot and future workshop UI |
| `blueprints/` | Installable MCP Blueprint definitions |
| `super-skills/` | Reusable report-generation and analysis skills |
| `sample-apps/` | Corporate Test Connector Pack: CRM, HR, wiki, collaboration, and identity |
| `mcp/` | MCP catalog, permissions, and connection guidance |
| `reports/` | PDF report templates and approved examples |
| `workshop/` | Facilitator and attendee workshop material |
| `scripts/` | Workspace-level automation |
| `docs/` | Architecture, decisions, and sprint records |

## Frozen scope

- All customer-facing content is written in English.
- All visible `Super Seal` naming is replaced with `Cloudflare OS`.
- The existing Installation workflow, URLs, steps, and behavior remain unchanged. Only visible naming may change during the navigation migration.
- The target primary navigation is `Home`, `Workspaces`, `Blueprints`, `Outputs`, and `Explore`.
- `Favorites` and `Recent workspaces` remain in the sidebar without counters or empty-state helper text.
- Super Skills are discovered through `Blueprints` or `Explore`, not exposed as legacy primary navigation.
- No deployment is allowed without explicit approval from Ivan Anguiano.

## Blueprint Catalog

### Published installable Blueprints

- Cloudflare Account Audit Report
- Attack Surface and Risk Report
- AI Governance Readiness Report
- Cloudflare Radar Intelligence Report

### Planned report Blueprints

- Security Misconfiguration Report
- WAF and Bot Protection Effectiveness Report
- Zero Trust Readiness Report
- AI Gateway Usage and Cost Report
- Workers Observability and Reliability Report
- DNS and Internet Performance Report
- Compliance Evidence Pack
- Account Utilization and Contracted Products Report

See `blueprints/TOP-REPORT-BLUEPRINTS.md` for the full planning catalog, MCP suggestions, and expected outputs.

## Local front-end

```bash
cd site/ai-horizon-front
npm ci
npm run dev
```

The production route remains configured in `site/ai-horizon-front/wrangler.jsonc`. Do not run the deploy script without explicit approval.

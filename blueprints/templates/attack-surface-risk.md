# Attack Surface and Risk Report

> Map external exposure for approved domains, DNS, APIs, and public apps with cited risk evidence.

- **Top 10 position**: 3
- **Slug**: `attack-surface-risk`
- **Repo home**: https://github.com/chirgone/ai-horizon-workshop/tree/main/blueprints
- **Template file**: `blueprints/templates/attack-surface-risk.md`
- **Last updated**: 2026-09-30

## Decision this Blueprint supports

Which externally reachable assets create the most material risk, and which control changes reduce it fastest?

## Runtime inputs

These values are provided by the operator inside Cloudflare OS when the Blueprint is loaded or executed. They must not be hardcoded in the Blueprint or the `.gadget` package.

- Approved domains, zones, and IP ranges
- Known business critical applications and API routes
- Security owner and application owner
- Allowed external discovery boundary and observation window

## Required MCP bindings

Every binding below uses an officially published Cloudflare remote MCP server.

| Binding | MCP server | Endpoint | Scope |
|---------|------------|----------|-------|
| `MCP_CLOUDFLARE` | Cloudflare API MCP | `https://mcp.cloudflare.com/mcp` | Read-only OAuth with the minimum permissions required for the approved assessment scope. |
| `MCP_RADAR` | Cloudflare Radar MCP | `https://radar.mcp.cloudflare.com/mcp` | Named read-only tools only. create_url_scan is explicitly disabled. |
| `MCP_DNS_ANALYTICS` | DNS Analytics MCP | `https://dns-analytics.mcp.cloudflare.com/mcp` | Read-only DNS performance and query evidence for zones inside scope. |
| `MCP_GRAPHQL` | GraphQL Analytics MCP | `https://graphql.mcp.cloudflare.com/mcp` | Read-only analytics queries scoped to approved accounts, zones, and time windows. |

## Optional MCP bindings

Use these only when the operator confirms the SKU and scope at runtime.

_This Blueprint has no optional bindings._

## Evidence requirements

- Externally reachable hostnames, services, and routes inside scope
- Traffic, DNS, and threat signals linked to exposed assets
- Existing edge controls and verified coverage gaps
- Radar and GraphQL analytics that support material risk claims
- Unknown ownership, stale assets, and contradictory evidence

## Report sections

- Executive exposure summary
- Asset and service inventory
- Risk paths and critical domains
- Control coverage and gaps
- Sequenced reduction plan

## Guardrails

- Passive and approved discovery only
- No scanning outside the defined boundary
- create_url_scan on Radar is never enabled
- Asset owners validate critical exposure before release

## Stop conditions

- Scope boundary is not confirmed in writing by the operator
- Required bindings are not reconnected
- Radar returns an unsupported target type for the operator input

## Create with AI prompt

Copy this prompt into Cloudflare OS: Blueprints then New Blueprint then Create with AI. Review and accept each change before publishing.

```text
You are the Cloudflare OS Blueprint builder. Create a single purpose, read only assessment Blueprint titled "Attack Surface and Risk Report".

Decision this Blueprint must support:
Which externally reachable assets create the most material risk, and which control changes reduce it fastest?

Runtime inputs the Blueprint must ask the operator for (never hardcode account, zone, token, or scope values in the Blueprint itself):
- Approved domains, zones, and IP ranges
- Known business critical applications and API routes
- Security owner and application owner
- Allowed external discovery boundary and observation window

Required MCP bindings (use these exact binding names and official endpoints): `MCP_CLOUDFLARE`, `MCP_RADAR`, `MCP_DNS_ANALYTICS`, `MCP_GRAPHQL`
Optional MCP bindings: none

Evidence requirements:
- Externally reachable hostnames, services, and routes inside scope
- Traffic, DNS, and threat signals linked to exposed assets
- Existing edge controls and verified coverage gaps
- Radar and GraphQL analytics that support material risk claims
- Unknown ownership, stale assets, and contradictory evidence

Report sections, in order:
- Executive exposure summary
- Asset and service inventory
- Risk paths and critical domains
- Control coverage and gaps
- Sequenced reduction plan

Guardrails:
- Passive and approved discovery only
- No scanning outside the defined boundary
- create_url_scan on Radar is never enabled
- Asset owners validate critical exposure before release

Stop conditions:
- Scope boundary is not confirmed in writing by the operator
- Required bindings are not reconnected
- Radar returns an unsupported target type for the operator input

Every material claim in the output must cite the tool name, parameters, scope, and retrieval time. Mark unsupported targets, missing evidence, and tool errors explicitly instead of inventing findings. The output must stay as a Draft, review required PDF until a human reviewer releases it. Do not call any write or destructive tool.
```

## Operator install prompt

After uploading the `.gadget` package or accepting the Create with AI draft, paste this prompt into the Blueprint assistant inside Cloudflare OS.

```text
Help me install the Attack Surface and Risk Report in Cloudflare OS. I have the Blueprint ready to upload or created from the Create with AI prompt. Walk me step by step: from the left navigation go to Blueprints, then More blueprint actions, then Upload archive if I have a .gadget file, or accept the Create with AI draft. Reconnect these required MCP bindings with minimum read only access: MCP_CLOUDFLARE, MCP_RADAR, MCP_DNS_ANALYTICS, MCP_GRAPHQL. Treat these optional bindings as planned enrichment only if I confirm the SKU and scope: none. For every connected binding, run one harmless read only tool call and ask me to confirm the response matches the approved scope before you continue. Do not generate the final report until I confirm the scope, owner, observation window, and that every required binding returned usable evidence. Stop and ask me for confirmation before any action that changes scope, access, or writes configuration.
```

## Per binding harmless validation

- `MCP_CLOUDFLARE` (Cloudflare API MCP): run one harmless read-only tool call against `https://mcp.cloudflare.com/mcp` and confirm the response matches the approved scope before generating the report.
- `MCP_RADAR` (Cloudflare Radar MCP): run one harmless read-only tool call against `https://radar.mcp.cloudflare.com/mcp` and confirm the response matches the approved scope before generating the report.
- `MCP_DNS_ANALYTICS` (DNS Analytics MCP): run one harmless read-only tool call against `https://dns-analytics.mcp.cloudflare.com/mcp` and confirm the response matches the approved scope before generating the report.
- `MCP_GRAPHQL` (GraphQL Analytics MCP): run one harmless read-only tool call against `https://graphql.mcp.cloudflare.com/mcp` and confirm the response matches the approved scope before generating the report.

## References

- Cloudflare own MCP servers: https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/
- AI Horizon Workshop repo: https://github.com/chirgone/ai-horizon-workshop
- Blueprints directory: https://github.com/chirgone/ai-horizon-workshop/tree/main/blueprints

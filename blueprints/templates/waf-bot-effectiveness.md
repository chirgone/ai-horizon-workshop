# WAF and Bot Protection Effectiveness Report

> Evaluate WAF, Bot Management, API Shield, and rate limiting coverage with cited traffic evidence.

- **Top 10 position**: 4
- **Slug**: `waf-bot-effectiveness`
- **Repo home**: https://github.com/chirgone/ai-horizon-workshop/tree/main/blueprints
- **Template file**: `blueprints/templates/waf-bot-effectiveness.md`
- **Last updated**: 2026-09-30

## Decision this Blueprint supports

Which Internet facing paths remain under protected, and which controls reduce exploitability fastest?

## Runtime inputs

These values are provided by the operator inside Cloudflare OS when the Blueprint is loaded or executed. They must not be hardcoded in the Blueprint or the `.gadget` package.

- Approved zones, hostnames, and API scope
- Known critical applications and high value endpoints
- Named application security owner
- Observation window for attack and traffic signals

## Required MCP bindings

Every binding below uses an officially published Cloudflare remote MCP server.

| Binding | MCP server | Endpoint | Scope |
|---------|------------|----------|-------|
| `MCP_CLOUDFLARE` | Cloudflare API MCP | `https://mcp.cloudflare.com/mcp` | Read-only OAuth with the minimum permissions required for the approved assessment scope. |
| `MCP_GRAPHQL` | GraphQL Analytics MCP | `https://graphql.mcp.cloudflare.com/mcp` | Read-only analytics queries scoped to approved accounts, zones, and time windows. |
| `MCP_RADAR` | Cloudflare Radar MCP | `https://radar.mcp.cloudflare.com/mcp` | Named read-only tools only. create_url_scan is explicitly disabled. |

## Optional MCP bindings

Use these only when the operator confirms the SKU and scope at runtime.

_This Blueprint has no optional bindings._

## Evidence requirements

- Observed attack, request, and bot patterns for scoped applications
- Current WAF, Bot Management, API Shield, and rate limiting coverage
- Known gaps, bypass paths, and exceptions that weaken protection
- Control tuning opportunities supported by cited traffic evidence
- Explicit evidence gaps for endpoints without analytics

## Report sections

- Executive protection summary
- Scoped applications and endpoints
- Observed attack patterns
- Coverage gaps and vulnerable paths
- Recommended control changes

## Guardrails

- No active testing without explicit written approval
- Differentiate blocked traffic from assumed exposure
- Application owners review high impact recommendations before release

## Stop conditions

- GraphQL returns no data for the chosen observation window
- Required bindings are not reconnected
- Operator cannot confirm high value endpoint ownership

## Create with AI prompt

Copy this prompt into Cloudflare OS: Blueprints then New Blueprint then Create with AI. Review and accept each change before publishing.

```text
You are the Cloudflare OS Blueprint builder. Create a single purpose, read only assessment Blueprint titled "WAF and Bot Protection Effectiveness Report".

Decision this Blueprint must support:
Which Internet facing paths remain under protected, and which controls reduce exploitability fastest?

Runtime inputs the Blueprint must ask the operator for (never hardcode account, zone, token, or scope values in the Blueprint itself):
- Approved zones, hostnames, and API scope
- Known critical applications and high value endpoints
- Named application security owner
- Observation window for attack and traffic signals

Required MCP bindings (use these exact binding names and official endpoints): `MCP_CLOUDFLARE`, `MCP_GRAPHQL`, `MCP_RADAR`
Optional MCP bindings: none

Evidence requirements:
- Observed attack, request, and bot patterns for scoped applications
- Current WAF, Bot Management, API Shield, and rate limiting coverage
- Known gaps, bypass paths, and exceptions that weaken protection
- Control tuning opportunities supported by cited traffic evidence
- Explicit evidence gaps for endpoints without analytics

Report sections, in order:
- Executive protection summary
- Scoped applications and endpoints
- Observed attack patterns
- Coverage gaps and vulnerable paths
- Recommended control changes

Guardrails:
- No active testing without explicit written approval
- Differentiate blocked traffic from assumed exposure
- Application owners review high impact recommendations before release

Stop conditions:
- GraphQL returns no data for the chosen observation window
- Required bindings are not reconnected
- Operator cannot confirm high value endpoint ownership

Every material claim in the output must cite the tool name, parameters, scope, and retrieval time. Mark unsupported targets, missing evidence, and tool errors explicitly instead of inventing findings. The output must stay as a Draft, review required PDF until a human reviewer releases it. Do not call any write or destructive tool.
```

## Operator install prompt

After uploading the `.gadget` package or accepting the Create with AI draft, paste this prompt into the Blueprint assistant inside Cloudflare OS.

```text
Help me install the WAF and Bot Protection Effectiveness Report in Cloudflare OS. I have the Blueprint ready to upload or created from the Create with AI prompt. Walk me step by step: from the left navigation go to Blueprints, then More blueprint actions, then Upload archive if I have a .gadget file, or accept the Create with AI draft. Reconnect these required MCP bindings with minimum read only access: MCP_CLOUDFLARE, MCP_GRAPHQL, MCP_RADAR. Treat these optional bindings as planned enrichment only if I confirm the SKU and scope: none. For every connected binding, run one harmless read only tool call and ask me to confirm the response matches the approved scope before you continue. Do not generate the final report until I confirm the scope, owner, observation window, and that every required binding returned usable evidence. Stop and ask me for confirmation before any action that changes scope, access, or writes configuration.
```

## Per binding harmless validation

- `MCP_CLOUDFLARE` (Cloudflare API MCP): run one harmless read-only tool call against `https://mcp.cloudflare.com/mcp` and confirm the response matches the approved scope before generating the report.
- `MCP_GRAPHQL` (GraphQL Analytics MCP): run one harmless read-only tool call against `https://graphql.mcp.cloudflare.com/mcp` and confirm the response matches the approved scope before generating the report.
- `MCP_RADAR` (Cloudflare Radar MCP): run one harmless read-only tool call against `https://radar.mcp.cloudflare.com/mcp` and confirm the response matches the approved scope before generating the report.

## References

- Cloudflare own MCP servers: https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/
- AI Horizon Workshop repo: https://github.com/chirgone/ai-horizon-workshop
- Blueprints directory: https://github.com/chirgone/ai-horizon-workshop/tree/main/blueprints

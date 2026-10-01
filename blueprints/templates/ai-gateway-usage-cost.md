# AI Gateway Usage and Cost Report

> Analyze model consumption, cost, latency, errors, caching, and provider routing with evidence.

- **Top 10 position**: 7
- **Slug**: `ai-gateway-usage-cost`
- **Repo home**: https://github.com/chirgone/ai-horizon-workshop/tree/main/blueprints
- **Template file**: `blueprints/templates/ai-gateway-usage-cost.md`
- **Last updated**: 2026-09-30

## Decision this Blueprint supports

Which routing, caching, and model choices reduce cost without weakening reliability or governance?

## Runtime inputs

These values are provided by the operator inside Cloudflare OS when the Blueprint is loaded or executed. They must not be hardcoded in the Blueprint or the `.gadget` package.

- Approved AI Gateway scope and observation window
- Named AI platform owner and finance reviewer
- Critical applications or workflows using AI
- Target cost and latency objectives

## Required MCP bindings

Every binding below uses an officially published Cloudflare remote MCP server.

| Binding | MCP server | Endpoint | Scope |
|---------|------------|----------|-------|
| `MCP_AI_GATEWAY` | AI Gateway MCP | `https://ai-gateway.mcp.cloudflare.com/mcp` | Read-only AI Gateway log and metadata queries inside scope. |
| `MCP_GRAPHQL` | GraphQL Analytics MCP | `https://graphql.mcp.cloudflare.com/mcp` | Read-only analytics queries scoped to approved accounts, zones, and time windows. |

## Optional MCP bindings

Use these only when the operator confirms the SKU and scope at runtime.

| Binding | MCP server | Endpoint | Scope |
|---------|------------|----------|-------|
| `MCP_CLOUDFLARE` | Cloudflare API MCP | `https://mcp.cloudflare.com/mcp` | Read-only OAuth with the minimum permissions required for the approved assessment scope. |

## Evidence requirements

- Model, provider, and route level usage inside scope
- Latency, error, and caching patterns tied to user experience or cost
- Routing decisions, fallback paths, and concentration risks
- Analytics evidence from GraphQL that confirms AI Gateway signals
- Observed opportunities for guardrails, caching, or provider diversification

## Report sections

- Executive optimization summary
- Usage and provider profile
- Cost and latency drivers
- Reliability and routing findings
- Optimization roadmap

## Guardrails

- Do not expose prompt content unless explicitly approved
- Separate direct cost evidence from inferred savings
- Platform owners validate material routing changes before release

## Stop conditions

- AI Gateway returns no data for the chosen window
- Operator cannot confirm the approved projects
- Required bindings are not reconnected

## Create with AI prompt

Copy this prompt into Cloudflare OS: Blueprints then New Blueprint then Create with AI. Review and accept each change before publishing.

```text
You are the Cloudflare OS Blueprint builder. Create a single purpose, read only assessment Blueprint titled "AI Gateway Usage and Cost Report".

Decision this Blueprint must support:
Which routing, caching, and model choices reduce cost without weakening reliability or governance?

Runtime inputs the Blueprint must ask the operator for (never hardcode account, zone, token, or scope values in the Blueprint itself):
- Approved AI Gateway scope and observation window
- Named AI platform owner and finance reviewer
- Critical applications or workflows using AI
- Target cost and latency objectives

Required MCP bindings (use these exact binding names and official endpoints): `MCP_AI_GATEWAY`, `MCP_GRAPHQL`
Optional MCP bindings: `MCP_CLOUDFLARE`

Evidence requirements:
- Model, provider, and route level usage inside scope
- Latency, error, and caching patterns tied to user experience or cost
- Routing decisions, fallback paths, and concentration risks
- Analytics evidence from GraphQL that confirms AI Gateway signals
- Observed opportunities for guardrails, caching, or provider diversification

Report sections, in order:
- Executive optimization summary
- Usage and provider profile
- Cost and latency drivers
- Reliability and routing findings
- Optimization roadmap

Guardrails:
- Do not expose prompt content unless explicitly approved
- Separate direct cost evidence from inferred savings
- Platform owners validate material routing changes before release

Stop conditions:
- AI Gateway returns no data for the chosen window
- Operator cannot confirm the approved projects
- Required bindings are not reconnected

Every material claim in the output must cite the tool name, parameters, scope, and retrieval time. Mark unsupported targets, missing evidence, and tool errors explicitly instead of inventing findings. The output must stay as a Draft, review required PDF until a human reviewer releases it. Do not call any write or destructive tool.
```

## Operator install prompt

After uploading the `.gadget` package or accepting the Create with AI draft, paste this prompt into the Blueprint assistant inside Cloudflare OS.

```text
Help me install the AI Gateway Usage and Cost Report in Cloudflare OS. I have the Blueprint ready to upload or created from the Create with AI prompt. Walk me step by step: from the left navigation go to Blueprints, then More blueprint actions, then Upload archive if I have a .gadget file, or accept the Create with AI draft. Reconnect these required MCP bindings with minimum read only access: MCP_AI_GATEWAY, MCP_GRAPHQL. Treat these optional bindings as planned enrichment only if I confirm the SKU and scope: MCP_CLOUDFLARE. For every connected binding, run one harmless read only tool call and ask me to confirm the response matches the approved scope before you continue. Do not generate the final report until I confirm the scope, owner, observation window, and that every required binding returned usable evidence. Stop and ask me for confirmation before any action that changes scope, access, or writes configuration.
```

## Per binding harmless validation

- `MCP_AI_GATEWAY` (AI Gateway MCP): run one harmless read-only tool call against `https://ai-gateway.mcp.cloudflare.com/mcp` and confirm the response matches the approved scope before generating the report.
- `MCP_GRAPHQL` (GraphQL Analytics MCP): run one harmless read-only tool call against `https://graphql.mcp.cloudflare.com/mcp` and confirm the response matches the approved scope before generating the report.

## References

- Cloudflare own MCP servers: https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/
- AI Horizon Workshop repo: https://github.com/chirgone/ai-horizon-workshop
- Blueprints directory: https://github.com/chirgone/ai-horizon-workshop/tree/main/blueprints

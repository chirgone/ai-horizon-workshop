# Compliance Evidence Pack

> Assemble audit ready evidence with cited controls, changes, exceptions, and administrative access records.

- **Top 10 position**: 10
- **Slug**: `compliance-evidence-pack`
- **Repo home**: https://github.com/chirgone/ai-horizon-workshop/tree/main/blueprints
- **Template file**: `blueprints/templates/compliance-evidence-pack.md`
- **Last updated**: 2026-09-30

## Decision this Blueprint supports

What evidence is audit ready today, what is missing, and which exceptions require explicit owner action?

## Runtime inputs

These values are provided by the operator inside Cloudflare OS when the Blueprint is loaded or executed. They must not be hardcoded in the Blueprint or the `.gadget` package.

- Approved control framework or audit objective
- Named compliance owner and reviewer
- Relevant accounts, zones, or products in scope
- Target audit window and delivery deadline

## Required MCP bindings

Every binding below uses an officially published Cloudflare remote MCP server.

| Binding | MCP server | Endpoint | Scope |
|---------|------------|----------|-------|
| `MCP_CLOUDFLARE` | Cloudflare API MCP | `https://mcp.cloudflare.com/mcp` | Read-only OAuth with the minimum permissions required for the approved assessment scope. |
| `MCP_AUDITLOGS` | Audit Logs MCP | `https://auditlogs.mcp.cloudflare.com/mcp` | Read-only, time-bounded queries over administrative events. |
| `MCP_GRAPHQL` | GraphQL Analytics MCP | `https://graphql.mcp.cloudflare.com/mcp` | Read-only analytics queries scoped to approved accounts, zones, and time windows. |

## Optional MCP bindings

Use these only when the operator confirms the SKU and scope at runtime.

| Binding | MCP server | Endpoint | Scope |
|---------|------------|----------|-------|
| `MCP_CASB` | Cloudflare One CASB MCP | `https://casb.mcp.cloudflare.com/mcp` | Read-only SaaS posture and misconfiguration evidence inside scope. |

## Evidence requirements

- Configured controls mapped to the approved audit objective
- Recent administrative changes with actor attribution
- Administrative access, exceptions, and compensating controls
- SaaS posture evidence when CASB is enabled and in scope
- Explicit missing evidence or controls that need owner follow up

## Report sections

- Audit objective and scope
- Control evidence summary
- Administrative access and changes
- Exceptions and gaps
- Export package index with citations

## Guardrails

- Do not claim certification or compliance status without owner approval
- Preserve exact evidence timestamps and scope
- Compliance owners validate final mapping before release
- CASB evidence is used only when operator confirms SaaS scope

## Stop conditions

- Audit objective or control framework is not confirmed
- Required bindings are not reconnected
- Observation window is undefined

## Create with AI prompt

Copy this prompt into Cloudflare OS: Blueprints then New Blueprint then Create with AI. Review and accept each change before publishing.

```text
You are the Cloudflare OS Blueprint builder. Create a single purpose, read only assessment Blueprint titled "Compliance Evidence Pack".

Decision this Blueprint must support:
What evidence is audit ready today, what is missing, and which exceptions require explicit owner action?

Runtime inputs the Blueprint must ask the operator for (never hardcode account, zone, token, or scope values in the Blueprint itself):
- Approved control framework or audit objective
- Named compliance owner and reviewer
- Relevant accounts, zones, or products in scope
- Target audit window and delivery deadline

Required MCP bindings (use these exact binding names and official endpoints): `MCP_CLOUDFLARE`, `MCP_AUDITLOGS`, `MCP_GRAPHQL`
Optional MCP bindings: `MCP_CASB`

Evidence requirements:
- Configured controls mapped to the approved audit objective
- Recent administrative changes with actor attribution
- Administrative access, exceptions, and compensating controls
- SaaS posture evidence when CASB is enabled and in scope
- Explicit missing evidence or controls that need owner follow up

Report sections, in order:
- Audit objective and scope
- Control evidence summary
- Administrative access and changes
- Exceptions and gaps
- Export package index with citations

Guardrails:
- Do not claim certification or compliance status without owner approval
- Preserve exact evidence timestamps and scope
- Compliance owners validate final mapping before release
- CASB evidence is used only when operator confirms SaaS scope

Stop conditions:
- Audit objective or control framework is not confirmed
- Required bindings are not reconnected
- Observation window is undefined

Every material claim in the output must cite the tool name, parameters, scope, and retrieval time. Mark unsupported targets, missing evidence, and tool errors explicitly instead of inventing findings. The output must stay as a Draft, review required PDF until a human reviewer releases it. Do not call any write or destructive tool.
```

## Operator install prompt

After uploading the `.gadget` package or accepting the Create with AI draft, paste this prompt into the Blueprint assistant inside Cloudflare OS.

```text
Help me install the Compliance Evidence Pack in Cloudflare OS. I have the Blueprint ready to upload or created from the Create with AI prompt. Walk me step by step: from the left navigation go to Blueprints, then More blueprint actions, then Upload archive if I have a .gadget file, or accept the Create with AI draft. Reconnect these required MCP bindings with minimum read only access: MCP_CLOUDFLARE, MCP_AUDITLOGS, MCP_GRAPHQL. Treat these optional bindings as planned enrichment only if I confirm the SKU and scope: MCP_CASB. For every connected binding, run one harmless read only tool call and ask me to confirm the response matches the approved scope before you continue. Do not generate the final report until I confirm the scope, owner, observation window, and that every required binding returned usable evidence. Stop and ask me for confirmation before any action that changes scope, access, or writes configuration.
```

## Per binding harmless validation

- `MCP_CLOUDFLARE` (Cloudflare API MCP): run one harmless read-only tool call against `https://mcp.cloudflare.com/mcp` and confirm the response matches the approved scope before generating the report.
- `MCP_AUDITLOGS` (Audit Logs MCP): run one harmless read-only tool call against `https://auditlogs.mcp.cloudflare.com/mcp` and confirm the response matches the approved scope before generating the report.
- `MCP_GRAPHQL` (GraphQL Analytics MCP): run one harmless read-only tool call against `https://graphql.mcp.cloudflare.com/mcp` and confirm the response matches the approved scope before generating the report.

## References

- Cloudflare own MCP servers: https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/
- AI Horizon Workshop repo: https://github.com/chirgone/ai-horizon-workshop
- Blueprints directory: https://github.com/chirgone/ai-horizon-workshop/tree/main/blueprints

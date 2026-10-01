# Zero Trust Readiness Report

> Assess readiness for Access, Gateway, DLP, CASB, and device posture before scaling Zero Trust.

- **Top 10 position**: 5
- **Slug**: `zero-trust-readiness`
- **Repo home**: https://github.com/chirgone/ai-horizon-workshop/tree/main/blueprints
- **Template file**: `blueprints/templates/zero-trust-readiness.md`
- **Last updated**: 2026-09-30

## Decision this Blueprint supports

What blocks Zero Trust rollout today, and which sequence closes the highest value gaps first?

## Runtime inputs

These values are provided by the operator inside Cloudflare OS when the Blueprint is loaded or executed. They must not be hardcoded in the Blueprint or the `.gadget` package.

- Approved application and user population scope
- Named Zero Trust owner and endpoint owner
- Current identity, device, and remote access assumptions
- Target rollout horizon and control priorities

## Required MCP bindings

Every binding below uses an officially published Cloudflare remote MCP server.

| Binding | MCP server | Endpoint | Scope |
|---------|------------|----------|-------|
| `MCP_CLOUDFLARE` | Cloudflare API MCP | `https://mcp.cloudflare.com/mcp` | Read-only OAuth with the minimum permissions required for the approved assessment scope. |
| `MCP_AUDITLOGS` | Audit Logs MCP | `https://auditlogs.mcp.cloudflare.com/mcp` | Read-only, time-bounded queries over administrative events. |

## Optional MCP bindings

Use these only when the operator confirms the SKU and scope at runtime.

| Binding | MCP server | Endpoint | Scope |
|---------|------------|----------|-------|
| `MCP_DEX` | Digital Experience Monitoring MCP | `https://dex.mcp.cloudflare.com/mcp` | Read-only DEX signals for critical applications inside scope. |
| `MCP_CASB` | Cloudflare One CASB MCP | `https://casb.mcp.cloudflare.com/mcp` | Read-only SaaS posture and misconfiguration evidence inside scope. |

## Evidence requirements

- Applications, users, and access paths inside the approved scope
- Current Access, Gateway, DLP, CASB, and posture coverage
- Gaps in identity, device trust, or policy enforcement
- DEX signals for critical applications when DEX is enabled and in scope
- SaaS posture evidence when CASB is enabled and in scope
- Explicit exclusions and unvalidated device or user segments

## Report sections

- Executive readiness decision
- Scoped applications and users
- Access and posture findings
- Zero Trust control gaps
- Phased rollout roadmap

## Guardrails

- No user content collection beyond approved scope
- Separate observed controls from target state recommendations
- Identity and endpoint owners review rollout assumptions
- Optional MCP evidence is used only when the operator confirms the SKU and scope

## Stop conditions

- Operator cannot confirm identity or endpoint ownership
- Required bindings are not reconnected
- Scope mixes populations without written approval

## Create with AI prompt

Copy this prompt into Cloudflare OS: Blueprints then New Blueprint then Create with AI. Review and accept each change before publishing.

```text
You are the Cloudflare OS Blueprint builder. Create a single purpose, read only assessment Blueprint titled "Zero Trust Readiness Report".

Decision this Blueprint must support:
What blocks Zero Trust rollout today, and which sequence closes the highest value gaps first?

Runtime inputs the Blueprint must ask the operator for (never hardcode account, zone, token, or scope values in the Blueprint itself):
- Approved application and user population scope
- Named Zero Trust owner and endpoint owner
- Current identity, device, and remote access assumptions
- Target rollout horizon and control priorities

Required MCP bindings (use these exact binding names and official endpoints): `MCP_CLOUDFLARE`, `MCP_AUDITLOGS`
Optional MCP bindings: `MCP_DEX`, `MCP_CASB`

Evidence requirements:
- Applications, users, and access paths inside the approved scope
- Current Access, Gateway, DLP, CASB, and posture coverage
- Gaps in identity, device trust, or policy enforcement
- DEX signals for critical applications when DEX is enabled and in scope
- SaaS posture evidence when CASB is enabled and in scope
- Explicit exclusions and unvalidated device or user segments

Report sections, in order:
- Executive readiness decision
- Scoped applications and users
- Access and posture findings
- Zero Trust control gaps
- Phased rollout roadmap

Guardrails:
- No user content collection beyond approved scope
- Separate observed controls from target state recommendations
- Identity and endpoint owners review rollout assumptions
- Optional MCP evidence is used only when the operator confirms the SKU and scope

Stop conditions:
- Operator cannot confirm identity or endpoint ownership
- Required bindings are not reconnected
- Scope mixes populations without written approval

Every material claim in the output must cite the tool name, parameters, scope, and retrieval time. Mark unsupported targets, missing evidence, and tool errors explicitly instead of inventing findings. The output must stay as a Draft, review required PDF until a human reviewer releases it. Do not call any write or destructive tool.
```

## Operator install prompt

After uploading the `.gadget` package or accepting the Create with AI draft, paste this prompt into the Blueprint assistant inside Cloudflare OS.

```text
Help me install the Zero Trust Readiness Report in Cloudflare OS. I have the Blueprint ready to upload or created from the Create with AI prompt. Walk me step by step: from the left navigation go to Blueprints, then More blueprint actions, then Upload archive if I have a .gadget file, or accept the Create with AI draft. Reconnect these required MCP bindings with minimum read only access: MCP_CLOUDFLARE, MCP_AUDITLOGS. Treat these optional bindings as planned enrichment only if I confirm the SKU and scope: MCP_DEX, MCP_CASB. For every connected binding, run one harmless read only tool call and ask me to confirm the response matches the approved scope before you continue. Do not generate the final report until I confirm the scope, owner, observation window, and that every required binding returned usable evidence. Stop and ask me for confirmation before any action that changes scope, access, or writes configuration.
```

## Per binding harmless validation

- `MCP_CLOUDFLARE` (Cloudflare API MCP): run one harmless read-only tool call against `https://mcp.cloudflare.com/mcp` and confirm the response matches the approved scope before generating the report.
- `MCP_AUDITLOGS` (Audit Logs MCP): run one harmless read-only tool call against `https://auditlogs.mcp.cloudflare.com/mcp` and confirm the response matches the approved scope before generating the report.

## References

- Cloudflare own MCP servers: https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/
- AI Horizon Workshop repo: https://github.com/chirgone/ai-horizon-workshop
- Blueprints directory: https://github.com/chirgone/ai-horizon-workshop/tree/main/blueprints

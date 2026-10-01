# AI Governance Readiness Report

> Evaluate observed AI usage, policy coverage, visibility, and control ownership before scaling AI.

- **Top 10 position**: 6
- **Slug**: `ai-governance-readiness`
- **Repo home**: https://github.com/chirgone/ai-horizon-workshop/tree/main/blueprints
- **Template file**: `blueprints/templates/ai-governance-readiness.md`
- **Last updated**: 2026-09-30

## Decision this Blueprint supports

Where can the organization safely scale AI, and which governance gaps must close before broader adoption?

## Runtime inputs

These values are provided by the operator inside Cloudflare OS when the Blueprint is loaded or executed. They must not be hardcoded in the Blueprint or the `.gadget` package.

- Approved AI application and team scope
- Current AI policy or stated operating principles
- Security, legal, and data governance owners
- Target AI use cases and adoption timeline
- Observation window for AI usage evidence

## Required MCP bindings

Every binding below uses an officially published Cloudflare remote MCP server.

| Binding | MCP server | Endpoint | Scope |
|---------|------------|----------|-------|
| `MCP_CLOUDFLARE` | Cloudflare API MCP | `https://mcp.cloudflare.com/mcp` | Read-only OAuth with the minimum permissions required for the approved assessment scope. |
| `MCP_AUDITLOGS` | Audit Logs MCP | `https://auditlogs.mcp.cloudflare.com/mcp` | Read-only, time-bounded queries over administrative events. |
| `MCP_AI_GATEWAY` | AI Gateway MCP | `https://ai-gateway.mcp.cloudflare.com/mcp` | Read-only AI Gateway log and metadata queries inside scope. |

## Optional MCP bindings

Use these only when the operator confirms the SKU and scope at runtime.

| Binding | MCP server | Endpoint | Scope |
|---------|------------|----------|-------|
| `MCP_GRAPHQL` | GraphQL Analytics MCP | `https://graphql.mcp.cloudflare.com/mcp` | Read-only analytics queries scoped to approved accounts, zones, and time windows. |

## Evidence requirements

- Observed AI applications, models, teams, and usage patterns
- AI Gateway logs and routing evidence inside scope
- Policy controls mapped to actual technical visibility
- Data handling, logging, and ownership gaps
- Unobserved or unverified usage recorded as an explicit limitation

## Report sections

- Executive readiness decision
- Observed AI landscape
- Governance maturity
- Control gaps and ownership
- Adoption roadmap

## Guardrails

- Do not collect prompt content unless explicitly approved
- Minimize personal and sensitive data in cited evidence
- Legal and security owners approve policy conclusions
- AI Gateway evidence is scoped to approved projects only

## Stop conditions

- Operator cannot confirm policy owner or application scope
- Required bindings are not reconnected
- AI Gateway returns no evidence inside the chosen window

## Create with AI prompt

Copy this prompt into Cloudflare OS: Blueprints then New Blueprint then Create with AI. Review and accept each change before publishing.

```text
You are the Cloudflare OS Blueprint builder. Create a single purpose, read only assessment Blueprint titled "AI Governance Readiness Report".

Decision this Blueprint must support:
Where can the organization safely scale AI, and which governance gaps must close before broader adoption?

Runtime inputs the Blueprint must ask the operator for (never hardcode account, zone, token, or scope values in the Blueprint itself):
- Approved AI application and team scope
- Current AI policy or stated operating principles
- Security, legal, and data governance owners
- Target AI use cases and adoption timeline
- Observation window for AI usage evidence

Required MCP bindings (use these exact binding names and official endpoints): `MCP_CLOUDFLARE`, `MCP_AUDITLOGS`, `MCP_AI_GATEWAY`
Optional MCP bindings: `MCP_GRAPHQL`

Evidence requirements:
- Observed AI applications, models, teams, and usage patterns
- AI Gateway logs and routing evidence inside scope
- Policy controls mapped to actual technical visibility
- Data handling, logging, and ownership gaps
- Unobserved or unverified usage recorded as an explicit limitation

Report sections, in order:
- Executive readiness decision
- Observed AI landscape
- Governance maturity
- Control gaps and ownership
- Adoption roadmap

Guardrails:
- Do not collect prompt content unless explicitly approved
- Minimize personal and sensitive data in cited evidence
- Legal and security owners approve policy conclusions
- AI Gateway evidence is scoped to approved projects only

Stop conditions:
- Operator cannot confirm policy owner or application scope
- Required bindings are not reconnected
- AI Gateway returns no evidence inside the chosen window

Every material claim in the output must cite the tool name, parameters, scope, and retrieval time. Mark unsupported targets, missing evidence, and tool errors explicitly instead of inventing findings. The output must stay as a Draft, review required PDF until a human reviewer releases it. Do not call any write or destructive tool.
```

## Operator install prompt

After uploading the `.gadget` package or accepting the Create with AI draft, paste this prompt into the Blueprint assistant inside Cloudflare OS.

```text
Help me install the AI Governance Readiness Report in Cloudflare OS. I have the Blueprint ready to upload or created from the Create with AI prompt. Walk me step by step: from the left navigation go to Blueprints, then More blueprint actions, then Upload archive if I have a .gadget file, or accept the Create with AI draft. Reconnect these required MCP bindings with minimum read only access: MCP_CLOUDFLARE, MCP_AUDITLOGS, MCP_AI_GATEWAY. Treat these optional bindings as planned enrichment only if I confirm the SKU and scope: MCP_GRAPHQL. For every connected binding, run one harmless read only tool call and ask me to confirm the response matches the approved scope before you continue. Do not generate the final report until I confirm the scope, owner, observation window, and that every required binding returned usable evidence. Stop and ask me for confirmation before any action that changes scope, access, or writes configuration.
```

## Per binding harmless validation

- `MCP_CLOUDFLARE` (Cloudflare API MCP): run one harmless read-only tool call against `https://mcp.cloudflare.com/mcp` and confirm the response matches the approved scope before generating the report.
- `MCP_AUDITLOGS` (Audit Logs MCP): run one harmless read-only tool call against `https://auditlogs.mcp.cloudflare.com/mcp` and confirm the response matches the approved scope before generating the report.
- `MCP_AI_GATEWAY` (AI Gateway MCP): run one harmless read-only tool call against `https://ai-gateway.mcp.cloudflare.com/mcp` and confirm the response matches the approved scope before generating the report.

## References

- Cloudflare own MCP servers: https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/
- AI Horizon Workshop repo: https://github.com/chirgone/ai-horizon-workshop
- Blueprints directory: https://github.com/chirgone/ai-horizon-workshop/tree/main/blueprints

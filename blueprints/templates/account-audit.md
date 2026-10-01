# Cloudflare Account Audit Report

> Detect weak or incomplete Cloudflare account configuration with cited evidence and prioritized remediation.

- **Top 10 position**: 1
- **Slug**: `account-audit`
- **Repo home**: https://github.com/chirgone/ai-horizon-workshop/tree/main/blueprints
- **Template file**: `blueprints/templates/account-audit.md`
- **Last updated**: 2026-09-30

## Decision this Blueprint supports

Which account level risks must be remediated first, who owns them, and what evidence supports that priority?

## Runtime inputs

These values are provided by the operator inside Cloudflare OS when the Blueprint is loaded or executed. They must not be hardcoded in the Blueprint or the `.gadget` package.

- Approved Cloudflare account ID and zone scope
- Named security owner and report audience
- Approved read-only access boundary
- Decision deadline and remediation horizon
- Observation window for audit log review

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
| `MCP_OBSERVABILITY` | Workers Observability MCP | `https://observability.mcp.cloudflare.com/mcp` | Read-only logs and metrics for Workers inside scope. |

## Evidence requirements

- Account members, roles, 2FA state, and API tokens inside scope
- Zone, ruleset, and ownership inventory inside scope
- Administrative changes with actor attribution for the observation window
- Analytics evidence that supports material findings
- Explicit gaps where access or evidence is unavailable

## Report sections

- Executive decision
- Scope and methodology
- Account configuration findings
- Prioritized remediation and ownership
- 30/60/90 day roadmap
- Evidence appendix with citations

## Guardrails

- No configuration writes under any condition
- No material claim without a citation to tool, parameters, and retrieval time
- Human review owns final severity and risk acceptance
- Report stays in Draft, review required until human release

## Stop conditions

- Required binding is missing or not reconnected
- Operator declines to confirm the approved scope
- No audit log evidence is available for the chosen observation window

## Create with AI prompt

Copy this prompt into Cloudflare OS: Blueprints then New Blueprint then Create with AI. Review and accept each change before publishing.

```text
You are the Cloudflare OS Blueprint builder. Create a single purpose, read only assessment Blueprint titled "Cloudflare Account Audit Report".

Decision this Blueprint must support:
Which account level risks must be remediated first, who owns them, and what evidence supports that priority?

Runtime inputs the Blueprint must ask the operator for (never hardcode account, zone, token, or scope values in the Blueprint itself):
- Approved Cloudflare account ID and zone scope
- Named security owner and report audience
- Approved read-only access boundary
- Decision deadline and remediation horizon
- Observation window for audit log review

Required MCP bindings (use these exact binding names and official endpoints): `MCP_CLOUDFLARE`, `MCP_AUDITLOGS`, `MCP_GRAPHQL`
Optional MCP bindings: `MCP_OBSERVABILITY`

Evidence requirements:
- Account members, roles, 2FA state, and API tokens inside scope
- Zone, ruleset, and ownership inventory inside scope
- Administrative changes with actor attribution for the observation window
- Analytics evidence that supports material findings
- Explicit gaps where access or evidence is unavailable

Report sections, in order:
- Executive decision
- Scope and methodology
- Account configuration findings
- Prioritized remediation and ownership
- 30/60/90 day roadmap
- Evidence appendix with citations

Guardrails:
- No configuration writes under any condition
- No material claim without a citation to tool, parameters, and retrieval time
- Human review owns final severity and risk acceptance
- Report stays in Draft, review required until human release

Stop conditions:
- Required binding is missing or not reconnected
- Operator declines to confirm the approved scope
- No audit log evidence is available for the chosen observation window

Every material claim in the output must cite the tool name, parameters, scope, and retrieval time. Mark unsupported targets, missing evidence, and tool errors explicitly instead of inventing findings. The output must stay as a Draft, review required PDF until a human reviewer releases it. Do not call any write or destructive tool.
```

## Operator install prompt

After uploading the `.gadget` package or accepting the Create with AI draft, paste this prompt into the Blueprint assistant inside Cloudflare OS.

```text
Help me install the Cloudflare Account Audit Report in Cloudflare OS. I have the Blueprint ready to upload or created from the Create with AI prompt. Walk me step by step: from the left navigation go to Blueprints, then More blueprint actions, then Upload archive if I have a .gadget file, or accept the Create with AI draft. Reconnect these required MCP bindings with minimum read only access: MCP_CLOUDFLARE, MCP_AUDITLOGS, MCP_GRAPHQL. Treat these optional bindings as planned enrichment only if I confirm the SKU and scope: MCP_OBSERVABILITY. For every connected binding, run one harmless read only tool call and ask me to confirm the response matches the approved scope before you continue. Do not generate the final report until I confirm the scope, owner, observation window, and that every required binding returned usable evidence. Stop and ask me for confirmation before any action that changes scope, access, or writes configuration.
```

## Per binding harmless validation

- `MCP_CLOUDFLARE` (Cloudflare API MCP): run one harmless read-only tool call against `https://mcp.cloudflare.com/mcp` and confirm the response matches the approved scope before generating the report.
- `MCP_AUDITLOGS` (Audit Logs MCP): run one harmless read-only tool call against `https://auditlogs.mcp.cloudflare.com/mcp` and confirm the response matches the approved scope before generating the report.
- `MCP_GRAPHQL` (GraphQL Analytics MCP): run one harmless read-only tool call against `https://graphql.mcp.cloudflare.com/mcp` and confirm the response matches the approved scope before generating the report.

## References

- Cloudflare own MCP servers: https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/
- AI Horizon Workshop repo: https://github.com/chirgone/ai-horizon-workshop
- Blueprints directory: https://github.com/chirgone/ai-horizon-workshop/tree/main/blueprints

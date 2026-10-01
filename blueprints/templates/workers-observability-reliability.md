# Workers Observability and Reliability Report

> Review Workers health, deployments, logs, latency, and failure patterns across approved services.

- **Top 10 position**: 8
- **Slug**: `workers-observability-reliability`
- **Repo home**: https://github.com/chirgone/ai-horizon-workshop/tree/main/blueprints
- **Template file**: `blueprints/templates/workers-observability-reliability.md`
- **Last updated**: 2026-09-30

## Decision this Blueprint supports

Which services or deployment patterns create the highest reliability risk, and what corrective actions come first?

## Runtime inputs

These values are provided by the operator inside Cloudflare OS when the Blueprint is loaded or executed. They must not be hardcoded in the Blueprint or the `.gadget` package.

- Approved Worker services and environments
- Named engineering owner and review audience
- Observation window for incidents and deployments
- Production criticality and recovery expectations

## Required MCP bindings

Every binding below uses an officially published Cloudflare remote MCP server.

| Binding | MCP server | Endpoint | Scope |
|---------|------------|----------|-------|
| `MCP_OBSERVABILITY` | Workers Observability MCP | `https://observability.mcp.cloudflare.com/mcp` | Read-only logs and metrics for Workers inside scope. |
| `MCP_WORKERS_BUILDS` | Workers Builds MCP | `https://builds.mcp.cloudflare.com/mcp` | Read-only build, deployment, and release evidence for Workers inside scope. |
| `MCP_GRAPHQL` | GraphQL Analytics MCP | `https://graphql.mcp.cloudflare.com/mcp` | Read-only analytics queries scoped to approved accounts, zones, and time windows. |

## Optional MCP bindings

Use these only when the operator confirms the SKU and scope at runtime.

| Binding | MCP server | Endpoint | Scope |
|---------|------------|----------|-------|
| `MCP_CLOUDFLARE` | Cloudflare API MCP | `https://mcp.cloudflare.com/mcp` | Read-only OAuth with the minimum permissions required for the approved assessment scope. |

## Evidence requirements

- Worker level error, latency, and log evidence inside scope
- Deployment outcomes, rollback patterns, and build failures
- Concentration of incidents by service, route, or release window
- Analytics evidence that supports reliability conclusions
- Explicit limitations where observability is missing or incomplete

## Report sections

- Executive reliability summary
- Scoped services and environments
- Error and latency findings
- Deployment and build findings
- Corrective action plan

## Guardrails

- No production writes or rollbacks
- Do not overstate root cause without evidence
- Engineering owners review service critical conclusions before release

## Stop conditions

- Operator cannot confirm the approved services or environments
- Required bindings are not reconnected
- Observability signals are missing for the chosen window

## Create with AI prompt

Copy this prompt into Cloudflare OS: Blueprints then New Blueprint then Create with AI. Review and accept each change before publishing.

```text
You are the Cloudflare OS Blueprint builder. Create a single purpose, read only assessment Blueprint titled "Workers Observability and Reliability Report".

Decision this Blueprint must support:
Which services or deployment patterns create the highest reliability risk, and what corrective actions come first?

Runtime inputs the Blueprint must ask the operator for (never hardcode account, zone, token, or scope values in the Blueprint itself):
- Approved Worker services and environments
- Named engineering owner and review audience
- Observation window for incidents and deployments
- Production criticality and recovery expectations

Required MCP bindings (use these exact binding names and official endpoints): `MCP_OBSERVABILITY`, `MCP_WORKERS_BUILDS`, `MCP_GRAPHQL`
Optional MCP bindings: `MCP_CLOUDFLARE`

Evidence requirements:
- Worker level error, latency, and log evidence inside scope
- Deployment outcomes, rollback patterns, and build failures
- Concentration of incidents by service, route, or release window
- Analytics evidence that supports reliability conclusions
- Explicit limitations where observability is missing or incomplete

Report sections, in order:
- Executive reliability summary
- Scoped services and environments
- Error and latency findings
- Deployment and build findings
- Corrective action plan

Guardrails:
- No production writes or rollbacks
- Do not overstate root cause without evidence
- Engineering owners review service critical conclusions before release

Stop conditions:
- Operator cannot confirm the approved services or environments
- Required bindings are not reconnected
- Observability signals are missing for the chosen window

Every material claim in the output must cite the tool name, parameters, scope, and retrieval time. Mark unsupported targets, missing evidence, and tool errors explicitly instead of inventing findings. The output must stay as a Draft, review required PDF until a human reviewer releases it. Do not call any write or destructive tool.
```

## Operator install prompt

After uploading the `.gadget` package or accepting the Create with AI draft, paste this prompt into the Blueprint assistant inside Cloudflare OS.

```text
Help me install the Workers Observability and Reliability Report in Cloudflare OS. I have the Blueprint ready to upload or created from the Create with AI prompt. Walk me step by step: from the left navigation go to Blueprints, then More blueprint actions, then Upload archive if I have a .gadget file, or accept the Create with AI draft. Reconnect these required MCP bindings with minimum read only access: MCP_OBSERVABILITY, MCP_WORKERS_BUILDS, MCP_GRAPHQL. Treat these optional bindings as planned enrichment only if I confirm the SKU and scope: MCP_CLOUDFLARE. For every connected binding, run one harmless read only tool call and ask me to confirm the response matches the approved scope before you continue. Do not generate the final report until I confirm the scope, owner, observation window, and that every required binding returned usable evidence. Stop and ask me for confirmation before any action that changes scope, access, or writes configuration.
```

## Per binding harmless validation

- `MCP_OBSERVABILITY` (Workers Observability MCP): run one harmless read-only tool call against `https://observability.mcp.cloudflare.com/mcp` and confirm the response matches the approved scope before generating the report.
- `MCP_WORKERS_BUILDS` (Workers Builds MCP): run one harmless read-only tool call against `https://builds.mcp.cloudflare.com/mcp` and confirm the response matches the approved scope before generating the report.
- `MCP_GRAPHQL` (GraphQL Analytics MCP): run one harmless read-only tool call against `https://graphql.mcp.cloudflare.com/mcp` and confirm the response matches the approved scope before generating the report.

## References

- Cloudflare own MCP servers: https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/
- AI Horizon Workshop repo: https://github.com/chirgone/ai-horizon-workshop
- Blueprints directory: https://github.com/chirgone/ai-horizon-workshop/tree/main/blueprints

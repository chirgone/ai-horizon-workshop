# Cloudflare Radar Intelligence Report

> Assess a domain, IP, ASN, or country with traceable Radar evidence and explicit limitations.

- **Slug**: `radar-intelligence`
- **Repo home**: https://github.com/chirgone/ai-horizon-workshop/tree/main/blueprints
- **Template file**: `blueprints/templates/radar-intelligence.md`
- **Last updated**: 2026-09-30

## Decision this Blueprint supports

What does Cloudflare Radar directly show about this target, what remains unknown, and what should the team monitor next?

## Runtime inputs

These values are provided by the operator inside Cloudflare OS when the Blueprint is loaded or executed. They must not be hardcoded in the Blueprint or the `.gadget` package.

- One target type: domain, IP address, ASN, or country
- Exact target value and a fixed observation window
- Optional comparison country recorded separately from the target
- Named analyst, reviewer, and report audience

## Required MCP bindings

Every binding below uses an officially published Cloudflare remote MCP server.

| Binding | MCP server | Endpoint | Scope |
|---------|------------|----------|-------|
| `MCP_RADAR` | Cloudflare Radar MCP | `https://radar.mcp.cloudflare.com/mcp` | Named read-only tools only. create_url_scan is explicitly disabled. |

## Optional MCP bindings

Use these only when the operator confirms the SKU and scope at runtime.

_This Blueprint has no optional bindings._

## Evidence requirements

- Target specific results returned by a named Radar MCP tool
- Exact tool, parameters, target, time window, and retrieval timestamp
- Geographic comparison stored separately from target evidence
- Unsupported, failed, or intentionally skipped checks labeled explicitly

## Report sections

- Executive intelligence summary
- Target and observation window
- Direct evidence
- Geographic comparison
- Findings and limitations
- Monitoring roadmap

## Guardrails

- Never enable create_url_scan
- Do not attribute country level HTTP, DNS, or L7 data to a domain
- Keep status as Draft, review required until human review

## Stop conditions

- Operator cannot name a single target type
- MCP_RADAR is not reconnected
- Radar returns an unsupported target for the operator input

## Create with AI prompt

Copy this prompt into Cloudflare OS: Blueprints then New Blueprint then Create with AI. Review and accept each change before publishing.

```text
You are the Cloudflare OS Blueprint builder. Create a single purpose, read only assessment Blueprint titled "Cloudflare Radar Intelligence Report".

Decision this Blueprint must support:
What does Cloudflare Radar directly show about this target, what remains unknown, and what should the team monitor next?

Runtime inputs the Blueprint must ask the operator for (never hardcode account, zone, token, or scope values in the Blueprint itself):
- One target type: domain, IP address, ASN, or country
- Exact target value and a fixed observation window
- Optional comparison country recorded separately from the target
- Named analyst, reviewer, and report audience

Required MCP bindings (use these exact binding names and official endpoints): `MCP_RADAR`
Optional MCP bindings: none

Evidence requirements:
- Target specific results returned by a named Radar MCP tool
- Exact tool, parameters, target, time window, and retrieval timestamp
- Geographic comparison stored separately from target evidence
- Unsupported, failed, or intentionally skipped checks labeled explicitly

Report sections, in order:
- Executive intelligence summary
- Target and observation window
- Direct evidence
- Geographic comparison
- Findings and limitations
- Monitoring roadmap

Guardrails:
- Never enable create_url_scan
- Do not attribute country level HTTP, DNS, or L7 data to a domain
- Keep status as Draft, review required until human review

Stop conditions:
- Operator cannot name a single target type
- MCP_RADAR is not reconnected
- Radar returns an unsupported target for the operator input

Every material claim in the output must cite the tool name, parameters, scope, and retrieval time. Mark unsupported targets, missing evidence, and tool errors explicitly instead of inventing findings. The output must stay as a Draft, review required PDF until a human reviewer releases it. Do not call any write or destructive tool.
```

## Operator install prompt

After uploading the `.gadget` package or accepting the Create with AI draft, paste this prompt into the Blueprint assistant inside Cloudflare OS.

```text
Help me install the Cloudflare Radar Intelligence Report in Cloudflare OS. I have the Blueprint ready to upload or created from the Create with AI prompt. Walk me step by step: from the left navigation go to Blueprints, then More blueprint actions, then Upload archive if I have a .gadget file, or accept the Create with AI draft. Reconnect these required MCP bindings with minimum read only access: MCP_RADAR. Treat these optional bindings as planned enrichment only if I confirm the SKU and scope: none. For every connected binding, run one harmless read only tool call and ask me to confirm the response matches the approved scope before you continue. Do not generate the final report until I confirm the scope, owner, observation window, and that every required binding returned usable evidence. Stop and ask me for confirmation before any action that changes scope, access, or writes configuration.
```

## Per binding harmless validation

- `MCP_RADAR` (Cloudflare Radar MCP): run one harmless read-only tool call against `https://radar.mcp.cloudflare.com/mcp` and confirm the response matches the approved scope before generating the report.

## References

- Cloudflare own MCP servers: https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/
- AI Horizon Workshop repo: https://github.com/chirgone/ai-horizon-workshop
- Blueprints directory: https://github.com/chirgone/ai-horizon-workshop/tree/main/blueprints

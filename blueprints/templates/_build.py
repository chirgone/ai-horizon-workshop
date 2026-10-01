#!/usr/bin/env python3
"""Deterministic builder for AI Horizon Workshop Blueprint templates.

Writes one Markdown file per Blueprint under blueprints/templates/<slug>.md.

Rules enforced:
- English only (customer-facing).
- No em dashes.
- Visible product naming uses "Cloudflare OS".
- MCP bindings reference ONLY officially published remote MCP servers from
  https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/
- Templates are generic: the operator provides account, zone, scope, and
  observation window at runtime through Cloudflare OS Blueprint inputs.
- Create-with-AI prompt is a single fenced block ready for New Blueprint -> Create with AI.
- Install prompt for the operator enforces per-binding harmless read-only validation.
"""

from __future__ import annotations

import json
import pathlib
from dataclasses import dataclass, field
from datetime import date

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent

OFFICIAL_MCPS: dict[str, dict[str, str]] = {
    "MCP_CLOUDFLARE": {
        "name": "Cloudflare API MCP",
        "endpoint": "https://mcp.cloudflare.com/mcp",
        "scope": "Read-only OAuth with the minimum permissions required for the approved assessment scope.",
        "docs": "https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/",
    },
    "MCP_AUDITLOGS": {
        "name": "Audit Logs MCP",
        "endpoint": "https://auditlogs.mcp.cloudflare.com/mcp",
        "scope": "Read-only, time-bounded queries over administrative events.",
        "docs": "https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/",
    },
    "MCP_OBSERVABILITY": {
        "name": "Workers Observability MCP",
        "endpoint": "https://observability.mcp.cloudflare.com/mcp",
        "scope": "Read-only logs and metrics for Workers inside scope.",
        "docs": "https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/",
    },
    "MCP_RADAR": {
        "name": "Cloudflare Radar MCP",
        "endpoint": "https://radar.mcp.cloudflare.com/mcp",
        "scope": "Named read-only tools only. create_url_scan is explicitly disabled.",
        "docs": "https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/",
    },
    "MCP_GRAPHQL": {
        "name": "GraphQL Analytics MCP",
        "endpoint": "https://graphql.mcp.cloudflare.com/mcp",
        "scope": "Read-only analytics queries scoped to approved accounts, zones, and time windows.",
        "docs": "https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/",
    },
    "MCP_DNS_ANALYTICS": {
        "name": "DNS Analytics MCP",
        "endpoint": "https://dns-analytics.mcp.cloudflare.com/mcp",
        "scope": "Read-only DNS performance and query evidence for zones inside scope.",
        "docs": "https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/",
    },
    "MCP_CASB": {
        "name": "Cloudflare One CASB MCP",
        "endpoint": "https://casb.mcp.cloudflare.com/mcp",
        "scope": "Read-only SaaS posture and misconfiguration evidence inside scope.",
        "docs": "https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/",
    },
    "MCP_DEX": {
        "name": "Digital Experience Monitoring MCP",
        "endpoint": "https://dex.mcp.cloudflare.com/mcp",
        "scope": "Read-only DEX signals for critical applications inside scope.",
        "docs": "https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/",
    },
    "MCP_AI_GATEWAY": {
        "name": "AI Gateway MCP",
        "endpoint": "https://ai-gateway.mcp.cloudflare.com/mcp",
        "scope": "Read-only AI Gateway log and metadata queries inside scope.",
        "docs": "https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/",
    },
    "MCP_WORKERS_BUILDS": {
        "name": "Workers Builds MCP",
        "endpoint": "https://builds.mcp.cloudflare.com/mcp",
        "scope": "Read-only build, deployment, and release evidence for Workers inside scope.",
        "docs": "https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/",
    },
}


@dataclass(frozen=True)
class Template:
    slug: str
    top10: str | None  # "1" .. "10", or None for extras
    title: str
    tagline: str
    decision: str
    runtime_inputs: list[str]
    required_bindings: list[str]
    optional_bindings: list[str]
    evidence: list[str]
    report_sections: list[str]
    guardrails: list[str]
    stop_conditions: list[str]
    extra_notes: list[str] = field(default_factory=list)


TEMPLATES: list[Template] = [
    Template(
        slug="account-audit",
        top10="1",
        title="Cloudflare Account Audit Report",
        tagline="Detect weak or incomplete Cloudflare account configuration with cited evidence and prioritized remediation.",
        decision="Which account level risks must be remediated first, who owns them, and what evidence supports that priority?",
        runtime_inputs=[
            "Approved Cloudflare account ID and zone scope",
            "Named security owner and report audience",
            "Approved read-only access boundary",
            "Decision deadline and remediation horizon",
            "Observation window for audit log review",
        ],
        required_bindings=["MCP_CLOUDFLARE", "MCP_AUDITLOGS", "MCP_GRAPHQL"],
        optional_bindings=["MCP_OBSERVABILITY"],
        evidence=[
            "Account members, roles, 2FA state, and API tokens inside scope",
            "Zone, ruleset, and ownership inventory inside scope",
            "Administrative changes with actor attribution for the observation window",
            "Analytics evidence that supports material findings",
            "Explicit gaps where access or evidence is unavailable",
        ],
        report_sections=[
            "Executive decision",
            "Scope and methodology",
            "Account configuration findings",
            "Prioritized remediation and ownership",
            "30/60/90 day roadmap",
            "Evidence appendix with citations",
        ],
        guardrails=[
            "No configuration writes under any condition",
            "No material claim without a citation to tool, parameters, and retrieval time",
            "Human review owns final severity and risk acceptance",
            "Report stays in Draft, review required until human release",
        ],
        stop_conditions=[
            "Required binding is missing or not reconnected",
            "Operator declines to confirm the approved scope",
            "No audit log evidence is available for the chosen observation window",
        ],
    ),
    Template(
        slug="security-misconfiguration",
        top10="2",
        title="Security Misconfiguration Report",
        tagline="Identify missing, weak, or inconsistent Cloudflare security controls with severity and remediation steps.",
        decision="Which security misconfigurations create the most material risk, and which remediations should land first?",
        runtime_inputs=[
            "Approved account and zone scope",
            "Named security owner and change authority",
            "Critical applications and known control dependencies",
            "Remediation horizon and release audience",
            "Observation window for change evidence",
        ],
        required_bindings=["MCP_CLOUDFLARE", "MCP_AUDITLOGS", "MCP_GRAPHQL"],
        optional_bindings=["MCP_CASB"],
        evidence=[
            "Current security product configuration inside the approved scope",
            "Change history and actor attribution for material settings",
            "Analytics evidence that supports severity and business impact",
            "Observed coverage gaps, exceptions, and inconsistent policy states",
            "SaaS posture evidence when CASB is enabled and in scope",
            "Explicit evidence gaps where a control cannot be validated",
        ],
        report_sections=[
            "Executive risk summary",
            "Scope and product coverage",
            "Misconfiguration findings with severity",
            "Remediation priorities and owners",
            "Change evidence appendix",
        ],
        guardrails=[
            "No configuration writes",
            "No severity without cited evidence",
            "Control owners validate operational impact before release",
            "CASB evidence is used only when operator confirms SaaS scope",
        ],
        stop_conditions=[
            "Operator cannot confirm the approved scope or owner",
            "Required bindings are not reconnected",
            "Observation window is undefined",
        ],
    ),
    Template(
        slug="attack-surface-risk",
        top10="3",
        title="Attack Surface and Risk Report",
        tagline="Map external exposure for approved domains, DNS, APIs, and public apps with cited risk evidence.",
        decision="Which externally reachable assets create the most material risk, and which control changes reduce it fastest?",
        runtime_inputs=[
            "Approved domains, zones, and IP ranges",
            "Known business critical applications and API routes",
            "Security owner and application owner",
            "Allowed external discovery boundary and observation window",
        ],
        required_bindings=["MCP_CLOUDFLARE", "MCP_RADAR", "MCP_DNS_ANALYTICS", "MCP_GRAPHQL"],
        optional_bindings=[],
        evidence=[
            "Externally reachable hostnames, services, and routes inside scope",
            "Traffic, DNS, and threat signals linked to exposed assets",
            "Existing edge controls and verified coverage gaps",
            "Radar and GraphQL analytics that support material risk claims",
            "Unknown ownership, stale assets, and contradictory evidence",
        ],
        report_sections=[
            "Executive exposure summary",
            "Asset and service inventory",
            "Risk paths and critical domains",
            "Control coverage and gaps",
            "Sequenced reduction plan",
        ],
        guardrails=[
            "Passive and approved discovery only",
            "No scanning outside the defined boundary",
            "create_url_scan on Radar is never enabled",
            "Asset owners validate critical exposure before release",
        ],
        stop_conditions=[
            "Scope boundary is not confirmed in writing by the operator",
            "Required bindings are not reconnected",
            "Radar returns an unsupported target type for the operator input",
        ],
    ),
    Template(
        slug="waf-bot-effectiveness",
        top10="4",
        title="WAF and Bot Protection Effectiveness Report",
        tagline="Evaluate WAF, Bot Management, API Shield, and rate limiting coverage with cited traffic evidence.",
        decision="Which Internet facing paths remain under protected, and which controls reduce exploitability fastest?",
        runtime_inputs=[
            "Approved zones, hostnames, and API scope",
            "Known critical applications and high value endpoints",
            "Named application security owner",
            "Observation window for attack and traffic signals",
        ],
        required_bindings=["MCP_CLOUDFLARE", "MCP_GRAPHQL", "MCP_RADAR"],
        optional_bindings=[],
        evidence=[
            "Observed attack, request, and bot patterns for scoped applications",
            "Current WAF, Bot Management, API Shield, and rate limiting coverage",
            "Known gaps, bypass paths, and exceptions that weaken protection",
            "Control tuning opportunities supported by cited traffic evidence",
            "Explicit evidence gaps for endpoints without analytics",
        ],
        report_sections=[
            "Executive protection summary",
            "Scoped applications and endpoints",
            "Observed attack patterns",
            "Coverage gaps and vulnerable paths",
            "Recommended control changes",
        ],
        guardrails=[
            "No active testing without explicit written approval",
            "Differentiate blocked traffic from assumed exposure",
            "Application owners review high impact recommendations before release",
        ],
        stop_conditions=[
            "GraphQL returns no data for the chosen observation window",
            "Required bindings are not reconnected",
            "Operator cannot confirm high value endpoint ownership",
        ],
    ),
    Template(
        slug="zero-trust-readiness",
        top10="5",
        title="Zero Trust Readiness Report",
        tagline="Assess readiness for Access, Gateway, DLP, CASB, and device posture before scaling Zero Trust.",
        decision="What blocks Zero Trust rollout today, and which sequence closes the highest value gaps first?",
        runtime_inputs=[
            "Approved application and user population scope",
            "Named Zero Trust owner and endpoint owner",
            "Current identity, device, and remote access assumptions",
            "Target rollout horizon and control priorities",
        ],
        required_bindings=["MCP_CLOUDFLARE", "MCP_AUDITLOGS"],
        optional_bindings=["MCP_DEX", "MCP_CASB"],
        evidence=[
            "Applications, users, and access paths inside the approved scope",
            "Current Access, Gateway, DLP, CASB, and posture coverage",
            "Gaps in identity, device trust, or policy enforcement",
            "DEX signals for critical applications when DEX is enabled and in scope",
            "SaaS posture evidence when CASB is enabled and in scope",
            "Explicit exclusions and unvalidated device or user segments",
        ],
        report_sections=[
            "Executive readiness decision",
            "Scoped applications and users",
            "Access and posture findings",
            "Zero Trust control gaps",
            "Phased rollout roadmap",
        ],
        guardrails=[
            "No user content collection beyond approved scope",
            "Separate observed controls from target state recommendations",
            "Identity and endpoint owners review rollout assumptions",
            "Optional MCP evidence is used only when the operator confirms the SKU and scope",
        ],
        stop_conditions=[
            "Operator cannot confirm identity or endpoint ownership",
            "Required bindings are not reconnected",
            "Scope mixes populations without written approval",
        ],
    ),
    Template(
        slug="ai-governance-readiness",
        top10="6",
        title="AI Governance Readiness Report",
        tagline="Evaluate observed AI usage, policy coverage, visibility, and control ownership before scaling AI.",
        decision="Where can the organization safely scale AI, and which governance gaps must close before broader adoption?",
        runtime_inputs=[
            "Approved AI application and team scope",
            "Current AI policy or stated operating principles",
            "Security, legal, and data governance owners",
            "Target AI use cases and adoption timeline",
            "Observation window for AI usage evidence",
        ],
        required_bindings=["MCP_CLOUDFLARE", "MCP_AUDITLOGS", "MCP_AI_GATEWAY"],
        optional_bindings=["MCP_GRAPHQL"],
        evidence=[
            "Observed AI applications, models, teams, and usage patterns",
            "AI Gateway logs and routing evidence inside scope",
            "Policy controls mapped to actual technical visibility",
            "Data handling, logging, and ownership gaps",
            "Unobserved or unverified usage recorded as an explicit limitation",
        ],
        report_sections=[
            "Executive readiness decision",
            "Observed AI landscape",
            "Governance maturity",
            "Control gaps and ownership",
            "Adoption roadmap",
        ],
        guardrails=[
            "Do not collect prompt content unless explicitly approved",
            "Minimize personal and sensitive data in cited evidence",
            "Legal and security owners approve policy conclusions",
            "AI Gateway evidence is scoped to approved projects only",
        ],
        stop_conditions=[
            "Operator cannot confirm policy owner or application scope",
            "Required bindings are not reconnected",
            "AI Gateway returns no evidence inside the chosen window",
        ],
    ),
    Template(
        slug="ai-gateway-usage-cost",
        top10="7",
        title="AI Gateway Usage and Cost Report",
        tagline="Analyze model consumption, cost, latency, errors, caching, and provider routing with evidence.",
        decision="Which routing, caching, and model choices reduce cost without weakening reliability or governance?",
        runtime_inputs=[
            "Approved AI Gateway scope and observation window",
            "Named AI platform owner and finance reviewer",
            "Critical applications or workflows using AI",
            "Target cost and latency objectives",
        ],
        required_bindings=["MCP_AI_GATEWAY", "MCP_GRAPHQL"],
        optional_bindings=["MCP_CLOUDFLARE"],
        evidence=[
            "Model, provider, and route level usage inside scope",
            "Latency, error, and caching patterns tied to user experience or cost",
            "Routing decisions, fallback paths, and concentration risks",
            "Analytics evidence from GraphQL that confirms AI Gateway signals",
            "Observed opportunities for guardrails, caching, or provider diversification",
        ],
        report_sections=[
            "Executive optimization summary",
            "Usage and provider profile",
            "Cost and latency drivers",
            "Reliability and routing findings",
            "Optimization roadmap",
        ],
        guardrails=[
            "Do not expose prompt content unless explicitly approved",
            "Separate direct cost evidence from inferred savings",
            "Platform owners validate material routing changes before release",
        ],
        stop_conditions=[
            "AI Gateway returns no data for the chosen window",
            "Operator cannot confirm the approved projects",
            "Required bindings are not reconnected",
        ],
    ),
    Template(
        slug="workers-observability-reliability",
        top10="8",
        title="Workers Observability and Reliability Report",
        tagline="Review Workers health, deployments, logs, latency, and failure patterns across approved services.",
        decision="Which services or deployment patterns create the highest reliability risk, and what corrective actions come first?",
        runtime_inputs=[
            "Approved Worker services and environments",
            "Named engineering owner and review audience",
            "Observation window for incidents and deployments",
            "Production criticality and recovery expectations",
        ],
        required_bindings=["MCP_OBSERVABILITY", "MCP_WORKERS_BUILDS", "MCP_GRAPHQL"],
        optional_bindings=["MCP_CLOUDFLARE"],
        evidence=[
            "Worker level error, latency, and log evidence inside scope",
            "Deployment outcomes, rollback patterns, and build failures",
            "Concentration of incidents by service, route, or release window",
            "Analytics evidence that supports reliability conclusions",
            "Explicit limitations where observability is missing or incomplete",
        ],
        report_sections=[
            "Executive reliability summary",
            "Scoped services and environments",
            "Error and latency findings",
            "Deployment and build findings",
            "Corrective action plan",
        ],
        guardrails=[
            "No production writes or rollbacks",
            "Do not overstate root cause without evidence",
            "Engineering owners review service critical conclusions before release",
        ],
        stop_conditions=[
            "Operator cannot confirm the approved services or environments",
            "Required bindings are not reconnected",
            "Observability signals are missing for the chosen window",
        ],
    ),
    Template(
        slug="dns-internet-performance",
        top10="9",
        title="DNS and Internet Performance Report",
        tagline="Evaluate DNS health, query behavior, latency, and global Internet performance for approved zones.",
        decision="Which DNS and Internet performance issues deserve immediate action, and which need ongoing monitoring?",
        runtime_inputs=[
            "Approved zones, domains, and observation window",
            "Named DNS owner and report audience",
            "Known business critical domains or regional dependencies",
            "Performance objective or customer facing concern",
        ],
        required_bindings=["MCP_DNS_ANALYTICS", "MCP_RADAR", "MCP_GRAPHQL"],
        optional_bindings=["MCP_CLOUDFLARE"],
        evidence=[
            "DNS health, latency, and query trends inside scope",
            "Regional Internet signals that affect customer experience or resilience",
            "Configuration patterns linked to performance or failure risk",
            "Analytics evidence that confirms DNS findings",
            "Unknown or unverified DNS dependencies called out explicitly",
        ],
        report_sections=[
            "Executive performance summary",
            "Scoped zones and regions",
            "DNS health findings",
            "Regional Internet observations",
            "Improvement recommendations",
        ],
        guardrails=[
            "No active DNS changes",
            "Keep Radar and zone specific evidence clearly separated",
            "DNS owners validate business critical assumptions before release",
            "create_url_scan on Radar is never enabled",
        ],
        stop_conditions=[
            "Operator cannot confirm the approved zones",
            "Required bindings are not reconnected",
            "Radar returns an unsupported target for the operator input",
        ],
    ),
    Template(
        slug="compliance-evidence-pack",
        top10="10",
        title="Compliance Evidence Pack",
        tagline="Assemble audit ready evidence with cited controls, changes, exceptions, and administrative access records.",
        decision="What evidence is audit ready today, what is missing, and which exceptions require explicit owner action?",
        runtime_inputs=[
            "Approved control framework or audit objective",
            "Named compliance owner and reviewer",
            "Relevant accounts, zones, or products in scope",
            "Target audit window and delivery deadline",
        ],
        required_bindings=["MCP_CLOUDFLARE", "MCP_AUDITLOGS", "MCP_GRAPHQL"],
        optional_bindings=["MCP_CASB"],
        evidence=[
            "Configured controls mapped to the approved audit objective",
            "Recent administrative changes with actor attribution",
            "Administrative access, exceptions, and compensating controls",
            "SaaS posture evidence when CASB is enabled and in scope",
            "Explicit missing evidence or controls that need owner follow up",
        ],
        report_sections=[
            "Audit objective and scope",
            "Control evidence summary",
            "Administrative access and changes",
            "Exceptions and gaps",
            "Export package index with citations",
        ],
        guardrails=[
            "Do not claim certification or compliance status without owner approval",
            "Preserve exact evidence timestamps and scope",
            "Compliance owners validate final mapping before release",
            "CASB evidence is used only when operator confirms SaaS scope",
        ],
        stop_conditions=[
            "Audit objective or control framework is not confirmed",
            "Required bindings are not reconnected",
            "Observation window is undefined",
        ],
    ),
    Template(
        slug="radar-intelligence",
        top10=None,
        title="Cloudflare Radar Intelligence Report",
        tagline="Assess a domain, IP, ASN, or country with traceable Radar evidence and explicit limitations.",
        decision="What does Cloudflare Radar directly show about this target, what remains unknown, and what should the team monitor next?",
        runtime_inputs=[
            "One target type: domain, IP address, ASN, or country",
            "Exact target value and a fixed observation window",
            "Optional comparison country recorded separately from the target",
            "Named analyst, reviewer, and report audience",
        ],
        required_bindings=["MCP_RADAR"],
        optional_bindings=[],
        evidence=[
            "Target specific results returned by a named Radar MCP tool",
            "Exact tool, parameters, target, time window, and retrieval timestamp",
            "Geographic comparison stored separately from target evidence",
            "Unsupported, failed, or intentionally skipped checks labeled explicitly",
        ],
        report_sections=[
            "Executive intelligence summary",
            "Target and observation window",
            "Direct evidence",
            "Geographic comparison",
            "Findings and limitations",
            "Monitoring roadmap",
        ],
        guardrails=[
            "Never enable create_url_scan",
            "Do not attribute country level HTTP, DNS, or L7 data to a domain",
            "Keep status as Draft, review required until human review",
        ],
        stop_conditions=[
            "Operator cannot name a single target type",
            "MCP_RADAR is not reconnected",
            "Radar returns an unsupported target for the operator input",
        ],
    ),
]


def bullets(items: list[str]) -> str:
    return "\n".join(f"- {item}" for item in items)


def binding_table(bindings: list[str]) -> str:
    header = (
        "| Binding | MCP server | Endpoint | Scope |\n"
        "|---------|------------|----------|-------|"
    )
    rows = []
    for b in bindings:
        meta = OFFICIAL_MCPS[b]
        rows.append(f"| `{b}` | {meta['name']} | `{meta['endpoint']}` | {meta['scope']} |")
    return header + "\n" + "\n".join(rows)


def validation_checklist(bindings: list[str]) -> str:
    lines = []
    for b in bindings:
        meta = OFFICIAL_MCPS[b]
        lines.append(
            f"- `{b}` ({meta['name']}): run one harmless read-only tool call against `{meta['endpoint']}` and confirm the response matches the approved scope before generating the report."
        )
    return "\n".join(lines)


def create_with_ai_prompt(t: Template) -> str:
    required = ", ".join(f"`{b}`" for b in t.required_bindings)
    optional = ", ".join(f"`{b}`" for b in t.optional_bindings) if t.optional_bindings else "none"
    runtime_inputs_block = "\n".join(f"- {i}" for i in t.runtime_inputs)
    evidence_block = "\n".join(f"- {i}" for i in t.evidence)
    sections_block = "\n".join(f"- {i}" for i in t.report_sections)
    guardrails_block = "\n".join(f"- {i}" for i in t.guardrails)
    stop_block = "\n".join(f"- {i}" for i in t.stop_conditions)

    return (
        "You are the Cloudflare OS Blueprint builder. Create a single purpose, read only "
        f"assessment Blueprint titled \"{t.title}\".\n\n"
        f"Decision this Blueprint must support:\n{t.decision}\n\n"
        "Runtime inputs the Blueprint must ask the operator for (never hardcode account, zone, token, "
        f"or scope values in the Blueprint itself):\n{runtime_inputs_block}\n\n"
        f"Required MCP bindings (use these exact binding names and official endpoints): {required}\n"
        f"Optional MCP bindings: {optional}\n\n"
        f"Evidence requirements:\n{evidence_block}\n\n"
        f"Report sections, in order:\n{sections_block}\n\n"
        f"Guardrails:\n{guardrails_block}\n\n"
        f"Stop conditions:\n{stop_block}\n\n"
        "Every material claim in the output must cite the tool name, parameters, scope, and retrieval "
        "time. Mark unsupported targets, missing evidence, and tool errors explicitly instead of inventing "
        "findings. The output must stay as a Draft, review required PDF until a human reviewer releases it. "
        "Do not call any write or destructive tool."
    )


def install_prompt(t: Template) -> str:
    required = ", ".join(t.required_bindings)
    optional = ", ".join(t.optional_bindings) if t.optional_bindings else "none"
    return (
        f"Help me install the {t.title} in Cloudflare OS. I have the Blueprint ready to upload or "
        "created from the Create with AI prompt. Walk me step by step: from the left navigation go to "
        "Blueprints, then More blueprint actions, then Upload archive if I have a .gadget file, or "
        "accept the Create with AI draft. Reconnect these required MCP bindings with minimum read only "
        f"access: {required}. Treat these optional bindings as planned enrichment only if I confirm the "
        f"SKU and scope: {optional}. For every connected binding, run one harmless read only tool call "
        "and ask me to confirm the response matches the approved scope before you continue. Do not "
        "generate the final report until I confirm the scope, owner, observation window, and that every "
        "required binding returned usable evidence. Stop and ask me for confirmation before any action "
        "that changes scope, access, or writes configuration."
    )


def render(t: Template) -> str:
    maturity_line = ""
    if t.top10:
        maturity_line = f"- **Top 10 position**: {t.top10}\n"
    optional_block = (
        binding_table(t.optional_bindings)
        if t.optional_bindings
        else "_This Blueprint has no optional bindings._"
    )
    return f"""# {t.title}

> {t.tagline}

{maturity_line}- **Slug**: `{t.slug}`
- **Repo home**: https://github.com/chirgone/ai-horizon-workshop/tree/main/blueprints
- **Template file**: `blueprints/templates/{t.slug}.md`
- **Last updated**: {date.today().isoformat()}

## Decision this Blueprint supports

{t.decision}

## Runtime inputs

These values are provided by the operator inside Cloudflare OS when the Blueprint is loaded or executed. They must not be hardcoded in the Blueprint or the `.gadget` package.

{bullets(t.runtime_inputs)}

## Required MCP bindings

Every binding below uses an officially published Cloudflare remote MCP server.

{binding_table(t.required_bindings)}

## Optional MCP bindings

Use these only when the operator confirms the SKU and scope at runtime.

{optional_block}

## Evidence requirements

{bullets(t.evidence)}

## Report sections

{bullets(t.report_sections)}

## Guardrails

{bullets(t.guardrails)}

## Stop conditions

{bullets(t.stop_conditions)}

## Create with AI prompt

Copy this prompt into Cloudflare OS: Blueprints then New Blueprint then Create with AI. Review and accept each change before publishing.

```text
{create_with_ai_prompt(t)}
```

## Operator install prompt

After uploading the `.gadget` package or accepting the Create with AI draft, paste this prompt into the Blueprint assistant inside Cloudflare OS.

```text
{install_prompt(t)}
```

## Per binding harmless validation

{validation_checklist(t.required_bindings)}

## References

- Cloudflare own MCP servers: https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/
- AI Horizon Workshop repo: https://github.com/chirgone/ai-horizon-workshop
- Blueprints directory: https://github.com/chirgone/ai-horizon-workshop/tree/main/blueprints
"""


def main() -> None:
    out_dir = HERE
    index_rows = []
    for t in TEMPLATES:
        path = out_dir / f"{t.slug}.md"
        path.write_text(render(t), encoding="utf-8")
        top_label = t.top10 if t.top10 else "Extra"
        required = ", ".join(f"`{b}`" for b in t.required_bindings)
        optional = ", ".join(f"`{b}`" for b in t.optional_bindings) if t.optional_bindings else "none"
        index_rows.append(
            f"| {top_label} | [{t.title}](./{t.slug}.md) | {required} | {optional} |"
        )

    index = f"""# Blueprint Templates

Each Blueprint in the AI Horizon Workshop has a sanitized specification and a Create with AI prompt. Use these to recreate the Blueprint from scratch inside any Cloudflare OS workspace. All MCP bindings reference officially published Cloudflare remote MCP servers.

The source of truth for binary `.gadget` archives is `blueprints/manifest.json` and the files alongside it.

| Top 10 | Template | Required bindings | Optional bindings |
|--------|----------|-------------------|-------------------|
{chr(10).join(index_rows)}

## How to use a template

1. Open the template `.md` for the Blueprint you want.
2. Copy the Create with AI prompt into Cloudflare OS: Blueprints then New Blueprint then Create with AI.
3. Review and accept each change the assistant proposes.
4. Reconnect the required MCP bindings using the exact official endpoints listed in the template.
5. Run the per binding harmless validation reads before generating any report.
6. Keep the output as Draft, review required until a human reviewer releases it.

## References

- Cloudflare own MCP servers: https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/
- Blueprints directory: https://github.com/chirgone/ai-horizon-workshop/tree/main/blueprints
"""
    (out_dir / "README.md").write_text(index, encoding="utf-8")

    # Emit a machine readable index so manifest.json can be synced without string parsing.
    machine_index = {
        "schemaVersion": 1,
        "generatedAt": date.today().isoformat(),
        "templates": [
            {
                "slug": t.slug,
                "top10": t.top10,
                "title": t.title,
                "file": f"blueprints/templates/{t.slug}.md",
                "requiredBindings": list(t.required_bindings),
                "optionalBindings": list(t.optional_bindings),
                "requiredEndpoints": {b: OFFICIAL_MCPS[b]["endpoint"] for b in t.required_bindings},
                "optionalEndpoints": {b: OFFICIAL_MCPS[b]["endpoint"] for b in t.optional_bindings},
                "publicUrl": f"https://github.com/chirgone/ai-horizon-workshop/blob/main/blueprints/templates/{t.slug}.md",
                "rawUrl": f"https://raw.githubusercontent.com/chirgone/ai-horizon-workshop/main/blueprints/templates/{t.slug}.md",
                "createWithAIPrompt": create_with_ai_prompt(t),
                "installPrompt": install_prompt(t),
            }
            for t in TEMPLATES
        ],
    }
    (out_dir / "index.json").write_text(json.dumps(machine_index, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()

# Top Report Blueprints

Planning catalog for the next wave of report-oriented Blueprints.

This list is intentionally separate from `manifest.json` and the installable `.gadget` archives in this directory. Items here are proposed concepts until each one has a validated archive, manifest entry, route copy, and workshop flow.

## Proposed Catalog

| # | Blueprint | Objective | Suggested MCPs | Expected Output |
| --- | --- | --- | --- | --- |
| 1 | Cloudflare Account Audit Report | Detect incomplete or weak account configuration. | Cloudflare API, Audit Logs, GraphQL | Configuration gaps, permissions, ownership, zones, rules, tokens, and audit findings. |
| 2 | Security Misconfiguration Report | Identify missing or misconfigured security controls. | Cloudflare API, CASB, Audit Logs | Product-by-product risks, severity, impact, and remediation steps. |
| 3 | Attack Surface and Risk Report | Map external exposure, public applications, DNS, APIs, and likely attack paths. | Radar, DNS Analytics, GraphQL, Cloudflare API | Exposed surface, critical domains, traffic patterns, and risk findings. |
| 4 | WAF and Bot Protection Effectiveness Report | Evaluate whether WAF, Bot Management, API Shield, and rate limiting are protecting the right paths. | GraphQL, Cloudflare API, Radar | Blocked attacks, missing rules, vulnerable endpoints, and recommendations. |
| 5 | Zero Trust Readiness Report | Assess readiness for ZTNA, Access, Gateway, DLP, CASB, and device posture. | Cloudflare API, DEX, CASB, Audit Logs | Access gaps, unprotected apps, incomplete posture, and a Zero Trust roadmap. |
| 6 | AI Governance Readiness Report | Identify Shadow AI, missing prompt controls, model visibility gaps, DLP gaps, and AI Gateway needs. | AI Gateway, Cloudflare API, Audit Logs | AI usage, data risks, costs, prompts, providers, and missing controls. |
| 7 | AI Gateway Usage and Cost Report | Analyze model usage, cost, latency, errors, caching, and provider routing. | AI Gateway, GraphQL | Cost optimization opportunities, multi-model resilience, and guardrail recommendations. |
| 8 | Workers Observability and Reliability Report | Review Workers health, errors, builds, logs, and performance. | Observability, Workers Builds, GraphQL | Error-prone services, failed deployments, latency, relevant logs, and corrective actions. |
| 9 | DNS and Internet Performance Report | Evaluate DNS health, latency, errors, configuration quality, and global performance. | DNS Analytics, Radar, GraphQL | DNS issues, critical zones, regional performance, and recommendations. |
| 10 | Compliance Evidence Pack | Generate reusable evidence for internal or regulatory audit. | Audit Logs, Cloudflare API, CASB, GraphQL | Configured controls, recent changes, administrative access, exceptions, and exportable evidence. |

## Recommended Sequencing

1. Keep the currently published Blueprints as the installable baseline.
2. Prioritize the next installable set by operator value and MCP readiness.
3. Build each Blueprint only after its evidence model, report sections, and guardrails are explicit.
4. Do not mark a Blueprint as published until its archive, manifest, route copy, and workshop exercise are all validated.

## Suggested Next Installable Candidates

1. Security Misconfiguration Report
2. WAF and Bot Protection Effectiveness Report
3. Zero Trust Readiness Report
4. AI Gateway Usage and Cost Report

## Design Notes

- Use one primary decision per report.
- Keep every report read-only by default.
- Separate direct evidence from inferred conclusions.
- Make ownership and remediation horizon explicit in every output.
- Keep non-Top-10 add-ons, such as Radar intelligence, clearly labeled when they remain in the catalog.

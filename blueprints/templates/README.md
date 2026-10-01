# Blueprint Templates

Each Blueprint in the AI Horizon Workshop has a sanitized specification and a Create with AI prompt. Use these to recreate the Blueprint from scratch inside any Cloudflare OS workspace. All MCP bindings reference officially published Cloudflare remote MCP servers.

The source of truth for binary `.gadget` archives is `blueprints/manifest.json` and the files alongside it.

| Top 10 | Template | Required bindings | Optional bindings |
|--------|----------|-------------------|-------------------|
| 1 | [Cloudflare Account Audit Report](./account-audit.md) | `MCP_CLOUDFLARE`, `MCP_AUDITLOGS`, `MCP_GRAPHQL` | `MCP_OBSERVABILITY` |
| 2 | [Security Misconfiguration Report](./security-misconfiguration.md) | `MCP_CLOUDFLARE`, `MCP_AUDITLOGS`, `MCP_GRAPHQL` | `MCP_CASB` |
| 3 | [Attack Surface and Risk Report](./attack-surface-risk.md) | `MCP_CLOUDFLARE`, `MCP_RADAR`, `MCP_DNS_ANALYTICS`, `MCP_GRAPHQL` | none |
| 4 | [WAF and Bot Protection Effectiveness Report](./waf-bot-effectiveness.md) | `MCP_CLOUDFLARE`, `MCP_GRAPHQL`, `MCP_RADAR` | none |
| 5 | [Zero Trust Readiness Report](./zero-trust-readiness.md) | `MCP_CLOUDFLARE`, `MCP_AUDITLOGS` | `MCP_DEX`, `MCP_CASB` |
| 6 | [AI Governance Readiness Report](./ai-governance-readiness.md) | `MCP_CLOUDFLARE`, `MCP_AUDITLOGS`, `MCP_AI_GATEWAY` | `MCP_GRAPHQL` |
| 7 | [AI Gateway Usage and Cost Report](./ai-gateway-usage-cost.md) | `MCP_AI_GATEWAY`, `MCP_GRAPHQL` | `MCP_CLOUDFLARE` |
| 8 | [Workers Observability and Reliability Report](./workers-observability-reliability.md) | `MCP_OBSERVABILITY`, `MCP_WORKERS_BUILDS`, `MCP_GRAPHQL` | `MCP_CLOUDFLARE` |
| 9 | [DNS and Internet Performance Report](./dns-internet-performance.md) | `MCP_DNS_ANALYTICS`, `MCP_RADAR`, `MCP_GRAPHQL` | `MCP_CLOUDFLARE` |
| 10 | [Compliance Evidence Pack](./compliance-evidence-pack.md) | `MCP_CLOUDFLARE`, `MCP_AUDITLOGS`, `MCP_GRAPHQL` | `MCP_CASB` |
| Extra | [Cloudflare Radar Intelligence Report](./radar-intelligence.md) | `MCP_RADAR` | none |

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

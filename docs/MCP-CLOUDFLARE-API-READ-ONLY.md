# Cloudflare API MCP Read-Only Integration

## Workshop baseline

The hands-on workshop does not start with the Cloudflare API MCP server. Each participant deploys
the reviewed Cloudflare OS workshop starter to their own account. The starter includes the generic
`gatekeeper-mcp` Worker and its private router and Workshop service bindings.

Participants then connect the public Cloudflare Documentation MCP endpoint:

`https://docs.mcp.cloudflare.com/mcp`

The connection requires no Cloudflare account OAuth and grants only these named read-only tools:

- `search_cloudflare_documentation`
- `migrate_pages_to_workers_guide`

The participant must use **Choose tools**, run one harmless documentation search, and confirm the
result is recorded as an observation. **All tools**, API tokens, and account authorization are not
part of the baseline lab.

## Future account integration design

This design is not installed by the current workshop starter. A future account-enabled deployment
will use the upstream `gatekeeper-mcp-portal` Worker. The deployment administrator
configures one Cloudflare MCP Server Portal URL, and participants cannot substitute another MCP
endpoint. The portal exposes Cloudflare's managed API MCP server as an approved upstream.

## Required controls

All controls below are mandatory:

1. The administrator fixes the portal endpoint in deployment configuration.
2. The portal enables **Require user auth** and allows only workshop participants.
3. Cloudflare API is added as `https://mcp.cloudflare.com/mcp?codemode=false` with a fixed,
   administrator-owned read-only tool allowlist.
4. Each participant connects using their own OAuth identity.
5. The upstream OAuth grant is scoped to the lab account with **Read only** permissions.
6. Facilitators use **Choose tools** as an additional least-privilege procedure.
7. `MCP_PORTAL_TRUST_ANNOTATIONS` remains false.
8. No API token is pasted into Cloudflare OS, prompts, workshop pages, or source control.

The portal, OAuth grant, and Gatekeeper provide separate enforcement. The portal fixes the approved
server and read-only tool catalog. Cloudflare OAuth rejects writes and access outside the selected
account. The Gatekeeper refuses tools outside a named workspace grant.

`MCP_PORTAL_TRUST_ANNOTATIONS=false` prevents write annotations from enabling auto-approval, but the
Gatekeeper still honors `readOnlyHint`. The portal allowlist and OAuth permissions are therefore the
authoritative write barriers if an upstream tool is annotated incorrectly.

## Future deployment shape

A future account-enabled starter would add the upstream `gatekeeper-mcp-portal` package as a private
Worker:

- Router binding: `GATEKEEPER_MCP_PORTAL`, no entrypoint.
- Workshop binding: `GATEKEEPER_MCP_PORTAL`, `GatekeeperVendor` entrypoint.
- OAuth base URL: `<PUBLIC_BASE_URL>/gatekeeper/mcp-portal`.
- Preview URLs and `workers.dev` are disabled on the Gatekeeper Worker.
- Existing upstream Durable Object migrations are preserved.

The MCP binding is owner-only. Shared workshop artifacts must be published as Blueprints so each
participant reconnects using their own credentials.

## Deployment prerequisites

- Membership in the Cloudflare account that owns the current hosted Cloudflare OS deployment.
- Exact existing Worker names, KV namespace IDs, R2 bucket name, public origin, Access settings, and
  AI Gateway name.
- Cloudflare MCP Server Portal URL, **Require user auth** evidence, and reviewed Access and tool
  policies.
- Confirmation whether an MCP Portal Gatekeeper Worker already exists in the hosted deployment.
- A reviewed migration configuration that reuses the existing backend Worker identity and storage.

Do not deploy if any existing Worker or storage identity is unknown. A successful deploy with new
identities would present an empty Cloudflare OS instance.

## Acceptance tests

1. A participant authorizes only the lab account with **Read only** permissions.
2. The portal requires per-user authentication and lists only approved read-only tools.
3. A harmless account inventory read succeeds and is recorded as an observation or approval event.
4. An unselected tool is refused by the Gatekeeper.
5. A write request is rejected by the read-only OAuth grant.
6. A deliberately misclassified write tool is absent from the portal allowlist or rejected by OAuth.
7. A second participant must establish a separate OAuth connection.
8. Existing workspaces, Blueprints, Context collections, schedules, Access login, and model catalog
   remain intact after migration.

## Sources

- [Cloudflare API MCP server](https://developers.cloudflare.com/agents/model-context-protocol/cloudflare/servers-for-cloudflare/)
- [Cloudflare MCP Server Portals](https://developers.cloudflare.com/cloudflare-one/access-controls/ai-controls/mcp-portals/)
- [Cloudflare MCP repository](https://github.com/cloudflare/mcp)
- Upstream Cloudflare OS `packages/gatekeeper-mcp-portal/README.md`
- Cloudflare OS starter `docs/migrate-from-hosted.md`

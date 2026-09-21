# Corporate Test Connector Catalog

This catalog records the workshop-safe contract exposed by the sample applications. It does not deploy, authorize, or connect a system.

## Default boundary

- Remote MCP connections use OAuth 2.1 and delegate user authentication to Cloudflare Access.
- MCP scopes are read-only: `crm:read`, `hr:read`, `relay:read`, and `wiki:read`.
- Every MCP collection response is capped at 25 records by the server.
- Validation starts with `whoami`, which returns only the signed-in test identity.
- FlareID validation reads public OIDC discovery metadata only.
- No credentials, tokens, or sample passwords belong in the workshop front-end.

## Cloudflare Documentation MCP lab

- Each participant deploys the reviewed workshop starter to their own Cloudflare account.
- The starter installs the generic `gatekeeper-mcp` Worker behind private service bindings.
- Participants connect `https://docs.mcp.cloudflare.com/mcp` without OAuth or an API token.
- **Choose tools** grants only `search_cloudflare_documentation` and
  `migrate_pages_to_workers_guide`.
- One harmless documentation search validates the connection and must be recorded as an observation.
- **All tools** and `https://mcp.cloudflare.com/mcp` are excluded from the baseline lab.

## Future Cloudflare API account audit

- This integration is not installed by the current workshop starter.
- A future account-enabled deployment connects only to an administrator-configured Cloudflare MCP Server Portal.
- The portal enables **Require user auth** and includes
  `https://mcp.cloudflare.com/mcp?codemode=false` as an approved upstream with a bounded,
  administrator-owned read-only tool allowlist.
- Each participant authorizes their own identity through portal OAuth and the upstream Cloudflare
  grant is restricted to the workshop account with **Read only** permissions.
- Facilitators use **Choose tools** as an additional least-privilege procedure. The portal allowlist
  and read-only OAuth grant remain safe even if a participant selects **All tools**.
- Named-tool scope refuses unselected operations and tools added by the server later.
- Write annotations cannot enable auto-approval. `readOnlyHint` is still honored, so the portal
  allowlist and OAuth permissions remain the authoritative write barriers.
- The connection is owner-only. Shared workshop artifacts must be published as Blueprints so every
  participant reconnects with their own credentials.
- No API token is pasted into Cloudflare OS, a prompt, the workshop front-end, or this repository.

Source: [Cloudflare API MCP server](https://developers.cloudflare.com/agents/model-context-protocol/cloudflare/servers-for-cloudflare/).
Portal controls: [Cloudflare MCP Server Portals](https://developers.cloudflare.com/cloudflare-one/access-controls/ai-controls/mcp-portals/).

## Connectors

| Connector | Protocol | Allowed contract | Explicitly excluded |
| --- | --- | --- | --- |
| Pipeline CRM | MCP OAuth 2.1, `crm:read` | Companies, contacts, deals, activities, reps, `whoami` | `log_deal_activity` |
| WorkWeek HR | MCP OAuth 2.1, `hr:read` | Directory-safe employees, org chart, departments, `whoami` | Home addresses, time-off data, and write operations |
| Relay Collaboration | MCP OAuth 2.1, `relay:read` | Email, meetings, attendees, directory, `whoami` | `mark_email_read`, `respond_to_meeting` |
| Nexus Wiki | MCP OAuth 2.1, `wiki:read` | Spaces, pages, search, history, users, `whoami` | `create_page`, `update_page` |
| FlareID Identity | OpenID Connect | Discovery, JWKS, userinfo, identity and group claims | Administration and mutation operations |

## Source contracts

- `sample-apps/crm-app/mcp/src/tools/crm.ts`
- `sample-apps/hr-app/mcp/src/tools/employees.ts`
- `sample-apps/collab-app/mcp/src/tools/relay.ts`
- `sample-apps/wiki-app/mcp/src/tools/wiki.ts`
- `sample-apps/flareid-idp/README.md`

The underlying sample APIs retain selected write endpoints for later security exercises. Their MCP servers do not register those operations, so the Sprint 4 connector contract is read-only at the source.

## Approved workshop hosts

- `crm-mcp.cloudflaredemos.com`
- `hr-mcp.cloudflaredemos.com`
- `work-mcp.cloudflaredemos.com`
- `wiki-mcp.cloudflaredemos.com`
- `horizon-idp.cloudflaredemos.com`

The front-end preflight checks these exact HTTPS origins and expected paths locally, rejecting embedded credentials and alternate ports. If `wire-access.sh` provisions another zone, update the catalog allowlist before the workshop. The preflight does not contact an endpoint or prove that a live server is trustworthy. A facilitator must verify the live deployment before starting OAuth.

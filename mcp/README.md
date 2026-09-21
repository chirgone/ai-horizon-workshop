# Corporate Test Connector Catalog

This catalog records the workshop-safe contract exposed by the sample applications. It does not deploy, authorize, or connect a system.

## Default boundary

- Remote MCP connections use OAuth 2.1 and delegate user authentication to Cloudflare Access.
- MCP scopes are read-only: `crm:read`, `hr:read`, `relay:read`, and `wiki:read`.
- Every MCP collection response is capped at 25 records by the server.
- Validation starts with `whoami`, which returns only the signed-in test identity.
- FlareID validation reads public OIDC discovery metadata only.
- No credentials, tokens, or sample passwords belong in the workshop front-end.

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

import type { OAuthHelpers } from "@cloudflare/workers-oauth-provider";

export interface Env {
  HrMcpAgent: DurableObjectNamespace;
  OAUTH_KV: KVNamespace;
  OAUTH_PROVIDER: OAuthHelpers;
  API_BASE_URL: string;

  // This MCP server is its own standalone OAuth 2.1 authorization server (portable
  // to any MCP client/harness), which delegates end-user login to Cloudflare Access
  // as its upstream OIDC provider - the same pattern as Cloudflare's official
  // remote-mcp-cf-access demo. Configure an "Access for SaaS" OIDC application and
  // set these accordingly (see hr-app/README.md).
  ACCESS_AUTHORIZATION_URL: string;
  ACCESS_TOKEN_URL: string;
  ACCESS_JWKS_URL: string;
  /** Set via `wrangler secret put ACCESS_CLIENT_ID`. */
  ACCESS_CLIENT_ID?: string;
  /** Set via `wrangler secret put ACCESS_CLIENT_SECRET`. */
  ACCESS_CLIENT_SECRET?: string;
  /** Set via `wrangler secret put COOKIE_ENCRYPTION_KEY` (any random string, e.g. `openssl rand -hex 32`). */
  COOKIE_ENCRYPTION_KEY?: string;

  /** Shared secret sent to the `api` worker's internal /internal/* routes. Set via `wrangler secret put MCP_INTERNAL_SECRET`. */
  MCP_INTERNAL_SECRET?: string;
}

/** Identity + credential embedded in each MCP OAuth grant's encrypted props. */
export interface McpProps {
  employeeId: number;
  email: string;
  name: string;
  /** Per-user `api` bearer token, minted once at authorization time and cached in DO state thereafter. */
  apiToken: string;
  [key: string]: unknown;
}

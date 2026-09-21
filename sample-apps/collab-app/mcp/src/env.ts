import type { OAuthHelpers } from "@cloudflare/workers-oauth-provider";

export interface Env {
  RelayMcpAgent: DurableObjectNamespace;
  OAUTH_KV: KVNamespace;
  OAUTH_PROVIDER: OAuthHelpers;
  API_BASE_URL: string;

  // This MCP server is its own standalone OAuth 2.1 authorization server (portable
  // to any MCP client/harness), which delegates end-user login to Cloudflare Access
  // as its upstream OIDC provider - same pattern as hr-app-mcp/crm-app-mcp.
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
  userId: number;
  email: string;
  name: string;
  /** Per-user `api` bearer token, minted once at authorization time and cached in DO state thereafter. */
  apiToken: string;
  [key: string]: unknown;
}

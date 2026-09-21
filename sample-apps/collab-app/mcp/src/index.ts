import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { OAuthProvider } from "@cloudflare/workers-oauth-provider";
import type { Env, McpProps } from "./env.js";
import { registerRelayTools } from "./tools/relay.js";
import { handleAccessRequest } from "./access-handler.js";

export class RelayMcpAgent extends McpAgent<Env, Record<string, never>, McpProps> {
  server = new McpServer({
    name: "collab-app-mcp",
    version: "1.0.0",
  });

  async init() {
    // `this.props` is populated from the OAuth grant's encrypted props (set at
    // /authorize/consent time) before init() runs - see access-handler.ts.
    registerRelayTools(this.server, this.env, this.props!);
  }
}

export default new OAuthProvider<Env>({
  apiRoute: "/mcp",
  // `agents`'s McpAgent.serve() defaults to looking up a binding named
  // MCP_OBJECT - our Durable Object binding in wrangler.jsonc is named
  // RelayMcpAgent instead, so it must be passed explicitly here.
  apiHandler: RelayMcpAgent.serve("/mcp", { binding: "RelayMcpAgent" }),
  defaultHandler: { fetch: handleAccessRequest },

  authorizeEndpoint: "/authorize",
  tokenEndpoint: "/token",
  clientRegistrationEndpoint: "/register",

  scopesSupported: ["relay:read"],
});

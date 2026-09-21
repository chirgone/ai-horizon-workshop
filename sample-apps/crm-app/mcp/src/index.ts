import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { OAuthProvider } from "@cloudflare/workers-oauth-provider";
import type { Env, McpProps } from "./env.js";
import { registerCrmTools } from "./tools/crm.js";
import { handleAccessRequest } from "./access-handler.js";

export class CrmMcpAgent extends McpAgent<Env, Record<string, never>, McpProps> {
  server = new McpServer({
    name: "crm-app-mcp",
    version: "1.0.0",
  });

  async init() {
    // `this.props` is populated from the OAuth grant's encrypted props (set at
    // /authorize/consent time) before init() runs - see access-handler.ts.
    registerCrmTools(this.server, this.env, this.props!);
  }
}

export default new OAuthProvider<Env>({
  apiRoute: "/mcp",
  // `agents`'s McpAgent.serve() defaults to looking up a binding named
  // MCP_OBJECT - our Durable Object binding in wrangler.jsonc is named
  // CrmMcpAgent instead, so it must be passed explicitly here.
  apiHandler: CrmMcpAgent.serve("/mcp", { binding: "CrmMcpAgent" }),
  defaultHandler: { fetch: handleAccessRequest },

  authorizeEndpoint: "/authorize",
  tokenEndpoint: "/token",
  clientRegistrationEndpoint: "/register",

  scopesSupported: ["crm:read"],
});

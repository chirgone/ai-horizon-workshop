import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { OAuthProvider } from "@cloudflare/workers-oauth-provider";
import type { Env, McpProps } from "./env.js";
import { registerEmployeeTools } from "./tools/employees.js";
import { handleAccessRequest } from "./access-handler.js";

export class HrMcpAgent extends McpAgent<Env, Record<string, never>, McpProps> {
  server = new McpServer({
    name: "hr-app-mcp",
    version: "1.0.0",
  });

  async init() {
    // `this.props` is populated from the OAuth grant's encrypted props (set at
    // /authorize/consent time) before init() runs - see auth-handler.ts.
    registerEmployeeTools(this.server, this.env, this.props!);
  }
}

export default new OAuthProvider<Env>({
  apiRoute: "/mcp",
  // `agents`'s McpAgent.serve() defaults to looking up a binding named
  // MCP_OBJECT - our Durable Object binding in wrangler.jsonc is named
  // HrMcpAgent instead, so it must be passed explicitly here.
  apiHandler: HrMcpAgent.serve("/mcp", { binding: "HrMcpAgent" }),
  defaultHandler: { fetch: handleAccessRequest },

  authorizeEndpoint: "/authorize",
  tokenEndpoint: "/token",
  clientRegistrationEndpoint: "/register",

  scopesSupported: ["hr:read"],
});

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Activity, Company, Contact, Deal, PaginatedResult, Rep } from "@crm-app/shared";
import type { Env, McpProps } from "../env.js";
import { apiFetch } from "../client.js";

// Hard cap enforced by the MCP server itself, independent of whatever page size the
// underlying REST API would otherwise allow - the app's own guardrail against bulk
// extraction, on top of whatever Access/Gateway/AI Gateway policy is layered on top.
const MAX_TOOL_PAGE_SIZE = 25;

function textResult(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] };
}

function cappedCollection<T>(data: T[]) {
  return { data: data.slice(0, MAX_TOOL_PAGE_SIZE), truncated: data.length > MAX_TOOL_PAGE_SIZE, limit: MAX_TOOL_PAGE_SIZE };
}

export function registerCrmTools(server: McpServer, env: Env, props: McpProps) {
  const call = <T>(path: string, init?: RequestInit) => apiFetch<T>(env, props.apiToken, path, init);

  server.registerTool(
    "list_companies",
    {
      description:
        "Search/list companies (accounts) visible to you - your own, plus any owned by your reports. Capped at 25 per page.",
      inputSchema: {
        query: z.string().optional().describe("Free-text search across company name and industry"),
        page: z.number().int().min(1).optional().default(1),
      },
    },
    async ({ query, page }) => {
      const params = new URLSearchParams();
      if (query) params.set("search", query);
      params.set("page", String(page ?? 1));
      params.set("pageSize", String(MAX_TOOL_PAGE_SIZE));
      const result = await call<PaginatedResult<Company>>(`/api/v1/companies?${params.toString()}`);
      return textResult(result);
    }
  );

  server.registerTool(
    "get_company",
    {
      description: "Get a single company's details by id.",
      inputSchema: { company_id: z.number().int() },
    },
    async ({ company_id }) => textResult(await call<Company>(`/api/v1/companies/${company_id}`))
  );

  server.registerTool(
    "list_company_contacts",
    {
      description: "List the contacts at a company.",
      inputSchema: { company_id: z.number().int() },
    },
    async ({ company_id }) => {
      const result = await call<{ data: Contact[] }>(`/api/v1/companies/${company_id}/contacts`);
      return textResult(cappedCollection(result.data));
    }
  );

  server.registerTool(
    "list_company_deals",
    {
      description: "List the deals associated with a company.",
      inputSchema: { company_id: z.number().int() },
    },
    async ({ company_id }) => {
      const result = await call<{ data: Deal[] }>(`/api/v1/companies/${company_id}/deals`);
      return textResult(cappedCollection(result.data));
    }
  );

  server.registerTool(
    "list_deals",
    {
      description:
        "Search/list deals visible to you - your own, plus any owned by your reports. Capped at 25 per page.",
      inputSchema: {
        query: z.string().optional().describe("Free-text search across deal name"),
        stage: z
          .enum(["prospecting", "qualification", "proposal", "negotiation", "closed_won", "closed_lost"])
          .optional(),
        page: z.number().int().min(1).optional().default(1),
      },
    },
    async ({ query, stage, page }) => {
      const params = new URLSearchParams();
      if (query) params.set("search", query);
      if (stage) params.set("stage", stage);
      params.set("page", String(page ?? 1));
      params.set("pageSize", String(MAX_TOOL_PAGE_SIZE));
      const result = await call<PaginatedResult<Deal>>(`/api/v1/deals?${params.toString()}`);
      return textResult(result);
    }
  );

  server.registerTool(
    "get_deal",
    {
      description: "Get a single deal's details by id.",
      inputSchema: { deal_id: z.number().int() },
    },
    async ({ deal_id }) => textResult(await call<Deal>(`/api/v1/deals/${deal_id}`))
  );

  server.registerTool(
    "list_deal_activities",
    {
      description: "List the call/email/meeting/note activity history logged against a deal.",
      inputSchema: { deal_id: z.number().int() },
    },
    async ({ deal_id }) => {
      const result = await call<{ data: Activity[] }>(`/api/v1/deals/${deal_id}/activities`);
      return textResult(cappedCollection(result.data));
    }
  );

  server.registerTool(
    "list_reps",
    {
      description: "List the sales reps in the CRM directory.",
      inputSchema: {},
    },
    async () => {
      const result = await call<{ data: Rep[] }>("/api/v1/reps");
      return textResult(cappedCollection(result.data));
    }
  );

  server.registerTool(
    "whoami",
    {
      description: "Get the identity of the currently signed-in MCP user (you).",
      inputSchema: {},
    },
    async () => textResult({ repId: props.repId, email: props.email, name: props.name })
  );
}

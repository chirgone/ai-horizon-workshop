import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Page, PageVersion, PaginatedResult, Space, User } from "@wiki-app/shared";
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

export function registerWikiTools(server: McpServer, env: Env, props: McpProps) {
  const call = <T>(path: string, init?: RequestInit) => apiFetch<T>(env, props.apiToken, path, init);

  server.registerTool(
    "list_spaces",
    {
      description:
        "List the wiki spaces visible to you - every public space, plus any restricted space you own or are a member of.",
      inputSchema: {},
    },
    async () => {
      const result = await call<{ data: Space[] }>("/api/v1/spaces");
      return textResult(cappedCollection(result.data));
    }
  );

  server.registerTool(
    "get_space",
    {
      description: "Get a single space's details by id.",
      inputSchema: { space_id: z.number().int() },
    },
    async ({ space_id }) => textResult(await call<Space>(`/api/v1/spaces/${space_id}`))
  );

  server.registerTool(
    "list_space_pages",
    {
      description: "List the pages in a space (title/metadata only - use get_page for the body).",
      inputSchema: { space_id: z.number().int() },
    },
    async ({ space_id }) => {
      const result = await call<{ data: Page[] }>(`/api/v1/spaces/${space_id}/pages`);
      return textResult(cappedCollection(result.data));
    }
  );

  server.registerTool(
    "search_pages",
    {
      description:
        "Search page titles/bodies across every space visible to you. Capped at 25 per page - use `page` to paginate.",
      inputSchema: {
        query: z.string().optional(),
        page: z.number().int().min(1).optional().default(1),
      },
    },
    async ({ query, page }) => {
      const params = new URLSearchParams();
      if (query) params.set("search", query);
      params.set("page", String(page ?? 1));
      params.set("pageSize", String(MAX_TOOL_PAGE_SIZE));
      const result = await call<PaginatedResult<Page>>(`/api/v1/pages?${params.toString()}`);
      return textResult(result);
    }
  );

  server.registerTool(
    "get_page",
    {
      description: "Get a single page's full content by id.",
      inputSchema: { page_id: z.number().int() },
    },
    async ({ page_id }) => textResult(await call<Page>(`/api/v1/pages/${page_id}`))
  );

  server.registerTool(
    "get_page_history",
    {
      description: "List prior revisions of a page's body, most recent first.",
      inputSchema: { page_id: z.number().int() },
    },
    async ({ page_id }) => {
      const result = await call<{ data: PageVersion[] }>(`/api/v1/pages/${page_id}/history`);
      return textResult(cappedCollection(result.data));
    }
  );

  server.registerTool(
    "list_users",
    {
      description: "List the people in the company directory (for attributing/assigning pages).",
      inputSchema: {},
    },
    async () => {
      const result = await call<{ data: User[] }>("/api/v1/users");
      return textResult(cappedCollection(result.data));
    }
  );

  server.registerTool(
    "whoami",
    {
      description: "Get the identity of the currently signed-in MCP user (you).",
      inputSchema: {},
    },
    async () => textResult({ userId: props.userId, email: props.email, name: props.name })
  );
}

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Email, MeetingWithResponse, PaginatedResult, User } from "@collab-app/shared";
import type { Env, McpProps } from "../env.js";
import { apiFetch } from "../client.js";

// Hard cap enforced by the MCP server itself, independent of whatever page size the
// underlying REST API would otherwise allow - the app's own guardrail against bulk
// extraction, on top of whatever Access/Gateway/AI Gateway policy is layered on top.
const MAX_TOOL_PAGE_SIZE = 25;

function textResult(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] };
}

export function registerRelayTools(server: McpServer, env: Env, props: McpProps) {
  const call = <T>(path: string, init?: RequestInit) => apiFetch<T>(env, props.apiToken, path, init);

  server.registerTool(
    "list_emails",
    {
      description:
        "Search/list emails in your own mailbox (never someone else's). Capped at 25 per page - use `page` to paginate.",
      inputSchema: {
        query: z.string().optional().describe("Free-text search across subject, sender, and body"),
        folder: z.enum(["inbox", "sent", "archive"]).optional(),
        page: z.number().int().min(1).optional().default(1),
      },
    },
    async ({ query, folder, page }) => {
      const params = new URLSearchParams();
      if (query) params.set("search", query);
      if (folder) params.set("folder", folder);
      params.set("page", String(page ?? 1));
      params.set("pageSize", String(MAX_TOOL_PAGE_SIZE));
      const result = await call<PaginatedResult<Email>>(`/api/v1/emails?${params.toString()}`);
      return textResult(result);
    }
  );

  server.registerTool(
    "get_email",
    {
      description: "Get a single email from your own mailbox by id.",
      inputSchema: { email_id: z.number().int() },
    },
    async ({ email_id }) => textResult(await call<Email>(`/api/v1/emails/${email_id}`))
  );

  server.registerTool(
    "mark_email_read",
    {
      description: "Mark an email in your own mailbox as read or unread.",
      inputSchema: { email_id: z.number().int(), is_read: z.boolean() },
    },
    async ({ email_id, is_read }) =>
      textResult(
        await call<Email>(`/api/v1/emails/${email_id}/read`, {
          method: "PATCH",
          body: JSON.stringify({ is_read }),
        })
      )
  );

  server.registerTool(
    "list_meetings",
    {
      description:
        "List meetings on your own calendar - ones you organize, or are invited to. Capped at 25 per page.",
      inputSchema: {
        query: z.string().optional().describe("Free-text search across meeting title"),
        from: z.string().optional().describe("ISO datetime lower bound on start_time"),
        to: z.string().optional().describe("ISO datetime upper bound on start_time"),
        page: z.number().int().min(1).optional().default(1),
      },
    },
    async ({ query, from, to, page }) => {
      const params = new URLSearchParams();
      if (query) params.set("search", query);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      params.set("page", String(page ?? 1));
      params.set("pageSize", String(MAX_TOOL_PAGE_SIZE));
      const result = await call<PaginatedResult<MeetingWithResponse>>(`/api/v1/calendar?${params.toString()}`);
      return textResult(result);
    }
  );

  server.registerTool(
    "get_meeting",
    {
      description: "Get details of a single meeting on your calendar by id.",
      inputSchema: { meeting_id: z.number().int() },
    },
    async ({ meeting_id }) => textResult(await call<MeetingWithResponse>(`/api/v1/calendar/${meeting_id}`))
  );

  server.registerTool(
    "list_meeting_attendees",
    {
      description: "List the attendees (and their response status) of a meeting you're on.",
      inputSchema: { meeting_id: z.number().int() },
    },
    async ({ meeting_id }) => {
      const result = await call<{ data: unknown[] }>(`/api/v1/calendar/${meeting_id}/attendees`);
      return textResult(result.data);
    }
  );

  server.registerTool(
    "respond_to_meeting",
    {
      description: "Set your own RSVP status for a meeting you're invited to.",
      inputSchema: {
        meeting_id: z.number().int(),
        response_status: z.enum(["accepted", "tentative", "declined", "needs_action"]),
      },
    },
    async ({ meeting_id, response_status }) =>
      textResult(
        await call(`/api/v1/calendar/${meeting_id}/response`, {
          method: "PATCH",
          body: JSON.stringify({ response_status }),
        })
      )
  );

  server.registerTool(
    "list_users",
    {
      description: "List the people in the company directory (for addressing new emails/invites).",
      inputSchema: {},
    },
    async () => {
      const result = await call<{ data: User[] }>("/api/v1/users");
      return textResult(result.data);
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

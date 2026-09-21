import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Department, Employee, PaginatedResult, TimeOffBalance } from "@hr-app/shared";
import type { Env, McpProps } from "../env.js";
import { apiFetch } from "../client.js";

// Hard cap enforced by the MCP server itself, independent of whatever page size the
// underlying REST API would otherwise allow. This - plus the deliberate absence of
// any "export everything" tool - is the app's own guardrail against bulk extraction;
// Cloudflare Access / Gateway / AI Gateway policies are layered on top in the workshop.
const MAX_TOOL_PAGE_SIZE = 25;

function textResult(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] };
}

export function registerEmployeeTools(server: McpServer, env: Env, props: McpProps) {
  const call = <T>(path: string, init?: RequestInit) => apiFetch<T>(env, props.apiToken, path, init);

  server.registerTool(
    "list_employees",
    {
      description:
        "Search/list employees in the HR directory. Results are capped at 25 per page - use `page` to paginate instead of requesting more.",
      inputSchema: {
        query: z.string().optional().describe("Free-text search across name, email, and job title"),
        department_id: z.number().int().optional().describe("Filter by department id"),
        page: z.number().int().min(1).optional().default(1),
      },
    },
    async ({ query, department_id, page }) => {
      const params = new URLSearchParams();
      if (query) params.set("search", query);
      if (department_id) params.set("department_id", String(department_id));
      params.set("page", String(page ?? 1));
      params.set("pageSize", String(MAX_TOOL_PAGE_SIZE));

      const result = await call<PaginatedResult<Employee>>(`/api/v1/employees?${params.toString()}`);
      return textResult(result);
    }
  );

  server.registerTool(
    "get_employee",
    {
      description: "Get a single employee's directory profile by id.",
      inputSchema: { employee_id: z.number().int() },
    },
    async ({ employee_id }) => {
      const employee = await call<Employee>(`/api/v1/employees/${employee_id}`);
      return textResult(employee);
    }
  );

  server.registerTool(
    "get_org_chart",
    {
      description: "Get an employee's manager and direct reports (one level up, one level down).",
      inputSchema: { employee_id: z.number().int() },
    },
    async ({ employee_id }) => {
      const employee = await call<Employee>(`/api/v1/employees/${employee_id}`);
      const reportsResult = await call<{ data: Employee[] }>(`/api/v1/employees/${employee_id}/reports`);
      const manager = employee.manager_id ? await call<Employee>(`/api/v1/employees/${employee.manager_id}`) : null;

      return textResult({
        employee,
        manager,
        direct_reports: reportsResult.data.slice(0, MAX_TOOL_PAGE_SIZE),
      });
    }
  );

  server.registerTool(
    "list_departments",
    {
      description: "List all departments in the company.",
      inputSchema: {},
    },
    async () => {
      const result = await call<{ data: Department[] }>("/api/v1/departments");
      return textResult(result.data);
    }
  );

  server.registerTool(
    "get_time_off_balance",
    {
      description: "Get an employee's current vacation/sick time-off balance.",
      inputSchema: { employee_id: z.number().int() },
    },
    async ({ employee_id }) => {
      const result = await call<{ balance: TimeOffBalance | null }>(
        `/api/v1/employees/${employee_id}/time-off`
      );
      return textResult(result.balance);
    }
  );

  server.registerTool(
    "whoami",
    {
      description: "Get the identity of the currently signed-in MCP user (you).",
      inputSchema: {},
    },
    async () => textResult({ employeeId: props.employeeId, email: props.email, name: props.name })
  );
}

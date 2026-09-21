import { Hono } from "hono";
import type { Env, Variables } from "../env.js";
import { canViewSensitiveEmployeeData } from "../auth.js";

export const employees = new Hono<{ Bindings: Env; Variables: Variables }>();

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

employees.get("/", async (c) => {
  const { search, department_id, status, page, pageSize } = c.req.query();
  const conditions: string[] = ["is_system_account = 0"];
  const params: (string | number)[] = [];

  if (search) {
    conditions.push("(first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR job_title LIKE ?)");
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }
  if (department_id) {
    conditions.push("department_id = ?");
    params.push(Number(department_id));
  }
  if (status) {
    conditions.push("employment_status = ?");
    params.push(status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const pageNum = Math.max(1, Number(page) || 1);
  const size = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(pageSize) || DEFAULT_PAGE_SIZE));
  const offset = (pageNum - 1) * size;

  const batchResults = await c.env.DB.batch([
    c.env.DB.prepare(`SELECT COUNT(*) as total FROM employees ${whereClause}`).bind(...params),
    c.env.DB.prepare(
      `SELECT * FROM employees ${whereClause} ORDER BY last_name, first_name LIMIT ? OFFSET ?`
    ).bind(...params, size, offset),
  ]);
  const countResult = batchResults[0]!;
  const dataResult = batchResults[1]!;

  const total = Number((countResult.results[0] as { total: number } | undefined)?.total ?? 0);

  return c.json({
    data: dataResult.results,
    total,
    page: pageNum,
    pageSize: size,
    totalPages: Math.ceil(total / size),
  });
});

employees.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const employee = await c.env.DB.prepare("SELECT * FROM employees WHERE id = ?").bind(id).first<{ home_address: unknown }>();
  if (!employee) return c.json({ error: "Not found" }, 404);

  // home_address is sensitive PII, same access boundary as compensation/benefits -
  // only the employee themselves or someone in their manager chain sees it.
  const requesterId = c.get("employeeId");
  if (!requesterId || !(await canViewSensitiveEmployeeData(c.env.DB, requesterId, id))) {
    employee.home_address = null;
  }

  return c.json(employee);
});

employees.get("/:id/reports", async (c) => {
  const id = Number(c.req.param("id"));
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM employees WHERE manager_id = ? AND is_system_account = 0 ORDER BY last_name, first_name"
  )
    .bind(id)
    .all();
  return c.json({ data: results });
});

employees.get("/:id/compensation", async (c) => {
  const id = Number(c.req.param("id"));
  const requesterId = c.get("employeeId");
  if (!requesterId || !(await canViewSensitiveEmployeeData(c.env.DB, requesterId, id))) {
    return c.json({ error: "You can only view compensation history for yourself or your reports" }, 403);
  }

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM compensation_history WHERE employee_id = ? ORDER BY effective_date DESC"
  )
    .bind(id)
    .all();
  return c.json({ data: results });
});

employees.get("/:id/time-off", async (c) => {
  const id = Number(c.req.param("id"));
  const timeOffResults = await c.env.DB.batch([
    c.env.DB.prepare("SELECT * FROM time_off_balances WHERE employee_id = ?").bind(id),
    c.env.DB.prepare(
      "SELECT * FROM time_off_requests WHERE employee_id = ? ORDER BY start_date DESC"
    ).bind(id),
  ]);
  const balance = timeOffResults[0]!;
  const requests = timeOffResults[1]!;
  return c.json({
    balance: balance.results[0] ?? null,
    requests: requests.results,
  });
});

employees.post("/:id/time-off", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json<{ type: string; start_date: string; end_date: string }>();

  if (!["vacation", "sick", "personal"].includes(body.type)) {
    return c.json({ error: "Invalid time-off type" }, 400);
  }
  if (!body.start_date || !body.end_date) {
    return c.json({ error: "start_date and end_date are required" }, 400);
  }

  const result = await c.env.DB.prepare(
    `INSERT INTO time_off_requests (employee_id, type, start_date, end_date, status, requested_at)
     VALUES (?, ?, ?, ?, 'pending', ?)`
  )
    .bind(id, body.type, body.start_date, body.end_date, new Date().toISOString())
    .run();

  const created = await c.env.DB.prepare("SELECT * FROM time_off_requests WHERE id = ?")
    .bind(result.meta.last_row_id)
    .first();

  return c.json(created, 201);
});

employees.get("/:id/reviews", async (c) => {
  const id = Number(c.req.param("id"));
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM performance_reviews WHERE employee_id = ? ORDER BY review_date DESC"
  )
    .bind(id)
    .all();
  return c.json({ data: results });
});

employees.get("/:id/benefits", async (c) => {
  const id = Number(c.req.param("id"));
  const requesterId = c.get("employeeId");
  if (!requesterId || !(await canViewSensitiveEmployeeData(c.env.DB, requesterId, id))) {
    return c.json({ error: "You can only view benefits for yourself or your reports" }, 403);
  }

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM benefits_enrollments WHERE employee_id = ? ORDER BY plan_name"
  )
    .bind(id)
    .all();
  return c.json({ data: results });
});

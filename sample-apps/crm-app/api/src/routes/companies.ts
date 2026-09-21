import { Hono } from "hono";
import type { Env, Variables } from "../env.js";
import { canViewOwnedRecord, DOWNLINE_SUBQUERY } from "../auth.js";

export const companies = new Hono<{ Bindings: Env; Variables: Variables }>();

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

companies.get("/", async (c) => {
  const requesterId = c.get("repId");
  if (!requesterId) return c.json({ error: "Missing rep identity" }, 403);

  const { search, page, pageSize } = c.req.query();
  const conditions: string[] = [`owner_id IN (${DOWNLINE_SUBQUERY})`];
  const params: (string | number)[] = [requesterId];

  if (search) {
    conditions.push("(name LIKE ? OR industry LIKE ?)");
    const like = `%${search}%`;
    params.push(like, like);
  }
  const whereClause = `WHERE ${conditions.join(" AND ")}`;
  const pageNum = Math.max(1, Number(page) || 1);
  const size = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(pageSize) || DEFAULT_PAGE_SIZE));
  const offset = (pageNum - 1) * size;

  const batchResults = await c.env.DB.batch([
    c.env.DB.prepare(`SELECT COUNT(*) as total FROM companies ${whereClause}`).bind(...params),
    c.env.DB.prepare(`SELECT * FROM companies ${whereClause} ORDER BY name LIMIT ? OFFSET ?`).bind(
      ...params,
      size,
      offset
    ),
  ]);
  const total = Number((batchResults[0]!.results[0] as { total: number } | undefined)?.total ?? 0);

  return c.json({
    data: batchResults[1]!.results,
    total,
    page: pageNum,
    pageSize: size,
    totalPages: Math.ceil(total / size),
  });
});

companies.get("/:id", async (c) => {
  const requesterId = c.get("repId");
  if (!requesterId) return c.json({ error: "Missing rep identity" }, 403);

  const id = Number(c.req.param("id"));
  const company = await c.env.DB.prepare("SELECT * FROM companies WHERE id = ?")
    .bind(id)
    .first<{ owner_id: number }>();
  if (!company) return c.json({ error: "Not found" }, 404);
  if (!(await canViewOwnedRecord(c.env.DB, requesterId, company.owner_id))) {
    return c.json({ error: "You don't have access to this account" }, 403);
  }

  return c.json(company);
});

companies.get("/:id/contacts", async (c) => {
  const requesterId = c.get("repId");
  if (!requesterId) return c.json({ error: "Missing rep identity" }, 403);

  const id = Number(c.req.param("id"));
  const company = await c.env.DB.prepare("SELECT owner_id FROM companies WHERE id = ?")
    .bind(id)
    .first<{ owner_id: number }>();
  if (!company) return c.json({ error: "Not found" }, 404);
  if (!(await canViewOwnedRecord(c.env.DB, requesterId, company.owner_id))) {
    return c.json({ error: "You don't have access to this account" }, 403);
  }

  const { results } = await c.env.DB.prepare("SELECT * FROM contacts WHERE company_id = ? ORDER BY last_name")
    .bind(id)
    .all();
  return c.json({ data: results });
});

companies.get("/:id/deals", async (c) => {
  const requesterId = c.get("repId");
  if (!requesterId) return c.json({ error: "Missing rep identity" }, 403);

  const id = Number(c.req.param("id"));
  const company = await c.env.DB.prepare("SELECT owner_id FROM companies WHERE id = ?")
    .bind(id)
    .first<{ owner_id: number }>();
  if (!company) return c.json({ error: "Not found" }, 404);
  if (!(await canViewOwnedRecord(c.env.DB, requesterId, company.owner_id))) {
    return c.json({ error: "You don't have access to this account" }, 403);
  }

  const { results } = await c.env.DB.prepare("SELECT * FROM deals WHERE company_id = ? ORDER BY created_at DESC")
    .bind(id)
    .all();
  return c.json({ data: results });
});

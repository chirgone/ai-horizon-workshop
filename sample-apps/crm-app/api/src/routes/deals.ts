import { Hono } from "hono";
import type { Env, Variables } from "../env.js";
import { canViewOwnedRecord, DOWNLINE_SUBQUERY } from "../auth.js";

export const deals = new Hono<{ Bindings: Env; Variables: Variables }>();

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

deals.get("/", async (c) => {
  const requesterId = c.get("repId");
  if (!requesterId) return c.json({ error: "Missing rep identity" }, 403);

  const { search, stage, page, pageSize } = c.req.query();
  const conditions: string[] = [`owner_id IN (${DOWNLINE_SUBQUERY})`];
  const params: (string | number)[] = [requesterId];

  if (search) {
    conditions.push("name LIKE ?");
    params.push(`%${search}%`);
  }
  if (stage) {
    conditions.push("stage = ?");
    params.push(stage);
  }
  const whereClause = `WHERE ${conditions.join(" AND ")}`;
  const pageNum = Math.max(1, Number(page) || 1);
  const size = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(pageSize) || DEFAULT_PAGE_SIZE));
  const offset = (pageNum - 1) * size;

  const batchResults = await c.env.DB.batch([
    c.env.DB.prepare(`SELECT COUNT(*) as total FROM deals ${whereClause}`).bind(...params),
    c.env.DB.prepare(`SELECT * FROM deals ${whereClause} ORDER BY updated_at DESC LIMIT ? OFFSET ?`).bind(
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

deals.get("/:id", async (c) => {
  const requesterId = c.get("repId");
  if (!requesterId) return c.json({ error: "Missing rep identity" }, 403);

  const id = Number(c.req.param("id"));
  const deal = await c.env.DB.prepare("SELECT * FROM deals WHERE id = ?").bind(id).first<{ owner_id: number }>();
  if (!deal) return c.json({ error: "Not found" }, 404);
  if (!(await canViewOwnedRecord(c.env.DB, requesterId, deal.owner_id))) {
    return c.json({ error: "You don't have access to this deal" }, 403);
  }

  return c.json(deal);
});

deals.get("/:id/activities", async (c) => {
  const requesterId = c.get("repId");
  if (!requesterId) return c.json({ error: "Missing rep identity" }, 403);

  const id = Number(c.req.param("id"));
  const deal = await c.env.DB.prepare("SELECT owner_id FROM deals WHERE id = ?")
    .bind(id)
    .first<{ owner_id: number }>();
  if (!deal) return c.json({ error: "Not found" }, 404);
  if (!(await canViewOwnedRecord(c.env.DB, requesterId, deal.owner_id))) {
    return c.json({ error: "You don't have access to this deal" }, 403);
  }

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM activities WHERE deal_id = ? ORDER BY activity_date DESC"
  )
    .bind(id)
    .all();
  return c.json({ data: results });
});

deals.post("/:id/activities", async (c) => {
  const requesterId = c.get("repId");
  if (!requesterId) return c.json({ error: "Missing rep identity" }, 403);

  const id = Number(c.req.param("id"));
  const deal = await c.env.DB.prepare("SELECT owner_id FROM deals WHERE id = ?")
    .bind(id)
    .first<{ owner_id: number }>();
  if (!deal) return c.json({ error: "Not found" }, 404);
  if (!(await canViewOwnedRecord(c.env.DB, requesterId, deal.owner_id))) {
    return c.json({ error: "You don't have access to this deal" }, 403);
  }

  const body = await c.req.json<{ type?: string; notes?: string; activity_date?: string }>();
  if (!body.type || !["call", "email", "meeting", "note"].includes(body.type)) {
    return c.json({ error: "Invalid activity type" }, 400);
  }
  if (!body.notes) return c.json({ error: "notes is required" }, 400);

  const activityDate = body.activity_date ?? new Date().toISOString().slice(0, 10);
  const result = await c.env.DB.prepare(
    "INSERT INTO activities (deal_id, rep_id, type, notes, activity_date) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(id, requesterId, body.type, body.notes, activityDate)
    .run();

  await c.env.DB.prepare("UPDATE deals SET updated_at = ? WHERE id = ?")
    .bind(new Date().toISOString(), id)
    .run();

  const created = await c.env.DB.prepare("SELECT * FROM activities WHERE id = ?")
    .bind(result.meta.last_row_id)
    .first();
  return c.json(created, 201);
});

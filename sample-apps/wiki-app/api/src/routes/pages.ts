import { Hono } from "hono";
import type { Env, Variables } from "../env.js";
import { canViewSpace, VISIBLE_SPACES_SUBQUERY } from "../auth.js";

export const pages = new Hono<{ Bindings: Env; Variables: Variables }>();

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

pages.get("/", async (c) => {
  const requesterId = c.get("userId");
  if (!requesterId) return c.json({ error: "Missing user identity" }, 403);

  const { search, page, pageSize } = c.req.query();
  const conditions: string[] = [`space_id IN (${VISIBLE_SPACES_SUBQUERY})`];
  const params: (string | number)[] = [requesterId, requesterId];

  if (search) {
    conditions.push("(title LIKE ? OR body LIKE ?)");
    const like = `%${search}%`;
    params.push(like, like);
  }
  const whereClause = `WHERE ${conditions.join(" AND ")}`;
  const pageNum = Math.max(1, Number(page) || 1);
  const size = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(pageSize) || DEFAULT_PAGE_SIZE));
  const offset = (pageNum - 1) * size;

  const batchResults = await c.env.DB.batch([
    c.env.DB.prepare(`SELECT COUNT(*) as total FROM pages ${whereClause}`).bind(...params),
    c.env.DB.prepare(`SELECT * FROM pages ${whereClause} ORDER BY updated_at DESC LIMIT ? OFFSET ?`).bind(
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

pages.get("/:id", async (c) => {
  const requesterId = c.get("userId");
  if (!requesterId) return c.json({ error: "Missing user identity" }, 403);

  const id = Number(c.req.param("id"));
  const page = await c.env.DB.prepare("SELECT * FROM pages WHERE id = ?").bind(id).first<{ space_id: number }>();
  if (!page) return c.json({ error: "Not found" }, 404);
  if (!(await canViewSpace(c.env.DB, requesterId, page.space_id))) {
    return c.json({ error: "You don't have access to this page" }, 403);
  }

  return c.json(page);
});

pages.get("/:id/history", async (c) => {
  const requesterId = c.get("userId");
  if (!requesterId) return c.json({ error: "Missing user identity" }, 403);

  const id = Number(c.req.param("id"));
  const page = await c.env.DB.prepare("SELECT space_id FROM pages WHERE id = ?")
    .bind(id)
    .first<{ space_id: number }>();
  if (!page) return c.json({ error: "Not found" }, 404);
  if (!(await canViewSpace(c.env.DB, requesterId, page.space_id))) {
    return c.json({ error: "You don't have access to this page" }, 403);
  }

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM page_versions WHERE page_id = ? ORDER BY edited_at DESC"
  )
    .bind(id)
    .all();
  return c.json({ data: results });
});

pages.post("/", async (c) => {
  const requesterId = c.get("userId");
  if (!requesterId) return c.json({ error: "Missing user identity" }, 403);

  const body = await c.req.json<{ space_id?: number; title?: string; body?: string; parent_page_id?: number }>();
  if (!body.space_id || !body.title) return c.json({ error: "space_id and title are required" }, 400);
  if (!(await canViewSpace(c.env.DB, requesterId, body.space_id))) {
    return c.json({ error: "You don't have access to this space" }, 403);
  }

  const now = new Date().toISOString();
  const result = await c.env.DB.prepare(
    `INSERT INTO pages (space_id, parent_page_id, title, body, author_id, updated_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(body.space_id, body.parent_page_id ?? null, body.title, body.body ?? "", requesterId, requesterId, now, now)
    .run();

  const created = await c.env.DB.prepare("SELECT * FROM pages WHERE id = ?").bind(result.meta.last_row_id).first();
  return c.json(created, 201);
});

pages.patch("/:id", async (c) => {
  const requesterId = c.get("userId");
  if (!requesterId) return c.json({ error: "Missing user identity" }, 403);

  const id = Number(c.req.param("id"));
  const existing = await c.env.DB.prepare("SELECT * FROM pages WHERE id = ?")
    .bind(id)
    .first<{ space_id: number; body: string }>();
  if (!existing) return c.json({ error: "Not found" }, 404);
  if (!(await canViewSpace(c.env.DB, requesterId, existing.space_id))) {
    return c.json({ error: "You don't have access to this page" }, 403);
  }

  const patch = await c.req.json<{ title?: string; body?: string }>();
  const now = new Date().toISOString();

  const statements = [];
  if (typeof patch.body === "string" && patch.body !== existing.body) {
    statements.push(
      c.env.DB.prepare("INSERT INTO page_versions (page_id, body, edited_by, edited_at) VALUES (?, ?, ?, ?)").bind(
        id,
        existing.body,
        requesterId,
        now
      )
    );
  }
  statements.push(
    c.env.DB.prepare("UPDATE pages SET title = COALESCE(?, title), body = COALESCE(?, body), updated_by = ?, updated_at = ? WHERE id = ?").bind(
      patch.title ?? null,
      patch.body ?? null,
      requesterId,
      now,
      id
    )
  );
  await c.env.DB.batch(statements);

  const updated = await c.env.DB.prepare("SELECT * FROM pages WHERE id = ?").bind(id).first();
  return c.json(updated);
});

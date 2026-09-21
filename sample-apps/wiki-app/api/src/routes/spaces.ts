import { Hono } from "hono";
import type { Env, Variables } from "../env.js";
import { canViewSpace, VISIBLE_SPACES_SUBQUERY } from "../auth.js";

export const spaces = new Hono<{ Bindings: Env; Variables: Variables }>();

spaces.get("/", async (c) => {
  const requesterId = c.get("userId");
  if (!requesterId) return c.json({ error: "Missing user identity" }, 403);

  const { results } = await c.env.DB.prepare(
    `SELECT * FROM spaces WHERE id IN (${VISIBLE_SPACES_SUBQUERY}) ORDER BY name`
  )
    .bind(requesterId, requesterId)
    .all();
  return c.json({ data: results });
});

spaces.get("/:id", async (c) => {
  const requesterId = c.get("userId");
  if (!requesterId) return c.json({ error: "Missing user identity" }, 403);

  const id = Number(c.req.param("id"));
  if (!(await canViewSpace(c.env.DB, requesterId, id))) {
    return c.json({ error: "You don't have access to this space" }, 403);
  }

  const space = await c.env.DB.prepare("SELECT * FROM spaces WHERE id = ?").bind(id).first();
  if (!space) return c.json({ error: "Not found" }, 404);
  return c.json(space);
});

spaces.get("/:id/pages", async (c) => {
  const requesterId = c.get("userId");
  if (!requesterId) return c.json({ error: "Missing user identity" }, 403);

  const id = Number(c.req.param("id"));
  if (!(await canViewSpace(c.env.DB, requesterId, id))) {
    return c.json({ error: "You don't have access to this space" }, 403);
  }

  const { results } = await c.env.DB.prepare(
    "SELECT id, space_id, parent_page_id, title, author_id, updated_by, created_at, updated_at FROM pages WHERE space_id = ? ORDER BY title"
  )
    .bind(id)
    .all();
  return c.json({ data: results });
});

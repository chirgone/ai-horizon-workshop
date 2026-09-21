import { Hono } from "hono";
import type { Env, Variables } from "../env.js";

export const emails = new Hono<{ Bindings: Env; Variables: Variables }>();

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

// Every route here is implicitly scoped to `owner_id = requester` - there is
// no manager-chain or shared visibility for mail, unlike hr-app/crm-app.
// A person's inbox is theirs alone.

emails.get("/", async (c) => {
  const requesterId = c.get("userId");
  if (!requesterId) return c.json({ error: "Missing user identity" }, 403);

  const { search, folder, page, pageSize } = c.req.query();
  const conditions: string[] = ["owner_id = ?"];
  const params: (string | number)[] = [requesterId];

  if (folder) {
    conditions.push("folder = ?");
    params.push(folder);
  }
  if (search) {
    conditions.push("(subject LIKE ? OR from_name LIKE ? OR from_email LIKE ? OR body LIKE ?)");
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }
  const whereClause = `WHERE ${conditions.join(" AND ")}`;
  const pageNum = Math.max(1, Number(page) || 1);
  const size = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(pageSize) || DEFAULT_PAGE_SIZE));
  const offset = (pageNum - 1) * size;

  const batchResults = await c.env.DB.batch([
    c.env.DB.prepare(`SELECT COUNT(*) as total FROM emails ${whereClause}`).bind(...params),
    c.env.DB.prepare(`SELECT * FROM emails ${whereClause} ORDER BY received_at DESC LIMIT ? OFFSET ?`).bind(
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

emails.get("/:id", async (c) => {
  const requesterId = c.get("userId");
  if (!requesterId) return c.json({ error: "Missing user identity" }, 403);

  const id = Number(c.req.param("id"));
  const email = await c.env.DB.prepare("SELECT * FROM emails WHERE id = ?").bind(id).first<{ owner_id: number }>();
  if (!email) return c.json({ error: "Not found" }, 404);
  if (email.owner_id !== requesterId) return c.json({ error: "This isn't your mailbox" }, 403);

  return c.json(email);
});

emails.patch("/:id/read", async (c) => {
  const requesterId = c.get("userId");
  if (!requesterId) return c.json({ error: "Missing user identity" }, 403);

  const id = Number(c.req.param("id"));
  const email = await c.env.DB.prepare("SELECT owner_id FROM emails WHERE id = ?")
    .bind(id)
    .first<{ owner_id: number }>();
  if (!email) return c.json({ error: "Not found" }, 404);
  if (email.owner_id !== requesterId) return c.json({ error: "This isn't your mailbox" }, 403);

  const { is_read } = await c.req.json<{ is_read?: boolean }>();
  await c.env.DB.prepare("UPDATE emails SET is_read = ? WHERE id = ?")
    .bind(is_read ? 1 : 0, id)
    .run();

  const updated = await c.env.DB.prepare("SELECT * FROM emails WHERE id = ?").bind(id).first();
  return c.json(updated);
});

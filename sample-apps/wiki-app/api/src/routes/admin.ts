import { Hono } from "hono";
import type { Env } from "../env.js";
import type { AppSettings } from "@wiki-app/shared";

// These routes are mounted with requireAdminInternalSecret and are never given a
// public route - only the `web` worker's /admin UI calls them via a service binding.
export const admin = new Hono<{ Bindings: Env }>();

const DEFAULT_PAGE_SIZE = 15;
const MAX_PAGE_SIZE = 100;

function pagingParams(c: { req: { query(): Record<string, string> } }) {
  const { page, pageSize } = c.req.query();
  const pageNum = Math.max(1, Number(page) || 1);
  const size = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(pageSize) || DEFAULT_PAGE_SIZE));
  return { pageNum, size, offset: (pageNum - 1) * size };
}

admin.get("/tokens", async (c) => {
  const search = c.req.query("search");
  const { pageNum, size, offset } = pagingParams(c);

  const conditions: string[] = [];
  const params: string[] = [];
  if (search) {
    conditions.push("(u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR t.created_by LIKE ?)");
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const batchResults = await c.env.DB.batch([
    c.env.DB.prepare(
      `SELECT COUNT(*) as total FROM api_tokens t LEFT JOIN users u ON u.id = t.user_id ${whereClause}`
    ).bind(...params),
    c.env.DB.prepare(
      `SELECT t.id, t.user_id, t.created_at, t.revoked_at, t.last_used_at, t.created_by,
              u.email AS user_email,
              (u.first_name || ' ' || u.last_name) AS user_name
       FROM api_tokens t
       LEFT JOIN users u ON u.id = t.user_id
       ${whereClause}
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`
    ).bind(...params, size, offset),
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

admin.post("/tokens/:id/revoke", async (c) => {
  const id = Number(c.req.param("id"));
  const now = new Date().toISOString();
  const result = await c.env.DB.prepare(
    "UPDATE api_tokens SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL"
  )
    .bind(now, id)
    .run();
  return c.json({ revoked: result.meta.changes > 0 });
});

// --- Branding settings ---

admin.patch("/settings", async (c) => {
  const body = await c.req.json<Partial<AppSettings>>().catch(() => ({}) as Partial<AppSettings>);
  const now = new Date().toISOString();

  const updates: [string, string][] = [];
  if (typeof body.app_name === "string" && body.app_name.trim()) updates.push(["app_name", body.app_name.trim()]);
  if (typeof body.logo_url === "string") updates.push(["logo_url", body.logo_url.trim()]);

  if (updates.length > 0) {
    await c.env.DB.batch(
      updates.map(([key, value]) =>
        c.env.DB.prepare(
          "INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at"
        ).bind(key, value, now)
      )
    );
  }

  const { results } = await c.env.DB.prepare("SELECT key, value FROM app_settings").all<{
    key: string;
    value: string;
  }>();
  const map = Object.fromEntries(results.map((r) => [r.key, r.value]));
  return c.json({ app_name: map.app_name || "Nexus", logo_url: map.logo_url || "" });
});

// --- Accounts (users) ---

admin.get("/users", async (c) => {
  const search = c.req.query("search");
  const { pageNum, size, offset } = pagingParams(c);

  const conditions: string[] = [];
  const params: string[] = [];
  if (search) {
    conditions.push("(first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)");
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const batchResults = await c.env.DB.batch([
    c.env.DB.prepare(`SELECT COUNT(*) as total FROM users ${whereClause}`).bind(...params),
    c.env.DB.prepare(
      `SELECT id, first_name, last_name, email, job_title, is_system_account FROM users ${whereClause}
       ORDER BY is_system_account, last_name, first_name LIMIT ? OFFSET ?`
    ).bind(...params, size, offset),
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

/** Bulk-renames every account's email domain in one shot (keeping each account's local part unchanged). */
admin.post("/users/domain", async (c) => {
  const { domain } = await c.req.json<{ domain?: string }>().catch(() => ({ domain: undefined }));
  const cleaned = (domain ?? "").trim().toLowerCase().replace(/^@/, "");

  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(cleaned)) {
    return c.json({ error: "Enter a valid domain, e.g. company.com" }, 400);
  }

  const { results } = await c.env.DB.prepare("SELECT id, email FROM users").all<{ id: number; email: string }>();

  if (results.length > 0) {
    await c.env.DB.batch(
      results.map((r) => {
        const localPart = r.email.split("@")[0];
        return c.env.DB.prepare("UPDATE users SET email = ? WHERE id = ?").bind(`${localPart}@${cleaned}`, r.id);
      })
    );
  }

  return c.json({ updated: results.length, domain: cleaned });
});

// --- Spaces (admin sees and manages every space, regardless of restriction) ---

admin.get("/spaces", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT s.*, (SELECT COUNT(*) FROM pages p WHERE p.space_id = s.id) AS page_count,
            (SELECT COUNT(*) FROM space_members m WHERE m.space_id = s.id) AS member_count
     FROM spaces s ORDER BY s.name`
  ).all();
  return c.json({ data: results });
});

admin.post("/spaces", async (c) => {
  const body = await c.req.json<{ name?: string; description?: string; is_restricted?: boolean; owner_id?: number }>();
  if (!body.name || !body.owner_id) return c.json({ error: "name and owner_id are required" }, 400);

  const now = new Date().toISOString();
  const result = await c.env.DB.prepare(
    "INSERT INTO spaces (name, description, is_restricted, owner_id, created_at) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(body.name, body.description ?? "", body.is_restricted ? 1 : 0, body.owner_id, now)
    .run();

  const created = await c.env.DB.prepare("SELECT * FROM spaces WHERE id = ?").bind(result.meta.last_row_id).first();
  return c.json(created, 201);
});

admin.patch("/spaces/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json<{ name?: string; description?: string; is_restricted?: boolean }>();

  await c.env.DB.prepare(
    "UPDATE spaces SET name = COALESCE(?, name), description = COALESCE(?, description), is_restricted = COALESCE(?, is_restricted) WHERE id = ?"
  )
    .bind(body.name ?? null, body.description ?? null, body.is_restricted === undefined ? null : body.is_restricted ? 1 : 0, id)
    .run();

  const updated = await c.env.DB.prepare("SELECT * FROM spaces WHERE id = ?").bind(id).first();
  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json(updated);
});

admin.get("/spaces/:id/members", async (c) => {
  const id = Number(c.req.param("id"));
  const { results } = await c.env.DB.prepare(
    `SELECT u.id, u.first_name, u.last_name, u.email FROM space_members m JOIN users u ON u.id = m.user_id WHERE m.space_id = ? ORDER BY u.last_name`
  )
    .bind(id)
    .all();
  return c.json({ data: results });
});

admin.post("/spaces/:id/members", async (c) => {
  const id = Number(c.req.param("id"));
  const { user_id } = await c.req.json<{ user_id?: number }>();
  if (!user_id) return c.json({ error: "user_id is required" }, 400);

  await c.env.DB.prepare("INSERT OR IGNORE INTO space_members (space_id, user_id) VALUES (?, ?)")
    .bind(id, user_id)
    .run();
  return c.json({ added: true });
});

admin.post("/spaces/:id/members/:userId/remove", async (c) => {
  const id = Number(c.req.param("id"));
  const userId = Number(c.req.param("userId"));
  await c.env.DB.prepare("DELETE FROM space_members WHERE space_id = ? AND user_id = ?").bind(id, userId).run();
  return c.json({ removed: true });
});

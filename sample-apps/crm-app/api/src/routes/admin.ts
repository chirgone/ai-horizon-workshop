import { Hono } from "hono";
import type { Env } from "../env.js";
import type { AppSettings } from "@crm-app/shared";

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
    conditions.push("(r.first_name LIKE ? OR r.last_name LIKE ? OR r.email LIKE ? OR t.created_by LIKE ?)");
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const batchResults = await c.env.DB.batch([
    c.env.DB.prepare(
      `SELECT COUNT(*) as total FROM api_tokens t LEFT JOIN reps r ON r.id = t.rep_id ${whereClause}`
    ).bind(...params),
    c.env.DB.prepare(
      `SELECT t.id, t.rep_id, t.created_at, t.revoked_at, t.last_used_at, t.created_by,
              r.email AS rep_email,
              (r.first_name || ' ' || r.last_name) AS rep_name
       FROM api_tokens t
       LEFT JOIN reps r ON r.id = t.rep_id
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
  return c.json({ app_name: map.app_name || "Pipeline", logo_url: map.logo_url || "" });
});

// --- Accounts (reps) ---

admin.get("/reps", async (c) => {
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
    c.env.DB.prepare(`SELECT COUNT(*) as total FROM reps ${whereClause}`).bind(...params),
    c.env.DB.prepare(
      `SELECT id, first_name, last_name, email, job_title, is_system_account FROM reps ${whereClause}
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
admin.post("/reps/domain", async (c) => {
  const { domain } = await c.req.json<{ domain?: string }>().catch(() => ({ domain: undefined }));
  const cleaned = (domain ?? "").trim().toLowerCase().replace(/^@/, "");

  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(cleaned)) {
    return c.json({ error: "Enter a valid domain, e.g. company.com" }, 400);
  }

  const { results } = await c.env.DB.prepare("SELECT id, email FROM reps").all<{ id: number; email: string }>();

  if (results.length > 0) {
    await c.env.DB.batch(
      results.map((r) => {
        const localPart = r.email.split("@")[0];
        return c.env.DB.prepare("UPDATE reps SET email = ? WHERE id = ?").bind(`${localPart}@${cleaned}`, r.id);
      })
    );
  }

  return c.json({ updated: results.length, domain: cleaned });
});

import { Hono } from "hono";
import type { Env } from "../env.js";
import { generateToken, sha256Hex } from "../auth.js";
import type { Rep } from "@crm-app/shared";

// These routes are mounted with requireMcpOrWebInternalSecret and are never given
// a public route - only the `mcp` worker's OAuth authorize flow and the `web`
// worker's dashboard call them, to (1) look up whether an email belongs to a real
// rep, and (2) mint a fresh per-user API token once identity is established.
export const internal = new Hono<{ Bindings: Env }>();

internal.post("/reps/lookup", async (c) => {
  const { email } = await c.req.json<{ email?: string }>().catch(() => ({ email: undefined }));
  if (!email) return c.json({ error: "email is required" }, 400);

  const rep = await c.env.DB.prepare("SELECT * FROM reps WHERE email = ?")
    .bind(email.trim().toLowerCase())
    .first<Rep>();

  if (!rep) return c.json({ rep: null }, 404);
  return c.json({ rep });
});

internal.post("/tokens/issue", async (c) => {
  const { rep_id, created_by } = await c.req
    .json<{ rep_id?: number; created_by?: string }>()
    .catch(() => ({ rep_id: undefined, created_by: undefined }));
  if (!rep_id) return c.json({ error: "rep_id is required" }, 400);

  const rep = await c.env.DB.prepare("SELECT id FROM reps WHERE id = ?").bind(rep_id).first();
  if (!rep) return c.json({ error: "Unknown rep" }, 404);

  const now = new Date().toISOString();

  const plaintextToken = generateToken();
  const tokenHash = await sha256Hex(plaintextToken);

  await c.env.DB.prepare(
    "INSERT INTO api_tokens (token_hash, rep_id, created_at, created_by) VALUES (?, ?, ?, ?)"
  )
    .bind(tokenHash, rep_id, now, created_by ?? "unknown")
    .run();

  return c.json({ token: plaintextToken, created_at: now });
});

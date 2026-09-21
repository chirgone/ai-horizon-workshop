import { Hono } from "hono";
import type { Env } from "../env.js";
import { generateToken, sha256Hex } from "../auth.js";
import type { User } from "@wiki-app/shared";

// These routes are mounted with requireMcpOrWebInternalSecret and are never given
// a public route - only the `mcp` worker's OAuth authorize flow and the `web`
// worker's dashboard call them, to (1) look up whether an email belongs to a real
// user, and (2) mint a fresh per-user API token once identity is established.
export const internal = new Hono<{ Bindings: Env }>();

internal.post("/users/lookup", async (c) => {
  const { email } = await c.req.json<{ email?: string }>().catch(() => ({ email: undefined }));
  if (!email) return c.json({ error: "email is required" }, 400);

  const user = await c.env.DB.prepare("SELECT * FROM users WHERE email = ?")
    .bind(email.trim().toLowerCase())
    .first<User>();

  if (!user) return c.json({ user: null }, 404);
  return c.json({ user });
});

internal.post("/tokens/issue", async (c) => {
  const { user_id, created_by } = await c.req
    .json<{ user_id?: number; created_by?: string }>()
    .catch(() => ({ user_id: undefined, created_by: undefined }));
  if (!user_id) return c.json({ error: "user_id is required" }, 400);

  const user = await c.env.DB.prepare("SELECT id FROM users WHERE id = ?").bind(user_id).first();
  if (!user) return c.json({ error: "Unknown user" }, 404);

  const now = new Date().toISOString();

  const plaintextToken = generateToken();
  const tokenHash = await sha256Hex(plaintextToken);

  await c.env.DB.prepare(
    "INSERT INTO api_tokens (token_hash, user_id, created_at, created_by) VALUES (?, ?, ?, ?)"
  )
    .bind(tokenHash, user_id, now, created_by ?? "unknown")
    .run();

  return c.json({ token: plaintextToken, created_at: now });
});

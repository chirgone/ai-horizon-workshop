import { Hono } from "hono";
import type { Env } from "../env.js";

export const users = new Hono<{ Bindings: Env }>();

// Public directory (name/email/title only) - used to attribute authors/editors.
// Not sensitive on its own, only restricted-space content is.
users.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT id, first_name, last_name, email, job_title, manager_id, is_system_account FROM users WHERE is_system_account = 0 ORDER BY last_name, first_name"
  ).all();
  return c.json({ data: results });
});

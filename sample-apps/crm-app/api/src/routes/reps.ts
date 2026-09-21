import { Hono } from "hono";
import type { Env } from "../env.js";

export const reps = new Hono<{ Bindings: Env }>();

// Public rep directory (name/email/title only) - used for owner pickers in
// the dashboard. Not scoped by downline visibility; who the reps *are* isn't
// sensitive, only the deals/companies/contacts they own are.
reps.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT id, first_name, last_name, email, job_title, manager_id, is_system_account FROM reps WHERE is_system_account = 0 ORDER BY last_name, first_name"
  ).all();
  return c.json({ data: results });
});

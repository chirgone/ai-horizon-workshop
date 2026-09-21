import { Hono } from "hono";
import type { Env } from "../env.js";

// Public branding (app name / logo) - no auth, never anything sensitive.
export const settings = new Hono<{ Bindings: Env }>();

settings.get("/", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT key, value FROM app_settings").all<{
    key: string;
    value: string;
  }>();
  const map = Object.fromEntries(results.map((r) => [r.key, r.value]));
  return c.json({ app_name: map.app_name || "Nexus", logo_url: map.logo_url || "" });
});

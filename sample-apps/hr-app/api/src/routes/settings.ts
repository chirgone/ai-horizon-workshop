import { Hono } from "hono";
import type { Env } from "../env.js";
import type { AppSettings } from "@hr-app/shared";

// Public, unauthenticated - this is just display branding (app name / logo),
// never anything sensitive, and every page of the web app needs it to render.
export const settings = new Hono<{ Bindings: Env }>();

settings.get("/", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT key, value FROM app_settings").all<{
    key: string;
    value: string;
  }>();

  const map = Object.fromEntries(results.map((r) => [r.key, r.value]));
  const settings: AppSettings = {
    app_name: map.app_name || "WorkWeek",
    logo_url: map.logo_url || "",
  };

  return c.json(settings);
});

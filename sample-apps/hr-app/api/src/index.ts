import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { Env, Variables } from "./env.js";
import { requireBearerToken, requireAdminInternalSecret, requireMcpOrWebInternalSecret } from "./auth.js";
import { employees } from "./routes/employees.js";
import { departments } from "./routes/departments.js";
import { admin } from "./routes/admin.js";
import { internal } from "./routes/internal.js";
import { settings } from "./routes/settings.js";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use("*", logger());
app.use("/api/*", cors({ origin: "*" }));

app.get("/health", (c) => c.json({ status: "ok", service: "hr-app-api" }));

// Public branding settings - no auth, never anything sensitive.
app.route("/settings", settings);

// Public REST API - requires a valid bearer token minted from /admin.
app.use("/api/v1/*", requireBearerToken);
app.route("/api/v1/employees", employees);
app.route("/api/v1/departments", departments);

// Internal-only admin routes - never publicly routed, only called by `web`'s
// service binding, gated by a shared secret instead of the bearer token above.
app.use("/admin/*", requireAdminInternalSecret);
app.route("/admin", admin);

// Internal-only routes for the `mcp` worker's OAuth authorize flow and the `web`
// worker's dashboard data-fetching - never publicly routed, each gated by its own
// shared secret.
app.use("/internal/*", requireMcpOrWebInternalSecret);
app.route("/internal", internal);

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});

app.notFound((c) => c.json({ error: "Not found" }, 404));

export default app;

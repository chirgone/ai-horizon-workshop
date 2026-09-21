import { Hono } from "hono";
import { logger } from "hono/logger";
import type { Env, Variables } from "./env.js";
import { requireBearerToken, requireAdminInternalSecret, requireMcpOrWebInternalSecret } from "./auth.js";
import { reps } from "./routes/reps.js";
import { companies } from "./routes/companies.js";
import { deals } from "./routes/deals.js";
import { admin } from "./routes/admin.js";
import { internal } from "./routes/internal.js";
import { settings } from "./routes/settings.js";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use("*", logger());

app.get("/health", (c) => c.json({ status: "ok", service: "crm-app-api" }));

// Public branding settings - no auth, never anything sensitive.
app.route("/settings", settings);

// Public REST API - requires a valid bearer token minted from /admin.
app.use("/api/v1/*", requireBearerToken);
app.route("/api/v1/reps", reps);
app.route("/api/v1/companies", companies);
app.route("/api/v1/deals", deals);

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

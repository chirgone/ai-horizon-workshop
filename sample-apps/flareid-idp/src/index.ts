import { Hono } from "hono";
import type { Env } from "./env.js";
import { discovery } from "./routes/discovery.js";
import { authorize } from "./routes/authorize.js";
import { login } from "./routes/login.js";
import { token } from "./routes/token.js";
import { introspect } from "./routes/introspect.js";
import { userinfo } from "./routes/userinfo.js";
import { account } from "./routes/account.js";
import { admin } from "./routes/admin.js";
import { aboutDemo } from "./routes/about-demo.js";
import { getAppName } from "./lib/settings.js";

const app = new Hono<{ Bindings: Env }>();

app.get("/health", (c) => c.json({ status: "ok", service: "flareid-idp" }));

// Resolves the admin-configurable display name once per request so every
// downstream handler/view can read it synchronously via c.get("appName").
app.use("*", async (c, next) => {
  c.set("appName", await getAppName(c.env));
  await next();
});

app.get("/", (c) => c.redirect("/account", 302));

app.route("/", discovery);
app.route("/", authorize);
app.route("/", login);
app.route("/", token);
app.route("/", introspect);
app.route("/", userinfo);
app.route("/", account);
app.route("/", admin);
app.route("/", aboutDemo);

app.onError((err, c) => {
  console.error(err);
  return c.text("Internal server error", 500);
});

app.notFound((c) => c.text("Not found", 404));

export default app;

import type { Context, Next } from "hono";
import type { Env, Variables } from "./env.js";

type AppContext = Context<{ Bindings: Env; Variables: Variables }>;

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  const random = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `crmapp_${random}`;
}

/**
 * Requires a valid `Authorization: Bearer <token>` header matching an active
 * (non-revoked) row in api_tokens. This is the only guard on the public REST API -
 * intentionally minimal so the workshop can layer Cloudflare Access/Gateway/AI Gateway
 * policies on top of it.
 */
export async function requireBearerToken(c: AppContext, next: Next) {
  const header = c.req.header("Authorization");
  const token = header?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) {
    return c.json({ error: "Missing bearer token" }, 401);
  }

  const tokenHash = await sha256Hex(token);
  const row = await c.env.DB.prepare(
    "SELECT id, rep_id FROM api_tokens WHERE token_hash = ? AND revoked_at IS NULL"
  )
    .bind(tokenHash)
    .first<{ id: number; rep_id: number | null }>();

  if (!row) {
    return c.json({ error: "Invalid or revoked token" }, 401);
  }

  if (row.rep_id) c.set("repId", row.rep_id);

  c.executionCtx.waitUntil(
    c.env.DB.prepare("UPDATE api_tokens SET last_used_at = ? WHERE id = ?")
      .bind(new Date().toISOString(), row.id)
      .run()
  );

  await next();
}

/**
 * True if `requesterId` is allowed to see records owned by `ownerId` - either
 * it's their own record, or `ownerId` is somewhere in `requesterId`'s downline
 * (i.e. `ownerId` reports to them, directly or transitively). This is the
 * single access rule for companies/contacts/deals: you see your own, plus
 * anything owned by anyone below you in the org chart.
 */
export async function canViewOwnedRecord(db: D1Database, requesterId: number, ownerId: number): Promise<boolean> {
  if (requesterId === ownerId) return true;

  const row = await db
    .prepare(
      `WITH RECURSIVE downline(id) AS (
         SELECT id FROM reps WHERE id = ?
         UNION ALL
         SELECT r.id FROM reps r JOIN downline d ON r.manager_id = d.id
       )
       SELECT 1 FROM downline WHERE id = ?`
    )
    .bind(requesterId, ownerId)
    .first();

  return !!row;
}

/**
 * SQL fragment (as a bound subquery) for "every rep id in requesterId's
 * downline, including themselves" - use this to scope list/search queries
 * to only the records a requester is allowed to see.
 */
export const DOWNLINE_SUBQUERY = `
  WITH RECURSIVE downline(id) AS (
    SELECT id FROM reps WHERE id = ?
    UNION ALL
    SELECT r.id FROM reps r JOIN downline d ON r.manager_id = d.id
  )
  SELECT id FROM downline
`;

/**
 * Factory for internal-only route guards. These routes are never given a public
 * route - only a specific sibling Worker (identified by which shared secret it
 * sends) is allowed to call them.
 */
function requireInternalSecret(headerName: string, envKey: "ADMIN_INTERNAL_SECRET" | "MCP_INTERNAL_SECRET" | "WEB_INTERNAL_SECRET") {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const provided = c.req.header(headerName);
    const expected = c.env[envKey];
    if (!expected || provided !== expected) {
      return c.json({ error: "Forbidden" }, 403);
    }
    await next();
  };
}

/** Gates /admin/* - only the `web` worker's service binding sends this secret. */
export const requireAdminInternalSecret = requireInternalSecret(
  "X-Internal-Admin-Secret",
  "ADMIN_INTERNAL_SECRET"
);

/** Gates /internal/* - the `mcp` worker's OAuth flow sends this secret. */
export const requireMcpInternalSecret = requireInternalSecret(
  "X-Internal-Mcp-Secret",
  "MCP_INTERNAL_SECRET"
);

/** Gates /internal/* - the `web` worker sends this secret to fetch data on behalf of the signed-in rep. */
export const requireWebInternalSecret = requireInternalSecret(
  "X-Internal-Web-Secret",
  "WEB_INTERNAL_SECRET"
);

/**
 * Gates /internal/* routes that both `mcp` (OAuth login) and `web` (dashboard
 * data-fetching) need to call: accepts either sibling Worker's shared secret.
 */
export async function requireMcpOrWebInternalSecret(c: Context<{ Bindings: Env }>, next: Next) {
  const mcpSecret = c.req.header("X-Internal-Mcp-Secret");
  const webSecret = c.req.header("X-Internal-Web-Secret");
  if ((c.env.MCP_INTERNAL_SECRET && mcpSecret === c.env.MCP_INTERNAL_SECRET) ||
      (c.env.WEB_INTERNAL_SECRET && webSecret === c.env.WEB_INTERNAL_SECRET)) {
    await next();
    return;
  }
  return c.json({ error: "Forbidden" }, 403);
}

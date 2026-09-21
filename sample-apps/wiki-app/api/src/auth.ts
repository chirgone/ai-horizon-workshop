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
  return `nexus_${random}`;
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
    "SELECT id, user_id FROM api_tokens WHERE token_hash = ? AND revoked_at IS NULL"
  )
    .bind(tokenHash)
    .first<{ id: number; user_id: number | null }>();

  if (!row) {
    return c.json({ error: "Invalid or revoked token" }, 401);
  }

  if (row.user_id) c.set("userId", row.user_id);

  c.executionCtx.waitUntil(
    c.env.DB.prepare("UPDATE api_tokens SET last_used_at = ? WHERE id = ?")
      .bind(new Date().toISOString(), row.id)
      .run()
  );

  await next();
}

/**
 * Every user can see public spaces. A restricted space is only visible to its
 * owner and its listed members.
 */
export async function canViewSpace(db: D1Database, userId: number, spaceId: number): Promise<boolean> {
  const space = await db
    .prepare("SELECT is_restricted, owner_id FROM spaces WHERE id = ?")
    .bind(spaceId)
    .first<{ is_restricted: number; owner_id: number }>();
  if (!space) return false;
  if (!space.is_restricted) return true;
  if (space.owner_id === userId) return true;

  const member = await db
    .prepare("SELECT 1 FROM space_members WHERE space_id = ? AND user_id = ?")
    .bind(spaceId, userId)
    .first();
  return !!member;
}

/** SQL subquery (as a bound fragment) for "every space id this user is allowed to see". */
export const VISIBLE_SPACES_SUBQUERY = `
  SELECT id FROM spaces WHERE is_restricted = 0 OR owner_id = ?
  UNION
  SELECT space_id FROM space_members WHERE user_id = ?
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

/** Gates /internal/* - the `web` worker sends this secret to fetch data on behalf of the signed-in user. */
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

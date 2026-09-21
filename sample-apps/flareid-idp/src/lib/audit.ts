import type { Env } from "../env.js";
import type { UserRow } from "./types.js";
import { getClientIp } from "./rate-limit.js";

export async function logAudit(
  env: Env,
  actor: UserRow | { id: number; upn: string } | null,
  action: string,
  target?: string,
  details?: Record<string, unknown>,
  request?: Request
): Promise<void> {
  await env.DB.prepare(
    "INSERT INTO audit_log (at, actor_user_id, actor_upn, action, target, details, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  )
    .bind(
      new Date().toISOString(),
      actor?.id ?? null,
      actor?.upn ?? null,
      action,
      target ?? null,
      details ? JSON.stringify(details) : null,
      request ? getClientIp(request) : null,
      request?.headers.get("User-Agent") ?? null
    )
    .run();
}

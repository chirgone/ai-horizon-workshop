import type { Rep } from "@crm-app/shared";
import type { Env } from "./env.js";

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

/**
 * Calls the `api` worker's public REST API using a per-user bearer token (minted
 * via `issueUserToken` at OAuth authorization time and stashed in the grant's props).
 * This is the only credential the MCP server holds for a given user - it never
 * touches D1 directly.
 */
export async function apiFetch<T>(env: Env, apiToken: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${env.API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(`API request to ${path} failed (${res.status}): ${body}`, res.status);
  }

  return (await res.json()) as T;
}

function internalHeaders(env: Env): HeadersInit {
  if (!env.MCP_INTERNAL_SECRET) {
    throw new ApiError("mcp worker is not configured with an MCP_INTERNAL_SECRET secret", 500);
  }
  return {
    "X-Internal-Mcp-Secret": env.MCP_INTERNAL_SECRET,
    "Content-Type": "application/json",
  };
}

/** Used by the /authorize login screen to check whether an email belongs to a real rep. */
export async function lookupRepByEmail(env: Env, email: string): Promise<Rep | null> {
  const res = await fetch(`${env.API_BASE_URL}/internal/reps/lookup`, {
    method: "POST",
    headers: internalHeaders(env),
    body: JSON.stringify({ email }),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new ApiError(`Rep lookup failed (${res.status})`, res.status);
  const { rep } = await res.json<{ rep: Rep }>();
  return rep;
}

/** Called once a rep approves the MCP OAuth consent screen - mints their per-user api token. */
export async function issueUserToken(env: Env, repId: number): Promise<string> {
  const res = await fetch(`${env.API_BASE_URL}/internal/tokens/issue`, {
    method: "POST",
    headers: internalHeaders(env),
    body: JSON.stringify({ rep_id: repId, created_by: "mcp-oauth" }),
  });
  if (!res.ok) throw new ApiError(`Token issuance failed (${res.status})`, res.status);
  const { token } = await res.json<{ token: string }>();
  return token;
}

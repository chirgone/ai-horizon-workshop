export interface Env {
  DB: D1Database;
  /** Shared secret that only the `web` worker's service binding sends, gating /admin/*. */
  ADMIN_INTERNAL_SECRET?: string;
  /** Shared secret that only the `mcp` worker sends, gating /internal/* (per-user token issuance). */
  MCP_INTERNAL_SECRET?: string;
  /** Shared secret that only the `web` worker sends, gating /internal/* (per-user token issuance for dashboard reads). */
  WEB_INTERNAL_SECRET?: string;
}

export interface Variables {
  /** The user that the caller's bearer token was minted for - set by requireBearerToken. */
  userId?: number;
}

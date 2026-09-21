import { Hono } from "hono";
import type { Env } from "../env.js";
import { generateToken, sha256Hex } from "../auth.js";
import type { Employee } from "@hr-app/shared";

// These routes are mounted with requireMcpOrWebInternalSecret and are never given
// a public route - only the `mcp` worker's OAuth authorize flow and the `web`
// worker's dashboard call them, to (1) look up whether an email belongs to a real
// employee, and (2) mint a fresh per-user API token once identity is established.
export const internal = new Hono<{ Bindings: Env }>();

internal.post("/employees/lookup", async (c) => {
  const { email } = await c.req.json<{ email?: string }>().catch(() => ({ email: undefined }));
  if (!email) return c.json({ error: "email is required" }, 400);

  const employee = await c.env.DB.prepare(
    "SELECT * FROM employees WHERE email = ? AND employment_status != 'terminated'"
  )
    .bind(email.trim().toLowerCase())
    .first<Employee>();

  if (!employee) return c.json({ employee: null }, 404);
  return c.json({ employee });
});

internal.post("/tokens/issue", async (c) => {
  const { employee_id, created_by } = await c.req
    .json<{ employee_id?: number; created_by?: string }>()
    .catch(() => ({ employee_id: undefined, created_by: undefined }));
  if (!employee_id) return c.json({ error: "employee_id is required" }, 400);

  const employee = await c.env.DB.prepare("SELECT id FROM employees WHERE id = ?")
    .bind(employee_id)
    .first();
  if (!employee) return c.json({ error: "Unknown employee" }, 404);

  const now = new Date().toISOString();

  // Each caller context (an MCP OAuth grant, or a web dashboard session) mints its
  // own token rather than revoking any other active token for this employee, so a
  // person's MCP session and their browser session can hold independent, separately
  // revocable credentials at the same time. Use /admin to review and revoke any of them.
  const plaintextToken = generateToken();
  const tokenHash = await sha256Hex(plaintextToken);

  await c.env.DB.prepare(
    "INSERT INTO api_tokens (token_hash, employee_id, created_at, created_by) VALUES (?, ?, ?, ?)"
  )
    .bind(tokenHash, employee_id, now, created_by ?? "unknown")
    .run();

  // Plaintext token is returned exactly once, to be embedded in the MCP OAuth
  // grant's encrypted props - it is never recoverable again after this response.
  return c.json({ token: plaintextToken, created_at: now });
});

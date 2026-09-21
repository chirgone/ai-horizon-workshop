import type { Env } from "./env.js";

// In-memory per-isolate cache of minted `api` bearer tokens, keyed by employee id.
// Cleared on cold start; worst case we just mint an extra token occasionally.
const tokenCache = new Map<number, { token: string; expiresAt: number }>();
const TOKEN_TTL_MS = 10 * 60 * 1000;

function callApi(env: Env, path: string, init?: RequestInit): Promise<Response> {
  return env.API.fetch(new Request(`https://internal${path}`, init));
}

async function lookupEmployeeByEmail(env: Env, email: string) {
  const res = await callApi(env, "/internal/employees/lookup", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Internal-Web-Secret": env.WEB_INTERNAL_SECRET ?? "" },
    body: JSON.stringify({ email }),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Employee lookup failed (${res.status})`);
  const { employee } = await res.json<{ employee: unknown }>();
  return employee;
}

async function getOrMintToken(env: Env, employeeId: number): Promise<string> {
  const cached = tokenCache.get(employeeId);
  if (cached && cached.expiresAt > Date.now()) return cached.token;

  const res = await callApi(env, "/internal/tokens/issue", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Internal-Web-Secret": env.WEB_INTERNAL_SECRET ?? "" },
    body: JSON.stringify({ employee_id: employeeId, created_by: "web-dashboard" }),
  });
  if (!res.ok) throw new Error(`Token issuance failed (${res.status})`);
  const { token } = await res.json<{ token: string }>();

  tokenCache.set(employeeId, { token, expiresAt: Date.now() + TOKEN_TTL_MS });
  return token;
}

/**
 * Resolves "me" from the Cf-Access-Authenticated-User-Email header that Cloudflare
 * Access sets on every request once this app is deployed behind an Access
 * application. Falls back to a seeded demo employee only when there's no Access
 * header at all (local dev, no Access in front). If Access *did* authenticate
 * someone but their email doesn't match any account here, access is denied -
 * being a valid FlareID/Access login doesn't automatically make you a WorkWeek
 * user.
 */
async function resolveIdentity(request: Request, env: Env) {
  const accessEmail = request.headers.get("Cf-Access-Authenticated-User-Email");

  if (!accessEmail) {
    const employee = await lookupEmployeeByEmail(env, env.DEV_FALLBACK_EMAIL);
    return { employee, usedFallback: true, accessEmail: null, denied: false };
  }

  const employee = await lookupEmployeeByEmail(env, accessEmail);
  return { employee, usedFallback: false, accessEmail, denied: !employee };
}

async function proxyToApi(request: Request, env: Env, targetPath: string, headers: HeadersInit): Promise<Response> {
  const url = new URL(request.url);
  const hasBody = !["GET", "HEAD"].includes(request.method);
  const apiRes = await callApi(env, `${targetPath}${url.search}`, {
    method: request.method,
    headers: { "Content-Type": "application/json", ...headers },
    body: hasBody ? await request.text() : undefined,
  });

  // Don't blindly copy apiRes.headers: apiRes.body is already the *decoded*
  // stream (fetch auto-decompresses), but a leftover Content-Encoding/-Length
  // header would tell the browser to decode it again, which fails outright
  // (surfaces as an opaque "TypeError: Failed to fetch" client-side) - strip
  // the transport-level headers that no longer describe this body.
  const responseHeaders = new Headers(apiRes.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  responseHeaders.delete("transfer-encoding");
  return new Response(apiRes.body, { status: apiRes.status, headers: responseHeaders });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/settings") {
      // Public branding (app name / logo) - no identity resolution needed.
      const apiRes = await callApi(env, "/settings");
      return new Response(apiRes.body, { status: apiRes.status, headers: apiRes.headers });
    }

    if (url.pathname === "/api/links") {
      // Cross-links to the other apps in this demo suite, for /about-demo -
      // derived from ROOT_DOMAIN (set once by wire-access.sh) plus this
      // request's own hostname, so no per-app config is needed beyond that
      // one shared var.
      const rootDomain = env.ROOT_DOMAIN || null;
      const selfSubdomain =
        rootDomain && url.hostname.endsWith(`.${rootDomain}`) ? url.hostname.slice(0, -(rootDomain.length + 1)) : null;
      return Response.json({ rootDomain, selfSubdomain });
    }

    if (url.pathname === "/api/me") {
      const { employee, usedFallback, accessEmail, denied } = await resolveIdentity(request, env);
      if (denied) {
        return Response.json(
          {
            error: `Signed in to Access as ${accessEmail}, but no matching account was found in WorkWeek. Ask an admin to add this email in /admin.`,
          },
          { status: 403 }
        );
      }
      if (!employee) return Response.json({ error: "No employee found" }, { status: 404 });
      return Response.json({ employee, usedFallback, accessEmail });
    }

    if (url.pathname.startsWith("/api/proxy/")) {
      const { employee, denied, accessEmail } = await resolveIdentity(request, env);
      if (denied) {
        return Response.json(
          { error: `Signed in to Access as ${accessEmail}, but no matching account was found in WorkWeek.` },
          { status: 403 }
        );
      }
      if (!employee) return Response.json({ error: "No matching employee" }, { status: 403 });

      const token = await getOrMintToken(env, (employee as { id: number }).id);
      const targetPath = url.pathname.replace(/^\/api\/proxy/, "/api/v1");
      return proxyToApi(request, env, targetPath, { Authorization: `Bearer ${token}` });
    }

    if (url.pathname.startsWith("/admin/api/")) {
      // Authorization lives in app code, not a separate Cloudflare Access
      // application - only the system account (admin@) may reach these routes.
      // (Deliberately not relying on a second, stricter Access app scoped to
      // /admin*: overlapping Access applications on the same hostname can end
      // up with independently-expiring sessions, so a page load can succeed
      // while its own XHR calls get redirected to a login page fetch() can
      // never follow, surfacing as an opaque CORS error client-side.)
      const { employee, denied } = await resolveIdentity(request, env);
      const isAdmin = !!(employee as { is_system_account?: boolean } | null)?.is_system_account;
      if (denied || !isAdmin) {
        return Response.json({ error: "Admins only" }, { status: 403 });
      }

      const targetPath = url.pathname.replace(/^\/admin\/api/, "/admin");
      return proxyToApi(request, env, targetPath, {
        "X-Internal-Admin-Secret": env.ADMIN_INTERNAL_SECRET ?? "",
      });
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;

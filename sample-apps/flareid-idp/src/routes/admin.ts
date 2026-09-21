import { Hono } from "hono";
import type { Env } from "../env.js";
import { requireAdmin, requireSession, SUPER_ADMINS_GROUP } from "../lib/middleware.js";
import { breadcrumbs, cardSection, copyButton, escapeHtml, multiSelect, nav, page, pageSizeSelect, paginationControls, secretBlock, successBanner, type Breadcrumb } from "../lib/html.js";
import { generateTempPassword, hashPassword } from "../lib/password.js";
import { randomToken, sha256Hex } from "../lib/tokens.js";
import type { AuditLogRow, GroupRow, OAuthClientRow, UserRow } from "../lib/types.js";
import { addDomain, applyDomainToAllUsers, deleteDomain, listDomains, setDefaultDomain } from "../lib/domains.js";
import {
  applyDefaultPasswordToAllUsers,
  getDefaultPassword,
  getPasswordPolicy,
  isSetupCompleted,
  markSetupCompleted,
  setDefaultPassword,
  setPasswordPolicy,
  validatePassword,
} from "../lib/settings.js";
import { logAudit } from "../lib/audit.js";
import { getScimConfig, getScimScope, setScimConfig, setScimScope } from "../lib/settings.js";
import { getRateLimitPolicy, setRateLimitPolicy } from "../lib/rate-limit.js";
import { getNewUserPasswordMode, isMfaRequired, setMfaRequired, setNewUserPasswordMode } from "../lib/settings.js";
import { getLoginGradient, setAppName, setLoginGradient } from "../lib/settings.js";
import { deleteBackupCodes } from "../lib/backup-codes.js";
import { deleteTrustedDevicesForUser } from "../lib/trusted-devices.js";
import { listActiveSessionsForUser, revokeAllSessionsForUser } from "../lib/sessions.js";
import { deactivateUserScim, deleteGroupScim, deleteUserScim, pushGroup, pushUser, syncAll, testScimConnection } from "../lib/scim-client.js";

export const admin = new Hono<{ Bindings: Env }>();

admin.use("/admin", requireSession, requireAdmin);
admin.use("/admin/*", requireSession, requireAdmin);

function layout(c: { get: (k: "appName") => string }, title: string, body: string, crumbs?: Breadcrumb[]) {
  const appName = c.get("appName");
  const crumbHtml = crumbs ? breadcrumbs(crumbs) : "";
  return page(
    `${title}`,
    `<div class="page-header">${crumbHtml}<h1>${escapeHtml(title)}</h1></div>${body}`,
    appName,
    true,
    nav(appName, true)
  );
}

function copyableRow(label: string, value: string, widthStyle = ""): string {
  return `<tr><th${widthStyle}>${escapeHtml(label)}</th><td><div style="display:flex; align-items:center; gap:8px;"><code>${escapeHtml(value)}</code>${copyButton(value)}</div></td></tr>`;
}

function oidcEndpointsBlock(env: Env, clientId: string) {
  return `
    <div style="background:#f9fafb; border-radius:10px; padding:14px 16px; margin:12px 0;">
      <p class="muted" style="margin:0 0 8px 0;">Use these when configuring this client as an OIDC login method (e.g. Cloudflare Access's App ID / Client secret / Auth URL / Token URL / Certificate URL fields):</p>
      <table style="margin:0;">
        ${copyableRow("App ID / Client ID", clientId, ' style="width:140px;"')}
        ${copyableRow("Auth URL", `${env.ISSUER_URL}/authorize`)}
        ${copyableRow("Token URL", `${env.ISSUER_URL}/token`)}
        ${copyableRow("Certificate URL", `${env.ISSUER_URL}/jwks.json`)}
        ${copyableRow("Issuer", env.ISSUER_URL)}
        ${copyableRow("Scopes", "openid email profile groups")}
      </table>
    </div>
  `;
}

function adminNav(active: string) {
  const items: [string, string][] = [
    ["users", "Users"],
    ["groups", "Groups"],
    ["clients", "OIDC Clients"],
    ["domains", "Domains"],
    ["security", "Security"],
    ["scim", "SCIM"],
    ["audit", "Audit Log"],
  ];
  return `<div class="admin-tabs">
    ${items.map(([key, label]) => `<a href="/admin/${key}" class="${active === key ? "active" : ""}">${label}</a>`).join("")}
  </div>`;
}

/** Either the shared default password, or a freshly generated one that respects the configured complexity policy - per the "New account password" setting on /admin/security. */
async function generateAccountPassword(env: Env): Promise<string> {
  const mode = await getNewUserPasswordMode(env);
  if (mode === "default") return getDefaultPassword(env);
  const policy = await getPasswordPolicy(env);
  return generateTempPassword(policy);
}

async function scimConfigured(env: Env): Promise<boolean> {
  const { endpoint, secret } = await getScimConfig(env);
  return !!endpoint && !!secret;
}

/** Best-effort push - never blocks the admin action if SCIM isn't configured or the remote call fails. */
async function syncUserBestEffort(c: { env: Env; get: (k: "user") => UserRow; req: { raw: Request } }, userId: number, action: "push" | "deactivate" | "delete") {
  if (!(await scimConfigured(c.env))) return;
  const user = await c.env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first<UserRow>();
  if (!user && action !== "delete") return;

  const result =
    action === "push" && user
      ? await pushUser(c.env, user)
      : action === "deactivate" && user
        ? await deactivateUserScim(c.env, user)
        : { ok: true };

  if (!result.ok) await logAudit(c.env, c.get("user"), "scim.user_sync_failed", user?.upn, { action, error: result.error }, c.req.raw);
}

async function syncGroupBestEffort(c: { env: Env; get: (k: "user") => UserRow; req: { raw: Request } }, groupId: number) {
  if (!(await scimConfigured(c.env))) return;
  const group = await c.env.DB.prepare("SELECT * FROM groups WHERE id = ?").bind(groupId).first<GroupRow>();
  if (!group) return;

  const { results: memberRows } = await c.env.DB.prepare(
    "SELECT u.scim_id as scimId, u.upn FROM group_members gm JOIN users u ON u.id = gm.user_id WHERE gm.group_id = ? AND u.scim_id IS NOT NULL"
  )
    .bind(groupId)
    .all<{ scimId: string; upn: string }>();

  const result = await pushGroup(c.env, group, memberRows);
  if (!result.ok) await logAudit(c.env, c.get("user"), "scim.group_sync_failed", group.name, { error: result.error }, c.req.raw);
}

function splitUpn(upn: string): { username: string; domain: string } {
  const at = upn.lastIndexOf("@");
  return at === -1 ? { username: upn, domain: "" } : { username: upn.slice(0, at), domain: upn.slice(at + 1) };
}

function employmentStatusSelect(current: string) {
  const options: [string, string][] = [
    ["", "-"],
    ["active", "Active"],
    ["on_leave", "On leave"],
    ["terminated", "Terminated"],
  ];
  return `<select id="employment_status" name="employment_status">
    ${options.map(([value, label]) => `<option value="${value}" ${value === current ? "selected" : ""}>${label}</option>`).join("")}
  </select>`;
}

function employmentTypeSelect(current: string) {
  const options: [string, string][] = [
    ["", "-"],
    ["full_time", "Full-time"],
    ["contractor", "Contractor"],
  ];
  return `<select id="employment_type" name="employment_type">
    ${options.map(([value, label]) => `<option value="${value}" ${value === current ? "selected" : ""}>${label}</option>`).join("")}
  </select>`;
}

async function managerSelect(env: Env, excludeUserId: number | null, selectedExternalId: string | null) {
  const { results: candidates } = await env.DB.prepare(
    excludeUserId ? "SELECT external_id, display_name, upn FROM users WHERE id != ? ORDER BY display_name" : "SELECT external_id, display_name, upn FROM users ORDER BY display_name"
  )
    .bind(...(excludeUserId ? [excludeUserId] : []))
    .all<{ external_id: string; display_name: string; upn: string }>();

  return `<select name="manager_external_id">
    <option value="">No manager</option>
    ${candidates
      .map(
        (u) =>
          `<option value="${escapeHtml(u.external_id)}" ${u.external_id === selectedExternalId ? "selected" : ""}>${escapeHtml(u.display_name)} (${escapeHtml(u.upn)})</option>`
      )
      .join("")}
  </select>`;
}

async function domainSelect(env: Env, name: string, selectedDomain?: string) {
  const domains = await listDomains(env);
  const hasSelected = selectedDomain ? domains.some((d) => d.domain === selectedDomain) : false;
  return `<select name="${escapeHtml(name)}">
    ${domains
      .map((d) => `<option value="${escapeHtml(d.domain)}" ${d.domain === selectedDomain ? "selected" : ""}>${escapeHtml(d.domain)}</option>`)
      .join("")}
    ${selectedDomain && !hasSelected ? `<option value="${escapeHtml(selectedDomain)}" selected>${escapeHtml(selectedDomain)} (not in domain list)</option>` : ""}
  </select>`;
}

// ---------- Dashboard ----------

admin.get("/admin", async (c) => {
  const [{ results: userCount }, { results: groupCount }, { results: clientCount }] = await Promise.all([
    c.env.DB.prepare("SELECT COUNT(*) as n FROM users").all<{ n: number }>(),
    c.env.DB.prepare("SELECT COUNT(*) as n FROM groups").all<{ n: number }>(),
    c.env.DB.prepare("SELECT COUNT(*) as n FROM oauth_clients").all<{ n: number }>(),
  ]);

  return c.html(
    layout(
      c,
      "Admin",
      `
      ${adminNav("")}
      <div class="stat-grid">
        <a class="stat-card" href="/admin/users"><div class="card"><h2>${userCount[0]?.n ?? 0}</h2><p>Users</p></div></a>
        <a class="stat-card" href="/admin/groups"><div class="card"><h2>${groupCount[0]?.n ?? 0}</h2><p>Groups</p></div></a>
        <a class="stat-card" href="/admin/clients"><div class="card"><h2>${clientCount[0]?.n ?? 0}</h2><p>OIDC Clients</p></div></a>
      </div>
      `,
      [{ label: "Admin" }]
    )
  );
});

// ---------- Setup wizard ----------

admin.get("/admin/setup", async (c) => {
  const domains = await listDomains(c.env);
  const defaultPassword = await getDefaultPassword(c.env);
  const currentUserId = c.get("user").id;

  const sampleUserCount = await c.env.DB.prepare("SELECT COUNT(*) as n FROM users WHERE id != ?")
    .bind(currentUserId)
    .first<{ n: number }>();
  const sampleGroupCount = await c.env.DB.prepare(
    `SELECT COUNT(*) as n FROM groups WHERE name NOT IN (?, 'All Employees')`
  )
    .bind(SUPER_ADMINS_GROUP)
    .first<{ n: number }>();

  return c.html(
    layout(
      c,
      "Welcome to FlareID",
      `
      ${cardSection(`
        <p class="sub">Before anyone else can sign in, confirm the basics below. You can change all of this later from Admin → Domains / Security.</p>
        <form method="POST" action="/admin/setup">
          <label for="domain">Primary domain for user accounts</label>
          <input type="text" id="domain" name="domain" value="${escapeHtml(domains[0]?.domain ?? "")}" required />
          <label for="default_password">Default password for new/seeded accounts</label>
          <input type="text" id="default_password" name="default_password" value="${escapeHtml(defaultPassword)}" required />

          <label>Sample data</label>
          <label style="font-weight:400;"><input type="radio" name="sample_data" value="keep" checked style="width:auto; display:inline; margin-right:6px;" /> Keep the ${sampleUserCount?.n ?? 0} sample users and ${sampleGroupCount?.n ?? 0} sample groups</label>
          <label style="font-weight:400; margin-bottom:16px;"><input type="radio" name="sample_data" value="remove" style="width:auto; display:inline; margin-right:6px;" /> Remove them and start with a clean, empty directory</label>

          <div class="row"><button class="primary" type="submit" onclick="return !document.querySelector('input[name=sample_data][value=remove]').checked || confirm('This will permanently delete every user except your own admin account, and every group except Super Admins / All Employees. Continue?');">Finish setup</button></div>
        </form>
      `)}
      ${cardSection(`
        <h2>Change your own password</h2>
        <p class="muted">Recommended before finishing setup - the admin account starts with the default password above.</p>
        <a href="/account"><button class="secondary" type="button">Go to My account</button></a>
      `)}
      `,
      [{ label: "Admin", href: "/admin" }, { label: "Setup" }]
    )
  );
});

admin.post("/admin/setup", async (c) => {
  const body = await c.req.parseBody();
  const domain = String(body.domain ?? "").trim().toLowerCase();
  const defaultPassword = String(body.default_password ?? "");
  const removeSampleData = body.sample_data === "remove";

  if (domain) {
    const existing = await listDomains(c.env);
    if (!existing.some((d) => d.domain === domain)) {
      await addDomain(c.env, domain);
    }
    const row = (await listDomains(c.env)).find((d) => d.domain === domain);
    if (row) await setDefaultDomain(c.env, row.id);
  }
  if (defaultPassword) await setDefaultPassword(c.env, defaultPassword);

  if (removeSampleData) {
    await removeSampleDirectoryData(c);
  }

  await markSetupCompleted(c.env);
  await logAudit(c.env, c.get("user"), "idp.setup_completed", domain, { removeSampleData }, c.req.raw);

  return c.redirect("/admin", 302);
});

/** Wipes every seeded sample user/group except the current admin's own account and the Super Admins / All Employees groups. */
async function removeSampleDirectoryData(c: { env: Env; get: (k: "user") => UserRow; req: { raw: Request } }) {
  const currentUserId = c.get("user").id;

  const { results: sampleUsers } = await c.env.DB.prepare("SELECT * FROM users WHERE id != ?")
    .bind(currentUserId)
    .all<UserRow>();
  const { results: sampleGroups } = await c.env.DB.prepare(
    `SELECT * FROM groups WHERE name NOT IN (?, 'All Employees')`
  )
    .bind(SUPER_ADMINS_GROUP)
    .all<GroupRow>();

  const scimEnabled = await scimConfigured(c.env);
  if (scimEnabled) {
    for (const user of sampleUsers) await deleteUserScim(c.env, user);
    for (const group of sampleGroups) await deleteGroupScim(c.env, group);
  }

  const sampleUserIds = sampleUsers.map((u) => u.id);
  const sampleGroupIds = sampleGroups.map((g) => g.id);

  if (sampleUserIds.length > 0) {
    const placeholders = sampleUserIds.map(() => "?").join(",");
    await c.env.DB.batch([
      c.env.DB.prepare(`DELETE FROM group_members WHERE user_id IN (${placeholders})`).bind(...sampleUserIds),
      c.env.DB.prepare(`DELETE FROM sessions WHERE user_id IN (${placeholders})`).bind(...sampleUserIds),
      c.env.DB.prepare(`DELETE FROM access_tokens WHERE user_id IN (${placeholders})`).bind(...sampleUserIds),
      c.env.DB.prepare(`DELETE FROM refresh_tokens WHERE user_id IN (${placeholders})`).bind(...sampleUserIds),
      c.env.DB.prepare(`DELETE FROM auth_codes WHERE user_id IN (${placeholders})`).bind(...sampleUserIds),
      c.env.DB.prepare(`DELETE FROM mfa_backup_codes WHERE user_id IN (${placeholders})`).bind(...sampleUserIds),
      c.env.DB.prepare(`UPDATE audit_log SET actor_user_id = NULL WHERE actor_user_id IN (${placeholders})`).bind(...sampleUserIds),
      c.env.DB.prepare(`DELETE FROM users WHERE id IN (${placeholders})`).bind(...sampleUserIds),
    ]);
  }

  if (sampleGroupIds.length > 0) {
    const placeholders = sampleGroupIds.map(() => "?").join(",");
    await c.env.DB.prepare(`DELETE FROM groups WHERE id IN (${placeholders})`).bind(...sampleGroupIds).run();
  }
}

// ---------- Users ----------

async function superAdminUserIds(env: Env): Promise<Set<number>> {
  const { results } = await env.DB.prepare(
    "SELECT user_id FROM group_members WHERE group_id = (SELECT id FROM groups WHERE name = ?)"
  )
    .bind(SUPER_ADMINS_GROUP)
    .all<{ user_id: number }>();
  return new Set(results.map((r) => r.user_id));
}

admin.get("/admin/users", async (c) => {
  const search = c.req.query("search") ?? "";
  const statusFilter = c.req.query("status") ?? "";
  const mfaFilter = c.req.query("mfa") ?? "";
  const roleFilter = c.req.query("role") ?? "";
  const pageSize = [20, 50, 100].includes(Number(c.req.query("pageSize"))) ? Number(c.req.query("pageSize")) : 20;
  const page = Math.max(1, Number(c.req.query("page")) || 1);
  const like = `%${search}%`;

  const conditions = ["(upn LIKE ? OR display_name LIKE ?)"];
  const params: (string | number)[] = [like, like];

  if (statusFilter === "active" || statusFilter === "disabled") {
    conditions.push("status = ?");
    params.push(statusFilter);
  }
  if (mfaFilter === "enabled" || mfaFilter === "disabled") {
    conditions.push("mfa_enabled = ?");
    params.push(mfaFilter === "enabled" ? 1 : 0);
  }
  if (roleFilter === "admin" || roleFilter === "regular") {
    conditions.push(
      `id ${roleFilter === "admin" ? "IN" : "NOT IN"} (SELECT user_id FROM group_members WHERE group_id = (SELECT id FROM groups WHERE name = '${SUPER_ADMINS_GROUP}'))`
    );
  }
  const whereClause = `WHERE ${conditions.join(" AND ")}`;

  const batchResults = await c.env.DB.batch([
    c.env.DB.prepare(`SELECT COUNT(*) as n FROM users ${whereClause}`).bind(...params),
    c.env.DB.prepare(`SELECT * FROM users ${whereClause} ORDER BY display_name LIMIT ? OFFSET ?`).bind(
      ...params,
      pageSize,
      (page - 1) * pageSize
    ),
  ]);
  const countRows = batchResults[0]!.results;
  const users = batchResults[1]!.results;
  const total = Number((countRows[0] as { n: number } | undefined)?.n ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const admins = await superAdminUserIds(c.env);

  const filterSelect = (name: string, current: string, options: [string, string][]) =>
    `<select name="${name}" onchange="this.form.querySelector('input[name=page]').value=1; this.form.submit();" style="width:auto; display:inline-block; margin-bottom:0;">
      ${options.map(([value, label]) => `<option value="${value}" ${value === current ? "selected" : ""}>${label}</option>`).join("")}
    </select>`;

  return c.html(
    layout(
      c,
      "Users",
      `
      ${adminNav("users")}
      ${cardSection(`
        <form method="GET">
          <div class="row between" style="align-items:flex-start; gap:12px; flex-wrap:wrap;">
            <div style="display:flex; gap:8px; flex-wrap:wrap; flex:1;">
              <input type="text" name="search" placeholder="Search users" value="${escapeHtml(search)}" style="max-width:260px; margin-bottom:0;" />
              ${filterSelect("status", statusFilter, [
                ["", "All statuses"],
                ["active", "Active"],
                ["disabled", "Disabled"],
              ])}
              ${filterSelect("mfa", mfaFilter, [
                ["", "All MFA"],
                ["enabled", "MFA enabled"],
                ["disabled", "MFA not enabled"],
              ])}
              ${filterSelect("role", roleFilter, [
                ["", "All roles"],
                ["admin", "Super Admin"],
                ["regular", "Regular"],
              ])}
              <input type="hidden" name="page" value="1" />
              ${pageSizeSelect(pageSize)}
            </div>
            <a href="/admin/users/new"><button class="primary" type="button">+ New user</button></a>
          </div>
        </form>
      `)}
      ${cardSection(`
        <table>
          <thead><tr><th>Name</th><th>UPN</th><th>Status</th><th>MFA</th><th>Role</th></tr></thead>
          <tbody>
            ${(users as UserRow[])
              .map(
                (u) => `<tr>
                  <td><a href="/admin/users/${u.id}">${escapeHtml(u.display_name)}</a></td>
                  <td>${escapeHtml(u.upn)}</td>
                  <td><span class="badge badge-${u.status}">${u.status}</span></td>
                  <td>${u.mfa_enabled ? "Enabled" : "-"}</td>
                  <td>${admins.has(u.id) ? '<span class="badge badge-admin">Super Admin</span>' : "-"}</td>
                </tr>`
              )
              .join("")}
          </tbody>
        </table>
        ${paginationControls("/admin/users", page, totalPages, { search, status: statusFilter, mfa: mfaFilter, role: roleFilter, pageSize })}
      `)}
      `,
      [{ label: "Admin", href: "/admin" }, { label: "Users" }]
    )
  );
});

admin.get("/admin/users/new", async (c) => {
  const { results: groups } = await c.env.DB.prepare("SELECT * FROM groups ORDER BY name").all<GroupRow>();
  const domains = await listDomains(c.env);

  return c.html(
    layout(
      c,
      "New user",
      cardSection(`
        <form method="POST" action="/admin/users">
          <div class="field-row">
            <div>
              <label for="given_name">First name</label>
              <input type="text" id="given_name" name="given_name" required />
            </div>
            <div>
              <label for="family_name">Last name</label>
              <input type="text" id="family_name" name="family_name" required />
            </div>
          </div>
          <label for="username">UPN</label>
          <div class="field-row">
            <input type="text" id="username" name="username" placeholder="username" required style="flex:2;" />
            <div style="flex:1;">${await domainSelect(c.env, "domain", domains[0]?.domain)}</div>
          </div>
          <div class="field-row">
            <div>
              <label for="job_title">Job title</label>
              <input type="text" id="job_title" name="job_title" placeholder="e.g. Software Engineer" />
            </div>
            <div>
              <label for="department">Department</label>
              <input type="text" id="department" name="department" placeholder="e.g. Engineering" />
            </div>
          </div>
          <label for="manager_external_id">Manager</label>
          ${await managerSelect(c.env, null, null)}
          <div class="field-row">
            <div>
              <label for="employee_number">Employee #</label>
              <input type="text" id="employee_number" name="employee_number" placeholder="e.g. E0031" />
            </div>
            <div>
              <label for="location">Location</label>
              <input type="text" id="location" name="location" placeholder="e.g. Remote - US" />
            </div>
          </div>
          <div class="field-row">
            <div>
              <label for="hire_date">Hire date</label>
              <input type="date" id="hire_date" name="hire_date" />
            </div>
            <div>
              <label for="employment_status">Employment status</label>
              ${employmentStatusSelect("")}
            </div>
            <div>
              <label for="employment_type">Employment type</label>
              ${employmentTypeSelect("")}
            </div>
          </div>
          <h2>Groups</h2>
          <p class="muted" style="margin-top:-8px;">Everyone automatically joins "All Employees" regardless of what's selected here.</p>
          ${multiSelect(
            "group_ids",
            groups.map((g) => ({ id: g.id, label: g.name })),
            new Set(groups.filter((g) => g.name === "All Employees").map((g) => g.id)),
            "Search groups..."
          )}
          <div class="row"><button class="primary" type="submit">Create user</button></div>
        </form>
      `),
      [{ label: "Admin", href: "/admin" }, { label: "Users", href: "/admin/users" }, { label: "New user" }]
    )
  );
});

admin.post("/admin/users", async (c) => {
  const body = await c.req.parseBody({ all: true });
  const username = String(body.username ?? "").trim().toLowerCase();
  const domain = String(body.domain ?? "").trim().toLowerCase();
  const upn = `${username}@${domain}`;
  const givenName = String(body.given_name ?? "").trim();
  const familyName = String(body.family_name ?? "").trim();
  const displayName = `${givenName} ${familyName}`.trim();
  const jobTitle = String(body.job_title ?? "").trim();
  const department = String(body.department ?? "").trim();
  const managerExternalId = String(body.manager_external_id ?? "").trim() || null;
  const employeeNumber = String(body.employee_number ?? "").trim();
  const hireDate = String(body.hire_date ?? "").trim();
  const employmentStatus = String(body.employment_status ?? "").trim();
  const employmentType = String(body.employment_type ?? "").trim();
  const location = String(body.location ?? "").trim();
  const groupIds = Array.isArray(body.group_ids) ? body.group_ids.map(Number) : body.group_ids ? [Number(body.group_ids)] : [];

  if (!username || !domain || !givenName) return c.text("username, domain, and first name are required", 400);

  const existingUsername = await c.env.DB.prepare("SELECT id FROM users WHERE username = ?").bind(username).first();
  if (existingUsername) {
    return c.text(`Username "${username}" is already taken by another account (usernames must be unique across every domain).`, 409);
  }

  const tempPassword = await generateAccountPassword(c.env);
  const { hash, salt, iterations } = await hashPassword(tempPassword);
  const now = new Date().toISOString();
  const externalId = crypto.randomUUID();

  const result = await c.env.DB.prepare(
    `INSERT INTO users (upn, username, display_name, given_name, family_name, external_id, job_title, department, manager_external_id, employee_number, hire_date, employment_status, employment_type, location, password_hash, password_salt, password_iterations, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      upn,
      username,
      displayName,
      givenName,
      familyName,
      externalId,
      jobTitle,
      department,
      managerExternalId,
      employeeNumber,
      hireDate,
      employmentStatus,
      employmentType,
      location,
      hash,
      salt,
      iterations,
      now,
      now
    )
    .run();

  const userId = result.meta.last_row_id;
  if (groupIds.length > 0) {
    await c.env.DB.batch(
      groupIds.map((gid) =>
        c.env.DB.prepare("INSERT INTO group_members (group_id, user_id) VALUES (?, ?)").bind(gid, userId)
      )
    );
  }

  // Every user automatically joins the company-wide "All Employees" group.
  const allEmployeesGroup = await c.env.DB.prepare("SELECT id FROM groups WHERE name = 'All Employees'").first<{ id: number }>();
  if (allEmployeesGroup && !groupIds.includes(allEmployeesGroup.id)) {
    await c.env.DB.prepare("INSERT INTO group_members (group_id, user_id) VALUES (?, ?)").bind(allEmployeesGroup.id, userId).run();
    groupIds.push(allEmployeesGroup.id);
  }

  await logAudit(c.env, c.get("user"), "user.created", upn, undefined, c.req.raw);
  await syncUserBestEffort(c, userId, "push");
  for (const gid of groupIds) await syncGroupBestEffort(c, gid);

  return c.html(
    layout(
      c,
      "User created",
      cardSection(`
        <p class="success">Created ${escapeHtml(displayName)} (${escapeHtml(upn)}).</p>
        ${secretBlock("Temporary password - share with the user securely", tempPassword)}
        <a href="/admin/users/${userId}"><button class="primary" type="button">Continue</button></a>
      `),
      [{ label: "Admin", href: "/admin" }, { label: "Users", href: "/admin/users" }, { label: "User created" }]
    )
  );
});

admin.get("/admin/users/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const user = await c.env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(id).first<UserRow>();
  if (!user) return c.text("Not found", 404);

  const { results: groups } = await c.env.DB.prepare("SELECT * FROM groups ORDER BY name").all<GroupRow>();
  const { results: memberships } = await c.env.DB.prepare("SELECT group_id FROM group_members WHERE user_id = ?")
    .bind(id)
    .all<{ group_id: number }>();
  const memberGroupIds = new Set(memberships.map((m) => m.group_id));
  const sessions = await listActiveSessionsForUser(c.env, id);
  const { results: connectedApps } = await c.env.DB.prepare(
    `SELECT DISTINCT oc.id, oc.name FROM access_tokens at
     JOIN oauth_clients oc ON oc.client_id = at.client_id
     WHERE at.user_id = ? AND at.expires_at > ?
     UNION
     SELECT DISTINCT oc.id, oc.name FROM refresh_tokens rt
     JOIN oauth_clients oc ON oc.client_id = rt.client_id
     WHERE rt.user_id = ? AND rt.revoked_at IS NULL`
  )
    .bind(id, new Date().toISOString(), id)
    .all<{ id: number; name: string }>();
  const { username, domain } = splitUpn(user.upn);
  const domains = await listDomains(c.env);

  return c.html(
    layout(
      c,
      user.display_name,
      `
      ${c.req.query("saved") ? successBanner("Saved.") : ""}
      ${cardSection(`
        <form method="POST" action="/admin/users/${id}">
          <div class="field-row">
            <div>
              <label for="given_name">First name</label>
              <input type="text" id="given_name" name="given_name" value="${escapeHtml(user.given_name)}" required />
            </div>
            <div>
              <label for="family_name">Last name</label>
              <input type="text" id="family_name" name="family_name" value="${escapeHtml(user.family_name)}" />
            </div>
          </div>
          <label for="username">UPN</label>
          <div class="field-row">
            <input type="text" id="username" name="username" value="${escapeHtml(username)}" required style="flex:2;" />
            <div style="flex:1;">${await domainSelect(c.env, "domain", domain)}</div>
          </div>
          <div class="field-row">
            <div>
              <label for="job_title">Job title</label>
              <input type="text" id="job_title" name="job_title" value="${escapeHtml(user.job_title)}" placeholder="e.g. Software Engineer" />
            </div>
            <div>
              <label for="department">Department</label>
              <input type="text" id="department" name="department" value="${escapeHtml(user.department)}" placeholder="e.g. Engineering" />
            </div>
          </div>
          <label for="manager_external_id">Manager</label>
          ${await managerSelect(c.env, id, user.manager_external_id)}
          <div class="field-row">
            <div>
              <label for="employee_number">Employee #</label>
              <input type="text" id="employee_number" name="employee_number" value="${escapeHtml(user.employee_number)}" placeholder="e.g. E0031" />
            </div>
            <div>
              <label for="location">Location</label>
              <input type="text" id="location" name="location" value="${escapeHtml(user.location)}" placeholder="e.g. Remote - US" />
            </div>
          </div>
          <div class="field-row">
            <div>
              <label for="hire_date">Hire date</label>
              <input type="date" id="hire_date" name="hire_date" value="${escapeHtml(user.hire_date)}" />
            </div>
            <div>
              <label for="employment_status">Employment status</label>
              ${employmentStatusSelect(user.employment_status)}
            </div>
            <div>
              <label for="employment_type">Employment type</label>
              ${employmentTypeSelect(user.employment_type)}
            </div>
          </div>
          <label><input type="checkbox" name="status_active" value="1" ${user.status === "active" ? "checked" : ""} style="width:auto; display:inline; margin-right:6px;" /> Active</label>
          <p class="muted" style="margin-top:8px;">External ID: <code>${escapeHtml(user.external_id)}</code></p>
          <h2 style="margin-top:16px;">Groups</h2>
          ${multiSelect(
            "group_ids",
            groups.map((g) => ({ id: g.id, label: g.name })),
            memberGroupIds,
            "Search groups..."
          )}
          <div class="row"><button class="primary" type="submit">Save</button></div>
        </form>
      `)}

      ${cardSection(`
        <h2>Security</h2>
        <p class="muted">MFA: ${user.mfa_enabled ? "Enabled" : "Not enabled"}</p>
        <div class="row" style="justify-content:flex-start;">
          <form method="POST" action="/admin/users/${id}/reset-mfa">
            <button class="secondary" type="submit">Reset MFA</button>
          </form>
          <form method="POST" action="/admin/users/${id}/reset-password">
            <button class="secondary" type="submit">Reset password</button>
          </form>
        </div>
      `)}

      ${cardSection(`
        <div class="row between">
          <h2 style="margin:0;">Active sessions</h2>
          ${sessions.length > 0 ? `<form method="POST" action="/admin/users/${id}/sessions/revoke-all" onsubmit="return confirm('Sign this user out everywhere?');"><button class="secondary" type="submit">Sign out everywhere</button></form>` : ""}
        </div>
        ${
          sessions.length > 0
            ? `<table style="margin-top:10px;">
                <thead><tr><th>Started</th><th>Last active</th><th>IP</th></tr></thead>
                <tbody>
                  ${sessions
                    .map(
                      (s) =>
                        `<tr><td>${escapeHtml(new Date(s.created_at).toLocaleString())}</td><td>${escapeHtml(new Date(s.last_seen_at).toLocaleString())}</td><td class="muted">${escapeHtml(s.ip ?? "unknown")}</td></tr>`
                    )
                    .join("")}
                </tbody>
              </table>`
            : '<p class="muted">No active sessions.</p>'
        }
      `)}

      ${cardSection(`
        <h2>Connected apps</h2>
        ${
          connectedApps.length > 0
            ? `<table>
                <thead><tr><th>App</th><th></th></tr></thead>
                <tbody>
                  ${connectedApps
                    .map(
                      (app) =>
                        `<tr><td>${escapeHtml(app.name)}</td><td><form method="POST" action="/admin/users/${id}/apps/${app.id}/revoke"><button class="link-button" type="submit">Revoke access</button></form></td></tr>`
                    )
                    .join("")}
                </tbody>
              </table>`
            : '<p class="muted">No connected apps.</p>'
        }
      `)}

      ${cardSection(`
        <h2>Delete user</h2>
        <p class="muted">Removes the account, its group memberships, and any tokens issued for it. This cannot be undone.</p>
        <form method="POST" action="/admin/users/${id}/delete" onsubmit="return confirm('Delete ${escapeHtml(user.display_name).replace(/'/g, "")}? This cannot be undone.');">
          <button class="danger" type="submit">Delete ${escapeHtml(user.display_name)}</button>
        </form>
      `)}
      `,
      [{ label: "Admin", href: "/admin" }, { label: "Users", href: "/admin/users" }, { label: user.display_name }]
    )
  );
});

admin.post("/admin/users/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.parseBody({ all: true });
  const username = String(body.username ?? "").trim().toLowerCase();
  const domain = String(body.domain ?? "").trim().toLowerCase();
  const upn = `${username}@${domain}`;
  const givenName = String(body.given_name ?? "").trim();
  const familyName = String(body.family_name ?? "").trim();
  const displayName = `${givenName} ${familyName}`.trim();
  const jobTitle = String(body.job_title ?? "").trim();
  const department = String(body.department ?? "").trim();
  const employeeNumber = String(body.employee_number ?? "").trim();
  const hireDate = String(body.hire_date ?? "").trim();
  const employmentStatus = String(body.employment_status ?? "").trim();
  const employmentType = String(body.employment_type ?? "").trim();
  const location = String(body.location ?? "").trim();
  const status = body.status_active ? "active" : "disabled";
  const groupIds = Array.isArray(body.group_ids) ? body.group_ids.map(Number) : body.group_ids ? [Number(body.group_ids)] : [];

  const existing = await c.env.DB.prepare("SELECT external_id FROM users WHERE id = ?").bind(id).first<{ external_id: string }>();
  let managerExternalId = String(body.manager_external_id ?? "").trim() || null;
  if (managerExternalId && existing && managerExternalId === existing.external_id) managerExternalId = null; // can't manage yourself

  const usernameTaken = await c.env.DB.prepare("SELECT id FROM users WHERE username = ? AND id != ?").bind(username, id).first();
  if (usernameTaken) {
    return c.text(`Username "${username}" is already taken by another account (usernames must be unique across every domain).`, 409);
  }

  await c.env.DB.prepare(
    `UPDATE users SET upn = ?, username = ?, display_name = ?, given_name = ?, family_name = ?, job_title = ?, department = ?, manager_external_id = ?,
     employee_number = ?, hire_date = ?, employment_status = ?, employment_type = ?, location = ?, status = ?, updated_at = ? WHERE id = ?`
  )
    .bind(
      upn,
      username,
      displayName,
      givenName,
      familyName,
      jobTitle,
      department,
      managerExternalId,
      employeeNumber,
      hireDate,
      employmentStatus,
      employmentType,
      location,
      status,
      new Date().toISOString(),
      id
    )
    .run();

  await c.env.DB.prepare("DELETE FROM group_members WHERE user_id = ?").bind(id).run();
  if (groupIds.length > 0) {
    await c.env.DB.batch(
      groupIds.map((gid) =>
        c.env.DB.prepare("INSERT INTO group_members (group_id, user_id) VALUES (?, ?)").bind(gid, id)
      )
    );
  }

  await logAudit(c.env, c.get("user"), "user.updated", upn, undefined, c.req.raw);
  await syncUserBestEffort(c, id, status === "active" ? "push" : "deactivate");
  for (const gid of groupIds) await syncGroupBestEffort(c, gid);

  return c.redirect(`/admin/users/${id}?saved=1`, 302);
});

admin.post("/admin/users/:id/reset-mfa", async (c) => {
  const id = Number(c.req.param("id"));
  await c.env.DB.prepare("UPDATE users SET totp_secret = NULL, mfa_enabled = 0, updated_at = ? WHERE id = ?")
    .bind(new Date().toISOString(), id)
    .run();
  await deleteBackupCodes(c.env, id);
  await deleteTrustedDevicesForUser(c.env, id);
  await logAudit(c.env, c.get("user"), "user.mfa_reset", String(id), undefined, c.req.raw);
  return c.redirect(`/admin/users/${id}`, 302);
});

admin.post("/admin/users/:id/reset-password", async (c) => {
  const id = Number(c.req.param("id"));
  const user = await c.env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(id).first<UserRow>();
  if (!user) return c.text("Not found", 404);

  const tempPassword = await generateAccountPassword(c.env);
  const { hash, salt, iterations } = await hashPassword(tempPassword);
  await c.env.DB.prepare(
    "UPDATE users SET password_hash = ?, password_salt = ?, password_iterations = ?, updated_at = ? WHERE id = ?"
  )
    .bind(hash, salt, iterations, new Date().toISOString(), id)
    .run();

  await logAudit(c.env, c.get("user"), "user.password_reset", user.upn, undefined, c.req.raw);

  return c.html(
    layout(
      c,
      "Password reset",
      cardSection(`
        ${secretBlock(`New temporary password for ${user.display_name}`, tempPassword)}
        <a href="/admin/users/${id}"><button class="primary" type="button">Continue</button></a>
      `),
      [{ label: "Admin", href: "/admin" }, { label: "Users", href: "/admin/users" }, { label: user.display_name, href: `/admin/users/${id}` }, { label: "Password reset" }]
    )
  );
});

admin.post("/admin/users/:id/sessions/revoke-all", async (c) => {
  const id = Number(c.req.param("id"));
  const count = await revokeAllSessionsForUser(c.env, id);
  await logAudit(c.env, c.get("user"), "user.sessions_revoked_all", String(id), { count }, c.req.raw);
  return c.redirect(`/admin/users/${id}`, 302);
});

admin.post("/admin/users/:id/apps/:clientDbId/revoke", async (c) => {
  const id = Number(c.req.param("id"));
  const clientDbId = Number(c.req.param("clientDbId"));
  const client = await c.env.DB.prepare("SELECT client_id, name FROM oauth_clients WHERE id = ?")
    .bind(clientDbId)
    .first<{ client_id: string; name: string }>();
  if (!client) return c.redirect(`/admin/users/${id}`, 302);

  await c.env.DB.batch([
    c.env.DB.prepare("DELETE FROM access_tokens WHERE user_id = ? AND client_id = ?").bind(id, client.client_id),
    c.env.DB.prepare("UPDATE refresh_tokens SET revoked_at = ? WHERE user_id = ? AND client_id = ?").bind(
      new Date().toISOString(),
      id,
      client.client_id
    ),
  ]);
  await logAudit(c.env, c.get("user"), "user.app_access_revoked", client.name, { userId: id }, c.req.raw);

  return c.redirect(`/admin/users/${id}`, 302);
});

admin.post("/admin/users/:id/delete", async (c) => {
  const id = Number(c.req.param("id"));
  const user = await c.env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(id).first<UserRow>();
  if (!user) return c.text("Not found", 404);

  if (await scimConfigured(c.env)) {
    const result = await deleteUserScim(c.env, user);
    if (!result.ok) await logAudit(c.env, c.get("user"), "scim.user_sync_failed", user.upn, { action: "delete", error: result.error }, c.req.raw);
  }

  await c.env.DB.batch([
    c.env.DB.prepare("DELETE FROM group_members WHERE user_id = ?").bind(id),
    c.env.DB.prepare("DELETE FROM access_tokens WHERE user_id = ?").bind(id),
    c.env.DB.prepare("DELETE FROM refresh_tokens WHERE user_id = ?").bind(id),
    c.env.DB.prepare("DELETE FROM auth_codes WHERE user_id = ?").bind(id),
    c.env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(id),
    c.env.DB.prepare("DELETE FROM mfa_backup_codes WHERE user_id = ?").bind(id),
    // Detach (but keep) audit history referencing this user, so the FK doesn't block deletion.
    c.env.DB.prepare("UPDATE audit_log SET actor_user_id = NULL WHERE actor_user_id = ?").bind(id),
    c.env.DB.prepare("DELETE FROM users WHERE id = ?").bind(id),
  ]);

  await logAudit(c.env, c.get("user"), "user.deleted", user.upn, undefined, c.req.raw);

  return c.redirect("/admin/users", 302);
});

// ---------- Groups ----------

admin.get("/admin/groups", async (c) => {
  const search = c.req.query("search") ?? "";
  const pageSize = [20, 50, 100].includes(Number(c.req.query("pageSize"))) ? Number(c.req.query("pageSize")) : 20;
  const page = Math.max(1, Number(c.req.query("page")) || 1);
  const like = `%${search}%`;

  const batchResults = await c.env.DB.batch([
    c.env.DB.prepare("SELECT COUNT(*) as n FROM groups WHERE name LIKE ? OR description LIKE ?").bind(like, like),
    c.env.DB.prepare(
      `SELECT g.*, (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) as member_count
       FROM groups g WHERE g.name LIKE ? OR g.description LIKE ? ORDER BY g.name LIMIT ? OFFSET ?`
    ).bind(like, like, pageSize, (page - 1) * pageSize),
  ]);
  const countRows = batchResults[0]!.results;
  const groups = batchResults[1]!.results;
  const total = Number((countRows[0] as { n: number } | undefined)?.n ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return c.html(
    layout(
      c,
      "Groups",
      `
      ${adminNav("groups")}
      ${cardSection(`
        <form method="GET" class="row between" style="margin-bottom:0;">
          <div style="display:flex; gap:8px;">
            <input type="text" name="search" placeholder="Search groups" value="${escapeHtml(search)}" style="max-width:300px; margin-bottom:0;" />
            <input type="hidden" name="page" value="1" />
            ${pageSizeSelect(pageSize)}
          </div>
          <a href="/admin/groups/new"><button class="primary" type="button">+ New group</button></a>
        </form>
      `)}
      ${cardSection(`
        <table>
          <thead><tr><th>Name</th><th>Description</th><th>Members</th></tr></thead>
          <tbody>
            ${(groups as (GroupRow & { member_count: number })[])
              .map(
                (g) =>
                  `<tr><td><a href="/admin/groups/${g.id}">${escapeHtml(g.name)}</a>${g.name === SUPER_ADMINS_GROUP ? ' <span class="badge badge-admin">Admin access</span>' : ""}${g.name === "All Employees" ? ' <span class="badge badge-active">Auto-joined</span>' : ""}</td><td>${escapeHtml(g.description ?? "")}</td><td>${g.member_count}</td></tr>`
              )
              .join("")}
          </tbody>
        </table>
        ${paginationControls("/admin/groups", page, totalPages, { search, pageSize })}
      `)}
      `,
      [{ label: "Admin", href: "/admin" }, { label: "Groups" }]
    )
  );
});

admin.get("/admin/groups/new", async (c) => {
  return c.html(
    layout(
      c,
      "New group",
      cardSection(`
        <form method="POST" action="/admin/groups">
          <label for="name">Name</label>
          <input type="text" id="name" name="name" required />
          <label for="description">Description</label>
          <input type="text" id="description" name="description" />
          <div class="row"><button class="primary" type="submit">Create group</button></div>
        </form>
      `),
      [{ label: "Admin", href: "/admin" }, { label: "Groups", href: "/admin/groups" }, { label: "New group" }]
    )
  );
});

admin.post("/admin/groups", async (c) => {
  const body = await c.req.parseBody();
  const name = String(body.name ?? "").trim();
  const description = String(body.description ?? "").trim();
  if (!name) return c.text("name is required", 400);

  const result = await c.env.DB.prepare("INSERT INTO groups (name, description) VALUES (?, ?)")
    .bind(name, description || null)
    .run();

  await logAudit(c.env, c.get("user"), "group.created", name, undefined, c.req.raw);
  await syncGroupBestEffort(c, Number(result.meta.last_row_id));

  return c.redirect(`/admin/groups/${result.meta.last_row_id}`, 302);
});

admin.get("/admin/groups/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const group = await c.env.DB.prepare("SELECT * FROM groups WHERE id = ?").bind(id).first<GroupRow>();
  if (!group) return c.text("Not found", 404);

  const { results: users } = await c.env.DB.prepare("SELECT * FROM users ORDER BY display_name").all<UserRow>();
  const { results: memberships } = await c.env.DB.prepare("SELECT user_id FROM group_members WHERE group_id = ?")
    .bind(id)
    .all<{ user_id: number }>();
  const memberIds = new Set(memberships.map((m) => m.user_id));

  return c.html(
    layout(
      c,
      group.name,
      `
      ${c.req.query("saved") ? successBanner("Saved.") : ""}
      ${cardSection(`
        <form method="POST" action="/admin/groups/${id}" onsubmit="return event.submitter.name !== 'delete' || confirm('Delete this group?');">
          <label for="name">Name</label>
          <input type="text" id="name" name="name" value="${escapeHtml(group.name)}" required />
          <label for="description">Description</label>
          <input type="text" id="description" name="description" value="${escapeHtml(group.description ?? "")}" />
          <h2>Members</h2>
          ${multiSelect(
            "user_ids",
            users.map((u) => ({ id: u.id, label: `${u.display_name} (${u.upn})` })),
            memberIds,
            "Search people..."
          )}
          <div class="row between">
            <button class="danger" type="submit" name="delete" value="1" formaction="/admin/groups/${id}/delete">Delete group</button>
            <button class="primary" type="submit">Save</button>
          </div>
        </form>
      `)}
      `,
      [{ label: "Admin", href: "/admin" }, { label: "Groups", href: "/admin/groups" }, { label: group.name }]
    )
  );
});

admin.post("/admin/groups/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.parseBody({ all: true });
  const name = String(body.name ?? "").trim();
  const description = String(body.description ?? "").trim();
  const userIds = Array.isArray(body.user_ids) ? body.user_ids.map(Number) : body.user_ids ? [Number(body.user_ids)] : [];

  await c.env.DB.prepare("UPDATE groups SET name = ?, description = ? WHERE id = ?")
    .bind(name, description || null, id)
    .run();

  await c.env.DB.prepare("DELETE FROM group_members WHERE group_id = ?").bind(id).run();
  if (userIds.length > 0) {
    await c.env.DB.batch(
      userIds.map((uid) =>
        c.env.DB.prepare("INSERT INTO group_members (group_id, user_id) VALUES (?, ?)").bind(id, uid)
      )
    );
  }

  await logAudit(c.env, c.get("user"), "group.updated", name, undefined, c.req.raw);
  await syncGroupBestEffort(c, id);

  return c.redirect(`/admin/groups/${id}?saved=1`, 302);
});

admin.post("/admin/groups/:id/delete", async (c) => {
  const id = Number(c.req.param("id"));
  const group = await c.env.DB.prepare("SELECT * FROM groups WHERE id = ?").bind(id).first<GroupRow>();

  if (group && (await scimConfigured(c.env))) {
    const result = await deleteGroupScim(c.env, group);
    if (!result.ok) await logAudit(c.env, c.get("user"), "scim.group_sync_failed", group.name, { action: "delete", error: result.error }, c.req.raw);
  }

  await c.env.DB.prepare("DELETE FROM groups WHERE id = ?").bind(id).run();
  await logAudit(c.env, c.get("user"), "group.deleted", group?.name, undefined, c.req.raw);
  return c.redirect("/admin/groups", 302);
});

// ---------- OIDC Clients ----------

admin.get("/admin/clients", async (c) => {
  const { results: clients } = await c.env.DB.prepare("SELECT * FROM oauth_clients ORDER BY name").all<OAuthClientRow>();
  return c.html(
    layout(
      c,
      "OIDC Clients",
      `
      ${adminNav("clients")}
      ${cardSection(`
        <p class="muted">Register the relying parties (e.g. Cloudflare Access) that are allowed to use this IdP.</p>
        <a href="/admin/clients/new"><button class="primary" type="button">+ New client</button></a>
      `)}
      ${cardSection(`
        <table>
          <thead><tr><th>Name</th><th>Client ID</th><th>Redirect URIs</th></tr></thead>
          <tbody>
            ${clients
              .map(
                (cl) =>
                  `<tr><td><a href="/admin/clients/${cl.id}">${escapeHtml(cl.name)}</a></td><td><code>${escapeHtml(cl.client_id)}</code></td><td>${JSON.parse(cl.redirect_uris).map(escapeHtml).join("<br/>")}</td></tr>`
              )
              .join("")}
          </tbody>
        </table>
      `)}
      `,
      [{ label: "Admin", href: "/admin" }, { label: "OIDC Clients" }]
    )
  );
});

admin.get("/admin/clients/new", async (c) => {
  return c.html(
    layout(
      c,
      "New OIDC client",
      cardSection(`
        <form method="POST" action="/admin/clients">
          <label for="name">Name</label>
          <input type="text" id="name" name="name" placeholder="Cloudflare Access" required />
          <label for="redirect_uris">Redirect URIs (one per line)</label>
          <textarea id="redirect_uris" name="redirect_uris" rows="3" placeholder="https://your-team.cloudflareaccess.com/cdn-cgi/access/callback"></textarea>
          <div class="row"><button class="primary" type="submit">Create client</button></div>
        </form>
      `),
      [{ label: "Admin", href: "/admin" }, { label: "OIDC Clients", href: "/admin/clients" }, { label: "New client" }]
    )
  );
});

admin.post("/admin/clients", async (c) => {
  const body = await c.req.parseBody();
  const name = String(body.name ?? "").trim();
  const redirectUris = String(body.redirect_uris ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!name) return c.text("name is required", 400);

  const clientId = `flareid_${randomToken(8)}`;
  const clientSecret = randomToken(24);
  const clientSecretHash = await sha256Hex(clientSecret);

  const result = await c.env.DB.prepare(
    "INSERT INTO oauth_clients (client_id, client_secret_hash, name, redirect_uris, created_at) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(clientId, clientSecretHash, name, JSON.stringify(redirectUris), new Date().toISOString())
    .run();

  await logAudit(c.env, c.get("user"), "oidc_client.created", name, undefined, c.req.raw);

  return c.html(
    layout(
      c,
      "Client created",
      cardSection(`
        <p class="success">Created "${escapeHtml(name)}".</p>
        ${secretBlock("Client secret", clientSecret)}
        ${oidcEndpointsBlock(c.env, clientId)}
        <a href="/admin/clients/${result.meta.last_row_id}"><button class="primary" type="button">Continue</button></a>
      `),
      [{ label: "Admin", href: "/admin" }, { label: "OIDC Clients", href: "/admin/clients" }, { label: "Client created" }]
    )
  );
});

admin.get("/admin/clients/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const client = await c.env.DB.prepare("SELECT * FROM oauth_clients WHERE id = ?").bind(id).first<OAuthClientRow>();
  if (!client) return c.text("Not found", 404);

  return c.html(
    layout(
      c,
      client.name,
      `
      ${c.req.query("saved") ? successBanner("Saved.") : ""}
      ${cardSection(`
        ${oidcEndpointsBlock(c.env, client.client_id)}
        <form method="POST" action="/admin/clients/${id}">
          <label for="name">Name</label>
          <input type="text" id="name" name="name" value="${escapeHtml(client.name)}" required />
          <label for="redirect_uris">Redirect URIs (one per line)</label>
          <textarea id="redirect_uris" name="redirect_uris" rows="3">${escapeHtml(JSON.parse(client.redirect_uris).join("\n"))}</textarea>
          <div class="row"><button class="primary" type="submit">Save</button></div>
        </form>
        <div class="row" style="justify-content:flex-start; gap:10px; margin-top:8px;">
          <form method="POST" action="/admin/clients/${id}/rotate-secret">
            <button class="secondary" type="submit">Rotate secret</button>
          </form>
          <form method="POST" action="/admin/clients/${id}/delete" onsubmit="return confirm('Delete OIDC client \\'${escapeHtml(client.name).replace(/'/g, "")}\\'? Anything still using this client_id will stop working immediately.');">
            <button class="danger" type="submit">Delete client</button>
          </form>
        </div>
      `)}
      `,
      [{ label: "Admin", href: "/admin" }, { label: "OIDC Clients", href: "/admin/clients" }, { label: client.name }]
    )
  );
});

admin.post("/admin/clients/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.parseBody();
  const name = String(body.name ?? "").trim();
  const redirectUris = String(body.redirect_uris ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  await c.env.DB.prepare("UPDATE oauth_clients SET name = ?, redirect_uris = ? WHERE id = ?")
    .bind(name, JSON.stringify(redirectUris), id)
    .run();

  await logAudit(c.env, c.get("user"), "oidc_client.updated", name, undefined, c.req.raw);

  return c.redirect(`/admin/clients/${id}?saved=1`, 302);
});

admin.post("/admin/clients/:id/rotate-secret", async (c) => {
  const id = Number(c.req.param("id"));
  const client = await c.env.DB.prepare("SELECT * FROM oauth_clients WHERE id = ?").bind(id).first<OAuthClientRow>();
  if (!client) return c.text("Not found", 404);

  const clientSecret = randomToken(24);
  const clientSecretHash = await sha256Hex(clientSecret);
  await c.env.DB.prepare("UPDATE oauth_clients SET client_secret_hash = ? WHERE id = ?")
    .bind(clientSecretHash, id)
    .run();

  await logAudit(c.env, c.get("user"), "oidc_client.secret_rotated", client.name, undefined, c.req.raw);

  return c.html(
    layout(
      c,
      "Secret rotated",
      cardSection(`
        ${secretBlock(`New client secret for ${client.name}`, clientSecret)}
        ${oidcEndpointsBlock(c.env, client.client_id)}
        <a href="/admin/clients/${id}"><button class="primary" type="button">Continue</button></a>
      `),
      [{ label: "Admin", href: "/admin" }, { label: "OIDC Clients", href: "/admin/clients" }, { label: client.name, href: `/admin/clients/${id}` }, { label: "Secret rotated" }]
    )
  );
});

admin.post("/admin/clients/:id/delete", async (c) => {
  const id = Number(c.req.param("id"));
  const client = await c.env.DB.prepare("SELECT * FROM oauth_clients WHERE id = ?").bind(id).first<OAuthClientRow>();
  if (!client) return c.text("Not found", 404);

  await c.env.DB.batch([
    c.env.DB.prepare("DELETE FROM auth_codes WHERE client_id = ?").bind(client.client_id),
    c.env.DB.prepare("DELETE FROM access_tokens WHERE client_id = ?").bind(client.client_id),
    c.env.DB.prepare("DELETE FROM refresh_tokens WHERE client_id = ?").bind(client.client_id),
    c.env.DB.prepare("DELETE FROM oauth_clients WHERE id = ?").bind(id),
  ]);

  await logAudit(c.env, c.get("user"), "oidc_client.deleted", client.name, undefined, c.req.raw);

  return c.redirect("/admin/clients", 302);
});

// ---------- Domains ----------

admin.get("/admin/domains", async (c) => {
  const domains = await listDomains(c.env);
  return c.html(
    layout(
      c,
      "Domains",
      `
      ${adminNav("domains")}
      ${c.req.query("saved") ? successBanner("Saved.") : ""}
      ${cardSection(`
        <h2>Add a domain</h2>
        <form method="POST" action="/admin/domains" class="field-row">
          <input type="text" name="domain" placeholder="example.com" required />
          <div class="row" style="margin:0;"><button class="primary" type="submit">Add</button></div>
        </form>
      `)}
      ${cardSection(`
        <table>
          <thead><tr><th>Domain</th><th>Default</th><th></th></tr></thead>
          <tbody>
            ${domains
              .map(
                (d) => `<tr>
                  <td>${escapeHtml(d.domain)}</td>
                  <td>${d.is_default ? '<span class="badge badge-active">Default</span>' : ""}</td>
                  <td>
                    ${!d.is_default ? `<form method="POST" action="/admin/domains/${d.id}/set-default" style="display:inline;"><button class="link-button" type="submit">Make default</button></form> · ` : ""}
                    <form method="POST" action="/admin/domains/${d.id}/apply-to-all" style="display:inline;" onsubmit="return confirm('Change every user\\'s UPN domain to ${escapeHtml(d.domain).replace(/'/g, "")}? Usernames are kept.');">
                      <button class="link-button" type="submit">Apply to all users</button>
                    </form> ·
                    <form method="POST" action="/admin/domains/${d.id}/delete" style="display:inline;">
                      <button class="link-button" type="submit">Delete</button>
                    </form>
                  </td>
                </tr>`
              )
              .join("")}
          </tbody>
        </table>
      `)}
      `,
      [{ label: "Admin", href: "/admin" }, { label: "Domains" }]
    )
  );
});

admin.post("/admin/domains", async (c) => {
  const body = await c.req.parseBody();
  const domain = String(body.domain ?? "").trim().toLowerCase();
  if (domain) {
    await addDomain(c.env, domain);
    await logAudit(c.env, c.get("user"), "domain.added", domain, undefined, c.req.raw);
  }
  return c.redirect("/admin/domains?saved=1", 302);
});

admin.post("/admin/domains/:id/set-default", async (c) => {
  const id = Number(c.req.param("id"));
  await setDefaultDomain(c.env, id);
  await logAudit(c.env, c.get("user"), "domain.set_default", String(id), undefined, c.req.raw);
  return c.redirect("/admin/domains", 302);
});

admin.post("/admin/domains/:id/delete", async (c) => {
  const id = Number(c.req.param("id"));
  const { error } = await deleteDomain(c.env, id);
  await logAudit(c.env, c.get("user"), "domain.delete_attempted", String(id), error ? { error } : undefined, c.req.raw);
  return c.redirect("/admin/domains", 302);
});

admin.post("/admin/domains/:id/apply-to-all", async (c) => {
  const id = Number(c.req.param("id"));
  const domains = await listDomains(c.env);
  const domain = domains.find((d) => d.id === id);
  if (!domain) return c.redirect("/admin/domains", 302);

  const { updated, conflicts } = await applyDomainToAllUsers(c.env, domain.domain);
  await logAudit(c.env, c.get("user"), "domain.applied_to_all", domain.domain, { updated, conflicts }, c.req.raw);

  return c.html(
    layout(
      c,
      "Domain applied",
      cardSection(`
        <p class="success">Updated ${updated} user(s) to @${escapeHtml(domain.domain)}.</p>
        ${conflicts.length > 0 ? `<p class="error">Skipped due to username conflicts: ${conflicts.map(escapeHtml).join(", ")}</p>` : ""}
        <a href="/admin/domains"><button class="primary" type="button">Continue</button></a>
      `),
      [{ label: "Admin", href: "/admin" }, { label: "Domains", href: "/admin/domains" }, { label: "Domain applied" }]
    )
  );
});

// ---------- Security (default password + policy) ----------

admin.get("/admin/security", async (c) => {
  const defaultPassword = await getDefaultPassword(c.env);
  const policy = await getPasswordPolicy(c.env);
  const rateLimit = await getRateLimitPolicy(c.env);
  const mfaRequired = await isMfaRequired(c.env);
  const newUserPasswordMode = await getNewUserPasswordMode(c.env);
  const loginGradient = await getLoginGradient(c.env);
  const appName = c.get("appName");

  return c.html(
    layout(
      c,
      "Security",
      `
      ${adminNav("security")}
      ${c.req.query("saved") ? successBanner("Saved.") : ""}
      <div class="two-col security-grid">
      ${cardSection(`
        <h2>Default password</h2>
        <p class="muted">Used for newly created accounts and available to bulk-apply to every existing account.</p>
        <form method="POST" action="/admin/security/default-password" onsubmit="return event.submitter.name !== 'apply' || confirm('Reset every account\\'s password to the default password shown above?');">
          <input type="text" name="default_password" value="${escapeHtml(defaultPassword)}" required />
          <div class="row" style="justify-content:flex-start; gap:10px;">
            <button class="primary" type="submit">Save</button>
            <button class="danger" type="submit" name="apply" value="1" formaction="/admin/security/apply-default-password">Apply default password to all accounts</button>
          </div>
        </form>
      `)}
      ${cardSection(`
        <h2>New account password</h2>
        <p class="muted">What password a newly created account (or a manual password reset) gets. Randomly generated passwords always satisfy the complexity policy below.</p>
        <form method="POST" action="/admin/security/new-user-password-mode">
          <label><input type="radio" name="mode" value="default" ${newUserPasswordMode === "default" ? "checked" : ""} style="width:auto; display:inline; margin-right:6px;" /> Use the default password above</label>
          <label><input type="radio" name="mode" value="random" ${newUserPasswordMode === "random" ? "checked" : ""} style="width:auto; display:inline; margin-right:6px;" /> Randomly generate one</label>
          <div class="row" style="justify-content:flex-start; margin-top:12px;"><button class="primary" type="submit">Save</button></div>
        </form>
      `)}
      ${cardSection(`
        <h2>Password complexity policy</h2>
        <p class="muted">Enforced on self-service password changes and randomly generated account passwords.</p>
        <form method="POST" action="/admin/security/password-policy">
          <label for="minLength">Minimum length</label>
          <input type="number" id="minLength" name="minLength" min="4" max="64" value="${policy.minLength}" style="max-width:120px;" />
          <label><input type="checkbox" name="requireUppercase" value="1" ${policy.requireUppercase ? "checked" : ""} style="width:auto; display:inline; margin-right:6px;" /> Require uppercase letter</label>
          <label><input type="checkbox" name="requireLowercase" value="1" ${policy.requireLowercase ? "checked" : ""} style="width:auto; display:inline; margin-right:6px;" /> Require lowercase letter</label>
          <label><input type="checkbox" name="requireNumber" value="1" ${policy.requireNumber ? "checked" : ""} style="width:auto; display:inline; margin-right:6px;" /> Require number</label>
          <label><input type="checkbox" name="requireSymbol" value="1" ${policy.requireSymbol ? "checked" : ""} style="width:auto; display:inline; margin-right:6px;" /> Require symbol</label>
          <div class="row" style="justify-content:flex-start; margin-top:12px;"><button class="primary" type="submit">Save policy</button></div>
        </form>
      `)}
      ${cardSection(`
        <h2>Multi-factor authentication</h2>
        <p class="muted">When required, anyone without MFA enrolled is forced to set it up (with backup codes) the next time they sign in, before they can use anything else.</p>
        <form method="POST" action="/admin/security/require-mfa">
          <label><input type="checkbox" name="required" value="1" ${mfaRequired ? "checked" : ""} style="width:auto; display:inline; margin-right:6px;" /> Require MFA for every account</label>
          <div class="row" style="justify-content:flex-start; margin-top:12px;"><button class="primary" type="submit">Save</button></div>
        </form>
      `)}
      ${cardSection(`
        <h2>Branding</h2>
        <p class="muted">The display name shown in the nav, page titles, and on the sign-in page.</p>
        <form method="POST" action="/admin/security/app-name">
          <label for="app_name">App name</label>
          <input type="text" id="app_name" name="app_name" value="${escapeHtml(appName)}" required maxlength="60" />
          <div class="row" style="justify-content:flex-start;"><button class="primary" type="submit">Save</button></div>
        </form>
      `)}
      ${cardSection(`
        <h2>Login page appearance</h2>
        <p class="muted">The background gradient shown behind the sign-in and MFA cards.</p>
        <form method="POST" action="/admin/security/login-gradient">
          <div class="field-row">
            <div>
              <label for="gradient_from">Gradient start</label>
              <input type="color" id="gradient_from" name="from" value="${escapeHtml(loginGradient.from)}" style="height:42px; padding:4px; cursor:pointer;" />
            </div>
            <div>
              <label for="gradient_to">Gradient end</label>
              <input type="color" id="gradient_to" name="to" value="${escapeHtml(loginGradient.to)}" style="height:42px; padding:4px; cursor:pointer;" />
            </div>
          </div>
          <div style="height:60px; border-radius:10px; margin-bottom:16px; background: linear-gradient(45deg, ${escapeHtml(loginGradient.from)}, ${escapeHtml(loginGradient.to)});"></div>
          <div class="row" style="justify-content:flex-start;"><button class="primary" type="submit">Save</button></div>
        </form>
      `)}
      ${cardSection(`
        <h2>Login rate limiting</h2>
        <p class="muted">Locks out an account/IP combination after too many failed password or MFA-code attempts within the window below.</p>
        <form method="POST" action="/admin/security/rate-limit">
          <div class="field-row">
            <div>
              <label for="maxAttempts">Max failed attempts</label>
              <input type="number" id="maxAttempts" name="maxAttempts" min="1" max="100" value="${rateLimit.maxAttempts}" />
            </div>
            <div>
              <label for="windowMinutes">Window (minutes)</label>
              <input type="number" id="windowMinutes" name="windowMinutes" min="1" max="1440" value="${rateLimit.windowMinutes}" />
            </div>
          </div>
          <div class="row" style="justify-content:flex-start;"><button class="primary" type="submit">Save</button></div>
        </form>
      `)}
      </div>
      `,
      [{ label: "Admin", href: "/admin" }, { label: "Security" }]
    )
  );
});

admin.post("/admin/security/default-password", async (c) => {
  const body = await c.req.parseBody();
  const password = String(body.default_password ?? "");
  if (password) {
    await setDefaultPassword(c.env, password);
    await logAudit(c.env, c.get("user"), "settings.default_password_changed", undefined, undefined, c.req.raw);
  }
  return c.redirect("/admin/security?saved=1", 302);
});

admin.post("/admin/security/app-name", async (c) => {
  const body = await c.req.parseBody();
  const name = String(body.app_name ?? "").trim();
  if (name) {
    await setAppName(c.env, name);
    await logAudit(c.env, c.get("user"), "settings.app_name_changed", name, undefined, c.req.raw);
  }
  return c.redirect("/admin/security?saved=1", 302);
});

admin.post("/admin/security/login-gradient", async (c) => {
  const body = await c.req.parseBody();
  const from = String(body.from ?? "").trim();
  const to = String(body.to ?? "").trim();
  const isHexColor = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v);

  if (isHexColor(from) && isHexColor(to)) {
    await setLoginGradient(c.env, { from, to });
    await logAudit(c.env, c.get("user"), "settings.login_gradient_changed", undefined, { from, to }, c.req.raw);
  }
  return c.redirect("/admin/security?saved=1", 302);
});

admin.post("/admin/security/apply-default-password", async (c) => {
  const body = await c.req.parseBody();
  const password = String(body.default_password ?? "");
  if (password) {
    await setDefaultPassword(c.env, password);
    await logAudit(c.env, c.get("user"), "settings.default_password_changed", undefined, undefined, c.req.raw);
  }

  const count = await applyDefaultPasswordToAllUsers(c.env);
  await logAudit(c.env, c.get("user"), "settings.default_password_applied_to_all", undefined, { count }, c.req.raw);
  return c.html(
    layout(
      c,
      "Default password applied",
      cardSection(`
        <p class="success">Reset the password for ${count} account(s) to the default password.</p>
        <a href="/admin/security"><button class="primary" type="button">Continue</button></a>
      `),
      [{ label: "Admin", href: "/admin" }, { label: "Security", href: "/admin/security" }, { label: "Default password applied" }]
    )
  );
});

admin.post("/admin/security/new-user-password-mode", async (c) => {
  const body = await c.req.parseBody();
  const mode = body.mode === "default" ? "default" : "random";
  await setNewUserPasswordMode(c.env, mode);
  await logAudit(c.env, c.get("user"), "settings.new_user_password_mode_changed", undefined, { mode }, c.req.raw);
  return c.redirect("/admin/security?saved=1", 302);
});

admin.post("/admin/security/password-policy", async (c) => {
  const body = await c.req.parseBody();
  await setPasswordPolicy(c.env, {
    minLength: Number(body.minLength) || 8,
    requireUppercase: !!body.requireUppercase,
    requireLowercase: !!body.requireLowercase,
    requireNumber: !!body.requireNumber,
    requireSymbol: !!body.requireSymbol,
  });
  await logAudit(c.env, c.get("user"), "settings.password_policy_changed", undefined, undefined, c.req.raw);
  return c.redirect("/admin/security?saved=1", 302);
});

admin.post("/admin/security/require-mfa", async (c) => {
  const body = await c.req.parseBody();
  await setMfaRequired(c.env, !!body.required);
  await logAudit(c.env, c.get("user"), "settings.require_mfa_changed", undefined, { required: !!body.required }, c.req.raw);
  return c.redirect("/admin/security?saved=1", 302);
});

admin.post("/admin/security/rate-limit", async (c) => {
  const body = await c.req.parseBody();
  await setRateLimitPolicy(c.env, {
    maxAttempts: Number(body.maxAttempts) || 5,
    windowMinutes: Number(body.windowMinutes) || 15,
  });
  await logAudit(c.env, c.get("user"), "settings.rate_limit_changed", undefined, undefined, c.req.raw);
  return c.redirect("/admin/security?saved=1", 302);
});

// ---------- SCIM (push users/groups to e.g. Cloudflare Access) ----------

admin.get("/admin/scim", async (c) => {
  const config = await getScimConfig(c.env);
  const scope = await getScimScope(c.env);
  const { results: groups } = await c.env.DB.prepare("SELECT * FROM groups ORDER BY name").all<GroupRow>();

  return c.html(
    layout(
      c,
      "SCIM",
      `
      ${adminNav("scim")}
      ${c.req.query("saved") ? successBanner("Saved.") : ""}
      ${cardSection(`
        <p class="sub">FlareID acts as a SCIM 2.0 <em>client</em>, pushing users and groups to a SCIM server -
        for example, the SCIM Endpoint + Secret Cloudflare generates once you enable SCIM on this IdP's Access identity provider.</p>
        <form method="POST" action="/admin/scim">
          <label for="endpoint">SCIM Endpoint (base URL)</label>
          <input type="text" id="endpoint" name="endpoint" value="${escapeHtml(config.endpoint)}" placeholder="https://api.cloudflare.com/client/v4/accounts/<account_id>/access/scim" />
          <label for="secret">SCIM Secret</label>
          <input type="text" id="secret" name="secret" value="${escapeHtml(config.secret)}" placeholder="Bearer token from Cloudflare" />
          <div class="row" style="justify-content:flex-start;"><button class="primary" type="submit">Save</button></div>
        </form>
      `)}
      <div class="two-col">
        ${cardSection(`
          <h2>Sync scope</h2>
          <p class="muted">Push everyone, or only members of specific groups. Users/groups outside scope are removed from the SCIM server if they'd previously been synced.</p>
          <form method="POST" action="/admin/scim/scope">
            <label><input type="radio" name="mode" value="all" ${scope.mode === "all" ? "checked" : ""} onclick="document.getElementById('scim-scope-groups').style.display='none';" style="width:auto; display:inline; margin-right:6px;" /> All groups</label>
            <label><input type="radio" name="mode" value="selected" ${scope.mode === "selected" ? "checked" : ""} onclick="document.getElementById('scim-scope-groups').style.display='block';" style="width:auto; display:inline; margin-right:6px;" /> Specific groups only</label>
            <div id="scim-scope-groups" style="display:${scope.mode === "selected" ? "block" : "none"}; margin-top:8px;">
              ${multiSelect(
                "group_ids",
                groups.map((g) => ({ id: g.id, label: g.name })),
                new Set(scope.groupIds),
                "Search groups..."
              )}
            </div>
            <div class="row" style="justify-content:flex-start;"><button class="primary" type="submit">Save scope</button></div>
          </form>
        `)}
        ${cardSection(`
          <h2>Test &amp; sync</h2>
          <p class="muted">Test the connection, then push every in-scope user and group. New/changed users and groups are also pushed automatically going forward.</p>
          <div class="row" style="justify-content:flex-start; gap:10px;">
            <button class="secondary" type="button" id="scim-test-btn" onclick="scimAction('test')">Test connection</button>
            <button class="primary" type="button" id="scim-sync-btn" onclick="scimAction('sync')">Sync all now</button>
          </div>
          <div id="scim-status"></div>
        `)}
      </div>
      <script>
        async function scimAction(kind) {
          const btn = document.getElementById('scim-' + kind + '-btn');
          const status = document.getElementById('scim-status');
          const original = btn.textContent;
          btn.disabled = true;
          btn.textContent = kind === 'test' ? 'Testing...' : 'Syncing...';
          status.innerHTML = '';
          try {
            const res = await fetch('/admin/scim/' + kind, { method: 'POST' });
            const data = await res.json();
            const p = document.createElement('p');
            p.className = data.ok ? 'success' : 'error';
            p.style.marginTop = '12px';
            p.textContent = data.message;
            status.appendChild(p);
          } catch (e) {
            const p = document.createElement('p');
            p.className = 'error';
            p.style.marginTop = '12px';
            p.textContent = 'Request failed: ' + e;
            status.appendChild(p);
          } finally {
            btn.disabled = false;
            btn.textContent = original;
          }
        }
      </script>
      `,
      [{ label: "Admin", href: "/admin" }, { label: "SCIM" }]
    )
  );
});

admin.post("/admin/scim", async (c) => {
  const body = await c.req.parseBody();
  await setScimConfig(c.env, { endpoint: String(body.endpoint ?? ""), secret: String(body.secret ?? "") });
  await logAudit(c.env, c.get("user"), "settings.scim_config_changed", undefined, undefined, c.req.raw);
  return c.redirect("/admin/scim?saved=1", 302);
});

admin.post("/admin/scim/scope", async (c) => {
  const body = await c.req.parseBody({ all: true });
  const mode = body.mode === "selected" ? "selected" : "all";
  const groupIds = Array.isArray(body.group_ids) ? body.group_ids.map(Number) : body.group_ids ? [Number(body.group_ids)] : [];

  await setScimScope(c.env, { mode, groupIds });
  await logAudit(c.env, c.get("user"), "settings.scim_scope_changed", undefined, { mode, groupIds }, c.req.raw);

  return c.redirect("/admin/scim?saved=1", 302);
});

admin.post("/admin/scim/test", async (c) => {
  const result = await testScimConnection(c.env);
  await logAudit(c.env, c.get("user"), "scim.connection_tested", undefined, { ok: result.ok }, c.req.raw);

  return c.json({
    ok: result.ok,
    message: result.ok
      ? `Connection succeeded (HTTP ${result.status}).`
      : `Connection failed${result.status ? ` (HTTP ${result.status})` : ""}: ${result.error ?? "unknown error"}`,
  });
});

admin.post("/admin/scim/sync", async (c) => {
  const summary = await syncAll(c.env);
  await logAudit(c.env, c.get("user"), "scim.sync_all", undefined, summary, c.req.raw);

  return c.json({
    ok: summary.userErrors === 0 && summary.groupErrors === 0,
    message: `Pushed ${summary.users} user(s)${summary.userErrors ? ` (${summary.userErrors} failed)` : ""} and ${summary.groups} group(s)${summary.groupErrors ? ` (${summary.groupErrors} failed)` : ""}.`,
  });
});

// ---------- Audit log ----------

admin.get("/admin/audit", async (c) => {
  const search = c.req.query("search") ?? "";
  const pageSize = [20, 50, 100].includes(Number(c.req.query("pageSize"))) ? Number(c.req.query("pageSize")) : 20;
  const page = Math.max(1, Number(c.req.query("page")) || 1);
  const like = `%${search}%`;

  const whereClause = "WHERE actor_upn LIKE ? OR action LIKE ? OR target LIKE ? OR details LIKE ? OR ip LIKE ?";
  const params = [like, like, like, like, like];

  const batchResults = await c.env.DB.batch([
    c.env.DB.prepare(`SELECT COUNT(*) as n FROM audit_log ${whereClause}`).bind(...params),
    c.env.DB.prepare(`SELECT * FROM audit_log ${whereClause} ORDER BY at DESC LIMIT ? OFFSET ?`).bind(
      ...params,
      pageSize,
      (page - 1) * pageSize
    ),
  ]);
  const countRows = batchResults[0]!.results;
  const entries = batchResults[1]!.results as AuditLogRow[];
  const total = Number((countRows[0] as { n: number } | undefined)?.n ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return c.html(
    layout(
      c,
      "Audit Log",
      `
      ${adminNav("audit")}
      ${cardSection(`
        <form method="GET" class="row between" style="margin-bottom:0;">
          <div style="display:flex; gap:8px;">
            <input type="text" name="search" placeholder="Search audit log" value="${escapeHtml(search)}" style="max-width:300px; margin-bottom:0;" />
            <input type="hidden" name="page" value="1" />
            ${pageSizeSelect(pageSize)}
          </div>
        </form>
      `)}
      ${cardSection(`
        <p class="muted" style="margin-top:0;">Click a row to see its IP and details.</p>
        <table>
          <thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Target</th></tr></thead>
          <tbody>
            ${entries
              .map((e) => {
                let parsedDetails = null;
                if (e.details) {
                  try {
                    parsedDetails = JSON.parse(e.details);
                  } catch {
                    parsedDetails = e.details;
                  }
                }
                const fullEntryJson = JSON.stringify(
                  {
                    time: e.at,
                    actor: e.actor_upn ?? "system",
                    action: e.action,
                    target: e.target ?? null,
                    ip: e.ip ?? null,
                    user_agent: e.user_agent ?? null,
                    details: parsedDetails,
                  },
                  null,
                  2
                );

                return `<tr class="audit-row" onclick="this.nextElementSibling.classList.toggle('open')">
                  <td class="muted">${escapeHtml(new Date(e.at).toLocaleString())}</td>
                  <td>${escapeHtml(e.actor_upn ?? "system")}</td>
                  <td><code>${escapeHtml(e.action)}</code></td>
                  <td>${escapeHtml(e.target ?? "")}</td>
                </tr>
                <tr class="audit-detail">
                  <td colspan="4">
                    <div class="audit-detail-content">
                      <div class="row between" style="margin:0;">
                        <div><span class="muted">IP:</span> ${escapeHtml(e.ip ?? "unknown")}</div>
                        ${copyButton(fullEntryJson, "Copy JSON")}
                      </div>
                      <div><span class="muted">User-Agent:</span> ${escapeHtml(e.user_agent ?? "unknown")}</div>
                      ${e.details ? `<div><span class="muted">Details:</span> <code>${escapeHtml(e.details)}</code></div>` : ""}
                    </div>
                  </td>
                </tr>`;
              })
              .join("")}
          </tbody>
        </table>
        ${paginationControls("/admin/audit", page, totalPages, { search, pageSize })}
      `)}
      `,
      [{ label: "Admin", href: "/admin" }, { label: "Audit Log" }]
    )
  );
});

import { Hono, type Context } from "hono";
import QRCode from "qrcode";
import type { Env } from "../env.js";
import { requireSession } from "../lib/middleware.js";
import { cardSection, escapeHtml, nav, page } from "../lib/html.js";
import { buildOtpAuthUri, generateBase32Secret, verifyTotp } from "../lib/totp.js";
import { deletePendingEnrollment, getPendingEnrollment, storePendingEnrollment } from "../lib/mfa-enrollment.js";
import { getUserGroupNames } from "../lib/db.js";
import { verifyPassword, hashPassword } from "../lib/password.js";
import { getPasswordPolicy, validatePassword } from "../lib/settings.js";
import { logAudit } from "../lib/audit.js";
import { countRemainingBackupCodes, deleteBackupCodes, generateBackupCodes } from "../lib/backup-codes.js";
import { listActiveSessionsForUser, revokeAllSessionsForUser, revokeSession } from "../lib/sessions.js";
import { deleteLoginFlow, getLoginFlow } from "../lib/authorize-state.js";
import { finishOidcAuthorize } from "./authorize.js";
import { deleteTrustedDevicesForUser, listTrustedDevices, revokeTrustedDevice } from "../lib/trusted-devices.js";

export const account = new Hono<{ Bindings: Env }>();

account.use("/account/*", requireSession);
account.use("/account", requireSession);

function layout(c: Context<{ Bindings: Env }>, title: string, body: string, headerMeta?: string) {
  const appName = c.get("appName");
  return page(
    title,
    `<div class="page-header"><h1>${escapeHtml(title)}${headerMeta ? ` <span class="header-meta">${escapeHtml(headerMeta)}</span>` : ""}</h1></div>${body}`,
    appName,
    true,
    nav(appName, c.get("isSuperAdmin"))
  );
}

function relativeTime(iso: string): string {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

account.get("/account", async (c) => {
  const user = c.get("user");
  const groups = await getUserGroupNames(c.env, user.id);
  const remainingBackupCodes = user.mfa_enabled ? await countRemainingBackupCodes(c.env, user.id) : 0;
  const currentSessionId = c.get("sessionId");
  const sessions = await listActiveSessionsForUser(c.env, user.id);
  const devices = await listTrustedDevices(c.env, user.id);
  const { results: connectedApps } = await c.env.DB.prepare(
    `SELECT DISTINCT oc.id, oc.name FROM access_tokens at
     JOIN oauth_clients oc ON oc.client_id = at.client_id
     WHERE at.user_id = ? AND at.expires_at > ?
     UNION
     SELECT DISTINCT oc.id, oc.name FROM refresh_tokens rt
     JOIN oauth_clients oc ON oc.client_id = rt.client_id
     WHERE rt.user_id = ? AND rt.revoked_at IS NULL`
  )
    .bind(user.id, new Date().toISOString(), user.id)
    .all<{ id: number; name: string }>();

  return c.html(
    layout(
      c,
      `${user.display_name}`,
      `
      ${cardSection(`
        <h2>Groups</h2>
        ${groups.length > 0 ? groups.map((g) => `<span class="pill">${escapeHtml(g)}</span>`).join("") : '<p class="muted">No group memberships</p>'}
      `)}

      <div class="two-col">
        ${cardSection(`
          <div class="row between">
            <h2 style="margin:0;">Two-factor authentication</h2>
            <span class="badge ${user.mfa_enabled ? "badge-active" : "badge-disabled"}">${user.mfa_enabled ? "Enabled" : "Not enabled"}</span>
          </div>
          ${
            user.mfa_enabled
              ? `<p class="muted" style="margin-top:8px;">${remainingBackupCodes} backup code(s) remaining.</p>
                 <form method="POST" action="/account/mfa/backup-codes/regenerate" style="margin-bottom:14px;" onsubmit="return confirm('Generate new backup codes? Your existing codes will stop working.');">
                   <button class="secondary" type="submit">Regenerate backup codes</button>
                 </form>
                 <form method="POST" action="/account/mfa/disable">
                   <label for="mfa_code">Enter a current code to disable MFA</label>
                   <div class="field-row" style="align-items:flex-start;">
                     <input type="text" id="mfa_code" name="code" inputmode="numeric" maxlength="6" required style="max-width:160px" />
                     <div></div>
                   </div>
                   <button class="danger" type="submit">Disable MFA</button>
                 </form>`
              : `<p class="muted" style="margin-top:8px;">Protect your account with a standard authenticator app.</p>
                 <a href="/account/mfa/setup"><button class="primary" type="button">Set up MFA</button></a>`
          }
        `)}

        ${cardSection(`
          <h2>Change password</h2>
          <form method="POST" action="/account/password">
            <label for="current_password">Current password</label>
            <input type="password" id="current_password" name="current_password" required />
            <label for="new_password">New password</label>
            <input type="password" id="new_password" name="new_password" required />
            <label for="confirm_password">Confirm new password</label>
            <input type="password" id="confirm_password" name="confirm_password" required />
            <div class="row"><button class="primary" type="submit">Update password</button></div>
          </form>
        `)}
      </div>

      ${cardSection(`
        <div class="row between">
          <h2 style="margin:0;">Active sessions</h2>
          ${sessions.length > 1 ? `<form method="POST" action="/account/sessions/revoke-others" onsubmit="return confirm('Sign out every other session?');"><button class="secondary" type="submit">Sign out all other sessions</button></form>` : ""}
        </div>
        <table style="margin-top:10px;">
          <thead><tr><th>Started</th><th>Last active</th><th>IP</th><th></th></tr></thead>
          <tbody>
            ${sessions
              .map(
                (s) => `<tr>
                  <td>${escapeHtml(new Date(s.created_at).toLocaleString())}</td>
                  <td>${escapeHtml(relativeTime(s.last_seen_at))}</td>
                  <td class="muted">${escapeHtml(s.ip ?? "unknown")}</td>
                  <td>
                    ${
                      s.id === currentSessionId
                        ? '<span class="badge badge-active">This device</span>'
                        : `<form method="POST" action="/account/sessions/${escapeHtml(s.id)}/revoke"><button class="link-button" type="submit">Sign out</button></form>`
                    }
                  </td>
                </tr>`
              )
              .join("")}
          </tbody>
        </table>
      `)}

      ${cardSection(`
        <h2>Remembered devices</h2>
        <p class="muted">Devices you chose "Remember this device" on - MFA is skipped on these until they expire or you remove them.</p>
        ${
          devices.length > 0
            ? `<table>
                <thead><tr><th>Added</th><th>Last used</th><th>IP</th><th></th></tr></thead>
                <tbody>
                  ${devices
                    .map(
                      (d) => `<tr>
                        <td>${escapeHtml(new Date(d.created_at).toLocaleString())}</td>
                        <td>${escapeHtml(relativeTime(d.last_used_at))}</td>
                        <td class="muted">${escapeHtml(d.ip ?? "unknown")}</td>
                        <td><form method="POST" action="/account/devices/${escapeHtml(d.id)}/revoke"><button class="link-button" type="submit">Remove</button></form></td>
                      </tr>`
                    )
                    .join("")}
                </tbody>
              </table>`
            : '<p class="muted">No remembered devices.</p>'
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
                      (app) => `<tr>
                        <td>${escapeHtml(app.name)}</td>
                        <td><form method="POST" action="/account/apps/${app.id}/revoke" onsubmit="return confirm('Revoke access for ${escapeHtml(app.name).replace(/'/g, "")}? You will need to sign in again next time you use it.');"><button class="link-button" type="submit">Revoke access</button></form></td>
                      </tr>`
                    )
                    .join("")}
                </tbody>
              </table>`
            : '<p class="muted">No connected apps yet.</p>'
        }
      `)}
      `,
      user.upn
    )
  );
});

account.post("/account/devices/:id/revoke", async (c) => {
  const user = c.get("user");
  const deviceId = c.req.param("id");
  await revokeTrustedDevice(c.env, user.id, deviceId);
  await logAudit(c.env, user, "user.device_revoked_self", user.upn, undefined, c.req.raw);
  return c.redirect("/account", 302);
});

account.post("/account/sessions/:id/revoke", async (c) => {
  const user = c.get("user");
  const sessionId = c.req.param("id");
  const sessions = await listActiveSessionsForUser(c.env, user.id);
  if (sessions.some((s) => s.id === sessionId)) {
    await revokeSession(c.env, sessionId);
    await logAudit(c.env, user, "user.session_revoked_self", user.upn, undefined, c.req.raw);
  }
  return c.redirect("/account", 302);
});

account.post("/account/sessions/revoke-others", async (c) => {
  const user = c.get("user");
  const count = await revokeAllSessionsForUser(c.env, user.id, c.get("sessionId"));
  await logAudit(c.env, user, "user.sessions_revoked_all_others", user.upn, { count }, c.req.raw);
  return c.redirect("/account", 302);
});

account.post("/account/apps/:clientDbId/revoke", async (c) => {
  const user = c.get("user");
  const clientDbId = Number(c.req.param("clientDbId"));
  const client = await c.env.DB.prepare("SELECT client_id, name FROM oauth_clients WHERE id = ?")
    .bind(clientDbId)
    .first<{ client_id: string; name: string }>();
  if (!client) return c.redirect("/account", 302);

  await c.env.DB.batch([
    c.env.DB.prepare("DELETE FROM access_tokens WHERE user_id = ? AND client_id = ?").bind(user.id, client.client_id),
    c.env.DB.prepare("UPDATE refresh_tokens SET revoked_at = ? WHERE user_id = ? AND client_id = ?").bind(
      new Date().toISOString(),
      user.id,
      client.client_id
    ),
  ]);
  await logAudit(c.env, user, "user.app_access_revoked_self", client.name, undefined, c.req.raw);

  return c.redirect("/account", 302);
});

account.post("/account/password", async (c) => {
  const user = c.get("user");
  const body = await c.req.parseBody();
  const currentPassword = String(body.current_password ?? "");
  const newPassword = String(body.new_password ?? "");
  const confirmPassword = String(body.confirm_password ?? "");

  if (!(await verifyPassword(currentPassword, user))) {
    return c.html(errorRedirectPage(c, "Current password is incorrect."));
  }

  if (newPassword !== confirmPassword) {
    return c.html(errorRedirectPage(c, "New password and confirmation do not match."));
  }

  const policy = await getPasswordPolicy(c.env);
  const policyError = validatePassword(newPassword, policy);
  if (policyError) {
    return c.html(errorRedirectPage(c, policyError));
  }

  const { hash, salt, iterations } = await hashPassword(newPassword);
  await c.env.DB.prepare(
    "UPDATE users SET password_hash = ?, password_salt = ?, password_iterations = ?, updated_at = ? WHERE id = ?"
  )
    .bind(hash, salt, iterations, new Date().toISOString(), user.id)
    .run();

  await logAudit(c.env, user, "user.password_changed_self", user.upn, undefined, c.req.raw);

  return c.redirect("/account", 302);
});

function errorRedirectPage(c: Context<{ Bindings: Env }>, message: string) {
  return layout(c, "My account", `<p class="error">${escapeHtml(message)}</p><a href="/account">Back to account</a>`);
}

account.get("/account/mfa/setup", async (c) => {
  const user = c.get("user");
  const resume = c.req.query("resume") ?? "";
  if (user.mfa_enabled) return c.redirect("/account", 302);

  let secret = await getPendingEnrollment(c.env, user.id);
  if (!secret) {
    secret = generateBase32Secret();
    await storePendingEnrollment(c.env, user.id, secret);
  }

  const otpauthUri = buildOtpAuthUri({ secret, upn: user.upn, issuer: c.get("appName") });
  const qrSvg = await QRCode.toString(otpauthUri, { type: "svg", width: 220 });

  return c.html(
    layout(
      c,
      "Set up MFA",
      cardSection(`
        <div style="text-align:center;">
          ${resume ? '<p class="sub">Multi-factor authentication is required before you can continue.</p>' : ""}
          ${c.req.query("error") ? '<p class="error">Incorrect code, please try again.</p>' : ""}
          <p class="sub">Scan this with Google Authenticator, Authy, or any standard TOTP app.</p>
          <div>${qrSvg}</div>
          <p class="muted">Or enter this code manually: <code>${escapeHtml(secret)}</code></p>
          <form method="POST" action="/account/mfa/setup" style="display:inline-block;">
            <input type="hidden" name="resume" value="${escapeHtml(resume)}" />
            <div style="display:flex; gap:10px; align-items:flex-end;">
              <div style="text-align:left;">
                <label for="code">Enter the 6-digit code to confirm</label>
                <input type="text" id="code" name="code" inputmode="numeric" maxlength="6" required autofocus style="margin-bottom:0; max-width:160px;" />
              </div>
              <button class="primary" type="submit">Enable MFA</button>
            </div>
          </form>
        </div>
      `)
    )
  );
});

account.post("/account/mfa/setup", async (c) => {
  const user = c.get("user");
  const body = await c.req.parseBody();
  const code = String(body.code ?? "");
  const resume = String(body.resume ?? "");

  const secret = await getPendingEnrollment(c.env, user.id);
  if (!secret) return c.text("Enrollment session expired, please start again.", 400);

  const valid = await verifyTotp(secret, code);
  if (!valid) {
    return c.redirect(`/account/mfa/setup?error=1&resume=${encodeURIComponent(resume)}`, 302);
  }

  await c.env.DB.prepare(
    "UPDATE users SET totp_secret = ?, mfa_enabled = 1, updated_at = ? WHERE id = ?"
  )
    .bind(secret, new Date().toISOString(), user.id)
    .run();
  await deletePendingEnrollment(c.env, user.id);
  await logAudit(c.env, user, "user.mfa_enabled", user.upn, undefined, c.req.raw);

  const codes = await generateBackupCodes(c.env, user.id);
  const continueTo = resume ? await resumeLoginFlow(c.env, resume, user.id) : "/account";

  return c.html(layout(c, "MFA enabled", backupCodesPage(codes, continueTo)));
});

/** Completes a login flow that was paused for forced MFA enrollment, returning where to send the user next. */
async function resumeLoginFlow(env: Env, resumeFlowId: string, userId: number): Promise<string> {
  const flow = await getLoginFlow(env, resumeFlowId);
  if (!flow) return "/account";

  await deleteLoginFlow(env, resumeFlowId);
  if (flow.kind === "direct") return flow.next;

  const { redirectTo } = await finishOidcAuthorize(env, flow.request, userId, ["pwd", "mfa"]);
  return redirectTo;
}

function backupCodesPage(codes: string[], continueTo = "/account"): string {
  const fileContents = `${codes.join("\n")}\n`;
  const downloadHref = `data:text/plain;charset=utf-8,${encodeURIComponent(fileContents)}`;

  return cardSection(`
    <p class="success">MFA is now enabled.</p>
    <p>Save these backup codes somewhere safe - each one can be used once to sign in if you lose access to your authenticator app. They won't be shown again.</p>
    <div style="background:#f9fafb; border-radius:10px; padding:14px 16px; font-family:monospace; font-size:1rem; line-height:1.8;">
      ${codes.map(escapeHtml).join("<br/>")}
    </div>
    <div class="row" style="justify-content:flex-start; margin-top:12px;">
      <a href="${downloadHref}" download="backup-codes.txt"><button class="secondary" type="button">Download backup-codes.txt</button></a>
    </div>
    <div class="row" style="margin-top:16px;"><a href="${escapeHtml(continueTo)}"><button class="primary" type="button">Continue</button></a></div>
  `);
}

account.post("/account/mfa/backup-codes/regenerate", async (c) => {
  const user = c.get("user");
  if (!user.mfa_enabled) return c.redirect("/account", 302);

  const codes = await generateBackupCodes(c.env, user.id);
  await logAudit(c.env, user, "user.mfa_backup_codes_regenerated", user.upn, undefined, c.req.raw);

  return c.html(layout(c, "Backup codes regenerated", backupCodesPage(codes)));
});

account.post("/account/mfa/disable", async (c) => {
  const user = c.get("user");
  const body = await c.req.parseBody();
  const code = String(body.code ?? "");

  if (!user.totp_secret || !(await verifyTotp(user.totp_secret, code))) {
    return c.redirect("/account", 302);
  }

  await c.env.DB.prepare(
    "UPDATE users SET totp_secret = NULL, mfa_enabled = 0, updated_at = ? WHERE id = ?"
  )
    .bind(new Date().toISOString(), user.id)
    .run();
  await deleteBackupCodes(c.env, user.id);
  await deleteTrustedDevicesForUser(c.env, user.id);
  await logAudit(c.env, user, "user.mfa_disabled", user.upn, undefined, c.req.raw);

  return c.redirect("/account", 302);
});

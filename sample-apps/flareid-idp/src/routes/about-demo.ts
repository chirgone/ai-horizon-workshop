import { Hono } from "hono";
import type { Env } from "../env.js";
import { escapeHtml, page } from "../lib/html.js";

/**
 * Canonical copy lives in shared-ui/flareid/about-demo.ts - see
 * shared-ui/README.md before editing this file directly, since it's
 * duplicated (not imported) across every app.
 */
export const aboutDemo = new Hono<{ Bindings: Env }>();

// Fixed subdomain convention wire-access.sh uses when it creates custom
// domains for every app - see wire-access.sh's `main()` for the source of truth.
const OTHER_APP_SUBDOMAINS: [string, string][] = [
  ["hr", "WorkWeek (HR)"],
  ["crm", "Pipeline (CRM)"],
  ["work", "Relay (Inbox/Calendar)"],
  ["wiki", "Nexus (Wiki)"],
];

/** Links to the other apps in the suite, built from ROOT_DOMAIN - omitted entirely until wire-access.sh sets it. */
function otherAppLinksBlock(env: Env): string {
  if (!env.ROOT_DOMAIN) return "";

  return `
    <div class="card" style="margin-top:16px;">
      <h2>The rest of this demo suite</h2>
      <ul style="margin:0; padding-left:20px;">
        ${OTHER_APP_SUBDOMAINS.map(
          ([subdomain, label]) =>
            `<li><a href="https://${escapeHtml(subdomain)}.${escapeHtml(env.ROOT_DOMAIN!)}">${escapeHtml(label)}</a></li>`
        ).join("")}
      </ul>
    </div>
  `;
}

aboutDemo.get("/about-demo", (c) => {
  const appName = c.get("appName");
  return c.html(
    page(
      "About this demo",
      `
      <h1>About this demo</h1>
      <p class="sub"><a href="/">Back</a></p>

      <div class="card" style="margin-bottom:16px;">
        <h2>All the data here is fake</h2>
        <p>
          Every person, email address, home address, financial figure, and message across this demo suite was
          synthetically generated. None of it refers to a real person, and none of it is personally identifiable
          information about anyone - it just looks realistic enough to make the demo meaningful.
        </p>
      </div>

      <div class="card" style="margin-bottom:16px;">
        <h2>This isn't a finished product</h2>
        <p>
          These apps exist to illustrate identity and access-control concepts, not to be real, fully-featured
          software. Plenty of things a production app would have - input validation, comprehensive test coverage,
          error handling for every edge case, a real support team - are intentionally out of scope here.
        </p>
      </div>

      <div class="card" style="margin-bottom:16px;">
        <h2>${appName} isn't hardened for production either</h2>
        <p>
          ${appName} is a genuinely working OIDC identity provider - it really does authenticate users and issue
          real tokens for the apps behind it - but it has not been security-reviewed, penetration-tested, or hardened
          the way a real production IdP would need to be. Don't use it (or the pattern it demonstrates) to actually
          protect real systems or real user data.
        </p>
      </div>

      <div class="card">
        <h2>Some of this is deliberately insecure - that's the point</h2>
        <p>
          Certain parts of the apps behind this identity provider are <em>intentionally</em> designed to expose more
          than they should - for example, an API endpoint that will happily return a company's CEO's home address,
          even though the web UI never shows it to anyone but the CEO themselves. That's not a bug that was missed;
          it's a deliberate example of the kind of gap that opens up when an AI agent or MCP client gets direct API
          access without additional controls in place.
        </p>
        <p style="margin-bottom:0;">
          The whole point of this demo suite is to show how Cloudflare (Access, Gateway, AI Gateway, and friends) can
          close exactly that kind of gap - so you're seeing the "before" state on purpose.
        </p>
      </div>
      ${otherAppLinksBlock(c.env)}
      `,
      appName,
      true
    )
  );
});

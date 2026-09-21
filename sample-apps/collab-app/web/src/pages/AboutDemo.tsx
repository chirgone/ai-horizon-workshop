import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

// Fixed subdomain convention wire-access.sh uses when it creates custom
// domains for every app - see wire-access.sh's `main()` for the source of truth.
// This app's own entry is filtered out by the server (see /api/links in worker.ts).
const APP_SUBDOMAINS: Record<string, string> = {
  idp: "FlareID (identity provider)",
  hr: "WorkWeek (HR)",
  crm: "Pipeline (CRM)",
  work: "Relay (Inbox/Calendar)",
  wiki: "Nexus (Wiki)",
};

function OtherAppLinks() {
  const [rootDomain, setRootDomain] = useState<string | null>(null);
  const [selfSubdomain, setSelfSubdomain] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/links")
      .then((res) => res.json<{ rootDomain: string | null; selfSubdomain: string | null }>())
      .then((data) => {
        setRootDomain(data.rootDomain);
        setSelfSubdomain(data.selfSubdomain);
      })
      .catch(() => setRootDomain(null));
  }, []);

  if (!rootDomain) return null;

  const others = Object.entries(APP_SUBDOMAINS).filter(([subdomain]) => subdomain !== selfSubdomain);

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h3>The rest of this demo suite</h3>
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        {others.map(([subdomain, label]) => (
          <li key={subdomain}>
            <a href={`https://${subdomain}.${rootDomain}`}>{label}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Canonical copy lives in shared-ui/react/AboutDemo.tsx - see
 * shared-ui/README.md before editing this file directly, since it's
 * duplicated (not imported) across every app.
 */
export default function AboutDemo() {
  return (
    <div>
      <h1>About this demo</h1>
      <p className="muted">
        <Link to="/">Back</Link>
      </p>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>All the data here is fake</h3>
        <p>
          Every person, email address, home address, financial figure, and message in this app was synthetically
          generated. None of it refers to a real person, and none of it is personally identifiable information about
          anyone - it just looks realistic enough to make the demo meaningful.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>This isn't a finished product</h3>
        <p>
          This app exists to illustrate identity and access-control concepts, not to be a real, fully-featured piece
          of software. Plenty of things a production app would have - input validation, comprehensive test coverage,
          error handling for every edge case, a real support team - are intentionally out of scope here.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>The identity provider isn't hardened for production either</h3>
        <p>
          FlareID, the identity provider behind every app in this demo suite, is a genuinely working OIDC provider -
          but it has not been security-reviewed, penetration-tested, or hardened the way a real production IdP would
          need to be. Don't use it (or the pattern it demonstrates) to actually protect real systems or real user
          data.
        </p>
      </div>

      <div className="card">
        <h3>Some of this is deliberately insecure - that's the point</h3>
        <p>
          Certain parts of this app are <em>intentionally</em> designed to expose more than they should - for
          example, an API endpoint that will happily return a company's CEO's home address, even though the web UI
          never shows it to anyone but the CEO themselves. That's not a bug we missed; it's a deliberate example of
          the kind of gap that opens up when an AI agent or MCP client gets direct API access without additional
          controls in place.
        </p>
        <p style={{ marginBottom: 0 }}>
          The whole point of this demo suite is to show how Cloudflare (Access, Gateway, AI Gateway, and friends) can
          close exactly that kind of gap - so you're seeing the "before" state on purpose.
        </p>
      </div>

      <OtherAppLinks />
    </div>
  );
}

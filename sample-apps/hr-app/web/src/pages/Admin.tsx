import { useEffect, useState } from "react";
import { adminApi, errorMessage, type AdminTokenRow, type EmployeeSummary } from "../lib/api.js";
import type { AppSettings } from "@hr-app/shared";

function BrandingSettings() {
  const [settings, setSettings] = useState<AppSettings>({ app_name: "WorkWeek", logo_url: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    adminApi.getSettings().then(setSettings);
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const updated = await adminApi.updateSettings(settings);
      setSettings(updated);
      setMessage("Saved.");
    } catch (err) {
      setMessage(`Failed to save: ${err}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="admin-section">
      <h2>Branding</h2>
      <p className="muted">Customize the app name and logo shown in the nav. Leave logo URL blank to use the default.</p>
      <form className="form" style={{ flexWrap: "wrap" }} onSubmit={save}>
        <input
          type="text"
          placeholder="App name"
          value={settings.app_name}
          onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
        />
        <input
          type="text"
          placeholder="Logo URL (optional)"
          style={{ minWidth: 260 }}
          value={settings.logo_url}
          onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
        />
        <button type="submit" disabled={saving}>
          Save
        </button>
      </form>
      {message && <p className="muted">{message}</p>}
    </section>
  );
}

const PAGE_SIZE = 15;

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="pagination">
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Prev
      </button>
      <span className="muted">
        Page {page} of {totalPages}
      </span>
      <button type="button" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Next
      </button>
    </div>
  );
}

function Accounts() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [results, setResults] = useState<EmployeeSummary[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [newDomain, setNewDomain] = useState("");
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => setPage(1), [search]);

  useEffect(() => {
    adminApi
      .searchEmployees({ search, page, pageSize: PAGE_SIZE })
      .then((res) => {
        setResults(res.data);
        setTotalPages(res.totalPages);
        setError(null);
      })
      .catch((err) => setError(errorMessage(err)));
  }, [search, page]);

  const applyDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplying(true);
    setMessage(null);
    try {
      const res = await adminApi.setAllAccountsDomain(newDomain);
      setMessage(`Updated ${res.updated} account(s) to @${res.domain}.`);
      setNewDomain("");
      const refreshed = await adminApi.searchEmployees({ search, page, pageSize: PAGE_SIZE });
      setResults(refreshed.data);
      setTotalPages(refreshed.totalPages);
    } catch (err) {
      setMessage(`Failed to update: ${errorMessage(err)}`);
    } finally {
      setApplying(false);
    }
  };

  return (
    <section className="admin-section">
      <h2>Accounts</h2>
      <p className="muted">
        Every account that can sign in to WorkWeek - employees plus any system accounts (like an identity provider's
        own admin login). Signing in via Cloudflare Access resolves by exact email match against the UPN below (the{" "}
        <code>Cf-Access-Authenticated-User-Email</code> header) - if a real Access login doesn't match anything here,
        access is denied.
      </p>

      <form className="form" style={{ flexWrap: "wrap", marginBottom: 20 }} onSubmit={applyDomain}>
        <input
          type="text"
          placeholder="New domain, e.g. company.com"
          value={newDomain}
          onChange={(e) => setNewDomain(e.target.value)}
          style={{ minWidth: 240 }}
        />
        <button type="submit" disabled={applying || !newDomain.trim()}>
          Apply new domain to all accounts
        </button>
      </form>
      {message && <p className="muted">{message}</p>}

      <input
        type="search"
        placeholder="Search accounts by name or email"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 12, width: "100%", maxWidth: 400, padding: "8px 10px", borderRadius: 8, border: "1px solid #d1d5db" }}
      />
      {error && <p className="banner error">{error}</p>}
      <table className="table">
        <thead>
          <tr>
            <th>Account</th>
            <th>Type</th>
            <th>UPN (login email)</th>
          </tr>
        </thead>
        <tbody>
          {results.map((e) => (
            <tr key={e.id}>
              <td>
                {e.first_name} {e.last_name}
                <div className="muted" style={{ fontSize: "0.8rem" }}>
                  {e.job_title}
                </div>
              </td>
              <td>
                <span className={`badge ${e.is_system_account ? "badge-system" : "badge-employee"}`}>
                  {e.is_system_account ? "System" : "Employee"}
                </span>
              </td>
              <td>{e.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </section>
  );
}

function ApiTokens() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [tokens, setTokens] = useState<AdminTokenRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setPage(1), [search]);

  const refresh = () => {
    adminApi
      .listTokens({ search, page, pageSize: PAGE_SIZE })
      .then((res) => {
        setTokens(res.data);
        setTotalPages(res.totalPages);
        setError(null);
      })
      .catch((err) => setError(errorMessage(err)));
  };

  useEffect(refresh, [search, page]);

  const revoke = async (id: number) => {
    await adminApi.revokeToken(id);
    refresh();
  };

  return (
    <section className="admin-section">
      <h2>API Tokens</h2>
      <p className="muted">
        Every time someone signs into the MCP server (or loads the dashboard) a per-user <code>api</code> bearer
        token is minted here. Revoke any token to immediately cut off that session's access.
      </p>
      <input
        type="search"
        placeholder="Search by employee name, email, or created by"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 12, width: "100%", maxWidth: 400, padding: "8px 10px", borderRadius: 8, border: "1px solid #d1d5db" }}
      />
      {error && <div className="banner error">{error}</div>}
      <table className="table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Created</th>
            <th>Created By</th>
            <th>Last Used</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((t) => (
            <tr key={t.id}>
              <td>{t.employee_name ?? "(legacy/service token)"}</td>
              <td>{new Date(t.created_at).toLocaleString()}</td>
              <td>{t.created_by}</td>
              <td>{t.last_used_at ? new Date(t.last_used_at).toLocaleString() : "Never"}</td>
              <td>
                <span className={`badge badge-${t.revoked_at ? "revoked" : "active"}`}>
                  {t.revoked_at ? "Revoked" : "Active"}
                </span>
              </td>
              <td>
                {!t.revoked_at && (
                  <button className="link-button" onClick={() => revoke(t.id)}>
                    Revoke
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </section>
  );
}

export default function Admin() {
  const [tab, setTab] = useState<"branding" | "accounts" | "tokens">("branding");

  return (
    <div>
      <h1>Admin</h1>
      <p className="muted">
        Access here is enforced in app code (only the system account can reach these routes), not by a separate
        Cloudflare Access application - two overlapping Access apps on the same hostname can end up with
        independently-expiring sessions. It's for the demo owner, not end users.
      </p>
      <div className="admin-tabs">
        <button
          type="button"
          className={`tab-pill ${tab === "branding" ? "active" : ""}`}
          onClick={() => setTab("branding")}
        >
          Branding
        </button>
        <button
          type="button"
          className={`tab-pill ${tab === "accounts" ? "active" : ""}`}
          onClick={() => setTab("accounts")}
        >
          Accounts
        </button>
        <button type="button" className={`tab-pill ${tab === "tokens" ? "active" : ""}`} onClick={() => setTab("tokens")}>
          API Tokens
        </button>
      </div>
      {tab === "branding" && <BrandingSettings />}
      {tab === "accounts" && <Accounts />}
      {tab === "tokens" && <ApiTokens />}
    </div>
  );
}

import { Fragment, useEffect, useState } from "react";
import {
  adminApi,
  errorMessage,
  type AdminTokenRow,
  type SpaceMemberSummary,
  type SpaceSummary,
  type UserSummary,
} from "../lib/api.js";
import type { AppSettings, User } from "@wiki-app/shared";

function BrandingSettings() {
  const [settings, setSettings] = useState<AppSettings>({ app_name: "Nexus", logo_url: "" });
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
  const [results, setResults] = useState<UserSummary[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [newDomain, setNewDomain] = useState("");
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => setPage(1), [search]);

  useEffect(() => {
    adminApi
      .searchUsers({ search, page, pageSize: PAGE_SIZE })
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
      const refreshed = await adminApi.searchUsers({ search, page, pageSize: PAGE_SIZE });
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
        Every account that can sign in to Nexus - users plus any system accounts (like an identity provider's own
        admin login). Signing in via Cloudflare Access resolves by exact email match against the UPN below - if a
        real Access login doesn't match anything here, access is denied.
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
          {results.map((u) => (
            <tr key={u.id}>
              <td>
                {u.first_name} {u.last_name}
                <div className="muted" style={{ fontSize: "0.8rem" }}>
                  {u.job_title}
                </div>
              </td>
              <td>
                <span className={`badge ${u.is_system_account ? "badge-system" : "badge-employee"}`}>
                  {u.is_system_account ? "System" : "User"}
                </span>
              </td>
              <td>{u.email}</td>
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
        placeholder="Search by user name, email, or created by"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 12, width: "100%", maxWidth: 400, padding: "8px 10px", borderRadius: 8, border: "1px solid #d1d5db" }}
      />
      {error && <div className="banner error">{error}</div>}
      <table className="table">
        <thead>
          <tr>
            <th>User</th>
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
              <td>{t.user_name ?? "(legacy/service token)"}</td>
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

function SpaceMembersEditor({ space, allUsers }: { space: SpaceSummary; allUsers: User[] }) {
  const [members, setMembers] = useState<SpaceMemberSummary[] | null>(null);
  const [addUserId, setAddUserId] = useState("");

  const load = () => adminApi.listSpaceMembers(space.id).then((res) => setMembers(res.data));
  useEffect(() => {
    load();
  }, [space.id]);

  const add = async () => {
    if (!addUserId) return;
    await adminApi.addSpaceMember(space.id, Number(addUserId));
    setAddUserId("");
    load();
  };

  const remove = async (userId: number) => {
    await adminApi.removeSpaceMember(space.id, userId);
    load();
  };

  const memberIds = new Set((members ?? []).map((m) => m.id));
  const candidates = allUsers.filter((u) => !memberIds.has(u.id) && u.id !== space.owner_id);

  return (
    <div style={{ marginTop: 8, paddingLeft: 16, borderLeft: "3px solid #eef0f2" }}>
      <p className="muted" style={{ margin: "4px 0" }}>
        Members (in addition to the owner, who always has access):
      </p>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {members?.map((m) => (
          <li key={m.id}>
            {m.first_name} {m.last_name} ({m.email}){" "}
            <button className="link-button" onClick={() => remove(m.id)}>
              Remove
            </button>
          </li>
        ))}
        {members?.length === 0 && <li className="muted">No members yet.</li>}
      </ul>
      <div className="form" style={{ marginTop: 8, marginBottom: 8 }}>
        <select value={addUserId} onChange={(e) => setAddUserId(e.target.value)}>
          <option value="">Add member...</option>
          {candidates.map((u) => (
            <option key={u.id} value={u.id}>
              {u.first_name} {u.last_name}
            </option>
          ))}
        </select>
        <button type="button" onClick={add} disabled={!addUserId}>
          Add
        </button>
      </div>
    </div>
  );
}

function Spaces() {
  const [spaces, setSpaces] = useState<SpaceSummary[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newRestricted, setNewRestricted] = useState(false);
  const [newOwnerId, setNewOwnerId] = useState("");
  const [creating, setCreating] = useState(false);

  const load = () => adminApi.listAllSpaces().then((res) => setSpaces(res.data));
  useEffect(() => {
    load();
    adminApi.searchUsers({ pageSize: 100 }).then((res) => setAllUsers(res.data as unknown as User[]));
  }, []);

  const toggleRestricted = async (space: SpaceSummary) => {
    await adminApi.updateSpace(space.id, { is_restricted: !space.is_restricted });
    load();
  };

  const createSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newOwnerId) return;
    setCreating(true);
    try {
      await adminApi.createSpace({
        name: newName.trim(),
        description: newDescription.trim(),
        is_restricted: newRestricted,
        owner_id: Number(newOwnerId),
      });
      setNewName("");
      setNewDescription("");
      setNewRestricted(false);
      setNewOwnerId("");
      load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className="admin-section">
      <h2>Spaces</h2>
      <p className="muted">
        Restricted spaces are only visible to their owner and listed members - toggle restriction or manage members
        below.
      </p>
      {error && <p className="banner error">{error}</p>}

      <h3>New space</h3>
      <form className="form" style={{ flexWrap: "wrap" }} onSubmit={createSpace}>
        <input type="text" placeholder="Name" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <input
          type="text"
          placeholder="Description"
          style={{ minWidth: 220 }}
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
        />
        <select value={newOwnerId} onChange={(e) => setNewOwnerId(e.target.value)}>
          <option value="">Owner...</option>
          {allUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.first_name} {u.last_name}
            </option>
          ))}
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <input type="checkbox" checked={newRestricted} onChange={(e) => setNewRestricted(e.target.checked)} />
          Restricted
        </label>
        <button type="submit" disabled={creating || !newName.trim() || !newOwnerId}>
          Create
        </button>
      </form>

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Visibility</th>
            <th>Pages</th>
            <th>Members</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {spaces.map((s) => (
            <Fragment key={s.id}>
              <tr>
                <td>
                  {s.name}
                  <div className="muted" style={{ fontSize: "0.8rem" }}>
                    {s.description}
                  </div>
                </td>
                <td>
                  <span className={`badge ${s.is_restricted ? "badge-restricted" : "badge-public"}`}>
                    {s.is_restricted ? "Restricted" : "Public"}
                  </span>
                </td>
                <td>{s.page_count}</td>
                <td>{s.is_restricted ? s.member_count : "-"}</td>
                <td>
                  <button className="link-button" onClick={() => toggleRestricted(s)}>
                    {s.is_restricted ? "Make public" : "Make restricted"}
                  </button>
                  {!!s.is_restricted && (
                    <>
                      {" "}
                      &middot;{" "}
                      <button className="link-button" onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
                        {expanded === s.id ? "Hide members" : "Manage members"}
                      </button>
                    </>
                  )}
                </td>
              </tr>
              {expanded === s.id && !!s.is_restricted && (
                <tr>
                  <td colSpan={5}>
                    <SpaceMembersEditor space={s} allUsers={allUsers} />
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default function Admin() {
  const [tab, setTab] = useState<"branding" | "accounts" | "tokens" | "spaces">("branding");

  return (
    <div>
      <h1>Admin</h1>
      <p className="muted">
        Access here is enforced in app code (only the system account can reach these routes), not by a separate
        Cloudflare Access application. It's for the demo owner, not end users.
      </p>
      <div className="admin-tabs">
        <button type="button" className={`tab-pill ${tab === "branding" ? "active" : ""}`} onClick={() => setTab("branding")}>
          Branding
        </button>
        <button type="button" className={`tab-pill ${tab === "accounts" ? "active" : ""}`} onClick={() => setTab("accounts")}>
          Accounts
        </button>
        <button type="button" className={`tab-pill ${tab === "tokens" ? "active" : ""}`} onClick={() => setTab("tokens")}>
          API Tokens
        </button>
        <button type="button" className={`tab-pill ${tab === "spaces" ? "active" : ""}`} onClick={() => setTab("spaces")}>
          Spaces
        </button>
      </div>
      {tab === "branding" && <BrandingSettings />}
      {tab === "accounts" && <Accounts />}
      {tab === "tokens" && <ApiTokens />}
      {tab === "spaces" && <Spaces />}
    </div>
  );
}

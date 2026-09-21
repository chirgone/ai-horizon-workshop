import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, errorMessage } from "../lib/api.js";
import type { Email, EmailFolder } from "@collab-app/shared";

const PAGE_SIZE = 15;
const FOLDERS: EmailFolder[] = ["inbox", "sent", "archive"];

export default function Inbox() {
  const [folder, setFolder] = useState<EmailFolder>("inbox");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [emails, setEmails] = useState<Email[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setPage(1), [search, folder]);

  useEffect(() => {
    api
      .listEmails({ search, folder, page, pageSize: PAGE_SIZE })
      .then((res) => {
        setEmails(res.data);
        setTotalPages(res.totalPages);
        setError(null);
      })
      .catch((err) => setError(errorMessage(err)));
  }, [search, folder, page]);

  return (
    <div>
      <h1>Inbox</h1>
      <div className="admin-tabs">
        {FOLDERS.map((f) => (
          <button key={f} type="button" className={`tab-pill ${folder === f ? "active" : ""}`} onClick={() => setFolder(f)}>
            {f}
          </button>
        ))}
      </div>
      <div className="toolbar">
        <input
          type="search"
          placeholder="Search by subject, sender, or body"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {error && <p className="banner error">{error}</p>}
      <table className="table">
        <thead>
          <tr>
            <th>{folder === "sent" ? "To" : "From"}</th>
            <th>Subject</th>
            <th>Received</th>
          </tr>
        </thead>
        <tbody>
          {emails.map((e) => (
            <tr key={e.id} className={!e.is_read && folder !== "sent" ? "unread" : ""}>
              <td>{folder === "sent" ? e.to_email : `${e.from_name} <${e.from_email}>`}</td>
              <td>
                <Link to={`/emails/${e.id}`}>{e.subject}</Link>
              </td>
              <td>{new Date(e.received_at).toLocaleString()}</td>
            </tr>
          ))}
          {emails.length === 0 && (
            <tr>
              <td colSpan={3} className="muted">
                No emails here.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {totalPages > 1 && (
        <div className="pagination">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Prev
          </button>
          <span className="muted">
            Page {page} of {totalPages}
          </span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}

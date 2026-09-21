import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api, errorMessage } from "../lib/api.js";
import type { Page, PageVersion } from "@wiki-app/shared";

export default function PageView() {
  const { id } = useParams();
  const pageId = Number(id);
  const [searchParams] = useSearchParams();

  const [page, setPage] = useState<Page | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(searchParams.get("edit") === "1");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<PageVersion[] | null>(null);

  useEffect(() => {
    if (!pageId) return;
    api
      .getPage(pageId)
      .then((p) => {
        setPage(p);
        setTitle(p.title);
        setBody(p.body);
      })
      .catch((err) => setError(errorMessage(err)));
  }, [pageId]);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await api.updatePage(pageId, { title, body });
      setPage(updated);
      setEditing(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleHistory = async () => {
    if (!showHistory && history === null) {
      const res = await api.getPageHistory(pageId);
      setHistory(res.data);
    }
    setShowHistory((v) => !v);
  };

  if (error) return <p className="banner error">{error}</p>;
  if (!page) return <p>Loading...</p>;

  return (
    <div>
      <p>
        <Link to={`/spaces/${page.space_id}`}>Back to space</Link>
      </p>

      {editing ? (
        <>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ fontSize: "1.5rem", fontWeight: 700, width: "100%", marginBottom: 12, padding: 8, borderRadius: 8, border: "1px solid #d1d5db" }}
          />
          <div className="page-body">
            <textarea value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <div className="row" style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button type="button" onClick={save} disabled={saving}>
              Save
            </button>
            <button
              type="button"
              className="link-button"
              onClick={() => {
                setEditing(false);
                setTitle(page.title);
                setBody(page.body);
              }}
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <h1>{page.title}</h1>
          <p className="muted">
            Last updated {new Date(page.updated_at).toLocaleString()} &middot;{" "}
            <button type="button" className="link-button" onClick={() => setEditing(true)}>
              Edit
            </button>{" "}
            &middot;{" "}
            <button type="button" className="link-button" onClick={toggleHistory}>
              {showHistory ? "Hide history" : "View history"}
            </button>
          </p>
          <div className="page-body">{page.body || <span className="muted">This page is empty.</span>}</div>

          {showHistory && (
            <>
              <h2 style={{ marginTop: 24 }}>Version history</h2>
              {history && history.length === 0 && <p className="muted">No prior revisions.</p>}
              {history?.map((v) => (
                <div key={v.id} className="card" style={{ marginBottom: 12 }}>
                  <p className="muted" style={{ marginTop: 0 }}>
                    {new Date(v.edited_at).toLocaleString()}
                  </p>
                  <div style={{ whiteSpace: "pre-wrap" }}>{v.body}</div>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}

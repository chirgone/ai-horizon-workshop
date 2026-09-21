import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, errorMessage } from "../lib/api.js";
import type { Page } from "@wiki-app/shared";

const PAGE_SIZE = 15;

export default function Search() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [results, setResults] = useState<Page[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setPage(1), [query]);

  useEffect(() => {
    api
      .searchPages({ search: query, page, pageSize: PAGE_SIZE })
      .then((res) => {
        setResults(res.data);
        setTotalPages(res.totalPages);
        setError(null);
      })
      .catch((err) => setError(errorMessage(err)));
  }, [query, page]);

  return (
    <div>
      <h1>Search</h1>
      <p className="muted">Searches page titles and bodies across every space visible to you.</p>
      <div className="toolbar">
        <input
          type="search"
          placeholder="Search pages"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ minWidth: 320 }}
          autoFocus
        />
      </div>
      {error && <p className="banner error">{error}</p>}
      <table className="table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {results.map((p) => (
            <tr key={p.id}>
              <td>
                <Link to={`/pages/${p.id}`}>{p.title}</Link>
              </td>
              <td>{new Date(p.updated_at).toLocaleString()}</td>
            </tr>
          ))}
          {results.length === 0 && (
            <tr>
              <td colSpan={2} className="muted">
                {query ? "No matching pages." : "Start typing to search."}
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

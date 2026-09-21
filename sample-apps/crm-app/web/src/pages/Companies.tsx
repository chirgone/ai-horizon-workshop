import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, errorMessage } from "../lib/api.js";
import type { Company } from "@crm-app/shared";

const PAGE_SIZE = 15;

export default function Companies() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setPage(1), [search]);

  useEffect(() => {
    api
      .listCompanies({ search, page, pageSize: PAGE_SIZE })
      .then((res) => {
        setCompanies(res.data);
        setTotalPages(res.totalPages);
        setError(null);
      })
      .catch((err) => setError(errorMessage(err)));
  }, [search, page]);

  return (
    <div>
      <h1>Companies</h1>
      <p className="muted">Accounts you own, plus any owned by your reports.</p>
      <div className="toolbar">
        <input
          type="search"
          placeholder="Search by name or industry"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {error && <p className="banner error">{error}</p>}
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Industry</th>
            <th>Website</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((c) => (
            <tr key={c.id}>
              <td>
                <Link to={`/companies/${c.id}`}>{c.name}</Link>
              </td>
              <td>{c.industry}</td>
              <td>{c.website}</td>
            </tr>
          ))}
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

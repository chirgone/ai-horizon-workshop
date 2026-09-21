import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, errorMessage } from "../lib/api.js";
import type { Deal, DealStage } from "@crm-app/shared";

const PAGE_SIZE = 15;
const STAGES: DealStage[] = ["prospecting", "qualification", "proposal", "negotiation", "closed_won", "closed_lost"];

export default function Deals() {
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("");
  const [page, setPage] = useState(1);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setPage(1), [search, stage]);

  useEffect(() => {
    api
      .listDeals({ search, stage: stage || undefined, page, pageSize: PAGE_SIZE })
      .then((res) => {
        setDeals(res.data);
        setTotalPages(res.totalPages);
        setError(null);
      })
      .catch((err) => setError(errorMessage(err)));
  }, [search, stage, page]);

  return (
    <div>
      <h1>Deals</h1>
      <p className="muted">Deals you own, plus any owned by your reports.</p>
      <div className="toolbar">
        <input type="search" placeholder="Search by deal name" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={stage} onChange={(e) => setStage(e.target.value)}>
          <option value="">All stages</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="banner error">{error}</p>}
      <table className="table">
        <thead>
          <tr>
            <th>Deal</th>
            <th>Stage</th>
            <th>Value</th>
            <th>Close Date</th>
          </tr>
        </thead>
        <tbody>
          {deals.map((d) => (
            <tr key={d.id}>
              <td>
                <Link to={`/deals/${d.id}`}>{d.name}</Link>
              </td>
              <td>
                <span className={`badge badge-${d.stage}`}>{d.stage.replace("_", " ")}</span>
              </td>
              <td>${d.value.toLocaleString()}</td>
              <td>{d.close_date}</td>
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

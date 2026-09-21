import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Link } from "react-router-dom";
import { api, type MeResponse } from "../lib/api.js";
import type { Deal } from "@crm-app/shared";

const OPEN_STAGES = ["prospecting", "qualification", "proposal", "negotiation"];

export default function Dashboard() {
  const { me } = useOutletContext<{ me: MeResponse | null }>();
  const [deals, setDeals] = useState<Deal[] | undefined>(undefined);

  useEffect(() => {
    if (!me) return;
    api.listDeals({ pageSize: 100 }).then((res) => setDeals(res.data));
  }, [me?.rep.id]);

  if (!me) return <p>Loading...</p>;

  const openDeals = deals?.filter((d) => OPEN_STAGES.includes(d.stage)) ?? [];
  const openValue = openDeals.reduce((sum, d) => sum + d.value, 0);
  const wonDeals = deals?.filter((d) => d.stage === "closed_won") ?? [];
  const wonValue = wonDeals.reduce((sum, d) => sum + d.value, 0);
  const recentDeals = [...(deals ?? [])]
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 8);

  return (
    <div>
      <h1>
        Welcome, {me.rep.first_name} {me.rep.last_name}
      </h1>
      <div className="card-grid">
        <div className="card">
          <h3>Open Pipeline</h3>
          {deals === undefined ? (
            <p className="muted">Loading...</p>
          ) : (
            <>
              <p>${openValue.toLocaleString()}</p>
              <p className="muted">{openDeals.length} open deal(s)</p>
            </>
          )}
        </div>
        <div className="card">
          <h3>Closed Won</h3>
          {deals === undefined ? (
            <p className="muted">Loading...</p>
          ) : (
            <>
              <p>${wonValue.toLocaleString()}</p>
              <p className="muted">{wonDeals.length} deal(s)</p>
            </>
          )}
        </div>
      </div>

      <h2>Recently Updated Deals</h2>
      {deals === undefined ? (
        <p className="muted">Loading...</p>
      ) : recentDeals.length === 0 ? (
        <p className="muted">No deals visible to you yet.</p>
      ) : (
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
            {recentDeals.map((d) => (
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
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { api, type MeResponse } from "../lib/api.js";
import type { Employee } from "@hr-app/shared";

export default function OrgChart() {
  const { me } = useOutletContext<{ me: MeResponse | null }>();
  const { id } = useParams();
  const navigate = useNavigate();
  // The full chain from the CEO (index 0) down to the person being viewed (last).
  const [chain, setChain] = useState<Employee[]>([]);
  const [reports, setReports] = useState<Employee[]>([]);

  const employeeId = id ? Number(id) : me?.employee.id;

  useEffect(() => {
    if (!employeeId) return;
    let cancelled = false;

    (async () => {
      const upChain: Employee[] = [];
      let current = await api.getEmployee(employeeId);
      upChain.unshift(current);
      while (current.manager_id) {
        current = await api.getEmployee(current.manager_id);
        upChain.unshift(current);
      }
      if (!cancelled) setChain(upChain);

      const res = await api.getReports(employeeId);
      if (!cancelled) setReports(res.data);
    })();

    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  if (chain.length === 0) return <p>Loading...</p>;
  const target = chain[chain.length - 1]!;

  return (
    <div>
      <h1>Org Chart</h1>
      <div className="org-chart">
        {chain.map((person, i) =>
          i === chain.length - 1 ? (
            <div key={person.id} className="org-node org-current">
              <strong>
                {person.first_name} {person.last_name}
              </strong>
              <div className="muted">{person.job_title}</div>
            </div>
          ) : (
            <div key={person.id} className="org-node org-manager">
              <button className="link-button" onClick={() => navigate(`/org-chart/${person.id}`)}>
                {person.first_name} {person.last_name}
              </button>
              <div className="muted">{person.job_title}</div>
            </div>
          )
        )}

        <div className="org-reports">
          {reports.map((r) => (
            <div key={r.id} className="org-node">
              <button className="link-button" onClick={() => navigate(`/org-chart/${r.id}`)}>
                {r.first_name} {r.last_name}
              </button>
              <div className="muted">{r.job_title}</div>
            </div>
          ))}
          {reports.length === 0 && <p className="muted">No direct reports.</p>}
        </div>
      </div>
      <p>
        <Link to={`/directory/${target.id}`}>View full profile</Link>
      </p>
    </div>
  );
}

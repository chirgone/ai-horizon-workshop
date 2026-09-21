import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, errorMessage } from "../lib/api.js";
import type { Activity, ActivityType, Deal } from "@crm-app/shared";

const ACTIVITY_TYPES: ActivityType[] = ["call", "email", "meeting", "note"];

export default function DealDetail() {
  const { id } = useParams();
  const dealId = Number(id);

  const [deal, setDeal] = useState<Deal | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [newType, setNewType] = useState<ActivityType>("note");
  const [newNotes, setNewNotes] = useState("");
  const [logging, setLogging] = useState(false);

  const loadActivities = () => api.getDealActivities(dealId).then((res) => setActivities(res.data));

  useEffect(() => {
    if (!dealId) return;
    api
      .getDeal(dealId)
      .then(setDeal)
      .catch((err) => setError(errorMessage(err)));
    loadActivities();
  }, [dealId]);

  const submitActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotes.trim()) return;
    setLogging(true);
    try {
      await api.logDealActivity(dealId, { type: newType, notes: newNotes.trim() });
      setNewNotes("");
      await loadActivities();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLogging(false);
    }
  };

  if (error) return <p className="banner error">{error}</p>;
  if (!deal) return <p>Loading...</p>;

  return (
    <div>
      <h1>{deal.name}</h1>
      <p className="muted">
        <Link to={`/companies/${deal.company_id}`}>View company</Link>
      </p>

      <div className="card-grid">
        <div className="card">
          <h3>Stage</h3>
          <span className={`badge badge-${deal.stage}`}>{deal.stage.replace("_", " ")}</span>
        </div>
        <div className="card">
          <h3>Value</h3>
          <p>${deal.value.toLocaleString()}</p>
        </div>
        <div className="card">
          <h3>Close Date</h3>
          <p>{deal.close_date}</p>
        </div>
      </div>

      <h2>Log Activity</h2>
      <form className="form" onSubmit={submitActivity}>
        <select value={newType} onChange={(e) => setNewType(e.target.value as ActivityType)}>
          {ACTIVITY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Notes"
          value={newNotes}
          onChange={(e) => setNewNotes(e.target.value)}
          style={{ minWidth: 320 }}
        />
        <button type="submit" disabled={logging || !newNotes.trim()}>
          Log
        </button>
      </form>

      <h2>Activity History</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {activities.map((a) => (
            <tr key={a.id}>
              <td>{a.activity_date}</td>
              <td className="capitalize">{a.type}</td>
              <td>{a.notes}</td>
            </tr>
          ))}
          {activities.length === 0 && (
            <tr>
              <td colSpan={3} className="muted">
                No activity logged yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

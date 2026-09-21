import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api, type MeResponse } from "../lib/api.js";
import type { TimeOffBalance, TimeOffRequest } from "@hr-app/shared";

export default function TimeOff() {
  const { me } = useOutletContext<{ me: MeResponse | null }>();
  const [balance, setBalance] = useState<TimeOffBalance | null>(null);
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [type, setType] = useState("vacation");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = (employeeId: number) => {
    api.getTimeOff(employeeId).then((res) => {
      setBalance(res.balance);
      setRequests(res.requests);
    });
  };

  useEffect(() => {
    if (me) refresh(me.employee.id);
  }, [me?.employee.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!me || !startDate || !endDate) return;
    setSubmitting(true);
    setMessage(null);
    try {
      await api.requestTimeOff(me.employee.id, { type, start_date: startDate, end_date: endDate });
      setMessage("Request submitted.");
      setStartDate("");
      setEndDate("");
      refresh(me.employee.id);
    } catch (err) {
      setMessage(`Failed to submit: ${err}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!me) return <p>Loading...</p>;

  return (
    <div>
      <h1>Time Off</h1>
      {balance && (
        <div className="card-grid">
          <div className="card">
            <h3>Vacation</h3>
            <p>{balance.vacation_days_remaining} days remaining</p>
          </div>
          <div className="card">
            <h3>Sick</h3>
            <p>{balance.sick_days_remaining} days remaining</p>
          </div>
        </div>
      )}

      <h2>Request Time Off</h2>
      <form className="form" onSubmit={submit}>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="vacation">Vacation</option>
          <option value="sick">Sick</option>
          <option value="personal">Personal</option>
        </select>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
        <button type="submit" disabled={submitting}>
          Submit
        </button>
      </form>
      {message && <p className="muted">{message}</p>}

      <h2>My Requests</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Start</th>
            <th>End</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r.id}>
              <td>{r.type}</td>
              <td>{r.start_date}</td>
              <td>{r.end_date}</td>
              <td>
                <span className={`badge badge-${r.status}`}>{r.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

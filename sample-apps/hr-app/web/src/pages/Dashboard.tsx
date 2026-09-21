import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { MeResponse } from "../lib/api.js";
import { api } from "../lib/api.js";
import type { TimeOffBalance, PerformanceReview } from "@hr-app/shared";

export default function Dashboard() {
  const { me } = useOutletContext<{ me: MeResponse | null }>();
  const [balance, setBalance] = useState<TimeOffBalance | null | undefined>(undefined);
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);

  useEffect(() => {
    if (!me) return;
    api.getTimeOff(me.employee.id).then((res) => setBalance(res.balance));
    api.getReviews(me.employee.id).then((res) => setReviews(res.data));
  }, [me?.employee.id]);

  if (!me) return <p>Loading...</p>;
  const { employee } = me;

  return (
    <div>
      <h1>
        Welcome, {employee.first_name} {employee.last_name}
      </h1>
      <div className="card-grid">
        <div className="card">
          <h3>Job</h3>
          <p>{employee.job_title}</p>
          <p className="muted">{employee.location}</p>
        </div>
        <div className="card">
          <h3>Time Off Balance</h3>
          {balance === undefined ? (
            <p className="muted">Loading...</p>
          ) : balance === null ? (
            <p className="muted">No time-off balance on file.</p>
          ) : (
            <>
              <p>{balance.vacation_days_remaining} vacation days remaining</p>
              <p>{balance.sick_days_remaining} sick days remaining</p>
            </>
          )}
        </div>
        <div className="card">
          <h3>Latest Review</h3>
          {reviews[0] ? (
            <>
              <p>
                {reviews[0].review_period} - rating {reviews[0].rating}/5
              </p>
              <p className="muted">{reviews[0].summary}</p>
            </>
          ) : (
            <p className="muted">No reviews yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

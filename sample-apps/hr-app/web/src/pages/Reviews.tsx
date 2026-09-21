import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api, type MeResponse } from "../lib/api.js";
import type { PerformanceReview } from "@hr-app/shared";

export default function Reviews() {
  const { me } = useOutletContext<{ me: MeResponse | null }>();
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);

  useEffect(() => {
    if (me) api.getReviews(me.employee.id).then((res) => setReviews(res.data));
  }, [me?.employee.id]);

  if (!me) return <p>Loading...</p>;

  return (
    <div>
      <h1>Performance Reviews</h1>
      {reviews.length === 0 && <p className="muted">No reviews yet.</p>}
      {reviews.map((r) => (
        <div key={r.id} className="card" style={{ marginBottom: 12 }}>
          <h3>
            {r.review_period} - {r.rating}/5
          </h3>
          <p>{r.summary}</p>
          <p className="muted">{r.review_date}</p>
        </div>
      ))}
    </div>
  );
}

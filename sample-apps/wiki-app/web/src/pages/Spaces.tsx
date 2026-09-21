import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, errorMessage } from "../lib/api.js";
import type { Space } from "@wiki-app/shared";

export default function Spaces() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listSpaces()
      .then((res) => setSpaces(res.data))
      .catch((err) => setError(errorMessage(err)));
  }, []);

  return (
    <div>
      <h1>Spaces</h1>
      <p className="muted">Every public space, plus any restricted space you're a member of.</p>
      {error && <p className="banner error">{error}</p>}
      <div className="card-grid">
        {spaces.map((s) => (
          <Link key={s.id} to={`/spaces/${s.id}`} className="card" style={{ textDecoration: "none", color: "inherit" }}>
            <h3>
              {s.name}{" "}
              <span className={`badge ${s.is_restricted ? "badge-restricted" : "badge-public"}`}>
                {s.is_restricted ? "Restricted" : "Public"}
              </span>
            </h3>
            <p className="muted">{s.description}</p>
          </Link>
        ))}
        {spaces.length === 0 && !error && <p className="muted">No spaces visible to you yet.</p>}
      </div>
    </div>
  );
}

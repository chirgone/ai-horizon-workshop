import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, errorMessage } from "../lib/api.js";
import type { Email } from "@collab-app/shared";

export default function EmailDetail() {
  const { id } = useParams();
  const emailId = Number(id);
  const [email, setEmail] = useState<Email | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!emailId) return;
    api
      .getEmail(emailId)
      .then((e) => {
        setEmail(e);
        if (!e.is_read && e.folder !== "sent") {
          api.markEmailRead(emailId, true).then(() => setEmail((prev) => (prev ? { ...prev, is_read: true } : prev)));
        }
      })
      .catch((err) => setError(errorMessage(err)));
  }, [emailId]);

  if (error) return <p className="banner error">{error}</p>;
  if (!email) return <p>Loading...</p>;

  return (
    <div>
      <p>
        <Link to="/">Back to inbox</Link>
      </p>
      <h1>{email.subject}</h1>
      <p className="muted">
        From {email.from_name} &lt;{email.from_email}&gt; to {email.to_email}
      </p>
      <p className="muted">{new Date(email.received_at).toLocaleString()}</p>
      <div className="card" style={{ whiteSpace: "pre-wrap", marginTop: 16 }}>
        {email.body}
      </div>
    </div>
  );
}

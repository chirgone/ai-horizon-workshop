import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, errorMessage, type AttendeeWithUser } from "../lib/api.js";
import type { AttendeeResponse, MeetingWithResponse } from "@collab-app/shared";

const RESPONSES: AttendeeResponse[] = ["accepted", "tentative", "declined", "needs_action"];

export default function MeetingDetail() {
  const { id } = useParams();
  const meetingId = Number(id);
  const [meeting, setMeeting] = useState<MeetingWithResponse | null>(null);
  const [attendees, setAttendees] = useState<AttendeeWithUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    api
      .getMeeting(meetingId)
      .then(setMeeting)
      .catch((err) => setError(errorMessage(err)));
    api.getMeetingAttendees(meetingId).then((res) => setAttendees(res.data));
  };

  useEffect(() => {
    if (!meetingId) return;
    load();
  }, [meetingId]);

  const respond = async (status: AttendeeResponse) => {
    setSaving(true);
    try {
      await api.respondToMeeting(meetingId, status);
      load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (error) return <p className="banner error">{error}</p>;
  if (!meeting) return <p>Loading...</p>;

  return (
    <div>
      <p>
        <Link to="/calendar">Back to calendar</Link>
      </p>
      <h1>{meeting.title}</h1>
      <p className="muted">{meeting.description}</p>

      <div className="card-grid">
        <div className="card">
          <h3>When</h3>
          <p>{new Date(meeting.start_time).toLocaleString()}</p>
          <p className="muted">to {new Date(meeting.end_time).toLocaleString()}</p>
        </div>
        <div className="card">
          <h3>Location</h3>
          <p>{meeting.location}</p>
        </div>
        <div className="card">
          <h3>Your RSVP</h3>
          <select
            value={meeting.response_status}
            disabled={saving}
            onChange={(e) => respond(e.target.value as AttendeeResponse)}
          >
            {RESPONSES.map((r) => (
              <option key={r} value={r}>
                {r.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      <h2>Attendees</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Title</th>
            <th>Response</th>
          </tr>
        </thead>
        <tbody>
          {attendees.map((a) => (
            <tr key={a.id}>
              <td>
                {a.first_name} {a.last_name}
              </td>
              <td>{a.job_title}</td>
              <td>
                <span className={`badge badge-${a.response_status}`}>{a.response_status.replace("_", " ")}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

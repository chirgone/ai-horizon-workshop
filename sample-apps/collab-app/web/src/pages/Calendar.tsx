import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, errorMessage } from "../lib/api.js";
import type { MeetingWithResponse } from "@collab-app/shared";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day; // shift so Monday is day 0
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function Calendar() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [search, setSearch] = useState("");
  const [meetings, setMeetings] = useState<MeetingWithResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const today = new Date();

  useEffect(() => {
    api
      .listMeetings({
        search: search || undefined,
        from: weekStart.toISOString(),
        to: weekEnd.toISOString(),
        pageSize: 100,
      })
      .then((res) => {
        setMeetings(res.data);
        setError(null);
      })
      .catch((err) => setError(errorMessage(err)));
  }, [weekStart, weekEnd, search]);

  const meetingsByDay = days.map((day) =>
    meetings
      .filter((m) => sameDay(new Date(m.start_time), day))
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
  );

  const weekLabel = `${weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${addDays(
    weekEnd,
    -1
  ).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <div>
      <h1>Calendar</h1>
      <p className="muted">Meetings you organize, or are invited to.</p>

      <div className="toolbar" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button type="button" onClick={() => setWeekStart((w) => addDays(w, -7))}>
            &larr; Prev
          </button>
          <button type="button" onClick={() => setWeekStart(startOfWeek(new Date()))}>
            Today
          </button>
          <button type="button" onClick={() => setWeekStart((w) => addDays(w, 7))}>
            Next &rarr;
          </button>
          <strong style={{ marginLeft: 8 }}>{weekLabel}</strong>
        </div>
        <input type="search" placeholder="Search by title" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {error && <p className="banner error">{error}</p>}

      <div className="week-grid">
        {days.map((day, i) => (
          <div key={i} className={`week-day ${sameDay(day, today) ? "is-today" : ""}`}>
            <div className="week-day-header">
              <div className="week-day-name">{DAY_NAMES[i]}</div>
              <div className="week-day-date">{day.getDate()}</div>
            </div>
            <div className="week-day-body">
              {meetingsByDay[i]!.map((m) => (
                <Link key={m.id} to={`/meetings/${m.id}`} className={`meeting-chip meeting-chip-${m.response_status}`}>
                  <div className="meeting-chip-time">
                    {new Date(m.start_time).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                  </div>
                  <div className="meeting-chip-title">{m.title}</div>
                </Link>
              ))}
              {meetingsByDay[i]!.length === 0 && <div className="muted week-day-empty">-</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { Hono } from "hono";
import type { Env, Variables } from "../env.js";

export const calendar = new Hono<{ Bindings: Env; Variables: Variables }>();

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

// Visibility here is "you organized it, or you're an invited attendee" - no
// manager-chain visibility, matching how a real calendar works.

async function isOnMeeting(db: D1Database, meetingId: number, userId: number): Promise<boolean> {
  const meeting = await db.prepare("SELECT organizer_id FROM meetings WHERE id = ?")
    .bind(meetingId)
    .first<{ organizer_id: number }>();
  if (!meeting) return false;
  if (meeting.organizer_id === userId) return true;

  const attendee = await db
    .prepare("SELECT 1 FROM meeting_attendees WHERE meeting_id = ? AND user_id = ?")
    .bind(meetingId, userId)
    .first();
  return !!attendee;
}

calendar.get("/", async (c) => {
  const requesterId = c.get("userId");
  if (!requesterId) return c.json({ error: "Missing user identity" }, 403);

  const { search, from, to, page, pageSize } = c.req.query();
  const conditions: string[] = [
    "m.id IN (SELECT meeting_id FROM meeting_attendees WHERE user_id = ? UNION SELECT id FROM meetings WHERE organizer_id = ?)",
  ];
  const params: (string | number)[] = [requesterId, requesterId];

  if (search) {
    conditions.push("m.title LIKE ?");
    params.push(`%${search}%`);
  }
  if (from) {
    conditions.push("m.start_time >= ?");
    params.push(from);
  }
  if (to) {
    conditions.push("m.start_time <= ?");
    params.push(to);
  }
  const whereClause = `WHERE ${conditions.join(" AND ")}`;
  const pageNum = Math.max(1, Number(page) || 1);
  const size = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(pageSize) || DEFAULT_PAGE_SIZE));
  const offset = (pageNum - 1) * size;

  const batchResults = await c.env.DB.batch([
    c.env.DB.prepare(`SELECT COUNT(*) as total FROM meetings m ${whereClause}`).bind(...params),
    c.env.DB.prepare(
      `SELECT m.*, COALESCE(a.response_status, 'accepted') AS response_status
       FROM meetings m
       LEFT JOIN meeting_attendees a ON a.meeting_id = m.id AND a.user_id = ?
       ${whereClause}
       ORDER BY m.start_time ASC LIMIT ? OFFSET ?`
    ).bind(requesterId, ...params, size, offset),
  ]);
  const total = Number((batchResults[0]!.results[0] as { total: number } | undefined)?.total ?? 0);

  return c.json({
    data: batchResults[1]!.results,
    total,
    page: pageNum,
    pageSize: size,
    totalPages: Math.ceil(total / size),
  });
});

calendar.get("/:id", async (c) => {
  const requesterId = c.get("userId");
  if (!requesterId) return c.json({ error: "Missing user identity" }, 403);

  const id = Number(c.req.param("id"));
  if (!(await isOnMeeting(c.env.DB, id, requesterId))) {
    return c.json({ error: "You're not on this meeting" }, 403);
  }

  const meeting = await c.env.DB.prepare("SELECT * FROM meetings WHERE id = ?").bind(id).first();
  if (!meeting) return c.json({ error: "Not found" }, 404);
  return c.json(meeting);
});

calendar.get("/:id/attendees", async (c) => {
  const requesterId = c.get("userId");
  if (!requesterId) return c.json({ error: "Missing user identity" }, 403);

  const id = Number(c.req.param("id"));
  if (!(await isOnMeeting(c.env.DB, id, requesterId))) {
    return c.json({ error: "You're not on this meeting" }, 403);
  }

  const { results } = await c.env.DB.prepare(
    `SELECT u.id, u.first_name, u.last_name, u.email, u.job_title, a.response_status
     FROM meeting_attendees a JOIN users u ON u.id = a.user_id
     WHERE a.meeting_id = ?`
  )
    .bind(id)
    .all();
  return c.json({ data: results });
});

calendar.patch("/:id/response", async (c) => {
  const requesterId = c.get("userId");
  if (!requesterId) return c.json({ error: "Missing user identity" }, 403);

  const id = Number(c.req.param("id"));
  const { response_status } = await c.req.json<{ response_status?: string }>();
  if (!response_status || !["accepted", "tentative", "declined", "needs_action"].includes(response_status)) {
    return c.json({ error: "Invalid response_status" }, 400);
  }

  const result = await c.env.DB.prepare(
    "UPDATE meeting_attendees SET response_status = ? WHERE meeting_id = ? AND user_id = ?"
  )
    .bind(response_status, id, requesterId)
    .run();

  if (result.meta.changes === 0) {
    return c.json({ error: "You're not an invited attendee of this meeting" }, 403);
  }

  return c.json({ meeting_id: id, response_status });
});

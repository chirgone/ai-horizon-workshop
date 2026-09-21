// Shared domain types for the Relay (inbox + calendar) demo app, used by
// api/, mcp/, and web/.

/**
 * A local mirror of hr-app's employees (same ids/emails/manager hierarchy),
 * seeded from hr-app's own seed data so a person's identity resolves the
 * same way across every demo app. Unlike hr-app/CRM, mailbox and calendar
 * visibility here is *not* scoped by manager chain - your inbox and your
 * calendar are yours alone, so `manager_id` is only kept for display
 * purposes (e.g. showing an organizer's title) rather than access control.
 */
export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  job_title: string;
  manager_id: number | null;
  is_system_account: boolean;
}

export type EmailFolder = "inbox" | "sent" | "archive";

export interface Email {
  id: number;
  owner_id: number;
  thread_id: string;
  from_name: string;
  from_email: string;
  to_email: string;
  subject: string;
  body: string;
  folder: EmailFolder;
  is_read: boolean;
  received_at: string; // ISO datetime
}

export interface Meeting {
  id: number;
  title: string;
  description: string;
  location: string;
  organizer_id: number;
  start_time: string; // ISO datetime
  end_time: string; // ISO datetime
}

export type AttendeeResponse = "accepted" | "tentative" | "declined" | "needs_action";

export interface MeetingAttendee {
  meeting_id: number;
  user_id: number;
  response_status: AttendeeResponse;
}

/** A meeting joined with the current viewer's own response status. */
export interface MeetingWithResponse extends Meeting {
  response_status: AttendeeResponse;
}

export interface ApiTokenRecord {
  id: number;
  token_hash: string;
  user_id: number | null;
  created_at: string;
  revoked_at: string | null;
  last_used_at: string | null;
  created_by: string | null;
}

export interface AppSettings {
  app_name: string;
  /** Empty string means "use the bundled default logo". */
  logo_url: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

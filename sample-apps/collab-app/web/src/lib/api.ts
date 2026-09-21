import type { AppSettings, AttendeeResponse, Email, MeetingWithResponse, PaginatedResult, User } from "@collab-app/shared";

export interface AttendeeWithUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  job_title: string;
  response_status: AttendeeResponse;
}

export interface MeResponse {
  user: User;
  usedFallback: boolean;
  accessEmail: string | null;
}

/** Extracts a plain message from a caught error, without the "Error: " prefix `String(err)` adds. */
export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

const RELOAD_GUARD_KEY = "relay_access_reauth_reload_at";
const RELOAD_GUARD_WINDOW_MS = 10_000;

/**
 * A plain `fetch()` to a path behind Cloudflare Access can fail with an opaque
 * "TypeError: Failed to fetch" when the Access session needs to (re)authenticate.
 * Try a normal fetch first (this transparently follows same-origin redirects),
 * and only fall back to a full-page reload - at most once per short window -
 * if the plain fetch actually throws.
 */
async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (err) {
    const probe = await fetch(url, { ...init, redirect: "manual" }).catch(() => null);
    const lastReload = Number(sessionStorage.getItem(RELOAD_GUARD_KEY) ?? "0");
    const canReload = Date.now() - lastReload > RELOAD_GUARD_WINDOW_MS;

    if (probe?.type === "opaqueredirect" && canReload) {
      sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
      window.location.reload();
      return new Promise<Response>(() => {});
    }
    throw err;
  }
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json<{ error?: string }>().catch(() => null);
    throw new Error(body?.error || `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export const api = {
  me: () => apiFetch("/api/me").then((res) => json<MeResponse>(res)),

  settings: () => apiFetch("/api/settings").then((res) => json<AppSettings>(res)),

  listUsers: () => apiFetch("/api/proxy/users").then((res) => json<{ data: User[] }>(res)),

  listEmails: (params: { search?: string; folder?: string; page?: number; pageSize?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.folder) qs.set("folder", params.folder);
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));
    return apiFetch(`/api/proxy/emails?${qs.toString()}`).then((res) => json<PaginatedResult<Email>>(res));
  },
  getEmail: (id: number) => apiFetch(`/api/proxy/emails/${id}`).then((res) => json<Email>(res)),
  markEmailRead: (id: number, isRead: boolean) =>
    apiFetch(`/api/proxy/emails/${id}/read`, { method: "PATCH", body: JSON.stringify({ is_read: isRead }) }).then(
      (res) => json<Email>(res)
    ),

  listMeetings: (params: { search?: string; from?: string; to?: string; page?: number; pageSize?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.from) qs.set("from", params.from);
    if (params.to) qs.set("to", params.to);
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));
    return apiFetch(`/api/proxy/calendar?${qs.toString()}`).then((res) =>
      json<PaginatedResult<MeetingWithResponse>>(res)
    );
  },
  getMeeting: (id: number) => apiFetch(`/api/proxy/calendar/${id}`).then((res) => json<MeetingWithResponse>(res)),
  getMeetingAttendees: (id: number) =>
    apiFetch(`/api/proxy/calendar/${id}/attendees`).then((res) => json<{ data: AttendeeWithUser[] }>(res)),
  respondToMeeting: (id: number, responseStatus: string) =>
    apiFetch(`/api/proxy/calendar/${id}/response`, {
      method: "PATCH",
      body: JSON.stringify({ response_status: responseStatus }),
    }).then((res) => json<{ meeting_id: number; response_status: string }>(res)),
};

export interface AdminTokenRow {
  id: number;
  user_id: number | null;
  user_email: string | null;
  user_name: string | null;
  created_at: string;
  revoked_at: string | null;
  last_used_at: string | null;
  created_by: string | null;
}

export interface UserSummary {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  job_title: string;
  is_system_account: boolean;
}

export const adminApi = {
  listTokens: (params: { search?: string; page?: number; pageSize?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));
    return apiFetch(`/admin/api/tokens?${qs.toString()}`).then((res) => json<PaginatedResult<AdminTokenRow>>(res));
  },
  revokeToken: (id: number) =>
    apiFetch(`/admin/api/tokens/${id}/revoke`, { method: "POST" }).then((res) => json<{ revoked: boolean }>(res)),

  getSettings: () => apiFetch("/api/settings").then((res) => json<AppSettings>(res)),
  updateSettings: (settings: Partial<AppSettings>) =>
    apiFetch("/admin/api/settings", { method: "PATCH", body: JSON.stringify(settings) }).then((res) =>
      json<AppSettings>(res)
    ),

  searchUsers: (params: { search?: string; page?: number; pageSize?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));
    return apiFetch(`/admin/api/users?${qs.toString()}`).then((res) => json<PaginatedResult<UserSummary>>(res));
  },
  setAllAccountsDomain: (domain: string) =>
    apiFetch("/admin/api/users/domain", { method: "POST", body: JSON.stringify({ domain }) }).then((res) =>
      json<{ updated: number; domain: string }>(res)
    ),
};

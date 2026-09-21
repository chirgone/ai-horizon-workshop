import type { AppSettings, Page, PageVersion, PaginatedResult, Space, User } from "@wiki-app/shared";

export interface MeResponse {
  user: User;
  usedFallback: boolean;
  accessEmail: string | null;
}

/** Extracts a plain message from a caught error, without the "Error: " prefix `String(err)` adds. */
export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

const RELOAD_GUARD_KEY = "nexus_access_reauth_reload_at";
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

  listSpaces: () => apiFetch("/api/proxy/spaces").then((res) => json<{ data: Space[] }>(res)),
  getSpace: (id: number) => apiFetch(`/api/proxy/spaces/${id}`).then((res) => json<Space>(res)),
  getSpacePages: (id: number) => apiFetch(`/api/proxy/spaces/${id}/pages`).then((res) => json<{ data: Page[] }>(res)),

  searchPages: (params: { search?: string; page?: number; pageSize?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));
    return apiFetch(`/api/proxy/pages?${qs.toString()}`).then((res) => json<PaginatedResult<Page>>(res));
  },
  getPage: (id: number) => apiFetch(`/api/proxy/pages/${id}`).then((res) => json<Page>(res)),
  getPageHistory: (id: number) =>
    apiFetch(`/api/proxy/pages/${id}/history`).then((res) => json<{ data: PageVersion[] }>(res)),
  createPage: (body: { space_id: number; title: string; body?: string; parent_page_id?: number }) =>
    apiFetch("/api/proxy/pages", { method: "POST", body: JSON.stringify(body) }).then((res) => json<Page>(res)),
  updatePage: (id: number, body: { title?: string; body?: string }) =>
    apiFetch(`/api/proxy/pages/${id}`, { method: "PATCH", body: JSON.stringify(body) }).then((res) =>
      json<Page>(res)
    ),
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

export interface SpaceSummary extends Space {
  page_count: number;
  member_count: number;
}

export interface SpaceMemberSummary {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
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

  listAllSpaces: () => apiFetch("/admin/api/spaces").then((res) => json<{ data: SpaceSummary[] }>(res)),
  createSpace: (body: { name: string; description?: string; is_restricted?: boolean; owner_id: number }) =>
    apiFetch("/admin/api/spaces", { method: "POST", body: JSON.stringify(body) }).then((res) => json<Space>(res)),
  updateSpace: (id: number, body: { name?: string; description?: string; is_restricted?: boolean }) =>
    apiFetch(`/admin/api/spaces/${id}`, { method: "PATCH", body: JSON.stringify(body) }).then((res) =>
      json<Space>(res)
    ),
  listSpaceMembers: (id: number) =>
    apiFetch(`/admin/api/spaces/${id}/members`).then((res) => json<{ data: SpaceMemberSummary[] }>(res)),
  addSpaceMember: (id: number, userId: number) =>
    apiFetch(`/admin/api/spaces/${id}/members`, { method: "POST", body: JSON.stringify({ user_id: userId }) }).then(
      (res) => json<{ added: boolean }>(res)
    ),
  removeSpaceMember: (id: number, userId: number) =>
    apiFetch(`/admin/api/spaces/${id}/members/${userId}/remove`, { method: "POST" }).then((res) =>
      json<{ removed: boolean }>(res)
    ),
};

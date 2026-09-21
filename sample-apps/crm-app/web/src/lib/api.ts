import type { Activity, AppSettings, Company, Contact, Deal, PaginatedResult, Rep } from "@crm-app/shared";

export interface MeResponse {
  rep: Rep;
  usedFallback: boolean;
  accessEmail: string | null;
}

/** Extracts a plain message from a caught error, without the "Error: " prefix `String(err)` adds. */
export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

const RELOAD_GUARD_KEY = "crmapp_access_reauth_reload_at";
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

  listReps: () => apiFetch("/api/proxy/reps").then((res) => json<{ data: Rep[] }>(res)),

  listCompanies: (params: { search?: string; page?: number; pageSize?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));
    return apiFetch(`/api/proxy/companies?${qs.toString()}`).then((res) => json<PaginatedResult<Company>>(res));
  },
  getCompany: (id: number) => apiFetch(`/api/proxy/companies/${id}`).then((res) => json<Company>(res)),
  getCompanyContacts: (id: number) =>
    apiFetch(`/api/proxy/companies/${id}/contacts`).then((res) => json<{ data: Contact[] }>(res)),
  getCompanyDeals: (id: number) =>
    apiFetch(`/api/proxy/companies/${id}/deals`).then((res) => json<{ data: Deal[] }>(res)),

  listDeals: (params: { search?: string; stage?: string; page?: number; pageSize?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.stage) qs.set("stage", params.stage);
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));
    return apiFetch(`/api/proxy/deals?${qs.toString()}`).then((res) => json<PaginatedResult<Deal>>(res));
  },
  getDeal: (id: number) => apiFetch(`/api/proxy/deals/${id}`).then((res) => json<Deal>(res)),
  getDealActivities: (id: number) =>
    apiFetch(`/api/proxy/deals/${id}/activities`).then((res) => json<{ data: Activity[] }>(res)),
  logDealActivity: (id: number, body: { type: string; notes: string }) =>
    apiFetch(`/api/proxy/deals/${id}/activities`, { method: "POST", body: JSON.stringify(body) }).then((res) =>
      json<Activity>(res)
    ),
};

export interface AdminTokenRow {
  id: number;
  rep_id: number | null;
  rep_email: string | null;
  rep_name: string | null;
  created_at: string;
  revoked_at: string | null;
  last_used_at: string | null;
  created_by: string | null;
}

export interface RepSummary {
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

  searchReps: (params: { search?: string; page?: number; pageSize?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));
    return apiFetch(`/admin/api/reps?${qs.toString()}`).then((res) => json<PaginatedResult<RepSummary>>(res));
  },
  setAllAccountsDomain: (domain: string) =>
    apiFetch("/admin/api/reps/domain", { method: "POST", body: JSON.stringify({ domain }) }).then((res) =>
      json<{ updated: number; domain: string }>(res)
    ),
};

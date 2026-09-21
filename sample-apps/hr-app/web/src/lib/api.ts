import type {
  AppSettings,
  BenefitEnrollment,
  CompensationRecord,
  Department,
  Employee,
  PaginatedResult,
  PerformanceReview,
  TimeOffBalance,
  TimeOffRequest,
} from "@hr-app/shared";

export interface MeResponse {
  employee: Employee;
  usedFallback: boolean;
  accessEmail: string | null;
}

/** Extracts a plain message from a caught error, without the "Error: " prefix `String(err)` adds. */
export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

const RELOAD_GUARD_KEY = "hrapp_access_reauth_reload_at";
const RELOAD_GUARD_WINDOW_MS = 10_000;

/**
 * A plain `fetch()` to a path behind Cloudflare Access can fail with an opaque
 * "TypeError: Failed to fetch" when the Access session needs to (re)authenticate:
 * Access responds with a redirect to a different origin (its login page), and
 * the browser blocks that cross-origin redirect for a `fetch()` in CORS mode
 * before our code ever sees why.
 *
 * We can't tell "must reauthenticate" apart from a harmless same-origin redirect
 * (Access sometimes silently refreshes its session cookie this way even while
 * you're still logged in) without risking an infinite reload loop, so: try a
 * normal fetch first (this transparently follows same-origin redirects, same as
 * any other request), and only fall back to a full-page reload - at most once
 * per short window - if the plain fetch actually throws.
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
      return new Promise<Response>(() => {}); // page is navigating away; never resolve
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

  listEmployees: (params: { search?: string; department_id?: number; page?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.department_id) qs.set("department_id", String(params.department_id));
    if (params.page) qs.set("page", String(params.page));
    return apiFetch(`/api/proxy/employees?${qs.toString()}`).then((res) => json<PaginatedResult<Employee>>(res));
  },

  getEmployee: (id: number) => apiFetch(`/api/proxy/employees/${id}`).then((res) => json<Employee>(res)),

  getReports: (id: number) =>
    apiFetch(`/api/proxy/employees/${id}/reports`).then((res) => json<{ data: Employee[] }>(res)),

  getCompensation: (id: number) =>
    apiFetch(`/api/proxy/employees/${id}/compensation`).then((res) => json<{ data: CompensationRecord[] }>(res)),

  getTimeOff: (id: number) =>
    apiFetch(`/api/proxy/employees/${id}/time-off`).then((res) =>
      json<{ balance: TimeOffBalance | null; requests: TimeOffRequest[] }>(res)
    ),

  requestTimeOff: (id: number, body: { type: string; start_date: string; end_date: string }) =>
    apiFetch(`/api/proxy/employees/${id}/time-off`, {
      method: "POST",
      body: JSON.stringify(body),
    }).then((res) => json<TimeOffRequest>(res)),

  getReviews: (id: number) =>
    apiFetch(`/api/proxy/employees/${id}/reviews`).then((res) => json<{ data: PerformanceReview[] }>(res)),

  getBenefits: (id: number) =>
    apiFetch(`/api/proxy/employees/${id}/benefits`).then((res) => json<{ data: BenefitEnrollment[] }>(res)),

  listDepartments: () => apiFetch("/api/proxy/departments").then((res) => json<{ data: Department[] }>(res)),
};

export interface AdminTokenRow {
  id: number;
  employee_id: number | null;
  employee_email: string | null;
  employee_name: string | null;
  created_at: string;
  revoked_at: string | null;
  last_used_at: string | null;
  created_by: string | null;
}

export interface EmployeeSummary {
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

  searchEmployees: (params: { search?: string; page?: number; pageSize?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));
    return apiFetch(`/admin/api/employees?${qs.toString()}`).then((res) =>
      json<PaginatedResult<EmployeeSummary>>(res)
    );
  },
  updateEmployeeEmail: (id: number, email: string) =>
    apiFetch(`/admin/api/employees/${id}/email`, { method: "PATCH", body: JSON.stringify({ email }) }).then((res) =>
      json<Employee>(res)
    ),
  setAllAccountsDomain: (domain: string) =>
    apiFetch("/admin/api/employees/domain", { method: "POST", body: JSON.stringify({ domain }) }).then((res) =>
      json<{ updated: number; domain: string }>(res)
    ),
};

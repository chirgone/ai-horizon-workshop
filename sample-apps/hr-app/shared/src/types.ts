// Shared domain types for the HR demo app, used by api/, mcp/, and web/.

export type EmploymentStatus = "active" | "on_leave" | "terminated";
export type EmploymentType = "full_time" | "part_time" | "contractor";

export interface Department {
  id: number;
  name: string;
  division: string;
  cost_center: string;
}

export interface Employee {
  id: number;
  employee_number: string;
  first_name: string;
  last_name: string;
  email: string;
  job_title: string;
  department_id: number;
  manager_id: number | null;
  hire_date: string; // ISO date
  employment_status: EmploymentStatus;
  employment_type: EmploymentType;
  location: string;
  photo_url: string | null;
  /** Personal home address - distinct from `location` (office/work location). */
  home_address: string | null;
  /**
   * True for non-employee identities that exist purely so an external login
   * (e.g. an IdP's own super-admin account) resolves to *something* here -
   * excluded from the employee directory, org chart, and reports lists.
   */
  is_system_account: boolean;
}

export interface CompensationRecord {
  id: number;
  employee_id: number;
  effective_date: string;
  base_salary: number;
  currency: string;
  bonus_target_pct: number;
  change_reason: string;
}

export type TimeOffType = "vacation" | "sick" | "personal";
export type TimeOffStatus = "pending" | "approved" | "denied";

export interface TimeOffBalance {
  employee_id: number;
  vacation_days_remaining: number;
  sick_days_remaining: number;
  updated_at: string;
}

export interface TimeOffRequest {
  id: number;
  employee_id: number;
  type: TimeOffType;
  start_date: string;
  end_date: string;
  status: TimeOffStatus;
  requested_at: string;
}

export interface PerformanceReview {
  id: number;
  employee_id: number;
  reviewer_id: number;
  review_period: string;
  rating: number; // 1-5
  summary: string;
  review_date: string;
}

export type BenefitPlan = "medical" | "dental" | "vision" | "401k";

export interface BenefitEnrollment {
  id: number;
  employee_id: number;
  plan_name: BenefitPlan;
  coverage_level: string;
  enrollment_date: string;
}

export interface ApiTokenRecord {
  id: number;
  token_hash: string;
  /** The employee this token was minted for via the MCP OAuth login flow (null for legacy/service tokens). */
  employee_id: number | null;
  created_at: string;
  revoked_at: string | null;
  last_used_at: string | null;
  created_by: string | null;
}

/** Token list row as returned by the admin API, joined with basic employee info. */
export interface ApiTokenWithEmployee extends ApiTokenRecord {
  employee_email: string | null;
  employee_name: string | null;
}

export interface AppSettings {
  app_name: string;
  /** Empty string means "use the bundled default WorkWeek logo". */
  logo_url: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

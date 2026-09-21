// Shared domain types for the CRM demo app, used by api/, mcp/, and web/.

/**
 * Sales reps - a local mirror of hr-app's employees (same ids/emails/manager
 * hierarchy), seeded from hr-app's own seed data so a person's identity
 * resolves the same way across every demo app. Visibility of companies,
 * contacts, and deals is scoped to "yours, or your reports' (recursively)" -
 * this manager hierarchy is what makes that possible without a live
 * cross-app call to hr-app on every request.
 */
export interface Rep {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  job_title: string;
  manager_id: number | null;
  is_system_account: boolean;
}

export type DealStage = "prospecting" | "qualification" | "proposal" | "negotiation" | "closed_won" | "closed_lost";

export interface Company {
  id: number;
  name: string;
  industry: string;
  website: string;
  address: string;
  owner_id: number;
}

export interface Contact {
  id: number;
  company_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  title: string;
}

export interface Deal {
  id: number;
  company_id: number;
  contact_id: number | null;
  name: string;
  stage: DealStage;
  value: number; // whole-dollar amount
  close_date: string; // ISO date
  owner_id: number;
  created_at: string;
  updated_at: string;
}

export type ActivityType = "call" | "email" | "meeting" | "note";

export interface Activity {
  id: number;
  deal_id: number;
  rep_id: number;
  type: ActivityType;
  notes: string;
  activity_date: string; // ISO date
}

export interface ApiTokenRecord {
  id: number;
  token_hash: string;
  rep_id: number | null;
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

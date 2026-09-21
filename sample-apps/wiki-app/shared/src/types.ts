// Shared domain types for the Nexus (internal wiki) demo app, used by api/,
// mcp/, and web/.

/**
 * A local mirror of hr-app's employees (same ids/emails/manager hierarchy),
 * seeded from hr-app's own seed data so a person's identity resolves the
 * same way across every demo app.
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

/**
 * A space is the top-level container pages live in (like a Confluence space).
 * Public spaces are visible to every user; restricted spaces are only visible
 * to their owner and members (see `space_members`).
 */
export interface Space {
  id: number;
  name: string;
  description: string;
  is_restricted: boolean;
  owner_id: number;
  created_at: string;
}

export interface SpaceMember {
  space_id: number;
  user_id: number;
}

export interface Page {
  id: number;
  space_id: number;
  parent_page_id: number | null;
  title: string;
  body: string;
  author_id: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
}

/** A prior revision of a page's body, captured just before an overwrite. */
export interface PageVersion {
  id: number;
  page_id: number;
  body: string;
  edited_by: number;
  edited_at: string;
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

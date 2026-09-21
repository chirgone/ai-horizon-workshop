-- Core schema for the CRM demo app.

-- Local mirror of hr-app's employees - see shared/src/types.ts for why.
CREATE TABLE reps (
  id INTEGER PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  job_title TEXT NOT NULL,
  manager_id INTEGER REFERENCES reps(id),
  -- True for non-rep identities that exist purely so an external login (e.g.
  -- an IdP's own super-admin account) resolves to *something* here - excluded
  -- from rep pickers, org-chart-style downline scoping, etc.
  is_system_account INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_reps_manager ON reps(manager_id);
CREATE INDEX idx_reps_email ON reps(email);

-- Mirrors hr-app's admin@company.com system identity, so FlareID's own
-- super-admin account resolves to something here too.
INSERT INTO reps (id, first_name, last_name, email, job_title, manager_id, is_system_account)
VALUES (31, 'System', 'Administrator', 'admin@company.com', 'System Administrator', NULL, 1);

CREATE TABLE companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  industry TEXT NOT NULL,
  website TEXT NOT NULL,
  address TEXT NOT NULL,
  owner_id INTEGER NOT NULL REFERENCES reps(id)
);

CREATE INDEX idx_companies_owner ON companies(owner_id);

CREATE TABLE contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  title TEXT NOT NULL
);

CREATE INDEX idx_contacts_company ON contacts(company_id);

CREATE TABLE deals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id),
  contact_id INTEGER REFERENCES contacts(id),
  name TEXT NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
  value INTEGER NOT NULL,
  close_date TEXT NOT NULL,
  owner_id INTEGER NOT NULL REFERENCES reps(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_deals_owner ON deals(owner_id);
CREATE INDEX idx_deals_company ON deals(company_id);
CREATE INDEX idx_deals_stage ON deals(stage);

CREATE TABLE activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deal_id INTEGER NOT NULL REFERENCES deals(id),
  rep_id INTEGER NOT NULL REFERENCES reps(id),
  type TEXT NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'note')),
  notes TEXT NOT NULL,
  activity_date TEXT NOT NULL
);

CREATE INDEX idx_activities_deal ON activities(deal_id);

-- Per-rep API tokens, minted for the MCP OAuth flow and the web dashboard -
-- same pattern as hr-app.
CREATE TABLE api_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_hash TEXT NOT NULL UNIQUE,
  rep_id INTEGER REFERENCES reps(id),
  created_at TEXT NOT NULL,
  revoked_at TEXT,
  last_used_at TEXT,
  created_by TEXT
);

CREATE INDEX idx_api_tokens_rep ON api_tokens(rep_id);

CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT INTO app_settings (key, value, updated_at) VALUES
  ('app_name', 'Pipeline', CURRENT_TIMESTAMP),
  ('logo_url', '', CURRENT_TIMESTAMP);

-- Core schema for Nexus (internal wiki) demo app.

-- Local mirror of hr-app's employees - see shared/src/types.ts for why.
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  job_title TEXT NOT NULL,
  manager_id INTEGER REFERENCES users(id),
  -- True for non-user identities that exist purely so an external login (e.g.
  -- an IdP's own super-admin account) resolves to *something* here.
  is_system_account INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_users_manager ON users(manager_id);
CREATE INDEX idx_users_email ON users(email);

-- Mirrors hr-app's admin@company.com system identity.
INSERT INTO users (id, first_name, last_name, email, job_title, manager_id, is_system_account)
VALUES (31, 'System', 'Administrator', 'admin@company.com', 'System Administrator', NULL, 1);

CREATE TABLE spaces (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  is_restricted INTEGER NOT NULL DEFAULT 0,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL
);

-- Membership only matters for restricted spaces - the owner always has access
-- regardless of whether they're also listed here.
CREATE TABLE space_members (
  space_id INTEGER NOT NULL REFERENCES spaces(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  PRIMARY KEY (space_id, user_id)
);

CREATE INDEX idx_space_members_user ON space_members(user_id);

CREATE TABLE pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  space_id INTEGER NOT NULL REFERENCES spaces(id),
  parent_page_id INTEGER REFERENCES pages(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  author_id INTEGER NOT NULL REFERENCES users(id),
  updated_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_pages_space ON pages(space_id);
CREATE INDEX idx_pages_parent ON pages(parent_page_id);

-- Snapshot of a page's body taken just before each overwrite, so page history
-- shows every prior revision (the current body lives on the `pages` row itself).
CREATE TABLE page_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_id INTEGER NOT NULL REFERENCES pages(id),
  body TEXT NOT NULL,
  edited_by INTEGER NOT NULL REFERENCES users(id),
  edited_at TEXT NOT NULL
);

CREATE INDEX idx_page_versions_page ON page_versions(page_id);

-- Per-user API tokens, minted for the MCP OAuth flow and the web dashboard -
-- same pattern as the other demo apps.
CREATE TABLE api_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_hash TEXT NOT NULL UNIQUE,
  user_id INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL,
  revoked_at TEXT,
  last_used_at TEXT,
  created_by TEXT
);

CREATE INDEX idx_api_tokens_user ON api_tokens(user_id);

CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT INTO app_settings (key, value, updated_at) VALUES
  ('app_name', 'Nexus', CURRENT_TIMESTAMP),
  ('logo_url', '', CURRENT_TIMESTAMP);

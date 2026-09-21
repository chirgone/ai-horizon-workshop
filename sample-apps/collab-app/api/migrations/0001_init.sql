-- Core schema for Relay (inbox + calendar) demo app.

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

-- Each row is one message in one person's mailbox - mail is not a shared
-- record between sender/recipient here (simpler model, and matches "this is
-- MY inbox" framing). `folder` distinguishes a person's inbox from their own
-- sent items and archive.
CREATE TABLE emails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  thread_id TEXT NOT NULL,
  from_name TEXT NOT NULL,
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  folder TEXT NOT NULL CHECK (folder IN ('inbox', 'sent', 'archive')),
  is_read INTEGER NOT NULL DEFAULT 0,
  received_at TEXT NOT NULL
);

CREATE INDEX idx_emails_owner ON emails(owner_id);
CREATE INDEX idx_emails_owner_folder ON emails(owner_id, folder);
CREATE INDEX idx_emails_thread ON emails(thread_id);

CREATE TABLE meetings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  organizer_id INTEGER NOT NULL REFERENCES users(id),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL
);

CREATE INDEX idx_meetings_organizer ON meetings(organizer_id);
CREATE INDEX idx_meetings_start ON meetings(start_time);

CREATE TABLE meeting_attendees (
  meeting_id INTEGER NOT NULL REFERENCES meetings(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  response_status TEXT NOT NULL CHECK (response_status IN ('accepted', 'tentative', 'declined', 'needs_action')),
  PRIMARY KEY (meeting_id, user_id)
);

CREATE INDEX idx_attendees_user ON meeting_attendees(user_id);

-- Per-user API tokens, minted for the MCP OAuth flow and the web dashboard -
-- same pattern as hr-app/crm-app.
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
  ('app_name', 'Relay', CURRENT_TIMESTAMP),
  ('logo_url', '', CURRENT_TIMESTAMP);

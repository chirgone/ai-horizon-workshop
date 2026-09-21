-- Splits display_name into given/family name (needed for OIDC given_name /
-- family_name claims), adds an audit log, a generic key/value settings table,
-- a multi-domain table, an "amr" column on auth_codes (so id_tokens can report
-- which authentication methods were actually used), and moves "who can access
-- /admin" off a boolean attribute and onto membership in a "Super Admins" group.

ALTER TABLE users ADD COLUMN given_name TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN family_name TEXT NOT NULL DEFAULT '';

UPDATE users
SET given_name = TRIM(SUBSTR(display_name, 1, INSTR(display_name, ' ') - 1)),
    family_name = TRIM(SUBSTR(display_name, INSTR(display_name, ' ') + 1))
WHERE INSTR(display_name, ' ') > 0;

UPDATE users SET given_name = display_name WHERE INSTR(display_name, ' ') = 0;

ALTER TABLE auth_codes ADD COLUMN amr TEXT NOT NULL DEFAULT 'pwd';
ALTER TABLE access_tokens ADD COLUMN amr TEXT NOT NULL DEFAULT 'pwd';
ALTER TABLE refresh_tokens ADD COLUMN amr TEXT NOT NULL DEFAULT 'pwd';

-- SCIM: FlareID is a SCIM 2.0 *client* that pushes users/groups to a SCIM
-- server (e.g. the endpoint + secret Cloudflare Access generates once SCIM is
-- enabled on an identity provider). scim_id tracks the remote resource id
-- returned when we first create each record there.
ALTER TABLE users ADD COLUMN scim_id TEXT;
ALTER TABLE groups ADD COLUMN scim_id TEXT;

CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at TEXT NOT NULL,
  actor_user_id INTEGER REFERENCES users(id),
  actor_upn TEXT,
  action TEXT NOT NULL,
  target TEXT,
  details TEXT -- JSON
);

CREATE INDEX idx_audit_log_at ON audit_log(at);

CREATE TABLE idp_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- `setup_completed` gates login to Super Admins only until an admin has
-- visited the /admin/setup wizard and confirmed the domain/default password.
INSERT INTO idp_settings (key, value, updated_at) VALUES
  ('default_password', 'Savetheinternet!1', CURRENT_TIMESTAMP),
  ('password_policy', '{"minLength":8,"requireUppercase":false,"requireLowercase":false,"requireNumber":false,"requireSymbol":false}', CURRENT_TIMESTAMP),
  ('setup_completed', 'false', CURRENT_TIMESTAMP),
  ('scim_endpoint', '', CURRENT_TIMESTAMP),
  ('scim_secret', '', CURRENT_TIMESTAMP);

CREATE TABLE domains (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain TEXT NOT NULL UNIQUE,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

INSERT INTO domains (domain, is_default, created_at) VALUES ('company.com', 1, CURRENT_TIMESTAMP);

-- "Super Admins" replaces the is_admin boolean attribute as the source of
-- truth for /admin access - it's just a regular group, managed the same way
-- as any other group.
INSERT INTO groups (name, description) VALUES ('Super Admins', 'Members can access FlareID''s /admin area');

-- The one and only default admin account. Its password matches the seeded
-- default_password above (hash below is PBKDF2-SHA256/100000 of "Savetheinternet!1").
INSERT INTO users (upn, display_name, given_name, family_name, password_hash, password_salt, password_iterations, is_admin, created_at, updated_at)
VALUES ('admin@company.com', 'Admin', 'Admin', '', '701496af82b57f0872493050e882734acfed27c4afad7e15943cb016e759d695', 'f88030aa5ac7c7e092c720c269e108bb', 100000, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO group_members (group_id, user_id)
VALUES ((SELECT id FROM groups WHERE name = 'Super Admins'), (SELECT id FROM users WHERE upn = 'admin@company.com'));

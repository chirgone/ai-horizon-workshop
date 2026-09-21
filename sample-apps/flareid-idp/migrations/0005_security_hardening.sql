-- Rate limiting policy (used with KV-backed counters, not stored per-attempt here).
INSERT INTO idp_settings (key, value, updated_at) VALUES
  ('rate_limit_max_attempts', '5', CURRENT_TIMESTAMP),
  ('rate_limit_window_minutes', '15', CURRENT_TIMESTAMP);

-- MFA backup/recovery codes (one-time use, hashed like passwords).
CREATE TABLE mfa_backup_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  code_hash TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_mfa_backup_codes_user ON mfa_backup_codes(user_id);

-- Server-tracked sessions, so we can list/revoke them (self-service "sign out
-- everywhere" and admin-forced logout), instead of a purely stateless cookie.
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  amr TEXT NOT NULL DEFAULT '["pwd"]',
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  revoked_at TEXT
);

CREATE INDEX idx_sessions_user ON sessions(user_id);

-- Audit log gains request context.
ALTER TABLE audit_log ADD COLUMN ip TEXT;
ALTER TABLE audit_log ADD COLUMN user_agent TEXT;

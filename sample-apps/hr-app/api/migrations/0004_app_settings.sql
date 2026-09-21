-- App-wide branding settings, configurable from the /admin page. Deliberately a
-- simple key/value table so more settings can be added later without a migration.
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT INTO app_settings (key, value, updated_at) VALUES
  ('app_name', 'WorkWeek', CURRENT_TIMESTAMP),
  ('logo_url', '', CURRENT_TIMESTAMP);

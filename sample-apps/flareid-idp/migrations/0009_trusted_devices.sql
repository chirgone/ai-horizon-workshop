-- "Remember this device" - lets a user skip the MFA challenge on a device
-- they've already verified with MFA recently, without disabling MFA itself.
CREATE TABLE trusted_devices (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  user_agent TEXT,
  ip TEXT,
  created_at TEXT NOT NULL,
  last_used_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX idx_trusted_devices_user ON trusted_devices(user_id);

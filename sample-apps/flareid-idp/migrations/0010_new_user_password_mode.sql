-- Whether newly created accounts (and password resets) get the shared
-- default_password, or a freshly generated random password that respects
-- the password complexity policy.
INSERT INTO idp_settings (key, value, updated_at) VALUES
  ('new_user_password_mode', 'random', CURRENT_TIMESTAMP);

-- Lets people log in with just their username (the part before @domain),
-- not just their full UPN. Requires the username part to be unique across
-- every domain in the directory, not just within one - enforced here.
ALTER TABLE users ADD COLUMN username TEXT;

UPDATE users SET username = lower(substr(upn, 1, instr(upn, '@') - 1)) WHERE username IS NULL;

CREATE UNIQUE INDEX idx_users_username ON users(username);

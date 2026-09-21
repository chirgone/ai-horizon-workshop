-- HR-style attributes (job title, department, manager) so they can be passed
-- through as OIDC custom claims and SCIM attributes, letting Cloudflare Zero
-- Trust policies match on them directly.
--
-- Users get a stable external_id (UUID) used as the manager reference instead
-- of email, so re-pointing someone's manager survives that manager's email
-- ever changing. external_id is also what's issued as the OIDC "id"/SCIM
-- externalId going forward, instead of the raw internal integer id.

ALTER TABLE users ADD COLUMN external_id TEXT;
ALTER TABLE users ADD COLUMN job_title TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN department TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN manager_external_id TEXT;

-- Backfill a UUID v4 for every existing row (SQLite has no native UUID()
-- function, so build one from random blobs per RFC 4122). Deliberately not
-- wrapped in a scalar `(SELECT ...)` - some SQLite query planners treat that
-- as a constant and evaluate it once for the whole UPDATE instead of per row.
UPDATE users
SET external_id = lower(
  hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' ||
  substr(hex(randomblob(2)), 2) || '-' ||
  substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)), 2) || '-' ||
  hex(randomblob(6))
)
WHERE external_id IS NULL;

CREATE UNIQUE INDEX idx_users_external_id ON users(external_id);
CREATE INDEX idx_users_manager_external_id ON users(manager_external_id);

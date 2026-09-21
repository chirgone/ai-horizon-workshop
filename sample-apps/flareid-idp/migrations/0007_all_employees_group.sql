-- A company-wide group every user belongs to (in addition to their
-- department-specific groups) - useful as a simple "everyone" target for
-- Access policies/SCIM sync scope, and every new user is auto-joined to it
-- going forward (see admin.ts's POST /admin/users handler).
INSERT INTO groups (name, description) VALUES ('All Employees', 'Every user in the organization');

INSERT INTO group_members (group_id, user_id)
SELECT (SELECT id FROM groups WHERE name = 'All Employees'), id FROM users;

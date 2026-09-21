-- Lets SCIM sync be scoped to "all groups" (default, current behavior) or a
-- specific set of groups - only members of those groups get pushed as SCIM
-- Users, and only those groups get pushed as SCIM Groups.
INSERT INTO idp_settings (key, value, updated_at) VALUES
  ('scim_scope_mode', 'all', CURRENT_TIMESTAMP),
  ('scim_scope_group_ids', '[]', CURRENT_TIMESTAMP);

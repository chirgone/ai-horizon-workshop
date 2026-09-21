-- Additional HR attributes, matching hr-app's employee schema, so the IdP can
-- hold (and eventually receive via SCIM from hr-app - see ROADMAP.md) the
-- full set of identity-relevant HR fields, not just job title/department/manager.
ALTER TABLE users ADD COLUMN employee_number TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN hire_date TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN employment_status TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN employment_type TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN location TEXT NOT NULL DEFAULT '';

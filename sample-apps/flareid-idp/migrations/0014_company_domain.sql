-- Switches every seeded user's UPN from the placeholder @aihorizon-demo.com
-- domain to @company.com, matching the default domain and hr-app's employee
-- emails, so Access-identity resolution (exact email match) works out of the
-- box. Only the domain suffix changes - username (local part) is untouched.
UPDATE users SET upn = REPLACE(upn, '@aihorizon-demo.com', '@company.com')
WHERE upn LIKE '%@aihorizon-demo.com';

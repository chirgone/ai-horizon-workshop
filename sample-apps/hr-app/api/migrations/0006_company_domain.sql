-- Switches every seeded employee's email from the placeholder @aihorizon-demo.com
-- domain to @company.com, matching FlareID's default domain and its own seeded
-- UPNs, so Access-identity resolution (exact email match) works out of the box.
UPDATE employees SET email = REPLACE(email, '@aihorizon-demo.com', '@company.com')
WHERE email LIKE '%@aihorizon-demo.com';

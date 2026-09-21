-- Adds:
--   1. home_address on employees (personal address, distinct from the office
--      `location` field), backfilled with plausible demo addresses.
--   2. is_system_account, so accounts like admin@company.com (FlareID's own
--      super-admin identity) can exist in this app's directory for
--      Access-identity resolution purposes without appearing in the employee
--      directory, org chart, or reports lists.

ALTER TABLE employees ADD COLUMN home_address TEXT;
ALTER TABLE employees ADD COLUMN is_system_account INTEGER NOT NULL DEFAULT 0;

-- A dedicated department for system accounts, so the NOT NULL department_id
-- foreign key is satisfied without repurposing a real business department.
INSERT INTO departments (id, name, division, cost_center) VALUES (6, 'System', 'Operations', 'CC-000');

INSERT INTO employees (
  id, employee_number, first_name, last_name, email, job_title, department_id, manager_id,
  hire_date, employment_status, employment_type, location, photo_url, is_system_account
) VALUES (
  31, 'SYS-0001', 'System', 'Administrator', 'admin@company.com', 'System Administrator', 6, NULL,
  '2016-01-01', 'active', 'full_time', 'N/A', NULL, 1
);

UPDATE employees SET home_address = '99276 Lehner Overpass, Denver, CO 14109, USA' WHERE id = 1;
UPDATE employees SET home_address = '6763 Rachel Ports, New York, NY 08295, USA' WHERE id = 2;
UPDATE employees SET home_address = '97433 Towne Loaf, Austin, TX 80879, USA' WHERE id = 3;
UPDATE employees SET home_address = '9895 Cecelia Motorway, Austin, TX 52556, USA' WHERE id = 4;
UPDATE employees SET home_address = '52117 Franklin Road, London VP4 7ZU, United Kingdom' WHERE id = 5;
UPDATE employees SET home_address = '58525 Broad Lane, New York, NY 69934, USA' WHERE id = 6;
UPDATE employees SET home_address = '53336 Hazel Grove, Austin, TX 53177, USA' WHERE id = 7;
UPDATE employees SET home_address = '417 Oak Road, New York, NY 88608, USA' WHERE id = 8;
UPDATE employees SET home_address = '28486 Mafalda Harbor, San Francisco, CA 66398, USA' WHERE id = 9;
UPDATE employees SET home_address = '675 Commercial Road, London WL9 1HZ, United Kingdom' WHERE id = 10;
UPDATE employees SET home_address = '453 High Street, London VQ5 9OM, United Kingdom' WHERE id = 11;
UPDATE employees SET home_address = '701 White Locks, London SR8 9BA, United Kingdom' WHERE id = 12;
UPDATE employees SET home_address = '90279 N East Street, Phoenix, AZ 41951, USA' WHERE id = 13;
UPDATE employees SET home_address = '4208 Alexandra Road, Austin, TX 08305, USA' WHERE id = 14;
UPDATE employees SET home_address = '3928 Willow Road, New York, NY 06198, USA' WHERE id = 15;
UPDATE employees SET home_address = '277 Raleigh Pike, Austin, TX 78897, USA' WHERE id = 16;
UPDATE employees SET home_address = '88178 West Street, London FB0 1LR, United Kingdom' WHERE id = 17;
UPDATE employees SET home_address = '52140 Garden Street, Columbus, OH 21624, USA' WHERE id = 18;
UPDATE employees SET home_address = '5542 Mayer-Altenwerth Rapids, Portland, OR 23399, USA' WHERE id = 19;
UPDATE employees SET home_address = '94275 Nelson Street, New York, NY 55817, USA' WHERE id = 20;
UPDATE employees SET home_address = '782 Volkman Summit, London YB6 3ZT, United Kingdom' WHERE id = 21;
UPDATE employees SET home_address = '40927 E Center Street, Austin, TX 93096, USA' WHERE id = 22;
UPDATE employees SET home_address = '7757 Grady Courts, London AE2 2HI, United Kingdom' WHERE id = 23;
UPDATE employees SET home_address = '555 S Central Avenue, Austin, TX 38050, USA' WHERE id = 24;
UPDATE employees SET home_address = '10516 Nova Courts, London VS0 4WU, United Kingdom' WHERE id = 25;
UPDATE employees SET home_address = '475 Littel Underpass, New York, NY 12052, USA' WHERE id = 26;
UPDATE employees SET home_address = '5771 Woodside, London XI3 3MX, United Kingdom' WHERE id = 27;
UPDATE employees SET home_address = '998 W Broadway Street, Raleigh, NC 67845, USA' WHERE id = 28;
UPDATE employees SET home_address = '8247 Poplar Close, London BK3 0JA, United Kingdom' WHERE id = 29;
UPDATE employees SET home_address = '78350 Kristoffer Ways, Minneapolis, MN 36978, USA' WHERE id = 30;

-- Core schema for the HR demo app.

CREATE TABLE departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  division TEXT NOT NULL,
  cost_center TEXT NOT NULL
);

CREATE TABLE employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_number TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  job_title TEXT NOT NULL,
  department_id INTEGER NOT NULL REFERENCES departments(id),
  manager_id INTEGER REFERENCES employees(id),
  hire_date TEXT NOT NULL,
  employment_status TEXT NOT NULL CHECK (employment_status IN ('active', 'on_leave', 'terminated')),
  employment_type TEXT NOT NULL CHECK (employment_type IN ('full_time', 'part_time', 'contractor')),
  location TEXT NOT NULL,
  photo_url TEXT
);

CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_manager ON employees(manager_id);
CREATE INDEX idx_employees_email ON employees(email);

CREATE TABLE compensation_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  effective_date TEXT NOT NULL,
  base_salary INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  bonus_target_pct INTEGER NOT NULL,
  change_reason TEXT NOT NULL
);

CREATE INDEX idx_compensation_employee ON compensation_history(employee_id);

CREATE TABLE time_off_balances (
  employee_id INTEGER PRIMARY KEY REFERENCES employees(id),
  vacation_days_remaining INTEGER NOT NULL,
  sick_days_remaining INTEGER NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE time_off_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  type TEXT NOT NULL CHECK (type IN ('vacation', 'sick', 'personal')),
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'denied')),
  requested_at TEXT NOT NULL
);

CREATE INDEX idx_timeoff_employee ON time_off_requests(employee_id);

CREATE TABLE performance_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  reviewer_id INTEGER NOT NULL REFERENCES employees(id),
  review_period TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  summary TEXT NOT NULL,
  review_date TEXT NOT NULL
);

CREATE INDEX idx_reviews_employee ON performance_reviews(employee_id);

CREATE TABLE benefits_enrollments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  plan_name TEXT NOT NULL CHECK (plan_name IN ('medical', 'dental', 'vision', '401k')),
  coverage_level TEXT NOT NULL,
  enrollment_date TEXT NOT NULL
);

CREATE INDEX idx_benefits_employee ON benefits_enrollments(employee_id);

CREATE TABLE api_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  revoked_at TEXT,
  last_used_at TEXT,
  created_by TEXT
);

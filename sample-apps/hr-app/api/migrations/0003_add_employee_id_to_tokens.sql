-- Per-user API tokens: each token minted via the MCP OAuth login flow is now tied
-- to the employee who authorized it, so access is individually attributable and
-- revocable instead of relying on one shared static secret.
ALTER TABLE api_tokens ADD COLUMN employee_id INTEGER REFERENCES employees(id);

CREATE INDEX idx_api_tokens_employee ON api_tokens(employee_id);

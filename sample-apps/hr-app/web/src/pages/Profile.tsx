import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, errorMessage } from "../lib/api.js";
import type { CompensationRecord, Employee, BenefitEnrollment } from "@hr-app/shared";

export default function Profile() {
  const { id } = useParams();
  const employeeId = Number(id);

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [manager, setManager] = useState<Employee | null>(null);
  const [reports, setReports] = useState<Employee[]>([]);
  const [compensation, setCompensation] = useState<CompensationRecord[]>([]);
  const [benefits, setBenefits] = useState<BenefitEnrollment[]>([]);
  const [sensitiveError, setSensitiveError] = useState<string | null>(null);

  useEffect(() => {
    if (!employeeId) return;
    api.getEmployee(employeeId).then(async (emp) => {
      setEmployee(emp);
      if (emp.manager_id) setManager(await api.getEmployee(emp.manager_id));
    });
    api.getReports(employeeId).then((res) => setReports(res.data));
    api
      .getCompensation(employeeId)
      .then((res) => setCompensation(res.data))
      .catch((err) => setSensitiveError(errorMessage(err)));
    api
      .getBenefits(employeeId)
      .then((res) => setBenefits(res.data))
      .catch((err) => setSensitiveError(errorMessage(err)));
  }, [employeeId]);

  if (!employee) return <p>Loading...</p>;

  return (
    <div>
      <h1>
        {employee.first_name} {employee.last_name}
      </h1>
      <p className="muted">
        {employee.job_title} - {employee.location}
      </p>
      <p className="muted">{employee.email}</p>
      <p>
        <Link to={`/org-chart/${employee.id}`}>View in org chart</Link>
      </p>

      <div className="card-grid">
        <div className="card">
          <h3>Manager</h3>
          <p>{manager ? `${manager.first_name} ${manager.last_name}` : "None (top of org)"}</p>
        </div>
        <div className="card">
          <h3>Direct Reports</h3>
          {reports.length === 0 ? (
            <p className="muted">No direct reports.</p>
          ) : (
            <ul>
              {reports.map((r) => (
                <li key={r.id}>
                  {r.first_name} {r.last_name} - {r.job_title}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card">
          <h3>Employment</h3>
          <dl className="detail-list">
            <dt>Employee #</dt>
            <dd>{employee.employee_number}</dd>
            <dt>Hire Date</dt>
            <dd>{employee.hire_date}</dd>
            <dt>Employment Type</dt>
            <dd className="capitalize">{employee.employment_type.replace("_", " ")}</dd>
            <dt>Status</dt>
            <dd>
              <span className={`badge badge-${employee.employment_status}`}>
                {employee.employment_status.replace("_", " ")}
              </span>
            </dd>
            {employee.home_address && (
              <>
                <dt>Home Address</dt>
                <dd>{employee.home_address}</dd>
              </>
            )}
          </dl>
        </div>
      </div>

      <h2>Compensation History</h2>
      {sensitiveError ? (
        <p className="muted">{sensitiveError}</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Effective Date</th>
              <th>Base Salary</th>
              <th>Bonus Target</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {compensation.map((c) => (
              <tr key={c.id}>
                <td>{c.effective_date}</td>
                <td>
                  {c.currency} {c.base_salary.toLocaleString()}
                </td>
                <td>{c.bonus_target_pct}%</td>
                <td>{c.change_reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Benefits</h2>
      {sensitiveError ? (
        <p className="muted">{sensitiveError}</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Plan</th>
              <th>Coverage</th>
              <th>Enrolled</th>
            </tr>
          </thead>
          <tbody>
            {benefits.map((b) => (
              <tr key={b.id}>
                <td>{b.plan_name}</td>
                <td>{b.coverage_level}</td>
                <td>{b.enrollment_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

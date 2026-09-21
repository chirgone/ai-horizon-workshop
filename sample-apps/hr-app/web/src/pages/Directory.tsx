import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import type { Department, Employee } from "@hr-app/shared";

export default function Directory() {
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState<number | undefined>(undefined);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    api.listDepartments().then((res) => setDepartments(res.data));
  }, []);

  useEffect(() => {
    api.listEmployees({ search, department_id: departmentId }).then((res) => setEmployees(res.data));
  }, [search, departmentId]);

  return (
    <div>
      <h1>Employee Directory</h1>
      <div className="toolbar">
        <input
          type="search"
          placeholder="Search by name, title, or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={departmentId ?? ""}
          onChange={(e) => setDepartmentId(e.target.value ? Number(e.target.value) : undefined)}
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Title</th>
            <th>Location</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((e) => (
            <tr key={e.id}>
              <td>
                <Link to={`/directory/${e.id}`}>
                  {e.first_name} {e.last_name}
                </Link>
              </td>
              <td>{e.job_title}</td>
              <td>{e.location}</td>
              <td>
                <span className={`badge badge-${e.employment_status}`}>{e.employment_status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

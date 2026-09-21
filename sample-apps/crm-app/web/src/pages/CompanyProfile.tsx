import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, errorMessage } from "../lib/api.js";
import type { Company, Contact, Deal } from "@crm-app/shared";

export default function CompanyProfile() {
  const { id } = useParams();
  const companyId = Number(id);

  const [company, setCompany] = useState<Company | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    api
      .getCompany(companyId)
      .then(setCompany)
      .catch((err) => setError(errorMessage(err)));
    api.getCompanyContacts(companyId).then((res) => setContacts(res.data));
    api.getCompanyDeals(companyId).then((res) => setDeals(res.data));
  }, [companyId]);

  if (error) return <p className="banner error">{error}</p>;
  if (!company) return <p>Loading...</p>;

  return (
    <div>
      <h1>{company.name}</h1>
      <p className="muted">{company.industry}</p>
      <p className="muted">{company.website}</p>
      <p className="muted">{company.address}</p>

      <h2>Contacts</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Title</th>
            <th>Email</th>
            <th>Phone</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((c) => (
            <tr key={c.id}>
              <td>
                {c.first_name} {c.last_name}
              </td>
              <td>{c.title}</td>
              <td>{c.email}</td>
              <td>{c.phone}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Deals</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Deal</th>
            <th>Stage</th>
            <th>Value</th>
            <th>Close Date</th>
          </tr>
        </thead>
        <tbody>
          {deals.map((d) => (
            <tr key={d.id}>
              <td>
                <Link to={`/deals/${d.id}`}>{d.name}</Link>
              </td>
              <td>
                <span className={`badge badge-${d.stage}`}>{d.stage.replace("_", " ")}</span>
              </td>
              <td>${d.value.toLocaleString()}</td>
              <td>{d.close_date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

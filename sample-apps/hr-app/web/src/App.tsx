import { NavLink, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { api, errorMessage, type MeResponse } from "./lib/api.js";
import type { AppSettings } from "@hr-app/shared";
import DemoDisclaimer from "./components/DemoDisclaimer.js";

const DEFAULT_LOGO = "/workweek-logo.svg";

export default function App() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [settings, setSettings] = useState<AppSettings>({ app_name: "WorkWeek", logo_url: "" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .me()
      .then(setMe)
      .catch((err) => setError(errorMessage(err)));
    api.settings().then((s) => {
      setSettings(s);
      document.title = s.app_name;
    });
  }, []);

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <img src={settings.logo_url || DEFAULT_LOGO} alt="" className="brand-logo" />
          <span>{settings.app_name}</span>
        </div>
        <nav>
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/directory">Directory</NavLink>
          <NavLink to="/org-chart">Org Chart</NavLink>
          <NavLink to="/time-off">Time Off</NavLink>
          <NavLink to="/reviews">Reviews</NavLink>
        </nav>

        {me && (
          <div className="whoami">
            <NavLink to={`/directory/${me.employee.id}`} className="whoami-name">
              {me.employee.first_name} {me.employee.last_name}
            </NavLink>
            <div className="whoami-title">{me.employee.job_title}</div>
            {me.usedFallback && <div className="whoami-fallback">Demo user (no Access identity matched)</div>}
            <a className="logout-link" href="/cdn-cgi/access/logout">
              Log out
            </a>
          </div>
        )}

        {!!me?.employee.is_system_account && (
          <nav className="admin-nav">
            <NavLink to="/admin">Admin</NavLink>
          </nav>
        )}
      </aside>
      <main className="content">
        {error && <div className="banner error">{error}</div>}
        <Outlet context={{ me, settings }} />
      </main>
      <DemoDisclaimer />
    </div>
  );
}

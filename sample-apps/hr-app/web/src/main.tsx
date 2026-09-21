import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import App from "./App.js";
import Dashboard from "./pages/Dashboard.js";
import Directory from "./pages/Directory.js";
import Profile from "./pages/Profile.js";
import OrgChart from "./pages/OrgChart.js";
import TimeOff from "./pages/TimeOff.js";
import Reviews from "./pages/Reviews.js";
import Admin from "./pages/Admin.js";
import AboutDemo from "./pages/AboutDemo.js";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element");

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Dashboard />} />
          <Route path="directory" element={<Directory />} />
          <Route path="directory/:id" element={<Profile />} />
          <Route path="org-chart" element={<OrgChart />} />
          <Route path="org-chart/:id" element={<OrgChart />} />
          <Route path="time-off" element={<TimeOff />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="admin" element={<Admin />} />
          <Route path="about-demo" element={<AboutDemo />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import App from "./App.js";
import Dashboard from "./pages/Dashboard.js";
import Companies from "./pages/Companies.js";
import CompanyProfile from "./pages/CompanyProfile.js";
import Deals from "./pages/Deals.js";
import DealDetail from "./pages/DealDetail.js";
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
          <Route path="companies" element={<Companies />} />
          <Route path="companies/:id" element={<CompanyProfile />} />
          <Route path="deals" element={<Deals />} />
          <Route path="deals/:id" element={<DealDetail />} />
          <Route path="admin" element={<Admin />} />
          <Route path="about-demo" element={<AboutDemo />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);

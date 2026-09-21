import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import App from "./App.js";
import Inbox from "./pages/Inbox.js";
import EmailDetail from "./pages/EmailDetail.js";
import Calendar from "./pages/Calendar.js";
import MeetingDetail from "./pages/MeetingDetail.js";
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
          <Route index element={<Inbox />} />
          <Route path="emails/:id" element={<EmailDetail />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="meetings/:id" element={<MeetingDetail />} />
          <Route path="admin" element={<Admin />} />
          <Route path="about-demo" element={<AboutDemo />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);

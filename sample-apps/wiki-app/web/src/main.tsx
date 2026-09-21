import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import App from "./App.js";
import Spaces from "./pages/Spaces.js";
import SpaceDetail from "./pages/SpaceDetail.js";
import PageView from "./pages/PageView.js";
import Search from "./pages/Search.js";
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
          <Route index element={<Spaces />} />
          <Route path="spaces/:id" element={<SpaceDetail />} />
          <Route path="pages/:id" element={<PageView />} />
          <Route path="search" element={<Search />} />
          <Route path="admin" element={<Admin />} />
          <Route path="about-demo" element={<AboutDemo />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);

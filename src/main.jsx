import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import App from "./App";
import { isDesktop } from "./configuracao/appTarget";
import "./estilos.css";
import "./estilos-desktop-pdv.css";

if (isDesktop) {
  document.title = "GasPass PDV";
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
  document.head.appendChild(link);
}

const Router = isDesktop ? MemoryRouter : BrowserRouter;
const routerProps = isDesktop
  ? { initialEntries: ["/frentista/ler-voucher"] }
  : {};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router {...routerProps}>
      <App />
    </Router>
  </React.StrictMode>
);

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import App from "./App";
import { isDesktop } from "./configuracao/appTarget";
import { homePathPorPapel } from "./constantes/rotas";
import { carregarSessao, limparSessao } from "./servicos/sessaoServico";
import { papelDesktopPermitido } from "./utilitarios/desktopJanela";
import "./estilos.css";
import "./estilos-desktop-pdv.css";

function rotaInicialDesktop() {
  const s = carregarSessao();
  const papel = s?.usuario?.papel;
  if (papel && papelDesktopPermitido(papel)) {
    return homePathPorPapel(papel);
  }
  if (s) {
    limparSessao();
  }
  return "/login";
}

if (isDesktop) {
  document.title = "GasPass";
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
  document.head.appendChild(link);
}

const Router = isDesktop ? MemoryRouter : BrowserRouter;
const routerProps = isDesktop ? { initialEntries: [rotaInicialDesktop()] } : {};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router {...routerProps}>
      <App />
    </Router>
  </React.StrictMode>
);

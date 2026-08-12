import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import HomeRedirect from "./componentes/rotas/HomeRedirect";
import ProtectedRoute from "./componentes/rotas/ProtectedRoute";
import {
  PAPEL_FRENTISTA,
  PAPEL_GERENTE_POSTO,
  PAPEL_GESTOR_REDE,
  PAPEL_SUPER_ADMIN
} from "./constantes/papeis";
import { homePathPorPapel, PREFIXO_FRENTISTA } from "./constantes/rotas";
import { MENUS_FRENTISTA } from "./constantes/menusPorPapel";
import { isDesktop } from "./configuracao/appTarget";
import LoginPagina from "./paginas/login/LoginPagina";
import PapelNaoSuportadoPagina from "./paginas/nao-suportado/PapelNaoSuportadoPagina";
import DashboardGestorRedePagina from "./paginas/gestor-rede/DashboardGestorRedePagina";
import DashboardGerentePostoPagina from "./paginas/gerente-posto/DashboardGerentePostoPagina";
import DashboardFrentistaPagina from "./paginas/frentista/DashboardFrentistaPagina";
import DashboardSuperAdminPagina from "./paginas/super-admin/DashboardSuperAdminPagina";
import { carregarSessao, limparSessao, salvarSessao } from "./servicos/sessaoServico";
import { EVENTO_TOAST, toastErro } from "./servicos/toastServico";

const HOME_FRENTISTA = `${PREFIXO_FRENTISTA}/${MENUS_FRENTISTA[0].id}`;

export default function App() {
  const [sessao, setSessao] = useState(() => {
    const s = carregarSessao();
    if (isDesktop && s?.usuario?.papel && s.usuario.papel !== PAPEL_FRENTISTA) {
      limparSessao();
      return null;
    }
    return s;
  });
  const [mensagemSessaoExpirada, setMensagemSessaoExpirada] = useState("");
  const [toasts, setToasts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    function onSessaoExpirada(evento) {
      limparSessao();
      setSessao(null);
      setMensagemSessaoExpirada(
        evento?.detail?.mensagem || "Sua sessao expirou. Faca login novamente para continuar."
      );
      navigate("/login", { replace: true });
    }

    window.addEventListener("gaspass:sessao-expirada", onSessaoExpirada);
    return () => {
      window.removeEventListener("gaspass:sessao-expirada", onSessaoExpirada);
    };
  }, [navigate]);

  useEffect(() => {
    const timeouts = new Set();

    function onToast(evento) {
      const detalhe = evento?.detail || {};
      const mensagem = String(detalhe.mensagem || "").trim();
      if (!mensagem) {
        return;
      }

      const tipo = detalhe.tipo === "erro" ? "erro" : "sucesso";
      const id = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
      const duracaoMs = Number(detalhe.duracaoMs) > 0 ? Number(detalhe.duracaoMs) : 3200;

      setToasts((anteriores) => [...anteriores, { id, tipo, mensagem }]);

      const timeout = window.setTimeout(() => {
        setToasts((anteriores) => anteriores.filter((item) => item.id !== id));
        timeouts.delete(timeout);
      }, duracaoMs);
      timeouts.add(timeout);
    }

    window.addEventListener(EVENTO_TOAST, onToast);
    return () => {
      window.removeEventListener(EVENTO_TOAST, onToast);
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
      timeouts.clear();
    };
  }, []);

  // Desktop: MemoryRouter inicia em /frentista/...; sem sessão, manda para login.
  useEffect(() => {
    if (!isDesktop) return;
    if (!sessao) {
      navigate("/login", { replace: true });
    }
  }, [sessao, navigate]);

  function onSairPainel() {
    limparSessao();
    setSessao(null);
    navigate("/login", { replace: true });
  }

  function onLoginSucesso(novaSessao) {
    const papel = novaSessao?.usuario?.papel;
    if (isDesktop && papel !== PAPEL_FRENTISTA) {
      limparSessao();
      toastErro("GasPass PDV é exclusivo para frentistas. Use o painel web para outros perfis.");
      return;
    }
    salvarSessao(novaSessao);
    setSessao(novaSessao);
    navigate(isDesktop ? HOME_FRENTISTA : homePathPorPapel(papel), { replace: true });
  }

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            isDesktop ? (
              sessao ? (
                <Navigate to={HOME_FRENTISTA} replace />
              ) : (
                <Navigate to="/login" replace />
              )
            ) : (
              <HomeRedirect sessao={sessao} />
            )
          }
        />

        <Route
          path="/login"
          element={
            sessao ? (
              <Navigate
                to={isDesktop ? HOME_FRENTISTA : homePathPorPapel(sessao.usuario?.papel)}
                replace
              />
            ) : (
              <LoginPagina onLoginSucesso={onLoginSucesso} />
            )
          }
        />

        {!isDesktop ? (
          <>
            <Route element={<ProtectedRoute sessao={sessao} papeisPermitidos={[PAPEL_SUPER_ADMIN]} />}>
              <Route
                path="/admin/*"
                element={<DashboardSuperAdminPagina sessao={sessao} onSair={onSairPainel} />}
              />
            </Route>

            <Route element={<ProtectedRoute sessao={sessao} papeisPermitidos={[PAPEL_GESTOR_REDE]} />}>
              <Route
                path="/gestor/*"
                element={<DashboardGestorRedePagina sessao={sessao} onSair={onSairPainel} />}
              />
            </Route>

            <Route element={<ProtectedRoute sessao={sessao} papeisPermitidos={[PAPEL_GERENTE_POSTO]} />}>
              <Route
                path="/gerente/*"
                element={<DashboardGerentePostoPagina sessao={sessao} onSair={onSairPainel} />}
              />
            </Route>
          </>
        ) : null}

        <Route element={<ProtectedRoute sessao={sessao} papeisPermitidos={[PAPEL_FRENTISTA]} />}>
          <Route
            path="/frentista/*"
            element={<DashboardFrentistaPagina sessao={sessao} onSair={onSairPainel} />}
          />
        </Route>

        {!isDesktop ? (
          <Route
            path="/nao-suportado"
            element={
              sessao ? (
                <PapelNaoSuportadoPagina sessao={sessao} onSair={onSairPainel} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        ) : null}

        <Route
          path="*"
          element={
            isDesktop ? (
              sessao ? (
                <Navigate to={HOME_FRENTISTA} replace />
              ) : (
                <Navigate to="/login" replace />
              )
            ) : (
              <HomeRedirect sessao={sessao} />
            )
          }
        />
      </Routes>

      {mensagemSessaoExpirada ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3>Sessao expirada</h3>
            <p>{mensagemSessaoExpirada}</p>
            <button
              className="botao-primario"
              type="button"
              onClick={() => setMensagemSessaoExpirada("")}
            >
              Entendi
            </button>
          </div>
        </div>
      ) : null}
      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.tipo}`}>
            {toast.mensagem}
          </div>
        ))}
      </div>
    </>
  );
}

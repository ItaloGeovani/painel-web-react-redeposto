import { useEffect, useMemo, useState } from "react";
import { PAPEL_SUPER_ADMIN } from "./constantes/papeis";
import LoginPagina from "./paginas/login/LoginPagina";
import PapelNaoSuportadoPagina from "./paginas/nao-suportado/PapelNaoSuportadoPagina";
import DashboardSuperAdminPagina from "./paginas/super-admin/DashboardSuperAdminPagina";
import { carregarSessao, limparSessao, salvarSessao } from "./servicos/sessaoServico";
import { EVENTO_TOAST } from "./servicos/toastServico";

export default function App() {
  const [sessao, setSessao] = useState(() => carregarSessao());
  const [mensagemSessaoExpirada, setMensagemSessaoExpirada] = useState("");
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    function onSessaoExpirada(evento) {
      limparSessao();
      setSessao(null);
      setMensagemSessaoExpirada(
        evento?.detail?.mensagem || "Sua sessao expirou. Faca login novamente para continuar."
      );
    }

    window.addEventListener("gaspass:sessao-expirada", onSessaoExpirada);
    return () => {
      window.removeEventListener("gaspass:sessao-expirada", onSessaoExpirada);
    };
  }, []);

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

  const paginaAtual = useMemo(() => {
    if (!sessao) {
      return (
        <LoginPagina
          onLoginSucesso={(novaSessao) => {
            salvarSessao(novaSessao);
            setSessao(novaSessao);
          }}
        />
      );
    }

    if (sessao.usuario?.papel === PAPEL_SUPER_ADMIN) {
      return (
        <DashboardSuperAdminPagina
          sessao={sessao}
          onSair={() => {
            limparSessao();
            setSessao(null);
          }}
        />
      );
    }

    return (
      <PapelNaoSuportadoPagina
        sessao={sessao}
        onSair={() => {
          limparSessao();
          setSessao(null);
        }}
      />
    );
  }, [sessao]);

  return (
    <>
      {paginaAtual}
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

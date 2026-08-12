import { useEffect, useState } from "react";
import { Printer, RefreshCw, Settings } from "lucide-react";
import DesktopHeader from "../componentes/layout/DesktopHeader";
import AppUpdateModal from "../componentes/desktop/AppUpdateModal";
import { APP_VERSION } from "../configuracao/appVersion";
import { useAppUpdater } from "../hooks/useAppUpdater";
import { aplicarBrandingPdv } from "../utilitarios/redeBranding";

/**
 * Shell do GasPass PDV (Tauri): topbar + conteúdo + status bar.
 */
export default function DesktopLayout({
  usuario,
  postoNome,
  rede,
  itensMenu = [],
  onSair,
  onImprimir,
  children
}) {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [syncHora, setSyncHora] = useState(() =>
    new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" }).format(new Date())
  );
  const [modalUpdate, setModalUpdate] = useState(false);

  const updater = useAppUpdater({ autoCheck: true });

  useEffect(() => {
    function on() {
      setOnline(true);
      setSyncHora(new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" }).format(new Date()));
    }
    function off() {
      setOnline(false);
    }
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  useEffect(() => {
    if (!rede) return;
    aplicarBrandingPdv(rede);
  }, [rede]);

  useEffect(() => {
    if (updater.fase === "update_available") {
      setModalUpdate(true);
    }
  }, [updater.fase]);

  return (
    <div className="gp-pdv-layout">
      <DesktopHeader
        usuario={usuario}
        postoNome={postoNome}
        rede={rede}
        itensMenu={itensMenu}
        onSair={onSair}
      />
      <main className="gp-pdv-main">
        <div className="gp-pdv-shell">{children}</div>
      </main>
      <footer className="gp-pdv-footer">
        <div className="gp-pdv-footer__status">
          <span
            className={`gp-pdv-footer__dot ${online ? "gp-pdv-footer__dot--ok" : "gp-pdv-footer__dot--off"}`}
            aria-hidden
          />
          <strong>{online ? "Online" : "Sem conexão"}</strong>
          {online ? <span>Sincronizado às {syncHora}</span> : <span>Verifique a internet</span>}
        </div>
        <div className="gp-pdv-footer__versao">
          GasPass PDV {APP_VERSION}
          {updater.fase === "update_available" ? (
            <button
              type="button"
              className="gp-pdv-footer__update-pill"
              onClick={() => setModalUpdate(true)}
            >
              Nova versão
            </button>
          ) : null}
        </div>
        <div className="gp-pdv-footer__acoes">
          <button
            type="button"
            className="gp-pdv-footer__btn"
            onClick={() => {
              setModalUpdate(true);
              updater.check({ silent: false });
            }}
            title="Verificar atualizações"
          >
            <RefreshCw size={15} aria-hidden />
            Atualizar
          </button>
          <button
            type="button"
            className="gp-pdv-footer__btn"
            onClick={onImprimir}
            disabled={!onImprimir}
            title="Imprimir comprovante"
          >
            <Printer size={15} aria-hidden />
            Imprimir
          </button>
          <button type="button" className="gp-pdv-footer__btn gp-pdv-footer__btn--icon" disabled title="Configurações">
            <Settings size={15} aria-hidden />
          </button>
        </div>
      </footer>

      <AppUpdateModal
        open={modalUpdate}
        onClose={() => setModalUpdate(false)}
        fase={updater.fase}
        manifest={updater.manifest}
        erro={updater.erro}
        progresso={updater.progresso}
        onCheck={updater.check}
        onInstall={updater.installAndRelaunch}
      />
    </div>
  );
}

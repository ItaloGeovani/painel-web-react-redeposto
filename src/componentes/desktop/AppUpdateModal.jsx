import { createPortal } from "react-dom";
import { Download, RefreshCw, X } from "lucide-react";
import Button from "../ui/Button";
import { APP_VERSION } from "../../configuracao/appVersion";

/**
 * Modal de atualização do GasPass PDV.
 */
export default function AppUpdateModal({
  open,
  onClose,
  fase,
  manifest,
  erro,
  progresso,
  onCheck,
  onInstall,
  forcarExibir = false
}) {
  if (!open) return null;

  const disponivel = fase === "update_available" || forcarExibir;
  const baixando = fase === "downloading" || fase === "installing";
  const checking = fase === "checking";

  let corpo = null;
  if (checking) {
    corpo = <p>Verificando atualizações…</p>;
  } else if (fase === "uptodate" && !disponivel) {
    corpo = (
      <p>
        Você já está na versão mais recente (<strong>{APP_VERSION}</strong>).
      </p>
    );
  } else if (fase === "error") {
    corpo = (
      <p className="gp-update-modal__erro" role="alert">
        {erro || "Falha ao verificar atualizações."}
      </p>
    );
  } else if (manifest || disponivel) {
    corpo = (
      <>
        <p>
          Versão instalada: <strong>{APP_VERSION}</strong>
          <br />
          Nova versão: <strong>{manifest?.version || "—"}</strong>
        </p>
        {manifest?.notes ? <p className="gp-update-modal__notes">{manifest.notes}</p> : null}
        {baixando ? (
          <p>
            {fase === "installing" ? "Instalando e reiniciando…" : "Baixando atualização…"}
            {progresso?.contentLength
              ? ` (${Math.round(((progresso.chunkLength || 0) / progresso.contentLength) * 100)}%)`
              : ""}
          </p>
        ) : null}
      </>
    );
  } else {
    corpo = <p>Nenhuma informação de atualização.</p>;
  }

  return createPortal(
    <div
      className="gp-modal-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !baixando) onClose?.();
      }}
    >
      <div className="gp-modal gp-modal--sm" role="dialog" aria-modal="true" aria-labelledby="gp-update-titulo">
        <header className="gp-modal__header">
          <div className="gp-modal__titulos">
            <h2 id="gp-update-titulo" className="gp-modal__title">
              Atualizações
            </h2>
            <p className="gp-modal__desc">GasPass PDV</p>
          </div>
          <button
            type="button"
            className="gp-modal__fechar"
            onClick={onClose}
            disabled={baixando}
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </header>
        <div className="gp-modal__body gp-update-modal__body">{corpo}</div>
        <footer className="gp-modal__footer">
          <div className="gp-modal__acoes">
            <Button type="button" variant="outline" onClick={onClose} disabled={baixando}>
              Fechar
            </Button>
            {fase === "update_available" ? (
              <Button type="button" icon={Download} onClick={onInstall} disabled={baixando}>
                {baixando ? "Aguarde…" : "Instalar e reiniciar"}
              </Button>
            ) : (
              <Button type="button" icon={RefreshCw} onClick={() => onCheck?.({ silent: false })} disabled={checking || baixando}>
                Verificar
              </Button>
            )}
          </div>
        </footer>
      </div>
    </div>,
    document.body
  );
}

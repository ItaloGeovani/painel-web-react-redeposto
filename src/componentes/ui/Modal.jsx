import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import Button from "./Button";

/**
 * Modal reutilizavel do painel.
 *
 * @param {boolean} open
 * @param {() => void} onClose
 * @param {string} title
 * @param {string} [description]
 * @param {React.ReactNode} children
 * @param {React.ReactNode} [footer]
 * @param {'sm'|'md'|'lg'} [size]
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  closeOnOverlay = true
}) {
  const tituloId = useId();
  const painelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;

    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e) {
      if (e.key === "Escape") onCloseRef.current?.();
    }
    window.addEventListener("keydown", onKey);

    // Foca o primeiro campo do corpo (nunca o botao Fechar do header).
    const primeiro = painelRef.current?.querySelector(
      ".gp-modal__body input:not([disabled]):not([type='hidden']), .gp-modal__body select:not([disabled]), .gp-modal__body textarea:not([disabled])"
    );
    let timer;
    if (primeiro instanceof HTMLElement) {
      timer = window.setTimeout(() => primeiro.focus(), 0);
    }

    return () => {
      document.body.style.overflow = anterior;
      window.removeEventListener("keydown", onKey);
      if (timer != null) window.clearTimeout(timer);
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="gp-modal-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (closeOnOverlay && e.target === e.currentTarget) onCloseRef.current?.();
      }}
    >
      <div
        ref={painelRef}
        className={`gp-modal gp-modal--${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
      >
        <header className="gp-modal__header">
          <div className="gp-modal__titulos">
            <h2 id={tituloId} className="gp-modal__title">
              {title}
            </h2>
            {description ? <p className="gp-modal__desc">{description}</p> : null}
          </div>
          <button
            type="button"
            className="gp-modal__fechar"
            onClick={() => onCloseRef.current?.()}
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </header>

        <div className="gp-modal__body">{children}</div>

        {footer ? <footer className="gp-modal__footer">{footer}</footer> : null}
      </div>
    </div>,
    document.body
  );
}

export function ModalActions({ children, className = "" }) {
  return <div className={`gp-modal__acoes ${className}`.trim()}>{children}</div>;
}

export { Button as ModalButton };

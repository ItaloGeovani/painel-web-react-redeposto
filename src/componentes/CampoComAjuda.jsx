import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Tooltip de campo: balão via portal (fixed) para não ser cortado por overflow de modal/tabela.
 */
export function TooltipInfo({ texto }) {
  const t = (texto ?? "").trim();
  const tipId = useId();
  const triggerRef = useRef(null);
  const balaoRef = useRef(null);
  const [aberto, setAberto] = useState(false);
  const [pos, setPos] = useState(null);

  function calcularPosicao() {
    const trigger = triggerRef.current;
    const balao = balaoRef.current;
    if (!trigger || !balao) return;

    const r = trigger.getBoundingClientRect();
    const tip = balao.getBoundingClientRect();
    const margin = 8;
    const gap = 10;

    let left = r.left + r.width / 2 - tip.width / 2;
    left = Math.max(margin, Math.min(left, window.innerWidth - tip.width - margin));

    let top = r.top - tip.height - gap;
    let placement = "top";
    if (top < margin) {
      top = r.bottom + gap;
      placement = "bottom";
    }
    if (top + tip.height > window.innerHeight - margin && placement === "bottom") {
      top = Math.max(margin, r.top - tip.height - gap);
      placement = "top";
    }

    const arrowLeft = Math.max(12, Math.min(r.left + r.width / 2 - left, tip.width - 12));
    setPos({ left, top, placement, arrowLeft });
  }

  useLayoutEffect(() => {
    if (!aberto) {
      setPos(null);
      return undefined;
    }
    calcularPosicao();
    return undefined;
  }, [aberto, t]);

  useEffect(() => {
    if (!aberto) return undefined;

    function onReposition() {
      calcularPosicao();
    }
    function onKey(e) {
      if (e.key === "Escape") setAberto(false);
    }

    window.addEventListener("scroll", onReposition, true);
    window.addEventListener("resize", onReposition);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onReposition, true);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("keydown", onKey);
    };
  }, [aberto]);

  if (!t) return null;

  return (
    <>
      <span
        ref={triggerRef}
        className="tooltip-info"
        tabIndex={0}
        role="note"
        aria-label={t}
        aria-describedby={aberto ? tipId : undefined}
        onMouseEnter={() => setAberto(true)}
        onMouseLeave={() => setAberto(false)}
        onFocus={() => setAberto(true)}
        onBlur={() => setAberto(false)}
      >
        i
      </span>
      {aberto
        ? createPortal(
            <span
              ref={balaoRef}
              id={tipId}
              role="tooltip"
              className={`tooltip-info__balao${pos?.placement === "bottom" ? " tooltip-info__balao--bottom" : ""}${pos ? " tooltip-info__balao--visivel" : ""}`}
              style={
                pos
                  ? {
                      left: pos.left,
                      top: pos.top,
                      ["--tooltip-arrow-left"]: `${pos.arrowLeft}px`
                    }
                  : { left: -9999, top: -9999, visibility: "hidden" }
              }
            >
              {t}
            </span>,
            document.body
          )
        : null}
    </>
  );
}

/**
 * Título auxiliar de seção/campo com tooltip opcional.
 * Útil em blocos que não usam o wrapper completo de campo.
 */
export function CampoSecaoTitulo({ rotulo, dica, id }) {
  return (
    <span className="form-rede__titulo-aux campo-com-ajuda__titulo" id={id}>
      {rotulo}
      {dica ? <TooltipInfo texto={dica} /> : null}
    </span>
  );
}

/**
 * Texto curto de apoio para formulários da área de rede.
 */
export function CampoHint({ children }) {
  return <p className="rede-detalhes__ajuda rede-detalhes__ajuda--form">{children}</p>;
}

/**
 * Wrapper padrão de campo com rótulo e tooltip explicativo.
 *
 * Props:
 * - rotulo: texto do título do campo.
 * - dica: texto do tooltip (opcional).
 * - span2: quando true, ocupa toda a linha do grid.
 */
export default function CampoComAjuda({ rotulo, dica, children, span2 = false }) {
  return (
    <div className={`${span2 ? "form-rede__input-span2 " : ""}campo-com-ajuda`}>
      <CampoSecaoTitulo rotulo={rotulo} dica={dica} />
      {children}
    </div>
  );
}

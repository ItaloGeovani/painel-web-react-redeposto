import { useEffect, useRef, useState } from "react";
import { ListFilter } from "lucide-react";
import Button from "./Button";

/**
 * Popover simples de filtros.
 * children: conteúdo do painel; onApply / onClear callbacks.
 */
export default function FilterPopover({ children, onApply, onClear, label = "Filtros", activeCount = 0 }) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!aberto) return undefined;
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setAberto(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [aberto]);

  return (
    <div className="gp-filter" ref={ref}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        icon={ListFilter}
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
      >
        {label}
        {activeCount > 0 ? <span className="gp-filter__count">{activeCount}</span> : null}
      </Button>
      {aberto ? (
        <div className="gp-filter__panel" role="dialog" aria-label={label}>
          <div className="gp-filter__body">{children}</div>
          <div className="gp-filter__acoes">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onClear?.();
              }}
            >
              Limpar
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                onApply?.();
                setAberto(false);
              }}
            >
              Aplicar filtros
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

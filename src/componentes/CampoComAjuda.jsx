/**
 * Tooltip de campo: balão escuro via CSS (data-tooltip + ::after).
 * O atributo title nativo não estiliza e costuma atrasar ou sumir sob overflow.
 */
export function TooltipInfo({ texto }) {
  const t = (texto ?? "").trim();
  if (!t) return null;
  return (
    <span
      className="tooltip-info"
      data-tooltip={t}
      tabIndex={0}
      role="note"
      aria-label={t}
    >
      i
    </span>
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

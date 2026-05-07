/**
 * Tooltip visual simples para explicar campos de formulário.
 * Usa title nativo para manter leve e sem dependências extras.
 */
export function TooltipInfo({ texto }) {
  return (
    <span className="tooltip-info" title={texto} aria-label={texto}>
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

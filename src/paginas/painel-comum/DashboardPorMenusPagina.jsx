import { useMemo, useState } from "react";
import PainelLayout from "../../componentes/layout/PainelLayout";

/**
 * Painel generico: lista de menus vinda de constantes/menusPorPapel.js.
 * Cada secao mostra placeholder ate a implementacao especifica.
 */
export default function DashboardPorMenusPagina({ menus, sessao, onSair }) {
  const itensMenu = useMemo(() => menus.map((item) => item.nome), [menus]);
  const [menuAtivo, setMenuAtivo] = useState(() => menus[0]?.nome ?? "");

  const menuConfig = useMemo(
    () => menus.find((item) => item.nome === menuAtivo) || menus[0],
    [menus, menuAtivo]
  );

  if (!menus.length) {
    return null;
  }

  return (
    <PainelLayout
      titulo={menuConfig.titulo}
      subtitulo={menuConfig.subtitulo}
      usuario={sessao?.usuario}
      itensMenu={itensMenu}
      itemMenuAtivo={menuAtivo}
      onSelecionarMenu={setMenuAtivo}
      onSair={onSair}
    >
      <article className="card-resumo">
        <h3>{menuConfig.titulo}</h3>
        <strong>Em desenvolvimento</strong>
        <p>
          Secao prevista no escopo do painel. A implementacao com dados reais sera
          adicionada nas proximas entregas.
        </p>
      </article>
    </PainelLayout>
  );
}

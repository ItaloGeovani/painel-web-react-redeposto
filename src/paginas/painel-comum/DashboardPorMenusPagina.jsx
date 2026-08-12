import { useMemo } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import PainelLayout from "../../componentes/layout/PainelLayout";
import { menuPorId, menusComPath } from "../../constantes/rotas";

/**
 * Painel generico: lista de menus vinda de constantes/menusPorPapel.js.
 * Cada secao mostra placeholder ate a implementacao especifica.
 */
export default function DashboardPorMenusPagina({ menus, sessao, onSair, prefixo = "/painel" }) {
  const itensMenu = useMemo(() => menusComPath(menus, prefixo), [menus, prefixo]);

  if (!menus.length) {
    return null;
  }

  return (
    <Routes>
      <Route index element={<Navigate to={menus[0].id} replace />} />
      <Route
        path=":secao"
        element={<PlaceholderShell menus={menus} sessao={sessao} onSair={onSair} itensMenu={itensMenu} />}
      />
      <Route path="*" element={<Navigate to={menus[0].id} replace />} />
    </Routes>
  );
}

function PlaceholderShell({ menus, sessao, onSair, itensMenu }) {
  const { secao } = useParams();
  const menuConfig = menuPorId(menus, secao);

  return (
    <PainelLayout
      titulo={menuConfig.titulo}
      subtitulo={menuConfig.subtitulo}
      usuario={sessao?.usuario}
      itensMenu={itensMenu}
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

import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import PainelLayout from "../../componentes/layout/PainelLayout";
import {
  MENUS_SUPER_ADMIN,
  PREFIXO_ADMIN,
  menuPorId,
  menusComPath
} from "../../constantes/rotas";
import { obterResumoDashboardAdmin } from "../../servicos/dashboardServico";
import { toastErro } from "../../servicos/toastServico";
import RedesGestaoSecao from "./RedesGestaoSecao";
import SuperAdminAuditoriaSecao from "./SuperAdminAuditoriaSecao";
import SuperAdminConfiguracaoSecao from "./SuperAdminConfiguracaoSecao";
import SuperAdminDownloadsSecao from "./SuperAdminDownloadsSecao";
import SuperAdminRelatoriosSecao from "./SuperAdminRelatoriosSecao";

function SuperAdminVisaoGeral() {
  const [resumo, setResumo] = useState(null);
  const [carregandoResumo, setCarregandoResumo] = useState(true);

  useEffect(() => {
    async function carregarResumo() {
      setCarregandoResumo(true);
      try {
        const dados = await obterResumoDashboardAdmin();
        setResumo(dados);
      } catch (err) {
        toastErro(err.message || "Falha ao carregar estatisticas do dashboard.");
      } finally {
        setCarregandoResumo(false);
      }
    }

    carregarResumo();
  }, []);

  const valorMensal = Number(resumo?.receita_mensal_prevista || 0);
  const valorImplantacao = Number(resumo?.receita_implantacao_prevista || 0);

  return (
    <div className="grid-resumo">
      <article className="card-resumo">
        <h3>Redes ativas</h3>
        <strong>{carregandoResumo ? "..." : String(resumo?.redes_ativas || 0)}</strong>
        <p>Total de redes em operacao ativa.</p>
      </article>

      <article className="card-resumo">
        <h3>Gestores cadastrados</h3>
        <strong>{carregandoResumo ? "..." : String(resumo?.total_gestores || 0)}</strong>
        <p>Usuarios gestores vinculados as redes.</p>
      </article>

      <article className="card-resumo">
        <h3>Receita mensal prevista</h3>
        <strong>{carregandoResumo ? "..." : formatarMoeda(valorMensal)}</strong>
        <p>Soma das mensalidades de redes ativas.</p>
      </article>

      <article className="card-resumo">
        <h3>Redes inativas</h3>
        <strong>{carregandoResumo ? "..." : String(resumo?.redes_inativas || 0)}</strong>
        <p>Redes aguardando ativacao ou pausadas.</p>
      </article>

      <article className="card-resumo">
        <h3>Gestores ativos</h3>
        <strong>{carregandoResumo ? "..." : String(resumo?.gestores_ativos || 0)}</strong>
        <p>Gestores atualmente liberados para acesso.</p>
      </article>

      <article className="card-resumo">
        <h3>Receita de implantacao prevista</h3>
        <strong>{carregandoResumo ? "..." : formatarMoeda(valorImplantacao)}</strong>
        <p>Soma das implantacoes acordadas nas redes.</p>
      </article>
    </div>
  );
}

function AdminShell({ sessao, onSair, itensMenu, menuId }) {
  const menuConfig = menuPorId(MENUS_SUPER_ADMIN, menuId);

  return (
    <PainelLayout
      titulo={menuConfig.titulo}
      subtitulo={menuConfig.subtitulo}
      usuario={sessao?.usuario}
      itensMenu={itensMenu}
      onSair={onSair}
    >
      <AdminSecaoConteudo menuId={menuId} />
    </PainelLayout>
  );
}

function AdminSecaoPorParam({ sessao, onSair, itensMenu }) {
  const { secao } = useParams();
  const idsValidos = MENUS_SUPER_ADMIN.map((m) => m.id);
  if (!idsValidos.includes(secao)) {
    return <Navigate to={`${PREFIXO_ADMIN}/visao-geral`} replace />;
  }
  return <AdminShell sessao={sessao} onSair={onSair} itensMenu={itensMenu} menuId={secao} />;
}

function AdminSecaoConteudo({ menuId }) {
  if (menuId === "visao-geral") {
    return <SuperAdminVisaoGeral />;
  }
  if (menuId === "redes") {
    return <RedesGestaoSecao />;
  }
  if (menuId === "relatorios") {
    return <SuperAdminRelatoriosSecao />;
  }
  if (menuId === "auditoria") {
    return <SuperAdminAuditoriaSecao />;
  }
  if (menuId === "configuracoes") {
    return <SuperAdminConfiguracaoSecao />;
  }
  if (menuId === "downloads") {
    return <SuperAdminDownloadsSecao />;
  }
  return <Navigate to={`${PREFIXO_ADMIN}/visao-geral`} replace />;
}

export default function DashboardSuperAdminPagina({ sessao, onSair }) {
  const itensMenu = useMemo(
    () =>
      menusComPath(MENUS_SUPER_ADMIN, PREFIXO_ADMIN).map((item) => ({
        id: item.id,
        nome: item.nome,
        path: item.path,
        end: item.id !== "redes"
      })),
    []
  );

  return (
    <Routes>
      <Route index element={<Navigate to="visao-geral" replace />} />
      <Route
        path="redes/:redeId"
        element={
          <AdminShell sessao={sessao} onSair={onSair} itensMenu={itensMenu} menuId="redes" />
        }
      />
      <Route
        path="redes/:redeId/:aba"
        element={
          <AdminShell sessao={sessao} onSair={onSair} itensMenu={itensMenu} menuId="redes" />
        }
      />
      <Route
        path=":secao"
        element={<AdminSecaoPorParam sessao={sessao} onSair={onSair} itensMenu={itensMenu} />}
      />
      <Route path="*" element={<Navigate to="visao-geral" replace />} />
    </Routes>
  );
}

function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(valor || 0));
}

import { useEffect, useMemo, useState } from "react";
import PainelLayout from "../../componentes/layout/PainelLayout";
import { obterResumoDashboardAdmin } from "../../servicos/dashboardServico";
import { toastErro } from "../../servicos/toastServico";
import RedesGestaoSecao from "./RedesGestaoSecao";
import SuperAdminAuditoriaSecao from "./SuperAdminAuditoriaSecao";
import SuperAdminConfiguracaoSecao from "./SuperAdminConfiguracaoSecao";
import SuperAdminRelatoriosSecao from "./SuperAdminRelatoriosSecao";

const MENUS_SUPER_ADMIN = [
  { id: "visao-geral", nome: "Visao Geral", titulo: "Dashboard do Administrador Global", subtitulo: "Visao consolidada da plataforma para decisoes rapidas." },
  {
    id: "redes",
    nome: "Redes",
    titulo: "Gestao de Redes",
    subtitulo:
      "Use Gerenciar para o painel da rede: postos, equipe por posto, gestor, clientes, campanhas, carteira, premios e vouchers."
  },
  { id: "relatorios", nome: "Relatorios", titulo: "Relatorios", subtitulo: "Relatorios gerenciais, operacionais e financeiros da plataforma." },
  { id: "auditoria", nome: "Auditoria", titulo: "Auditoria e Logs", subtitulo: "Trilha de auditoria de eventos criticos e acoes administrativas." },
  { id: "configuracoes", nome: "Configuracoes do Sistema", titulo: "Configuracoes do Sistema", subtitulo: "Parametros globais, identidade visual e integracoes." }
];

export default function DashboardSuperAdminPagina({ sessao, onSair }) {
  // Padrao do painel: o titulo/subtitulo de cada area deve ficar apenas no cabecalho global (PainelLayout).
  const itensMenu = MENUS_SUPER_ADMIN.map((item) => item.nome);
  const [menuAtivo, setMenuAtivo] = useState("Visao Geral");
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

  const menuConfig = useMemo(
    () => MENUS_SUPER_ADMIN.find((item) => item.nome === menuAtivo) || MENUS_SUPER_ADMIN[0],
    [menuAtivo]
  );

  const idMenuAtivo = menuConfig.id;

  const tituloSecao = useMemo(() => {
    return menuConfig.titulo;
  }, [menuConfig]);

  const subtituloSecao = useMemo(() => {
    return menuConfig.subtitulo;
  }, [menuConfig]);

  const conteudoSecao = useMemo(() => {
    if (idMenuAtivo === "redes") {
      return <RedesGestaoSecao />;
    }
    if (idMenuAtivo === "relatorios") {
      return <SuperAdminRelatoriosSecao />;
    }
    if (idMenuAtivo === "auditoria") {
      return <SuperAdminAuditoriaSecao />;
    }
    if (idMenuAtivo === "configuracoes") {
      return <SuperAdminConfiguracaoSecao />;
    }
    if (idMenuAtivo === "visao-geral") {
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

    return (
      <article className="card-resumo">
        <h3>{menuConfig.titulo}</h3>
        <strong>Secao nao encontrada</strong>
        <p>Menu desconhecido.</p>
      </article>
    );
  }, [idMenuAtivo, menuConfig.titulo, resumo, carregandoResumo]);

  return (
    <PainelLayout
      titulo={tituloSecao}
      subtitulo={subtituloSecao}
      usuario={sessao?.usuario}
      itensMenu={itensMenu}
      itemMenuAtivo={menuAtivo}
      onSelecionarMenu={setMenuAtivo}
      onSair={onSair}
    >
      {conteudoSecao}
    </PainelLayout>
  );
}

function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(valor || 0));
}

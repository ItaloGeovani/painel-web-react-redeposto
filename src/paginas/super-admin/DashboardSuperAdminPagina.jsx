import { useEffect, useMemo, useState } from "react";
import PainelLayout from "../../componentes/layout/PainelLayout";
import { obterResumoDashboardAdmin } from "../../servicos/dashboardServico";
import { toastErro } from "../../servicos/toastServico";
import GestoresRedeGestaoSecao from "./GestoresRedeGestaoSecao";
import RedesGestaoSecao from "./RedesGestaoSecao";

const MENUS_SUPER_ADMIN = [
  { id: "visao-geral", nome: "Visao Geral", titulo: "Dashboard do Administrador Global", subtitulo: "Visao consolidada da plataforma para decisoes rapidas." },
  { id: "redes", nome: "Redes", titulo: "Gestao de Redes", subtitulo: "Crie, edite, ative e desative redes da plataforma." },
  { id: "gestores-rede", nome: "Gestores de Rede", titulo: "Gestao de Gestores", subtitulo: "Crie o usuario gestor para acesso e administracao da rede." },
  { id: "usuarios-perfis", nome: "Usuarios e Perfis", titulo: "Usuarios e Perfis", subtitulo: "Controle de acessos, papeis e status de usuarios da plataforma." },
  { id: "postos", nome: "Postos", titulo: "Postos e Unidades", subtitulo: "Cadastro e manutencao de postos vinculados as redes." },
  { id: "campanhas", nome: "Campanhas", titulo: "Campanhas e Promocoes", subtitulo: "Gestao de regras promocionais, vigencias e desempenho." },
  { id: "carteira", nome: "Carteira e Financeiro", titulo: "Carteira e Financeiro", subtitulo: "Acompanhamento de saldos, movimentacoes e conciliacao." },
  { id: "vouchers", nome: "Vouchers", titulo: "Vouchers", subtitulo: "Emissao, validacao e acompanhamento de vouchers da plataforma." },
  { id: "planos", nome: "Planos e Cobranca", titulo: "Planos e Cobranca", subtitulo: "Planos comerciais, mensalidades e situacao de cobranca." },
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

  const tituloSecao = useMemo(() => {
    return menuConfig.titulo;
  }, [menuConfig]);

  const subtituloSecao = useMemo(() => {
    return menuConfig.subtitulo;
  }, [menuConfig]);

  const conteudoSecao = useMemo(() => {
    if (menuAtivo === "Redes") {
      return <RedesGestaoSecao />;
    }
    if (menuAtivo === "Gestores de Rede") {
      return <GestoresRedeGestaoSecao />;
    }
    if (menuAtivo === "Visao Geral") {
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
        <strong>Em desenvolvimento</strong>
        <p>Menu criado no lateral para nao esquecermos. Implementacao desta secao sera feita nos proximos passos.</p>
      </article>
    );
  }, [menuAtivo, menuConfig, resumo, carregandoResumo]);

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

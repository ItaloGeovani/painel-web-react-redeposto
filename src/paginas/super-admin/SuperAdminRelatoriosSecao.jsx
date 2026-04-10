import { useEffect, useState } from "react";
import { obterResumoRelatoriosPlataforma } from "../../servicos/adminPlataformaServico";
import { toastErro } from "../../servicos/toastServico";

function formatarMoedaBR(valor) {
  const n = Number(valor);
  if (Number.isNaN(n)) {
    return "—";
  }
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function SuperAdminRelatoriosSecao() {
  const [resumo, setResumo] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      setCarregando(true);
      try {
        const r = await obterResumoRelatoriosPlataforma();
        if (!cancelado) {
          setResumo(r);
        }
      } catch (err) {
        if (!cancelado) {
          toastErro(err.message || "Falha ao carregar relatorios.");
          setResumo(null);
        }
      } finally {
        if (!cancelado) {
          setCarregando(false);
        }
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  if (carregando) {
    return (
      <article className="card-resumo">
        <p>Carregando indicadores da plataforma...</p>
      </article>
    );
  }

  if (!resumo) {
    return (
      <article className="card-resumo">
        <strong>Nao foi possivel carregar os dados</strong>
        <p>Tente novamente em instantes.</p>
      </article>
    );
  }

  return (
    <div className="gestor-relatorios">
      <p className="rede-detalhes__ajuda" style={{ marginBottom: 16 }}>
        Visao consolidada de <strong>todas as redes</strong> e totais operacionais (postos, campanhas, usuarios e premios).
      </p>

      <h3 className="rede-detalhes__titulo-secao" style={{ marginBottom: 12, fontSize: "1rem" }}>
        Financeiro e redes
      </h3>
      <div className="grid-resumo">
        <article className="card-resumo">
          <h3>Redes ativas</h3>
          <strong className="tabela-num">{resumo.redes_ativas ?? 0}</strong>
          <p>De {resumo.total_redes ?? 0} redes cadastradas.</p>
        </article>
        <article className="card-resumo">
          <h3>Redes inativas</h3>
          <strong className="tabela-num">{resumo.redes_inativas ?? 0}</strong>
          <p>Pausadas ou aguardando ativacao.</p>
        </article>
        <article className="card-resumo">
          <h3>Receita mensal prevista</h3>
          <strong>{formatarMoedaBR(resumo.receita_mensal_prevista)}</strong>
          <p>Soma das mensalidades das redes ativas.</p>
        </article>
        <article className="card-resumo">
          <h3>Implantacao (prevista)</h3>
          <strong>{formatarMoedaBR(resumo.receita_implantacao_prevista)}</strong>
          <p>Soma dos valores de implantacao cadastrados nas redes.</p>
        </article>
        <article className="card-resumo">
          <h3>Gestores (contas)</h3>
          <strong className="tabela-num">{resumo.total_gestores ?? 0}</strong>
          <p>
            Ativos {resumo.gestores_ativos ?? 0} · Inativos {resumo.gestores_inativos ?? 0}
          </p>
        </article>
      </div>

      <h3 className="rede-detalhes__titulo-secao" style={{ margin: "24px 0 12px", fontSize: "1rem" }}>
        Operacao
      </h3>
      <div className="grid-resumo">
        <article className="card-resumo">
          <h3>Postos</h3>
          <strong className="tabela-num">{resumo.total_postos ?? 0}</strong>
          <p>Unidades em todas as redes.</p>
        </article>
        <article className="card-resumo">
          <h3>Campanhas</h3>
          <strong className="tabela-num">{resumo.total_campanhas ?? 0}</strong>
          <p>
            Ativas {resumo.campanhas_ativas ?? 0} · Rascunho {resumo.campanhas_rascunho ?? 0} · Pausadas{" "}
            {resumo.campanhas_pausadas ?? 0} · Arquivadas {resumo.campanhas_arquivadas ?? 0}
          </p>
        </article>
        <article className="card-resumo">
          <h3>Premios</h3>
          <strong className="tabela-num">{resumo.total_premios ?? 0}</strong>
          <p>Catalogo: {resumo.premios_ativos ?? 0} ativos.</p>
        </article>
        <article className="card-resumo">
          <h3>Usuarios</h3>
          <strong className="tabela-num">{resumo.usuarios_total ?? 0}</strong>
          <p>
            Clientes {resumo.usuarios_clientes ?? 0} · Equipe de postos {resumo.usuarios_equipe_postos ?? 0}
          </p>
        </article>
        <article className="card-resumo">
          <h3>Logs de auditoria</h3>
          <strong className="tabela-num">{resumo.total_logs_auditoria ?? 0}</strong>
          <p>Registros acumulados na base (todas as redes).</p>
        </article>
      </div>
    </div>
  );
}

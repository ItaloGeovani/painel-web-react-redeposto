import { useEffect, useState } from "react";
import { obterResumoRelatoriosGestor } from "../../servicos/gestorRedeRelatoriosAuditoriaServico";
import { toastErro } from "../../servicos/toastServico";

function formatarMoedaBR(valor) {
  const n = Number(valor);
  if (Number.isNaN(n)) {
    return "—";
  }
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function GestorRedeRelatoriosSecao() {
  const [resumo, setResumo] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      setCarregando(true);
      try {
        const r = await obterResumoRelatoriosGestor();
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
        <p>Carregando indicadores da rede...</p>
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

  const rede = resumo.rede || {};
  const camp = resumo.campanhas || {};
  const prem = resumo.premios || {};
  const usu = resumo.usuarios || {};

  return (
    <div className="gestor-relatorios">
      <p className="rede-detalhes__ajuda" style={{ marginBottom: 16 }}>
        Visao consolidada da sua rede: <strong>{rede.nome_fantasia || "—"}</strong>
        {rede.moeda_virtual_nome ? (
          <>
            {" "}
            — moeda virtual: <strong>{rede.moeda_virtual_nome}</strong> (cotacao {formatarMoedaBR(rede.moeda_virtual_cotacao)})
          </>
        ) : null}
      </p>

      <div className="grid-resumo">
        <article className="card-resumo">
          <h3>Postos</h3>
          <strong className="tabela-num">{resumo.postos ?? 0}</strong>
          <p>Unidades cadastradas na rede.</p>
        </article>

        <article className="card-resumo">
          <h3>Campanhas (total)</h3>
          <strong className="tabela-num">{camp.total ?? 0}</strong>
          <p>
            Ativas {camp.ativas ?? 0} · Rascunho {camp.rascunho ?? 0} · Pausadas {camp.pausadas ?? 0} · Arquivadas{" "}
            {camp.arquivadas ?? 0}
          </p>
        </article>

        <article className="card-resumo">
          <h3>Premios</h3>
          <strong className="tabela-num">{prem.total ?? 0}</strong>
          <p>Catalogo: {prem.ativos ?? 0} ativos no momento.</p>
        </article>

        <article className="card-resumo">
          <h3>Usuarios na rede</h3>
          <strong className="tabela-num">{usu.total ?? 0}</strong>
          <p>
            Clientes {usu.clientes ?? 0} · Equipe de postos {usu.equipe_postos ?? 0} · Gestores {usu.gestores_rede ?? 0}
          </p>
        </article>
      </div>
    </div>
  );
}

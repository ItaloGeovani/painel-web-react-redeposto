import { useCallback, useEffect, useState } from "react";
import { listarAuditoriaGestor } from "../../servicos/gestorRedeRelatoriosAuditoriaServico";
import { toastErro } from "../../servicos/toastServico";

const LIMITE = 50;

function formatarDataHora(iso) {
  if (!iso) {
    return "—";
  }
  try {
    return new Date(iso).toLocaleString("pt-BR");
  } catch {
    return String(iso);
  }
}

function resumirJson(val) {
  if (val == null || val === "") {
    return "—";
  }
  let s;
  if (typeof val === "string") {
    s = val;
  } else {
    try {
      s = JSON.stringify(val);
    } catch {
      return "—";
    }
  }
  if (s.length > 160) {
    return `${s.slice(0, 160)}…`;
  }
  return s;
}

export default function GestorRedeAuditoriaSecao() {
  const [itens, setItens] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async (novoOffset) => {
    setCarregando(true);
    try {
      const dados = await listarAuditoriaGestor({ limite: LIMITE, offset: novoOffset });
      setItens(dados.itens);
      setTotal(dados.total);
      setOffset(dados.offset);
    } catch (err) {
      toastErro(err.message || "Falha ao carregar auditoria.");
      setItens([]);
      setTotal(0);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar(0);
  }, [carregar]);

  const podeAnterior = offset > 0;
  const podeProximo = offset + itens.length < total;

  return (
    <div className="gestor-auditoria">
      <p className="rede-detalhes__ajuda" style={{ marginBottom: 16 }}>
        Registros de auditoria vinculados a esta rede (alteracoes e eventos registrados pelo sistema). Se a lista estiver
        vazia, ainda nao ha entradas gravadas para a rede.
      </p>

      {carregando ? (
        <article className="card-resumo">
          <p>Carregando eventos...</p>
        </article>
      ) : (
        <>
          <div style={{ marginBottom: 12, fontSize: 13, color: "#64748b" }}>
            Total de registros: <strong className="tabela-num">{total}</strong>
            {total > 0 ? (
              <>
                {" "}
                — exibindo {offset + 1}–{offset + itens.length}
              </>
            ) : null}
          </div>

          {itens.length === 0 ? (
            <article className="card-resumo">
              <strong>Nenhum evento de auditoria</strong>
              <p>Quando o sistema registrar acoes na sua rede, elas aparecerao aqui.</p>
            </article>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="tabela-redes" style={{ minWidth: 720 }}>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Evento</th>
                    <th>Entidade</th>
                    <th>Ator</th>
                    <th>Detalhes</th>
                  </tr>
                </thead>
                <tbody>
                  {itens.map((row) => (
                    <tr key={row.id}>
                      <td className="tabela-num" style={{ whiteSpace: "nowrap" }}>
                        {formatarDataHora(row.criado_em)}
                      </td>
                      <td>
                        <strong className="tabela-celula__principal">{row.tipo_evento || "—"}</strong>
                      </td>
                      <td>
                        <span className="tabela-celula__principal">{row.tipo_entidade || "—"}</span>
                        {row.id_entidade ? (
                          <span className="tabela-redes__sub" style={{ display: "block" }}>
                            ID {row.id_entidade}
                          </span>
                        ) : null}
                      </td>
                      <td className="tabela-redes__sub">{row.id_usuario_ator || "—"}</td>
                      <td>
                        <span className="tabela-redes__sub" title={resumirJson(row.dados_novos)}>
                          Novo: {resumirJson(row.dados_novos)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {total > LIMITE ? (
            <div className="tabela-redes__acoes" style={{ marginTop: 16 }}>
              <button
                type="button"
                className="tabela-btn tabela-btn--outline"
                disabled={!podeAnterior}
                onClick={() => carregar(Math.max(0, offset - LIMITE))}
              >
                Anterior
              </button>
              <button
                type="button"
                className="tabela-btn tabela-btn--outline"
                disabled={!podeProximo}
                onClick={() => carregar(offset + LIMITE)}
              >
                Proxima
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

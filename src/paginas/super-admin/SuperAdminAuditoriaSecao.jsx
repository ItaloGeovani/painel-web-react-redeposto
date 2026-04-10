import { useCallback, useEffect, useState } from "react";
import { listarAuditoriaPlataforma } from "../../servicos/adminPlataformaServico";
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

export default function SuperAdminAuditoriaSecao() {
  const [itens, setItens] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [filtroDraft, setFiltroDraft] = useState("");
  const [filtroRede, setFiltroRede] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setFiltroRede(filtroDraft.trim()), 400);
    return () => clearTimeout(t);
  }, [filtroDraft]);

  const carregar = useCallback(
    async (novoOffset, idRedeFiltro) => {
      setCarregando(true);
      try {
        const dados = await listarAuditoriaPlataforma({
          limite: LIMITE,
          offset: novoOffset,
          idRede: idRedeFiltro
        });
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
    },
    []
  );

  useEffect(() => {
    carregar(0, filtroRede.trim());
  }, [carregar, filtroRede]);

  const podeAnterior = offset > 0;
  const podeProximo = offset + itens.length < total;

  return (
    <div className="gestor-auditoria">
      <p className="rede-detalhes__ajuda" style={{ marginBottom: 16 }}>
        Trilha de auditoria em <strong>todas as redes</strong>. Opcional: filtrar por UUID da rede para isolar eventos.
      </p>

      <div className="form-rede__grid" style={{ marginBottom: 16, maxWidth: 640 }}>
        <input
          className="campo__input"
          placeholder="UUID da rede (opcional)"
          value={filtroDraft}
          onChange={(e) => setFiltroDraft(e.target.value)}
          aria-label="Filtrar por id da rede"
        />
      </div>

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
              <p>Quando o sistema registrar acoes, elas aparecerao aqui.</p>
            </article>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="tabela-redes" style={{ minWidth: 880 }}>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Rede</th>
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
                      <td className="tabela-redes__sub">{row.id_rede || "—"}</td>
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
                onClick={() => carregar(Math.max(0, offset - LIMITE), filtroRede.trim())}
              >
                Anterior
              </button>
              <button
                type="button"
                className="tabela-btn tabela-btn--outline"
                disabled={!podeProximo}
                onClick={() => carregar(offset + LIMITE, filtroRede.trim())}
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

import { useEffect, useState } from "react";
import { listarPresencaAppClientes } from "../servicos/usuariosRedeServico";
import { toastErro } from "../servicos/toastServico";

function fmtDataHora(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("pt-BR");
  } catch {
    return "—";
  }
}

export default function ClientesPresencaAppSecao({ redeId }) {
  const [carregando, setCarregando] = useState(true);
  const [dados, setDados] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!redeId) {
      setCarregando(false);
      setDados(null);
      return;
    }
    let cancelado = false;
    (async () => {
      setCarregando(true);
      try {
        const res = await listarPresencaAppClientes({ limite: 200, minutos_online: 15 });
        if (!cancelado) {
          setDados(res);
        }
      } catch (err) {
        if (!cancelado) {
          toastErro(err.message || "Falha ao carregar atividade no app.");
          setDados(null);
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
  }, [redeId, tick]);

  const itens = dados?.itens || [];
  const totalC = Number(dados?.total_clientes ?? 0);
  const totalP = Number(dados?.total_com_presenca_registrada ?? 0);
  const minOn = Number(dados?.minutos_online ?? 15);

  return (
    <div className="rede-detalhes__subsecao" style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "baseline", marginBottom: 10 }}>
        <h3 className="rede-detalhes__titulo-secao" style={{ margin: 0 }}>
          Atividade no app (clientes)
        </h3>
        <button type="button" className="botao-secundario botao-secundario--compacto" onClick={() => setTick((t) => t + 1)}>
          Atualizar
        </button>
      </div>
      <p className="rede-detalhes__ajuda" style={{ marginTop: 0 }}>
        Heartbeat ao abrir o app (sem WebSocket). “Provavelmente online” = último registro há até{" "}
        <strong>{minOn} min</strong>. Total de clientes: <strong>{totalC}</strong>; já abriram o app pelo menos uma vez
        após esta funcionalidade: <strong>{totalP}</strong>. Exibindo até <strong>200</strong> linhas, ordenadas pela
        última atividade.
      </p>
      {carregando ? (
        <p>Carregando...</p>
      ) : itens.length === 0 ? (
        <p>Nenhum cliente encontrado.</p>
      ) : (
        <div className="tabela-wrap">
          <table className="tabela-redes tabela-redes--compacta">
            <thead>
              <tr>
                <th>Online?</th>
                <th>Nome</th>
                <th>Papel</th>
                <th>Email</th>
                <th>Telefone</th>
                <th>CPF</th>
                <th>Nivel</th>
                <th>Ultimo app</th>
                <th>Plat.</th>
                <th>Ativo</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((row) => (
                <tr key={row.id_usuario}>
                  <td>
                    {row.provavelmente_online_agora ? (
                      <span className="tag-status tag-status--ativo">Sim</span>
                    ) : (
                      <span className="tag-status tag-status--inativo">Nao</span>
                    )}
                  </td>
                  <td>
                    <span className="tabela-celula__principal">{row.nome_completo || "—"}</span>
                  </td>
                  <td>Cliente</td>
                  <td>{row.email || "—"}</td>
                  <td>{row.telefone || "—"}</td>
                  <td>{row.cpf || "—"}</td>
                  <td>{row.nivel_cliente || "—"}</td>
                  <td>{fmtDataHora(row.ultimo_app_acesso_em)}</td>
                  <td>{row.ultimo_app_plataforma || "—"}</td>
                  <td>
                    <span className={`tag-status ${row.ativo ? "tag-status--ativo" : "tag-status--inativo"}`}>
                      {row.ativo ? "Sim" : "Nao"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

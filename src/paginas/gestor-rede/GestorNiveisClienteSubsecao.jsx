import { useCallback, useEffect, useState } from "react";
import { buscarNiveisClienteGestor, salvarNiveisClienteGestor } from "../../servicos/niveisClienteServico";
import { toastErro, toastSucesso } from "../../servicos/toastServico";

function parseNum(s) {
  const n = parseFloat(String(s).replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

const ABAS_NIVEIS = [
  { id: "opcoes", label: "Ativacao" },
  { id: "tabela", label: "Niveis e multiplicadores" }
];

/**
 * @param {{ onVoltar: () => void }} props
 */
export default function GestorNiveisClienteSubsecao({ onVoltar }) {
  const [aba, setAba] = useState("opcoes");
  const [ativo, setAtivo] = useState(false);
  const [multDescontoAtivo, setMultDescontoAtivo] = useState(false);
  const [niveis, setNiveis] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const d = await buscarNiveisClienteGestor();
      setAtivo(!!d?.ativo);
      setMultDescontoAtivo(!!d?.mult_desconto_ativo);
      const n = Array.isArray(d?.niveis) ? d.niveis : [];
      setNiveis(
        n.map((x) => ({
          codigo: String(x.codigo || ""),
          nome: String(x.nome || ""),
          mult_moeda: x.mult_moeda,
          mult_desconto: x.mult_desconto,
          ordem: Number(x.ordem) || 1
        }))
      );
    } catch (e) {
      toastErro(e?.message || "Falha ao carregar niveis.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function setLinha(i, patch) {
    setNiveis((prev) => {
      const copia = [...prev];
      copia[i] = { ...copia[i], ...patch };
      return copia;
    });
  }

  async function onSubmit(ev) {
    ev.preventDefault();
    const bodyNiveis = niveis.map((n, idx) => {
      const mm = parseNum(n.mult_moeda);
      const md = parseNum(n.mult_desconto);
      return {
        codigo: n.codigo.trim().toLowerCase(),
        nome: n.nome.trim(),
        mult_moeda: mm,
        mult_desconto: md,
        ordem: n.ordem != null ? Number(n.ordem) : idx + 1
      };
    });
    for (const n of bodyNiveis) {
      if (!n.codigo) {
        toastErro("Preencha o codigo de cada nivel (ex.: bronze).");
        return;
      }
      if (!n.nome) {
        toastErro("Preencha o nome exibido de cada nivel.");
        return;
      }
    }
    setSalvando(true);
    try {
      await salvarNiveisClienteGestor({
        ativo,
        mult_desconto_ativo: multDescontoAtivo,
        niveis: bodyNiveis
      });
      toastSucesso("Niveis e multiplicadores salvos.");
      await carregar();
    } catch (e) {
      toastErro(e?.message || "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <article className="card-resumo card-resumo--painel-form">
        <p className="rede-detalhes__ajuda">Carregando niveis…</p>
      </article>
    );
  }

  return (
    <article className="card-resumo card-resumo--painel-form">
      <header className="gestor-subsecao__topo">
        <button type="button" className="botao-secundario botao-secundario--compacto" onClick={onVoltar}>
          Voltar
        </button>
        <div>
          <h2 className="gestor-subsecao__titulo">Niveis de cliente</h2>
          <p className="gestor-subsecao__sub">
            Multiplicadores opcionais de moeda (e desconto, se ativar) por nivel — usados em cashback, check-in,
            gire e ganhe, indique e ganhe, etc.
          </p>
        </div>
      </header>

      <form className="form-rede" onSubmit={onSubmit}>
        <div
          className="rede-detalhes__tabs rede-detalhes__tabs--segmento rede-detalhes__tabs--subsecao"
          role="tablist"
          aria-label="Secoes de niveis"
        >
          {ABAS_NIVEIS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={aba === t.id}
              className={`rede-detalhes__tab ${aba === t.id ? "rede-detalhes__tab--ativa" : ""}`}
              onClick={() => setAba(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {aba === "opcoes" ? (
          <div role="tabpanel">
            <p className="gestor-prose">
              Com a opcao principal ligada, cada nivel aplica um multiplicador ao ganho de moedas da rede. O
              multiplicador de desconto e independente: so altera precos com desconto quando estiver ativo; use
              valores <span className="gestor-prose__termo">&ge; 1</span> (1 = sem alteracao).
            </p>
            <div className="form-rede__grid" style={{ gridTemplateColumns: "1fr" }}>
              <label className="form-rede__checkbox-linha">
                <input type="checkbox" checked={ativo} onChange={(ev) => setAtivo(ev.target.checked)} />
                Usar niveis e multiplicador de moeda (cashback, check-in, gire, indique, etc.)
              </label>
              <label className="form-rede__checkbox-linha" style={{ marginTop: 4 }}>
                <input
                  type="checkbox"
                  checked={multDescontoAtivo}
                  onChange={(ev) => setMultDescontoAtivo(ev.target.checked)}
                />
                Ativar multiplicador de desconto em precos promocionais
              </label>
            </div>
            <p className="rede-detalhes__ajuda" style={{ marginTop: 12 }}>
              Codigo interno (ex. bronze): minusculas, letras, numeros e <code>_</code>. Multiplicadores &ge; 1. A
              tabela fica na outra aba.
            </p>
          </div>
        ) : null}

        {aba === "tabela" ? (
          <div role="tabpanel">
            <p className="rede-detalhes__ajuda" style={{ marginBottom: 12 }}>
              Defina ordem, codigo tecnico, nome exibido e fatores por linha.
            </p>
            <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid #e2e8f0" }}>
              <table className="gestor-tabela-niveis">
                <thead>
                  <tr>
                    <th scope="col">Ordem</th>
                    <th scope="col">Codigo</th>
                    <th scope="col">Nome</th>
                    <th scope="col">x Moeda</th>
                    <th scope="col">x Desconto</th>
                  </tr>
                </thead>
                <tbody>
                  {niveis.map((n, i) => (
                    <tr key={`${n.codigo}-${i}`}>
                      <td>
                        <input
                          className="form-rede__input"
                          type="number"
                          min={1}
                          max={99}
                          value={n.ordem}
                          onChange={(ev) =>
                            setLinha(i, { ordem: ev.target.value === "" ? "" : Number(ev.target.value) })
                          }
                        />
                      </td>
                      <td>
                        <input
                          className="form-rede__input"
                          value={n.codigo}
                          onChange={(ev) => setLinha(i, { codigo: ev.target.value })}
                          placeholder="bronze"
                          autoComplete="off"
                        />
                      </td>
                      <td>
                        <input
                          className="form-rede__input"
                          value={n.nome}
                          onChange={(ev) => setLinha(i, { nome: ev.target.value })}
                          placeholder="Bronze"
                        />
                      </td>
                      <td>
                        <input
                          className="form-rede__input"
                          inputMode="decimal"
                          value={n.mult_moeda}
                          onChange={(ev) => setLinha(i, { mult_moeda: ev.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          className="form-rede__input"
                          inputMode="decimal"
                          value={n.mult_desconto}
                          onChange={(ev) => setLinha(i, { mult_desconto: ev.target.value })}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        <div className="form-rede__acoes" style={{ marginTop: 4 }}>
          <button className="botao-primario" type="submit" disabled={salvando}>
            {salvando ? "Salvando…" : "Salvar niveis"}
          </button>
        </div>
      </form>
    </article>
  );
}

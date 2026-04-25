import { useCallback, useEffect, useState } from "react";
import { buscarIndiqueGanheConfigGestor, salvarIndiqueGanheConfigGestor } from "../../servicos/indiqueGanheServico";
import { toastErro, toastSucesso } from "../../servicos/toastServico";

const REGRAS = [
  { value: "CADASTRAR", label: "Ao cadastrar com o codigo (pontos na hora do cadastro)" },
  { value: "PRIMEIRA_COMPRA_VOUCHER", label: "Apos a primeira compra de voucher aprovada no app" }
];

const ABAS_IG = [
  { id: "sobre", label: "Como funciona" },
  { id: "premios", label: "Regras e premios" }
];

/**
 * @param {{ onVoltar: () => void }} props
 */
export default function GestorIndiqueGanheSubsecao({ onVoltar }) {
  const [aba, setAba] = useState("sobre");
  const [regra, setRegra] = useState("PRIMEIRA_COMPRA_VOUCHER");
  const [moedasRef, setMoedasRef] = useState("");
  const [moedasInd, setMoedasInd] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const d = await buscarIndiqueGanheConfigGestor();
      if (d?.regra) {
        setRegra(d.regra);
      }
      if (d?.moedas_premio_referente != null) {
        setMoedasRef(String(d.moedas_premio_referente));
      }
      if (d?.moedas_premio_indicado != null) {
        setMoedasInd(String(d.moedas_premio_indicado));
      }
    } catch (e) {
      toastErro(e?.message || "Falha ao carregar regras do indique e ganhe.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function onSubmit(ev) {
    ev.preventDefault();
    const a = parseFloat(String(moedasRef).replace(",", "."));
    const b = parseFloat(String(moedasInd).replace(",", "."));
    if (Number.isNaN(a) || a < 0 || Number.isNaN(b) || b < 0) {
      toastErro("Informe valores numericos (moedas) maiores ou iguais a zero.");
      return;
    }
    setSalvando(true);
    try {
      await salvarIndiqueGanheConfigGestor({
        regra,
        moedas_premio_referente: a,
        moedas_premio_indicado: b
      });
      toastSucesso("Regras do indique e ganhe salvas.");
    } catch (e) {
      toastErro(e?.message || "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <article className="card-resumo card-resumo--painel-form">
        <p className="rede-detalhes__ajuda">Carregando indique e ganhe…</p>
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
          <h2 className="gestor-subsecao__titulo">Indique e ganhe</h2>
          <p className="gestor-subsecao__sub">
            Codigo unico por cliente, bonus na moeda da rede e credito na carteira (extrato BONUS).
          </p>
        </div>
      </header>

      <form className="form-rede" onSubmit={onSubmit}>
        <div
          className="rede-detalhes__tabs rede-detalhes__tabs--segmento rede-detalhes__tabs--subsecao"
          role="tablist"
          aria-label="Secoes do indique e ganhe"
        >
          {ABAS_IG.map((t) => (
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

        {aba === "sobre" ? (
          <div role="tabpanel">
            <p className="gestor-prose">
              Cada cliente do app passa a ter um{" "}
              <span className="gestor-prose__termo">codigo unico</span> (visivel no perfil) para novos usuarios
              informarem no cadastro.
            </p>
            <p className="gestor-prose">
              Os bonus sao creditados na <span className="gestor-prose__termo">moeda virtual</span> da rede, na{" "}
              <span className="gestor-prose__termo">carteira</span>, com extrato por tipo BONUS. Se a rede usar
              niveis de cliente com multiplicador de moeda ativo, os valores base abaixo podem ser ajustados por
              nivel na hora do credito.
            </p>
          </div>
        ) : null}

        {aba === "premios" ? (
          <div role="tabpanel">
            <div className="form-rede__grid form-rede__grid--1col">
              <div>
                <span className="form-rede__label">Quando o referidor e o indicado ganham</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                  {REGRAS.map((o) => (
                    <label key={o.value} className="form-rede__radio-linha" style={{ alignItems: "flex-start" }}>
                      <input
                        type="radio"
                        name="regra-ig"
                        value={o.value}
                        checked={regra === o.value}
                        onChange={() => setRegra(o.value)}
                      />
                      <span>{o.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="form-rede__label" htmlFor="ig-moedas-ref">
                  Moedas para quem indicou (referidor)
                </label>
                <input
                  id="ig-moedas-ref"
                  className="form-rede__input"
                  type="text"
                  inputMode="decimal"
                  value={moedasRef}
                  onChange={(ev) => setMoedasRef(ev.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="form-rede__label" htmlFor="ig-moedas-ind">
                  Moedas para quem foi indicado (novo cadastro)
                </label>
                <input
                  id="ig-moedas-ind"
                  className="form-rede__input"
                  type="text"
                  inputMode="decimal"
                  value={moedasInd}
                  onChange={(ev) => setMoedasInd(ev.target.value)}
                  placeholder="0 (pode ser zero se so o referidor ganha)"
                />
              </div>
            </div>
          </div>
        ) : null}

        <div className="form-rede__acoes" style={{ marginTop: 8 }}>
          <button className="botao-primario" type="submit" disabled={salvando}>
            {salvando ? "Salvando…" : "Salvar regras"}
          </button>
        </div>
      </form>
    </article>
  );
}

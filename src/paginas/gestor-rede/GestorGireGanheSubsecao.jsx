import { useCallback, useEffect, useMemo, useState } from "react";
import { buscarGireGanheConfigGestor, salvarGireGanheConfigGestor } from "../../servicos/gireGanheServico";
import { toastErro, toastSucesso } from "../../servicos/toastServico";

function linhaVazia() {
  return { id: crypto.randomUUID?.() ?? String(Math.random()), valor: "", percentual: "" };
}

const PREVIEW_CORES = [
  "#2563eb",
  "#7c3aed",
  "#0891b2",
  "#059669",
  "#ca8a04",
  "#ea580c",
  "#db2777",
  "#4f46e5",
  "#0d9488",
  "#9333ea"
];

const PREVIEW_CORES_JACKPOT = ["#f59e0b", "#d97706", "#b45309", "#fbbf24"];

function corFaixaPadrao(i) {
  const h = 210 + ((i * 17) % 55);
  return `hsl(${h} 78% ${50 + (i % 3) * 5}%)`;
}

function fatiaPizzaPath(cx, cy, r, a0, a1) {
  const x0 = cx + r * Math.cos(a0);
  const y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`;
}

function computePreviewSlices(modoRoleta, minimo, maximo, linhasEsp, premiosEspAtivo, linhasPers) {
  let alerta = null;

  if (modoRoleta === "personalizado") {
    const slices = [];
    let idx = 0;
    for (const L of linhasPers) {
      const v = parseFloat(String(L.valor).replace(",", "."));
      const pc = parseFloat(String(L.percentual).replace(",", "."));
      if (Number.isNaN(v) || Number.isNaN(pc) || pc <= 0) continue;
      slices.push({
        key: L.id,
        pct: pc,
        label: `${Math.round(v)} moedas`,
        color: PREVIEW_CORES[idx % PREVIEW_CORES.length]
      });
      idx += 1;
    }
    const soma = slices.reduce((a, s) => a + s.pct, 0);
    if (slices.length === 0) {
      return {
        modo: "personalizado",
        slices: [{ key: "__vazio", pct: 100, label: "Defina valores e %", color: "#e2e8f0" }],
        alerta: null
      };
    }
    if (soma > 100.02) {
      alerta = "Soma das chances ultrapassa 100%; o gráfico mostra proporções relativas.";
      const fator = 100 / soma;
      return {
        modo: "personalizado",
        slices: slices.map((s) => ({ ...s, pct: s.pct * fator })),
        alerta
      };
    }
    if (soma < 99.98) {
      slices.push({
        key: "__restante",
        pct: 100 - soma,
        label: `Restante (${(100 - soma).toFixed(1)}%)`,
        color: "#cbd5e1"
      });
    }
    return { modo: "personalizado", slices, alerta };
  }

  const min = parseFloat(String(minimo).replace(",", "."));
  const max = parseFloat(String(maximo).replace(",", "."));
  const faixaOk = !Number.isNaN(min) && !Number.isNaN(max) && max >= min;

  const jackpots = [];
  let jsum = 0;
  if (premiosEspAtivo) {
    let ji = 0;
    for (const L of linhasEsp) {
      const v = parseFloat(String(L.valor).replace(",", "."));
      const pc = parseFloat(String(L.percentual).replace(",", "."));
      if (Number.isNaN(v) || Number.isNaN(pc) || pc <= 0) continue;
      jackpots.push({
        key: `jk-${L.id}`,
        pct: pc,
        label: `Jackpot ${Math.round(v)}`,
        color: PREVIEW_CORES_JACKPOT[ji % PREVIEW_CORES_JACKPOT.length]
      });
      jsum += pc;
      ji += 1;
    }
  }

  if (jsum > 100.02) {
    alerta = "Soma dos jackpots ultrapassa 100%; ajuste antes de salvar.";
  }

  const rest = Math.max(0, 100 - Math.min(jsum, 100));
  const cadaFatia = rest / 10;
  const slices = [];

  for (let i = 0; i < 10; i += 1) {
    let leg = faixaOk ? String(Math.round(min + ((max - min) * i) / 9)) : "—";
    slices.push({
      key: `pad-${i}`,
      pct: cadaFatia,
      label: `Faixa ${i + 1}: ${leg}`,
      color: corFaixaPadrao(i)
    });
  }
  for (const jk of jackpots) {
    slices.push({ ...jk });
  }

  if (jsum > 100.02) {
    const somaVis = slices.reduce((a, s) => a + s.pct, 0) || 1;
    const f = 100 / somaVis;
    return {
      modo: "padrao",
      slices: slices.map((s) => ({ ...s, pct: s.pct * f })),
      alerta
    };
  }

  return { modo: "padrao", slices, alerta };
}

function GireGanhePreviewGrafico({ slices }) {
  const cx = 100;
  const cy = 100;
  const r = 88;
  let ang = -Math.PI / 2;
  let vis = slices.filter((s) => s.pct > 0.02);
  if (vis.length === 0) {
    vis = [{ key: "__placeholder", pct: 100, color: "#e2e8f0" }];
  }

  return (
    <svg viewBox="0 0 200 200" width={220} height={220} aria-hidden>
      {vis.map((s) => {
        const sweep = ((s.pct / 100) * 2 * Math.PI);
        const a0 = ang;
        const a1 = ang + sweep;
        ang = a1;
        const d = fatiaPizzaPath(cx, cy, r, a0, a1);
        return <path key={s.key} d={d} fill={s.color} stroke="#ffffff" strokeWidth="1.25" />;
      })}
      <circle cx={cx} cy={cy} r={26} fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" />
    </svg>
  );
}

export default function GestorGireGanheSubsecao({ onVoltar }) {
  const [custo, setCusto] = useState("");
  const [minimo, setMinimo] = useState("");
  const [maximo, setMaximo] = useState("");
  const [maxDia, setMaxDia] = useState("");
  const [timezone, setTimezone] = useState("America/Sao_Paulo");
  const [primeiroGratis, setPrimeiroGratis] = useState(true);
  const [modoRoleta, setModoRoleta] = useState("padrao");
  const [linhasPers, setLinhasPers] = useState([linhaVazia()]);
  const [premiosEspAtivo, setPremiosEspAtivo] = useState(false);
  const [linhasEsp, setLinhasEsp] = useState([linhaVazia()]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const d = await buscarGireGanheConfigGestor();
      if (d?.custo_moedas != null) setCusto(String(d.custo_moedas));
      if (d?.premio_min_moedas != null) setMinimo(String(d.premio_min_moedas));
      if (d?.premio_max_moedas != null) setMaximo(String(d.premio_max_moedas));
      if (d?.giros_max_dia != null) setMaxDia(String(d.giros_max_dia));
      if (d?.timezone) setTimezone(String(d.timezone));
      if (d?.primeiro_giro_gratis_ativo != null) setPrimeiroGratis(!!d.primeiro_giro_gratis_ativo);
      const modo = String(d?.roleta_modo || "padrao").toLowerCase() === "personalizado" ? "personalizado" : "padrao";
      setModoRoleta(modo);
      const pr = Array.isArray(d?.premios_roleta_personalizada) ? d.premios_roleta_personalizada : [];
      if (pr.length) {
        setLinhasPers(
          pr.map((row) => ({
            id: crypto.randomUUID?.() ?? String(Math.random()),
            valor: row.valor_moedas != null ? String(row.valor_moedas) : "",
            percentual: row.percentual != null ? String(row.percentual) : ""
          }))
        );
      } else {
        setLinhasPers([linhaVazia()]);
      }
      if (d?.premios_especiais_ativo != null) setPremiosEspAtivo(!!d.premios_especiais_ativo);
      const arr = Array.isArray(d?.premios_especiais) ? d.premios_especiais : [];
      if (arr.length) {
        setLinhasEsp(
          arr.map((row) => ({
            id: crypto.randomUUID?.() ?? String(Math.random()),
            valor: row.valor_moedas != null ? String(row.valor_moedas) : "",
            percentual: row.percentual != null ? String(row.percentual) : ""
          }))
        );
      } else {
        setLinhasEsp([linhaVazia()]);
      }
    } catch (e) {
      toastErro(e?.message || "Falha ao carregar gire e ganhe.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const preview = useMemo(
    () => computePreviewSlices(modoRoleta, minimo, maximo, linhasEsp, premiosEspAtivo, linhasPers),
    [modoRoleta, minimo, maximo, linhasEsp, premiosEspAtivo, linhasPers]
  );

  function somaPercentuaisEsp() {
    let s = 0;
    for (const L of linhasEsp) {
      const p = parseFloat(String(L.percentual).replace(",", "."));
      if (!Number.isNaN(p)) s += p;
    }
    return s;
  }

  function somaPercentuaisPers() {
    let s = 0;
    for (const L of linhasPers) {
      const p = parseFloat(String(L.percentual).replace(",", "."));
      if (!Number.isNaN(p)) s += p;
    }
    return s;
  }

  async function onSubmit(ev) {
    ev.preventDefault();
    const c = parseFloat(String(custo).replace(",", "."));
    const min = parseFloat(String(minimo).replace(",", "."));
    const max = parseFloat(String(maximo).replace(",", "."));
    const md = parseInt(String(maxDia), 10);
    if (Number.isNaN(c) || c <= 0) {
      toastErro("Confira o custo por giro (> 0).");
      return;
    }
    if (modoRoleta === "padrao") {
      if (Number.isNaN(min) || min < 0 || Number.isNaN(max) || max < min) {
        toastErro("Confira a faixa de prêmio (máx. ≥ mín. ≥ 0).");
        return;
      }
    }
    if (Number.isNaN(md) || md < 1) {
      toastErro("Informe quantos giros por dia (mínimo 1).");
      return;
    }

    if (modoRoleta === "personalizado") {
      const premios_roleta_personalizada = [];
      for (const L of linhasPers) {
        const v = parseFloat(String(L.valor).replace(",", "."));
        const pc = parseFloat(String(L.percentual).replace(",", "."));
        if (Number.isNaN(v) && Number.isNaN(pc)) continue;
        if (Number.isNaN(v) || Number.isNaN(pc) || v < 1 || pc <= 0) {
          toastErro("Cada linha da roleta personalizada precisa de valor inteiro ≥ 1 e % > 0.");
          return;
        }
        premios_roleta_personalizada.push({ valor_moedas: Math.round(v), percentual: pc });
      }
      const soma = premios_roleta_personalizada.reduce((a, x) => a + x.percentual, 0);
      if (Math.abs(soma - 100) > 0.02) {
        toastErro(`No modo personalizado, a soma das chances deve ser 100% (atual: ${soma.toFixed(2)}%).`);
        return;
      }
      if (premios_roleta_personalizada.length < 1) {
        toastErro("Adicione ao menos um prêmio na roleta personalizada.");
        return;
      }
      const valoresMoedas = premios_roleta_personalizada.map((x) => x.valor_moedas);
      const minDer = Math.min(...valoresMoedas);
      const maxDer = Math.max(...valoresMoedas);
      setSalvando(true);
      try {
        await salvarGireGanheConfigGestor({
          custo_moedas: c,
          premio_min_moedas: minDer,
          premio_max_moedas: maxDer,
          giros_max_dia: md,
          timezone: timezone.trim() || "America/Sao_Paulo",
          primeiro_giro_gratis_ativo: primeiroGratis,
          roleta_modo: "personalizado",
          premios_roleta_personalizada: premios_roleta_personalizada,
          premios_especiais_ativo: false,
          premios_especiais: []
        });
        toastSucesso("Configuração do gire e ganhe salva.");
      } catch (e) {
        toastErro(e?.message || "Falha ao salvar.");
      } finally {
        setSalvando(false);
      }
      return;
    }

    const maxInt = Math.round(max);
    const premios_especiais = [];
    for (const L of linhasEsp) {
      const v = parseFloat(String(L.valor).replace(",", "."));
      const pc = parseFloat(String(L.percentual).replace(",", "."));
      if (Number.isNaN(v) && Number.isNaN(pc)) continue;
      if (Number.isNaN(v) || Number.isNaN(pc) || v <= 0 || pc <= 0) {
        toastErro("Cada linha de prêmio especial precisa de valor e % válidos (> 0).");
        return;
      }
      if (Math.round(v) <= maxInt) {
        toastErro(`Prêmio especial: o valor (${Math.round(v)}) deve ser maior que o prêmio máximo da roleta (${maxInt}).`);
        return;
      }
      premios_especiais.push({ valor_moedas: Math.round(v), percentual: pc });
    }
    const soma = premios_especiais.reduce((a, x) => a + x.percentual, 0);
    if (soma > 100 + 1e-6) {
      toastErro("A soma dos percentuais dos prêmios especiais não pode passar de 100%.");
      return;
    }
    if (premiosEspAtivo && premios_especiais.length === 0) {
      toastErro("Com prêmios especiais ativos, adicione ao menos uma linha (valor + %).");
      return;
    }
    setSalvando(true);
    try {
      await salvarGireGanheConfigGestor({
        custo_moedas: c,
        premio_min_moedas: min,
        premio_max_moedas: max,
        giros_max_dia: md,
        timezone: timezone.trim() || "America/Sao_Paulo",
        primeiro_giro_gratis_ativo: primeiroGratis,
        roleta_modo: "padrao",
        premios_roleta_personalizada: [],
        premios_especiais_ativo: premiosEspAtivo,
        premios_especiais: premios_especiais
      });
      toastSucesso("Configuração do gire e ganhe salva.");
    } catch (e) {
      toastErro(e?.message || "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <article className="card-resumo card-resumo--painel-form">
        <p className="rede-detalhes__ajuda">Carregando gire e ganhe…</p>
      </article>
    );
  }

  return (
    <article className="card-resumo card-resumo--painel-form">
      <header className="gestor-subsecao__topo">
        <button type="button" className="botao-secundario botao-secundario--compacto" onClick={onVoltar}>Voltar</button>
        <div>
          <h2 className="gestor-subsecao__titulo">Gire e ganhe</h2>
          <p className="gestor-subsecao__sub">
            Sorteio no servidor. Escolha o modo da roleta: padrão (faixa min–max em 10 fatias iguais + jackpots opcionais) ou personalizado (cada prêmio e sua %, somando 100%).
          </p>
        </div>
      </header>

      <form className="form-rede gire-form" onSubmit={onSubmit}>
        <div className="gire-form__layout">
          <div className="gire-form__principal">
        <section className="gire-form__secao">
          <h3 className="gire-form__secao-titulo">Modo da roleta</h3>
          <p className="rede-detalhes__ajuda gire-form__ajuda" style={{ marginTop: 0 }}>
            Escolha primeiro o modo; a faixa mín./máx. só vale no modo padrão.
          </p>
          <label className="form-rede__radio-linha">
            <input
              type="radio"
              name="gire-modo-roleta"
              checked={modoRoleta === "padrao"}
              onChange={() => {
                setModoRoleta("padrao");
              }}
            />
            Padrão: 10 fatias entre mín. e máx.; cada fatia normal usa a mesma % do restante após os jackpots. Jackpots opcionais abaixo.
          </label>
          <label className="form-rede__radio-linha">
            <input
              type="radio"
              name="gire-modo-roleta"
              checked={modoRoleta === "personalizado"}
              onChange={() => {
                setModoRoleta("personalizado");
                setPremiosEspAtivo(false);
              }}
            />
            Personalizado: informe cada valor (moedas) e a chance (%). A soma deve fechar 100%. Jackpots ficam indisponíveis neste modo.
          </label>
        </section>

        {modoRoleta === "padrao" ? (
          <section className="gire-form__secao">
            <h3 className="gire-form__secao-titulo">Configuração base</h3>
            <div className="gire-form__grid">
              <div>
                <label className="form-rede__label" htmlFor="gire-custo">Custo por giro (após o grátis)</label>
                <input id="gire-custo" className="form-rede__input" type="text" inputMode="decimal" value={custo} onChange={(e) => setCusto(e.target.value)} />
              </div>
              <div>
                <label className="form-rede__label" htmlFor="gire-min">Prêmio mínimo (moedas)</label>
                <input id="gire-min" className="form-rede__input" type="text" inputMode="decimal" value={minimo} onChange={(e) => setMinimo(e.target.value)} />
              </div>
              <div>
                <label className="form-rede__label" htmlFor="gire-max">Prêmio máximo (moedas)</label>
                <input id="gire-max" className="form-rede__input" type="text" inputMode="decimal" value={maximo} onChange={(e) => setMaximo(e.target.value)} />
              </div>
              <div>
                <label className="form-rede__label" htmlFor="gire-max-dia">Máximo de giros por dia (cliente)</label>
                <input id="gire-max-dia" className="form-rede__input" type="number" min={1} value={maxDia} onChange={(e) => setMaxDia(e.target.value)} />
              </div>
              <div>
                <label className="form-rede__label" htmlFor="gire-tz">Fuso horário (IANA)</label>
                <input id="gire-tz" className="form-rede__input" type="text" value={timezone} onChange={(e) => setTimezone(e.target.value)} />
              </div>
            </div>
            <label className="form-rede__checkbox-linha">
              <input type="checkbox" checked={primeiroGratis} onChange={(e) => setPrimeiroGratis(e.target.checked)} />
              Primeiro giro do cliente grátis (apenas uma vez na vida)
            </label>
          </section>
        ) : (
          <section className="gire-form__secao">
            <h3 className="gire-form__secao-titulo">Definições gerais</h3>
            <p className="rede-detalhes__ajuda gire-form__ajuda" style={{ marginTop: 0 }}>
              Custo, limite diário e fuso continuam valendo; prêmio mín./máx. da faixa não se aplica neste modo.
            </p>
            <div className="gire-form__grid">
              <div>
                <label className="form-rede__label" htmlFor="gire-custo-pers">Custo por giro (após o grátis)</label>
                <input id="gire-custo-pers" className="form-rede__input" type="text" inputMode="decimal" value={custo} onChange={(e) => setCusto(e.target.value)} />
              </div>
              <div>
                <label className="form-rede__label" htmlFor="gire-max-dia-pers">Máximo de giros por dia (cliente)</label>
                <input id="gire-max-dia-pers" className="form-rede__input" type="number" min={1} value={maxDia} onChange={(e) => setMaxDia(e.target.value)} />
              </div>
              <div>
                <label className="form-rede__label" htmlFor="gire-tz-pers">Fuso horário (IANA)</label>
                <input id="gire-tz-pers" className="form-rede__input" type="text" value={timezone} onChange={(e) => setTimezone(e.target.value)} />
              </div>
            </div>
            <label className="form-rede__checkbox-linha">
              <input type="checkbox" checked={primeiroGratis} onChange={(e) => setPrimeiroGratis(e.target.checked)} />
              Primeiro giro do cliente grátis (apenas uma vez na vida)
            </label>
          </section>
        )}

        {modoRoleta === "personalizado" ? (
          <section className="gire-form__secao gire-form__secao--jackpot">
            <div className="gire-form__jackpot-topo">
              <h3 className="gire-form__secao-titulo" style={{ margin: 0 }}>Roleta personalizada</h3>
              <span className="gire-form__badge">Soma: {somaPercentuaisPers().toFixed(2)}% (meta 100%)</span>
            </div>
            <p className="rede-detalhes__ajuda gire-form__ajuda">
              Ex.: 1 pt com 10%, 5 pts com 20%, etc. Valores inteiros ≥ 1.
            </p>
            <div className="gire-form__jackpot-cabecalho">
              <span>Valor (moedas)</span>
              <span>Chance (%)</span>
              <span />
            </div>
            <div className="gire-form__jackpot-lista">
              {linhasPers.map((L) => (
                <div key={L.id} className="gire-form__jackpot-linha">
                  <input
                    className="form-rede__input"
                    type="text"
                    inputMode="numeric"
                    placeholder="Ex.: 10"
                    value={L.valor}
                    onChange={(e) => {
                      const v = e.target.value;
                      setLinhasPers((rows) => rows.map((r) => (r.id === L.id ? { ...r, valor: v } : r)));
                    }}
                  />
                  <input
                    className="form-rede__input"
                    type="text"
                    inputMode="decimal"
                    placeholder="Ex.: 25"
                    value={L.percentual}
                    onChange={(e) => {
                      const v = e.target.value;
                      setLinhasPers((rows) => rows.map((r) => (r.id === L.id ? { ...r, percentual: v } : r)));
                    }}
                  />
                  <button
                    type="button"
                    className="botao-secundario botao-secundario--compacto"
                    onClick={() => setLinhasPers((rows) => (rows.length <= 1 ? rows : rows.filter((r) => r.id !== L.id)))}
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className="botao-secundario botao-secundario--compacto gire-form__adicionar" onClick={() => setLinhasPers((rows) => [...rows, linhaVazia()])}>
              Adicionar linha
            </button>
          </section>
        ) : (
          <section className="gire-form__secao gire-form__secao--jackpot">
            <div className="gire-form__jackpot-topo">
              <label className="form-rede__checkbox-linha">
                <input type="checkbox" checked={premiosEspAtivo} onChange={(e) => setPremiosEspAtivo(e.target.checked)} />
                Ativar prêmios especiais (jackpot)
              </label>
              <span className="gire-form__badge">Soma jackpots: {somaPercentuaisEsp().toFixed(2)}%</span>
            </div>
            <p className="rede-detalhes__ajuda gire-form__ajuda">
              Cada valor deve ser inteiro e maior que o prêmio máximo da roleta. A soma das chances deve ser até 100%.
            </p>
            <div className="gire-form__jackpot-cabecalho">
              <span>Valor (moedas)</span>
              <span>Chance (%)</span>
              <span />
            </div>
            <div className="gire-form__jackpot-lista">
              {linhasEsp.map((L) => (
                <div key={L.id} className="gire-form__jackpot-linha">
                  <input
                    className="form-rede__input"
                    type="text"
                    inputMode="numeric"
                    placeholder="Ex.: 500"
                    disabled={!premiosEspAtivo}
                    value={L.valor}
                    onChange={(e) => {
                      const v = e.target.value;
                      setLinhasEsp((rows) => rows.map((r) => (r.id === L.id ? { ...r, valor: v } : r)));
                    }}
                  />
                  <input
                    className="form-rede__input"
                    type="text"
                    inputMode="decimal"
                    placeholder="Ex.: 5"
                    disabled={!premiosEspAtivo}
                    value={L.percentual}
                    onChange={(e) => {
                      const v = e.target.value;
                      setLinhasEsp((rows) => rows.map((r) => (r.id === L.id ? { ...r, percentual: v } : r)));
                    }}
                  />
                  <button
                    type="button"
                    className="botao-secundario botao-secundario--compacto"
                    disabled={!premiosEspAtivo}
                    onClick={() => setLinhasEsp((rows) => (rows.length <= 1 ? rows : rows.filter((r) => r.id !== L.id)))}
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="botao-secundario botao-secundario--compacto gire-form__adicionar"
              disabled={!premiosEspAtivo}
              onClick={() => setLinhasEsp((rows) => [...rows, linhaVazia()])}
            >
              Adicionar linha
            </button>
          </section>
        )}

          </div>
          <aside className="gire-form__preview" aria-label="Pré-visualização da roleta">
            <h3 className="gire-form__preview-titulo">Pré-visualização</h3>
            <p className="gire-form__preview-sub">
              {preview.modo === "padrao"
                ? "Probabilidades: 10 fatias iguais no espaço restante após jackpots; em seguida os jackpots ativos."
                : "Probabilidades por prêmio; área cinza é o que falta para fechar 100%."}
            </p>
            {preview.alerta ? <p className="gire-form__preview-alerta">{preview.alerta}</p> : null}
            <div className="gire-form__preview-svg-wrap">
              <GireGanhePreviewGrafico slices={preview.slices} />
            </div>
            <div className="gire-form__preview-legenda">
              {preview.slices
                .filter((s) => s.pct > 0.02)
                .map((s) => (
                  <div key={s.key} className="gire-form__preview-legenda-linha">
                    <span className="gire-form__preview-sw" style={{ background: s.color }} />
                    <span title={`${s.label} — ${s.pct.toFixed(2)}%`}>
                      {s.label} <strong>({s.pct.toFixed(1)}%)</strong>
                    </span>
                  </div>
                ))}
            </div>
          </aside>
        </div>

        <div className="form-rede__acoes" style={{ marginTop: 8 }}>
          <button className="botao-primario" type="submit" disabled={salvando}>{salvando ? "Salvando…" : "Salvar"}</button>
        </div>
      </form>
    </article>
  );
}

import { useCallback, useEffect, useState } from "react";
import { buscarCheckinDiarioConfigGestor, salvarCheckinDiarioConfigGestor } from "../../servicos/checkinDiarioServico";
import { toastErro, toastSucesso } from "../../servicos/toastServico";

/**
 * @param {{ onVoltar: () => void }} props
 */
export default function GestorCheckinDiarioSubsecao({ onVoltar }) {
  const [moedas, setMoedas] = useState("");
  const [hora, setHora] = useState("12:00");
  const [timezone, setTimezone] = useState("America/Sao_Paulo");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const d = await buscarCheckinDiarioConfigGestor();
      if (d?.moedas_por_dia != null) {
        setMoedas(String(d.moedas_por_dia));
      }
      if (d?.hora_abertura) {
        setHora(String(d.hora_abertura).slice(0, 5));
      }
      if (d?.timezone) {
        setTimezone(String(d.timezone));
      }
    } catch (e) {
      toastErro(e?.message || "Falha ao carregar check-in diario.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function onSubmit(ev) {
    ev.preventDefault();
    const m = parseFloat(String(moedas).replace(",", "."));
    if (Number.isNaN(m) || m <= 0) {
      toastErro("Informe quantas moedas por dia (maior que zero).");
      return;
    }
    const hz = String(hora || "").trim().slice(0, 8);
    if (!/^\d{1,2}:\d{2}/.test(hz)) {
      toastErro("Informe a hora de abertura do ciclo.");
      return;
    }
    setSalvando(true);
    try {
      await salvarCheckinDiarioConfigGestor({
        moedas_por_dia: m,
        hora_abertura: hz,
        timezone: timezone.trim() || "America/Sao_Paulo"
      });
      toastSucesso("Check-in diario salvo.");
    } catch (e) {
      toastErro(e?.message || "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <article className="card-resumo card-resumo--painel-form">
        <p className="rede-detalhes__ajuda">Carregando check-in diario…</p>
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
          <h2 className="gestor-subsecao__titulo">Check-in diario</h2>
          <p className="gestor-subsecao__sub">
            Cada cliente pode resgatar uma vez por ciclo (apos a hora local). O credito usa o multiplicador de
            moeda do nivel, se estiver ativo.
          </p>
        </div>
      </header>

      <form className="form-rede" onSubmit={onSubmit}>
        <div className="form-rede__grid form-rede__grid--1col">
          <div>
            <label className="form-rede__label" htmlFor="ck-moedas">
              Moedas por dia (base, antes do nivel)
            </label>
            <input
              id="ck-moedas"
              className="form-rede__input"
              type="text"
              inputMode="decimal"
              value={moedas}
              onChange={(ev) => setMoedas(ev.target.value)}
              placeholder="10"
            />
          </div>
          <div>
            <label className="form-rede__label" htmlFor="ck-hora">
              Hora de abertura do ciclo (fuso abaixo)
            </label>
            <input
              id="ck-hora"
              className="form-rede__input"
              type="time"
              value={hora.length >= 5 ? hora.slice(0, 5) : "12:00"}
              onChange={(ev) => {
                const v = ev.target.value;
                setHora(v.length >= 5 ? v.slice(0, 5) : v);
              }}
            />
            <p className="rede-detalhes__ajuda" style={{ marginTop: 6 }}>
              Por padrao meio-dia: o dia de check-in comeca nesse horario no fuso indicado (ex.: ate 11h59 ainda
              vale o ciclo do dia anterior).
            </p>
          </div>
          <div>
            <label className="form-rede__label" htmlFor="ck-tz">
              Fuso horario (IANA)
            </label>
            <input
              id="ck-tz"
              className="form-rede__input"
              type="text"
              value={timezone}
              onChange={(ev) => setTimezone(ev.target.value)}
              placeholder="America/Sao_Paulo"
              autoComplete="off"
            />
          </div>
        </div>
        <div className="form-rede__acoes" style={{ marginTop: 8 }}>
          <button className="botao-primario" type="submit" disabled={salvando}>
            {salvando ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>
    </article>
  );
}

import { useCallback, useEffect, useState } from "react";
import { gestorRedeLogado } from "../../configuracao/painelApi";
import { enviarTesteDePushRede } from "../../servicos/pushFcmRedeServico";
import { atualizarAppModulosRede, buscarMinhaRedeGestor } from "../../servicos/redesServico";
import { toastErro, toastSucesso } from "../../servicos/toastServico";
import GestorIndiqueGanheSubsecao from "./GestorIndiqueGanheSubsecao";
import GestorCheckinDiarioSubsecao from "./GestorCheckinDiarioSubsecao";
import GestorGireGanheSubsecao from "./GestorGireGanheSubsecao";
import GestorNiveisClienteSubsecao from "./GestorNiveisClienteSubsecao";
import GestorRedesSociaisSubsecao from "./GestorRedesSociaisSubsecao";

const ABAS_CONFIG = [
  { id: "funcionalidades", label: "Funcionalidades" },
  { id: "niveis", label: "Niveis" },
  { id: "ajustes", label: "Ajustes" },
  { id: "notificacoes", label: "Notificacoes" }
];

export default function GestorConfiguracoesSecao() {
  /** 'indique' = tela de regras; null = visao geral. */
  const [subSecao, setSubSecao] = useState(null);
  const [abaConfig, setAbaConfig] = useState("funcionalidades");
  const [titulo, setTitulo] = useState("Teste de notificacao");
  const [corpo, setCorpo] = useState(
    "Mensagem de teste. Se o app estiver aberto, aparecera um aviso. Se fechou, a notificacao abre o app e o aviso."
  );
  const [enviando, setEnviando] = useState(false);

  const [redeCarregada, setRedeCarregada] = useState(false);
  const [modIndique, setModIndique] = useState(false);
  const [modCheckin, setModCheckin] = useState(false);
  const [modGire, setModGire] = useState(false);
  const [modRedesSociais, setModRedesSociais] = useState(false);
  const [salvandoModulos, setSalvandoModulos] = useState(false);

  const carregarModulos = useCallback(async () => {
    if (!gestorRedeLogado()) {
      setRedeCarregada(true);
      return;
    }
    try {
      const r = await buscarMinhaRedeGestor();
      if (r) {
        setModIndique(!!r.app_modulo_indique_ganhe);
        setModCheckin(!!r.app_modulo_checkin_diario);
        setModGire(!!r.app_modulo_gire_ganhe);
        setModRedesSociais(!!r.app_modulo_redes_sociais);
      }
    } catch (err) {
      toastErro(err?.message || "Falha ao carregar modulos do app.");
    } finally {
      setRedeCarregada(true);
    }
  }, []);

  useEffect(() => {
    carregarModulos();
  }, [carregarModulos]);

  async function onSalvarModulos(e) {
    e.preventDefault();
    if (salvandoModulos) {
      return;
    }
    setSalvandoModulos(true);
    try {
      await atualizarAppModulosRede({
        app_modulo_indique_ganhe: modIndique,
        app_modulo_checkin_diario: modCheckin,
        app_modulo_gire_ganhe: modGire,
        app_modulo_redes_sociais: modRedesSociais
      });
      toastSucesso("Modulos do app atualizados.");
    } catch (err) {
      toastErro(err?.message || "Falha ao salvar.");
    } finally {
      setSalvandoModulos(false);
    }
  }

  async function onEnviarTeste(e) {
    e.preventDefault();
    if (enviando) {
      return;
    }
    setEnviando(true);
    try {
      const r = await enviarTesteDePushRede({ titulo, corpo });
      toastSucesso(
        `Teste enviado: ${r.enviados} com sucesso, ${r.falhas} falha(s) em ${r.tokensTentado} token(s) da rede.`
      );
    } catch (err) {
      toastErro(err?.message || "Falha ao enviar o teste.");
    } finally {
      setEnviando(false);
    }
  }

  if (gestorRedeLogado() && subSecao === "indique") {
    return (
      <div className="configuracoes-painel">
        <GestorIndiqueGanheSubsecao onVoltar={() => setSubSecao(null)} />
      </div>
    );
  }

  if (gestorRedeLogado() && subSecao === "checkin") {
    return (
      <div className="configuracoes-painel">
        <GestorCheckinDiarioSubsecao onVoltar={() => setSubSecao(null)} />
      </div>
    );
  }
  if (gestorRedeLogado() && subSecao === "gire") {
    return (
      <div className="configuracoes-painel">
        <GestorGireGanheSubsecao onVoltar={() => setSubSecao(null)} />
      </div>
    );
  }

  if (gestorRedeLogado() && subSecao === "redesSociais") {
    return (
      <div className="configuracoes-painel">
        <GestorRedesSociaisSubsecao onVoltar={() => setSubSecao(null)} />
      </div>
    );
  }

  if (gestorRedeLogado() && subSecao === "niveis") {
    return (
      <div className="configuracoes-painel">
        <GestorNiveisClienteSubsecao onVoltar={() => setSubSecao(null)} />
      </div>
    );
  }

  const painelNotificacoes = (
    <>
      <p className="rede-detalhes__ajuda" style={{ marginBottom: 16 }}>
        O envio usa os tokens dos <strong>clientes</strong> (app) vinculados a esta rede, com notificacoes
        permitidas. Texto personalizado abaixo. No celular, o app pode mostrar um dialogo (app aberto) ou
        notificacao na barra (em segundo plano / fechado); ao tocar, o mesmo resumo.
      </p>
      <form className="form-rede" onSubmit={onEnviarTeste}>
        <div className="form-rede__grid form-rede__grid--1col">
          <div>
            <label className="form-rede__label" htmlFor="fcm-titulo">
              Titulo
            </label>
            <input
              id="fcm-titulo"
              className="form-rede__input"
              type="text"
              value={titulo}
              onChange={(ev) => setTitulo(ev.target.value)}
              placeholder="Ex.: Ola da rede"
              maxLength={120}
              autoComplete="off"
            />
          </div>
          <div>
            <label className="form-rede__label" htmlFor="fcm-corpo">
              Corpo (mensagem)
            </label>
            <textarea
              id="fcm-corpo"
              className="form-rede__input"
              rows={4}
              value={corpo}
              onChange={(ev) => setCorpo(ev.target.value)}
              placeholder="Mensagem que o cliente le no celular"
              maxLength={2000}
            />
          </div>
        </div>
        <div className="form-rede__acoes" style={{ marginTop: 16 }}>
          <button className="botao-primario" type="submit" disabled={enviando}>
            {enviando ? "Enviando…" : "Enviar teste a todos os apps da rede"}
          </button>
        </div>
      </form>
    </>
  );

  return (
    <div className="configuracoes-painel">
      {gestorRedeLogado() ? (
        <article className="rede-detalhes__card rede-detalhes__card--tabs">
          <p className="rede-detalhes__kicker" style={{ marginBottom: 4 }}>
            Configuracao da rede no app do cliente: modulos, niveis, ajustes por funcionalidade e teste de push.
          </p>
          <div
            className="rede-detalhes__tabs rede-detalhes__tabs--segmento"
            role="tablist"
            aria-label="Areas de configuracao"
          >
            {ABAS_CONFIG.map((aba) => (
              <button
                key={aba.id}
                type="button"
                role="tab"
                id={`cfg-tab-${aba.id}`}
                aria-selected={abaConfig === aba.id}
                aria-controls={`cfg-painel-${aba.id}`}
                className={`rede-detalhes__tab ${abaConfig === aba.id ? "rede-detalhes__tab--ativa" : ""}`}
                onClick={() => setAbaConfig(aba.id)}
              >
                {aba.label}
              </button>
            ))}
          </div>

          <div
            className="rede-detalhes__painel"
            role="tabpanel"
            id={`cfg-painel-${abaConfig}`}
            aria-labelledby={`cfg-tab-${abaConfig}`}
          >
            {abaConfig === "funcionalidades" ? (
              <>
                <h3 className="configuracoes-painel__titulo-aba">Funcionalidades do app (por rede)</h3>
                <p className="rede-detalhes__ajuda" style={{ marginBottom: 16 }}>
                  Por padrao tudo fica <strong>desligado</strong> no app do cliente. Ative abaixo o que a rede
                  oferecera; em seguida cada recurso tera tela e regras proprias.
                </p>
                {redeCarregada ? (
                  <form className="form-rede" onSubmit={onSalvarModulos}>
                    <div className="form-rede__grid form-rede__grid--1col">
                      <label className="form-rede__checkbox-linha">
                        <input
                          type="checkbox"
                          checked={modIndique}
                          onChange={(ev) => setModIndique(ev.target.checked)}
                        />
                        Indique e ganhe
                      </label>
                      <label className="form-rede__checkbox-linha">
                        <input
                          type="checkbox"
                          checked={modCheckin}
                          onChange={(ev) => setModCheckin(ev.target.checked)}
                        />
                        Check-in diario
                      </label>
                      <label className="form-rede__checkbox-linha">
                        <input
                          type="checkbox"
                          checked={modGire}
                          onChange={(ev) => setModGire(ev.target.checked)}
                        />
                        Gire e ganhe
                      </label>
                      <label className="form-rede__checkbox-linha">
                        <input
                          type="checkbox"
                          checked={modRedesSociais}
                          onChange={(ev) => setModRedesSociais(ev.target.checked)}
                        />
                        Redes sociais
                      </label>
                    </div>
                    <div className="form-rede__acoes" style={{ marginTop: 8 }}>
                      <button className="botao-primario" type="submit" disabled={salvandoModulos}>
                        {salvandoModulos ? "Salvando…" : "Salvar modulos do app"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="rede-detalhes__ajuda">Carregando…</p>
                )}
              </>
            ) : null}

            {abaConfig === "niveis" ? (
              <>
                <h3 className="configuracoes-painel__titulo-aba">Niveis de cliente (moeda e desconto)</h3>
                <p className="rede-detalhes__ajuda" style={{ marginBottom: 12 }}>
                  Bronze, Prata, Ouro, Diamante: multiplicadores <strong>opcionais</strong> no ganho de moedas
                  (cashback, check-in, gire e ganhe) e, se quiser, em descontos. Desligado por padrao; abra a tela
                  para ativar e definir os fatores.
                </p>
                <button type="button" className="botao-secundario" onClick={() => setSubSecao("niveis")}>
                  Configurar niveis e multiplicadores
                </button>
              </>
            ) : null}

            {abaConfig === "ajustes" ? (
              <>
                <h3 className="configuracoes-painel__titulo-aba">Modulos ativos (ajustes)</h3>
                <p className="rede-detalhes__ajuda" style={{ marginBottom: 12 }}>
                  Abra a configuracao de cada funcionalidade <strong>ligada</strong> na aba Funcionalidades.
                </p>
                {redeCarregada ? (
                  <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
                    {modIndique ? (
                      <li>
                        <button
                          type="button"
                          className="botao-secundario"
                          style={{ marginTop: 4 }}
                          onClick={() => setSubSecao("indique")}
                        >
                          Indique e ganhe — regras e premios
                        </button>
                      </li>
                    ) : null}
                    {modCheckin ? (
                      <li>
                        <button
                          type="button"
                          className="botao-secundario"
                          style={{ marginTop: 4 }}
                          onClick={() => setSubSecao("checkin")}
                        >
                          Check-in diario — hora e moedas
                        </button>
                      </li>
                    ) : null}
                    {modGire ? (
                      <li>
                        <button
                          type="button"
                          className="botao-secundario"
                          style={{ marginTop: 4 }}
                          onClick={() => setSubSecao("gire")}
                        >
                          Gire e ganhe — custo, premios e limite
                        </button>
                      </li>
                    ) : null}
                    {modRedesSociais ? (
                      <li>
                        <button
                          type="button"
                          className="botao-secundario"
                          style={{ marginTop: 4 }}
                          onClick={() => setSubSecao("redesSociais")}
                        >
                          Redes sociais — títulos e links
                        </button>
                      </li>
                    ) : null}
                    {!modIndique && !modCheckin && !modGire && !modRedesSociais ? (
                      <li className="rede-detalhes__ajuda">
                        Nenhum modulo ativo. Ative na aba Funcionalidades.
                      </li>
                    ) : null}
                  </ul>
                ) : (
                  <p className="rede-detalhes__ajuda">Carregando…</p>
                )}
              </>
            ) : null}

            {abaConfig === "notificacoes" ? (
              <>
                <h3 className="configuracoes-painel__titulo-aba">Notificacoes no app (FCM)</h3>
                {painelNotificacoes}
              </>
            ) : null}
          </div>
        </article>
      ) : (
        <article className="card-resumo">
          <h3>Notificacoes no app (FCM)</h3>
          {painelNotificacoes}
        </article>
      )}
    </div>
  );
}

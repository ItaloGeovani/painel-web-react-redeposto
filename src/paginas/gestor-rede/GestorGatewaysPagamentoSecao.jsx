import { useCallback, useEffect, useState } from "react";
import {
  obterConfigMercadoPago,
  salvarConfigMercadoPago,
  salvarConfigMercadoPagoPosto,
  salvarGatewayPagamentoModo
} from "../../servicos/mercadopagoGatewayServico";
import { gerentePostoLogado, gestorRedeLogado } from "../../configuracao/painelApi";
import { toastErro, toastSucesso } from "../../servicos/toastServico";

const SUB_MENUS = [
  { id: "mercadopago", rotulo: "Mercado Pago" },
  { id: "em-breve", rotulo: "Outros gateways", desabilitado: true }
];

const MODOS = [
  {
    id: "REDE",
    titulo: "Uma conta para toda a rede",
    desc: "Todos os postos recebem PIX na mesma conta Mercado Pago."
  },
  {
    id: "POSTO",
    titulo: "Conta por posto",
    desc: "Cada unidade tem credenciais proprias; o cliente escolhe o posto na compra do voucher."
  }
];

export default function GestorGatewaysPagamentoSecao() {
  const [subAtivo, setSubAtivo] = useState("mercadopago");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [salvandoModo, setSalvandoModo] = useState(false);
  const [modo, setModo] = useState("REDE");
  const [config, setConfig] = useState(null);
  const [postoEditando, setPostoEditando] = useState(null);

  const ehGestor = gestorRedeLogado();
  const ehGerente = gerentePostoLogado();

  const recarregar = useCallback(async () => {
    setCarregando(true);
    try {
      const d = await obterConfigMercadoPago();
      setConfig(d);
      setModo(d.gateway_pagamento_modo === "POSTO" ? "POSTO" : "REDE");
    } catch (err) {
      toastErro(err.message || "Falha ao carregar configuracao.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  async function alterarModo(novoModo) {
    if (!ehGestor || novoModo === modo) {
      return;
    }
    setSalvandoModo(true);
    try {
      await salvarGatewayPagamentoModo(novoModo);
      setModo(novoModo);
      toastSucesso(
        novoModo === "POSTO" ? "Modo por posto ativado." : "Modo conta unica da rede ativado."
      );
      await recarregar();
    } catch (err) {
      toastErro(err.message || "Falha ao alterar modo.");
    } finally {
      setSalvandoModo(false);
    }
  }

  if (ehGerente && config?.mensagem) {
    return (
      <div className="gateways-pagamento">
        <article className="card-resumo">
          <h3>Mercado Pago</h3>
          <p className="rede-detalhes__ajuda">{config.mensagem}</p>
        </article>
      </div>
    );
  }

  const postoGerente =
    ehGerente && config?.id_posto
      ? {
          id_posto: config.id_posto,
          nome: "Seu posto",
          webhook_url: config.webhook_url,
          mp_access_token_configurado: config.mp_access_token_configurado,
          mp_webhook_secret_configurado: config.mp_webhook_secret_configurado
        }
      : null;

  return (
    <div className="gateways-pagamento">
      <nav className="gateways-pagamento__submenu" aria-label="Gateways">
        {SUB_MENUS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`gateways-pagamento__subitem ${
              subAtivo === item.id ? "gateways-pagamento__subitem--ativo" : ""
            } ${item.desabilitado ? "gateways-pagamento__subitem--desabilitado" : ""}`}
            disabled={item.desabilitado}
            onClick={() => !item.desabilitado && setSubAtivo(item.id)}
          >
            {item.rotulo}
            {item.desabilitado ? <span className="gateways-pagamento__badge">em breve</span> : null}
          </button>
        ))}
      </nav>

      {subAtivo === "mercadopago" ? (
        <article className="card-resumo gateways-pagamento__painel">
          <h3>Mercado Pago</h3>
          <p className="rede-detalhes__ajuda">
            Cadastre a URL do webhook em <strong>Suas integracoes → Webhooks</strong> no Mercado Pago.
          </p>

          {ehGestor ? (
            <section style={{ marginTop: 16 }}>
              <h4 style={{ marginBottom: 8 }}>Modelo de recebimento</h4>
              <div className="form-rede__grid">
                {MODOS.map((m) => (
                  <label
                    key={m.id}
                    className="campo__label"
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                      padding: 12,
                      border:
                        modo === m.id
                          ? "2px solid var(--cor-primaria, #2563eb)"
                          : "1px solid #ddd",
                      borderRadius: 8,
                      cursor: salvandoModo ? "wait" : "pointer"
                    }}
                  >
                    <input
                      type="radio"
                      name="gateway_modo"
                      value={m.id}
                      checked={modo === m.id}
                      disabled={salvandoModo}
                      onChange={() => alterarModo(m.id)}
                    />
                    <span>
                      <strong>{m.titulo}</strong>
                      <br />
                      <span className="rede-detalhes__ajuda">{m.desc}</span>
                    </span>
                  </label>
                ))}
              </div>
            </section>
          ) : null}

          {carregando ? (
            <p>Carregando...</p>
          ) : modo === "REDE" && ehGestor ? (
            <FormCredenciaisRede
              config={config}
              salvando={salvando}
              setSalvando={setSalvando}
              onSalvo={recarregar}
            />
          ) : postoGerente ? (
            <PostoMercadoPagoForm posto={postoGerente} onSalvo={recarregar} />
          ) : (
            <>
              <p className="rede-detalhes__ajuda" style={{ marginTop: 12 }}>
                Configure credenciais e webhook para cada posto.
              </p>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {(config?.postos || []).map((p) => (
                  <li key={p.id_posto} className="card-resumo" style={{ marginBottom: 12, padding: 12 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 8
                      }}
                    >
                      <div>
                        <strong>{p.nome}</strong>
                        {p.codigo ? (
                          <span className="rede-detalhes__ajuda"> · {p.codigo}</span>
                        ) : null}
                        <br />
                        <span className="rede-detalhes__ajuda">
                          {p.mp_access_token_configurado && p.mp_webhook_secret_configurado
                            ? "Configurado"
                            : "Pendente"}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="botao-secundario"
                        onClick={() =>
                          setPostoEditando(postoEditando === p.id_posto ? null : p.id_posto)
                        }
                      >
                        {postoEditando === p.id_posto ? "Fechar" : "Configurar"}
                      </button>
                    </div>
                    {postoEditando === p.id_posto ? (
                      <PostoMercadoPagoForm
                        posto={p}
                        onSalvo={async () => {
                          setPostoEditando(null);
                          await recarregar();
                        }}
                      />
                    ) : null}
                  </li>
                ))}
              </ul>
            </>
          )}
        </article>
      ) : null}
    </div>
  );
}

function FormCredenciaisRede({ config, salvando, setSalvando, onSalvo }) {
  const [accessToken, setAccessToken] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    const at = accessToken.trim();
    const ws = webhookSecret.trim();
    if (!at || !ws) {
      toastErro("Preencha o Access Token e o secret do webhook.");
      return;
    }
    setSalvando(true);
    try {
      await salvarConfigMercadoPago({ mp_access_token: at, mp_webhook_secret: ws });
      toastSucesso("Credenciais da rede salvas.");
      setAccessToken("");
      setWebhookSecret("");
      await onSalvo();
    } catch (err) {
      toastErro(err.message || "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form className="form-rede" style={{ marginTop: 12 }} onSubmit={onSubmit}>
      <p className="rede-detalhes__ajuda">Conta unica: todos os vouchers PIX usam estas credenciais.</p>
      <div className="form-rede__grid">
        <label className="campo__label form-rede__input-span2">
          URL do webhook
          <input
            className="campo__input form-rede__input-span2 campo__input--estatico"
            readOnly
            value={config?.webhook_url || ""}
            onFocus={(e) => e.target.select()}
          />
        </label>
      </div>
      {(config?.mp_access_token_configurado || config?.mp_webhook_secret_configurado) && (
        <p className="rede-detalhes__ajuda">
          Credenciais ja cadastradas (informe token e secret completos para substituir).
        </p>
      )}
      <div className="form-rede__grid" style={{ marginTop: 8 }}>
        <label className="campo__label form-rede__input-span2">
          Access Token
          <input
            className="campo__input form-rede__input-span2"
            type="password"
            autoComplete="off"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
          />
        </label>
        <label className="campo__label form-rede__input-span2">
          Webhook secret
          <input
            className="campo__input form-rede__input-span2"
            type="password"
            autoComplete="off"
            value={webhookSecret}
            onChange={(e) => setWebhookSecret(e.target.value)}
          />
        </label>
      </div>
      <div className="form-rede__acoes">
        <button type="submit" className="botao-primario" disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar Mercado Pago"}
        </button>
      </div>
    </form>
  );
}

function PostoMercadoPagoForm({ posto, onSalvo }) {
  const [accessToken, setAccessToken] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    const at = accessToken.trim();
    const ws = webhookSecret.trim();
    if (!at || !ws) {
      toastErro("Preencha token e secret.");
      return;
    }
    setSalvando(true);
    try {
      await salvarConfigMercadoPagoPosto({
        id_posto: posto.id_posto,
        mp_access_token: at,
        mp_webhook_secret: ws
      });
      toastSucesso(`Mercado Pago salvo para ${posto.nome}.`);
      setAccessToken("");
      setWebhookSecret("");
      await onSalvo();
    } catch (err) {
      toastErro(err.message || "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form className="form-rede" style={{ marginTop: 12 }} onSubmit={onSubmit}>
      <label className="campo__label form-rede__input-span2">
        Webhook deste posto
        <input
          className="campo__input form-rede__input-span2 campo__input--estatico"
          readOnly
          value={posto.webhook_url || ""}
          onFocus={(e) => e.target.select()}
        />
      </label>
      <label className="campo__label form-rede__input-span2">
        Access Token
        <input
          className="campo__input form-rede__input-span2"
          type="password"
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
        />
      </label>
      <label className="campo__label form-rede__input-span2">
        Webhook secret
        <input
          className="campo__input form-rede__input-span2"
          type="password"
          value={webhookSecret}
          onChange={(e) => setWebhookSecret(e.target.value)}
        />
      </label>
      <button type="submit" className="botao-primario" disabled={salvando}>
        {salvando ? "Salvando..." : "Salvar posto"}
      </button>
    </form>
  );
}

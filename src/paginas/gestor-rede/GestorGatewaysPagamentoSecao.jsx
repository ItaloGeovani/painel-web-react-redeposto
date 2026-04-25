import { useCallback, useEffect, useState } from "react";
import { obterConfigMercadoPago, salvarConfigMercadoPago } from "../../servicos/mercadopagoGatewayServico";
import { toastErro, toastSucesso } from "../../servicos/toastServico";

const SUB_MENUS = [
  { id: "mercadopago", rotulo: "Mercado Pago" },
  { id: "em-breve", rotulo: "Outros gateways", desabilitado: true }
];

export default function GestorGatewaysPagamentoSecao() {
  const [subAtivo, setSubAtivo] = useState("mercadopago");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [webhookUrl, setWebhookUrl] = useState("");
  const [tokenConfigurado, setTokenConfigurado] = useState(false);
  const [secretConfigurado, setSecretConfigurado] = useState(false);
  const [tokenMascarado, setTokenMascarado] = useState("");
  const [secretMascarado, setSecretMascarado] = useState("");

  const [accessToken, setAccessToken] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");

  const recarregar = useCallback(async () => {
    setCarregando(true);
    try {
      const d = await obterConfigMercadoPago();
      setWebhookUrl(d.webhook_url || "");
      setTokenConfigurado(!!d.mp_access_token_configurado);
      setSecretConfigurado(!!d.mp_webhook_secret_configurado);
      setTokenMascarado(d.mp_access_token_mascarado || "");
      setSecretMascarado(d.mp_webhook_secret_mascarado || "");
      setAccessToken("");
      setWebhookSecret("");
    } catch (err) {
      toastErro(err.message || "Falha ao carregar configuracao.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

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
      await salvarConfigMercadoPago({
        mp_access_token: at,
        mp_webhook_secret: ws
      });
      toastSucesso("Credenciais Mercado Pago salvas.");
      await recarregar();
    } catch (err) {
      toastErro(err.message || "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

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
            Use as credenciais da sua aplicacao no Mercado Pago (producao ou teste). Cadastre a URL do webhook abaixo em{" "}
            <strong>Suas integracoes → Webhooks</strong> para receber notificacoes de pagamento aprovado.
          </p>

          {carregando ? (
            <p>Carregando...</p>
          ) : (
            <form className="form-rede" onSubmit={onSubmit}>
              <div className="form-rede__grid">
                <label className="campo__label form-rede__input-span2">
                  URL do webhook (copie para o Mercado Pago)
                  <input
                    className="campo__input form-rede__input-span2 campo__input--estatico"
                    readOnly
                    value={webhookUrl || "(defina PUBLIC_BASE_URL no servidor para gerar a URL)"}
                    onFocus={(e) => e.target.select()}
                  />
                </label>
              </div>

              {(tokenConfigurado || secretConfigurado) && (
                <p className="rede-detalhes__ajuda" style={{ marginTop: 8 }}>
                  {tokenConfigurado ? (
                    <>
                      Access token (mascarado): <strong>{tokenMascarado || "****"}</strong>
                    </>
                  ) : null}
                  {tokenConfigurado && secretConfigurado ? " · " : null}
                  {secretConfigurado ? (
                    <>
                      Webhook secret (mascarado): <strong>{secretMascarado || "****"}</strong>
                    </>
                  ) : null}
                </p>
              )}

              <div className="form-rede__grid" style={{ marginTop: 16 }}>
                <label className="campo__label form-rede__input-span2">
                  Access Token (MP_ACCESS_TOKEN)
                  <input
                    className="campo__input form-rede__input-span2"
                    type="password"
                    autoComplete="off"
                    placeholder="Cole o Access Token (producao ou teste)"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                  />
                </label>
                <label className="campo__label form-rede__input-span2">
                  Webhook secret (MP_WEBHOOK_SECRET)
                  <input
                    className="campo__input form-rede__input-span2"
                    type="password"
                    autoComplete="off"
                    placeholder="Cole o secret de validacao do webhook"
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                  />
                </label>
              </div>

              <p className="rede-detalhes__ajuda" style={{ marginTop: 8 }}>
                Ao salvar, ambos os campos sao obrigatorios no servidor. Se ja houver credenciais e voce quiser apenas
                alterar uma delas, informe os dois valores completos novamente.
              </p>

              <div className="form-rede__acoes">
                <button type="submit" className="botao-primario" disabled={salvando}>
                  {salvando ? "Salvando..." : "Salvar Mercado Pago"}
                </button>
                <button type="button" className="botao-secundario" disabled={carregando} onClick={() => recarregar()}>
                  Recarregar
                </button>
              </div>
            </form>
          )}
        </article>
      ) : null}
    </div>
  );
}

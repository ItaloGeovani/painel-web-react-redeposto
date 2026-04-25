import { montarUrlApi } from "../configuracao/apiConfig";
import { gestorRedeLogado } from "../configuracao/painelApi";
import { limparSessao } from "./sessaoServico";

function obterHeadersAutenticados() {
  const token = localStorage.getItem("gaspass_token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}

async function requestAutenticada(caminho, options = {}) {
  const resposta = await fetch(montarUrlApi(caminho), {
    ...options,
    headers: {
      ...obterHeadersAutenticados(),
      ...(options.headers || {})
    }
  });

  const payload = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    const mensagemErro = payload?.erro || "Falha na operacao.";
    if (
      resposta.status === 401 &&
      (String(mensagemErro).toLowerCase().includes("token") ||
        String(mensagemErro).toLowerCase().includes("sessao"))
    ) {
      limparSessao();
      window.dispatchEvent(
        new CustomEvent("gaspass:sessao-expirada", {
          detail: { mensagem: mensagemErro }
        })
      );
    }
    throw new Error(mensagemErro);
  }
  return payload;
}

function prefixoGestor() {
  if (!gestorRedeLogado()) {
    throw new Error("Disponivel apenas para gestor da rede.");
  }
  return "/v1/gestor-rede/dev";
}

/** GET — retorna webhook_url, flags e tokens mascarados. */
export async function obterConfigMercadoPago() {
  return requestAutenticada(`${prefixoGestor()}/mercadopago-gateway`, { method: "GET" });
}

/** PUT — body: { mp_access_token, mp_webhook_secret } */
export async function salvarConfigMercadoPago(body) {
  return requestAutenticada(`${prefixoGestor()}/mercadopago-gateway`, {
    method: "PUT",
    body: JSON.stringify(body)
  });
}

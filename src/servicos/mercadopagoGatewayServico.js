import { montarUrlApi } from "../configuracao/apiConfig";
import { prefixoApiRedeGestorOuGerente } from "../configuracao/painelApi";
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

function prefixo() {
  const p = prefixoApiRedeGestorOuGerente();
  if (!p) {
    throw new Error("Disponivel apenas para gestor ou gerente de posto.");
  }
  return p;
}

/** GET — modo REDE/POSTO, credenciais da rede ou lista de postos. */
export async function obterConfigMercadoPago() {
  return requestAutenticada(`${prefixo()}/mercadopago-gateway`, { method: "GET" });
}

/** PUT — credenciais da rede (modo REDE). */
export async function salvarConfigMercadoPago(body) {
  return requestAutenticada(`${prefixo()}/mercadopago-gateway`, {
    method: "PUT",
    body: JSON.stringify(body)
  });
}

/** PUT — modo de gateway: REDE | POSTO (apenas gestor). */
export async function salvarGatewayPagamentoModo(modo) {
  return requestAutenticada("/v1/gestor-rede/dev/redes/gateway-pagamento-modo", {
    method: "PUT",
    body: JSON.stringify({ gateway_pagamento_modo: modo })
  });
}

/** PUT — credenciais de um posto (modo POSTO). */
export async function salvarConfigMercadoPagoPosto(body) {
  return requestAutenticada(`${prefixo()}/mercadopago-gateway/posto`, {
    method: "PUT",
    body: JSON.stringify(body)
  });
}

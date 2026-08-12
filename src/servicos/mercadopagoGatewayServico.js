import { prefixoApiRedeGestorOuGerente } from "../configuracao/painelApi";
import { apiFetch } from "./apiFetch";

function prefixo() {
  const p = prefixoApiRedeGestorOuGerente();
  if (!p) {
    throw new Error("Disponivel apenas para gestor ou gerente de posto.");
  }
  return p;
}

/** GET — modo REDE/POSTO, credenciais da rede ou lista de postos. */
export async function obterConfigMercadoPago() {
  return apiFetch(`${prefixo()}/mercadopago-gateway`, { method: "GET" });
}

/** PUT — credenciais da rede (modo REDE). */
export async function salvarConfigMercadoPago(body) {
  return apiFetch(`${prefixo()}/mercadopago-gateway`, {
    method: "PUT",
    body: JSON.stringify(body)
  });
}

/** PUT — modo de gateway: REDE | POSTO (apenas gestor). */
export async function salvarGatewayPagamentoModo(modo) {
  return apiFetch("/v1/gestor-rede/dev/redes/gateway-pagamento-modo", {
    method: "PUT",
    body: JSON.stringify({ gateway_pagamento_modo: modo })
  });
}

/** PUT — credenciais de um posto (modo POSTO). */
export async function salvarConfigMercadoPagoPosto(body) {
  return apiFetch(`${prefixo()}/mercadopago-gateway/posto`, {
    method: "PUT",
    body: JSON.stringify(body)
  });
}

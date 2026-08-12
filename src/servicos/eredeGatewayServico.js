import { prefixoApiRedeGestorOuGerente } from "../configuracao/painelApi";
import { apiFetch } from "./apiFetch";

function prefixo() {
  const p = prefixoApiRedeGestorOuGerente();
  if (!p) {
    throw new Error("Disponivel apenas para gestor ou gerente de posto.");
  }
  return p;
}

/** GET — credenciais e.Rede (rede ou postos). */
export async function obterConfigERede() {
  return apiFetch(`${prefixo()}/erede-gateway`, { method: "GET" });
}

/** PUT — credenciais da rede (modo REDE). */
export async function salvarConfigERede(body) {
  return apiFetch(`${prefixo()}/erede-gateway`, {
    method: "PUT",
    body: JSON.stringify(body)
  });
}

/** PUT — credenciais de um posto (modo POSTO). */
export async function salvarConfigERedePosto(body) {
  return apiFetch(`${prefixo()}/erede-gateway/posto`, {
    method: "PUT",
    body: JSON.stringify(body)
  });
}

/** PUT — meios de pagamento de um posto. */
export async function salvarMeiosPosto(body) {
  return apiFetch(`${prefixo()}/postos/gateway-meios`, {
    method: "PUT",
    body: JSON.stringify(body)
  });
}

/** PUT — provedor ativo e meios (apenas gestor). */
export async function salvarGatewayProvedor(body) {
  return apiFetch("/v1/gestor-rede/dev/redes/gateway-provedor", {
    method: "PUT",
    body: JSON.stringify(body)
  });
}

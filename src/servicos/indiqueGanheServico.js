import { gestorRedeLogado } from "../configuracao/painelApi";
import { apiFetch } from "./apiFetch";

/** Apenas gestor. */
export async function buscarIndiqueGanheConfigGestor() {
  if (!gestorRedeLogado()) {
    throw new Error("Apenas o gestor da rede pode acessar.");
  }
  return apiFetch("/v1/gestor-rede/dev/redes/indique-ganhe", { method: "GET" });
}

export async function salvarIndiqueGanheConfigGestor(body) {
  if (!gestorRedeLogado()) {
    throw new Error("Apenas o gestor da rede pode salvar.");
  }
  return apiFetch("/v1/gestor-rede/dev/redes/indique-ganhe", {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}

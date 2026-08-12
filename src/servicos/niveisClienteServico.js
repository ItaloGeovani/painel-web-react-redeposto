import { gestorRedeLogado } from "../configuracao/painelApi";
import { apiFetch } from "./apiFetch";

/** Niveis (Bronze, Prata, …) e multiplicadores — gestor. */
export async function buscarNiveisClienteGestor() {
  if (!gestorRedeLogado()) {
    throw new Error("Apenas o gestor da rede pode acessar.");
  }
  return apiFetch("/v1/gestor-rede/dev/redes/niveis-cliente", { method: "GET" });
}

export async function salvarNiveisClienteGestor(body) {
  if (!gestorRedeLogado()) {
    throw new Error("Apenas o gestor da rede pode salvar.");
  }
  return apiFetch("/v1/gestor-rede/dev/redes/niveis-cliente", {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}

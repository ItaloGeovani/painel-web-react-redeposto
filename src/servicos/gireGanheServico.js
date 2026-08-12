import { gestorRedeLogado } from "../configuracao/painelApi";
import { apiFetch } from "./apiFetch";

export async function buscarGireGanheConfigGestor() {
  if (!gestorRedeLogado()) throw new Error("Apenas o gestor da rede pode acessar.");
  return apiFetch("/v1/gestor-rede/dev/redes/gire-ganhe", { method: "GET" });
}

export async function salvarGireGanheConfigGestor(body) {
  if (!gestorRedeLogado()) throw new Error("Apenas o gestor da rede pode salvar.");
  return apiFetch("/v1/gestor-rede/dev/redes/gire-ganhe", {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}

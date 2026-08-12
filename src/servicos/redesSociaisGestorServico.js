import { gestorRedeLogado } from "../configuracao/painelApi";
import { apiFetch } from "./apiFetch";

export async function buscarRedesSociaisGestor() {
  if (!gestorRedeLogado()) throw new Error("Apenas o gestor da rede pode acessar.");
  return apiFetch("/v1/gestor-rede/dev/redes/redes-sociais", { method: "GET" });
}

export async function salvarRedesSociaisGestor(body) {
  if (!gestorRedeLogado()) throw new Error("Apenas o gestor da rede pode salvar.");
  return apiFetch("/v1/gestor-rede/dev/redes/redes-sociais", {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}

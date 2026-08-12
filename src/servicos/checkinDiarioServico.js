import { gestorRedeLogado } from "../configuracao/painelApi";
import { apiFetch } from "./apiFetch";

export async function buscarCheckinDiarioConfigGestor() {
  if (!gestorRedeLogado()) {
    throw new Error("Apenas o gestor da rede pode acessar.");
  }
  return apiFetch("/v1/gestor-rede/dev/redes/checkin-diario", { method: "GET" });
}

export async function salvarCheckinDiarioConfigGestor(body) {
  if (!gestorRedeLogado()) {
    throw new Error("Apenas o gestor da rede pode salvar.");
  }
  return apiFetch("/v1/gestor-rede/dev/redes/checkin-diario", {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}

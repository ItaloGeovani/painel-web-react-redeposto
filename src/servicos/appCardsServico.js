import { prefixoApiRedeGestorOuGerente } from "../configuracao/painelApi";
import { apiFetch } from "./apiFetch";

function prefixo() {
  const p = prefixoApiRedeGestorOuGerente();
  if (!p) {
    throw new Error("Operacao disponivel apenas para gestor ou gerente.");
  }
  return p;
}

export async function listarAppCardsRede() {
  const dados = await apiFetch(`${prefixo()}/app-cards`, { method: "GET" });
  return dados?.cards ?? null;
}

export async function salvarAppCardsRede(payloadCards) {
  const dados = await apiFetch(`${prefixo()}/app-cards`, {
    method: "PUT",
    body: JSON.stringify({ cards: payloadCards })
  });
  return dados?.cards ?? null;
}

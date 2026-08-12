import { prefixoApiRedeGestorOuGerente } from "../configuracao/painelApi";
import { apiFetch } from "./apiFetch";

export async function obterResumoRelatoriosGestor() {
  const prefixo = prefixoApiRedeGestorOuGerente();
  if (!prefixo) {
    throw new Error("Relatorios disponiveis apenas para gestor, gerente de posto ou frentista.");
  }
  const dados = await apiFetch(`${prefixo}/relatorios/resumo`, {
    method: "GET"
  });
  return dados?.resumo ?? null;
}

export async function listarAuditoriaGestor({ limite = 50, offset = 0 } = {}) {
  const params = new URLSearchParams({
    limite: String(limite),
    offset: String(offset)
  });
  const prefixo = prefixoApiRedeGestorOuGerente();
  if (!prefixo) {
    throw new Error("Auditoria disponivel apenas para gestor ou gerente de posto.");
  }
  const dados = await apiFetch(`${prefixo}/auditoria/listar?${params.toString()}`, {
    method: "GET"
  });
  return {
    itens: dados?.itens ?? [],
    total: dados?.total ?? 0,
    limite: dados?.limite ?? limite,
    offset: dados?.offset ?? offset
  };
}

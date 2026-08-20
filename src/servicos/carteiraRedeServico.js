import { prefixoApiRedeGestorOuGerente } from "../configuracao/painelApi";
import { apiFetch } from "./apiFetch";

/**
 * Lista clientes da rede com saldo da moeda virtual (ranking).
 * Gestor/gerente: sessão da rede. Admin: exige idRede.
 *
 * @param {object} [opcoes]
 * @param {string} [opcoes.idRede] obrigatório no painel admin
 * @param {number} [opcoes.limite]
 * @param {number} [opcoes.offset]
 * @param {string} [opcoes.q]
 * @param {string} [opcoes.ordenar] saldo_desc|saldo_asc|nome|acesso|desde
 */
export async function listarClientesCarteiraRede(opcoes = {}) {
  const limite = opcoes.limite != null ? Number(opcoes.limite) : 50;
  const offset = opcoes.offset != null ? Number(opcoes.offset) : 0;
  const params = new URLSearchParams({
    limite: String(limite),
    offset: String(offset),
    ordenar: String(opcoes.ordenar || "saldo_desc")
  });
  if (opcoes.q) {
    params.set("q", String(opcoes.q).trim());
  }

  const prefixo = prefixoApiRedeGestorOuGerente();
  let path;
  if (prefixo) {
    path = `${prefixo}/clientes/carteira?${params.toString()}`;
  } else {
    if (!opcoes.idRede) {
      throw new Error("id_rede obrigatório para listar clientes da carteira.");
    }
    params.set("id_rede", String(opcoes.idRede));
    path = `/v1/admin/clientes/dev/carteira?${params.toString()}`;
  }

  const dados = await apiFetch(path, { method: "GET" });
  return {
    itens: dados?.itens || [],
    total: Number(dados?.total ?? 0),
    limite: Number(dados?.limite ?? limite),
    offset: Number(dados?.offset ?? offset),
    ordenar: dados?.ordenar || opcoes.ordenar || "saldo_desc",
    moeda_virtual_nome: dados?.moeda_virtual_nome || ""
  };
}

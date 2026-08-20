import { prefixoApiRedeGestorOuGerente } from "../configuracao/painelApi";
import { apiFetch } from "./apiFetch";

function prefixoGestorGerenteObrigatorio() {
  const p = prefixoApiRedeGestorOuGerente();
  if (!p) {
    throw new Error("Apenas gestor da rede ou gerente de posto podem gerenciar combustiveis.");
  }
  return p;
}

export async function listarCombustiveisRede(idPosto) {
  const prefixo = prefixoGestorGerenteObrigatorio();
  const q = new URLSearchParams();
  if (idPosto) {
    q.set("id_posto", String(idPosto));
  }
  const qs = q.toString();
  const dados = await apiFetch(`${prefixo}/combustiveis/listar${qs ? `?${qs}` : ""}`, {
    method: "GET"
  });
  return dados?.itens || [];
}

export async function criarCombustivelRede(payload) {
  const prefixo = prefixoGestorGerenteObrigatorio();
  const dados = await apiFetch(`${prefixo}/combustiveis/criar`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return dados?.combustivel;
}

export async function editarCombustivelRede(payload) {
  const prefixo = prefixoGestorGerenteObrigatorio();
  const dados = await apiFetch(`${prefixo}/combustiveis/editar`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
  return dados?.combustivel;
}

export async function excluirCombustivelRede(id) {
  const prefixo = prefixoGestorGerenteObrigatorio();
  const q = new URLSearchParams({ id: String(id) });
  await apiFetch(`${prefixo}/combustiveis/excluir?${q.toString()}`, {
    method: "DELETE"
  });
}

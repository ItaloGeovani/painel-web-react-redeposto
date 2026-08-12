import { gestorRedeLogado } from "../configuracao/painelApi";
import { apiFetch } from "./apiFetch";

export async function criarGestorRede(payload) {
  const dados = await apiFetch("/v1/admin/gestores-rede/dev/criar", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return dados;
}

export async function listarGestoresRede() {
  const path = gestorRedeLogado()
    ? "/v1/gestor-rede/dev/gestores"
    : "/v1/admin/gestores-rede/dev/listar";
  const dados = await apiFetch(path, {
    method: "GET"
  });
  return dados?.itens || [];
}

export async function editarGestorRede(payload) {
  const dados = await apiFetch("/v1/admin/gestores-rede/dev/editar", {
    method: "PUT",
    body: JSON.stringify(payload)
  });
  return dados;
}

import { prefixoApiRedeGestorOuGerente } from "../configuracao/painelApi";
import { apiFetch } from "./apiFetch";

export async function listarPostosRede(idRede) {
  const prefixo = prefixoApiRedeGestorOuGerente();
  const path = prefixo
    ? `${prefixo}/postos/listar`
    : `/v1/admin/postos/dev/listar?${new URLSearchParams({ id_rede: idRede }).toString()}`;
  const dados = await apiFetch(path, {
    method: "GET"
  });
  return dados?.itens || [];
}

export async function criarPostoRede(payload) {
  const prefixo = prefixoApiRedeGestorOuGerente();
  const path = prefixo
    ? `${prefixo}/postos/criar`
    : "/v1/admin/postos/dev/criar";
  const dados = await apiFetch(path, {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return dados?.posto;
}

export async function editarPostoRede(payload) {
  const prefixo = prefixoApiRedeGestorOuGerente();
  const path = prefixo
    ? `${prefixo}/postos/editar`
    : "/v1/admin/postos/dev/editar";
  const dados = await apiFetch(path, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
  return dados?.posto;
}

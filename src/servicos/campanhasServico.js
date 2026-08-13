import { prefixoApiRedeGestorOuGerente } from "../configuracao/painelApi";
import { apiFetch } from "./apiFetch";

export async function listarCampanhasRede(idRede) {
  const prefixo = prefixoApiRedeGestorOuGerente();
  const path = prefixo
    ? `${prefixo}/campanhas/listar`
    : `/v1/admin/campanhas/dev/listar?${new URLSearchParams({ id_rede: idRede }).toString()}`;
  const dados = await apiFetch(path, {
    method: "GET"
  });
  return dados?.itens || [];
}

export async function criarCampanhaRede(payload) {
  const prefixo = prefixoApiRedeGestorOuGerente();
  const path = prefixo
    ? `${prefixo}/campanhas/criar`
    : "/v1/admin/campanhas/dev/criar";
  return apiFetch(path, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function editarCampanhaRede(payload) {
  const prefixo = prefixoApiRedeGestorOuGerente();
  const path = prefixo
    ? `${prefixo}/campanhas/editar`
    : "/v1/admin/campanhas/dev/editar";
  return apiFetch(path, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

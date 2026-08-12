import { prefixoApiRedeGestorOuGerente } from "../configuracao/painelApi";
import { apiFetch } from "./apiFetch";

export async function listarPremiosRede(idRede) {
  const prefixo = prefixoApiRedeGestorOuGerente();
  const path = prefixo
    ? `${prefixo}/premios/listar`
    : `/v1/admin/premios/dev/listar?${new URLSearchParams({ id_rede: idRede }).toString()}`;
  const dados = await apiFetch(path, {
    method: "GET"
  });
  return dados?.itens || [];
}

export async function criarPremioRede(payload) {
  const prefixo = prefixoApiRedeGestorOuGerente();
  const path = prefixo
    ? `${prefixo}/premios/criar`
    : "/v1/admin/premios/dev/criar";
  const dados = await apiFetch(path, {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return dados?.premio;
}

export async function editarPremioRede(payload) {
  const prefixo = prefixoApiRedeGestorOuGerente();
  const path = prefixo
    ? `${prefixo}/premios/editar`
    : "/v1/admin/premios/dev/editar";
  await apiFetch(path, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

function pathResgates(acao, idRede, query = {}) {
  const prefixo = prefixoApiRedeGestorOuGerente();
  const qs = new URLSearchParams(query);
  if (!prefixo && idRede) {
    qs.set("id_rede", idRede);
  }
  const q = qs.toString();
  if (prefixo) {
    return `${prefixo}/premios/resgates/${acao}${q ? `?${q}` : ""}`;
  }
  return `/v1/admin/premios/dev/resgates/${acao}${q ? `?${q}` : ""}`;
}

export async function listarPremioResgates(idRede, { status } = {}) {
  const dados = await apiFetch(pathResgates("listar", idRede, status ? { status } : {}), {
    method: "GET"
  });
  return { itens: dados?.itens || [], total: dados?.total ?? 0 };
}

export async function entregarPremioResgate(id, idRede) {
  const body = { id };
  if (idRede) body.id_rede = idRede;
  return apiFetch(pathResgates("entregar", idRede), {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function cancelarPremioResgate(id, idRede, motivo = "") {
  const body = { id, motivo };
  if (idRede) body.id_rede = idRede;
  return apiFetch(pathResgates("cancelar", idRede), {
    method: "POST",
    body: JSON.stringify(body)
  });
}

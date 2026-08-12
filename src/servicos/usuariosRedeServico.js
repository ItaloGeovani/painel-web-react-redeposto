import { prefixoApiRedeGestorOuGerente } from "../configuracao/painelApi";
import { apiFetch } from "./apiFetch";

/** Opcoes: limite, offset, papeis (lista separada por virgula, ex. gerente_posto,frentista). */
export async function listarUsuariosRede(idRede, opcoes = {}) {
  const limite = opcoes.limite != null ? Number(opcoes.limite) : 20;
  const offset = opcoes.offset != null ? Number(opcoes.offset) : 0;
  const params = new URLSearchParams({
    limite: String(limite),
    offset: String(offset)
  });
  if (!prefixoApiRedeGestorOuGerente()) {
    params.set("id_rede", idRede);
  }
  if (opcoes.papeis) {
    params.set("papeis", String(opcoes.papeis));
  }
  if (opcoes.id_posto) {
    params.set("id_posto", String(opcoes.id_posto));
  }
  const prefixo = prefixoApiRedeGestorOuGerente();
  const path = prefixo
    ? `${prefixo}/usuarios-rede/listar?${params.toString()}`
    : `/v1/admin/usuarios-rede/dev/listar?${params.toString()}`;
  const dados = await apiFetch(path, {
    method: "GET"
  });
  return {
    itens: dados?.itens || [],
    total: Number(dados?.total ?? 0),
    limite: Number(dados?.limite ?? limite),
    offset: Number(dados?.offset ?? offset)
  };
}

/** Cria gerente de posto ou frentista na rede (admin global). */
export async function criarUsuarioEquipe(payload) {
  const prefixo = prefixoApiRedeGestorOuGerente();
  const path = prefixo
    ? `${prefixo}/usuarios-rede/criar-equipe`
    : "/v1/admin/usuarios-rede/dev/criar-equipe";
  const dados = await apiFetch(path, {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return dados?.usuario;
}

/** Atualiza gerente de posto ou frentista (nome, email, telefone, papel, posto, ativo, senha opcional). */
export async function editarUsuarioEquipe(payload) {
  const prefixo = prefixoApiRedeGestorOuGerente();
  const path = prefixo
    ? `${prefixo}/usuarios-rede/editar-equipe`
    : "/v1/admin/usuarios-rede/dev/editar-equipe";
  const dados = await apiFetch(path, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
  return dados?.usuario;
}

/** Ultima atividade no app (heartbeat); gestor ou gerente. */
export async function listarPresencaAppClientes(opcoes = {}) {
  const prefixo = prefixoApiRedeGestorOuGerente();
  if (!prefixo) {
    throw new Error("Disponivel apenas para gestor ou gerente de posto.");
  }
  const limite = opcoes.limite != null ? Number(opcoes.limite) : 200;
  const minutosOnline =
    opcoes.minutos_online != null ? Number(opcoes.minutos_online) : 15;
  const params = new URLSearchParams({
    limite: String(limite),
    minutos_online: String(minutosOnline)
  });
  return apiFetch(`${prefixo}/clientes/presenca-app?${params.toString()}`, {
    method: "GET"
  });
}

import { montarUrlApi } from "../configuracao/apiConfig";
import { limparSessao } from "./sessaoServico";

function obterHeadersAutenticados() {
  const token = localStorage.getItem("gaspass_token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}

async function requestAutenticada(caminho, options = {}) {
  const resposta = await fetch(montarUrlApi(caminho), {
    ...options,
    headers: {
      ...obterHeadersAutenticados(),
      ...(options.headers || {})
    }
  });

  const payload = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    const mensagemErro = payload?.erro || "Falha na operacao.";
    if (resposta.status === 401 && ehErroAutenticacao(mensagemErro)) {
      limparSessao();
      window.dispatchEvent(
        new CustomEvent("gaspass:sessao-expirada", {
          detail: { mensagem: mensagemErro }
        })
      );
    }
    throw new Error(mensagemErro);
  }
  return payload;
}

function ehErroAutenticacao(mensagem) {
  const texto = String(mensagem || "").toLowerCase();
  return texto.includes("token invalido") || texto.includes("sessao expirada") || texto.includes("token ausente");
}

/** Opcoes: limite, offset, papeis (lista separada por virgula, ex. gerente_posto,frentista). */
export async function listarUsuariosRede(idRede, opcoes = {}) {
  const limite = opcoes.limite != null ? Number(opcoes.limite) : 20;
  const offset = opcoes.offset != null ? Number(opcoes.offset) : 0;
  const params = new URLSearchParams({
    id_rede: idRede,
    limite: String(limite),
    offset: String(offset)
  });
  if (opcoes.papeis) {
    params.set("papeis", String(opcoes.papeis));
  }
  if (opcoes.id_posto) {
    params.set("id_posto", String(opcoes.id_posto));
  }
  const dados = await requestAutenticada(`/v1/admin/usuarios-rede/dev/listar?${params.toString()}`, {
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
  const dados = await requestAutenticada("/v1/admin/usuarios-rede/dev/criar-equipe", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return dados?.usuario;
}

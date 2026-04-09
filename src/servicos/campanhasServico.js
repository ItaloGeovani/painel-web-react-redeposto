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
    const detalhe = payload?.detalhe;
    const textoCompleto =
      detalhe && String(detalhe).trim() ? `${mensagemErro} (${detalhe})` : mensagemErro;
    if (resposta.status === 401 && ehErroAutenticacao(mensagemErro)) {
      limparSessao();
      window.dispatchEvent(
        new CustomEvent("gaspass:sessao-expirada", {
          detail: { mensagem: mensagemErro }
        })
      );
    }
    throw new Error(textoCompleto);
  }
  return payload;
}

function ehErroAutenticacao(mensagem) {
  const texto = String(mensagem || "").toLowerCase();
  return texto.includes("token invalido") || texto.includes("sessao expirada") || texto.includes("token ausente");
}

export async function listarCampanhasRede(idRede) {
  const params = new URLSearchParams({ id_rede: idRede });
  const dados = await requestAutenticada(`/v1/admin/campanhas/dev/listar?${params.toString()}`, {
    method: "GET"
  });
  return dados?.itens || [];
}

export async function criarCampanhaRede(payload) {
  const dados = await requestAutenticada("/v1/admin/campanhas/dev/criar", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return dados?.campanha;
}

export async function editarCampanhaRede(payload) {
  await requestAutenticada("/v1/admin/campanhas/dev/editar", {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

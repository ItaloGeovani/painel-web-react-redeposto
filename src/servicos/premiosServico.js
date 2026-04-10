import { montarUrlApi } from "../configuracao/apiConfig";
import { prefixoApiRedeGestorOuGerente } from "../configuracao/painelApi";
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

export async function listarPremiosRede(idRede) {
  const prefixo = prefixoApiRedeGestorOuGerente();
  const path = prefixo
    ? `${prefixo}/premios/listar`
    : `/v1/admin/premios/dev/listar?${new URLSearchParams({ id_rede: idRede }).toString()}`;
  const dados = await requestAutenticada(path, {
    method: "GET"
  });
  return dados?.itens || [];
}

export async function criarPremioRede(payload) {
  const prefixo = prefixoApiRedeGestorOuGerente();
  const path = prefixo
    ? `${prefixo}/premios/criar`
    : "/v1/admin/premios/dev/criar";
  const dados = await requestAutenticada(path, {
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
  await requestAutenticada(path, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

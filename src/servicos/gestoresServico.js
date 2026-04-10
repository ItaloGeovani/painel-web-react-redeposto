import { montarUrlApi } from "../configuracao/apiConfig";
import { gestorRedeLogado } from "../configuracao/painelApi";
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

export async function criarGestorRede(payload) {
  const dados = await requestAutenticada("/v1/admin/gestores-rede/dev/criar", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return dados;
}

export async function listarGestoresRede() {
  const path = gestorRedeLogado()
    ? "/v1/gestor-rede/dev/gestores"
    : "/v1/admin/gestores-rede/dev/listar";
  const dados = await requestAutenticada(path, {
    method: "GET"
  });
  return dados?.itens || [];
}

export async function editarGestorRede(payload) {
  const dados = await requestAutenticada("/v1/admin/gestores-rede/dev/editar", {
    method: "PUT",
    body: JSON.stringify(payload)
  });
  return dados;
}

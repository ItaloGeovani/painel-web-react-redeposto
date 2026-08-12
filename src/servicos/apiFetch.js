import { montarUrlApi } from "../configuracao/apiConfig";
import { limparSessao } from "./sessaoServico";

export function obterToken() {
  return localStorage.getItem("gaspass_token");
}

export function obterHeadersAutenticados(extras = {}) {
  const token = obterToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...extras
  };
}

function ehErroAutenticacao(mensagem) {
  const texto = String(mensagem || "").toLowerCase();
  return (
    texto.includes("token invalido") ||
    texto.includes("sessao expirada") ||
    texto.includes("token ausente")
  );
}

function dispararSessaoExpirada(mensagem) {
  limparSessao();
  window.dispatchEvent(
    new CustomEvent("gaspass:sessao-expirada", {
      detail: { mensagem }
    })
  );
}

function tratarRespostaNaoOk(resposta, payload, mensagemPadrao) {
  const mensagemErro = payload?.erro || mensagemPadrao || "Falha na operacao.";
  const detalhe = payload?.detalhe;
  const textoCompleto =
    detalhe && String(detalhe).trim() ? `${mensagemErro} (${detalhe})` : mensagemErro;

  if (resposta.status === 401 && ehErroAutenticacao(mensagemErro)) {
    dispararSessaoExpirada(mensagemErro);
  }

  throw new Error(textoCompleto);
}

/**
 * Fetch autenticado JSON. Retorna o payload parseado.
 * Em 401 de autenticacao, limpa sessao e dispara gaspass:sessao-expirada.
 */
export async function apiFetch(caminho, options = {}) {
  const { headers: headersExtras, ...rest } = options;
  const resposta = await fetch(montarUrlApi(caminho), {
    ...rest,
    headers: {
      ...obterHeadersAutenticados(),
      ...(headersExtras || {})
    }
  });

  const payload = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    tratarRespostaNaoOk(resposta, payload);
  }
  return payload;
}

/**
 * Fetch autenticado sem Content-Type JSON (ex.: FormData / upload).
 * Nao define Content-Type para o browser definir o boundary do multipart.
 */
export async function apiFetchFormData(caminho, formData, options = {}) {
  const token = obterToken();
  const { headers: headersExtras, ...rest } = options;
  const resposta = await fetch(montarUrlApi(caminho), {
    method: "POST",
    ...rest,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(headersExtras || {})
    },
    body: formData
  });

  const payload = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    tratarRespostaNaoOk(resposta, payload, "Falha no upload.");
  }
  return payload;
}

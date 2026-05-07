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

function ehErroAutenticacao(mensagem) {
  const texto = String(mensagem || "").toLowerCase();
  return texto.includes("token invalido") || texto.includes("sessao expirada") || texto.includes("token ausente");
}

/**
 * Envia notificacao de teste a todos os clientes (apps com token) da rede.
 * @param {{ titulo?: string, corpo?: string }} payload
 */
export async function enviarTesteDePushRede({ titulo = "", corpo = "" } = {}) {
  const prefixo = prefixoApiRedeGestorOuGerente();
  if (!prefixo) {
    throw new Error("Apenas gestor da rede ou gerente de posto podem testar o push (menu Configuracoes).");
  }
  const url = `${prefixo}/push/fcm/rede/teste`;
  const resposta = await fetch(montarUrlApi(url), {
    method: "POST",
    headers: obterHeadersAutenticados(),
    body: JSON.stringify({
      titulo: String(titulo || "").trim(),
      corpo: String(corpo || "").trim()
    })
  });
  const payload = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    const m = payload?.erro || "Falha no envio do teste.";
    if (resposta.status === 401 && ehErroAutenticacao(m)) {
      limparSessao();
      window.dispatchEvent(
        new CustomEvent("gaspass:sessao-expirada", { detail: { mensagem: m } })
      );
    }
    throw new Error(m);
  }
  return {
    ok: true,
    enviados: payload?.enviados ?? 0,
    falhas: payload?.falhas ?? 0,
    tokensTentado: payload?.tokens_tentado ?? 0
  };
}

/**
 * GET diagnostico FCM da rede da sessao: contagens de tokens, se FCM_SA esta configurado no servidor, etc.
 */
export async function buscarDiagnosticoPushRede() {
  const prefixo = prefixoApiRedeGestorOuGerente();
  if (!prefixo) {
    throw new Error("Apenas gestor da rede ou gerente de posto podem ver o diagnostico push.");
  }
  const url = `${prefixo}/push/diagnostico`;
  const resposta = await fetch(montarUrlApi(url), {
    method: "GET",
    headers: obterHeadersAutenticados()
  });
  const payload = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    const m = payload?.erro || "Falha ao obter diagnostico.";
    if (resposta.status === 401 && ehErroAutenticacao(m)) {
      limparSessao();
      window.dispatchEvent(
        new CustomEvent("gaspass:sessao-expirada", { detail: { mensagem: m } })
      );
    }
    throw new Error(m);
  }
  return payload;
}

import { URL_BASE_API } from "../configuracao/apiConfig";

/**
 * Converte erros de rede/fetch genéricos em mensagem útil (PT).
 * Mantém mensagens já vindas da API (campo erro/detalhe).
 */
export function mensagemErroAmigavel(err, { contexto } = {}) {
  const raw = String(err?.message || err || "").trim();
  const lower = raw.toLowerCase();
  const base = URL_BASE_API || "(mesma origem)";

  if (
    lower === "failed to fetch" ||
    lower.includes("networkerror") ||
    lower.includes("network request failed") ||
    lower.includes("load failed") ||
    lower.includes("fetch failed") ||
    lower.includes("err_connection") ||
    lower.includes("econnrefused") ||
    lower.includes("enotfound")
  ) {
    return (
      `Sem conexão com a API em ${base}. ` +
      `Confira se o servidor está rodando e se VITE_API_URL está correto` +
      (contexto ? ` (${contexto})` : "") +
      "."
    );
  }

  if (lower.includes("aborted") || lower.includes("timeout") || lower.includes("timed out")) {
    return `Tempo esgotado ao falar com a API (${base}).`;
  }

  if (lower.includes("ssl") || lower.includes("certificate") || lower.includes("certificado")) {
    return `Falha de certificado SSL ao acessar ${base}.`;
  }

  return raw || contexto || "Erro inesperado.";
}

/** Monta texto a partir de resposta HTTP + JSON `{ erro, detalhe }`. */
export function mensagemErroHttp(resposta, payload, padrao = "Falha na operação.") {
  const status = resposta?.status;
  const erro = payload?.erro || padrao;
  const detalhe = payload?.detalhe ? String(payload.detalhe).trim() : "";
  const partes = [erro];
  if (detalhe) partes.push(detalhe);
  if (status && !String(erro).includes(String(status))) {
    partes.push(`HTTP ${status}`);
  }
  return partes.join(" — ");
}

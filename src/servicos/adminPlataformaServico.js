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
    const texto = String(mensagemErro || "").toLowerCase();
    if (
      resposta.status === 401 &&
      (texto.includes("token invalido") || texto.includes("sessao expirada") || texto.includes("token ausente"))
    ) {
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

export async function obterResumoRelatoriosPlataforma() {
  const dados = await requestAutenticada("/v1/admin/relatorios/resumo", { method: "GET" });
  return dados?.resumo || null;
}

export async function listarAuditoriaPlataforma({ limite = 50, offset = 0, idRede = "" } = {}) {
  const params = new URLSearchParams({
    limite: String(limite),
    offset: String(offset)
  });
  if (String(idRede || "").trim()) {
    params.set("id_rede", String(idRede).trim());
  }
  const dados = await requestAutenticada(`/v1/admin/auditoria/listar?${params.toString()}`, {
    method: "GET"
  });
  return {
    itens: dados?.itens ?? [],
    total: dados?.total ?? 0,
    limite: dados?.limite ?? limite,
    offset: dados?.offset ?? offset
  };
}

export async function obterConfiguracaoSistema() {
  const dados = await requestAutenticada("/v1/admin/sistema/configuracao", { method: "GET" });
  return dados?.configuracao || null;
}

export async function obterConfigAppMobile() {
  const dados = await requestAutenticada("/v1/admin/app-mobile/versao", { method: "GET" });
  return dados?.configuracao || null;
}

export async function salvarConfigAppMobile(payload) {
  const dados = await requestAutenticada("/v1/admin/app-mobile/versao", {
    method: "PUT",
    body: JSON.stringify(payload)
  });
  return dados?.configuracao || null;
}

/** Versoes e URLs do app de cliente **desta rede** (sobrescrevem a configuracao global). */
export async function obterConfigAppMobileRede(idRede) {
  const p = new URLSearchParams({ id_rede: String(idRede || "").trim() });
  const dados = await requestAutenticada(`/v1/admin/redes/dev/app-versao?${p.toString()}`, { method: "GET" });
  return {
    configuracaoRede: dados?.configuracao_rede || null,
    possuiSobrescritura: Boolean(dados?.possui_sobrescritura),
    configuracaoGlobal: dados?.configuracao_global || null
  };
}

export async function salvarConfigAppMobileRede(payload) {
  const dados = await requestAutenticada("/v1/admin/redes/dev/app-versao", {
    method: "PUT",
    body: JSON.stringify(payload)
  });
  return {
    configuracaoRede: dados?.configuracao_rede || null,
    possuiSobrescritura: true,
    configuracaoGlobal: dados?.configuracao_global || null
  };
}

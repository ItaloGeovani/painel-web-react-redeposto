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
    if (
      resposta.status === 401 &&
      (String(mensagemErro).toLowerCase().includes("token") ||
        String(mensagemErro).toLowerCase().includes("sessao"))
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

function prefixo() {
  const p = prefixoApiRedeGestorOuGerente();
  if (!p) {
    throw new Error("Operacao disponivel apenas para gestor ou gerente.");
  }
  return p;
}

export async function listarAppCardsRede() {
  const dados = await requestAutenticada(`${prefixo()}/app-cards`, { method: "GET" });
  return dados?.cards ?? null;
}

export async function salvarAppCardsRede(payloadCards) {
  const dados = await requestAutenticada(`${prefixo()}/app-cards`, {
    method: "PUT",
    body: JSON.stringify({ cards: payloadCards })
  });
  return dados?.cards ?? null;
}

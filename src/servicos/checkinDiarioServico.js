import { montarUrlApi } from "../configuracao/apiConfig";
import { limparSessao } from "./sessaoServico";
import { gestorRedeLogado } from "../configuracao/painelApi";

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
    const msg = payload?.erro || "Falha na operacao.";
    if (resposta.status === 401) {
      limparSessao();
      window.dispatchEvent(new CustomEvent("gaspass:sessao-expirada", { detail: { mensagem: msg } }));
    }
    throw new Error(msg);
  }
  return payload;
}

export async function buscarCheckinDiarioConfigGestor() {
  if (!gestorRedeLogado()) {
    throw new Error("Apenas o gestor da rede pode acessar.");
  }
  return requestAutenticada("/v1/gestor-rede/dev/redes/checkin-diario", { method: "GET" });
}

export async function salvarCheckinDiarioConfigGestor(body) {
  if (!gestorRedeLogado()) {
    throw new Error("Apenas o gestor da rede pode salvar.");
  }
  return requestAutenticada("/v1/gestor-rede/dev/redes/checkin-diario", {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}

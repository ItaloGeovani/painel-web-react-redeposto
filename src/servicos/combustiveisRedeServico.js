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

function prefixoGestorGerenteObrigatorio() {
  const p = prefixoApiRedeGestorOuGerente();
  if (!p) {
    throw new Error("Apenas gestor da rede ou gerente de posto podem gerenciar combustiveis.");
  }
  return p;
}

export async function listarCombustiveisRede() {
  const prefixo = prefixoGestorGerenteObrigatorio();
  const dados = await requestAutenticada(`${prefixo}/combustiveis/listar`, { method: "GET" });
  return dados?.itens || [];
}

export async function criarCombustivelRede(payload) {
  const prefixo = prefixoGestorGerenteObrigatorio();
  const dados = await requestAutenticada(`${prefixo}/combustiveis/criar`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return dados?.combustivel;
}

export async function editarCombustivelRede(payload) {
  const prefixo = prefixoGestorGerenteObrigatorio();
  const dados = await requestAutenticada(`${prefixo}/combustiveis/editar`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
  return dados?.combustivel;
}

export async function excluirCombustivelRede(id) {
  const prefixo = prefixoGestorGerenteObrigatorio();
  const q = new URLSearchParams({ id: String(id) });
  await requestAutenticada(`${prefixo}/combustiveis/excluir?${q.toString()}`, {
    method: "DELETE"
  });
}

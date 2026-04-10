import { montarUrlApi } from "../configuracao/apiConfig";
import {
  frentistaLogado,
  gestorRedeLogado,
  gerentePostoLogado,
  prefixoApiRedeGestorOuGerente
} from "../configuracao/painelApi";
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

export async function listarRedes() {
  const dados = await requestAutenticada("/v1/admin/redes/dev/listar", {
    method: "GET"
  });
  return dados?.itens || [];
}

export async function criarRede(payload) {
  const dados = await requestAutenticada("/v1/admin/redes/dev/criar", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return dados?.rede;
}

export async function editarRede(payload) {
  const dados = await requestAutenticada("/v1/admin/redes/dev/editar", {
    method: "PUT",
    body: JSON.stringify(payload)
  });
  return dados?.rede;
}

export async function ativarRede(id) {
  const dados = await requestAutenticada("/v1/admin/redes/dev/ativar", {
    method: "PATCH",
    body: JSON.stringify({ id })
  });
  return dados?.rede;
}

export async function desativarRede(id) {
  const dados = await requestAutenticada("/v1/admin/redes/dev/desativar", {
    method: "PATCH",
    body: JSON.stringify({ id })
  });
  return dados?.rede;
}

export async function buscarMinhaRedeGestor() {
  const prefixo = prefixoApiRedeGestorOuGerente();
  if (!prefixo) {
    throw new Error("Operacao disponivel apenas para gestor da rede, gerente de posto ou frentista.");
  }
  const dados = await requestAutenticada(`${prefixo}/rede`, {
    method: "GET"
  });
  return dados?.rede;
}

export async function atualizarMoedaVirtualRede(payload) {
  if (gerentePostoLogado() || frentistaLogado()) {
    throw new Error("Apenas o gestor da rede pode alterar a moeda virtual.");
  }
  const path = gestorRedeLogado()
    ? "/v1/gestor-rede/dev/redes/moeda-virtual"
    : "/v1/admin/redes/dev/moeda-virtual";
  const body = gestorRedeLogado()
    ? {
        moeda_virtual_nome: payload.moeda_virtual_nome,
        moeda_virtual_cotacao: payload.moeda_virtual_cotacao
      }
    : payload;
  const dados = await requestAutenticada(path, {
    method: "PATCH",
    body: JSON.stringify(body)
  });
  return dados?.rede;
}

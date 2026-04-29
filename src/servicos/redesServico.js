import { montarUrlApi } from "../configuracao/apiConfig";
import {
  frentistaLogado,
  gestorRedeLogado,
  gerentePostoLogado,
  prefixoApiRedeGestorOuGerente,
  superAdminLogado
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

/** Prazos de voucher (compra PIX no app e uso no posto). Gestor ou super-admin. */
export async function atualizarConfigVoucherRede(payload) {
  if (gerentePostoLogado() || frentistaLogado()) {
    throw new Error("Apenas o gestor da rede ou o administrador da plataforma podem alterar essas configuracoes.");
  }
  const isGestor = gestorRedeLogado();
  const isAdmin = superAdminLogado();
  if (!isGestor && !isAdmin) {
    throw new Error("Sessao nao autorizada a alterar configuracao de voucher.");
  }
  const path = isGestor
    ? "/v1/gestor-rede/dev/redes/config-voucher"
    : "/v1/admin/redes/dev/config-voucher";
  const corpo = isGestor
    ? {
        voucher_dias_validade_resgate: payload.voucher_dias_validade_resgate,
        voucher_minutos_expira_pagamento_pix: payload.voucher_minutos_expira_pagamento_pix
      }
    : {
        id: payload.id,
        voucher_dias_validade_resgate: payload.voucher_dias_validade_resgate,
        voucher_minutos_expira_pagamento_pix: payload.voucher_minutos_expira_pagamento_pix
      };
  const dados = await requestAutenticada(path, {
    method: "PATCH",
    body: JSON.stringify(corpo)
  });
  return dados?.rede;
}

/** Lista compras de voucher (PIX) da rede — super-admin informa id_rede; gestor/gerente/frentista usam o token. */
export async function listarVouchersRede({ redeId, limite = 40, offset = 0, status = "" } = {}) {
  const params = new URLSearchParams();
  params.set("limite", String(limite));
  params.set("offset", String(offset));
  if (status) {
    params.set("status", status);
  }
  let caminho;
  if (superAdminLogado()) {
    if (!redeId) {
      throw new Error("id da rede obrigatorio.");
    }
    params.set("id_rede", redeId);
    caminho = `/v1/admin/redes/dev/vouchers/listar?${params}`;
  } else {
    const prefixo = prefixoApiRedeGestorOuGerente();
    if (!prefixo) {
      throw new Error("Operacao disponivel apenas para gestor, gerente de posto ou frentista.");
    }
    caminho = `${prefixo}/vouchers/listar?${params}`;
  }
  const dados = await requestAutenticada(caminho, { method: "GET" });
  return {
    itens: Array.isArray(dados?.itens) ? dados.itens : [],
    total: Number(dados?.total ?? 0)
  };
}

/** Modulos opcionais do app (Indique e ganhe, check-in, gire e ganhe, redes sociais). Gestor ou super-admin. */
export async function atualizarAppModulosRede(payload) {
  if (gerentePostoLogado() || frentistaLogado()) {
    throw new Error("Apenas o gestor da rede ou o administrador podem alterar os modulos do app.");
  }
  const isGestor = gestorRedeLogado();
  const isAdmin = superAdminLogado();
  if (!isGestor && !isAdmin) {
    throw new Error("Sessao nao autorizada a alterar modulos do app.");
  }
  const path = isGestor
    ? "/v1/gestor-rede/dev/redes/app-modulos"
    : "/v1/admin/redes/dev/app-modulos";
  const corpo = isGestor
    ? {
        app_modulo_indique_ganhe: !!payload.app_modulo_indique_ganhe,
        app_modulo_checkin_diario: !!payload.app_modulo_checkin_diario,
        app_modulo_gire_ganhe: !!payload.app_modulo_gire_ganhe,
        app_modulo_redes_sociais: !!payload.app_modulo_redes_sociais
      }
    : {
        id: payload.id,
        app_modulo_indique_ganhe: !!payload.app_modulo_indique_ganhe,
        app_modulo_checkin_diario: !!payload.app_modulo_checkin_diario,
        app_modulo_gire_ganhe: !!payload.app_modulo_gire_ganhe,
        app_modulo_redes_sociais: !!payload.app_modulo_redes_sociais
      };
  const dados = await requestAutenticada(path, {
    method: "PATCH",
    body: JSON.stringify(corpo)
  });
  return dados?.rede;
}

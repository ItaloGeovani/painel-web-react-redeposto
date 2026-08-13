import {
  frentistaLogado,
  gestorRedeLogado,
  gerentePostoLogado,
  prefixoApiRedeGestorOuGerente,
  superAdminLogado
} from "../configuracao/painelApi";
import { apiFetch } from "./apiFetch";

export async function listarRedes() {
  const dados = await apiFetch("/v1/admin/redes/dev/listar", {
    method: "GET"
  });
  return dados?.itens || [];
}

export async function criarRede(payload) {
  const dados = await apiFetch("/v1/admin/redes/dev/criar", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return dados?.rede;
}

export async function editarRede(payload) {
  const dados = await apiFetch("/v1/admin/redes/dev/editar", {
    method: "PUT",
    body: JSON.stringify(payload)
  });
  return dados?.rede;
}

export async function ativarRede(id) {
  const dados = await apiFetch("/v1/admin/redes/dev/ativar", {
    method: "PATCH",
    body: JSON.stringify({ id })
  });
  return dados?.rede;
}

export async function desativarRede(id) {
  const dados = await apiFetch("/v1/admin/redes/dev/desativar", {
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
  const dados = await apiFetch(`${prefixo}/rede`, {
    method: "GET"
  });
  const rede = dados?.rede;
  if (rede && typeof rede === "object") {
    const logo = String(dados?.rede_logo_url || "").trim();
    if (logo) {
      rede.logo_url = logo;
    }
  }
  return rede;
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
        moeda_virtual_cotacao: payload.moeda_virtual_cotacao,
        moeda_virtual_expira_dias: Number(payload.moeda_virtual_expira_dias) || 0
      }
    : payload;
  const dados = await apiFetch(path, {
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
  const dados = await apiFetch(path, {
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
  const dados = await apiFetch(caminho, { method: "GET" });
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
  const dados = await apiFetch(path, {
    method: "PATCH",
    body: JSON.stringify(corpo)
  });
  return dados?.rede;
}

/** Diagnostico FCM por rede (super-admin): contagens e sugestoes. */
export async function buscarDiagnosticoPushRedeSuperAdmin(idRede) {
  const rid = String(idRede || "").trim();
  if (!rid) {
    throw new Error("id_rede obrigatorio.");
  }
  if (!superAdminLogado()) {
    throw new Error("Apenas administrador geral pode usar este diagnostico.");
  }
  const qs = new URLSearchParams({ id_rede: rid });
  return apiFetch(`/v1/admin/redes/dev/push/diagnostico?${qs}`, { method: "GET" });
}

/**
 * Invalida sessoes dos clientes do app (forca novo login) e limpa tokens FCM.
 * @param {{ id_rede?: string, limpar_tokens_fcm?: boolean }} [opts]
 */
export async function revogarSessoesClientesSuperAdmin(opts = {}) {
  if (!superAdminLogado()) {
    throw new Error("Apenas administrador geral pode revogar sessoes.");
  }
  const corpo = {};
  const rid = String(opts.id_rede || "").trim();
  if (rid) {
    corpo.id_rede = rid;
  }
  if (opts.limpar_tokens_fcm === false) {
    corpo.limpar_tokens_fcm = false;
  }
  return apiFetch("/v1/admin/sessoes/revogar-clientes", {
    method: "POST",
    body: JSON.stringify(corpo)
  });
}

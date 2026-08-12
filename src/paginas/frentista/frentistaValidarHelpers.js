export function fmtMoeda(v) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v) || 0);
}

export function fmtDataHora(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return String(iso);
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(d);
}

export function fmtHora(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" }).format(d);
}

export function rotuloStatus(status) {
  switch (status) {
    case "AGUARDANDO_DINHEIRO":
      return "Aguardando dinheiro";
    case "AGUARDANDO_PAGAMENTO":
      return "Aguardando PIX";
    case "ATIVO":
      return "Ativo";
    case "USADO":
      return "Usado";
    case "EXPIRADO":
      return "Expirado";
    case "CANCELADO":
      return "Cancelado";
    default:
      return status || "—";
  }
}

export function resgateExpirado(v) {
  if (!v?.expira_resgate_em) return false;
  const t = new Date(v.expira_resgate_em).getTime();
  return Number.isFinite(t) && t < Date.now();
}

export function postoOperadorBloqueado(v) {
  return v?.operador_pode_registrar_uso === false;
}

export function statusPermiteUso(v) {
  if (!v) return false;
  if (v.aguarda_pagamento_dinheiro) return true;
  const st = String(v.status || "").trim().toUpperCase();
  return st === "ATIVO" || st === "AGUARDANDO_DINHEIRO";
}

export function podeRegistrarUso(v) {
  if (!statusPermiteUso(v)) return false;
  if (resgateExpirado(v)) return false;
  if (postoOperadorBloqueado(v)) return false;
  return true;
}

export function motivosBloqueioUso(v) {
  if (!v) return [];
  if (v.status === "USADO") return [];
  const motivos = [];
  if (resgateExpirado(v)) {
    motivos.push({
      titulo: "Prazo de resgate expirado",
      corpo: `Este voucher venceu em ${fmtDataHora(v.expira_resgate_em)}. Não pode mais ser usado no posto.`
    });
  }
  if (postoOperadorBloqueado(v)) {
    const posto = v.posto_compra_nome || "o posto da compra";
    motivos.push({
      titulo: "Posto diferente",
      corpo:
        v.operador_aviso_posto ||
        `Este voucher só pode ser usado em ${posto}. Você está em outro posto.`
    });
  }
  if (!statusPermiteUso(v) && !resgateExpirado(v)) {
    const st = String(v.status || "").trim().toUpperCase();
    if (st === "AGUARDANDO_PAGAMENTO") {
      motivos.push({
        titulo: "Pagamento pendente",
        corpo: "O PIX ainda não foi confirmado. Aguarde a aprovação do pagamento."
      });
    } else if (st === "CANCELADO") {
      motivos.push({
        titulo: "Voucher cancelado",
        corpo: "Este voucher foi cancelado e não pode ser usado."
      });
    } else if (st === "EXPIRADO") {
      motivos.push({
        titulo: "Voucher expirado",
        corpo: "Este voucher está expirado e não pode ser usado."
      });
    } else {
      motivos.push({
        titulo: "Não disponível para uso",
        corpo: `Status atual: ${rotuloStatus(v.status)}. Este voucher não pode ser registrado agora.`
      });
    }
  }
  return motivos;
}

export function rotuloMeioPagamento(v) {
  if (!v) return "—";
  if (v.aguarda_pagamento_dinheiro || String(v.meio_pagamento || "").toUpperCase() === "DINHEIRO") {
    return "Dinheiro";
  }
  return "PIX";
}

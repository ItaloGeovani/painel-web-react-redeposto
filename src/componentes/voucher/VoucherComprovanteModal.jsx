import { Printer, X } from "lucide-react";
import { createPortal } from "react-dom";
import Button from "../ui/Button";

function fmtMoeda(v) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v) || 0);
}

function fmtDataHora(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function rotuloMeio(meio) {
  const m = String(meio || "").toUpperCase();
  if (m === "DINHEIRO") return "Dinheiro";
  if (m === "MOEDA_VIRTUAL") return "Moeda virtual";
  if (m === "PIX") return "PIX";
  return meio || "—";
}

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Linhas para o modal (tela). */
export function linhasComprovanteVoucher(v, redeNome) {
  if (!v) return [];
  const linhas = [
    ["Rede", redeNome || "—"],
    ["Código", v.codigo_resgate || "—"],
    ["Cliente", v.cliente_nome_completo || "—"],
    ["Valor", fmtMoeda(v.valor_final)]
  ];
  if (Number(v.desconto_aplicado) > 0.005) {
    linhas.push(["Desconto", fmtMoeda(v.desconto_aplicado)]);
  }
  if (v.litros != null && Number(v.litros) > 0) {
    linhas.push(["Litros", `${Number(v.litros)} L`]);
  }
  if (v.combustivel_rede_nome) {
    linhas.push(["Combustível", v.combustivel_rede_nome]);
  }
  linhas.push(["Pagamento", rotuloMeio(v.meio_pagamento)]);
  linhas.push(["Posto", v.posto_uso_nome || v.posto_compra_nome || "—"]);
  linhas.push(["Data/hora", fmtDataHora(v.usado_em)]);
  if (v.operador_nome_snapshot) {
    linhas.push(["Operador", v.operador_nome_snapshot]);
  }
  return linhas;
}

/** Dados do cupom térmico (impressão). */
function dadosCupom(v, redeNome) {
  if (!v) return null;
  return {
    rede: redeNome || "GasPass",
    posto: v.posto_uso_nome || v.posto_compra_nome || "—",
    codigo: v.codigo_resgate || "—",
    cliente: v.cliente_nome_completo || "—",
    valor: fmtMoeda(v.valor_final),
    pagamento: rotuloMeio(v.meio_pagamento),
    data: fmtDataHora(v.usado_em),
    operador: v.operador_nome_snapshot || "",
    litros: v.litros != null && Number(v.litros) > 0 ? `${Number(v.litros)} L` : "",
    combustivel: v.combustivel_rede_nome || "",
    desconto: Number(v.desconto_aplicado) > 0.005 ? fmtMoeda(v.desconto_aplicado) : ""
  };
}

function htmlCupomTermico(v, redeNome) {
  const d = dadosCupom(v, redeNome);
  if (!d) return "";

  const extras = [];
  if (d.litros) {
    extras.push(`<div class="row"><span>Litros</span><strong>${esc(d.litros)}</strong></div>`);
  }
  if (d.combustivel) {
    extras.push(`<div class="row"><span>Combustível</span><strong>${esc(d.combustivel)}</strong></div>`);
  }
  if (d.desconto) {
    extras.push(`<div class="row"><span>Desconto</span><strong>${esc(d.desconto)}</strong></div>`);
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<title>Comprovante</title>
<style>
  @page { size: 80mm auto; margin: 0; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: #fff;
    color: #000;
    font-family: "Courier New", Courier, ui-monospace, monospace;
  }
  .cupom {
    width: 72mm;
    max-width: 100%;
    margin: 0 auto;
    padding: 3mm 2.5mm 6mm;
    font-size: 11px;
    line-height: 1.25;
  }
  .center { text-align: center; }
  .marca {
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    margin: 0 0 2px;
  }
  .titulo {
    font-size: 12px;
    font-weight: 700;
    margin: 0 0 2px;
  }
  .muted { font-size: 10px; }
  .sep {
    border: none;
    border-top: 1px dashed #000;
    margin: 6px 0;
  }
  .sep-solid {
    border: none;
    border-top: 1px solid #000;
    margin: 6px 0;
  }
  .codigo {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.12em;
    margin: 4px 0 2px;
  }
  .valor {
    font-size: 20px;
    font-weight: 700;
    margin: 4px 0 2px;
  }
  .row {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin: 2px 0;
  }
  .row span { flex: 1; }
  .row strong { text-align: right; font-weight: 700; }
  .bloco { margin: 2px 0; }
  .bloco .lab { font-size: 10px; }
  .bloco .val { font-weight: 700; word-break: break-word; }
  .obrigado {
    margin-top: 8px;
    font-size: 11px;
    font-weight: 700;
  }
</style>
</head>
<body>
  <div class="cupom">
    <div class="center">
      <p class="marca">${esc(d.rede)}</p>
      <p class="titulo">COMPROVANTE DE USO</p>
      <p class="muted">Voucher / PDV</p>
    </div>
    <hr class="sep"/>
    <div class="row"><span>Posto</span><strong>${esc(d.posto)}</strong></div>
    <div class="row"><span>Data</span><strong>${esc(d.data)}</strong></div>
    ${d.operador ? `<div class="row"><span>Operador</span><strong>${esc(d.operador)}</strong></div>` : ""}
    <hr class="sep"/>
    <div class="center bloco">
      <div class="lab">CÓDIGO</div>
      <div class="codigo">${esc(d.codigo)}</div>
    </div>
    <hr class="sep"/>
    <div class="bloco">
      <div class="lab">Cliente</div>
      <div class="val">${esc(d.cliente)}</div>
    </div>
    <hr class="sep"/>
    <div class="center">
      <div class="lab">VALOR</div>
      <div class="valor">${esc(d.valor)}</div>
    </div>
    <div class="row"><span>Pagamento</span><strong>${esc(d.pagamento)}</strong></div>
    ${extras.join("")}
    <hr class="sep-solid"/>
    <div class="center">
      <p class="obrigado">*** USO REGISTRADO ***</p>
      <p class="muted">Conserve este comprovante</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Imprime via iframe oculto (sem window.open — funciona no PDV/Tauri).
 */
export function imprimirComprovanteVoucher(voucher, redeNome) {
  const html = htmlCupomTermico(voucher, redeNome);

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    iframe.remove();
    window.alert("Não foi possível preparar a impressão.");
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  const win = iframe.contentWindow;
  const limpar = () => {
    window.setTimeout(() => {
      try {
        iframe.remove();
      } catch {
        /* ignore */
      }
    }, 1000);
  };

  const disparar = () => {
    try {
      win?.focus();
      win?.print();
    } catch {
      window.alert("Não foi possível abrir a impressão.");
    } finally {
      limpar();
    }
  };

  if (iframe.contentDocument?.readyState === "complete") {
    window.setTimeout(disparar, 80);
  } else {
    iframe.onload = () => window.setTimeout(disparar, 80);
  }
}

/**
 * Modal com comprovante após validação bem-sucedida.
 */
export default function VoucherComprovanteModal({ open, onClose, voucher, redeNome }) {
  if (!open || !voucher) return null;

  const linhas = linhasComprovanteVoucher(voucher, redeNome);
  const marca = redeNome || "GasPass";

  return createPortal(
    <div
      className="gp-modal-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className="gp-modal gp-modal--sm gp-voucher-comprovante"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gp-voucher-comprovante-titulo"
      >
        <header className="gp-modal__header">
          <div className="gp-modal__titulos">
            <h2 id="gp-voucher-comprovante-titulo" className="gp-modal__title">
              Comprovante de uso
            </h2>
            <p className="gp-modal__desc">Pronto para imprimir no cupom térmico.</p>
          </div>
          <button type="button" className="gp-modal__fechar" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </header>

        <div className="gp-modal__body">
          <div className="gp-voucher-comprovante__card" id="gp-voucher-comprovante-print">
            <p className="gp-voucher-comprovante__selo">COMPROVANTE DE USO</p>
            <p className="gp-voucher-comprovante__marca">{marca}</p>
            <p className="gp-voucher-comprovante__codigo">{voucher.codigo_resgate || "—"}</p>
            <p className="gp-voucher-comprovante__valor">{fmtMoeda(voucher.valor_final)}</p>
            <dl className="gp-voucher-comprovante__lista">
              {linhas
                .filter(([k]) => k !== "Código" && k !== "Valor" && k !== "Rede")
                .map(([k, val]) => (
                  <div key={k} className="gp-voucher-comprovante__linha">
                    <dt>{k}</dt>
                    <dd>{val}</dd>
                  </div>
                ))}
            </dl>
          </div>
        </div>

        <footer className="gp-modal__footer">
          <div className="gp-modal__acoes">
            <Button type="button" variant="ghost" onClick={onClose}>
              Fechar
            </Button>
            <Button
              type="button"
              icon={Printer}
              onClick={() => imprimirComprovanteVoucher(voucher, redeNome)}
            >
              Imprimir
            </Button>
          </div>
        </footer>
      </div>
    </div>,
    document.body
  );
}

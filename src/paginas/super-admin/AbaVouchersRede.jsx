import { useEffect, useState } from "react";
import { gestorRedeLogado, superAdminLogado } from "../../configuracao/painelApi";
import { atualizarConfigVoucherRede } from "../../servicos/redesServico";
import { toastErro, toastSucesso } from "../../servicos/toastServico";

function valorNumOuPadrao(v, padrao) {
  const n = Number(v);
  if (v != null && v !== "" && Number.isFinite(n)) {
    return n;
  }
  return padrao;
}

export default function AbaVouchersRede({ rede, onSalvo }) {
  const [dias, setDias] = useState("7");
  const [minutos, setMinutos] = useState("30");
  const [salvando, setSalvando] = useState(false);

  const podeEditar = gestorRedeLogado() || superAdminLogado();

  useEffect(() => {
    setDias(String(valorNumOuPadrao(rede.voucher_dias_validade_resgate, 7)));
    setMinutos(String(valorNumOuPadrao(rede.voucher_minutos_expira_pagamento_pix, 30)));
  }, [
    rede.id,
    rede.voucher_dias_validade_resgate,
    rede.voucher_minutos_expira_pagamento_pix
  ]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!podeEditar) {
      return;
    }
    const d = parseInt(String(dias).trim(), 10);
    const m = parseInt(String(minutos).trim(), 10);
    if (!Number.isFinite(d) || d < 1 || d > 365) {
      toastErro("Dias de validade no posto: informe um numero de 1 a 365.");
      return;
    }
    if (!Number.isFinite(m) || m < 5 || m > 10080) {
      toastErro("Minutos para pagar o PIX: informe um numero de 5 a 10080 (ate 7 dias).");
      return;
    }
    setSalvando(true);
    try {
      await atualizarConfigVoucherRede({
        id: rede.id,
        voucher_dias_validade_resgate: d,
        voucher_minutos_expira_pagamento_pix: m
      });
      toastSucesso("Prazos de voucher salvos.");
      onSalvo?.();
    } catch (err) {
      toastErro(err.message || "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="aba-vouchers">
      <article className="aba-vouchers__doc-card aba-vouchers__config-primeiro">
        <h3>Compra de voucher (app do cliente)</h3>
        <p className="rede-detalhes__ajuda">
          Defina em quanto tempo o cliente precisa <strong>pagar o PIX</strong> e por quanto tempo o saldo fica
          valido <strong>no posto</strong> depois do pagamento aprovado. Afeta novas compras; vouchers ja ativos
          seguem a data que foi gravada.
        </p>
        {podeEditar ? (
          <form className="form-rede form-rede--equipe" onSubmit={onSubmit}>
            <div className="form-rede__grid">
              <label className="form-rede__label-span2" htmlFor="vch-dias">
                Dias para usar no posto (apos o PIX aprovado)
                <input
                  id="vch-dias"
                  className="campo__input"
                  type="number"
                  min={1}
                  max={365}
                  inputMode="numeric"
                  value={dias}
                  onChange={(e) => setDias(e.target.value)}
                  aria-describedby="vch-dias-ajuda"
                />
                <span id="vch-dias-ajuda" className="rede-detalhes__ajuda rede-detalhes__ajuda--form">
                  Entre 1 e 365 dias (padrao: 7).
                </span>
              </label>
              <label className="form-rede__label-span2" htmlFor="vch-min">
                Minutos para concluir o pagamento PIX
                <input
                  id="vch-min"
                  className="campo__input"
                  type="number"
                  min={5}
                  max={10080}
                  inputMode="numeric"
                  value={minutos}
                  onChange={(e) => setMinutos(e.target.value)}
                  aria-describedby="vch-min-ajuda"
                />
                <span id="vch-min-ajuda" className="rede-detalhes__ajuda rede-detalhes__ajuda--form">
                  Entre 5 minutos e 10080 (7 dias). Padrao: 30 minutos.
                </span>
              </label>
            </div>
            <div className="form-rede__acoes">
              <button className="botao-primario" type="submit" disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar prazos de voucher"}
              </button>
            </div>
          </form>
        ) : (
          <div className="form-rede__grid" style={{ marginTop: 8 }}>
            <p className="rede-detalhes__ajuda">
              <strong>Dias no posto (apos PIX):</strong> {dias} — <strong>Minutos para pagar o PIX:</strong> {minutos}
            </p>
            <p className="rede-detalhes__ajuda" style={{ marginTop: 8 }}>
              Somente o <strong>gestor da rede</strong> (ou o administrador da plataforma) altera estes prazos.
            </p>
          </div>
        )}
      </article>

      <p className="rede-detalhes__ajuda" style={{ marginTop: 20 }}>
        Acompanhamento dos vouchers emitidos para clientes da rede <strong>{rede.nome_fantasia}</strong>. A listagem
        em tempo real sera ligada a API quando o modulo de consulta estiver exposto.
      </p>

      <div className="aba-vouchers__lista-vazia" aria-live="polite">
        Nenhuma listagem disponivel ainda. Aqui entrarao colunas como status, combustivel, litros, valor em moeda da
        rede, posto, validade e data de uso — filtradas por esta rede.
      </div>

      <article className="aba-vouchers__doc-card">
        <h3>O que e um voucher?</h3>
        <p>
          No app, o cliente pode <strong>comprar credito com PIX</strong>: gera-se um codigo/QR para o frentista
          consumir no abastecimento ou em compras no posto, dentro do prazo que voce definiu acima.
        </p>
        <p>
          A <strong>Carteira e Financeiro / moeda virtual</strong> e outro fluxo (saldo de creditos). Campanhas podem
          dar desconto na <strong>compra</strong> do voucher, conforme regras da rede.
        </p>
        <p className="aba-vouchers__doc-nota">
          <strong>Cards do app</strong> e <strong>campanhas</strong> definem a comunicacao; os prazos desta tela
          valem para as compras de voucher via PIX.
        </p>
      </article>
    </div>
  );
}

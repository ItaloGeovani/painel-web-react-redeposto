import { useCallback, useEffect, useState } from "react";
import { gestorRedeLogado, superAdminLogado } from "../../configuracao/painelApi";
import { atualizarConfigVoucherRede, listarVouchersRede } from "../../servicos/redesServico";
import { toastErro, toastSucesso } from "../../servicos/toastServico";

const LIMITE_LISTA = 40;

const FILTROS_STATUS = [
  { value: "", label: "Todos os status" },
  { value: "AGUARDANDO_PAGAMENTO", label: "Aguardando PIX" },
  { value: "ATIVO", label: "Ativo" },
  { value: "USADO", label: "Usado" },
  { value: "EXPIRADO", label: "Expirado" },
  { value: "CANCELADO", label: "Cancelado" }
];

function valorNumOuPadrao(v, padrao) {
  const n = Number(v);
  if (v != null && v !== "" && Number.isFinite(n)) {
    return n;
  }
  return padrao;
}

function fmtMoeda(v) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v) || 0);
}

function fmtDataHora(iso) {
  if (iso == null || iso === "") {
    return "—";
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "—";
  }
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function classeStatus(status) {
  switch (status) {
    case "AGUARDANDO_PAGAMENTO":
      return "aba-vouchers__status aba-vouchers__status--pendente";
    case "ATIVO":
      return "aba-vouchers__status aba-vouchers__status--ativo";
    case "USADO":
      return "aba-vouchers__status aba-vouchers__status--usado";
    case "EXPIRADO":
      return "aba-vouchers__status aba-vouchers__status--expirado";
    case "CANCELADO":
      return "aba-vouchers__status aba-vouchers__status--cancelado";
    default:
      return "aba-vouchers__status";
  }
}

function rotuloStatus(status) {
  const f = FILTROS_STATUS.find((x) => x.value === status);
  return f ? f.label : status;
}

export default function AbaVouchersRede({ rede, onSalvo }) {
  const [dias, setDias] = useState("7");
  const [minutos, setMinutos] = useState("30");
  const [salvando, setSalvando] = useState(false);

  const [vouchers, setVouchers] = useState([]);
  const [totalLista, setTotalLista] = useState(0);
  const [carregandoLista, setCarregandoLista] = useState(true);
  const [erroLista, setErroLista] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState("");
  const [offset, setOffset] = useState(0);

  const podeEditar = gestorRedeLogado() || superAdminLogado();

  useEffect(() => {
    setDias(String(valorNumOuPadrao(rede.voucher_dias_validade_resgate, 7)));
    setMinutos(String(valorNumOuPadrao(rede.voucher_minutos_expira_pagamento_pix, 30)));
  }, [
    rede.id,
    rede.voucher_dias_validade_resgate,
    rede.voucher_minutos_expira_pagamento_pix
  ]);

  useEffect(() => {
    setOffset(0);
  }, [filtroStatus, rede.id]);

  const carregarLista = useCallback(async () => {
    if (!rede?.id) {
      return;
    }
    setCarregandoLista(true);
    setErroLista(null);
    try {
      const { itens, total } = await listarVouchersRede({
        redeId: rede.id,
        limite: LIMITE_LISTA,
        offset,
        status: filtroStatus
      });
      setVouchers(itens);
      setTotalLista(total);
    } catch (err) {
      setErroLista(err.message || "Falha ao carregar vouchers.");
      setVouchers([]);
      setTotalLista(0);
    } finally {
      setCarregandoLista(false);
    }
  }, [rede?.id, offset, filtroStatus]);

  useEffect(() => {
    carregarLista();
  }, [carregarLista]);

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
      await carregarLista();
    } catch (err) {
      toastErro(err.message || "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  const paginaAtual = Math.floor(offset / LIMITE_LISTA) + 1;
  const totalPaginas = Math.max(1, Math.ceil(totalLista / LIMITE_LISTA));
  const temAnterior = offset > 0;
  const temProxima = offset + LIMITE_LISTA < totalLista;

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

      <section className="aba-vouchers__lista-secao" aria-labelledby="vouchers-lista-titulo">
        <h3 id="vouchers-lista-titulo" className="aba-vouchers__lista-titulo">
          Vouchers da rede <span className="aba-vouchers__lista-nome">{rede.nome_fantasia}</span>
        </h3>
        <p className="rede-detalhes__ajuda">
          Compras via app com PIX: status, valores, prazos de pagamento e de uso no posto, e posto em que foi
          resgatado quando houver registro.
        </p>

        <div className="aba-vouchers__toolbar">
          <label className="aba-vouchers__filtro">
            <span className="aba-vouchers__filtro-label">Status</span>
            <select
              className="campo__input"
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              aria-label="Filtrar por status do voucher"
            >
              {FILTROS_STATUS.map((o) => (
                <option key={o.value || "todos"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <div className="aba-vouchers__pager">
            <button
              type="button"
              className="tabela-btn tabela-btn--outline"
              disabled={!temAnterior || carregandoLista}
              onClick={() => setOffset((o) => Math.max(0, o - LIMITE_LISTA))}
            >
              Anterior
            </button>
            <span className="aba-vouchers__pager-info">
              Pagina {paginaAtual} de {totalPaginas} ({totalLista} registro{totalLista === 1 ? "" : "s"})
            </span>
            <button
              type="button"
              className="tabela-btn tabela-btn--outline"
              disabled={!temProxima || carregandoLista}
              onClick={() => setOffset((o) => o + LIMITE_LISTA)}
            >
              Proxima
            </button>
            <button
              type="button"
              className="tabela-btn tabela-btn--outline"
              disabled={carregandoLista}
              onClick={() => carregarLista()}
            >
              Atualizar
            </button>
          </div>
        </div>

        {erroLista ? (
          <p className="rede-detalhes__ajuda" role="alert">
            {erroLista}
          </p>
        ) : null}

        {carregandoLista && !vouchers.length ? (
          <div className="aba-vouchers__lista-vazia" aria-live="polite">
            Carregando vouchers...
          </div>
        ) : null}

        {!carregandoLista && !vouchers.length && !erroLista ? (
          <div className="aba-vouchers__lista-vazia" aria-live="polite">
            Nenhum voucher encontrado{filtroStatus ? ` com status “${rotuloStatus(filtroStatus)}”.` : " para esta rede."}
          </div>
        ) : null}

        {vouchers.length > 0 ? (
          <div className="tabela-wrap aba-vouchers__tabela-wrap">
            <table className="tabela-redes tabela-redes--compacta">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Cliente</th>
                  <th className="tabela-num">Valor final</th>
                  <th className="tabela-num">Litros</th>
                  <th>Codigo</th>
                  <th>Criado</th>
                  <th>Expira PIX</th>
                  <th>Valido no posto ate</th>
                  <th>Usado em</th>
                  <th>Posto (uso)</th>
                </tr>
              </thead>
              <tbody>
                {vouchers.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <span className={classeStatus(v.status)}>{rotuloStatus(v.status)}</span>
                    </td>
                    <td>
                      <strong className="tabela-celula__principal">{v.cliente_nome_completo || "—"}</strong>
                    </td>
                    <td className="tabela-num">{fmtMoeda(v.valor_final)}</td>
                    <td className="tabela-num">{v.litros != null ? Number(v.litros).toLocaleString("pt-BR") : "—"}</td>
                    <td>
                      <span className="aba-vouchers__codigo">{v.codigo_resgate || "—"}</span>
                    </td>
                    <td>{fmtDataHora(v.criado_em)}</td>
                    <td>{fmtDataHora(v.expira_pagamento_em)}</td>
                    <td>{fmtDataHora(v.expira_resgate_em)}</td>
                    <td>{fmtDataHora(v.usado_em)}</td>
                    <td>{v.posto_uso_nome || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

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

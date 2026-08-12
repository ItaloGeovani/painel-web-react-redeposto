import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Keyboard,
  Printer,
  ScanLine,
  Search,
  ShieldCheck,
  Ticket,
  UserRound,
  Wallet
} from "lucide-react";
import {
  baixarVoucherPorCodigo,
  consultarVoucherPorCodigo
} from "../../servicos/voucherConsultaEquipeServico";
import { toastErro, toastSucesso } from "../../servicos/toastServico";
import Button from "../../componentes/ui/Button";
import Modal, { ModalActions } from "../../componentes/ui/Modal";
import VoucherComprovanteModal from "../../componentes/voucher/VoucherComprovanteModal";
import {
  fmtDataHora,
  fmtHora,
  fmtMoeda,
  motivosBloqueioUso,
  podeRegistrarUso,
  rotuloMeioPagamento
} from "./frentistaValidarHelpers";

/**
 * Layout PDV desktop — só usado com VITE_APP_TARGET=desktop.
 * O painel web continua em FrentistaValidarVoucherSecao.
 */
export default function FrentistaValidarVoucherPdv({ rede }) {
  const inputRef = useRef(null);
  const operadorCodigoRef = useRef(null);
  const operadorSenhaRef = useRef(null);
  const [codigo, setCodigo] = useState("");
  const [consultando, setConsultando] = useState(false);
  const [baixando, setBaixando] = useState(false);
  const [voucher, setVoucher] = useState(null);
  const [comprovanteAberto, setComprovanteAberto] = useState(false);
  const [modalOperadorAberto, setModalOperadorAberto] = useState(false);
  const [operadorCodigo, setOperadorCodigo] = useState("");
  const [operadorSenha, setOperadorSenha] = useState("");
  const [baixaRecemFeita, setBaixaRecemFeita] = useState(false);
  const [ultimoOperadorNome, setUltimoOperadorNome] = useState("");

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (modalOperadorAberto) {
      const t = window.setTimeout(() => operadorCodigoRef.current?.focus(), 30);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [modalOperadorAberto]);

  function limparOperador() {
    setOperadorCodigo("");
    setOperadorSenha("");
  }

  function novoVoucher() {
    setVoucher(null);
    setCodigo("");
    setComprovanteAberto(false);
    setBaixaRecemFeita(false);
    setUltimoOperadorNome("");
    limparOperador();
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  async function onConsultar(e) {
    e?.preventDefault?.();
    const c = codigo.trim();
    if (!c) {
      toastErro("Informe o código.");
      return;
    }
    setConsultando(true);
    setVoucher(null);
    setComprovanteAberto(false);
    setBaixaRecemFeita(false);
    try {
      const r = await consultarVoucherPorCodigo(c);
      setVoucher(r);
    } catch (err) {
      toastErro(err.message || "Falha ao consultar.");
    } finally {
      setConsultando(false);
    }
  }

  function abrirConfirmacaoBaixa() {
    if (!voucher || baixando) return;
    limparOperador();
    setModalOperadorAberto(true);
  }

  function fecharModalOperador() {
    if (baixando) return;
    setModalOperadorAberto(false);
    limparOperador();
  }

  async function onConfirmarBaixaComOperador(e) {
    e?.preventDefault?.();
    if (!voucher || baixando) return;
    const c = (voucher.codigo_resgate || codigo).trim();
    if (!c) return;
    const opCod = operadorCodigo.trim();
    const opSenha = operadorSenha;
    if (!opCod || !opSenha) {
      toastErro("Informe o código ou e-mail e a senha do frentista.");
      return;
    }
    setBaixando(true);
    try {
      const r = await baixarVoucherPorCodigo(c, undefined, {
        codigo: opCod,
        senha: opSenha
      });
      setVoucher(r);
      setUltimoOperadorNome(r.operador_nome_snapshot || opCod);
      setModalOperadorAberto(false);
      limparOperador();
      setBaixaRecemFeita(true);
      toastSucesso("Baixa registrada com sucesso.");
    } catch (err) {
      toastErro(err.message || "Falha ao registrar uso.");
      limparOperador();
      setTimeout(() => operadorCodigoRef.current?.focus(), 30);
    } finally {
      setBaixando(false);
    }
  }

  function onOperadorCodigoKeyDown(ev) {
    if (ev.key === "Enter") {
      ev.preventDefault();
      operadorSenhaRef.current?.focus();
    }
  }

  const aguardaDinheiro = !!voucher?.aguarda_pagamento_dinheiro;
  const usado = voucher?.status === "USADO";
  const motivos = voucher && !usado ? motivosBloqueioUso(voucher) : [];
  const liberado = voucher ? podeRegistrarUso(voucher) : false;
  const sucesso = baixaRecemFeita && usado;

  let painelEstado = "idle";
  if (sucesso) painelEstado = "sucesso";
  else if (motivos.length) painelEstado = "bloqueado";
  else if (liberado) painelEstado = "valido";
  else if (voucher) painelEstado = "info";

  return (
    <div className="gp-pdv-validar">
      <header className="gp-pdv-validar__page-head">
        <h1>Validar voucher</h1>
        <p>Digite o código do voucher apresentado pelo cliente.</p>
      </header>

      <div className="gp-pdv-validar__grid">
        <section className="gp-pdv-validar__ops">
          <div className="gp-pdv-card gp-pdv-card--ops">
            <form onSubmit={onConsultar}>
              <label className="gp-pdv-label" htmlFor="pdv-codigo-voucher">
                Código do voucher
              </label>
              <div className="gp-pdv-input-wrap">
                <input
                  id="pdv-codigo-voucher"
                  ref={inputRef}
                  className="gp-pdv-input-lg"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  placeholder="AB12CD34"
                  autoComplete="off"
                  spellCheck={false}
                />
                <span className="gp-pdv-input-wrap__ico" aria-hidden>
                  <ScanLine size={20} />
                </span>
              </div>
              <p className="gp-pdv-hint">
                <Keyboard size={14} aria-hidden /> Pressione <strong>ENTER</strong> para consultar
              </p>
              <button type="submit" className="gp-pdv-btn-primary" disabled={consultando}>
                <Search size={18} aria-hidden />
                {consultando ? "Consultando…" : "Consultar voucher"}
              </button>
            </form>
          </div>

          <div className="gp-pdv-card gp-pdv-card--howto">
            <h2>Como funciona</h2>
            <ol className="gp-pdv-howto">
              <li>
                <span className="gp-pdv-howto__n">1</span>
                <div>
                  <strong>Digite o código</strong>
                  <p>Digite o código apresentado pelo cliente.</p>
                </div>
              </li>
              <li>
                <span className="gp-pdv-howto__n">2</span>
                <div>
                  <strong>Consulte</strong>
                  <p>Confira os dados e o valor do voucher.</p>
                </div>
              </li>
              <li>
                <span className="gp-pdv-howto__n">3</span>
                <div>
                  <strong>Confirme a baixa</strong>
                  <p>Confirme o recebimento antes do abastecimento.</p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        <aside className={`gp-pdv-card gp-pdv-painel gp-pdv-painel--${painelEstado}`}>
          {painelEstado === "idle" ? (
            <>
              <span className="gp-pdv-badge gp-pdv-badge--idle">Aguardando consulta</span>
              <div className="gp-pdv-painel__hero">
                <div className="gp-pdv-painel__icon" aria-hidden>
                  <Ticket size={36} />
                </div>
                <h2>Voucher não consultado</h2>
                <p>Digite o código ao lado para verificar os detalhes do voucher.</p>
              </div>
              <dl className="gp-pdv-dl">
                <div><dt><Wallet size={14} /> Valor</dt><dd>—</dd></div>
                <div><dt><Banknote size={14} /> Meio de pagamento</dt><dd>—</dd></div>
                <div><dt><UserRound size={14} /> Cliente</dt><dd>—</dd></div>
                <div><dt><Ticket size={14} /> Código</dt><dd>—</dd></div>
                <div><dt><ShieldCheck size={14} /> Validade</dt><dd>—</dd></div>
              </dl>
              <div className="gp-pdv-nota">
                <ShieldCheck size={16} aria-hidden />
                <p>Importante: confirme o recebimento em dinheiro antes de liberar o abastecimento.</p>
              </div>
            </>
          ) : null}

          {painelEstado === "valido" ? (
            <>
              <span className={`gp-pdv-badge ${aguardaDinheiro ? "gp-pdv-badge--warn" : "gp-pdv-badge--ok"}`}>
                {aguardaDinheiro ? "Aguardando dinheiro" : "Voucher válido"}
              </span>
              <div className="gp-pdv-painel__valor">{fmtMoeda(voucher.valor_final)}</div>
              <dl className="gp-pdv-dl">
                <div><dt>Cliente</dt><dd>{voucher.cliente_nome_completo || "—"}</dd></div>
                <div><dt>Pagamento</dt><dd>{rotuloMeioPagamento(voucher)}</dd></div>
                <div><dt>Código</dt><dd className="gp-pdv-mono">{voucher.codigo_resgate || codigo}</dd></div>
                <div>
                  <dt>Validade</dt>
                  <dd>{voucher.expira_resgate_em ? fmtDataHora(voucher.expira_resgate_em) : "—"}</dd>
                </div>
              </dl>
              {aguardaDinheiro ? (
                <div className="gp-pdv-nota gp-pdv-nota--warn">
                  <AlertTriangle size={16} aria-hidden />
                  <p>
                    <strong>Importante</strong>
                    <br />
                    Confirme o recebimento em dinheiro antes de liberar o abastecimento.
                  </p>
                </div>
              ) : (
                <div className="gp-pdv-nota">
                  <ShieldCheck size={16} aria-hidden />
                  <p>Confira os dados e confirme a baixa para liberar o abastecimento.</p>
                </div>
              )}
              <button
                type="button"
                className="gp-pdv-btn-critical"
                disabled={baixando}
                onClick={abrirConfirmacaoBaixa}
              >
                <CheckCircle2 size={18} aria-hidden />
                {baixando ? "Registrando…" : "Confirmar baixa"}
              </button>
            </>
          ) : null}

          {painelEstado === "bloqueado" || painelEstado === "info" ? (
            <>
              <span className="gp-pdv-badge gp-pdv-badge--err">
                {usado ? "Já utilizado" : "Não disponível"}
              </span>
              {motivos.map((m) => (
                <div key={m.titulo} className="gp-pdv-alerta" role="alert">
                  <AlertTriangle size={18} aria-hidden />
                  <div>
                    <strong>{m.titulo}</strong>
                    <p>{m.corpo}</p>
                  </div>
                </div>
              ))}
              {voucher ? (
                <dl className="gp-pdv-dl">
                  <div><dt>Valor</dt><dd>{fmtMoeda(voucher.valor_final)}</dd></div>
                  <div><dt>Cliente</dt><dd>{voucher.cliente_nome_completo || "—"}</dd></div>
                  <div><dt>Código</dt><dd className="gp-pdv-mono">{voucher.codigo_resgate || "—"}</dd></div>
                  <div><dt>Status</dt><dd>{voucher.status}</dd></div>
                </dl>
              ) : null}
              {usado ? (
                <button type="button" className="gp-pdv-btn-secondary" onClick={novoVoucher}>
                  Novo voucher
                </button>
              ) : null}
            </>
          ) : null}

          {painelEstado === "sucesso" ? (
            <div className="gp-pdv-sucesso">
              <div className="gp-pdv-sucesso__ico" aria-hidden>
                <CheckCircle2 size={32} />
              </div>
              <span className="gp-pdv-badge gp-pdv-badge--ok">Voucher utilizado</span>
              <div className="gp-pdv-painel__valor">{fmtMoeda(voucher.valor_final)}</div>
              <p className="gp-pdv-sucesso__cliente">{voucher.cliente_nome_completo || "—"}</p>
              <dl className="gp-pdv-dl">
                <div><dt>Código</dt><dd className="gp-pdv-mono">{voucher.codigo_resgate || "—"}</dd></div>
                <div>
                  <dt>Baixa</dt>
                  <dd>
                    {voucher.usado_em
                      ? `Registrada às ${fmtHora(voucher.usado_em)}`
                      : "Registrada com sucesso"}
                  </dd>
                </div>
                {ultimoOperadorNome || voucher.operador_nome_snapshot ? (
                  <div>
                    <dt>Frentista</dt>
                    <dd>{voucher.operador_nome_snapshot || ultimoOperadorNome}</dd>
                  </div>
                ) : null}
              </dl>
              <div className="gp-pdv-sucesso__acoes">
                <button
                  type="button"
                  className="gp-pdv-btn-secondary"
                  onClick={() => setComprovanteAberto(true)}
                >
                  <Printer size={16} aria-hidden /> Imprimir comprovante
                </button>
                <button type="button" className="gp-pdv-btn-primary" onClick={novoVoucher}>
                  Novo voucher
                </button>
              </div>
            </div>
          ) : null}
        </aside>
      </div>

      <Modal
        open={modalOperadorAberto}
        onClose={fecharModalOperador}
        title="Confirmar baixa"
        description="Informe o código de acesso ou o e-mail e a senha do frentista."
        size="sm"
        footer={
          <ModalActions>
            <Button type="button" variant="outline" onClick={fecharModalOperador} disabled={baixando}>
              Cancelar
            </Button>
            <Button type="submit" form="form-pdv-operador-baixa" variant="primary" disabled={baixando}>
              {baixando ? "Registrando…" : "Confirmar baixa"}
            </Button>
          </ModalActions>
        }
      >
        <form
          id="form-pdv-operador-baixa"
          className="gp-pdv-modal-form"
          onSubmit={onConfirmarBaixaComOperador}
        >
          {voucher ? (
            <div className="gp-pdv-modal-resumo">
              <div>
                <span>Voucher</span>
                <strong className="gp-pdv-mono">{voucher.codigo_resgate || codigo}</strong>
              </div>
              <div>
                <span>Valor</span>
                <strong>{fmtMoeda(voucher.valor_final)}</strong>
              </div>
            </div>
          ) : null}
          <label className="gp-pdv-label">
            Código ou e-mail
            <input
              ref={operadorCodigoRef}
              className="gp-pdv-input"
              value={operadorCodigo}
              onChange={(e) => setOperadorCodigo(e.target.value)}
              onKeyDown={onOperadorCodigoKeyDown}
              placeholder="Código ou e-mail"
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <label className="gp-pdv-label">
            Senha
            <input
              ref={operadorSenhaRef}
              className="gp-pdv-input"
              type="password"
              value={operadorSenha}
              onChange={(e) => setOperadorSenha(e.target.value)}
              autoComplete="off"
            />
          </label>
        </form>
      </Modal>

      <VoucherComprovanteModal
        open={comprovanteAberto}
        onClose={() => setComprovanteAberto(false)}
        voucher={voucher}
        redeNome={rede?.nome_fantasia || rede?.nome || ""}
      />
    </div>
  );
}

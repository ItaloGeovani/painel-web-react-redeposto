import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Banknote, CheckCircle2, Printer, Search, Ticket } from "lucide-react";
import {
  baixarVoucherPorCodigo,
  consultarVoucherPorCodigo
} from "../../servicos/voucherConsultaEquipeServico";
import { toastErro, toastSucesso } from "../../servicos/toastServico";
import Badge from "../../componentes/ui/Badge";
import Button from "../../componentes/ui/Button";
import Card from "../../componentes/ui/Card";
import Modal, { ModalActions } from "../../componentes/ui/Modal";
import VoucherComprovanteModal from "../../componentes/voucher/VoucherComprovanteModal";
import { isDesktop } from "../../configuracao/appTarget";
import FrentistaValidarVoucherPdv from "./FrentistaValidarVoucherPdv";

function fmtMoeda(v) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v) || 0);
}

function fmtDataHora(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return String(iso);
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(d);
}

function rotuloStatus(status) {
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

function resgateExpirado(v) {
  if (!v?.expira_resgate_em) return false;
  const t = new Date(v.expira_resgate_em).getTime();
  return Number.isFinite(t) && t < Date.now();
}

function postoOperadorBloqueado(v) {
  return v?.operador_pode_registrar_uso === false;
}

/** Status em que o uso poderia ser registrado (ignorando prazo/posto). */
function statusPermiteUso(v) {
  if (!v) return false;
  if (v.aguarda_pagamento_dinheiro) return true;
  const st = String(v.status || "").trim().toUpperCase();
  return st === "ATIVO" || st === "AGUARDANDO_DINHEIRO";
}

function podeRegistrarUso(v) {
  if (!statusPermiteUso(v)) return false;
  if (resgateExpirado(v)) return false;
  if (postoOperadorBloqueado(v)) return false;
  return true;
}

/** Motivos explícitos para o frentista (pode haver mais de um). */
function motivosBloqueioUso(v) {
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

export default function FrentistaValidarVoucherSecao({ rede }) {
  if (isDesktop) {
    return <FrentistaValidarVoucherPdv rede={rede} />;
  }

  return <FrentistaValidarVoucherWeb rede={rede} />;
}

function FrentistaValidarVoucherWeb({ rede }) {
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
      setModalOperadorAberto(false);
      limparOperador();
      setBaixaRecemFeita(true);
      const dinheiro = String(r.meio_pagamento || "").toUpperCase() === "DINHEIRO";
      toastSucesso(
        dinheiro
          ? "Pagamento em dinheiro confirmado e uso registrado. Pode abastecer."
          : "Uso do voucher registrado. Pode abastecer."
      );
    } catch (err) {
      toastErro(err.message || "Falha ao registrar uso.");
      limparOperador();
      setTimeout(() => operadorCodigoRef.current?.focus(), 30);
    } finally {
      setBaixando(false);
    }
  }

  function onOperadorCodigoKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      operadorSenhaRef.current?.focus();
    }
  }

  const aguardaDinheiro = !!voucher?.aguarda_pagamento_dinheiro;
  const usado = voucher?.status === "USADO";
  const motivosBloqueio = voucher && !usado ? motivosBloqueioUso(voucher) : [];
  const liberadoParaUso = voucher ? podeRegistrarUso(voucher) : false;

  return (
    <div className="gp-frentista-validar">
      <Card className="gp-frentista-validar__hero">
        <div className="gp-frentista-validar__hero-topo">
          <div className="gp-frentista-validar__icon" aria-hidden>
            <Ticket size={22} />
          </div>
          <div>
            <h3 className="gp-frentista-validar__titulo">Validar voucher</h3>
            <p className="gp-frentista-validar__ajuda">
              Digite o código apresentado pelo cliente. Em pagamento em dinheiro, confirme o
              recebimento antes de liberar o abastecimento.
            </p>
            {rede?.nome_fantasia ? (
              <p className="gp-frentista-validar__rede">{rede.nome_fantasia}</p>
            ) : null}
          </div>
        </div>

        <form className="gp-frentista-validar__form" onSubmit={onConsultar}>
          <label className="gp-frentista-validar__campo">
            Código do voucher
            <input
              ref={inputRef}
              className="gp-frentista-validar__input"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              placeholder="Ex.: AB12CD34"
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <Button type="submit" icon={Search} disabled={consultando} className="gp-frentista-validar__btn">
            {consultando ? "Consultando…" : "Consultar"}
          </Button>
        </form>
      </Card>

      {voucher ? (
        <Card className="gp-frentista-validar__resultado">
          {baixaRecemFeita && usado ? (
            <div className="gp-frentista-validar__sucesso">
              <div className="gp-frentista-validar__sucesso-icone" aria-hidden>
                <CheckCircle2 size={28} />
              </div>
              <h3>Voucher utilizado</h3>
              <p>
                <strong>{fmtMoeda(voucher.valor_final)}</strong>
                {voucher.cliente_nome_completo ? ` — ${voucher.cliente_nome_completo}` : ""}
              </p>
              {voucher.codigo_resgate ? (
                <p>
                  Código <strong className="gp-frentista-validar__codigo">{voucher.codigo_resgate}</strong>
                </p>
              ) : null}
              {voucher.usado_em ? (
                <p>Baixa registrada em {fmtDataHora(voucher.usado_em)}</p>
              ) : (
                <p>Baixa registrada com sucesso.</p>
              )}
              <div className="gp-frentista-validar__sucesso-acoes">
                <Button
                  type="button"
                  icon={Printer}
                  variant="outline"
                  onClick={() => setComprovanteAberto(true)}
                >
                  Imprimir comprovante
                </Button>
                <Button type="button" icon={Ticket} onClick={novoVoucher}>
                  Novo voucher
                </Button>
              </div>
            </div>
          ) : (
            <>
              {aguardaDinheiro ? (
                <div className="gp-frentista-validar__aviso" role="alert">
                  <AlertTriangle size={20} aria-hidden />
                  <div>
                    <strong>{voucher.aviso_titulo || "Cobrar pagamento em dinheiro"}</strong>
                    <p>
                      {voucher.aviso_corpo ||
                        "Receba o valor em dinheiro do cliente e confirme abaixo para liberar o abastecimento."}
                    </p>
                  </div>
                </div>
              ) : null}

              {motivosBloqueio.length > 0 ? (
                <div className="gp-frentista-validar__bloqueios" role="alert">
                  {motivosBloqueio.map((m) => (
                    <div key={m.titulo} className="gp-frentista-validar__aviso gp-frentista-validar__aviso--erro">
                      <AlertTriangle size={20} aria-hidden />
                      <div>
                        <strong>{m.titulo}</strong>
                        <p>{m.corpo}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="gp-frentista-validar__meta">
                <div>
                  <span>Status</span>
                  <Badge
                    variant={
                      motivosBloqueio.length > 0
                        ? "danger"
                        : aguardaDinheiro
                          ? "warning"
                          : voucher.status === "ATIVO"
                            ? "success"
                            : "neutral"
                    }
                  >
                    {rotuloStatus(voucher.status)}
                  </Badge>
                </div>
                <div>
                  <span>Meio</span>
                  <strong>
                    {String(voucher.meio_pagamento || "").toUpperCase() === "DINHEIRO" ? (
                      <>
                        <Banknote size={14} aria-hidden /> Dinheiro
                      </>
                    ) : (
                      "PIX"
                    )}
                  </strong>
                </div>
                <div>
                  <span>Valor</span>
                  <strong>{fmtMoeda(voucher.valor_final)}</strong>
                </div>
                <div>
                  <span>Cliente</span>
                  <strong>{voucher.cliente_nome_completo || "—"}</strong>
                </div>
                {voucher.codigo_resgate ? (
                  <div>
                    <span>Código</span>
                    <strong className="gp-frentista-validar__codigo">{voucher.codigo_resgate}</strong>
                  </div>
                ) : null}
                {voucher.posto_compra_nome || voucher.uso_restrito_ao_posto_compra ? (
                  <div>
                    <span>Posto permitido</span>
                    <strong>{voucher.posto_compra_nome || "Restrito ao posto da compra"}</strong>
                  </div>
                ) : null}
                {voucher.expira_resgate_em ? (
                  <div>
                    <span>Validade do resgate</span>
                    <strong className={resgateExpirado(voucher) ? "gp-frentista-validar__vencido" : undefined}>
                      {fmtDataHora(voucher.expira_resgate_em)}
                      {resgateExpirado(voucher) ? " (vencido)" : ""}
                    </strong>
                  </div>
                ) : null}
              </div>

              {liberadoParaUso ? (
                <Button
                  type="button"
                  icon={CheckCircle2}
                  disabled={baixando}
                  onClick={abrirConfirmacaoBaixa}
                  className="gp-frentista-validar__baixar"
                >
                  {baixando
                    ? "Registrando…"
                    : aguardaDinheiro
                      ? "Confirmar pagamento em dinheiro e registrar uso"
                      : "Registrar uso"}
                </Button>
              ) : usado ? (
                <div className="gp-frentista-validar__pos-uso">
                  <p className="gp-frentista-validar__ok">
                    <CheckCircle2 size={16} aria-hidden /> Voucher utilizado. Pode abastecer.
                  </p>
                  <Button
                    type="button"
                    icon={Printer}
                    variant="outline"
                    onClick={() => setComprovanteAberto(true)}
                    className="gp-frentista-validar__comprovante"
                  >
                    Ver comprovante / Imprimir
                  </Button>
                  <Button type="button" icon={Ticket} onClick={novoVoucher}>
                    Novo voucher
                  </Button>
                </div>
              ) : (
                <p className="gp-frentista-validar__bloqueado">
                  Não é possível registrar o uso agora. Veja o motivo acima.
                </p>
              )}
            </>
          )}
        </Card>
      ) : null}

      <Modal
        open={modalOperadorAberto}
        onClose={fecharModalOperador}
        title="Confirmar baixa"
        description="Digite o código de acesso ou o e-mail e a senha do frentista que está registrando o uso. A baixa será vinculada a ele, não ao usuário logado no painel."
        size="sm"
        footer={
          <ModalActions>
            <Button type="button" variant="outline" onClick={fecharModalOperador} disabled={baixando}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="form-frentista-operador-baixa"
              variant="primary"
              disabled={baixando}
            >
              {baixando ? "Registrando…" : "Confirmar baixa"}
            </Button>
          </ModalActions>
        }
      >
        <form
          id="form-frentista-operador-baixa"
          className="gp-frentista-validar__operador-form"
          onSubmit={onConfirmarBaixaComOperador}
        >
          {voucher ? (
            <div className="gp-frentista-validar__meta" style={{ marginBottom: 4 }}>
              <div>
                <span>Voucher</span>
                <strong className="gp-frentista-validar__codigo">
                  {voucher.codigo_resgate || codigo}
                </strong>
              </div>
              <div>
                <span>Valor</span>
                <strong>{fmtMoeda(voucher.valor_final)}</strong>
              </div>
            </div>
          ) : null}
          <label className="gp-frentista-validar__campo">
            Código ou e-mail
            <input
              ref={operadorCodigoRef}
              className="gp-frentista-validar__input"
              value={operadorCodigo}
              onChange={(e) => setOperadorCodigo(e.target.value)}
              onKeyDown={onOperadorCodigoKeyDown}
              placeholder="Código ou e-mail"
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <label className="gp-frentista-validar__campo">
            Senha
            <input
              ref={operadorSenhaRef}
              className="gp-frentista-validar__input"
              type="password"
              value={operadorSenha}
              onChange={(e) => setOperadorSenha(e.target.value)}
              placeholder="Senha"
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

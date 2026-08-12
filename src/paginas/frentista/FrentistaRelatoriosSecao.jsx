import { useEffect, useRef, useState } from "react";
import Button from "../../componentes/ui/Button";
import Modal, { ModalActions } from "../../componentes/ui/Modal";
import { isDesktop } from "../../configuracao/appTarget";
import { obterRelatorioBaixasFrentista } from "../../servicos/frentistaRelatoriosServico";
import { toastErro } from "../../servicos/toastServico";
import { fmtDataHora, fmtMoeda } from "./frentistaValidarHelpers";

/**
 * Relatórios do frentista: exige código + senha (como a baixa)
 * e mostra só as baixas de quem autenticou.
 */
export default function FrentistaRelatoriosSecao() {
  const codigoRef = useRef(null);
  const senhaRef = useRef(null);
  const [modalAberto, setModalAberto] = useState(true);
  const [codigo, setCodigo] = useState("");
  const [senha, setSenha] = useState("");
  const [erroModal, setErroModal] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [periodo, setPeriodo] = useState("hoje");
  const [credenciais, setCredenciais] = useState(null);
  const [relatorio, setRelatorio] = useState(null);

  useEffect(() => {
    if (modalAberto) {
      const t = window.setTimeout(() => codigoRef.current?.focus(), 40);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [modalAberto]);

  async function carregar(opCodigo, opSenha, per) {
    setCarregando(true);
    setErroModal("");
    try {
      const r = await obterRelatorioBaixasFrentista({
        codigo: opCodigo,
        senha: opSenha,
        periodo: per
      });
      setRelatorio(r);
      setCredenciais({ codigo: opCodigo, senha: opSenha });
      setModalAberto(false);
      setCodigo("");
      setSenha("");
      setErroModal("");
    } catch (err) {
      const msg = err.message || "Falha ao carregar relatório.";
      setErroModal(msg);
      toastErro(msg);
      setSenha("");
      setTimeout(() => senhaRef.current?.focus(), 30);
    } finally {
      setCarregando(false);
    }
  }

  function onSubmitModal(e) {
    e?.preventDefault?.();
    const c = codigo.trim();
    const s = senha;
    if (!c || !s) {
      setErroModal("Informe o código de acesso ou o e-mail e a senha do frentista.");
      return;
    }
    carregar(c, s, periodo);
  }

  function onCodigoKeyDown(ev) {
    if (ev.key === "Enter") {
      ev.preventDefault();
      senhaRef.current?.focus();
    }
  }

  function trocarFrentista() {
    setCredenciais(null);
    setRelatorio(null);
    setCodigo("");
    setSenha("");
    setErroModal("");
    setPeriodo("hoje");
    setModalAberto(true);
  }

  async function onMudarPeriodo(novo) {
    if (novo === periodo) return;
    setPeriodo(novo);
    if (!credenciais) {
      return;
    }
    await carregar(credenciais.codigo, credenciais.senha, novo);
  }

  const wrapClass = isDesktop ? "gp-pdv-relatorio" : "frentista-relatorio";

  return (
    <div className={wrapClass}>
      {!relatorio && !modalAberto ? (
        <article className="card-resumo">
          <p>Informe o código ou e-mail e a senha do frentista para ver o relatório.</p>
          <Button type="button" variant="primary" onClick={() => setModalAberto(true)}>
            Identificar frentista
          </Button>
        </article>
      ) : null}

      {relatorio ? (
        <>
          <div className={isDesktop ? "gp-pdv-relatorio__topo" : "frentista-relatorio__topo"}>
            <div>
              <h2 className={isDesktop ? "gp-pdv-relatorio__titulo" : undefined}>
                Relatório de baixas
              </h2>
              <p>
                Frentista: <strong>{relatorio.operador?.nome || "—"}</strong>
              </p>
            </div>
            <div className={isDesktop ? "gp-pdv-relatorio__acoes" : "frentista-relatorio__acoes"}>
              <div className="frentista-relatorio__periodos" role="group" aria-label="Período">
                <button
                  type="button"
                  className={`frentista-relatorio__periodo ${periodo === "hoje" ? "is-ativo" : ""}`}
                  disabled={carregando}
                  onClick={() => onMudarPeriodo("hoje")}
                >
                  Hoje
                </button>
                <button
                  type="button"
                  className={`frentista-relatorio__periodo ${periodo === "7d" ? "is-ativo" : ""}`}
                  disabled={carregando}
                  onClick={() => onMudarPeriodo("7d")}
                >
                  Últimos 7 dias
                </button>
              </div>
              <Button type="button" variant="outline" onClick={trocarFrentista} disabled={carregando}>
                Trocar frentista
              </Button>
            </div>
          </div>

          <div className="grid-resumo">
            <article className="card-resumo">
              <h3>Baixas</h3>
              <strong className="tabela-num">{relatorio.totais?.qtd ?? 0}</strong>
              <p>{periodo === "7d" ? "Nos últimos 7 dias" : "No dia de hoje"}</p>
            </article>
            <article className="card-resumo">
              <h3>Valor total</h3>
              <strong className="tabela-num">{fmtMoeda(relatorio.totais?.valor)}</strong>
              <p>Soma dos vouchers utilizados</p>
            </article>
          </div>

          {carregando ? <p className="rede-detalhes__ajuda">Atualizando…</p> : null}

          {(relatorio.itens || []).length === 0 ? (
            <article className="card-resumo" style={{ marginTop: 16 }}>
              <p>Nenhuma baixa neste período para este frentista.</p>
            </article>
          ) : (
            <div className="frentista-relatorio__tabela-wrap">
              <table className="frentista-relatorio__tabela">
                <thead>
                  <tr>
                    <th>Horário</th>
                    <th>Código</th>
                    <th>Cliente</th>
                    <th>Pagamento</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {relatorio.itens.map((item) => (
                    <tr key={item.id}>
                      <td>{item.usado_em ? fmtDataHora(item.usado_em) : "—"}</td>
                      <td className="gp-pdv-mono">{item.codigo_resgate || "—"}</td>
                      <td>{item.cliente_nome_completo || "—"}</td>
                      <td>{item.meio_pagamento || "—"}</td>
                      <td>{fmtMoeda(item.valor_final)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}

      <Modal
        open={modalAberto}
        onClose={() => {
          if (carregando) return;
          setModalAberto(false);
          setErroModal("");
        }}
        title="Identificar frentista"
        description="Informe o código de acesso ou o e-mail do frentista e a senha."
        size="sm"
        footer={
          <ModalActions>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (carregando) return;
                setModalAberto(false);
                setErroModal("");
              }}
              disabled={carregando}
            >
              Cancelar
            </Button>
            <Button type="submit" form="form-frentista-relatorio-auth" variant="primary" disabled={carregando}>
              {carregando ? "Carregando…" : "Ver relatório"}
            </Button>
          </ModalActions>
        }
      >
        <form id="form-frentista-relatorio-auth" className="gp-pdv-modal-form" onSubmit={onSubmitModal}>
          {erroModal ? (
            <div className="frentista-relatorio__erro" role="alert">
              {erroModal}
            </div>
          ) : null}
          <label className="gp-pdv-label">
            Código ou e-mail
            <input
              ref={codigoRef}
              className="gp-pdv-input"
              value={codigo}
              onChange={(e) => {
                setCodigo(e.target.value);
                setErroModal("");
              }}
              onKeyDown={onCodigoKeyDown}
              placeholder="Código ou e-mail"
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <label className="gp-pdv-label">
            Senha
            <input
              ref={senhaRef}
              className="gp-pdv-input"
              type="password"
              value={senha}
              onChange={(e) => {
                setSenha(e.target.value);
                setErroModal("");
              }}
              autoComplete="off"
            />
          </label>
        </form>
      </Modal>
    </div>
  );
}

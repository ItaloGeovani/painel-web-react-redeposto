import { Fragment, useEffect, useMemo, useState } from "react";
import {
  ativarRede,
  criarRede,
  desativarRede,
  editarRede,
  listarRedes
} from "../../servicos/redesServico";
import { toastErro, toastSucesso } from "../../servicos/toastServico";
import RedeDetalhesSecao from "./RedeDetalhesSecao";

const estadoInicial = {
  id: "",
  nome_fantasia: "",
  razao_social: "",
  cnpj: "",
  email_contato: "",
  telefone: "",
  valor_implantacao: "",
  valor_mensalidade: "",
  primeiro_cobranca: ""
};

export default function RedesGestaoSecao() {
  const [redes, setRedes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState(estadoInicial);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [redeExpandidaId, setRedeExpandidaId] = useState(null);
  const [redeDetalheId, setRedeDetalheId] = useState(null);

  const totalAtivas = useMemo(() => redes.filter((r) => r.ativa).length, [redes]);

  const redeEmDetalhe = useMemo(
    () => (redeDetalheId ? redes.find((r) => r.id === redeDetalheId) : null),
    [redes, redeDetalheId]
  );

  async function carregar() {
    setCarregando(true);
    try {
      const itens = await listarRedes();
      setRedes(itens);
    } catch (err) {
      toastErro(err.message || "Falha ao carregar redes.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  useEffect(() => {
    if (!redeDetalheId || carregando) {
      return;
    }
    const existe = redes.some((r) => r.id === redeDetalheId);
    if (!existe) {
      setRedeDetalheId(null);
    }
  }, [redeDetalheId, redes, carregando]);

  function limparFormulario() {
    setForm(estadoInicial);
    setModoEdicao(false);
    setMostrarFormulario(false);
  }

  function preencherEdicao(rede) {
    setForm({
      id: rede.id,
      nome_fantasia: rede.nome_fantasia || "",
      razao_social: rede.razao_social || "",
      cnpj: rede.cnpj || "",
      email_contato: rede.email_contato || "",
      telefone: rede.telefone || "",
      valor_implantacao: rede.valor_implantacao?.toString?.() || "",
      valor_mensalidade: rede.valor_mensalidade?.toString?.() || "",
      primeiro_cobranca: rede.primeiro_cobranca ? rede.primeiro_cobranca.slice(0, 10) : ""
    });
    setModoEdicao(true);
    setMostrarFormulario(true);
  }

  async function onSubmit(event) {
    event.preventDefault();
    setSalvando(true);

    try {
      if (modoEdicao) {
        await editarRede({
          id: form.id,
          nome_fantasia: form.nome_fantasia,
          razao_social: form.razao_social,
          cnpj: form.cnpj,
          email_contato: form.email_contato,
          telefone: form.telefone,
          valor_implantacao: Number(form.valor_implantacao || 0),
          valor_mensalidade: Number(form.valor_mensalidade || 0),
          primeiro_cobranca: form.primeiro_cobranca
        });
        toastSucesso("Rede atualizada com sucesso.");
      } else {
        await criarRede({
          nome_fantasia: form.nome_fantasia,
          razao_social: form.razao_social,
          cnpj: form.cnpj,
          email_contato: form.email_contato,
          telefone: form.telefone,
          valor_implantacao: Number(form.valor_implantacao || 0),
          valor_mensalidade: Number(form.valor_mensalidade || 0),
          primeiro_cobranca: form.primeiro_cobranca
        });
        toastSucesso("Rede criada com sucesso.");
      }
      limparFormulario();
      await carregar();
    } catch (err) {
      toastErro(err.message || "Falha ao salvar rede.");
    } finally {
      setSalvando(false);
    }
  }

  async function alternarStatus(rede) {
    try {
      if (rede.ativa) {
        await desativarRede(rede.id);
        toastSucesso("Rede desativada com sucesso.");
      } else {
        await ativarRede(rede.id);
        toastSucesso("Rede ativada com sucesso.");
      }
      await carregar();
    } catch (err) {
      toastErro(err.message || "Falha ao alterar status da rede.");
    }
  }

  function abrirEdicaoDesdeDetalhe(redeAlvo) {
    setRedeDetalheId(null);
    preencherEdicao(redeAlvo);
  }

  if (redeDetalheId && redeEmDetalhe) {
    return (
      <RedeDetalhesSecao
        rede={redeEmDetalhe}
        onVoltar={() => setRedeDetalheId(null)}
        onEditarRede={abrirEdicaoDesdeDetalhe}
        onRedeRefresh={carregar}
      />
    );
  }

  return (
    <div className="secao-redes">
      <div className="secao-redes__topo">
        <div className="secao-redes__intro">
          <p>Total: {redes.length} | Ativas: {totalAtivas}</p>
          <p className="secao-redes__fluxo">
            Esta e a lista de todas as redes. Use <strong>Gerenciar</strong> para abrir o painel com abas (visao
            geral, gestor, clientes, postos com equipe por unidade, e outras areas).
          </p>
        </div>
        <button
          type="button"
          className="botao-primario"
          onClick={() => {
            setRedeDetalheId(null);
            setModoEdicao(false);
            setForm(estadoInicial);
            setMostrarFormulario((v) => !v);
          }}
        >
          {mostrarFormulario ? "Fechar formulario" : "Adicionar Rede"}
        </button>
      </div>

      {mostrarFormulario ? (
        <form className="form-rede" onSubmit={onSubmit}>
          <div className="form-rede__grid">
            <input
              className="campo__input"
              placeholder="Nome fantasia"
              value={form.nome_fantasia}
              onChange={(e) => setForm((prev) => ({ ...prev, nome_fantasia: e.target.value }))}
            />
            <input
              className="campo__input"
              placeholder="Razao social"
              value={form.razao_social}
              onChange={(e) => setForm((prev) => ({ ...prev, razao_social: e.target.value }))}
            />
            <input
              className="campo__input"
              placeholder="CNPJ"
              value={form.cnpj}
              onChange={(e) => setForm((prev) => ({ ...prev, cnpj: e.target.value }))}
            />
            <input
              className="campo__input"
              placeholder="Email de contato"
              value={form.email_contato}
              onChange={(e) => setForm((prev) => ({ ...prev, email_contato: e.target.value }))}
            />
            <input
              className="campo__input"
              placeholder="Telefone"
              value={form.telefone}
              onChange={(e) => setForm((prev) => ({ ...prev, telefone: e.target.value }))}
            />
            <input
              className="campo__input"
              type="number"
              min="0"
              step="0.01"
              placeholder="Valor da implantacao"
              value={form.valor_implantacao}
              onChange={(e) => setForm((prev) => ({ ...prev, valor_implantacao: e.target.value }))}
            />
            <input
              className="campo__input"
              type="number"
              min="0"
              step="0.01"
              placeholder="Valor da mensalidade"
              value={form.valor_mensalidade}
              onChange={(e) => setForm((prev) => ({ ...prev, valor_mensalidade: e.target.value }))}
            />
            <input
              className="campo__input"
              type="date"
              value={form.primeiro_cobranca}
              onChange={(e) => setForm((prev) => ({ ...prev, primeiro_cobranca: e.target.value }))}
            />
          </div>

          <div className="form-rede__acoes">
            <button className="botao-primario" type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : modoEdicao ? "Salvar Edicao" : "Criar Rede"}
            </button>
            <button type="button" className="botao-secundario" onClick={limparFormulario}>
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

      {carregando ? (
        <p className="secao-redes__carregando">Carregando redes...</p>
      ) : (
        <div className="tabela-wrap">
          <table className="tabela-redes tabela-redes--compacta">
            <thead>
              <tr>
                <th className="tabela-redes__th-expand" scope="col" aria-label="Detalhes" />
                <th>Rede</th>
                <th>Status</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {redes.map((rede) => {
                const aberta = redeExpandidaId === rede.id;
                return (
                  <Fragment key={rede.id}>
                    <tr className={aberta ? "tabela-redes__linha--aberta" : undefined}>
                      <td className="tabela-redes__col-expand">
                        <button
                          type="button"
                          className="tabela-redes__expand"
                          aria-expanded={aberta}
                          aria-label={aberta ? "Ocultar dados comerciais e contato" : "Ver dados comerciais e contato"}
                          onClick={() =>
                            setRedeExpandidaId((id) => (id === rede.id ? null : rede.id))
                          }
                        >
                          <span className="tabela-redes__expand-ico" aria-hidden>
                            {aberta ? "▼" : "▶"}
                          </span>
                        </button>
                      </td>
                      <td className="tabela-celula--stack">
                        <span className="tabela-celula__principal">{rede.nome_fantasia}</span>
                        <div className="tabela-redes__sub">{rede.razao_social}</div>
                      </td>
                      <td>
                        <span
                          className={`tag-status ${rede.ativa ? "tag-status--ativo" : "tag-status--inativo"}`}
                        >
                          {rede.ativa ? "Ativa" : "Inativa"}
                        </span>
                      </td>
                      <td>
                        <div className="tabela-redes__acoes">
                          <button
                            type="button"
                            className="tabela-btn tabela-btn--outline"
                            onClick={() => setRedeDetalheId(rede.id)}
                          >
                            Gerenciar
                          </button>
                          <button
                            type="button"
                            className="tabela-btn tabela-btn--acento"
                            onClick={() => preencherEdicao(rede)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className={`tabela-btn ${rede.ativa ? "tabela-btn--perigo" : "tabela-btn--outline"}`}
                            onClick={() => alternarStatus(rede)}
                          >
                            {rede.ativa ? "Desativar" : "Ativar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {aberta ? (
                      <tr className="tabela-redes__linha-detalhe">
                        <td colSpan={4}>
                          <div
                            className="tabela-redes__detalhe-grid"
                            role="region"
                            aria-label="Dados comerciais e contato"
                          >
                            <div className="tabela-redes__detalhe-item">
                              <span className="tabela-redes__detalhe-label">CNPJ</span>
                              <span className="tabela-redes__detalhe-valor tabela-num">{rede.cnpj || "—"}</span>
                            </div>
                            <div className="tabela-redes__detalhe-item">
                              <span className="tabela-redes__detalhe-label">Email</span>
                              <span className="tabela-redes__detalhe-valor">{rede.email_contato || "—"}</span>
                            </div>
                            <div className="tabela-redes__detalhe-item">
                              <span className="tabela-redes__detalhe-label">Telefone</span>
                              <span className="tabela-redes__detalhe-valor">{rede.telefone || "—"}</span>
                            </div>
                            <div className="tabela-redes__detalhe-item">
                              <span className="tabela-redes__detalhe-label">Implantacao</span>
                              <span className="tabela-redes__detalhe-valor tabela-num">
                                {Number(rede.valor_implantacao || 0).toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL"
                                })}
                              </span>
                            </div>
                            <div className="tabela-redes__detalhe-item">
                              <span className="tabela-redes__detalhe-label">Mensalidade</span>
                              <span className="tabela-redes__detalhe-valor tabela-num">
                                {Number(rede.valor_mensalidade || 0).toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL"
                                })}
                              </span>
                            </div>
                            <div className="tabela-redes__detalhe-item">
                              <span className="tabela-redes__detalhe-label">Primeira cobranca</span>
                              <span className="tabela-redes__detalhe-valor tabela-num">
                                {rede.primeiro_cobranca
                                  ? String(rede.primeiro_cobranca).slice(0, 10)
                                  : "—"}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
          {redes.length === 0 ? (
            <p className="tabela-mensagem-vazia">Nenhuma rede cadastrada.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}

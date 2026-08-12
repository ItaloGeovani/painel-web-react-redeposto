import { useEffect, useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { PREFIXO_ADMIN, pathRedeDetalhe } from "../../constantes/rotas";
import {
  ativarRede,
  criarRede,
  desativarRede,
  editarRede,
  listarRedes
} from "../../servicos/redesServico";
import { toastErro, toastSucesso } from "../../servicos/toastServico";
import Badge from "../../componentes/ui/Badge";
import Button from "../../componentes/ui/Button";
import DataTable from "../../componentes/ui/DataTable";
import Modal, { ModalActions } from "../../componentes/ui/Modal";
import RedeDetalhesSecao from "./RedeDetalhesSecao";

const columnHelper = createColumnHelper();

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
  const navigate = useNavigate();
  const { redeId: redeDetalheId, aba: abaUrl } = useParams();
  const [redes, setRedes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState(estadoInicial);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [expanded, setExpanded] = useState({});

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
      navigate(`${PREFIXO_ADMIN}/redes`, { replace: true });
    }
  }, [redeDetalheId, redes, carregando, navigate]);

  function limparFormulario() {
    if (salvando) return;
    setForm(estadoInicial);
    setModoEdicao(false);
    setMostrarFormulario(false);
  }

  function abrirNovaRede() {
    setModoEdicao(false);
    setForm(estadoInicial);
    setMostrarFormulario(true);
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
      setForm(estadoInicial);
      setModoEdicao(false);
      setMostrarFormulario(false);
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
    navigate(`${PREFIXO_ADMIN}/redes`);
    preencherEdicao(redeAlvo);
  }

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "expand",
        header: () => null,
        size: 40,
        cell: ({ row }) => (
          <button
            type="button"
            className="gp-expand-btn"
            aria-expanded={row.getIsExpanded()}
            aria-label={
              row.getIsExpanded() ? "Ocultar dados comerciais e contato" : "Ver dados comerciais e contato"
            }
            onClick={() => row.toggleExpanded()}
          >
            {row.getIsExpanded() ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        )
      }),
      columnHelper.display({
        id: "rede",
        header: "Rede",
        cell: (info) => {
          const rede = info.row.original;
          return (
            <div className="tabela-celula--stack">
              <span className="gp-cell-strong">{rede.nome_fantasia}</span>
              <div className="tabela-redes__sub">{rede.razao_social}</div>
            </div>
          );
        }
      }),
      columnHelper.accessor("ativa", {
        header: "Status",
        cell: (info) => (
          <Badge variant={info.getValue() ? "success" : "danger"}>
            {info.getValue() ? "Ativa" : "Inativa"}
          </Badge>
        )
      }),
      columnHelper.display({
        id: "acoes",
        header: "Acoes",
        cell: (info) => {
          const rede = info.row.original;
          return (
            <div className="tabela-redes__acoes">
              <button
                type="button"
                className="tabela-btn tabela-btn--outline"
                onClick={() => navigate(pathRedeDetalhe(rede.id))}
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
          );
        }
      })
    ],
    [navigate]
  );

  function renderRedeExpandida(rede) {
    return (
      <div className="tabela-redes__detalhe-grid" role="region" aria-label="Dados comerciais e contato">
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
            {rede.primeiro_cobranca ? String(rede.primeiro_cobranca).slice(0, 10) : "—"}
          </span>
        </div>
      </div>
    );
  }

  if (redeDetalheId && redeEmDetalhe) {
    return (
      <RedeDetalhesSecao
        rede={redeEmDetalhe}
        abaInicial={abaUrl}
        onVoltar={() => navigate(`${PREFIXO_ADMIN}/redes`)}
        onEditarRede={abrirEdicaoDesdeDetalhe}
        onRedeRefresh={carregar}
      />
    );
  }

  if (redeDetalheId && !carregando && !redeEmDetalhe) {
    return (
      <article className="card-resumo">
        <p>Carregando rede...</p>
      </article>
    );
  }

  return (
    <div className="secao-redes">
      <div className="secao-redes__topo">
        <div className="secao-redes__intro">
          <p>
            Total: {redes.length} | Ativas: {totalAtivas}
          </p>
          <p className="secao-redes__fluxo">
            Esta e a lista de todas as redes. Use <strong>Gerenciar</strong> para abrir o painel com abas (visao
            geral, gestor, clientes, postos com equipe por unidade, e outras areas).
          </p>
        </div>
        <Button type="button" variant="primary" icon={Plus} onClick={abrirNovaRede}>
          Adicionar Rede
        </Button>
      </div>

      <Modal
        open={mostrarFormulario}
        onClose={limparFormulario}
        title={modoEdicao ? "Editar Rede" : "Adicionar Rede"}
        description="Informe os dados cadastrais e comerciais da rede."
        size="lg"
        footer={
          <ModalActions>
            <Button type="button" variant="outline" onClick={limparFormulario} disabled={salvando}>
              Cancelar
            </Button>
            <Button type="submit" form="form-rede-modal" variant="primary" disabled={salvando}>
              {salvando ? "Salvando..." : modoEdicao ? "Salvar Edicao" : "Criar Rede"}
            </Button>
          </ModalActions>
        }
      >
        <form id="form-rede-modal" className="form-rede" onSubmit={onSubmit}>
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
        </form>
      </Modal>

      <DataTable
        columns={columns}
        data={redes}
        getRowId={(row) => row.id}
        loading={carregando}
        emptyMessage="Nenhuma rede cadastrada."
        expanded={expanded}
        onExpandedChange={setExpanded}
        getRowCanExpand={() => true}
        renderExpandedRow={renderRedeExpandida}
      />
    </div>
  );
}

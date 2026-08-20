import { useEffect, useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Fuel, Plus } from "lucide-react";
import {
  criarCombustivelRede,
  editarCombustivelRede,
  excluirCombustivelRede,
  listarCombustiveisRede
} from "../../servicos/combustiveisRedeServico";
import { listarPostosRede } from "../../servicos/postosServico";
import { carregarSessao } from "../../servicos/sessaoServico";
import { toastErro, toastSucesso } from "../../servicos/toastServico";
import { PAPEL_GERENTE_POSTO } from "../../constantes/papeis";
import CampoComAjuda, { TooltipInfo } from "../../componentes/CampoComAjuda";
import Badge from "../../componentes/ui/Badge";
import Button from "../../componentes/ui/Button";
import DataTable from "../../componentes/ui/DataTable";
import Modal, { ModalActions } from "../../componentes/ui/Modal";

const columnHelper = createColumnHelper();

const formVazio = {
  nome: "",
  codigo: "",
  descricao: "",
  preco_por_litro: "",
  ordem: "0",
  ativo: true
};

function formatarBrl(n) {
  if (n == null || n === "" || !Number.isFinite(Number(n))) {
    return "—";
  }
  return Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function nomePosto(p) {
  if (!p) return "";
  return (p.nome_fantasia || p.nome || p.codigo || p.id || "").trim();
}

export default function CombustiveisRedeSecao({ redeId: redeIdProp } = {}) {
  const sessao = carregarSessao();
  const ehGerente = sessao?.usuario?.papel === PAPEL_GERENTE_POSTO;
  const idPostoSessao = String(sessao?.usuario?.id_posto || "").trim();
  const redeId = String(redeIdProp || sessao?.usuario?.id_rede || "").trim();

  const [postos, setPostos] = useState([]);
  const [idPosto, setIdPosto] = useState(ehGerente ? idPostoSessao : "");
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [form, setForm] = useState(formVazio);
  const [editandoId, setEditandoId] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    async function carregarPostos() {
      if (ehGerente) {
        if (!cancelado) {
          setIdPosto(idPostoSessao);
          setPostos([]);
        }
        return;
      }
      if (!redeId) return;
      try {
        const lista = await listarPostosRede(redeId);
        if (cancelado) return;
        setPostos(lista || []);
        setIdPosto((atual) => {
          if (atual && (lista || []).some((p) => p.id === atual)) return atual;
          return lista?.[0]?.id || "";
        });
      } catch (err) {
        if (!cancelado) {
          setPostos([]);
          toastErro(err.message || "Falha ao carregar postos.");
        }
      }
    }
    carregarPostos();
    return () => {
      cancelado = true;
    };
  }, [redeId, ehGerente, idPostoSessao]);

  async function carregar() {
    if (!idPosto) {
      setItens([]);
      setCarregando(false);
      return;
    }
    setCarregando(true);
    try {
      const lista = await listarCombustiveisRede(idPosto);
      setItens(lista);
    } catch (err) {
      setItens([]);
      toastErro(err.message || "Falha ao carregar combustiveis.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, [idPosto]);

  function fecharModal() {
    if (salvando) return;
    setModalAberto(false);
    setEditandoId(null);
    setForm({ ...formVazio });
  }

  function abrirNovo() {
    if (!idPosto) {
      toastErro("Selecione um posto antes de cadastrar.");
      return;
    }
    setEditandoId(null);
    setForm({ ...formVazio });
    setModalAberto(true);
  }

  function abrirEditar(c) {
    setEditandoId(c.id);
    setForm({
      nome: c.nome || "",
      codigo: c.codigo || "",
      descricao: c.descricao || "",
      preco_por_litro: c.preco_por_litro != null ? String(c.preco_por_litro).replace(".", ",") : "",
      ordem: c.ordem != null ? String(c.ordem) : "0",
      ativo: Boolean(c.ativo)
    });
    setModalAberto(true);
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!idPosto) {
      toastErro("Selecione um posto.");
      return;
    }
    const nome = String(form.nome || "").trim();
    if (!nome) {
      toastErro("Informe o nome do combustivel.");
      return;
    }
    const preco = parseFloat(String(form.preco_por_litro || "").replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(preco) || preco < 0) {
      toastErro("Preco por litro deve ser um numero (ex.: 5,89).");
      return;
    }
    const ordem = parseInt(String(form.ordem || "0"), 10);
    if (!Number.isFinite(ordem)) {
      toastErro("Ordem invalida.");
      return;
    }
    const payload = {
      id_posto: idPosto,
      nome,
      codigo: String(form.codigo || "").trim(),
      descricao: String(form.descricao || "").trim(),
      preco_por_litro: preco,
      ordem,
      ativo: form.ativo
    };
    setSalvando(true);
    try {
      if (editandoId) {
        await editarCombustivelRede({ id: editandoId, ...payload });
        toastSucesso("Combustivel atualizado.");
      } else {
        await criarCombustivelRede(payload);
        toastSucesso("Combustivel cadastrado.");
      }
      setModalAberto(false);
      setEditandoId(null);
      setForm({ ...formVazio });
      await carregar();
    } catch (err) {
      toastErro(err.message || "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  async function onExcluir(c) {
    const ok = window.confirm(`Excluir "${c.nome}"? Essa acao nao pode ser desfeita.`);
    if (!ok) return;
    try {
      await excluirCombustivelRede(c.id);
      toastSucesso("Combustivel excluido.");
      await carregar();
    } catch (err) {
      toastErro(err.message || "Falha ao excluir.");
    }
  }

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "nome",
        header: "Nome",
        cell: (info) => {
          const c = info.row.original;
          return <span className="gp-cell-strong">{c.nome}</span>;
        }
      }),
      columnHelper.accessor("codigo", {
        header: "Codigo",
        cell: (info) => info.getValue() || "—"
      }),
      columnHelper.accessor("preco_por_litro", {
        header: "Preço / L",
        cell: (info) => formatarBrl(info.getValue())
      }),
      columnHelper.accessor("ordem", {
        header: "Ordem",
        cell: (info) => info.getValue() ?? 0
      }),
      columnHelper.accessor("ativo", {
        header: "Ativo",
        cell: (info) => (
          <Badge variant={info.getValue() ? "success" : "danger"}>
            {info.getValue() ? "Sim" : "Nao"}
          </Badge>
        )
      }),
      columnHelper.display({
        id: "acoes",
        header: "Acoes",
        cell: (info) => {
          const c = info.row.original;
          return (
            <div className="tabela-redes__acoes" onClick={(e) => e.stopPropagation()}>
              <button type="button" className="tabela-btn" onClick={() => abrirEditar(c)}>
                Editar
              </button>
              <button type="button" className="tabela-btn" onClick={() => onExcluir(c)}>
                Excluir
              </button>
            </div>
          );
        }
      })
    ],
    []
  );

  function itensExpandCombustivel(c) {
    return [
      { label: "Descricao", value: c.descricao || "—", wide: true },
      { label: "Codigo", value: c.codigo || "—" },
      { label: "Preco / litro", value: formatarBrl(c.preco_por_litro) },
      { label: "Ordem", value: String(c.ordem ?? 0) },
      { label: "Status", value: c.ativo ? "Ativo" : "Inativo" }
    ];
  }

  const postoAtual = postos.find((p) => p.id === idPosto);
  const labelPostoGerente = ehGerente
    ? "Seu posto"
    : postoAtual
      ? nomePosto(postoAtual)
      : "posto selecionado";

  return (
    <div className="combustiveis-rede-secao">
      <p className="rede-detalhes__ajuda">
        Cadastre os combustiveis ofertados em cada posto e o <strong>preco atual por litro</strong> daquele
        posto (referencia para precificacao e outras funcionalidades). Gestor escolhe o posto; gerente edita
        apenas o seu.
      </p>

      {!ehGerente ? (
        <div className="form-rede" style={{ marginBottom: 16 }}>
          <CampoComAjuda rotulo="Posto" dica="Cada posto tem seu próprio catálogo e preços.">
            <select
              className="campo__input"
              value={idPosto}
              onChange={(e) => setIdPosto(e.target.value)}
              aria-label="Posto"
            >
              {postos.length === 0 ? <option value="">Nenhum posto cadastrado</option> : null}
              {postos.map((p) => (
                <option key={p.id} value={p.id}>
                  {nomePosto(p)}
                </option>
              ))}
            </select>
          </CampoComAjuda>
        </div>
      ) : (
        <p className="rede-detalhes__ajuda" style={{ marginBottom: 12 }}>
          Editando combustiveis do posto vinculado a sua conta.
        </p>
      )}

      <div className="rede-detalhes__linha-titulo" style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Lista — {labelPostoGerente}</h2>
        <Button type="button" variant="primary" icon={Plus} onClick={abrirNovo} disabled={!idPosto}>
          Novo combustivel
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={itens}
        getRowId={(row) => row.id}
        loading={carregando}
        emptyMessage={
          idPosto
            ? "Nenhum combustivel cadastrado neste posto."
            : "Selecione um posto para ver os combustiveis."
        }
        showExpandColumn
        getExpandedItems={itensExpandCombustivel}
      />

      <Modal
        open={modalAberto}
        onClose={fecharModal}
        title={editandoId ? "Editar combustivel" : "Novo combustivel"}
        description="Informe o nome e o preco por litro deste posto. Codigo e descricao sao opcionais."
        size="md"
        footer={
          <ModalActions>
            <Button type="button" variant="outline" onClick={fecharModal} disabled={salvando}>
              Cancelar
            </Button>
            <Button type="submit" form="form-combustivel-modal" variant="primary" disabled={salvando} icon={Fuel}>
              {salvando ? "Salvando..." : "Salvar"}
            </Button>
          </ModalActions>
        }
      >
        <form id="form-combustivel-modal" className="form-rede form-rede--equipe" onSubmit={onSubmit}>
          <div className="form-rede__grid">
            <CampoComAjuda rotulo="Nome" dica="Nome do combustível exibido no app e no painel." span2>
              <input
                className="campo__input"
                placeholder="Nome (ex.: Gasolina comum)"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                required
                aria-label="Nome"
              />
            </CampoComAjuda>
            <CampoComAjuda rotulo="Codigo" dica="Código opcional e único dentro do posto.">
              <input
                className="campo__input"
                placeholder="Codigo (opcional, unico no posto)"
                value={form.codigo}
                onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
                aria-label="Codigo"
              />
            </CampoComAjuda>
            <CampoComAjuda rotulo="Ordem" dica="Define a ordem de exibição na lista.">
              <input
                className="campo__input"
                placeholder="Ordem (exibicao)"
                value={form.ordem}
                onChange={(e) => setForm((f) => ({ ...f, ordem: e.target.value }))}
                inputMode="numeric"
                aria-label="Ordem"
              />
            </CampoComAjuda>
            <CampoComAjuda
              rotulo="Descricao"
              dica="Texto opcional para detalhar o combustível."
              span2
            >
              <input
                className="campo__input"
                placeholder="Descricao (opcional)"
                value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                aria-label="Descricao"
              />
            </CampoComAjuda>
            <CampoComAjuda rotulo="Preco por litro" dica="Preço deste posto em R$ por litro.">
              <input
                className="campo__input"
                placeholder="Preco por litro (R$)"
                value={form.preco_por_litro}
                onChange={(e) => setForm((f) => ({ ...f, preco_por_litro: e.target.value }))}
                inputMode="decimal"
                required
                aria-label="Preco por litro"
              />
            </CampoComAjuda>
            <label className="form-rede__checkbox-linha form-rede__input-span2">
              <input
                type="checkbox"
                checked={form.ativo}
                onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))}
              />
              Ativo
              <TooltipInfo texto="Combustível ativo pode ser usado nas campanhas por litro deste posto." />
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
}

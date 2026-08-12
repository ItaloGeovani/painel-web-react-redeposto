import { useEffect, useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import {
  cancelarPremioResgate,
  criarPremioRede,
  editarPremioRede,
  entregarPremioResgate,
  listarPremioResgates,
  listarPremiosRede
} from "../../servicos/premiosServico";
import { toastErro, toastSucesso } from "../../servicos/toastServico";
import { datetimeLocalParaIso, isoParaDatetimeLocal } from "../../util/dataHoraLocal";
import CampoComAjuda, { TooltipInfo } from "../../componentes/CampoComAjuda";
import CampoImagemUrl from "../../componentes/CampoImagemUrl";
import Badge from "../../componentes/ui/Badge";
import Button from "../../componentes/ui/Button";
import DataTable from "../../componentes/ui/DataTable";
import Modal, { ModalActions } from "../../componentes/ui/Modal";

const columnHelper = createColumnHelper();
const resgateHelper = createColumnHelper();

const estadoInicialPremio = {
  titulo: "",
  imagem_url: "",
  valor_moeda: "",
  ativo: true,
  vigencia_inicio: "",
  vigencia_fim: "",
  sem_fim: true,
  quantidade: ""
};

function formatarDataCurta(iso) {
  if (!iso) {
    return "—";
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "—";
  }
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function rotuloStatusResgate(r) {
  if (r.status === "ENTREGUE") return "Entregue";
  if (r.status === "CANCELADO") return "Cancelado";
  if (r.prazo_vencido) return "Prazo vencido";
  return "Aguardando retirada";
}

function variantStatusResgate(r) {
  if (r.status === "ENTREGUE") return "success";
  if (r.status === "CANCELADO") return "neutral";
  if (r.prazo_vencido) return "warning";
  return "success";
}

/**
 * @param {{ redeId: string, somenteResgates?: boolean, podeCancelar?: boolean, podeEditarCatalogo?: boolean }} props
 */
export default function AbaPremiosRede({
  redeId,
  somenteResgates = false,
  podeCancelar = true,
  podeEditarCatalogo = true
}) {
  const [aba, setAba] = useState(somenteResgates ? "resgatados" : "catalogo");
  const [premios, setPremios] = useState([]);
  const [resgates, setResgates] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [carregandoResgates, setCarregandoResgates] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(estadoInicialPremio);
  const [salvando, setSalvando] = useState(false);
  const [acaoId, setAcaoId] = useState(null);

  async function carregarCatalogo() {
    setCarregando(true);
    try {
      const itens = await listarPremiosRede(redeId);
      setPremios(itens);
    } catch (err) {
      setPremios([]);
      toastErro(err.message || "Falha ao carregar premios.");
    } finally {
      setCarregando(false);
    }
  }

  async function carregarResgates() {
    setCarregandoResgates(true);
    try {
      const { itens } = await listarPremioResgates(redeId, {
        status: filtroStatus || undefined
      });
      setResgates(itens);
    } catch (err) {
      setResgates([]);
      toastErro(err.message || "Falha ao carregar resgates.");
    } finally {
      setCarregandoResgates(false);
    }
  }

  useEffect(() => {
    if (!somenteResgates) carregarCatalogo();
  }, [redeId, somenteResgates]);

  useEffect(() => {
    if (aba === "resgatados" || somenteResgates) {
      carregarResgates();
    }
  }, [redeId, aba, filtroStatus, somenteResgates]);

  function fecharModal() {
    if (salvando) return;
    setMostrarForm(false);
    setEditandoId(null);
    setForm({ ...estadoInicialPremio });
  }

  function abrirNovo() {
    setEditandoId(null);
    setForm({ ...estadoInicialPremio });
    setMostrarForm(true);
  }

  function abrirEditar(p) {
    setEditandoId(p.id);
    const temFim = Boolean(p.vigencia_fim);
    setForm({
      titulo: p.titulo || "",
      imagem_url: p.imagem_url || "",
      valor_moeda: p.valor_moeda != null ? String(p.valor_moeda) : "",
      ativo: Boolean(p.ativo),
      vigencia_inicio: isoParaDatetimeLocal(p.vigencia_inicio),
      vigencia_fim: isoParaDatetimeLocal(p.vigencia_fim),
      sem_fim: !temFim,
      quantidade: p.quantidade_disponivel != null ? String(p.quantidade_disponivel) : ""
    });
    setMostrarForm(true);
  }

  async function onSubmit(e) {
    e.preventDefault();
    const vi = datetimeLocalParaIso(form.vigencia_inicio);
    if (!vi) {
      toastErro("Informe o inicio da vigencia.");
      return;
    }
    let vf = null;
    if (!form.sem_fim) {
      const parsed = datetimeLocalParaIso(form.vigencia_fim);
      if (!parsed) {
        toastErro("Informe a data fim ou marque vigencia sem data fim.");
        return;
      }
      vf = parsed;
    }
    const valor = parseFloat(String(form.valor_moeda || "").replace(",", "."));
    if (!String(form.titulo || "").trim()) {
      toastErro("Informe o titulo do premio.");
      return;
    }
    if (!Number.isFinite(valor) || valor <= 0) {
      toastErro("Valor em moeda deve ser maior que zero.");
      return;
    }
    const qtdStr = String(form.quantidade || "").trim();
    let quantidadeDisponivel = null;
    if (qtdStr !== "") {
      const n = parseInt(qtdStr, 10);
      if (Number.isNaN(n) || n < 0) {
        toastErro("Quantidade deve ser vazio (ilimitado) ou inteiro >= 0.");
        return;
      }
      quantidadeDisponivel = n;
    }

    const base = {
      id_rede: redeId,
      titulo: form.titulo.trim(),
      imagem_url: form.imagem_url.trim(),
      valor_moeda: valor,
      ativo: form.ativo,
      vigencia_inicio: vi,
      vigencia_fim: vf,
      quantidade_disponivel: quantidadeDisponivel
    };

    setSalvando(true);
    try {
      if (editandoId) {
        await editarPremioRede({ ...base, id: editandoId });
        toastSucesso("Premio atualizado.");
      } else {
        await criarPremioRede(base);
        toastSucesso("Premio criado.");
      }
      setForm({ ...estadoInicialPremio });
      setEditandoId(null);
      setMostrarForm(false);
      await carregarCatalogo();
    } catch (err) {
      toastErro(err.message || "Falha ao salvar premio.");
    } finally {
      setSalvando(false);
    }
  }

  async function onEntregar(r) {
    setAcaoId(r.id);
    try {
      await entregarPremioResgate(r.id, redeId);
      toastSucesso("Entrega registrada.");
      await carregarResgates();
    } catch (err) {
      toastErro(err.message || "Falha ao entregar.");
    } finally {
      setAcaoId(null);
    }
  }

  async function onCancelar(r) {
    const motivo = window.prompt("Motivo do cancelamento (opcional):") ?? "";
    setAcaoId(r.id);
    try {
      await cancelarPremioResgate(r.id, redeId, motivo);
      toastSucesso("Resgate cancelado e Luceninhas devolvidas.");
      await carregarResgates();
    } catch (err) {
      toastErro(err.message || "Falha ao cancelar.");
    } finally {
      setAcaoId(null);
    }
  }

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "premio",
        header: "Premio",
        cell: (info) => {
          const p = info.row.original;
          return (
            <div className="tabela-premio__titulo-linha">
              {p.imagem_url ? (
                <img src={p.imagem_url} alt="" className="tabela-logo-thumb" loading="lazy" />
              ) : (
                <span className="tabela-premio__sem-img">—</span>
              )}
              <span className="gp-cell-strong">{p.titulo}</span>
            </div>
          );
        }
      }),
      columnHelper.accessor("valor_moeda", {
        header: "Valor",
        cell: (info) => <span className="tabela-num">{info.getValue()}</span>
      }),
      columnHelper.accessor("ativo", {
        header: "Ativo",
        cell: (info) => (
          <Badge variant={info.getValue() ? "success" : "danger"}>
            {info.getValue() ? "Sim" : "Nao"}
          </Badge>
        )
      }),
      columnHelper.accessor("vigencia_inicio", {
        header: "Inicio",
        cell: (info) => formatarDataCurta(info.getValue())
      }),
      columnHelper.accessor("vigencia_fim", {
        header: "Fim",
        cell: (info) => (info.getValue() ? formatarDataCurta(info.getValue()) : "—")
      }),
      columnHelper.accessor("quantidade_disponivel", {
        header: "Qtd",
        cell: (info) => (
          <span className="tabela-num">{info.getValue() != null ? info.getValue() : "∞"}</span>
        )
      }),
      ...(podeEditarCatalogo
        ? [
            columnHelper.display({
              id: "acoes",
              header: "",
              cell: (info) => (
                <button type="button" className="tabela-btn" onClick={() => abrirEditar(info.row.original)}>
                  Editar
                </button>
              )
            })
          ]
        : [])
    ],
    [podeEditarCatalogo]
  );

  const resgateColumns = useMemo(
    () => [
      resgateHelper.display({
        id: "premio",
        header: "Premio",
        cell: (info) => {
          const r = info.row.original;
          return (
            <div className="tabela-premio__titulo-linha">
              {r.imagem_url_snapshot ? (
                <img src={r.imagem_url_snapshot} alt="" className="tabela-logo-thumb" loading="lazy" />
              ) : (
                <span className="tabela-premio__sem-img">—</span>
              )}
              <span className="gp-cell-strong">{r.titulo_snapshot}</span>
            </div>
          );
        }
      }),
      resgateHelper.accessor("cliente_nome_completo", {
        header: "Cliente",
        cell: (info) => info.getValue() || "—"
      }),
      resgateHelper.accessor("valor_moeda", {
        header: "Valor",
        cell: (info) => <span className="tabela-num">{info.getValue()}</span>
      }),
      resgateHelper.display({
        id: "status",
        header: "Status",
        cell: (info) => {
          const r = info.row.original;
          return <Badge variant={variantStatusResgate(r)}>{rotuloStatusResgate(r)}</Badge>;
        }
      }),
      resgateHelper.accessor("prazo_retirada_em", {
        header: "Prazo",
        cell: (info) => formatarDataCurta(info.getValue())
      }),
      resgateHelper.accessor("criado_em", {
        header: "Resgatado em",
        cell: (info) => formatarDataCurta(info.getValue())
      }),
      resgateHelper.display({
        id: "acoes",
        header: "",
        cell: (info) => {
          const r = info.row.original;
          if (r.status !== "AGUARDANDO_RETIRADA") return null;
          const busy = acaoId === r.id;
          return (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Button type="button" size="sm" disabled={busy} onClick={() => onEntregar(r)}>
                {busy ? "…" : "Entregar"}
              </Button>
              {podeCancelar ? (
                <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => onCancelar(r)}>
                  Cancelar
                </Button>
              ) : null}
            </div>
          );
        }
      })
    ],
    [acaoId, podeCancelar]
  );

  return (
    <>
      {!somenteResgates ? (
        <div className="gp-premios-tabs" role="tablist" aria-label="Secoes de premios">
          <button
            type="button"
            role="tab"
            aria-selected={aba === "catalogo"}
            className={`gp-premios-tabs__btn${aba === "catalogo" ? " gp-premios-tabs__btn--ativa" : ""}`}
            onClick={() => setAba("catalogo")}
          >
            Catalogo
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={aba === "resgatados"}
            className={`gp-premios-tabs__btn${aba === "resgatados" ? " gp-premios-tabs__btn--ativa" : ""}`}
            onClick={() => setAba("resgatados")}
          >
            Resgatados
          </button>
        </div>
      ) : null}

      {aba === "catalogo" && !somenteResgates ? (
        <>
          <p className="rede-detalhes__ajuda">
            Premios que o cliente pode resgatar trocando <strong>moeda virtual da rede</strong>. Defina custo em
            moeda, vigencia e estoque (vazio = ilimitado). Desative para ocultar sem apagar.
          </p>
          {podeEditarCatalogo ? (
            <div className="rede-detalhes__linha-titulo rede-detalhes__linha-titulo--fim">
              <Button type="button" variant="primary" icon={Plus} onClick={abrirNovo}>
                Novo premio
              </Button>
            </div>
          ) : null}

          <Modal
            open={mostrarForm}
            onClose={fecharModal}
            title={editandoId ? "Editar premio" : "Novo premio"}
            description="Datas em horario local; a API envia UTC (ISO8601). Imagem: URL https ou arquivo opcional."
            size="lg"
            footer={
              <ModalActions>
                <Button type="button" variant="outline" onClick={fecharModal} disabled={salvando}>
                  Cancelar
                </Button>
                <Button type="submit" form="form-premio-modal" variant="primary" disabled={salvando}>
                  {salvando ? "Salvando..." : editandoId ? "Salvar alteracoes" : "Criar premio"}
                </Button>
              </ModalActions>
            }
          >
            <form id="form-premio-modal" className="form-rede form-rede--equipe" onSubmit={onSubmit}>
              <div className="form-rede__grid">
                <CampoComAjuda rotulo="Titulo" dica="Nome do prêmio exibido ao cliente." span2>
                  <input
                    className="campo__input"
                    placeholder="Titulo do premio"
                    value={form.titulo}
                    onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
                  />
                </CampoComAjuda>
                <CampoComAjuda
                  rotulo="Imagem"
                  dica="Envie um arquivo (JPEG, PNG, GIF, WebP) ou cole uma URL https."
                  span2
                >
                  <CampoImagemUrl
                    span2
                    value={form.imagem_url}
                    onChange={(url) => setForm((p) => ({ ...p, imagem_url: url }))}
                  />
                </CampoComAjuda>
                <CampoComAjuda rotulo="Valor em moeda" dica="Quantidade de moeda virtual necessária para resgate.">
                  <input
                    className="campo__input"
                    placeholder="Valor em moeda da rede"
                    inputMode="decimal"
                    value={form.valor_moeda}
                    onChange={(e) => setForm((p) => ({ ...p, valor_moeda: e.target.value }))}
                  />
                </CampoComAjuda>
                <CampoComAjuda rotulo="Quantidade" dica="Vazio significa estoque ilimitado.">
                  <input
                    className="campo__input"
                    placeholder="Quantidade (vazio = ilimitada)"
                    inputMode="numeric"
                    value={form.quantidade}
                    onChange={(e) => setForm((p) => ({ ...p, quantidade: e.target.value }))}
                  />
                </CampoComAjuda>
                <label className="form-rede__checkbox-linha">
                  <input
                    type="checkbox"
                    checked={form.ativo}
                    onChange={(e) => setForm((p) => ({ ...p, ativo: e.target.checked }))}
                  />
                  Premio ativo (visivel para resgate quando dentro da vigencia)
                  <TooltipInfo texto="Se desmarcado, o prêmio não aparece para resgate no app." />
                </label>
                <CampoComAjuda rotulo="Inicio da vigencia" dica="Data/hora local em que o prêmio passa a valer.">
                  <input
                    className="campo__input"
                    type="datetime-local"
                    value={form.vigencia_inicio}
                    onChange={(e) => setForm((p) => ({ ...p, vigencia_inicio: e.target.value }))}
                    aria-label="Inicio da vigencia"
                  />
                </CampoComAjuda>
                <CampoComAjuda rotulo="Fim da vigencia" dica="Data/hora local em que o prêmio deixa de valer.">
                  <input
                    className="campo__input"
                    type="datetime-local"
                    value={form.sem_fim ? "" : form.vigencia_fim}
                    onChange={(e) => setForm((p) => ({ ...p, vigencia_fim: e.target.value }))}
                    disabled={form.sem_fim}
                    aria-label="Fim da vigencia"
                  />
                </CampoComAjuda>
                <label className="form-rede__checkbox-linha">
                  <input
                    type="checkbox"
                    checked={form.sem_fim}
                    onChange={(e) => setForm((p) => ({ ...p, sem_fim: e.target.checked }))}
                  />
                  Sem data fim de vigencia
                  <TooltipInfo texto="Ao marcar, o prêmio fica sem data limite final." />
                </label>
              </div>
            </form>
          </Modal>

          <DataTable
            columns={columns}
            data={premios}
            getRowId={(row) => row.id}
            loading={carregando}
            emptyMessage="Nenhum premio cadastrado."
          />
        </>
      ) : (
        <>
          <p className="rede-detalhes__ajuda">
            Resgates feitos no app. O cliente pode retirar em <strong>qualquer posto</strong> em até 2 dias úteis
            (aviso — não expira sozinho). Use <strong>Entregar</strong> ao entregar o prêmio.
          </p>
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            {[
              { v: "", l: "Todos" },
              { v: "AGUARDANDO_RETIRADA", l: "Aguardando" },
              { v: "ENTREGUE", l: "Entregues" },
              { v: "CANCELADO", l: "Cancelados" }
            ].map((f) => (
              <Button
                key={f.v || "all"}
                type="button"
                size="sm"
                variant={filtroStatus === f.v ? "primary" : "outline"}
                onClick={() => setFiltroStatus(f.v)}
              >
                {f.l}
              </Button>
            ))}
          </div>
          <DataTable
            columns={resgateColumns}
            data={resgates}
            getRowId={(row) => row.id}
            loading={carregandoResgates}
            emptyMessage="Nenhum resgate encontrado."
          />
        </>
      )}
    </>
  );
}

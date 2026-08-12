import { useEffect, useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { RefreshCw, Smartphone, Users, Wifi, Apple } from "lucide-react";
import Badge from "../../../componentes/ui/Badge";
import Button from "../../../componentes/ui/Button";
import Card from "../../../componentes/ui/Card";
import DataTable from "../../../componentes/ui/DataTable";
import FilterPopover from "../../../componentes/ui/FilterPopover";
import SearchInput from "../../../componentes/ui/SearchInput";
import StatCard from "../../../componentes/ui/StatCard";
import { listarPresencaAppClientes } from "../../../servicos/usuariosRedeServico";
import { toastErro } from "../../../servicos/toastServico";

const columnHelper = createColumnHelper();

function fmtDataHora(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("pt-BR");
  } catch {
    return "—";
  }
}

function platLabel(p) {
  const v = String(p || "").toLowerCase();
  if (v.includes("android")) return "android";
  if (v.includes("ios") || v.includes("iphone") || v.includes("ipad")) return "ios";
  return v || "";
}

const FILTROS_VAZIOS = {
  ativo: "todos",
  online: "todos",
  plataformas: [],
  niveis: []
};

export default function ClientActivitySection({ redeId }) {
  const [carregando, setCarregando] = useState(true);
  const [dados, setDados] = useState(null);
  const [tick, setTick] = useState(0);
  const [busca, setBusca] = useState("");
  const [filtrosDraft, setFiltrosDraft] = useState(FILTROS_VAZIOS);
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    if (!redeId) {
      setCarregando(false);
      setDados(null);
      return;
    }
    let cancelado = false;
    (async () => {
      setCarregando(true);
      try {
        const res = await listarPresencaAppClientes({ limite: 200, minutos_online: 15 });
        if (!cancelado) setDados(res);
      } catch (err) {
        if (!cancelado) {
          toastErro(err.message || "Falha ao carregar atividade no app.");
          setDados(null);
        }
      } finally {
        if (!cancelado) setCarregando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [redeId, tick]);

  const itens = dados?.itens || [];
  const minOn = Number(dados?.minutos_online ?? 15);
  const totalApi = Number(dados?.total_clientes ?? itens.length);

  const niveisDisponiveis = useMemo(() => {
    const set = new Set();
    itens.forEach((r) => {
      if (r.nivel_cliente) set.add(String(r.nivel_cliente));
    });
    return Array.from(set).sort();
  }, [itens]);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return itens.filter((row) => {
      if (filtros.ativo === "ativos" && !row.ativo) return false;
      if (filtros.ativo === "inativos" && row.ativo) return false;
      if (filtros.online === "online" && !row.provavelmente_online_agora) return false;
      if (filtros.online === "offline" && row.provavelmente_online_agora) return false;
      if (filtros.plataformas.length > 0) {
        const p = platLabel(row.ultimo_app_plataforma);
        if (!filtros.plataformas.includes(p)) return false;
      }
      if (filtros.niveis.length > 0) {
        if (!filtros.niveis.includes(String(row.nivel_cliente || ""))) return false;
      }
      if (!q) return true;
      const blob = [row.nome_completo, row.email, row.cpf, row.telefone]
        .map((x) => String(x || "").toLowerCase())
        .join(" ");
      return blob.includes(q);
    });
  }, [itens, busca, filtros]);

  useEffect(() => {
    setPage(1);
  }, [busca, filtros, pageSize]);

  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtrados.slice(start, start + pageSize);
  }, [filtrados, page, pageSize]);

  const onlineCount = filtrados.filter((r) => r.provavelmente_online_agora).length;
  const androidCount = filtrados.filter((r) => platLabel(r.ultimo_app_plataforma) === "android").length;
  const iosCount = filtrados.filter((r) => platLabel(r.ultimo_app_plataforma) === "ios").length;

  const activeFilterCount =
    (filtros.ativo !== "todos" ? 1 : 0) +
    (filtros.online !== "todos" ? 1 : 0) +
    filtros.plataformas.length +
    filtros.niveis.length;

  const columns = useMemo(
    () => [
      columnHelper.accessor("provavelmente_online_agora", {
        header: "Online?",
        cell: (info) =>
          info.getValue() ? <Badge variant="success">Sim</Badge> : <Badge variant="danger">Nao</Badge>
      }),
      columnHelper.accessor("nome_completo", {
        header: "Nome",
        cell: (info) => <span className="gp-cell-strong">{info.getValue() || "—"}</span>
      }),
      columnHelper.accessor("nivel_cliente", {
        header: "Nivel",
        cell: (info) => info.getValue() || "—"
      }),
      columnHelper.accessor("ultimo_app_plataforma", {
        header: "Plat.",
        cell: (info) => {
          const p = platLabel(info.getValue());
          if (p === "android") {
            return (
              <span className="gp-platform" title="Android">
                <Smartphone size={16} /> Android
              </span>
            );
          }
          if (p === "ios") {
            return (
              <span className="gp-platform" title="iOS">
                <Apple size={16} /> iOS
              </span>
            );
          }
          return info.getValue() || "—";
        }
      }),
      columnHelper.accessor("ativo", {
        header: "Ativo",
        cell: (info) =>
          info.getValue() ? <Badge variant="success">Sim</Badge> : <Badge variant="danger">Nao</Badge>
      })
    ],
    []
  );

  function itensExpandCliente(row) {
    return [
      { label: "E-mail", value: row.email || "—" },
      { label: "Telefone", value: row.telefone || "—" },
      { label: "CPF", value: row.cpf || "—" },
      { label: "Papel", value: "Cliente" },
      { label: "Nivel", value: row.nivel_cliente || "—" },
      { label: "Ultimo acesso no app", value: fmtDataHora(row.ultimo_app_acesso_em), wide: true },
      {
        label: "Plataforma",
        value:
          platLabel(row.ultimo_app_plataforma) === "android"
            ? "Android"
            : platLabel(row.ultimo_app_plataforma) === "ios"
              ? "iOS"
              : row.ultimo_app_plataforma || "—"
      },
      {
        label: "Online agora",
        value: row.provavelmente_online_agora ? "Sim" : "Nao"
      },
      { label: "Status", value: row.ativo ? "Ativo" : "Inativo" }
    ];
  }

  function toggleList(key, value) {
    setFiltrosDraft((prev) => {
      const list = prev[key];
      const next = list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
      return { ...prev, [key]: next };
    });
  }

  return (
    <Card className="gp-section-card" padding>
      <div className="gp-section-card__head">
        <div>
          <h3 className="gp-section-card__title">Atividade no app (clientes)</h3>
          <p className="gp-section-card__desc">
            Heartbeat ao abrir o app (sem WebSocket). “Provavelmente online” = último registro há até{" "}
            <strong>{minOn} min</strong>. Total na rede: <strong>{totalApi}</strong> clientes.
          </p>
        </div>
        <div className="gp-section-card__actions">
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={() => setTick((t) => t + 1)}
          >
            Atualizar
          </Button>
          <SearchInput
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar cliente, email ou CPF..."
          />
          <FilterPopover
            activeCount={activeFilterCount}
            onApply={() => setFiltros({ ...filtrosDraft })}
            onClear={() => {
              setFiltrosDraft(FILTROS_VAZIOS);
              setFiltros(FILTROS_VAZIOS);
            }}
          >
            <div className="gp-filter__group">
              <span className="gp-filter__group-title">Status</span>
              {["todos", "ativos", "inativos"].map((v) => (
                <label key={v} className="gp-filter__option">
                  <input
                    type="radio"
                    name="filtro-ativo"
                    checked={filtrosDraft.ativo === v}
                    onChange={() => setFiltrosDraft((p) => ({ ...p, ativo: v }))}
                  />
                  {v === "todos" ? "Todos" : v === "ativos" ? "Ativos" : "Inativos"}
                </label>
              ))}
            </div>
            <div className="gp-filter__group">
              <span className="gp-filter__group-title">Online</span>
              {["todos", "online", "offline"].map((v) => (
                <label key={v} className="gp-filter__option">
                  <input
                    type="radio"
                    name="filtro-online"
                    checked={filtrosDraft.online === v}
                    onChange={() => setFiltrosDraft((p) => ({ ...p, online: v }))}
                  />
                  {v === "todos" ? "Todos" : v === "online" ? "Online" : "Offline"}
                </label>
              ))}
            </div>
            <div className="gp-filter__group">
              <span className="gp-filter__group-title">Plataforma</span>
              {["android", "ios"].map((v) => (
                <label key={v} className="gp-filter__option">
                  <input
                    type="checkbox"
                    checked={filtrosDraft.plataformas.includes(v)}
                    onChange={() => toggleList("plataformas", v)}
                  />
                  {v === "android" ? "Android" : "iOS"}
                </label>
              ))}
            </div>
            {niveisDisponiveis.length > 0 ? (
              <div className="gp-filter__group">
                <span className="gp-filter__group-title">Nivel</span>
                {niveisDisponiveis.map((n) => (
                  <label key={n} className="gp-filter__option">
                    <input
                      type="checkbox"
                      checked={filtrosDraft.niveis.includes(n)}
                      onChange={() => toggleList("niveis", n)}
                    />
                    {n}
                  </label>
                ))}
              </div>
            ) : null}
          </FilterPopover>
        </div>
      </div>

      <div className="gp-stats-grid">
        <StatCard
          title="Total de clientes"
          value={filtrados.length}
          description="Apos filtros / busca"
          icon={Users}
        />
        <StatCard title="Online agora" value={onlineCount} description={`Ultimos ${minOn} min`} icon={Wifi} />
        <StatCard title="Android" value={androidCount} description="Ultima plataforma" icon={Smartphone} />
        <StatCard title="iOS" value={iosCount} description="Ultima plataforma" icon={Apple} />
      </div>

      <DataTable
        columns={columns}
        data={pageData}
        getRowId={(row) => row.id_usuario}
        loading={carregando}
        emptyMessage="Nenhum cliente encontrado."
        showExpandColumn
        getExpandedItems={itensExpandCliente}
        pagination={{
          page,
          pageSize,
          total: filtrados.length,
          onPageChange: setPage,
          onPageSizeChange: setPageSize,
          pageSizeOptions: [10, 25, 50, 100, 200]
        }}
      />
    </Card>
  );
}

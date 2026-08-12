import { useCallback, useEffect, useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { listarAuditoriaPlataforma } from "../../servicos/adminPlataformaServico";
import { toastErro } from "../../servicos/toastServico";
import DataTable from "../../componentes/ui/DataTable";

const LIMITE = 50;
const columnHelper = createColumnHelper();

function formatarDataHora(iso) {
  if (!iso) {
    return "—";
  }
  try {
    return new Date(iso).toLocaleString("pt-BR");
  } catch {
    return String(iso);
  }
}

function resumirJson(val) {
  if (val == null || val === "") {
    return "—";
  }
  let s;
  if (typeof val === "string") {
    s = val;
  } else {
    try {
      s = JSON.stringify(val);
    } catch {
      return "—";
    }
  }
  if (s.length > 160) {
    return `${s.slice(0, 160)}…`;
  }
  return s;
}

export default function SuperAdminAuditoriaSecao() {
  const [itens, setItens] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [filtroDraft, setFiltroDraft] = useState("");
  const [filtroRede, setFiltroRede] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setFiltroRede(filtroDraft.trim()), 400);
    return () => clearTimeout(t);
  }, [filtroDraft]);

  const carregar = useCallback(async (novoOffset, idRedeFiltro) => {
    setCarregando(true);
    try {
      const dados = await listarAuditoriaPlataforma({
        limite: LIMITE,
        offset: novoOffset,
        idRede: idRedeFiltro
      });
      setItens(dados.itens);
      setTotal(dados.total);
      setOffset(dados.offset);
    } catch (err) {
      toastErro(err.message || "Falha ao carregar auditoria.");
      setItens([]);
      setTotal(0);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar(0, filtroRede.trim());
  }, [carregar, filtroRede]);

  const page = Math.floor(offset / LIMITE) + 1;

  const columns = useMemo(
    () => [
      columnHelper.accessor("criado_em", {
        header: "Data",
        cell: (info) => (
          <span className="tabela-num" style={{ whiteSpace: "nowrap" }}>
            {formatarDataHora(info.getValue())}
          </span>
        )
      }),
      columnHelper.accessor("id_rede", {
        header: "Rede",
        cell: (info) => <span className="tabela-redes__sub">{info.getValue() || "—"}</span>
      }),
      columnHelper.accessor("tipo_evento", {
        header: "Evento",
        cell: (info) => <strong className="gp-cell-strong">{info.getValue() || "—"}</strong>
      }),
      columnHelper.display({
        id: "entidade",
        header: "Entidade",
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="tabela-celula--stack">
              <span className="gp-cell-strong">{row.tipo_entidade || "—"}</span>
              {row.id_entidade ? (
                <span className="tabela-redes__sub">ID {row.id_entidade}</span>
              ) : null}
            </div>
          );
        }
      }),
      columnHelper.accessor("id_usuario_ator", {
        header: "Ator",
        cell: (info) => <span className="tabela-redes__sub">{info.getValue() || "—"}</span>
      }),
      columnHelper.display({
        id: "detalhes",
        header: "Detalhes",
        cell: (info) => {
          const resumo = resumirJson(info.row.original.dados_novos);
          return (
            <span className="tabela-redes__sub" title={resumo}>
              Novo: {resumo}
            </span>
          );
        }
      })
    ],
    []
  );

  return (
    <div className="gestor-auditoria">
      <p className="rede-detalhes__ajuda" style={{ marginBottom: 16 }}>
        Trilha de auditoria em <strong>todas as redes</strong>. Opcional: filtrar por UUID da rede para isolar eventos.
      </p>

      <div className="form-rede__grid" style={{ marginBottom: 16, maxWidth: 640 }}>
        <input
          className="campo__input"
          placeholder="UUID da rede (opcional)"
          value={filtroDraft}
          onChange={(e) => setFiltroDraft(e.target.value)}
          aria-label="Filtrar por id da rede"
        />
      </div>

      <DataTable
        columns={columns}
        data={itens}
        getRowId={(row) => row.id}
        loading={carregando}
        emptyMessage="Nenhum evento de auditoria. Quando o sistema registrar acoes, elas aparecerao aqui."
        pagination={{
          page,
          pageSize: LIMITE,
          total,
          onPageChange: (p) => carregar((p - 1) * LIMITE, filtroRede.trim())
        }}
      />
    </div>
  );
}

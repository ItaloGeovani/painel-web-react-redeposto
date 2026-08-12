import { useCallback, useEffect, useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { listarAuditoriaGestor } from "../../servicos/gestorRedeRelatoriosAuditoriaServico";
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

function resumirPayload(row) {
  const p = row?.payload ?? row?.dados_novos;
  if (p == null || p === "") {
    if (row?.titulo) return row.titulo;
    return "—";
  }
  let obj = p;
  if (typeof p === "string") {
    try {
      obj = JSON.parse(p);
    } catch {
      return p.length > 160 ? `${p.slice(0, 160)}…` : p;
    }
  }
  if (typeof obj !== "object" || obj === null) {
    return String(obj);
  }
  const partes = [];
  if (obj.valor != null) partes.push(`R$ ${obj.valor}`);
  if (obj.quem) partes.push(String(obj.quem));
  if (obj.meio) partes.push(String(obj.meio));
  if (obj.status) partes.push(String(obj.status));
  if (obj.codigo) partes.push(`cód. ${obj.codigo}`);
  if (obj.titulo && !partes.length) partes.push(String(obj.titulo));
  if (obj.nome && !partes.includes(String(obj.nome))) partes.push(String(obj.nome));
  if (!partes.length && row?.titulo) return row.titulo;
  if (!partes.length) {
    try {
      const s = JSON.stringify(obj);
      return s.length > 160 ? `${s.slice(0, 160)}…` : s;
    } catch {
      return "—";
    }
  }
  return partes.join(" · ");
}

export default function GestorRedeAuditoriaSecao() {
  const [itens, setItens] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async (novoOffset) => {
    setCarregando(true);
    try {
      const dados = await listarAuditoriaGestor({ limite: LIMITE, offset: novoOffset });
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
    carregar(0);
  }, [carregar]);

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
      columnHelper.accessor("tipo_evento", {
        header: "Tipo",
        cell: (info) => <strong className="gp-cell-strong">{info.getValue() || "—"}</strong>
      }),
      columnHelper.display({
        id: "posto",
        header: "Posto",
        cell: (info) => {
          const row = info.row.original;
          return <span className="tabela-redes__sub">{row.posto_nome || "—"}</span>;
        }
      }),
      columnHelper.display({
        id: "resumo",
        header: "Resumo",
        cell: (info) => {
          const resumo = resumirPayload(info.row.original);
          return (
            <span className="tabela-redes__sub" title={resumo}>
              {resumo}
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
        Eventos operacionais da rede (voucher gerado/pago/baixa, campanhas). Quando o WhatsApp estiver
        configurado, os mesmos eventos podem ser avisados no grupo.
      </p>

      <DataTable
        columns={columns}
        data={itens}
        getRowId={(row) => row.id}
        loading={carregando}
        emptyMessage="Nenhum evento operacional ainda. Compras de voucher e campanhas passarão a aparecer aqui."
        pagination={{
          page,
          pageSize: LIMITE,
          total,
          onPageChange: (p) => carregar((p - 1) * LIMITE)
        }}
      />
    </div>
  );
}

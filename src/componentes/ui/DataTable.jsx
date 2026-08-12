import { Fragment, useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable
} from "@tanstack/react-table";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import Button from "./Button";

function ExpandToggle({ row }) {
  const aberto = row.getIsExpanded();
  return (
    <button
      type="button"
      className="gp-expand-btn"
      aria-expanded={aberto}
      aria-label={aberto ? "Recolher detalhes" : "Expandir detalhes"}
      onClick={(e) => {
        e.stopPropagation();
        row.toggleExpanded();
      }}
    >
      {aberto ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
    </button>
  );
}

function ExpandedItemsGrid({ items }) {
  if (!items?.length) return null;
  return (
    <div className="gp-expand-grid" role="region" aria-label="Detalhes">
      {items.map((item, index) => (
        <div
          key={`${item.label}-${index}`}
          className={`gp-expand-grid__item ${item.wide ? "gp-expand-grid__item--wide" : ""}`}
        >
          <span className="gp-expand-grid__label">{item.label}</span>
          <span className="gp-expand-grid__value">{item.value ?? "—"}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Tabela unificada do painel GasPass.
 *
 * Expand:
 * - showExpandColumn: adiciona coluna ▶ automaticamente
 * - getExpandedItems(row) => [{ label, value, wide? }] — grid de detalhes pronto
 * - renderExpandedRow(row) — conteúdo custom (tem prioridade sobre getExpandedItems)
 * - expanded / onExpandedChange — controle externo; se omitidos, estado interno
 */
export default function DataTable({
  columns,
  data = [],
  getRowId,
  loading = false,
  emptyMessage = "Nenhum registro encontrado.",
  pagination,
  renderExpandedRow,
  getExpandedItems,
  getRowCanExpand,
  showExpandColumn = false,
  expanded: expandedControlado,
  onExpandedChange,
  toolbar,
  dense = true,
  className = ""
}) {
  const [expandedInterno, setExpandedInterno] = useState({});
  const expandidoControlado = expandedControlado !== undefined;
  const expanded = expandidoControlado ? expandedControlado : expandedInterno;
  const setExpanded = expandidoControlado ? onExpandedChange : setExpandedInterno;

  const podeExpandir = Boolean(renderExpandedRow || getExpandedItems);
  const colunasFinais = useMemo(() => {
    if (!showExpandColumn || !podeExpandir) return columns;
    return [
      {
        id: "__expand",
        header: () => null,
        size: 44,
        cell: ({ row }) => (row.getCanExpand() ? <ExpandToggle row={row} /> : null)
      },
      ...columns
    ];
  }, [columns, showExpandColumn, podeExpandir]);

  const table = useReactTable({
    data,
    columns: colunasFinais,
    getRowId: getRowId ? (row) => String(getRowId(row)) : undefined,
    state: { expanded },
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: getRowCanExpand
      ? (row) => Boolean(getRowCanExpand(row.original))
      : podeExpandir
        ? () => true
        : undefined,
    manualPagination: Boolean(pagination)
  });

  const rows = table.getRowModel().rows;
  const colCount = colunasFinais.length;

  const page = pagination?.page ?? 1;
  const pageSize = pagination?.pageSize ?? (data.length || 10);
  const total = pagination?.total ?? data.length;
  const totalPages = Math.max(1, Math.ceil(total / (pageSize || 1)));
  const inicio = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const fim = total === 0 ? 0 : Math.min(page * pageSize, total);
  const pageSizeOptions = pagination?.pageSizeOptions || [10, 25, 50, 100, 200];

  function renderDetalhe(original) {
    if (renderExpandedRow) return renderExpandedRow(original);
    if (getExpandedItems) return <ExpandedItemsGrid items={getExpandedItems(original)} />;
    return null;
  }

  return (
    <div className={`gp-data-table ${dense ? "gp-data-table--dense" : ""} ${className}`.trim()}>
      {toolbar ? <div className="gp-data-table__toolbar">{toolbar}</div> : null}

      <div className="gp-data-table__wrap">
        <table className="gp-data-table__table">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              <tr className="gp-data-table__placeholder">
                <td colSpan={colCount}>Carregando...</td>
              </tr>
            ) : null}
            {!loading && rows.length === 0 ? (
              <tr className="gp-data-table__placeholder">
                <td colSpan={colCount}>{emptyMessage}</td>
              </tr>
            ) : null}
            {!loading
              ? rows.map((row) => (
                  <Fragment key={row.id}>
                    <tr
                      className={row.getIsExpanded() ? "gp-data-table__row--expanded" : undefined}
                      onClick={
                        podeExpandir && row.getCanExpand()
                          ? () => row.toggleExpanded()
                          : undefined
                      }
                      style={podeExpandir && row.getCanExpand() ? { cursor: "pointer" } : undefined}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          onClick={
                            cell.column.id === "acoes" || cell.column.id === "__expand"
                              ? (e) => e.stopPropagation()
                              : undefined
                          }
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                    {row.getIsExpanded() && podeExpandir ? (
                      <tr className="gp-data-table__expand-row">
                        <td colSpan={colCount}>
                          <div className="gp-data-table__expand-body">{renderDetalhe(row.original)}</div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))
              : null}
          </tbody>
        </table>
      </div>

      {pagination ? (
        <div className="gp-data-table__footer">
          <p className="gp-data-table__resumo">
            Exibindo {inicio} a {fim} de {total}
          </p>
          <div className="gp-data-table__pager">
            {pagination.onPageSizeChange ? (
              <label className="gp-data-table__pagesize">
                <span>Linhas</span>
                <select
                  value={pageSize}
                  onChange={(e) => pagination.onPageSizeChange(Number(e.target.value))}
                >
                  {pageSizeOptions.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => pagination.onPageChange?.(page - 1)}
              aria-label="Pagina anterior"
            >
              <ChevronLeft size={16} />
            </Button>
            <span className="gp-data-table__page-num">
              {page} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => pagination.onPageChange?.(page + 1)}
              aria-label="Proxima pagina"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

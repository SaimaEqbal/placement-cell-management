import * as React from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  type RowSelectionState,
  type Table as TableInstance,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Download, Search } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { DataTablePagination } from "./DataTablePagination";
import { DataTableViewOptions } from "./DataTableViewOptions";
import { exportToExcel } from "./export";

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /** Show the global search box. Defaults to true. */
  enableSearch?: boolean;
  searchPlaceholder?: string;
  /** Show the "Columns" visibility toggle. Defaults to true. */
  enableViewOptions?: boolean;
  /** Show the "Export to Excel" button. Defaults to false. */
  enableExport?: boolean;
  /** File name (no extension) for the Excel export. Defaults to "export". */
  exportFileName?: string;
  /** Extra toolbar content rendered on the right (e.g. a "Create" button). */
  toolbarActions?: React.ReactNode;
  /** Initial rows per page. Defaults to 10. */
  initialPageSize?: number;
  /** Message shown when there are no rows. Defaults to "No results.". */
  emptyMessage?: string;
  /** Escape hatch: receive the table instance (e.g. to read selected rows). */
  onTableReady?: (table: TableInstance<TData>) => void;
}

/**
 * Purpose: a reusable, headless-backed data table (TanStack Table + shadcn
 * <Table />) with global search, per-column sorting, column visibility,
 * pagination, optional row selection, and one-click Excel export. Pages supply
 * only `columns` + `data`; everything else is opt-in via props.
 *
 * Add a "select" column (a checkbox cell) to enable row selection, and use
 * DataTableColumnHeader in a column's `header` to make it sortable. Set
 * `meta.label` on a column for a nicer name in the export + column menu.
 */
export function DataTable<TData, TValue>({
  columns,
  data,
  enableSearch = true,
  searchPlaceholder = "Search...",
  enableViewOptions = true,
  enableExport = false,
  exportFileName = "export",
  toolbarActions,
  initialPageSize = 10,
  emptyMessage = "No results.",
  onTableReady,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, columnVisibility, rowSelection, globalFilter },
    initialState: { pagination: { pageSize: initialPageSize } },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  React.useEffect(() => {
    onTableReady?.(table);
    // Re-report only when the instance identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  const showToolbar = enableSearch || enableViewOptions || enableExport || !!toolbarActions;

  return (
    <div className="flex flex-col gap-4">
      {showToolbar && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {enableSearch && (
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={globalFilter}
                onChange={(event) => setGlobalFilter(event.target.value)}
                placeholder={searchPlaceholder}
                className="pl-9"
              />
            </div>
          )}
          <div className="flex items-center gap-2 sm:ml-auto">
            {toolbarActions}
            {enableViewOptions && <DataTableViewOptions table={table} />}
            {enableExport && (
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => exportToExcel(table, { fileName: exportFileName })}
                disabled={table.getFilteredRowModel().rows.length === 0}
              >
                <Download /> Export
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={cn(
                        header.column.columnDef.meta?.align === "right" && "text-right",
                        header.column.columnDef.meta?.align === "center" && "text-center",
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          cell.column.columnDef.meta?.align === "right" && "text-right",
                          cell.column.columnDef.meta?.align === "center" && "text-center",
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <DataTablePagination table={table} />
    </div>
  );
}
